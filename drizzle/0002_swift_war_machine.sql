CREATE TABLE `places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text DEFAULT 'location' NOT NULL,
	`color` integer NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `payments` ADD `place_id` integer REFERENCES places(id);--> statement-breakpoint
CREATE INDEX `payments_person_id_idx` ON `payments` (`person_id`);--> statement-breakpoint
CREATE INDEX `payments_place_id_idx` ON `payments` (`place_id`);