-- Create project_sections table for per-project section ordering
CREATE TABLE "project_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "project_sections" ADD CONSTRAINT "project_sections_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_sections" ADD CONSTRAINT "project_sections_section_id_sections_id_fk"
  FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Backfill: for each project, insert a project_sections row for each distinct section
-- referenced by its included clauses, ordered by the library section sort_order.
INSERT INTO "project_sections" ("project_id", "section_id", "sort_order")
SELECT
  pc.project_id,
  c.section_id,
  ROW_NUMBER() OVER (PARTITION BY pc.project_id ORDER BY s.sort_order) - 1 AS sort_order
FROM "project_clauses" pc
INNER JOIN "clauses" c ON c.id = pc.clause_id
INNER JOIN "sections" s ON s.id = c.section_id
WHERE pc.included = true
GROUP BY pc.project_id, c.section_id, s.sort_order
ON CONFLICT DO NOTHING;
