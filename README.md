# Green Valley Apartments — Society Manager

A maintenance billing & society management app for a 60-flat apartment community: monthly bills, UPI QR payments, expense tracking, digital notice board, visitor management, amenity booking, emergency SOS alerts, complaints, and a rule-based AI assistant.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (Postgres + PostgREST, no auth — see *Security model* below).

---

## ⚠️ Before you run this: apply the new database migration

This project talks to a live Supabase project (see `.env`). Two migrations ship in `supabase/migrations/`:

| File | What it does |
|---|---|
| `20260829045158_apartment_management_schema.sql` | Creates all tables + RLS policies (already existed) |
| `20260830060000_seed_demo_data.sql` | **New.** Seeds 60 units, society settings, amenities, notices, two months of bills/payments, expenses, visitors, complaints, and one resolved SOS alert |

Without the second file, every screen in the app is empty (no units, no settings) — that was the single biggest thing missing. **I could not run this migration for you**: this sandbox's network is locked to package registries only and cannot reach `supabase.co`. You'll need to run it yourself, which takes about a minute:

1. Open your project at [supabase.com/dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Open `supabase/migrations/20260830060000_seed_demo_data.sql` from this project, copy its contents, paste into a new query, and click **Run**.
   *(Alternatively, if you use the Supabase CLI and have it linked: `supabase db push`.)*
3. Refresh the app — Dashboard, Billing, Units etc. should now be full of data.

It's safe to run more than once — it checks whether `units` already has rows and does nothing if so.

I tested both migration files end-to-end against a real local PostgreSQL instance (schema → seed → re-run for idempotency) before shipping this, so this should apply cleanly.

---

## What I changed

I read through the whole codebase, ran `typecheck`/`lint`/`build`, and fixed what I found:

### Fixed bugs
- **TypeScript compile error** in `App.tsx` — `UnitSelector` used an ad-hoc inline type instead of the real `Unit` type, so `setCurrentUnit` didn't type-check.
- **9 ESLint errors** (unused imports/variables) across `Amenities`, `Assistant`, `Billing`, `Complaints`, `Expenses`, `Payments`, `SOS` — fixed by either removing the dead code or, where it looked like an unfinished feature, actually building it (see below).
- **`eslint` / `typescript-eslint` version mismatch** — running `npm audit fix` for a `ws` vulnerability upgraded `eslint` to 9.39 without upgrading `typescript-eslint`, which broke `npm run lint` entirely (internal crash). Bumped `typescript-eslint` to a compatible version.
- A stray `&middot;` inside a JS template string in `Complaints.tsx` would have rendered as the literal text "&middot;" instead of "·" — template strings don't decode HTML entities the way JSX text does.
- `Units.tsx` used `window.location.reload()` after adding/editing a unit. Replaced with a proper state refresh (`refreshUnits()` in context) so the app doesn't lose its place.

### Built features that were designed but never finished
- **Settings page (new).** The database and types already had a full `society_settings` schema (UPI ID, bank details, billing rate, late fee, due day) and every other page depended on it — but there was no screen to actually edit it. Added one, admin-only, under a new "Settings" nav item.
- **Overdue detection & late fees (new: `src/lib/billing.ts`).** `late_fee_per_day` existed in the schema and types but was never read anywhere in the app, and nothing ever transitioned a bill from `pending` to `overdue`. There's no server-side cron in this architecture, so this runs once per app load: it finds bills past their due date, marks them `overdue`, and accrues the late fee.
- **Partial payments.** The `'partial'` bill status existed in the type/schema but was dead — recording a payment smaller than the bill only did nothing. `recordPayment` now sums prior payments against a bill and correctly marks it `paid` or `partial`; the UI shows the remaining balance due (not the original total) once a partial payment exists.
- **Admin can log an SOS alert on a resident's behalf** (e.g. someone calls the office instead of using the app) — the unit selector reuses the existing trigger flow.
- **Search/filter added to Complaints and Visitors**, matching the pattern already used in Billing/Payments/Units, for consistency once a society has 60 units' worth of data.
- **Resident view is now scoped to "my unit"** in Complaints, Visitors, and SOS history (it already worked this way in Billing/Payments) — a resident no longer sees every other unit's complaints, visitor logs, and past emergency alerts by default. Active SOS alerts still broadcast to everyone, which is intentional.
- **AI Assistant is now role-aware.** Admins can ask things like "how much collected this month", "which units are overdue", "how many units do we have" — previously the fetched `role` was unused.
- Error handling: every insert/update in the app now checks for a Supabase error and shows an inline message instead of silently doing nothing on failure.
- Minor: page title/favicon replaced the generic Vite starter defaults; bill/receipt downloads use the society's actual configured name instead of a hardcoded one.

### Left as-is, deliberately
- **No authentication.** The schema's own comments document this as intentional — a single shared dataset with a UI-level admin/resident toggle, not real access control. Adding real auth would be a significant architecture change beyond "completing" what's here; happy to do it if you want it, but didn't want to assume.
- **`npm audit`** still flags one moderate, dev-only advisory in `esbuild` (used by Vite's dev server). The fix requires Vite 8, a breaking major-version jump I didn't want to force without testing. Not a production risk — `esbuild` isn't in your shipped bundle.

---

## Running locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run lint
npm run build       # outputs to dist/
```

---

## Project structure

```
src/
  components/    Sidebar, shared UI primitives (Card, Button, Modal, Input, Select…)
  context/       AppContext — role, current unit, units list, society settings
  lib/           supabase client, billing.ts (overdue reconciliation), formatting utils
  pages/         one file per nav section (Dashboard, Billing, Payments, Units,
                 Visitors, Amenities, SOS, Complaints, Notices, Expenses,
                 Assistant, Settings)
  types/         shared TypeScript types, mirroring the DB schema
supabase/
  migrations/    schema + seed data SQL
```
