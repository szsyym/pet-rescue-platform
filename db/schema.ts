import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    authorId: text("author_id").notNull(),
    authorName: text("author_name").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    category: text("category").notNull().default("救助日记"),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_posts_created_at").on(table.createdAt),
    index("idx_posts_status_created_at").on(table.status, table.createdAt),
  ],
);

export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    organizerId: text("organizer_id").notNull(),
    organizerName: text("organizer_name").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    eventDate: text("event_date").notNull(),
    capacity: integer("capacity").notNull().default(20),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_activities_event_date").on(table.eventDate),
    index("idx_activities_status_event_date").on(table.status, table.eventDate),
  ],
);

export const activityMembers = sqliteTable(
  "activity_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_activity_members_unique").on(table.activityId, table.userId),
  ],
);

export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const members = sqliteTable(
  "members",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    status: text("status").notNull().default("active"),
    joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_members_email").on(table.email),
    index("idx_members_status_joined_at").on(table.status, table.joinedAt),
  ],
);
