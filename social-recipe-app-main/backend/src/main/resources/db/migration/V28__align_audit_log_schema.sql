-- V28__align_audit_log_schema.sql

-- Rename columns and change types to match AuditLog entity
DO $$
BEGIN
    -- Rename action_type to action
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='action_type') THEN
        ALTER TABLE audit_logs RENAME COLUMN action_type TO action;
    END IF;

    -- Change target_user_id to target (VARCHAR)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='target_user_id') THEN
        ALTER TABLE audit_logs RENAME COLUMN target_user_id TO target;
        ALTER TABLE audit_logs ALTER COLUMN target TYPE VARCHAR(255);
    END IF;

    -- Change performed_by_id to performed_by (VARCHAR)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='performed_by_id') THEN
        ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_performed_by_id_fkey;
        ALTER TABLE audit_logs RENAME COLUMN performed_by_id TO performed_by;
        ALTER TABLE audit_logs ALTER COLUMN performed_by TYPE VARCHAR(255);
    END IF;

END $$;
