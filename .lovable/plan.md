## Research Methods – Revision App

A PWA for ND/undergrad students to revise Research Methods via flashcards. Access is gated by codes issued by admins after offline agent payment. No password sign-in (full name + code). 400+ seeded cards across 12 topics.

### Stack
- TanStack Start + React + TypeScript (project template)
- Tailwind v4 + design tokens in `src/styles.css`
- Lovable Cloud (Supabase) for DB, auth, storage, email
- KaTeX for LaTeX rendering
- `vite-plugin-pwa` for offline shell + IndexedDB card cache

### Design tokens (added to `src/styles.css`)
- `--primary` Royal Blue `#1565C0`, `--primary-foreground` white
- `--background` Deep Navy `#0A1929` (dark sections) / white (cards)
- `--accent` Purple `#7B1FA2`, `--ring` Light Blue `#90CAF9`
- Card: white, radius 12px, soft shadow, purple hover border
- Typography: Inter (body) + Poppins (headings)
- WCAG AA contrast enforced

### Routes
- `/` Landing (hero, how-it-works, pricing, trust badges, sample-card modal)
- `/request-access` Three-field form → inserts row in `access_requests`
- `/signin` Full name + code + remember me
- `/dashboard` Topic grid w/ progress, difficulty distribution
- `/dashboard/topic/$id` Flip cards w/ KaTeX + screenshot protection
- `/profile` Read-only user details + support link
- `/support` Ticket form
- `/admin/login` Separate admin auth
- `/admin` Tabs: Requests, Codes, Agent, Pricing, Users, Tickets, Cards, Settings

### Database (Lovable Cloud)
Tables: `access_requests`, `app_users`, `topics`, `cards`, `card_progress`, `support_tickets`, `agent_settings`, `pricing_settings`, `user_roles` (admin role via security-definer `has_role`), `app_settings`.

RLS:
- Cards/topics readable by authenticated users (after code redemption sets a session)
- `access_requests` insert by anon, select/update by admin only
- `support_tickets` insert by user, select/update by admin
- Admin tables guarded via `has_role(auth.uid(),'admin')`

Auth model: Since sign-in is name+code (not email/password), we'll use Supabase Auth under the hood by mapping `access_code → email-shaped synthetic credential`, OR create a server-fn that validates name+code against `app_users` and issues a signed session cookie. **Going with**: server-fn `redeemCode` that verifies in DB, then signs in via Supabase Auth using a deterministic synthetic email (`<code>@rm.local`) + hashed code as password (created at approval time). User never sees this. Admin uses real email/password on `/admin/login`.

### Email
Use Lovable Cloud's native email (no Resend/SMTP). When admin approves a request: generate code `RM-XXXX-YYYY`, create synthetic auth user, insert into `app_users`, and send templated email to the requester via platform email infra. Same channel powers ticket replies.

### Seeding
Bundle a `seed-cards.ts` migration with all 12 topics and 400+ cards (Q/A, difficulty, order_index). Content is plain text + LaTeX `$...$` blocks, no asterisks/emojis.

> Note: I cannot pull from a "merged PR" — I'll seed a curated 400+ card set covering the 12 topics listed. Admin can edit/add later via Card Content Management.

### PWA / Offline
- `vite-plugin-pwa` with Workbox
- Pre-cache app shell + key routes
- `networkFirst` for card API → falls back to IndexedDB
- Banner "You are offline. Cached cards available." instead of blank page
- Manifest: 192/512 PNG (maskable), name "Research Methods", theme `#0A1929`
- Registration guarded against Lovable preview iframes

### Screenshot protection
Global `user-select:none`, blocked contextmenu, keydown handlers for Ctrl+P/S/C/PrintScreen, diagonal watermark overlay with user's name.

### Admin dashboard
Each tab fully wired with list + CRUD via server functions. Approve flow: generates code → creates synthetic user → sends email → marks row approved.

### Build order
1. Enable Lovable Cloud + migrations (schema + seed)
2. Design tokens + Layout shell + Header/Footer
3. Landing + sample modal
4. Request Access + Sign In + admin login
5. Dashboard + Topic/Card viewer + KaTeX + screenshot guard
6. Profile + Support
7. Admin dashboard (all 8 tabs)
8. PWA + offline banner + logo manifest
9. QA pass (contrast, back buttons, offline test)

### Out of scope / clarifications
- No payment gateway (by design)
- Sample preview = first 5 cards of "Foundations of Research", no login
- Codes never expire; remember-me = 30-day persisted session
- "Massive cards merge" content isn't accessible to me — I'll generate a high-quality 400+ card seed set. You can later replace/edit via the admin Card Content tab.

This is a multi-day build. Shall I proceed end-to-end, or would you like me to ship it in phases (e.g., Phase 1: schema + landing + auth + dashboard + cards; Phase 2: admin + PWA + polish)?