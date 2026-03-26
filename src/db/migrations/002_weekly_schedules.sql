-- ============================================
-- 14. Weekly Schedules (Recuring)
-- ============================================
CREATE TABLE IF NOT EXISTS outlet_weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open BOOLEAN DEFAULT true,
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_weekly_schedules_outlet ON outlet_weekly_schedules(outlet_id);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trigger_updated_at ON outlet_weekly_schedules;
CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON outlet_weekly_schedules 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
