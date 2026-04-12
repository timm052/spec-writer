import { z } from 'zod';

// ─── Projects ────────────────────────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  number: z.string().optional(),
  client: z.string().optional(),
  address: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional().default({}),
});

export const ProjectStatusSchema = z.enum(['draft', 'in-review', 'issued']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  status: ProjectStatusSchema.optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreateProjectFormValues = z.input<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// ─── Project Clauses ─────────────────────────────────────────────────────────

export const AddClauseToProjectSchema = z.object({
  clauseId: z.string().uuid('Invalid clause ID'),
  sortOrder: z.number().int().min(0).optional(),
});

export const ClauseStatusSchema = z.enum(['draft', 'reviewed', 'approved']);
export type ClauseStatus = z.infer<typeof ClauseStatusSchema>;

export const UpdateProjectClauseSchema = z.object({
  bodyOverride: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  included: z.boolean().optional(),
  status: ClauseStatusSchema.optional(),
  notes: z.string().nullable().optional(),
});

export const CreateProjectIssueSchema = z.object({
  revision: z.string().min(1, 'Revision is required'),
  description: z.string().min(1, 'Description is required'),
  issuedAt: z.string().datetime().optional(),
});

export type CreateProjectIssueInput = z.infer<typeof CreateProjectIssueSchema>;

export type AddClauseToProjectInput = z.infer<typeof AddClauseToProjectSchema>;
export type UpdateProjectClauseInput = z.infer<typeof UpdateProjectClauseSchema>;

// ─── Library Search ───────────────────────────────────────────────────────────

export const SearchClausesSchema = z.object({
  q: z.string().optional(),
  section: z.string().uuid().optional(),
  tags: z.string().optional(), // comma-separated
});

export type SearchClausesInput = z.infer<typeof SearchClausesSchema>;

// ─── API error response ───────────────────────────────────────────────────────

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
