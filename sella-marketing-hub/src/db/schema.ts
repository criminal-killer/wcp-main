import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
});

export const marketingPosts = sqliteTable('marketing_posts', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  mediaUrl: text('media_url'),
  platform: text('platform').notNull(), // 'fb', 'ig', 'x'
  status: text('status').default('PENDING').notNull(), // 'PENDING', 'APPROVED', 'REDO', 'POSTED'
  createdAt: integer('created_at').notNull(), 
  approvedAt: integer('approved_at'),
  scheduledAt: integer('scheduled_at'), // Fixed time for the next day
});

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  email: text('email'),
  website: text('website'),
  personaType: text('persona_type'),
  status: text('status').default('NEW').notNull(), // 'NEW', 'APPROVED', 'REJECTED', 'SENT'
  createdAt: integer('created_at').notNull(),
});

export const analytics = sqliteTable('analytics', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id'),
  clicks: integer('clicks').default(0),
  opens: integer('opens').default(0),
  replies: integer('replies').default(0),
  botQueriesHandled: integer('bot_queries_handled').default(0),
  lastUpdated: integer('last_updated').notNull(),
});
