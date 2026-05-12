import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  primaryKey,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  county: text("county"),
  city: text("city"),
  avatarUrl: text("avatar_url"),
  sellerType: text("seller_type").notNull().default("Privatni"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    variant: text("variant"),
    year: integer("year").notNull(),
    priceEur: integer("price_eur").notNull(),
    km: integer("km").notNull(),
    fuel: text("fuel").notNull(),
    transmission: text("transmission").notNull(),
    bodyType: text("body_type").notNull(),
    drive: text("drive").notNull(),
    color: text("color").notNull(),
    condition: text("condition").notNull(),
    engineCc: integer("engine_cc").notNull().default(0),
    powerKw: integer("power_kw").notNull(),
    doors: integer("doors").notNull().default(5),
    seats: integer("seats").notNull().default(5),
    firstRegistered: text("first_registered"),
    registrationUntil: text("registration_until"),
    city: text("city").notNull(),
    county: text("county").notNull(),
    description: text("description").notNull(),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("active"),
    featured: boolean("featured").notNull().default(false),
    views: integer("views").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    makeIdx: index("listings_make_idx").on(t.make),
    modelIdx: index("listings_model_idx").on(t.model),
    priceIdx: index("listings_price_idx").on(t.priceEur),
    yearIdx: index("listings_year_idx").on(t.year),
    countyIdx: index("listings_county_idx").on(t.county),
    statusIdx: index("listings_status_idx").on(t.status),
    createdIdx: index("listings_created_idx").on(t.createdAt),
  })
);

export const savedListings = pgTable(
  "saved_listings",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.listingId] }) })
);

export const messageThreads = pgTable(
  "message_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    listingIdx: index("threads_listing_idx").on(t.listingId),
    buyerIdx: index("threads_buyer_idx").on(t.buyerId),
    sellerIdx: index("threads_seller_idx").on(t.sellerId),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id").notNull().references(() => messageThreads.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ threadIdx: index("messages_thread_idx").on(t.threadId) })
);

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const viewsLog = pgTable("views_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DbListing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Thread = typeof messageThreads.$inferSelect;
