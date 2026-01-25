-- SQL Script to Create/Alter Products Table with Self-Referencing Hierarchy (Adjacency List)
-- This implements a tree structure where products can have parent-child relationships

-- ============================================
-- Step 1: Create products table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  parent_id UUID NULL,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  description TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT fk_products_company FOREIGN KEY (company_id) 
    REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_products_parent FOREIGN KEY (parent_id) 
    REFERENCES public.products(id) ON DELETE SET NULL
);

-- ============================================
-- Step 2: Add columns if table already exists
-- ============================================
-- These ALTER statements are safe to run even if columns already exist
-- They will only add missing columns

-- Add parent_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN parent_id UUID NULL;
  END IF;
END $$;

-- Add level if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'level'
  ) THEN
    ALTER TABLE public.products ADD COLUMN level INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add description if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.products ADD COLUMN description TEXT NULL;
  END IF;
END $$;

-- Add created_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Add updated_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- Step 3: Add foreign key constraints if they don't exist
-- ============================================

-- Add company_id foreign key if it doesn't exist
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
  END IF;
END $$;

-- Add parent_id foreign key (self-referencing) if it doesn't exist
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
  END IF;
END $$;

-- ============================================
-- Step 4: Create indexes for better query performance
-- ============================================

-- Index on company_id (most queries will filter by company)
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- Index on parent_id (for finding children of a product)
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_id);

-- Index on level (for filtering by hierarchy level)
CREATE INDEX IF NOT EXISTS idx_products_level ON public.products(level);

-- Composite index for common queries (company + parent)
CREATE INDEX IF NOT EXISTS idx_products_company_parent ON public.products(company_id, parent_id);

-- Composite index for company + level queries
CREATE INDEX IF NOT EXISTS idx_products_company_level ON public.products(company_id, level);

-- ============================================
-- Step 5: Create function to automatically update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON public.products;
CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- ============================================
-- Step 6: Create function to automatically calculate level based on parent
-- ============================================
-- This function calculates the level of a product based on its parent
CREATE OR REPLACE FUNCTION calculate_product_level(product_parent_id UUID)
RETURNS INTEGER AS $$
DECLARE
  calculated_level INTEGER;
BEGIN
  IF product_parent_id IS NULL THEN
    -- Root level product
    RETURN 0;
  ELSE
    -- Get parent's level and add 1
    SELECT COALESCE(level, 0) + 1 INTO calculated_level
    FROM public.products
    WHERE id = product_parent_id;
    
    RETURN COALESCE(calculated_level, 0);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 7: Create trigger to automatically set level when parent_id changes
-- ============================================
CREATE OR REPLACE FUNCTION set_product_level()
RETURNS TRIGGER AS $$
BEGIN
  -- If parent_id is being set or changed, calculate the level
  IF NEW.parent_id IS DISTINCT FROM OLD.parent_id OR OLD IS NULL THEN
    NEW.level := calculate_product_level(NEW.parent_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set level
DROP TRIGGER IF EXISTS trigger_set_product_level ON public.products;
CREATE TRIGGER trigger_set_product_level
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_level();

-- ============================================
-- Step 8: Add constraint to prevent circular references
-- ============================================
-- This prevents a product from being its own parent or creating cycles
CREATE OR REPLACE FUNCTION check_product_no_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
  current_id UUID;
  parent_id_check UUID;
BEGIN
  -- If no parent, no circular reference possible
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Prevent product from being its own parent
  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'A product cannot be its own parent';
  END IF;
  
  -- Check for circular references by traversing up the tree
  current_id := NEW.parent_id;
  
  -- Traverse up to 100 levels (safety limit)
  FOR i IN 1..100 LOOP
    SELECT parent_id INTO parent_id_check
    FROM public.products
    WHERE id = current_id;
    
    -- If we reach NULL, no circular reference
    IF parent_id_check IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- If we find the new product's ID in the chain, it's a circular reference
    IF parent_id_check = NEW.id THEN
      RAISE EXCEPTION 'Circular reference detected: product cannot be an ancestor of itself';
    END IF;
    
    current_id := parent_id_check;
  END LOOP;
  
  -- If we've traversed 100 levels, something is wrong
  RAISE EXCEPTION 'Product hierarchy too deep (max 100 levels) or circular reference detected';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent circular references
DROP TRIGGER IF EXISTS trigger_check_product_circular_reference ON public.products;
CREATE TRIGGER trigger_check_product_circular_reference
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_no_circular_reference();

-- ============================================
-- Step 9: Add constraint to ensure parent belongs to same company
-- ============================================
CREATE OR REPLACE FUNCTION check_product_parent_same_company()
RETURNS TRIGGER AS $$
DECLARE
  parent_company_id UUID;
BEGIN
  -- If no parent, no check needed
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get parent's company_id
  SELECT company_id INTO parent_company_id
  FROM public.products
  WHERE id = NEW.parent_id;
  
  -- Check if parent exists and belongs to same company
  IF parent_company_id IS NULL THEN
    RAISE EXCEPTION 'Parent product does not exist';
  END IF;
  
  IF parent_company_id != NEW.company_id THEN
    RAISE EXCEPTION 'Parent product must belong to the same company';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure parent belongs to same company
DROP TRIGGER IF EXISTS trigger_check_product_parent_company ON public.products;
CREATE TRIGGER trigger_check_product_parent_company
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_parent_same_company();

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the table structure:

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'products';

-- Check constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
AND table_name = 'products';
