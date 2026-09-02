CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_members_email` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `idx_members_status_joined_at` ON `members` (`status`,`joined_at`);--> statement-breakpoint
ALTER TABLE `activities` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_activities_status_event_date` ON `activities` (`status`,`event_date`);--> statement-breakpoint
ALTER TABLE `posts` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_posts_status_created_at` ON `posts` (`status`,`created_at`);