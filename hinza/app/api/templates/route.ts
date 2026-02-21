import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserWithRoles } from '@/lib/auth/get-user-with-roles';
import { CreateTemplateInput } from '@/types/template';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRoles();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Fetch templates directly from complaint_master_templates by company_id
    const { data: templates, error: templatesError } = await adminClient
      .from('complaint_master_templates')
      .select('id, name, description, company_id, fields')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (templatesError) {
      return NextResponse.json(
        { error: `Failed to fetch templates: ${templatesError.message}` },
        { status: 500 }
      );
    }

    // Also fetch company_complaint_types for backward compatibility
    const { data: companyTypes } = await adminClient
      .from('company_complaint_types')
      .select('id, name, source_template_id')
      .eq('company_id', companyId);

    // Map templates to the expected response format
    const templatesWithFields = (templates || []).map((template) => {
      // Extract and sort fields from JSONB column
      let fields: any[] = [];
      if (template.fields && Array.isArray(template.fields)) {
        fields = template.fields.sort(
          (a: any, b: any) => (a.field_order || 0) - (b.field_order || 0)
        );
      }

      // Find corresponding company_complaint_type if it exists
      const companyType = companyTypes?.find(
        (ct) => ct.source_template_id === template.id
      );

      return {
        id: companyType?.id || template.id, // Use company_complaint_type id if exists, otherwise template id
        name: template.name,
        description: template.description || null,
        source_template_id: template.id,
        fields: fields.map((field) => ({
          id: field.id || null, // id may not exist in migrated data
          field_name: field.field_name,
          field_type: field.field_type,
          is_required: field.is_required,
          field_order: field.field_order,
          options: field.options || [],
        })),
      };
    });

    return NextResponse.json(templatesWithFields);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRoles();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTemplateInput = await request.json();
    const adminClient = createAdminClient();

    // Check if template with same name already exists for this company
    const { data: existingTemplate } = await adminClient
      .from('complaint_master_templates')
      .select('id, name')
      .eq('company_id', body.company_id)
      .eq('name', body.name)
      .single();

    if (existingTemplate) {
      return NextResponse.json(
        { error: `A template with the name "${body.name}" already exists for this company` },
        { status: 409 }
      );
    }

    // Prepare fields as JSONB array
    const fieldsJsonb = body.fields && body.fields.length > 0
      ? body.fields.map((field) => ({
          field_name: field.field_name,
          field_type: field.field_type,
          is_required: field.is_required,
          field_order: field.field_order,
          options: field.field_type === 'select' && field.options ? field.options : [],
        }))
      : [];

    // Create master template with fields stored as JSONB
    const { data: masterTemplate, error: templateError } = await adminClient
      .from('complaint_master_templates')
      .insert({
        name: body.name,
        description: body.description || null,
        company_id: body.company_id,
        fields: fieldsJsonb as any,
      })
      .select()
      .single();

    if (templateError) {
      if (templateError.code === '23505' || templateError.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: `A template with the name "${body.name}" already exists for this company` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Failed to create template: ${templateError.message}` },
        { status: 500 }
      );
    }

    // Then create company-specific complaint type
    const { data: companyType, error: typeError } = await adminClient
      .from('company_complaint_types')
      .insert({
        company_id: body.company_id,
        name: body.name,
        source_template_id: masterTemplate.id,
      })
      .select()
      .single();

    if (typeError) {
      return NextResponse.json(
        { error: `Failed to create company type: ${typeError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(companyType, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}