import type { Listing, ListingFilters } from "@/lib/types";
import type { DbAdapter, DbUser, DbMessage, DbThread, ThreadWithLatest } from "./types";
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
      verifiedAt: null,
      createdAt: new Date().toISOString(),
    };
    users.set(demoUser.id, demoUser);
    emailIdx.set(demoUser.email, demoUser.id);

    // Seed listings owned by demo user
    LISTINGS.forEach((l) => {
      const stored: Stored = { ...l, ownerId: demoUser.id, status: "active" };
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
    const id = store().emailIdx.get(email);
    if (!id) return null;
    return store().users.get(id) ?? null;
  },

  async createUser(input) {
    const s = store();
    if (s.emailIdx.has(input.email)) throw new Error("Email već postoji");
    const id = uuid();
    const user = {
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
      verifiedAt: null,
      createdAt: new Date().toISOString(),
    };
    s.users.set(id, user);
    s.emailIdx.set(input.email, id);
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
};
