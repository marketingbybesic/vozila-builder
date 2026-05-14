import type { Listing, ListingFilters } from "@/lib/types";

export type DbUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  county: string | null;
  city: string | null;
  avatarUrl: string | null;
  sellerType: "Privatni" | "Trgovac";
  role: "user" | "admin" | "moderator";
  tier: "free" | "pro" | "premium-dealer";
  bannedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

export type DbSavedSearch = {
  id: string;
  userId: string;
  name: string;
  filterJson: Record<string, unknown>;
  notifyEmail: boolean;
  lastSeenCount: number;
  createdAt: string;
};

export type DbReport = {
  id: string;
  listingId: string;
  reporterId: string | null;
  reason: "fraud" | "duplicate" | "wrong-data" | "inappropriate" | "other";
  body: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
};

export type DbAuditLog = {
  id: string;
  actorId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminKpis = {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingReports: number;
  featuredListings: number;
  bannedUsers: number;
};

export type DbMessage = {
  id: string;
  threadId: string;
  fromUserId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type DbThread = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  createdAt: string;
};

export type ThreadWithLatest = DbThread & {
  listing: Listing;
  other: Pick<DbUser, "id" | "firstName" | "lastName" | "avatarUrl">;
  unreadCount: number;
  lastMessage: DbMessage | null;
};

export interface DbAdapter {
  mode: "memory" | "supabase";

  // Users
  getUserById(id: string): Promise<DbUser | null>;
  getUserByEmail(email: string): Promise<(DbUser & { passwordHash: string | null }) | null>;
  createUser(input: {
    email: string;
    passwordHash: string | null;
    firstName: string;
    lastName: string;
    phone?: string;
    county?: string;
    city?: string;
    sellerType?: "Privatni" | "Trgovac";
  }): Promise<DbUser>;
  updateUser(id: string, patch: Partial<Pick<DbUser, "firstName" | "lastName" | "phone" | "county" | "city" | "avatarUrl">>): Promise<DbUser>;

  // Sessions
  createSession(userId: string, ttlSeconds: number): Promise<{ token: string; expiresAt: string }>;
  getSessionUser(token: string): Promise<DbUser | null>;
  deleteSession(token: string): Promise<void>;

  // Listings
  listListings(filters: ListingFilters): Promise<{ items: Listing[]; total: number }>;
  getListingBySlug(slug: string): Promise<Listing | null>;
  getListingsByUser(userId: string): Promise<(Listing & { status: string })[]>;
  getFeaturedListings(limit: number): Promise<Listing[]>;
  getRelatedListings(listing: Listing, limit: number): Promise<Listing[]>;
  getAllActiveSlugs(): Promise<{ slug: string; createdAt: string }[]>;
  createListing(userId: string, input: Omit<Listing, "id" | "slug" | "title" | "views" | "createdAt" | "featured" | "sellerName" | "sellerType" | "sellerPhone">): Promise<Listing>;
  updateListing(id: string, userId: string, patch: Partial<Listing>): Promise<Listing>;
  setListingStatus(id: string, userId: string, status: "active" | "paused" | "sold" | "deleted"): Promise<void>;
  incrementViews(id: string): Promise<void>;

  // Saved
  toggleSaved(userId: string, listingId: string): Promise<{ saved: boolean }>;
  getSavedListings(userId: string): Promise<Listing[]>;

  // Messages
  listThreads(userId: string): Promise<ThreadWithLatest[]>;
  getThreadMessages(threadId: string, userId: string): Promise<DbMessage[]>;
  sendMessage(input: { fromUserId: string; listingId: string; body: string; toUserId?: string }): Promise<DbMessage>;
  markThreadRead(threadId: string, userId: string): Promise<void>;

  // Saved searches
  listSavedSearches(userId: string): Promise<DbSavedSearch[]>;
  createSavedSearch(userId: string, input: { name: string; filterJson: Record<string, unknown>; notifyEmail?: boolean }): Promise<DbSavedSearch>;
  deleteSavedSearch(userId: string, id: string): Promise<void>;

  // Reports
  createReport(input: { listingId: string; reporterId: string | null; reason: DbReport["reason"]; body: string }): Promise<DbReport>;
  listReports(filters?: { status?: DbReport["status"] }): Promise<(DbReport & { listingSlug: string; listingTitle: string })[]>;
  resolveReport(id: string, actorId: string, action: "resolved" | "dismissed"): Promise<void>;

  // Admin
  adminListUsers(filters?: { q?: string; role?: string }): Promise<DbUser[]>;
  adminListListings(filters?: { status?: string; q?: string }): Promise<(Listing & { status: string; ownerEmail: string })[]>;
  adminGetKpis(): Promise<AdminKpis>;
  adminSetUserRole(targetId: string, actorId: string, role: DbUser["role"]): Promise<void>;
  adminBanUser(targetId: string, actorId: string, banned: boolean): Promise<void>;
  adminDeleteListing(listingId: string, actorId: string): Promise<void>;
  adminSetFeatured(listingId: string, actorId: string, featured: boolean): Promise<void>;
  adminListAudit(limit?: number): Promise<DbAuditLog[]>;
}
