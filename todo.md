# Acervus — TODO

## Schema & Database
- [x] Define books, library_members, loans tables in drizzle/schema.ts
- [x] Generate and apply migration SQL
- [x] Add seed data script with sample books, members, and loans

## Backend (tRPC)
- [x] Books router: list, getById, create, update, delete, search
- [x] Library members router: list, getById, create, update, delete, search
- [x] Loans router: list, getById, create, registerReturn, update, delete, getStats
- [x] Dashboard stats procedure: total books, users, active loans, overdue loans
- [x] db.ts helpers for all entities

## Frontend
- [x] Global CSS: Ceará color palette, glassmorphism tokens, Inter font, animations
- [x] Update DashboardLayout with sidebar nav (Dashboard, Books, Users, Loans)
- [x] Dashboard page: stat cards, recent activity feed, charts
- [x] Books page: table with search/filter, add/edit/delete modals
- [x] Users (library members) page: table with search/filter, add/edit/delete modals
- [x] Loans page: table with tabs (active/overdue/returned), create loan, register return modals
- [x] Framer Motion page transitions and list animations
- [x] Skeleton loading states
- [x] Mobile-responsive sidebar with hamburger menu

## Testing
- [x] Vitest tests for books, members, and loans routers

## Polish
- [x] Seed data ready to run
- [x] README updated
