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
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`datetime` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "account_id", "to_account_id", "category_id", "amount", "type", "datetime", "note", "created_at", "updated_at") SELECT "id", "account_id", "to_account_id", "category_id", "amount", "type", "datetime", "note", "created_at", "updated_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
CREATE INDEX `payments_account_id_idx` ON `payments` (`account_id`);--> statement-breakpoint
CREATE INDEX `payments_to_account_id_idx` ON `payments` (`to_account_id`);--> statement-breakpoint
CREATE INDEX `payments_category_id_idx` ON `payments` (`category_id`);--> statement-breakpoint
CREATE INDEX `payments_datetime_idx` ON `payments` (`datetime`);