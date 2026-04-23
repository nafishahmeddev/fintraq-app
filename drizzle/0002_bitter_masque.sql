CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`type` text DEFAULT 'DR' NOT NULL,
	`mode` text DEFAULT 'AUTO' NOT NULL,
	`scope` text DEFAULT 'OVERALL' NOT NULL,
	`period` text DEFAULT 'MONTHLY' NOT NULL,
	`category_ids` text,
	`start_date` text,
	`end_date` text,
	`is_rolling` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recurring_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category_id` integer,
	`account_id` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT 'sync' NOT NULL,
	`color` integer NOT NULL,
	`frequency` text NOT NULL,
	`start_date` text NOT NULL,
	`next_date` text NOT NULL,
	`end_condition` text DEFAULT 'NEVER' NOT NULL,
	`end_value` text,
	`occurrences_count` integer DEFAULT 0 NOT NULL,
	`is_paused` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `recurring_id` integer REFERENCES recurring_transactions(id);--> statement-breakpoint
ALTER TABLE `payments` ADD `budget_id` integer REFERENCES budgets(id);