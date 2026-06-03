## Scope (in order)

### 1. Global polish (touches everything)
- Replace every em-dash `—` with hyphen `-` across all routes/components/templates.
- Remove all references to "Demo Student" and the `DEMO-1234-5678` code from copy. Keep the seeded user row in the DB so existing demos still work; only scrub the UI text.
- Add Tuscan/Italian flavor to landing page:
  - Italian italic quote under hero: « La dolce revisione - studiare come un'arte. »
  - Subline: UN'EDIZIONE ARTIGIANALE · ITALIAN-CRAFTED STUDY EXPERIENCE
  - Espresso divider (warm gold/brown rule with a coffee-bean dot) between sections
  - Proverb under final CTA: « Chi va piano, va sano e va lontano. »
  - Gold seal in footer: "Forgiato a mano da Ultimate_Developers · Bottega Digitale · MMXXVI"
- Restructure landing to match reference: dark navy background, centered hero, "Built from real National Diploma past papers" pill above quote, gradient headline "Stop re-reading notes. / Start passing Research Methods.", trust chips row, large feature card section ("You already know what's coming"), stats tiles.
- Add `--gold` token for the Tuscan accents (warm amber `oklch(0.78 0.13 80)`).

### 2. Admin dashboard
New route tree under `/admin`:
- `/admin/login` - email + password against `admin_users` (bcrypt-hashed). Sets a separate `rm_admin_session` cookie/localStorage token.
- `/admin` - gated layout with 8 tabs (Requests, Users, Topics, Cards, Tickets, Pricing, Agent, Settings).
  - Requests: list pending access_requests, Approve (generates `RM-XXXX-YYYY`, creates `app_users` row, sends approval email with the code, marks request approved) / Reject.
  - Users: list app_users (search, ban/unban, regenerate code, delete).
  - Topics: CRUD topics (name, slug, description, order).
  - Cards: per-topic CRUD (question, answer with LaTeX, difficulty, order).
  - Tickets: list support_tickets, reply (sends email to user).
  - Pricing: edit individual/group prices.
  - Agent: edit agent name + contact (shown on request page).
  - Settings: misc (toggle screenshot guard, app name).
- New server functions in `src/lib/admin.functions.ts` covering all admin actions, gated by `requireAdminSession` helper.
- Seed one default admin via migration (email asked from user via secrets - default `admin@researchmethods.app` with a temporary password the user can change after first login).

### 3. Email delivery for code approval + ticket replies
- Use Lovable's built-in email infrastructure.
- Prereq: check email domain status. If none configured, surface the email-setup dialog FIRST (user must set up sender domain).
- After domain is configured: scaffold transactional emails (`setup_email_infra` then `scaffold_transactional_email`).
- Create two templates in `src/lib/email-templates/`:
  - `access-approved.tsx` - "Your access code is ready", shows full name, code, sign-in URL.
  - `ticket-reply.tsx` - "Reply to your support ticket", shows admin response + original message.
- Wire admin approve action and ticket-reply action through `sendTransactionalEmail` helper.

### 4. PWA + offline mode
- Install `vite-plugin-pwa` + Workbox.
- Generate high-res app icon (1024x1024 PNG, gold cog/book mark on navy), produce 192/512 variants.
- Manifest: name, short_name, theme_color navy, background_color navy, display standalone, icons.
- SW config: `registerType: autoUpdate`, `devOptions.enabled: false`, NetworkFirst for HTML, CacheFirst for static assets, runtime cache for `/api/*` server-fn responses with IndexedDB fallback for cards.
- Guard registration: skip when in iframe or on lovable preview hosts.
- Add non-intrusive offline banner ("You're offline - cached cards still work").
- Pre-cache the shell + the dashboard route.

### 5. QA
- Build, fix any type/route errors.
- Smoke-test sign-in flow, sample modal, admin login, approve request → email enqueued, PWA manifest served.

## Open questions before I start

1. **Email sender domain**: Lovable transactional emails require a verified sender domain. Do you have a domain ready to use (and which subdomain - e.g. `notify.yourdomain.com`), or should I scaffold the templates + admin wiring now and surface the domain-setup dialog so you can configure it when ready? Emails will only actually deliver once DNS verifies.

2. **Default admin credentials**: For the admin login, what email + temporary password should the seeded admin use? (You can change it later from the admin Settings tab.)

3. **Confirm "Demo Student" handling**: Remove the row entirely from the DB, or keep the row (so old testers can still sign in with the existing code) and only remove every mention of it from the UI/copy? My recommendation: keep the DB row, scrub the UI - zero risk to existing cards/topics.

Once you answer these I'll execute steps 1-5 end-to-end in one pass.