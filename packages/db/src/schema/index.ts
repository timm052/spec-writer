import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  primaryKey,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from '@auth/core/adapters';

// Sections table
export const sections = pgTable('sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull(),
  title: text('title').notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => sections.id),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Clauses table
export const clauses = pgTable('clauses', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => sections.id),
  code: text('code').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  source: text('source', { enum: ['natspec', 'practice', 'project'] }).notNull().default('natspec'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  number: text('number'),
  client: text('client'),
  address: text('address'),
  variables: jsonb('variables').$type<Record<string, string>>().default({}),
  status: text('status', { enum: ['draft', 'in-review', 'issued'] }).notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Project clauses join table
export const projectClauses = pgTable('project_clauses', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  clauseId: uuid('clause_id')
    .notNull()
    .references(() => clauses.id),
  bodyOverride: text('body_override'),
  sortOrder: integer('sort_order').notNull(),
  included: boolean('included').notNull().default(true),
  status: text('status', { enum: ['draft', 'reviewed', 'approved'] }).notNull().default('draft'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Project issues (revision/issue register)
export const projectIssues = pgTable('project_issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  revision: text('revision').notNull(), // e.g. 'Rev A', 'Rev B'
  description: text('description').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Per-project section ordering
export const projectSections = pgTable('project_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => sections.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Materials table
export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  manufacturer: text('manufacturer'),
  productCode: text('product_code'),
  specClauseId: uuid('spec_clause_id').references(() => clauses.id),
  datasheetUrl: text('datasheet_url'),
  tags: jsonb('tags').$type<string[]>().default([]),
  properties: jsonb('properties').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Spec snapshots (issued revision history)
export const specSnapshots = pgTable('spec_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  label: text('label'),
  snapshotJson: jsonb('snapshot_json').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── NextAuth v5 tables ───────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export type Section = typeof sections.$inferSelect;
export type Clause = typeof clauses.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectClause = typeof projectClauses.$inferSelect;
export type ProjectIssue = typeof projectIssues.$inferSelect;
export type ProjectSection = typeof projectSections.$inferSelect;
export type SpecSnapshot = typeof specSnapshots.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
