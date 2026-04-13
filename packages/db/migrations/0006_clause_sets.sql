-- Create clause_sets table
CREATE TABLE "clause_sets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
-- Insert the default clause set and capture its id
DO $$
DECLARE
  default_set_id uuid;
BEGIN
  INSERT INTO "clause_sets" ("name", "description")
  VALUES ('Default', 'Default clause library')
  RETURNING id INTO default_set_id;

  -- Add clause_set_id column to sections (nullable first for backfill)
  ALTER TABLE "sections" ADD COLUMN "clause_set_id" uuid;

  -- Backfill all existing sections to the default set
  UPDATE "sections" SET "clause_set_id" = default_set_id;

  -- Now make it NOT NULL and add FK
  ALTER TABLE "sections" ALTER COLUMN "clause_set_id" SET NOT NULL;
  ALTER TABLE "sections" ADD CONSTRAINT "sections_clause_set_id_fk"
    FOREIGN KEY ("clause_set_id") REFERENCES "clause_sets"("id") ON DELETE CASCADE;

  -- Add nullable clause_set_id to projects (null = use default)
  ALTER TABLE "projects" ADD COLUMN "clause_set_id" uuid;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_clause_set_id_fk"
    FOREIGN KEY ("clause_set_id") REFERENCES "clause_sets"("id") ON DELETE SET NULL;
END $$;
