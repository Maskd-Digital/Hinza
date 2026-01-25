# API Contracts

This document defines the API contracts for the Hinza Complaint Management System. These contracts should be implemented in the backend.

## Authentication

### POST /auth/login
Authenticate a user and return a session token.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "role": "superadmin | company_admin | management | qa_manager | qa_executive | employee",
    "company_id": "string | null",
    "facilities": ["string"],
    "is_active": boolean
  },
  "access_token": "string",
  "expires_at": number
}
```

## Companies

### GET /api/companies
Get all companies (superadmin only).

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "status": "active | inactive",
    "created_at": "string",
    "updated_at": "string"
  }
]
```

### GET /api/companies/:id
Get a specific company by ID.

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "status": "active | inactive",
  "created_at": "string",
  "updated_at": "string"
}
```

### POST /api/companies
Create a new company (superadmin only).

**Request:**
```json
{
  "name": "string",
  "admin_email": "string",
  "admin_name": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "status": "active",
  "created_at": "string",
  "updated_at": "string"
}
```

### PATCH /api/companies/:id
Update a company (superadmin only).

**Request:**
```json
{
  "name": "string (optional)",
  "status": "active | inactive (optional)"
}
```

### DELETE /api/companies/:id
Delete a company (superadmin only).

## Users

### GET /api/users
Get all users. Company admins only see users from their company.

**Query Parameters:**
- `company_id` (optional): Filter by company ID

**Response:**
```json
[
  {
    "id": "string",
    "email": "string",
    "role": "string",
    "company_id": "string | null",
    "facilities": ["string"],
    "is_active": boolean,
    "created_at": "string",
    "updated_at": "string"
  }
]
```

### GET /api/users/:id
Get a specific user by ID.

### POST /api/users/invite
Invite a new user (superadmin or company_admin).

**Request:**
```json
{
  "email": "string",
  "name": "string",
  "role": "string",
  "company_id": "string",
  "facility_ids": ["string"] (optional)
}
```

### PATCH /api/users/:id
Update a user.

**Request:**
```json
{
  "name": "string (optional)",
  "role": "string (optional)",
  "facility_ids": ["string"] (optional),
  "is_active": boolean (optional)
}
```

### DELETE /api/users/:id
Deactivate a user (soft delete).

## Database Schema Requirements

### companies
- `id` (uuid, primary key)
- `name` (text, required)
- `status` (enum: 'active', 'inactive', default: 'active')
- `created_at` (timestamp)
- `updated_at` (timestamp)

### users
- `id` (uuid, primary key, references auth.users)
- `email` (text, required, unique)
- `role` (enum, required)
- `company_id` (uuid, foreign key to companies)
- `facilities` (array of uuid)
- `is_active` (boolean, default: true)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Row Level Security (RLS)
- Companies: Only superadmin can access all companies
- Users: Users can only see users from their own company (unless superadmin)
- Company admins can manage users within their company
