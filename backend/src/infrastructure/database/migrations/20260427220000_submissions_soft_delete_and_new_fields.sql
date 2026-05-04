-- Up migration: submissions_soft_delete_and_new_fields
-- Adds city, country, status, and deleted_at columns to submissions table.

ALTER TABLE submissions
  ADD COLUMN city VARCHAR(255) NULL AFTER message,
  ADD COLUMN country VARCHAR(255) NULL AFTER city,
  ADD COLUMN status ENUM('Open','In Review','Approved','Declined') NOT NULL DEFAULT 'Open' AFTER country,
  ADD COLUMN deleted_at DATETIME(6) NULL AFTER created_at;

ALTER TABLE submissions ADD INDEX idx_submissions_deleted_at (deleted_at);
ALTER TABLE submissions ADD INDEX idx_submissions_status (status);
