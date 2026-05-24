-- ============================================================
-- Fix admin_actions schema: add missing columns
-- ============================================================
ALTER TABLE admin_actions ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE admin_actions ADD COLUMN IF NOT EXISTS previous_value JSONB;
ALTER TABLE admin_actions ADD COLUMN IF NOT EXISTS new_value JSONB;

-- Migrate existing data: copy 'action' column to 'action_type' if action_type is null
UPDATE admin_actions SET action_type = action WHERE action_type IS NULL;

-- ============================================================
-- Add missing order_status enum values
-- ============================================================
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked_up';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivering';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'rejected';

-- ============================================================
-- Add missing driver_status enum value
-- ============================================================
ALTER TYPE driver_status ADD VALUE IF NOT EXISTS 'on_delivery';

-- ============================================================
-- Add missing restaurant_status enum value
-- ============================================================
ALTER TYPE restaurant_status ADD VALUE IF NOT EXISTS 'temporarily_closed';

-- ============================================================
-- Add missing payment_status enum values
-- ============================================================
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'partial';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'completed';