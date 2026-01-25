-- SQL Script to ALTER Existing Products Table for Self-Referencing Hierarchy
-- Use this if you already have a products table and just want to add hierarchy support
-- This script is safe to run multiple times (idempotent)

-- ============================================
-- Step 1: Add hierarchy columns if they don't exist
-- ============================================

-- Add parent_id column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN parent_id UUID NULL;
    RAISE NOTICE 'Added parent_id column';
  ELSE
    RAISE NOTICE 'parent_id column already exists';
  END IF;
END $$;

-- Add level column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'level'
  ) THEN
    ALTER TABLE public.products ADD COLUMN level INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added level column';
  ELSE
    RAISE NOTICE 'level column already exists';
  END IF;
END $$;

-- Add description column (optional but recommended)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.products ADD COLUMN description TEXT NULL;
    RAISE NOTICE 'Added description column';
  ELSE
    RAISE NOTICE 'description column already exists';
  END IF;
END $$;

-- Add timestamps if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  ELSE
    RAISE NOTICE 'created_at column already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  ELSE
    RAISE NOTICE 'updated_at column already exists';
  END IF;
END $$;

-- ============================================
-- Step 2: Add foreign key constraints
-- ============================================

-- Ensure company_id foreign key exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'products' 
    AND constraint_name = 'fk_products_company'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT fk_products_company 
    FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added company_id foreign key constraint';
  ELSE
    RAISE NOTICE 'company_id foreign key constraint already exists';
  END IF;
END $$;

-- Add self-referencing foreign key for parent_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'products' 
    AND constraint_name = 'fk_products_parent'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT fk_products_parent 
    FOREIGN KEY (parent_id) 
    REFERENCES public.products(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added parent_id self-referencing foreign key constraint';
  ELSE
    RAISE NOTICE 'parent_id foreign key constraint already exists';
  END IF;
END $$;

-- ============================================
-- Step 3: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_level ON public.products(level);
CREATE INDEX IF NOT EXISTS idx_products_company_parent ON public.products(company_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_products_company_level ON public.products(company_id, level);

-- ============================================
-- Step 4: Create helper functions
-- ============================================

-- Function to calculate product level
CREATE OR REPLACE FUNCTION calculate_product_level(product_parent_id UUID)
RETURNS INTEGER AS $$
DECLARE
  calculated_level INTEGER;
BEGIN
  IF product_parent_id IS NULL THEN
    RETURN 0;
  ELSE
    SELECT COALESCE(level, 0) + 1 INTO calculated_level
    FROM public.products
    WHERE id = product_parent_id;
    
    RETURN COALESCE(calculated_level, 0);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to set product level automatically
CREATE OR REPLACE FUNCTION set_product_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS DISTINCT FROM OLD.parent_id OR OLD IS NULL THEN
    NEW.level := calculate_product_level(NEW.parent_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent circular references
CREATE OR REPLACE FUNCTION check_product_no_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
  current_id UUID;
  parent_id_check UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'A product cannot be its own parent';
  END IF;
  
  current_id := NEW.parent_id;
  
  FOR i IN 1..100 LOOP
    SELECT parent_id INTO parent_id_check
    FROM public.products
    WHERE id = current_id;
    
    IF parent_id_check IS NULL THEN
      RETURN NEW;
    END IF;
    
    IF parent_id_check = NEW.id THEN
      RAISE EXCEPTION 'Circular reference detected: product cannot be an ancestor of itself';
    END IF;
    
    current_id := parent_id_check;
  END LOOP;
  
  RAISE EXCEPTION 'Product hierarchy too deep (max 100 levels) or circular reference detected';
END;
$$ LANGUAGE plpgsql;

-- Function to ensure parent belongs to same company
CREATE OR REPLACE FUNCTION check_product_parent_same_company()
RETURNS TRIGGER AS $$
DECLARE
  parent_company_id UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT company_id INTO parent_company_id
  FROM public.products
  WHERE id = NEW.parent_id;
  
  IF parent_company_id IS NULL THEN
    RAISE EXCEPTION 'Parent product does not exist';
  END IF;
  
  IF parent_company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Parent product must belong to the same company';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 5: Create triggers
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON public.products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

DROP TRIGGER IF EXISTS trigger_set_product_level ON public.products;
CREATE TRIGGER trigger_set_product_level
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_level();

DROP TRIGGER IF EXISTS trigger_check_product_circular_reference ON public.products;
CREATE TRIGGER trigger_check_product_circular_reference
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_no_circular_reference();

DROP TRIGGER IF EXISTS trigger_check_product_parent_company ON public.products;
CREATE TRIGGER trigger_check_product_parent_company
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_parent_same_company();

-- ============================================
-- Step 6: Update existing products to set level = 0 if NULL
-- ============================================
UPDATE public.products
SET level = 0
WHERE level IS NULL OR parent_id IS NULL;

-- ============================================
-- Step 7: Recalculate levels for existing products with parents
-- ============================================
-- This updates all products that have parents to have the correct level
DO $$
DECLARE
  product_record RECORD;
  new_level INTEGER;
BEGIN
  FOR product_record IN 
    SELECT id, parent_id 
    FROM public.products 
    WHERE parent_id IS NOT NULL
  LOOP
    new_level := calculate_product_level(product_record.parent_id);
    UPDATE public.products
    SET level = new_level
    WHERE id = product_record.id;
  END LOOP;
END $$;

-- ============================================
-- Verification
-- ============================================
SELECT 
  'Products table altered successfully!' AS status,
  COUNT(*) AS total_products,
  COUNT(*) FILTER (WHERE parent_id IS NULL) AS root_products,
  COUNT(*) FILTER (WHERE parent_id IS NOT NULL) AS child_products,
  MAX(level) AS max_level
FROM public.products;
