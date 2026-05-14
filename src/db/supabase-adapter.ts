import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, desc, eq, sql, ilike, or } from "drizzle-orm";
import type { Listing, ListingFilters } from "@/lib/types";
import type {
  DbAdapter,
  DbUser,
  DbMessage,
  DbSavedSearch,
  DbReport,
  DbAuditLog,
  AdminKpis,
  ThreadWithLatest,
} from "./types";
import { slugify } from "@/lib/utils";
import { applyFilters, paginate } from "@/lib/filter";
import {
  users,
  listings,
  sessions,
  savedListings,
  messageThreads,
  messages,
  savedSearches,
  reports,
  adminAuditLog,
  type DbListing,
} from "./schema";

// Lazy client — defer connection until first query. Avoids hard-fail at module
// import time if DATABASE_URL is missing or wrong (which would crash `next build`).
let _client: ReturnType<typeof postgres> | null = null;
let _dbq: ReturnType<typeof drizzle> | null = null;

function client() {
  if (_client) return _client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required when DB_DRIVER=supabase. Set it in .env.local or Vercel env vars.");
  }
  _client = postgres(url, {
    prepare: false,         // required for Supabase pooler (PgBouncer transaction mode)
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return _client;
}

function getDbq(): ReturnType<typeof drizzle> {
  if (_dbq) return _dbq;
  _dbq = drizzle(client());
  return _dbq;
}

// Proxy so `dbq.select(...)` / `dbq.insert(...)` / `dbq.update(...)` / `dbq.delete(...)`
// each lazily resolve on first access — preserves the call-site ergonomics from before.
const dbq = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_t, prop) {
    const real = getDbq() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
}) as ReturnType<typeof drizzle>;

