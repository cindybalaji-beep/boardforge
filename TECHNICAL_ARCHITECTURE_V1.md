# V1 Technical Architecture Spec

## Architecture Goals
- Ship quickly with low operational overhead.
- Support high-customization projects and reliable print assets.
- Keep payments and shipping integrations modular.

## Confirmed Launch Decisions
- Primary launch persona: hobbyists and board-game enthusiasts.
- MVP template inspirations: Cards Against Humanity, Catan, Ticket to Ride, Uno.
- Payment processor: Stripe.
- Shipping API: Shippo.

## V1 Stack
- Frontend: Next.js + TypeScript.
- API: Next.js API routes (or Node.js service later if needed).
- Database: PostgreSQL.
- Storage: S3-compatible object storage for uploaded media and print bundles.
- Jobs: Redis + BullMQ for async workflows.
- Notifications: Email provider (Resend/SendGrid), optional SMS later.

## High-Level Components
- Customer UI (design + checkout)
- Admin UI (orders + operations)
- API service (projects, pricing, order lifecycle)
- Worker service (print file generation, shipping label tasks)
- External providers (Stripe and Shippo)

## Core Data Model
- `User(id, email, name, created_at)`
- `Project(id, user_id, title, template_type, theme_config_json, status, current_version, created_at, updated_at)`
- `ProjectAsset(id, project_id, asset_type, storage_key, width, height, validation_status)`
- `ProjectVersion(id, project_id, version_number, config_snapshot_json, print_bundle_key, proof_approved_at)`
- `Order(id, user_id, project_version_id, subtotal, tax, shipping_cost, total, currency, status, gift_note, created_at)`
- `Address(id, order_id, address_type, full_name, line1, line2, city, state, postal_code, country, phone)`
- `Payment(id, order_id, stripe_checkout_session_id, stripe_payment_intent_id, amount, status, paid_at)`
- `Shipment(id, order_id, shippo_shipment_id, shippo_transaction_id, carrier, service_level, label_url, tracking_number, eta_date, status)`

## API Surface (V1)
- `POST /api/projects`
- `PATCH /api/projects/:projectId`
- `POST /api/projects/:projectId/assets`
- `POST /api/projects/:projectId/validate`
- `POST /api/projects/:projectId/proof-approve`
- `GET /api/games/search?q=...`
- `POST /api/pricing/quote`
- `POST /api/shipping/rates`
- `POST /api/checkout/session`
- `POST /api/webhooks/stripe`
- `POST /api/webhooks/shippo`
- `GET /api/orders/:orderId/tracking`

## Order Lifecycle
1. User edits a project and uploads assets.
2. System validates print-readiness.
3. User approves proof (project version locked).
4. Checkout session is created in Stripe.
5. Stripe webhook confirms payment; order becomes `paid`.
6. Worker prepares production files; order moves to `in_production`.
7. Post-production, Shippo label is purchased and tracking is stored.
8. Tracking webhooks move order through `shipped` to `delivered`.

## Stripe Integration Notes
- Use Stripe Checkout for speed and PCI safety.
- Store `checkout_session_id` and `payment_intent_id`.
- Use webhook signature verification.
- Treat webhook events as source of truth for payment status.

## Shippo Integration Notes
- Quote shipping rates based on recipient address and package profile.
- Persist selected service level before final payment.
- Purchase label after production handoff.
- Persist `tracking_number`, `label_url`, and delivery state.

## Reliability and Security Baseline
- Verify Stripe/Shippo webhook signatures.
- Use idempotency for checkout creation and webhook handlers.
- Use pre-signed upload URLs for large media assets.
- Enforce role-based access in admin routes.
- Add database backups and basic operational alerts.

## Operational SLA (MVP)
- Production turnaround target (internal): 2-4 business days.
- Customer-facing promise windows:
  - Economy: 5-8 business days total.
  - Standard: 4-6 business days total.
  - Expedited: 2-4 business days total.
- Include a 1-day safety buffer in promised dates.
