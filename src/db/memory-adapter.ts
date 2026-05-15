import type { Listing, ListingFilters } from "@/lib/types";
import type {
  DbAdapter,
  DbUser,
  DbMessage,
  DbThread,
  DbSavedSearch,
  DbReport,
  DbAuditLog,
  AdminKpis,
  ThreadWithLatest,
} from "./types";
import { LISTINGS } from "@/data/listings";
import { applyFilters, paginate } from "@/lib/filter";
import { slugify } from "@/lib/utils";

type Stored = Listing & { ownerId: string; status: string };

const g = globalThis as unknown as {
  __autiMem?: {
    users: Map<string, DbUser & { passwordHash: string | null }>;
    emailIdx: Map<string, string>;
    sessions: Map<string, { userId: string; expiresAt: number }>;
    listings: Map<string, Stored>;
    slugIdx: Map<string, string>;
    saved: Map<string, Set<string>>; // userId -> Set<listingId>
    threads: Map<string, DbThread>;
    messages: DbMessage[];
    savedSearches: Map<string, DbSavedSearch>;
    reports: Map<string, DbReport>;
    audit: DbAuditLog[];
  };
};

function store() {
  if (!g.__autiMem) {
    const users = new Map<string, DbUser & { passwordHash: string | null }>();
    const emailIdx = new Map<string, string>();
    const listings = new Map<string, Stored>();
    const slugIdx = new Map<string, string>();

    // Seed default demo user that owns all seed listings
    const demoUser: DbUser & { passwordHash: string | null } = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@auti.hr",
      passwordHash: null,
      firstName: "Ivan",
      lastName: "Horvat",
      phone: "+385 91 234 5678",
      county: "Grad Zagreb",
      city: "Zagreb",
      avatarUrl: null,
      sellerType: "Privatni",
      role: "user",
      tier: "free",
      bannedAt: null,
      verifiedAt: null,
      createdAt: new Date().toISOString(),
    };
    users.set(demoUser.id, demoUser);
    emailIdx.set(demoUser.email, demoUser.id);

    // Seed default demo admin so /admin is reachable in dev without signup
    const adminUser: DbUser & { passwordHash: string | null } = {
      id: "00000000-0000-0000-0000-0000000000ad",
      email: "admin@auti.hr",
      passwordHash: null,
      firstName: "Admin",
      lastName: "Auti",
      phone: null,
      county: "Grad Zagreb",
      city: "Zagreb",
      avatarUrl: null,
      sellerType: "Privatni",
      role: "admin",
      tier: "premium-dealer",
      bannedAt: null,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    users.set(adminUser.id, adminUser);
    emailIdx.set(adminUser.email, adminUser.id);

    // Seed listings owned by demo user
    LISTINGS.forEach((l) => {
      const stored: Stored = { ...l, category: l.category ?? "auto", ownerId: demoUser.id, status: "active" };
      listings.set(l.id, stored);
      slugIdx.set(l.slug, l.id);
    });

    g.__autiMem = {
      users,
      emailIdx,
      sessions: new Map(),
      listings,
      slugIdx,
      saved: new Map(),
      threads: new Map(),
      messages: [],
      savedSearches: new Map(),
      reports: new Map(),
      audit: [],
    };
  }
  return g.__autiMem!;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function stripOwner(s: Stored): Listing {
  // Strip the internal fields and pass through everything in the Listing shape
  const { ownerId: _o, status: _s, ...rest } = s;
  return rest as Listing;
}

export const memoryAdapter: DbAdapter = {
  mode: "memory",

  async getUserById(id) {
    const u = store().users.get(id);
    if (!u) return null;
    const { passwordHash: _p, ...rest } = u;
    return rest;
  },

  async getUserByEmail(email) {
    const id = store().emailIdx.get(email.toLowerCase());
    if (!id) return null;
    return store().users.get(id) ?? null;
  },

  async createUser(input) {
    const s = store();
    const emailKey = input.email.toLowerCase();
    if (s.emailIdx.has(emailKey)) throw new Error("Email već postoji");
    const id = uuid();
    const initialAdmin = process.env.INITIAL_ADMIN_EMAIL;
    const isAdmin = initialAdmin && emailKey === initialAdmin.toLowerCase();
    const user: DbUser & { passwordHash: string | null } = {
      id,
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      county: input.county ?? null,
      city: input.city ?? null,
      avatarUrl: null,
      sellerType: (input.sellerType ?? "Privatni") as "Privatni" | "Trgovac",
      role: isAdmin ? "admin" : "user",
      tier: "free",
      bannedAt: null,
      verifiedAt: null,
      createdAt: new Date().toISOString(),
    };
    s.users.set(id, user);
    s.emailIdx.set(emailKey, id);
    const { passwordHash: _p, ...rest } = user;
    return rest;
  },

  async updateUser(id, patch) {
    const s = store();
    const u = s.users.get(id);
    if (!u) throw new Error("Korisnik ne postoji");
    Object.assign(u, patch);
    s.users.set(id, u);
    const { passwordHash: _p, ...rest } = u;
    return rest;
  },

  async createSession(userId, ttlSeconds) {
    const token = uuid().replace(/-/g, "");
    const expiresAt = Date.now() + ttlSeconds * 1000;
    store().sessions.set(token, { userId, expiresAt });
    return { token, expiresAt: new Date(expiresAt).toISOString() };
  },

  async getSessionUser(token) {
    const s = store();
    const sess = s.sessions.get(token);
    if (!sess) return null;
    if (sess.expiresAt < Date.now()) {
      s.sessions.delete(token);
      return null;
    }
    return this.getUserById(sess.userId);
  },

  async deleteSession(token) {
    store().sessions.delete(token);
  },

  async listListings(filters) {
    const s = store();
    const active = [...s.listings.values()].filter((l) => l.status === "active").map(stripOwner);
    const filtered = applyFilters(active, filters);
    const page = filters.page ?? 1;
    const paged = paginate(filtered, page);
    return { items: paged.items, total: paged.total };
  },

  async getListingBySlug(slug) {
    const s = store();
    const id = s.slugIdx.get(slug);
    if (!id) return null;
    const l = s.listings.get(id);
    if (!l || l.status !== "active") return null;
    return stripOwner(l);
  },

  async getFeaturedListings(limit) {
    return [...store().listings.values()]
      .filter((l) => l.status === "active" && l.featured)
      .slice(0, limit)
      .map(stripOwner);
  },

  async getRelatedListings(listing, limit) {
    return [...store().listings.values()]
      .filter(
        (l) =>
          l.status === "active" &&
          l.id !== listing.id &&
          (l.make === listing.make || l.bodyType === listing.bodyType)
      )
      .slice(0, limit)
      .map(stripOwner);
  },

  async getAllActiveSlugs() {
    return [...store().listings.values()]
      .filter((l) => l.status === "active")
      .map((l) => ({ slug: l.slug, createdAt: l.createdAt }));
  },

  async getListingsByUser(userId) {
    const s = store();
    const u = s.users.get(userId);
    return [...s.listings.values()]
      .filter((l) => l.ownerId === userId && l.status !== "deleted")
      .map((l) => ({ ...stripOwner(l), status: l.status, sellerName: u ? `${u.firstName} ${u.lastName}` : l.sellerName }));
  },

  async createListing(userId, input) {
    const s = store();
    const u = s.users.get(userId);
    if (!u) throw new Error("Korisnik ne postoji");
    const id = uuid();
    const count = s.listings.size + 1;
    const slug = `${slugify(`${input.make}-${input.model}-${input.year}-${input.city}`)}-lst-${String(count).padStart(4, "0")}`;
    const now = new Date().toISOString();
    const stored: Stored = {
      ...input,
      id,
      slug,
      title: `${input.make} ${input.model}${input.variant ? " " + input.variant : ""} · ${input.year}.`,
      sellerName: `${u.firstName} ${u.lastName}`,
      sellerType: u.sellerType,
      sellerPhone: u.phone ?? "",
      views: 0,
      featured: false,
      createdAt: now,
      ownerId: userId,
      status: "active",
    };
    s.listings.set(id, stored);
    s.slugIdx.set(slug, id);
    return stripOwner(stored);
  },

  async updateListing(id, userId, patch) {
    const s = store();
    const l = s.listings.get(id);
    if (!l || l.ownerId !== userId) throw new Error("Oglas nije pronađen");
    Object.assign(l, patch);
    s.listings.set(id, l);
    return stripOwner(l);
  },

  async setListingStatus(id, userId, status) {
    const s = store();
    const l = s.listings.get(id);
    if (!l || l.ownerId !== userId) throw new Error("Oglas nije pronađen");
    l.status = status;
    s.listings.set(id, l);
  },

  async incrementViews(id) {
    const s = store();
    const l = s.listings.get(id);
    if (l) l.views++;
  },

  async toggleSaved(userId, listingId) {
    const s = store();
    if (!s.saved.has(userId)) s.saved.set(userId, new Set());
    const set = s.saved.get(userId)!;
    if (set.has(listingId)) {
      set.delete(listingId);
      return { saved: false };
    }
    set.add(listingId);
    return { saved: true };
  },

  async getSavedListings(userId) {
    const s = store();
    const ids = s.saved.get(userId);
    if (!ids) return [];
    return [...ids].map((id) => s.listings.get(id)).filter(Boolean).map((l) => stripOwner(l as Stored));
  },

  async listThreads(userId) {
    const s = store();
    const out: ThreadWithLatest[] = [];
    for (const t of s.threads.values()) {
      if (t.buyerId !== userId && t.sellerId !== userId) continue;
      const listing = s.listings.get(t.listingId);
      if (!listing) continue;
      const otherId = t.buyerId === userId ? t.sellerId : t.buyerId;
      const other = s.users.get(otherId);
      if (!other) continue;
      const msgs = s.messages.filter((m) => m.threadId === t.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const unread = msgs.filter((m) => m.fromUserId !== userId && !m.readAt).length;
      out.push({
        ...t,
        listing: stripOwner(listing),
        other: { id: other.id, firstName: other.firstName, lastName: other.lastName, avatarUrl: other.avatarUrl },
        unreadCount: unread,
        lastMessage: msgs[0] ?? null,
      });
    }
    return out.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  },

  async getThreadMessages(threadId, userId) {
    const s = store();
    const t = s.threads.get(threadId);
    if (!t || (t.buyerId !== userId && t.sellerId !== userId)) return [];
    return s.messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async sendMessage({ fromUserId, listingId, body, toUserId }) {
    const s = store();
    const listing = s.listings.get(listingId);
    if (!listing) throw new Error("Oglas ne postoji");
    const sellerId = listing.ownerId;
    const buyerId = fromUserId === sellerId ? (toUserId ?? sellerId) : fromUserId;
    const actualSellerId = sellerId;

    let thread = [...s.threads.values()].find(
      (t) => t.listingId === listingId && t.buyerId === buyerId && t.sellerId === actualSellerId
    );

    const now = new Date().toISOString();
    if (!thread) {
      thread = {
        id: uuid(),
        listingId,
        buyerId,
        sellerId: actualSellerId,
        lastMessageAt: now,
        createdAt: now,
      };
      s.threads.set(thread.id, thread);
    } else {
      thread.lastMessageAt = now;
      s.threads.set(thread.id, thread);
    }

    const msg: DbMessage = {
      id: uuid(),
      threadId: thread.id,
      fromUserId,
      body,
      readAt: null,
      createdAt: now,
    };
    s.messages.push(msg);
    return msg;
  },

  async markThreadRead(threadId, userId) {
    const s = store();
    const t = s.threads.get(threadId);
    if (!t || (t.buyerId !== userId && t.sellerId !== userId)) return;
    const now = new Date().toISOString();
    s.messages.forEach((m) => {
      if (m.threadId === threadId && m.fromUserId !== userId && !m.readAt) m.readAt = now;
    });
  },

  async listSavedSearches(userId) {
    const s = store();
    return [...s.savedSearches.values()]
      .filter((q) => q.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createSavedSearch(userId, input) {
    const s = store();
    const id = uuid();
    const rec: DbSavedSearch = {
      id,
      userId,
      name: input.name,
      filterJson: input.filterJson,
      notifyEmail: input.notifyEmail ?? false,
      lastSeenCount: 0,
      createdAt: new Date().toISOString(),
    };
    s.savedSearches.set(id, rec);
    return rec;
  },

  async deleteSavedSearch(userId, id) {
    const s = store();
    const q = s.savedSearches.get(id);
    if (!q || q.userId !== userId) return;
    s.savedSearches.delete(id);
  },

  async createReport(input) {
    const s = store();
    if (!s.listings.has(input.listingId)) throw new Error("Oglas ne postoji");
    const id = uuid();
    const rec: DbReport = {
      id,
      listingId: input.listingId,
      reporterId: input.reporterId,
      reason: input.reason,
      body: input.body,
      status: "open",
      resolvedAt: null,
      resolvedBy: null,
      createdAt: new Date().toISOString(),
    };
    s.reports.set(id, rec);
    return rec;
  },

  async listReports(filters) {
    const s = store();
    const all = [...s.reports.values()]
      .filter((r) => !filters?.status || r.status === filters.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all.map((r) => {
      const l = s.listings.get(r.listingId);
      return {
        ...r,
        listingSlug: l?.slug ?? "",
        listingTitle: l?.title ?? "",
      };
    });
  },

  async resolveReport(id, actorId, action) {
    const s = store();
    const r = s.reports.get(id);
    if (!r) return;
    r.status = action;
    r.resolvedAt = new Date().toISOString();
    r.resolvedBy = actorId;
    s.reports.set(id, r);
    s.audit.push({
      id: uuid(),
      actorId,
      action: `report.${action}`,
      targetType: "report",
      targetId: id,
      metadata: { listingId: r.listingId },
      createdAt: new Date().toISOString(),
    });
  },

  async adminListUsers(filters) {
    const s = store();
    const q = filters?.q?.toLowerCase();
    return [...s.users.values()]
      .filter((u) => !filters?.role || u.role === filters.role)
      .filter(
        (u) =>
          !q ||
          u.email.toLowerCase().includes(q) ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
      )
      .map(({ passwordHash: _p, ...rest }) => rest)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async adminListListings(filters) {
    const s = store();
    const q = filters?.q?.toLowerCase();
    return [...s.listings.values()]
      .filter((l) => !filters?.status || l.status === filters.status)
      .filter(
        (l) =>
          !q ||
          l.title.toLowerCase().includes(q) ||
          `${l.make} ${l.model}`.toLowerCase().includes(q)
      )
      .map((l) => {
        const owner = s.users.get(l.ownerId);
        return { ...stripOwner(l), status: l.status, ownerEmail: owner?.email ?? "" };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async adminGetKpis() {
    const s = store();
    const listings = [...s.listings.values()];
    const reports = [...s.reports.values()];
    return {
      totalUsers: s.users.size,
      totalListings: listings.length,
      activeListings: listings.filter((l) => l.status === "active").length,
      pendingReports: reports.filter((r) => r.status === "open").length,
      featuredListings: listings.filter((l) => l.featured).length,
      bannedUsers: [...s.users.values()].filter((u) => u.bannedAt).length,
    };
  },

  async adminSetUserRole(targetId, actorId, role) {
    const s = store();
    const u = s.users.get(targetId);
    if (!u) throw new Error("Korisnik ne postoji");
    u.role = role;
    s.users.set(targetId, u);
    s.audit.push({
      id: uuid(),
      actorId,
      action: "user.elevate",
      targetType: "user",
      targetId,
      metadata: { role },
      createdAt: new Date().toISOString(),
    });
  },

  async adminBanUser(targetId, actorId, banned) {
    const s = store();
    const u = s.users.get(targetId);
    if (!u) throw new Error("Korisnik ne postoji");
    u.bannedAt = banned ? new Date().toISOString() : null;
    s.users.set(targetId, u);
    s.audit.push({
      id: uuid(),
      actorId,
      action: banned ? "user.ban" : "user.unban",
      targetType: "user",
      targetId,
      metadata: null,
      createdAt: new Date().toISOString(),
    });
  },

  async adminDeleteListing(listingId, actorId) {
    const s = store();
    const l = s.listings.get(listingId);
    if (!l) throw new Error("Oglas ne postoji");
    l.status = "deleted";
    s.listings.set(listingId, l);
    s.audit.push({
      id: uuid(),
      actorId,
      action: "listing.delete",
      targetType: "listing",
      targetId: listingId,
      metadata: { slug: l.slug },
      createdAt: new Date().toISOString(),
    });
  },

  async adminSetFeatured(listingId, actorId, featured) {
    const s = store();
    const l = s.listings.get(listingId);
    if (!l) throw new Error("Oglas ne postoji");
    l.featured = featured;
    s.listings.set(listingId, l);
    s.audit.push({
      id: uuid(),
      actorId,
      action: featured ? "listing.feature" : "listing.unfeature",
      targetType: "listing",
      targetId: listingId,
      metadata: null,
      createdAt: new Date().toISOString(),
    });
  },

  async adminListAudit(limit = 100) {
    const s = store();
    return [...s.audit].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  },
};
