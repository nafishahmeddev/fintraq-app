ALTER TABLE `budgets` ADD `last_rolled_date` text;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `interval` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `recurring_transactions` ADD `interval_unit` text DEFAULT 'DAYS' NOT NULL;