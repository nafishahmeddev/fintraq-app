CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`type` text DEFAULT 'DR' NOT NULL,
	`color` integer DEFAULT 0 NOT NULL,
	`mode` text DEFAULT 'AUTO' NOT NULL,
	`scope` text DEFAULT 'OVERALL' NOT NULL,
	`period` text DEFAULT 'MONTHLY' NOT NULL,
	`category_ids` text,
	`account_ids` text,
	`start_date` text,
	`end_date` text,
	`is_rolling` integer DEFAULT false NOT NULL,
	`last_rolled_date` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`start_date` text,
	`end_date` text,
	`account_id` integer,
	`icon` text DEFAULT 'flag' NOT NULL,
	`color` integer NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`total_amount` real NOT NULL,
	`remaining_amount` real NOT NULL,
	`type` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`account_id` integer,
	`person_id` integer,
	`icon` text DEFAULT 'cash' NOT NULL,
	`color` integer NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`icon` text DEFAULT 'person' NOT NULL,
	`color` integer NOT NULL,
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
	`interval` integer DEFAULT 1 NOT NULL,
	`interval_unit` text DEFAULT 'DAYS' NOT NULL,
	`start_date` text NOT NULL,
	`next_date` text NOT NULL,
	`end_condition` text DEFAULT 'NEVER' NOT NULL,
	`end_value` text,
	`occurrences_count` integer DEFAULT 0 NOT NULL,
	`is_paused` integer DEFAULT false NOT NULL,
	`reminder_days` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`holderName` text NOT NULL,
	`accountNumber` text,
	`type` text DEFAULT 'cash' NOT NULL,
	`icon` text DEFAULT 'wallet' NOT NULL,
	`color` integer NOT NULL,
	`isDefault` integer DEFAULT false NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`income` real DEFAULT 0 NOT NULL,
	`expense` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "name", "holderName", "accountNumber", "type", "icon", "color", "isDefault", "currency", "balance", "income", "expense", "created_at", "updated_at") SELECT "id", "name", "holderName", "accountNumber", "type", "icon", "color", "isDefault", "currency", "balance", "income", "expense", "created_at", "updated_at" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`to_account_id` integer,
	`category_id` integer,
	`recurring_id` integer,
	`budget_id` integer,
	`goal_id` integer,
	`loan_id` integer,
	`person_id` integer,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`datetime` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recurring_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "account_id", "to_account_id", "category_id", "recurring_id", "budget_id", "goal_id", "loan_id", "person_id", "amount", "type", "datetime", "note", "created_at", "updated_at") SELECT "id", "account_id", "to_account_id", "category_id", "recurring_id", "budget_id", "goal_id", "loan_id", "person_id", "amount", "type", "datetime", "note", "created_at", "updated_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
CREATE INDEX `payments_account_id_idx` ON `payments` (`account_id`);--> statement-breakpoint
CREATE INDEX `payments_to_account_id_idx` ON `payments` (`to_account_id`);--> statement-breakpoint
CREATE INDEX `payments_category_id_idx` ON `payments` (`category_id`);--> statement-breakpoint
CREATE INDEX `payments_goal_id_idx` ON `payments` (`goal_id`);--> statement-breakpoint
CREATE INDEX `payments_loan_id_idx` ON `payments` (`loan_id`);--> statement-breakpoint
CREATE INDEX `payments_datetime_idx` ON `payments` (`datetime`);