-- Fix FK constraints on sections so deleting a section cascades to its clauses and child sections
ALTER TABLE "clauses" DROP CONSTRAINT "clauses_section_id_sections_id_fk";
ALTER TABLE "clauses" ADD CONSTRAINT "clauses_section_id_sections_id_fk"
  FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "sections" DROP CONSTRAINT "sections_parent_id_sections_id_fk";
ALTER TABLE "sections" ADD CONSTRAINT "sections_parent_id_sections_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "sections"("id") ON DELETE CASCADE;
