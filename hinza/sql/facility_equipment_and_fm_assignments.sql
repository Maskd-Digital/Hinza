-- ============================================================================
-- Facility equipment, facility manager assignments, complaint equipment columns
-- ============================================================================
-- Idempotent: safe to run multiple times.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- facility_equipment
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.facility_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    asset_tag TEXT,
    model TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facility_equipment_company_id ON public.facility_equipment(company_id);
CREATE INDEX IF NOT EXISTS idx_facility_equipment_facility_id ON public.facility_equipment(facility_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_facility_equipment_asset_unique
    ON public.facility_equipment(company_id, facility_id, asset_tag)
    WHERE asset_tag IS NOT NULL AND btrim(asset_tag) <> '';

CREATE OR REPLACE FUNCTION public.update_facility_equipment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_facility_equipment_updated_at ON public.facility_equipment;
CREATE TRIGGER trigger_facility_equipment_updated_at
    BEFORE UPDATE ON public.facility_equipment
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_facility_equipment_updated_at();

-- ============================================================================
-- facility_manager_assignments (user scoped to facilities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.facility_manager_assignments (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, facility_id)
);

CREATE INDEX IF NOT EXISTS idx_facility_manager_assignments_user ON public.facility_manager_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_manager_assignments_facility ON public.facility_manager_assignments(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_manager_assignments_company ON public.facility_manager_assignments(company_id);

-- ============================================================================
-- complaints: equipment_id, facility escalation audit
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'equipment_id'
    ) THEN
        ALTER TABLE public.complaints ADD COLUMN equipment_id UUID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'facility_escalated_at'
    ) THEN
        ALTER TABLE public.complaints ADD COLUMN facility_escalated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'facility_escalated_by'
    ) THEN
        ALTER TABLE public.complaints ADD COLUMN facility_escalated_by UUID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'complaints' AND constraint_name = 'fk_complaints_equipment'
    ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'facility_equipment') THEN
            ALTER TABLE public.complaints
                ADD CONSTRAINT fk_complaints_equipment
                FOREIGN KEY (equipment_id) REFERENCES public.facility_equipment(id) ON DELETE SET NULL;
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'complaints' AND constraint_name = 'fk_complaints_facility_escalated_by'
    ) THEN
        ALTER TABLE public.complaints
            ADD CONSTRAINT fk_complaints_facility_escalated_by
            FOREIGN KEY (facility_escalated_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_complaints_equipment_id ON public.complaints(equipment_id) WHERE equipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_complaints_company_equipment ON public.complaints(company_id, equipment_id) WHERE equipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_complaints_facility_escalation ON public.complaints(facility_id, facility_escalated_at)
    WHERE equipment_id IS NOT NULL;
