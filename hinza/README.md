# Hinza - Complaint Management System

Web application for managing complaints, companies, users, and facilities with role-based access control.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd hinza
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the `hinza` directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Optional: bucket for complaint photo evidence (defaults to "complaints")
   # NEXT_PUBLIC_SUPABASE_COMPLAINTS_BUCKET=complaints
   ```

4. Set up Supabase:
   - Create the following tables in your Supabase database:
     - `companies`
     - `users`
   - Enable Row Level Security (RLS) policies
   - See `API_CONTRACTS.md` for schema details
   - **Storage (complaint photos):** Create a bucket named `complaints` (or set `NEXT_PUBLIC_SUPABASE_COMPLAINTS_BUCKET`), set it to **Public**, then run `sql/storage_complaints_bucket_policies.sql` in the SQL Editor so the frontend can load images.

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
hinza/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── companies/         # Company management pages
│   ├── users/             # User management pages
│   ├── login/             # Authentication
│   └── dashboard/         # Dashboard
├── features/               # Feature-based modules
│   ├── companies/         # Company feature components
│   ├── users/             # User feature components
│   ├── complaints/        # Complaint management (to be implemented)
│   └── ...
├── lib/                    # Utility libraries
│   ├── supabase/          # Supabase client setup
│   ├── api/               # API functions
│   └── auth/               # Authentication utilities
├── types/                  # TypeScript type definitions
└── middleware.ts          # Next.js middleware for auth
```

## User Roles

- **Superadmin**: Full system access, can manage all companies
- **Company Admin**: Manages users and resources within their company
- **Management**: Can view complaints and reports
- **QA Manager**: Manages complaint assignments and team
- **QA Executive**: Handles assigned complaints
- **Employee**: Can create and view complaints

## Features Implemented

✅ Authentication (login, session management)
✅ Protected routes with middleware
✅ Role-based access control (RBAC)
✅ Company management (CRUD for superadmin)
✅ User management (list, invite, assign roles)

## Features To Be Implemented

- [ ] Facility management
- [ ] Complaint template management
- [ ] Complaint management (CRUD, assignment, resolution)
- [ ] QA Executive features
- [ ] QA Manager features
- [ ] Management dashboards
- [ ] Reports and analytics
- [ ] Audit logging

## API Contracts

See `API_CONTRACTS.md` for detailed API specifications.

## Development

- Run linting: `npm run lint`
- Build for production: `npm run build`
- Start production server: `npm start`

## Notes

- The UI is kept minimal as requested and will be enhanced later
- Backend API contracts are defined but need to be implemented
- User creation/invitation currently uses placeholder logic - needs Supabase Admin API integration
- Company admin creation needs Supabase Auth Admin API integration
