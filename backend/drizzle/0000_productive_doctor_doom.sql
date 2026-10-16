CREATE TABLE "study_users" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_users_object" CHECK (jsonb_typeof("study_users"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "study_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_resources_object" CHECK (jsonb_typeof("study_resources"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "study_tests" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_tests_object" CHECK (jsonb_typeof("study_tests"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "study_test_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_test_attempts_object" CHECK (jsonb_typeof("study_test_attempts"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "study_discussions" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_discussions_object" CHECK (jsonb_typeof("study_discussions"."data") = 'object')
);
--> statement-breakpoint
CREATE TABLE "study_rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_rate_limits_object" CHECK (jsonb_typeof("study_rate_limits"."data") = 'object')
);
--> statement-breakpoint
CREATE INDEX "study_users_role_idx" ON "study_users" USING btree (("data"->>'role'));--> statement-breakpoint
CREATE INDEX "study_resources_filter_idx" ON "study_resources" USING btree (("data"->>'branch'),("data"->>'type'));--> statement-breakpoint
CREATE INDEX "study_tests_branch_idx" ON "study_tests" USING btree (("data"->>'branch'));--> statement-breakpoint
CREATE UNIQUE INDEX "study_test_attempts_user_test_idx" ON "study_test_attempts" USING btree (("data"->>'userId'),("data"->>'testId'));