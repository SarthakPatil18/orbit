import type { KnowledgeSource } from "@/lib/types";
import { sid } from "./ids";

export const KNOWLEDGE_SNAPSHOT_VERSION = "kb-2026.11.3";

function source(input: Omit<KnowledgeSource, "id" | "organizationId" | "createdAt" | "updatedAt" | "lastIndexedAt"> & {
  idKey: string;
  indexedDaysAgo?: number;
}): KnowledgeSource {
  const now = new Date();
  const indexed = new Date(now);
  indexed.setDate(indexed.getDate() - (input.indexedDaysAgo ?? 3));
  return {
    id: sid(`source:${input.idKey}`),
    organizationId: "",
    type: input.type,
    title: input.title,
    slug: input.slug,
    version: input.version,
    owner: input.owner,
    authority: input.authority,
    effectiveDate: input.effectiveDate,
    lastIndexedAt: indexed.toISOString(),
    status: input.status,
    summary: input.summary,
    approvedAnswer: input.approvedAnswer,
    body: input.body,
    conflictGroup: input.conflictGroup,
    staleAfterDays: input.staleAfterDays,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function knowledgeSources(): KnowledgeSource[] {
  return [
    source({
      idKey: "getting-started",
      type: "product",
      title: "Getting started with Orbit",
      slug: "getting-started-with-orbit",
      version: "3.2",
      owner: "Onboarding team",
      authority: "canonical",
      effectiveDate: "2026-09-12",
      status: "active",
      summary:
        "Create a club workspace, invite your committee, and publish a first event without a sales call.",
      approvedAnswer:
        "Create your workspace at orbit.club/start with your club name and committee email. Invite owners, managers, and volunteers from Settings → Team. Then open Events → New event, add the date, venue, capacity, and ticket price, and publish when the checklist is complete. Orbit creates the public registration page, confirmation emails, and QR check-in list automatically.",
      body: `## Create your workspace
Start at orbit.club/start. Enter your club or society name, the city your events run in, and an owner email. Orbit creates a Pro trial workspace with the Events, Payments, Attendees, and Check-in modules enabled. You do not need a credit card for the 14-day trial.

## Invite your committee
Open Settings → Team → Invite. Choose a role: owner, manager, or volunteer. Owners manage billing and workspace deletion. Managers run events, exports, and announcements. Volunteers can scan tickets and view the attendee list for events they are assigned to. Invitations expire after seven days.

## Publish your first event
Open Events → New event. Add the event name, date, start time, venue, capacity, and ticket types. A free event can be published immediately. A paid event needs a linked settlement account and a refund policy before Orbit enables the public registration page.

## What carries over
Your workspace keeps events, registrations, attendee records, and message history when you upgrade, downgrade, or pause a plan. Deleting a workspace is a separate, verified action covered in the privacy article.`,
      conflictGroup: null,
      staleAfterDays: 240,
    }),
    source({
      idKey: "creating-editing-events",
      type: "product",
      title: "Creating and editing an event",
      slug: "creating-and-editing-an-event",
      version: "4.0",
      owner: "Product — Events",
      authority: "canonical",
      effectiveDate: "2026-10-02",
      status: "active",
      summary:
        "Draft, publish, and safely edit an event, including capacity, ticket types, and post-publish changes.",
      approvedAnswer:
        "Create an event from Events → New event. You can save a draft at any point. Publishing makes the registration page public and starts confirmation emails. After publishing you can still edit the description, schedule, venue notes, and capacity from Events → [event] → Edit. Changing the price or cancelling the event requires confirmation because registered attendees are notified automatically.",
      body: `## Draft an event
Go to Events → New event. Required fields are event name, date, start time, venue, capacity, and at least one ticket type. Orbit autosaves a draft every 20 seconds. Drafts are visible only to owners, managers, and invited volunteers.

## Publish
Select Publish event when the checklist is green. Orbit checks that a venue is set, capacity is greater than zero, and paid ticket types have a refund policy. Publishing creates the public registration page and sends confirmation emails to existing registrants if the event was previously shared as unlisted.

## Edit after publishing
Open Events → [event] → Edit. Description, venue notes, schedule, and capacity changes apply immediately. Capacity cannot be set below the number of confirmed paid registrations. Price changes and cancellation require a confirmation step and notify registered attendees by email.

## Duplicate or archive
Use Duplicate to copy an event without registrations, payments, or messages. Archive hides an event from the public page while keeping its attendee and payment records available to owners and managers.`,
      conflictGroup: null,
      staleAfterDays: 240,
    }),
    source({
      idKey: "exporting-attendees",
      type: "product",
      title: "Exporting attendees",
      slug: "kb-attendee-export",
      version: "2.4",
      owner: "Product — Registrations",
      authority: "canonical",
      effectiveDate: "2026-10-18",
      status: "active",
      summary:
        "Export a full or filtered attendee CSV, including a paid-only export for finance reconciliation.",
      approvedAnswer:
        "Open Events → Design Summit 2026 → Attendees → Export. In the export drawer, set Payment status to Paid, leave Ticket type on All, and choose Export CSV. Orbit downloads only registrations whose payment status is Paid, including attendee name, email, ticket type, amount paid, payment reference, and check-in status. Pending, failed, refunded, and complimentary registrations are excluded unless you add them back with the status filter.",
      body: `## Open the attendee export
Go to Events, select the event, then open the Attendees tab. Select Export in the top-right corner. Owners and managers can export; volunteers can export only for events they are assigned to and cannot see payment references.

## Export only paid registrations
In the export drawer, set Payment status to Paid. Keep Ticket type on All unless you need a single tier. Choose Export CSV. The file includes attendee name, email, phone, ticket type, amount paid, payment reference, registration date, and check-in status. Pending, failed, refunded, and complimentary registrations are excluded. The export uses the event's current timezone and includes a header row.

## Other export formats
Orbit supports CSV and XLSX. PDF attendee sheets are available from the check-in desk for door volunteers and intentionally omit payment references. Exports over 5,000 rows are emailed as a download link that expires after 24 hours.

## Fix a missing attendee
If a paid attendee is missing, check the payment status in Payments → Transactions. A payment that is still Pending has not settled and will not appear in a Paid export. Do not change a payment status manually; contact support with the payment reference.`,
      conflictGroup: null,
      staleAfterDays: 240,
    }),
    source({
      idKey: "payments-refunds",
      type: "policy",
      title: "Event payments and refunds",
      slug: "event-payments-and-refunds",
      version: "5.1",
      owner: "Finance & Support",
      authority: "canonical",
      effectiveDate: "2026-11-01",
      status: "active",
      summary:
        "How Orbit collects ticket payments, who can refund, settlement timing, and how duplicate charges are handled.",
      approvedAnswer:
        "Orbit collects paid registrations through the club's linked settlement account. Owners and admins can issue a full or partial refund from Payments → Transactions → Refund; the attendee is notified and the refund usually reaches the original payment method in 5–7 business days. Volunteers cannot issue refunds. A duplicate or unrecognised charge needs billing verification against the payment reference, so support will open a billing handoff rather than promise an instant refund.",
      body: `## How payments are collected
Paid registrations are processed through the club's verified settlement account. Orbit shows the gross amount, platform fee, and net settlement for each event. Settlement runs on a T+2 schedule for verified accounts. A registration is Paid only after the payment provider confirms settlement; Pending and Failed registrations never count toward paid revenue.

## Who can issue a refund
Owners and admins can issue a full or partial refund from Payments → Transactions → Refund. Managers can view transactions but cannot move money. Volunteers cannot view payment references or issue refunds. Every refund is written to the audit log with the actor, amount, reason, and timestamp.

## Refund timing
Approved refunds are sent to the original payment method immediately. Banks and UPI providers usually post the credit in 5–7 business days. Orbit cannot guarantee a third-party bank's posting time and will not promise an exact date.

## Duplicate or unrecognised charges
A duplicate charge, a charge the customer does not recognise, or a disputed amount requires verification of the payment reference and the account owner. Support cannot approve or execute a refund from chat. The conversation is routed to the Billing queue with the payment reference, transcript, and the exact claims already made so the customer does not repeat themselves.

## Failed payments
A failed payment does not hold a seat unless the ticket type has a paid hold enabled. Orbit retries eligible failed payments once after 30 minutes. Attendees can retry from the confirmation email.`,
      conflictGroup: "refunds",
      staleAfterDays: 180,
    }),
    source({
      idKey: "plans-billing-cancellation",
      type: "policy",
      title: "Plans, billing, and cancellation",
      slug: "plans-billing-and-cancellation",
      version: "3.6",
      owner: "Finance",
      authority: "canonical",
      effectiveDate: "2026-10-25",
      status: "active",
      summary:
        "Pro pricing, cancellation timing, what remains accessible, data retention, and reactivation.",
      approvedAnswer:
        "Orbit Pro costs ₹2,499 per month or ₹24,990 per year. You can cancel from Settings → Billing → Cancel plan. Pro stays active until the end of the paid period shown on the billing page, then the workspace moves to Free. Events, attendee records, and exports stay available; paid registration and offline check-in are disabled. Orbit keeps workspace data for 90 days after downgrade, and you can reactivate Pro at any time during that window without losing history. Cancelling does not delete your events.",
      body: `## Plans and pricing
Orbit Free supports one active event, up to 100 attendees, email announcements, and online check-in. Orbit Pro is ₹2,499 per month or ₹24,990 per year and adds unlimited active events, paid registrations, offline check-in, advanced exports, and priority support. Prices are in Indian rupees and include applicable platform fees; payment-gateway fees are shown separately.

## Cancel Pro
Open Settings → Billing → Cancel plan. Choose a reason, confirm, and Orbit shows the exact date Pro ends. Cancellation takes effect at the end of the current paid period. Orbit does not delete the workspace at cancellation and does not charge again.

## What happens after Pro ends
The workspace moves to the Free plan. Existing events, registrations, attendee records, announcements, and CSV exports remain available. The workspace can have one active event, paid registration is disabled, and offline check-in is disabled. Attendees can still view published free events.

## Data retention and reactivation
Orbit keeps workspace data for 90 days after a downgrade so you can reactivate. Reactivating Pro during that window restores paid registration, offline check-in, and advanced exports without losing history. After 90 days, data follows the workspace deletion schedule in the privacy article. Cancelling Pro is not the same as deleting a workspace.

## Refunds and billing errors
Cancellation does not create a prorated refund. Duplicate charges, incorrect plan charges, and unrecognised payments are handled by the Billing queue after verification. Support will not promise a refund amount in chat.`,
      conflictGroup: null,
      staleAfterDays: 180,
    }),
    source({
      idKey: "privacy-deletion",
      type: "legal",
      title: "Data privacy and workspace deletion",
      slug: "data-privacy-and-workspace-deletion",
      version: "2.9",
      owner: "Legal & Trust",
      authority: "canonical",
      effectiveDate: "2026-09-30",
      status: "active",
      summary:
        "What Orbit stores, how owners export it, the 30-day deletion window, backups, and identity verification.",
      approvedAnswer:
        "A workspace owner can request deletion from Settings → Data & privacy → Delete workspace. Orbit verifies the request from the owner email on file, starts a 30-day grace period, and permanently deletes workspace data after it ends. Backups expire within 35 days. Export attendee and payment data before deletion because deleted data cannot be restored. If you no longer control the owner email, support must verify your identity and authority before any deletion; chat cannot bypass that check.",
      body: `## What Orbit stores
Orbit stores workspace profile data, committee member accounts, events, registrations, attendee contact details, payment references, check-in records, announcements, and support conversations. Payment card details are handled by the payment provider and are not stored in Orbit. Passwords are stored as salted hashes.

## Export before you delete
Owners can export attendees, payments, and event summaries from each event's export menu. A full workspace export is available from Settings → Data & privacy → Export workspace. The export link expires after 24 hours.

## Request deletion
Only the workspace owner can request deletion. Open Settings → Data & privacy → Delete workspace, type the workspace name, and confirm from the owner email on file. Orbit then starts a 30-day grace period. During the grace period the owner can cancel deletion. After 30 days, workspace data is permanently deleted and cannot be restored.

## Identity verification and lost owner email
If the owner email is no longer accessible, the request cannot be completed from chat. Support must verify identity, committee authority, and a recent payment or event record before transferring the case to the Trust & Safety queue. This is a deliberate security control; an agent cannot waive it.

## Backups and legal holds
Encrypted backups expire within 35 days of deletion. A legal hold, fraud investigation, or unresolved payment dispute can pause deletion for the affected records. Orbit tells the owner which records are held and why.`,
      conflictGroup: null,
      staleAfterDays: 365,
    }),
    source({
      idKey: "qr-checkin-offline",
      type: "product",
      title: "QR check-in and offline mode",
      slug: "qr-checkin-and-offline-mode",
      version: "1.3",
      owner: "Product — Check-in",
      authority: "canonical",
      effectiveDate: "2026-11-14",
      status: "active",
      summary:
        "Scan tickets online or offline, sync later, and handle duplicate or conflicting scans at the door.",
      approvedAnswer:
        "Open Check-in → select your event → Prepare offline. Orbit downloads the attendee list and signing keys to the scanning device. Volunteers can scan up to 500 tickets without a connection; each scan is stored locally and synced when the device reconnects. If two devices scan the same ticket offline, Orbit keeps the first synced scan and flags the second for review. Offline check-in requires Pro and should be prepared while the device still has a connection.",
      body: `## Prepare offline check-in
Open Check-in, select the event, and choose Prepare offline. Keep the device online until the status reads Ready offline. Orbit downloads the attendee list, ticket signatures, and event timezone. Prepare one device per door and do not sign out before the event ends.

## Scan at the door
Open Check-in → Scan. Point the camera at the attendee QR. A green result with the attendee name means the ticket is valid and not yet checked in. A yellow result means the ticket is valid but already checked in; show the previous scan time. A red result means the ticket is invalid, refunded, or belongs to another event.

## Offline limits and sync
A single device can hold up to 500 attendee records offline. Scans queue locally with a device timestamp. When the device reconnects, Orbit syncs automatically and shows a count of synced and conflicted scans. If two devices scan the same ticket while offline, the first synced scan wins and the second is flagged for a human decision.

## Conflicts and corrections
Managers can resolve a conflict from Check-in → Conflicts. Choose Keep first scan or Admit attendee. Every correction is logged. Do not delete a scan to hide a conflict; add a note so the door team and finance can reconcile attendance.`,
      conflictGroup: null,
      staleAfterDays: 180,
    }),
    source({
      idKey: "team-roles",
      type: "policy",
      title: "Team roles and permissions",
      slug: "team-roles-and-permissions",
      version: "4.2",
      owner: "Trust & Safety",
      authority: "canonical",
      effectiveDate: "2026-08-20",
      status: "active",
      summary:
        "Owner, admin, manager, and volunteer permissions, including refunds, exports, and deletion.",
      approvedAnswer:
        "Orbit has four workspace roles. Owners manage billing, team roles, and workspace deletion. Admins manage events, payments, refunds, exports, and announcements. Managers manage events, exports, and announcements but cannot issue refunds or change billing. Volunteers can scan tickets and view assigned attendee lists, but cannot see payment references, export data, issue refunds, or delete anything. Only owners and admins can issue refunds; only owners can delete a workspace.",
      body: `## Owner
The owner controls billing, plan changes, workspace deletion, and the owner email. A workspace has at least one owner. Ownership can be transferred to another committee member from Settings → Team, but the current owner must confirm from the owner email.

## Admin
Admins run events, manage paid registrations, issue refunds, export attendee data, send announcements, and invite managers and volunteers. Admins cannot change the owner email or delete the workspace.

## Manager
Managers create and publish events, export attendees, view payment totals, and send announcements. Managers cannot issue refunds, view full payment references, change billing, or delete a workspace.

## Volunteer
Volunteers can scan QR tickets and view the attendee list for events they are assigned to. They cannot export data, see payment references, issue refunds, send announcements, or change event settings. Give volunteer access only for the event window and remove it afterwards.

## Role changes and audit
Role changes are logged with the actor and timestamp. Removing a committee member ends their sessions within five minutes but does not delete their historical audit entries.`,
      conflictGroup: null,
      staleAfterDays: 240,
    }),
    source({
      idKey: "announcements",
      type: "product",
      title: "Attendee announcements",
      slug: "attendee-announcements",
      version: "3.0",
      owner: "Product — Messaging",
      authority: "canonical",
      effectiveDate: "2026-10-09",
      status: "active",
      summary:
        "Send or schedule email announcements to all attendees or a filtered segment, with delivery stats.",
      approvedAnswer:
        "Open the event → Announcements → New announcement. Choose all attendees or a segment such as Paid or Not checked in, write the subject and message, and send a test to yourself first. Schedule it for a specific time or send now. Orbit sends email announcements only; SMS is not available. Delivery and open counts appear on the announcement page, and every message includes an unsubscribe link.",
      body: `## Create an announcement
Open the event, select Announcements, then New announcement. Pick the audience: all registered attendees, paid attendees, not-yet-checked-in attendees, or a saved segment. Write one clear subject and one main action. Orbit shows the estimated recipient count before you send.

## Test and schedule
Send a test to your own committee email. Test messages are marked TEST and do not affect delivery counts. Schedule the announcement in the event timezone or send immediately. You can edit or cancel a scheduled announcement until five minutes before send time.

## Channels and limits
Announcements are delivered by email. SMS and WhatsApp are not currently supported. Each attendee can receive at most three announcements per event per day; Orbit queues the rest. Every announcement includes an unsubscribe link and the workspace's sender identity.

## Delivery stats and failures
The announcement page shows queued, delivered, bounced, and opened counts. A bounced address is flagged on the attendee record. Orbit retries soft bounces twice over 24 hours and does not retry hard bounces. Export the delivery report from the announcement page for follow-up.`,
      conflictGroup: null,
      staleAfterDays: 180,
    }),
    source({
      idKey: "backend-architecture",
      type: "engineering",
      title: "Orbit backend architecture",
      slug: "orbit-backend-architecture",
      version: "6.1",
      owner: "Platform engineering",
      authority: "approved",
      effectiveDate: "2026-10-30",
      status: "active",
      summary:
        "Service boundaries, PostgreSQL schema, payment webhooks, check-in sync, and failure handling.",
      approvedAnswer:
        "Orbit runs a Next.js application layer over PostgreSQL. Events, registrations, payments, and check-ins are tenant-scoped rows keyed by organization_id. Payment webhooks are idempotent and written to an outbox before settlement changes. Check-in devices queue signed scans locally and sync in batches. A nightly reconciliation compares provider settlements with paid registrations and flags mismatches for finance review.",
      body: `## Service boundaries
The web application handles authentication, event management, and the attendee experience. A worker processes email, payment webhooks, exports, and check-in sync. Both use the same PostgreSQL database and a shared typed data layer. No service trusts a client-supplied organization ID; tenant scope comes from the authenticated session.

## Data and idempotency
Every tenant-owned table carries organization_id and created_at/updated_at timestamps. Payment provider events are stored by provider event ID before processing so retries cannot double-count revenue. Registration state changes run in a transaction with an audit row.

## Check-in sync
Scanning devices hold a signed local list. Each scan records event ID, ticket ID, device ID, and a monotonic local timestamp. On sync, the server accepts the earliest valid scan and flags later duplicates. A device clock skew over five minutes is flagged rather than silently trusted.

## Failure handling
Email and export jobs retry with exponential backoff and a dead-letter queue. Payment webhooks are acknowledged only after the outbox row is committed. Read replicas serve exports and reporting; the primary handles registration and payment writes.`,
      conflictGroup: null,
      staleAfterDays: 365,
    }),
    source({
      idKey: "database-schema",
      type: "engineering",
      title: "Orbit database schema",
      slug: "orbit-database-schema",
      version: "5.4",
      owner: "Platform engineering",
      authority: "approved",
      effectiveDate: "2026-10-30",
      status: "active",
      summary:
        "Core Orbit tables for organizations, events, registrations, payments, check-ins, and audit history.",
      approvedAnswer:
        "The core Orbit schema is organizations → events → ticket_types → registrations → payments, with check_ins and announcements attached to events. Every tenant-owned table includes organization_id and timestamps. Registrations are unique per event and attendee email, payments reference a provider transaction ID, and check_ins are unique per registration. Audit logs record sensitive changes. Indexes cover organization scope, event date, registration status, and payment status.",
      body: `## Core tables
organizations stores the workspace, plan, billing status, and owner email. events belongs to an organization and stores schedule, venue, capacity, and status. ticket_types belongs to an event and stores price, quantity, and sale window. registrations links an attendee to an event and ticket type with a status of pending, paid, refunded, or cancelled.

## Payments and check-ins
payments belongs to a registration and stores provider, provider_transaction_id, amount, currency, status, and settled_at. A unique index on provider_transaction_id prevents duplicate settlement rows. check_ins belongs to a registration and stores device_id, scanned_at, sync_state, and conflict_state. A unique index on registration_id prevents two accepted check-ins.

## Messaging and audit
announcements belongs to an event and stores audience, subject, body, scheduled_at, and delivery counts. announcement_deliveries stores per-recipient status. audit_logs stores actor, action, entity, and a JSON detail payload for refunds, role changes, exports, and deletions.

## Indexing and retention
Composite indexes cover (organization_id, status) on events and registrations, (event_id, payment_status), and (organization_id, created_at) on audit logs. Payment references are retained for seven years for finance reconciliation; attendee contact data follows the workspace deletion schedule.`,
      conflictGroup: null,
      staleAfterDays: 365,
    }),
    source({
      idKey: "capacity-waitlists",
      type: "product",
      title: "Capacity, waitlists, and paid holds",
      slug: "capacity-waitlists-and-paid-holds",
      version: "2.1",
      owner: "Product — Registrations",
      authority: "approved",
      effectiveDate: "2026-09-05",
      status: "active",
      summary:
        "Set event capacity, run a waitlist, and decide how long an unpaid registration holds a seat.",
      approvedAnswer:
        "Set capacity on the event's Basics tab. When registrations reach capacity, Orbit can close registration or start a waitlist. Enable Waitlist in Registration settings and choose automatic promotion. A paid hold keeps a seat for 15 minutes by default while payment is pending; you can change it to 5, 15, or 30 minutes. Promoted waitlist attendees get a payment link that expires at the end of the hold.",
      body: `## Set capacity
Open Events → [event] → Basics → Capacity. Capacity counts confirmed paid and confirmed free registrations. Pending payments do not count unless a paid hold is active. You cannot reduce capacity below the number of confirmed registrations.

## Waitlist behaviour
Enable Waitlist in Registration settings. When capacity is reached, new registrants join the waitlist in order. Automatic promotion releases a seat when a registration is cancelled or refunded. Promoted attendees receive an email with a payment or confirmation link that expires after the hold window.

## Paid holds
A paid hold reserves a seat while a payment is pending. The default is 15 minutes; owners can choose 5, 15, or 30 minutes. If payment does not settle before the hold expires, the seat returns to the pool and the registration becomes Expired. Orbit does not retry an expired hold automatically.

## Reporting
The event dashboard shows confirmed, pending, waitlisted, and checked-in counts. Export the waitlist from Attendees → Export → Registration status: Waitlisted.`,
      conflictGroup: null,
      staleAfterDays: 180,
    }),
    source({
      idKey: "legacy-sms",
      type: "product",
      title: "SMS reminders (2023 pilot)",
      slug: "sms-reminders-2023-pilot",
      version: "0.9",
      owner: "Legacy messaging",
      authority: "reference",
      effectiveDate: "2023-03-14",
      status: "stale",
      summary:
        "A retired 2023 pilot that sent SMS reminders to attendees on all plans. Kept for audit history only.",
      approvedAnswer:
        "The SMS reminder pilot ended in 2023. SMS is not available in Orbit today; use email announcements instead. This source is retained for audit history and should not be used to answer current product questions.",
      body: `## Pilot scope
The 2023 SMS pilot sent a single reminder 24 hours before an event to attendees who opted in. It was limited to three campuses and never became generally available.

## Current status
The pilot ended on 2023-11-30. SMS reminders are not available on Free or Pro. Current attendee messaging is email-only and is documented in Attendee announcements.

## Why this page is stale
This page is retained so support can explain old SMS charges and audit history. Do not cite it for current feature availability.`,
      conflictGroup: null,
      staleAfterDays: 180,
    }),
    source({
      idKey: "refunds-2024-pilot",
      type: "policy",
      title: "Refund policy — 2024 pilot (superseded)",
      slug: "refund-policy-2024-pilot",
      version: "1.0",
      owner: "Legacy finance",
      authority: "reference",
      effectiveDate: "2024-04-02",
      status: "archived",
      summary:
        "Superseded pilot policy that allowed volunteers to approve small refunds. Replaced by the current refund policy.",
      approvedAnswer:
        "This policy is superseded. Under the current policy, only owners and admins can issue refunds, and duplicate charges require billing verification. Do not use this archived page for current decisions.",
      body: `## Superseded rule
During the 2024 pilot, volunteers could approve refunds under ₹500 without review. This rule was withdrawn after a reconciliation incident.

## Replacement
The current Event payments and refunds policy requires owner or admin approval for every refund and billing verification for duplicate or unrecognised charges. This archived page remains only for audit history and must not be cited as current policy.`,
      conflictGroup: "refunds",
      staleAfterDays: 180,
    }),
  ];
}
