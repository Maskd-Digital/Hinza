# External app ingestion guide (Facility equipment complaints)

This guide is for an **external application developer** integrating with Hinza to ingest **facility equipment complaints** (machinery / equipment) and drive the workflow:

**Facility Manager → (Escalate) → QA Manager assigns → QA Executive works → QA Manager verifies**

The implementation in this repo uses:

- New tables: `facility_equipment`, `facility_manager_assignments`
- New complaint columns: `complaints.equipment_id`, `complaints.facility_escalated_at`, `complaints.facility_escalated_by`
- API endpoints under `/api/*`

---

## Authentication

All endpoints require authentication.

If you authenticate in your external app and call the API using a token, send:

```http
Authorization: Bearer <access_token>
```

---

## Permissions / roles required

- **Create equipment complaint (ingestion)**: `facility_complaints:create` (or `complaints:create`)
- **Read equipment registry**: `facility_equipment:read`
- **Read FM inbox / facility-scoped complaints**: `facility_complaints:read` + role name **Facility Manager**
- **Escalate to QA**: `facility_complaints:escalate` + role name **Facility Manager**

Notes:

- Company scoping is enforced: for non-system-admin users, `company_id` in requests must match the user’s company.
- Facility Manager access is **per-facility**, based on `facility_manager_assignments`.

---

## Core data model (how ingestion should map)

### Equipment registry (`facility_equipment`)

Each equipment record belongs to:

- a company (`company_id`)
- a facility (`facility_id`)

The external app should **select equipment** from this registry when creating an equipment complaint.

### Facility Manager scope (`facility_manager_assignments`)

Facility Managers are assigned to facilities via rows:

- `facility_manager_assignments(company_id, user_id, facility_id)`

This determines what the Facility Manager can see and escalate.

### Equipment complaint (`complaints`)

A complaint is treated as an **equipment complaint** when:

- `complaints.equipment_id IS NOT NULL`

Pre-escalation equipment complaints are **not shown to QA workspace lists** until the Facility Manager escalates.

---

## Step-by-step integration flow

### 1) List facilities for a company

```http
GET /api/facilities?company_id=<company_uuid>
```

Use the `id` from a facility record as `facility_id`.

### 2) List equipment for a facility

```http
GET /api/facility-equipment?company_id=<company_uuid>&facility_id=<facility_uuid>
```

Use the `id` from an equipment record as `equipment_id`.

### 3) Create an equipment complaint (ingestion)

```http
POST /api/complaints
Content-Type: application/json
```

Body (minimum):

```json
{
  "company_id": "COMPANY_UUID",
  "facility_id": "FACILITY_UUID",
  "equipment_id": "EQUIPMENT_UUID",
  "title": "Machine vibration above threshold"
}
```

Optional fields:

```json
{
  "description": "Observed abnormal vibration on Line 2 motor.",
  "priority": "low | medium | high",
  "template_id": "TEMPLATE_UUID"
}
```

Validation enforced server-side:

- `equipment_id` must belong to the given `company_id`
- `equipment_id` must belong to the given `facility_id`

Success:

- HTTP **201**
- Returns created complaint JSON (includes `id`)

Store `complaint.id`.

### 4) Facility Manager inbox (optional UI for FM user)

List equipment complaints for the logged-in Facility Manager’s **assigned facilities**:

```http
GET /api/complaints?company_id=<company_uuid>&facility_manager_scope=1
```

Only show “awaiting escalation”:

```http
GET /api/complaints?company_id=<company_uuid>&facility_manager_scope=1&pending_escalation_only=1
```

### 5) Escalate to QA (Facility Manager action)

```http
POST /api/complaints/<complaint_id>/facility-escalate
```

This sets:

- `facility_escalated_at = now`
- `facility_escalated_by = <facility_manager_user_id>`

And notifies QA Managers.

Common error codes:

- **400**: complaint is not an equipment complaint (missing `equipment_id`) or missing facility
- **403**: user not authorized for that facility / missing permission
- **404**: complaint not found
- **409**: already escalated

### 6) QA workspace list visibility

QA pages in this repo call:

```http
GET /api/complaints?company_id=<company_uuid>&qa_workspace=1
```

Behavior:

- QA workspace hides equipment complaints **until** `facility_escalated_at` is set.
- After escalation, the complaint is visible for QA Manager assignment and QA Executive handling.

### 7) Fetch complaint detail

```http
GET /api/complaints/<complaint_id>
```

Authorization behavior:

- Facility Managers can access only equipment complaints for facilities they’re assigned to.
- QA Manager / QA Executive cannot access **pre-escalation** equipment complaints.

---

## Example cURL snippets

### Create an equipment complaint

```bash
curl -X POST "$BASE_URL/api/complaints" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "company_id": "COMPANY_UUID",
    "facility_id": "FACILITY_UUID",
    "equipment_id": "EQUIPMENT_UUID",
    "title": "Machine vibration above threshold",
    "description": "Observed abnormal vibration on Line 2 motor.",
    "priority": "high"
  }'
```

### Escalate (Facility Manager)

```bash
curl -X POST "$BASE_URL/api/complaints/COMPLAINT_UUID/facility-escalate" \\
  -H "Authorization: Bearer $TOKEN"
```

---

## Implementation notes (for debugging)

- Equipment complaints are identified by **`equipment_id != null`**.
- The “QA-visible” gate is **`facility_escalated_at != null`**.
- Per-facility scope for Facility Managers comes from **`facility_manager_assignments`**.