function rowToUser(r: typeof users.$inferSelect): DbUser {
  return {
    id: r.id,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    phone: r.phone,
    county: r.county,
    city: r.city,
    avatarUrl: r.avatarUrl,
    sellerType: r.sellerType as "Privatni" | "Trgovac",
    role: r.role as DbUser["role"],
    tier: r.tier as DbUser["tier"],
    bannedAt: r.bannedAt ? r.bannedAt.toISOString() : null,
    verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

function rowToAudit(r: typeof adminAuditLog.$inferSelect): DbAuditLog {
  return {
    id: r.id,
    actorId: r.actorId,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    metadata: (r.metadata ?? null) as Record<string, unknown> | null,
    createdAt: r.createdAt.toISOString(),
  };
}

async function logAudit(
  actorId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  metadata: Record<string, unknown> | null = null
) {
  await dbq.insert(adminAuditLog).values({ actorId, action, targetType, targetId, metadata });
}

function rowToListing(r: DbListing, sellerName: string, sellerPhone: string, sellerType: string): Listing {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    make: r.make,
    model: r.model,
    variant: r.variant ?? undefined,
    year: r.year,
    priceEur: r.priceEur,
    originalPriceEur: r.originalPriceEur ?? undefined,
    km: r.km,
    fuel: r.fuel as Listing["fuel"],
    transmission: r.transmission as Listing["transmission"],
    bodyType: r.bodyType as Listing["bodyType"],
    drive: r.drive as Listing["drive"],
    color: r.color as Listing["color"],
    condition: r.condition as Listing["condition"],
    engineCc: r.engineCc,
    powerKw: r.powerKw,
    doors: r.doors,
    seats: r.seats,
    vinMasked: r.vinMasked ?? undefined,
    accidentHistory: r.accidentHistory ?? undefined,
    serviceHistory: r.serviceHistory ?? undefined,
    importedFrom: r.importedFrom ?? undefined,
    firstRegistered: r.firstRegistered ?? undefined,
    registrationUntil: r.registrationUntil ?? undefined,
    city: r.city,
    county: r.county,
    description: r.description,
    features: (r.features ?? []) as string[],
    images: (r.images ?? []) as string[],
    sellerName,
    sellerType: sellerType as Listing["sellerType"],
    sellerPhone,
    views: r.views,
    phoneReveals: r.phoneReveals,
    featured: r.featured,
    boostedUntil: r.boostedUntil ? r.boostedUntil.toISOString() : undefined,
    createdAt: r.createdAt.toISOString(),
  };
}

export const supabaseAdapter: DbAdapter = {
  mode: "supabase",

  // -------- Users --------

  async getUserById(id) {
    const rows = await dbq.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? rowToUser(rows[0]) : null;
  },

  async getUserByEmail(email) {
    const rows = await dbq.select().from(users).where(eq(users.email, email)).limit(1);
    if (!rows[0]) return null;
    const u = rowToUser(rows[0]);
    return { ...u, passwordHash: rows[0].passwordHash };
  },

  async createUser(input) {
    const initialAdmin = process.env.INITIAL_ADMIN_EMAIL;
    const isAdmin = !!initialAdmin && input.email.toLowerCase() === initialAdmin.toLowerCase();
    const rows = await dbq
      .insert(users)
      .values({
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        county: input.county ?? null,
        city: input.city ?? null,
        sellerType: input.sellerType ?? "Privatni",
        role: isAdmin ? "admin" : "user",
      })
      .returning();
    if (!rows[0]) throw new Error("Korisnik nije kreiran");
    return rowToUser(rows[0]);
  },

  async updateUser(id, patch) {
    const rows = await dbq
      .update(users)
      .set({
        firstName: patch.firstName,
        lastName: patch.lastName,
        phone: patch.phone,
        county: patch.county,
        city: patch.city,
        avatarUrl: patch.avatarUrl,
      })
      .where(eq(users.id, id))
      .returning();
    if (!rows[0]) throw new Error("Korisnik ne postoji");
    return rowToUser(rows[0]);
  },

  // -------- Sessions --------

  async createSession(userId, ttlSeconds) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await dbq.insert(sessions).values({ token, userId, expiresAt });
    return { token, expiresAt: expiresAt.toISOString() };
  },

  async getSessionUser(token) {
    const rows = await dbq
      .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);
    if (!rows[0]) return null;
    if (rows[0].expiresAt.getTime() < Date.now()) {
      await dbq.delete(sessions).where(eq(sessions.token, token));
      return null;
    }
    return this.getUserById(rows[0].userId);
  },

  async deleteSession(token) {
    await dbq.delete(sessions).where(eq(sessions.token, token));
  },

  // -------- Listings --------

  async listListings(filters) {
    // Pull active listings + owner info, do filtering in JS so we share the exact
    // semantics from lib/filter.ts (slugify(make) match, q on title/desc, etc.).
    // 52 seed listings is well under any reasonable DB-side concern; if this grows
    // we move filtering into SQL with proper indexes (already declared in schema).
    const rows = await dbq
      .select({ l: listings, u: users })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.createdAt));

    const items: Listing[] = rows.map((r) =>
      rowToListing(
        r.l,
        r.u ? `${r.u.firstName} ${r.u.lastName}` : "",
        r.u?.phone ?? "",
        r.u?.sellerType ?? "Privatni"
      )
    );

    const filtered = applyFilters(items, filters);
    const page = filters.page ?? 1;
    const paged = paginate(filtered, page);
    return { items: paged.items, total: paged.total };
  },

  async getListingBySlug(slug) {
    const rows = await dbq
      .select({ l: listings, u: users })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .where(and(eq(listings.slug, slug), eq(listings.status, "active")))
      .limit(1);
    if (!rows[0]) return null;
    return rowToListing(
      rows[0].l,
      rows[0].u ? `${rows[0].u.firstName} ${rows[0].u.lastName}` : "",
      rows[0].u?.phone ?? "",
      rows[0].u?.sellerType ?? "Privatni"
    );
  },

  async getFeaturedListings(limit) {
    const rows = await dbq
      .select({ l: listings, u: users })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .where(and(eq(listings.status, "active"), eq(listings.featured, true)))
      .orderBy(desc(listings.createdAt))
      .limit(limit);
    return rows.map((r) =>
      rowToListing(
        r.l,
        r.u ? `${r.u.firstName} ${r.u.lastName}` : "",
        r.u?.phone ?? "",
        r.u?.sellerType ?? "Privatni"
      )
    );
  },

  async getRelatedListings(listing, limit) {
    const rows = await dbq
      .select({ l: listings, u: users })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .where(
        and(
          eq(listings.status, "active"),
          sql`${listings.id} <> ${listing.id}`,
          sql`(${listings.make} = ${listing.make} OR ${listings.bodyType} = ${listing.bodyType})`
        )
      )
      .orderBy(desc(listings.createdAt))
      .limit(limit);
    return rows.map((r) =>
      rowToListing(
        r.l,
        r.u ? `${r.u.firstName} ${r.u.lastName}` : "",
        r.u?.phone ?? "",
        r.u?.sellerType ?? "Privatni"
      )
    );
  },

  async getAllActiveSlugs() {
    const rows = await dbq
      .select({ slug: listings.slug, createdAt: listings.createdAt })
      .from(listings)
      .where(eq(listings.status, "active"));
    return rows.map((r) => ({ slug: r.slug, createdAt: r.createdAt.toISOString() }));
  },

  async getListingsByUser(userId) {
    const rows = await dbq
      .select({ l: listings, u: users })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .where(and(eq(listings.userId, userId), sql`${listings.status} <> 'deleted'`))
      .orderBy(desc(listings.createdAt));
    return rows.map((r) => ({
      ...rowToListing(
        r.l,
        r.u ? `${r.u.firstName} ${r.u.lastName}` : "",
        r.u?.phone ?? "",
        r.u?.sellerType ?? "Privatni"
      ),
      status: r.l.status,
    }));
  },

  async createListing(userId, input) {
    const owner = await this.getUserById(userId);
    if (!owner) throw new Error("Korisnik ne postoji");
    const countRow = await dbq.select({ c: sql<number>`count(*)::int` }).from(listings);
    const count = (countRow[0]?.c ?? 0) + 1;
    const slug = `${slugify(`${input.make}-${input.model}-${input.year}-${input.city}`)}-lst-${String(count).padStart(4, "0")}`;
    const title = `${input.make} ${input.model}${input.variant ? " " + input.variant : ""} · ${input.year}.`;
    const rows = await dbq
      .insert(listings)
      .values({
        userId,
        slug,
        title,
        make: input.make,
        model: input.model,
        variant: input.variant ?? null,
        year: input.year,
        priceEur: input.priceEur,
        originalPriceEur: input.originalPriceEur ?? null,
        km: input.km,
        fuel: input.fuel,
        transmission: input.transmission,
        bodyType: input.bodyType,
        drive: input.drive,
        color: input.color,
        condition: input.condition,
        engineCc: input.engineCc,
        powerKw: input.powerKw,
        doors: input.doors,
        seats: input.seats,
        vinMasked: input.vinMasked ?? null,
        accidentHistory: input.accidentHistory ?? null,
        serviceHistory: input.serviceHistory ?? null,
        importedFrom: input.importedFrom ?? null,
        firstRegistered: input.firstRegistered ?? null,
        registrationUntil: input.registrationUntil ?? null,
        city: input.city,
        county: input.county,
        description: input.description,
        features: input.features ?? [],
        images: input.images ?? [],
        status: "active",
      })
      .returning();
    if (!rows[0]) throw new Error("Oglas nije kreiran");
    return rowToListing(rows[0], `${owner.firstName} ${owner.lastName}`, owner.phone ?? "", owner.sellerType);
  },

  async updateListing(id, userId, patch) {
    const existing = await dbq
      .select()
      .from(listings)
      .where(and(eq(listings.id, id), eq(listings.userId, userId)))
      .limit(1);
    if (!existing[0]) throw new Error("Oglas nije pronađen");

    // Only allow patching whitelisted Listing fields, never id/slug/userId/createdAt
    const allowed: Partial<typeof listings.$inferInsert> = {
      title: patch.title,
      make: patch.make,
      model: patch.model,
      variant: patch.variant ?? null,
      year: patch.year,
      priceEur: patch.priceEur,
      originalPriceEur: patch.originalPriceEur ?? null,
      km: patch.km,
      fuel: patch.fuel,
      transmission: patch.transmission,
      bodyType: patch.bodyType,
      drive: patch.drive,
      color: patch.color,
      condition: patch.condition,
      engineCc: patch.engineCc,
      powerKw: patch.powerKw,
      doors: patch.doors,
      seats: patch.seats,
      vinMasked: patch.vinMasked ?? null,
      accidentHistory: patch.accidentHistory ?? null,
      serviceHistory: patch.serviceHistory ?? null,
      importedFrom: patch.importedFrom ?? null,
      firstRegistered: patch.firstRegistered ?? null,
      registrationUntil: patch.registrationUntil ?? null,
      city: patch.city,
      county: patch.county,
      description: patch.description,
      features: patch.features,
      images: patch.images,
      featured: patch.featured,
      updatedAt: new Date(),
    };
    Object.keys(allowed).forEach((k) => {
      // @ts-expect-error key sweep
      if (allowed[k] === undefined) delete allowed[k];
    });

    const rows = await dbq.update(listings).set(allowed).where(eq(listings.id, id)).returning();
    const owner = await this.getUserById(userId);
    return rowToListing(
      rows[0],
      owner ? `${owner.firstName} ${owner.lastName}` : "",
      owner?.phone ?? "",
      owner?.sellerType ?? "Privatni"
    );
  },

  async setListingStatus(id, userId, status) {
    const res = await dbq
      .update(listings)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(listings.id, id), eq(listings.userId, userId)))
      .returning({ id: listings.id });
    if (!res[0]) throw new Error("Oglas nije pronađen");
  },

  async incrementViews(id) {
    await dbq
      .update(listings)
      .set({ views: sql`${listings.views} + 1` })
      .where(eq(listings.id, id));
  },

  // -------- Saved --------

  async toggleSaved(userId, listingId) {
    const existing = await dbq
      .select()
      .from(savedListings)
      .where(and(eq(savedListings.userId, userId), eq(savedListings.listingId, listingId)))
      .limit(1);
    if (existing[0]) {
      await dbq
        .delete(savedListings)
        .where(and(eq(savedListings.userId, userId), eq(savedListings.listingId, listingId)));
      return { saved: false };
    }
    await dbq.insert(savedListings).values({ userId, listingId });
    return { saved: true };
  },

  async getSavedListings(userId) {
    const rows = await dbq
      .select({ l: listings, u: users })
      .from(savedListings)
      .innerJoin(listings, eq(listings.id, savedListings.listingId))
      .leftJoin(users, eq(users.id, listings.userId))
      .where(and(eq(savedListings.userId, userId), eq(listings.status, "active")))
      .orderBy(desc(savedListings.createdAt));
    return rows.map((r) =>
      rowToListing(
        r.l,
        r.u ? `${r.u.firstName} ${r.u.lastName}` : "",
        r.u?.phone ?? "",
        r.u?.sellerType ?? "Privatni"
      )
    );
  },

  // -------- Messages --------

  async listThreads(userId) {
    const threadRows = await dbq
      .select()
      .from(messageThreads)
      .where(sql`${messageThreads.buyerId} = ${userId} OR ${messageThreads.sellerId} = ${userId}`)
      .orderBy(desc(messageThreads.lastMessageAt));

    const out: ThreadWithLatest[] = [];
    for (const t of threadRows) {
      const listingRow = await dbq
        .select({ l: listings, u: users })
        .from(listings)
        .leftJoin(users, eq(users.id, listings.userId))
        .where(eq(listings.id, t.listingId))
        .limit(1);
      if (!listingRow[0]) continue;

      const otherId = t.buyerId === userId ? t.sellerId : t.buyerId;
      const otherRows = await dbq.select().from(users).where(eq(users.id, otherId)).limit(1);
      if (!otherRows[0]) continue;
      const other = rowToUser(otherRows[0]);

      const msgRows = await dbq
        .select()
        .from(messages)
        .where(eq(messages.threadId, t.id))
        .orderBy(desc(messages.createdAt));

      const unread = msgRows.filter((m) => m.fromUserId !== userId && !m.readAt).length;
      const last = msgRows[0];

      out.push({
        id: t.id,
        listingId: t.listingId,
        buyerId: t.buyerId,
        sellerId: t.sellerId,
        lastMessageAt: t.lastMessageAt.toISOString(),
        createdAt: t.createdAt.toISOString(),
        listing: rowToListing(
          listingRow[0].l,
          listingRow[0].u ? `${listingRow[0].u.firstName} ${listingRow[0].u.lastName}` : "",
          listingRow[0].u?.phone ?? "",
          listingRow[0].u?.sellerType ?? "Privatni"
        ),
        other: {
          id: other.id,
          firstName: other.firstName,
          lastName: other.lastName,
          avatarUrl: other.avatarUrl,
        },
        unreadCount: unread,
        lastMessage: last
          ? {
              id: last.id,
              threadId: last.threadId,
              fromUserId: last.fromUserId,
              body: last.body,
              readAt: last.readAt ? last.readAt.toISOString() : null,
              createdAt: last.createdAt.toISOString(),
            }
          : null,
      });
    }
    return out;
  },

  async getThreadMessages(threadId, userId) {
    const thread = await dbq
      .select()
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);
    if (!thread[0]) return [];
    if (thread[0].buyerId !== userId && thread[0].sellerId !== userId) return [];
    const rows = await dbq
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
    return rows.map<DbMessage>((m) => ({
      id: m.id,
      threadId: m.threadId,
      fromUserId: m.fromUserId,
      body: m.body,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    }));
  },

  async sendMessage({ fromUserId, listingId, body, toUserId }) {
    const listingRow = await dbq.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listingRow[0]) throw new Error("Oglas ne postoji");
    const sellerId = listingRow[0].userId;
    const buyerId = fromUserId === sellerId ? (toUserId ?? sellerId) : fromUserId;

    let threadRow = await dbq
      .select()
      .from(messageThreads)
      .where(
        and(
          eq(messageThreads.listingId, listingId),
          eq(messageThreads.buyerId, buyerId),
          eq(messageThreads.sellerId, sellerId)
        )
      )
      .limit(1);

    let threadId: string;
    const now = new Date();
    if (!threadRow[0]) {
      const created = await dbq
        .insert(messageThreads)
        .values({ listingId, buyerId, sellerId, lastMessageAt: now })
        .returning();
      threadId = created[0].id;
    } else {
      threadId = threadRow[0].id;
      await dbq
        .update(messageThreads)
        .set({ lastMessageAt: now })
        .where(eq(messageThreads.id, threadId));
    }

    const msgRow = await dbq
      .insert(messages)
      .values({ threadId, fromUserId, body })
      .returning();
    const m = msgRow[0];
    return {
      id: m.id,
      threadId: m.threadId,
      fromUserId: m.fromUserId,
      body: m.body,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    };
  },

  async markThreadRead(threadId, userId) {
    const thread = await dbq
      .select()
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);
    if (!thread[0]) return;
    if (thread[0].buyerId !== userId && thread[0].sellerId !== userId) return;
    await dbq
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.threadId, threadId),
          sql`${messages.fromUserId} <> ${userId}`,
          sql`${messages.readAt} IS NULL`
        )
      );
  },

  async listSavedSearches(userId) {
    const rows = await dbq
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, userId))
      .orderBy(desc(savedSearches.createdAt));
    return rows.map<DbSavedSearch>((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      filterJson: (r.filterJson ?? {}) as Record<string, unknown>,
      notifyEmail: r.notifyEmail,
      lastSeenCount: r.lastSeenCount,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async createSavedSearch(userId, input) {
    const rows = await dbq
      .insert(savedSearches)
      .values({
        userId,
        name: input.name,
        filterJson: input.filterJson,
        notifyEmail: input.notifyEmail ?? false,
      })
      .returning();
    const r = rows[0];
    return {
      id: r.id,
      userId: r.userId,
      name: r.name,
      filterJson: (r.filterJson ?? {}) as Record<string, unknown>,
      notifyEmail: r.notifyEmail,
      lastSeenCount: r.lastSeenCount,
      createdAt: r.createdAt.toISOString(),
    };
  },

  async deleteSavedSearch(userId, id) {
    await dbq
      .delete(savedSearches)
      .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)));
  },

  async createReport(input) {
    const rows = await dbq
      .insert(reports)
      .values({
        listingId: input.listingId,
        reporterId: input.reporterId,
        reason: input.reason,
        body: input.body,
      })
      .returning();
    const r = rows[0];
    return {
      id: r.id,
      listingId: r.listingId,
      reporterId: r.reporterId,
      reason: r.reason as DbReport["reason"],
      body: r.body,
      status: r.status as DbReport["status"],
      resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
      resolvedBy: r.resolvedBy,
      createdAt: r.createdAt.toISOString(),
    };
  },

  async listReports(filters) {
    const rows = await dbq
      .select({ r: reports, l: listings })
      .from(reports)
      .leftJoin(listings, eq(listings.id, reports.listingId))
      .where(filters?.status ? eq(reports.status, filters.status) : sql`true`)
      .orderBy(desc(reports.createdAt));
    return rows.map((row) => ({
      id: row.r.id,
      listingId: row.r.listingId,
      reporterId: row.r.reporterId,
      reason: row.r.reason as DbReport["reason"],
      body: row.r.body,
      status: row.r.status as DbReport["status"],
      resolvedAt: row.r.resolvedAt ? row.r.resolvedAt.toISOString() : null,
      resolvedBy: row.r.resolvedBy,
      createdAt: row.r.createdAt.toISOString(),
      listingSlug: row.l?.slug ?? "",
      listingTitle: row.l?.title ?? "",
    }));
  },

  async resolveReport(id, actorId, action) {
    await dbq
      .update(reports)
      .set({ status: action, resolvedAt: new Date(), resolvedBy: actorId })
      .where(eq(reports.id, id));
    await logAudit(actorId, `report.${action}`, "report", id);
  },

  async adminListUsers(filters) {
    let q = dbq.select().from(users).$dynamic();
    const conds = [];
    if (filters?.role) conds.push(eq(users.role, filters.role));
    if (filters?.q) {
      conds.push(
        or(
          ilike(users.email, `%${filters.q}%`),
          ilike(users.firstName, `%${filters.q}%`),
          ilike(users.lastName, `%${filters.q}%`)
        )!
      );
    }
    if (conds.length > 0) q = q.where(and(...conds));
    const rows = await q.orderBy(desc(users.createdAt));
    return rows.map(rowToUser);
  },

  async adminListListings(filters) {
    let q = dbq
      .select({ l: listings, u: users })
      .from(listings)
      .leftJoin(users, eq(users.id, listings.userId))
      .$dynamic();
    const conds = [];
    if (filters?.status) conds.push(eq(listings.status, filters.status));
    if (filters?.q) {
      conds.push(
        or(
          ilike(listings.title, `%${filters.q}%`),
          ilike(listings.make, `%${filters.q}%`),
          ilike(listings.model, `%${filters.q}%`)
        )!
      );
    }
    if (conds.length > 0) q = q.where(and(...conds));
    const rows = await q.orderBy(desc(listings.createdAt));
    return rows.map((r) => ({
      ...rowToListing(
        r.l,
        r.u ? `${r.u.firstName} ${r.u.lastName}` : "",
        r.u?.phone ?? "",
        r.u?.sellerType ?? "Privatni"
      ),
      status: r.l.status,
      ownerEmail: r.u?.email ?? "",
    }));
  },

  async adminGetKpis() {
    const [totalUsersRow] = await dbq
      .select({ c: sql<number>`count(*)::int` })
      .from(users);
    const [bannedRow] = await dbq
      .select({ c: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.bannedAt} IS NOT NULL`);
    const [totalListingsRow] = await dbq
      .select({ c: sql<number>`count(*)::int` })
      .from(listings);
    const [activeRow] = await dbq
      .select({ c: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.status, "active"));
    const [featuredRow] = await dbq
      .select({ c: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.featured, true));
    const [pendingRow] = await dbq
      .select({ c: sql<number>`count(*)::int` })
      .from(reports)
      .where(eq(reports.status, "open"));
    const kpis: AdminKpis = {
      totalUsers: totalUsersRow?.c ?? 0,
      bannedUsers: bannedRow?.c ?? 0,
      totalListings: totalListingsRow?.c ?? 0,
      activeListings: activeRow?.c ?? 0,
      featuredListings: featuredRow?.c ?? 0,
      pendingReports: pendingRow?.c ?? 0,
    };
    return kpis;
  },

  async adminSetUserRole(targetId, actorId, role) {
    await dbq.update(users).set({ role }).where(eq(users.id, targetId));
    await logAudit(actorId, "user.elevate", "user", targetId, { role });
  },

  async adminBanUser(targetId, actorId, banned) {
    await dbq
      .update(users)
      .set({ bannedAt: banned ? new Date() : null })
      .where(eq(users.id, targetId));
    await logAudit(actorId, banned ? "user.ban" : "user.unban", "user", targetId);
  },

  async adminDeleteListing(listingId, actorId) {
    await dbq
      .update(listings)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(eq(listings.id, listingId));
    await logAudit(actorId, "listing.delete", "listing", listingId);
  },

  async adminSetFeatured(listingId, actorId, featured) {
    await dbq
      .update(listings)
      .set({ featured, updatedAt: new Date() })
      .where(eq(listings.id, listingId));
    await logAudit(actorId, featured ? "listing.feature" : "listing.unfeature", "listing", listingId);
  },

  async adminListAudit(limit = 100) {
    const rows = await dbq
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit);
    return rows.map(rowToAudit);
  },
};
