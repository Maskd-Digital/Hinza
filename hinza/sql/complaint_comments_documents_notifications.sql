-- ============================================================================
-- Complaint comments, document versioning, review flow, notifications
-- ============================================================================
-- Idempotent: safe to run multiple times.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. complaint_comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.complaint_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON public.complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_created_at ON public.complaint_comments(complaint_id, created_at);

ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read comments for complaints in their company" ON public.complaint_comments;
CREATE POLICY "Users can read comments for complaints in their company"
ON public.complaint_comments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.complaints c
        JOIN public.users u ON u.company_id = c.company_id
        WHERE c.id = complaint_comments.complaint_id AND u.id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert comments for complaints in their company" ON public.complaint_comments;
CREATE POLICY "Users can insert comments for complaints in their company"
ON public.complaint_comments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.complaints c
        JOIN public.users u ON u.company_id = c.company_id
        WHERE c.id = complaint_id AND u.id = auth.uid()
    )
);

-- ============================================================================
-- 2. complaint_documents (versioned CAPA/SLA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.complaint_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('capa', 'sla')),
    file_path TEXT NOT NULL,
    file_name TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_complaint_documents_complaint_id ON public.complaint_documents(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_documents_type ON public.complaint_documents(complaint_id, document_type);

ALTER TABLE public.complaint_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read documents for complaints in their company" ON public.complaint_documents;
CREATE POLICY "Users can read documents for complaints in their company"
ON public.complaint_documents FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.complaints c
        JOIN public.users u ON u.company_id = c.company_id
        WHERE c.id = complaint_documents.complaint_id AND u.id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert documents for complaints in their company" ON public.complaint_documents;
CREATE POLICY "Users can insert documents for complaints in their company"
ON public.complaint_documents FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.complaints c
        JOIN public.users u ON u.company_id = c.company_id
        WHERE c.id = complaint_id AND u.id = auth.uid()
    )
);

-- ============================================================================
-- 3. Add review columns to complaints
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'review_status') THEN
        ALTER TABLE public.complaints ADD COLUMN review_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.complaints ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'reviewed_by') THEN
        ALTER TABLE public.complaints ADD COLUMN reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'rejection_reason') THEN
        ALTER TABLE public.complaints ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_complaints_review_status ON public.complaints(review_status) WHERE review_status IS NOT NULL;

-- ============================================================================
-- 4. notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    title TEXT NOT NULL,
    body TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_company_created ON public.notifications(company_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications read_at" ON public.notifications;
CREATE POLICY "Users can update own notifications read_at"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Insert is done by backend with service role (bypasses RLS)
