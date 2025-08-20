import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "hashtags_synonyms" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"term" varchar
  );
  
  CREATE TABLE "hashtags_alias_slugs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar
  );
  
  CREATE TABLE "hashtags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"slug" varchar,
  	"slug_lock" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "posts_rels" ADD COLUMN "hashtags_id" integer;
  ALTER TABLE "_posts_v_rels" ADD COLUMN "hashtags_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "hashtags_id" integer;
  ALTER TABLE "hashtags_synonyms" ADD CONSTRAINT "hashtags_synonyms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hashtags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hashtags_alias_slugs" ADD CONSTRAINT "hashtags_alias_slugs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hashtags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hashtags_synonyms_order_idx" ON "hashtags_synonyms" USING btree ("_order");
  CREATE INDEX "hashtags_synonyms_parent_id_idx" ON "hashtags_synonyms" USING btree ("_parent_id");
  CREATE INDEX "hashtags_alias_slugs_order_idx" ON "hashtags_alias_slugs" USING btree ("_order");
  CREATE INDEX "hashtags_alias_slugs_parent_id_idx" ON "hashtags_alias_slugs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hashtags_title_idx" ON "hashtags" USING btree ("title");
  CREATE INDEX "hashtags_slug_idx" ON "hashtags" USING btree ("slug");
  CREATE INDEX "hashtags_updated_at_idx" ON "hashtags" USING btree ("updated_at");
  CREATE INDEX "hashtags_created_at_idx" ON "hashtags" USING btree ("created_at");
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_hashtags_fk" FOREIGN KEY ("hashtags_id") REFERENCES "public"."hashtags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_hashtags_fk" FOREIGN KEY ("hashtags_id") REFERENCES "public"."hashtags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hashtags_fk" FOREIGN KEY ("hashtags_id") REFERENCES "public"."hashtags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_rels_hashtags_id_idx" ON "posts_rels" USING btree ("hashtags_id");
  CREATE INDEX "_posts_v_rels_hashtags_id_idx" ON "_posts_v_rels" USING btree ("hashtags_id");
  CREATE INDEX "payload_locked_documents_rels_hashtags_id_idx" ON "payload_locked_documents_rels" USING btree ("hashtags_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "hashtags_synonyms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hashtags_alias_slugs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "hashtags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "hashtags_synonyms" CASCADE;
  DROP TABLE "hashtags_alias_slugs" CASCADE;
  DROP TABLE "hashtags" CASCADE;
  ALTER TABLE "posts_rels" DROP CONSTRAINT "posts_rels_hashtags_fk";
  
  ALTER TABLE "_posts_v_rels" DROP CONSTRAINT "_posts_v_rels_hashtags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hashtags_fk";
  
  DROP INDEX "posts_rels_hashtags_id_idx";
  DROP INDEX "_posts_v_rels_hashtags_id_idx";
  DROP INDEX "payload_locked_documents_rels_hashtags_id_idx";
  ALTER TABLE "posts_rels" DROP COLUMN "hashtags_id";
  ALTER TABLE "_posts_v_rels" DROP COLUMN "hashtags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "hashtags_id";`)
}
