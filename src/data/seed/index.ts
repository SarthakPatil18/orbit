import type {
  Agent,
  AuditLog,
  Citation,
  Conversation,
  Customer,
  CustomerEvent,
  Delivery,
  EvalCase,
  Handoff,
  Journey,
  JourneyEnrollment,
  JourneyRun,
  KnowledgeChunk,
  KnowledgeSource,
  Message,
  Organization,
  Queue,
  TranscriptEntry,
} from "@/lib/types";
import { DEMO_ORG_ID } from "@/lib/constants";
import { splitChunks } from "@/lib/knowledge/chunking";
import { evalCases } from "./cases";
import { sid } from "./ids";
import { knowledgeSources, KNOWLEDGE_SNAPSHOT_VERSION } from "./knowledge";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const hoursAgo = (n: number) => {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
};
const daysAhead = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

export { DEMO_ORG_ID };
export { splitChunks };

export interface SeedData {
  organization: Organization;
  agents: Agent[];
  customers: Customer[];
  queues: Queue[];
  knowledgeSources: KnowledgeSource[];
  knowledgeChunks: KnowledgeChunk[];
  conversations: Conversation[];
  messages: Message[];
  citations: Citation[];
  handoffs: Handoff[];
  customerEvents: CustomerEvent[];
  journeys: Journey[];
  enrollments: JourneyEnrollment[];
  journeyRuns: JourneyRun[];
  deliveries: Delivery[];
  evalCases: EvalCase[];
  auditLogs: AuditLog[];
}

function transcriptFrom(messages: Message[]): TranscriptEntry[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    decision: m.decision,
    actorName:
      m.role === "agent" ? "Rohan Kapoor" : m.role === "assistant" ? "ProofDesk" : null,
  }));
}

export async function createSeedData(): Promise<SeedData> {
  const orgId = DEMO_ORG_ID;
  const org: Organization = {
    id: orgId,
    name: "Orbit",
    slug: "orbit",
    plan: "pro",
    billingStatus: "active",
    periodEnd: daysAhead(24),
    ownerEmail: "support@orbit.club",
    supportHours: "Mon–Fri, 09:00–18:00 IST",
    timezone: "Asia/Kolkata",
    createdAt: daysAgo(420),
    updatedAt: daysAgo(2),
  };

  const agents: Agent[] = [
    {
      id: sid("agent:asha"),
      organizationId: orgId,
      name: "Asha Menon",
      email: "asha@orbit.club",
      role: "owner",
      initials: "AM",
      color: "#315a9c",
      createdAt: daysAgo(400),
      updatedAt: daysAgo(10),
    },
    {
      id: sid("agent:rohan"),
      organizationId: orgId,
      name: "Rohan Kapoor",
      email: "rohan@orbit.club",
      role: "admin",
      initials: "RK",
      color: "#a43d2c",
      createdAt: daysAgo(320),
      updatedAt: daysAgo(9),
    },
    {
      id: sid("agent:meera"),
      organizationId: orgId,
      name: "Meera Joshi",
      email: "meera@orbit.club",
      role: "agent",
      initials: "MJ",
      color: "#16734a",
      createdAt: daysAgo(280),
      updatedAt: daysAgo(7),
    },
    {
      id: sid("agent:kabir"),
      organizationId: orgId,
      name: "Kabir Sethi",
      email: "kabir@orbit.club",
      role: "agent",
      initials: "KS",
      color: "#8a610c",
      createdAt: daysAgo(180),
      updatedAt: daysAgo(4),
    },
  ];

  const queues: Queue[] = [
    {
      id: sid("queue:support"),
      organizationId: orgId,
      name: "General support",
      slug: "support",
      description: "Product questions, exports, check-in, and announcements.",
      slaMinutes: 240,
      createdAt: daysAgo(400),
      updatedAt: daysAgo(30),
    },
    {
      id: sid("queue:billing"),
      organizationId: orgId,
      name: "Billing",
      slug: "billing",
      description: "Duplicate charges, payment verification, plan changes, and refunds.",
      slaMinutes: 60,
      createdAt: daysAgo(400),
      updatedAt: daysAgo(30),
    },
    {
      id: sid("queue:trust"),
      organizationId: orgId,
      name: "Trust & Safety",
      slug: "trust-safety",
      description: "Identity, privacy, deletion exceptions, and account security.",
      slaMinutes: 30,
      createdAt: daysAgo(400),
      updatedAt: daysAgo(30),
    },
    {
      id: sid("queue:onboarding"),
      organizationId: orgId,
      name: "Onboarding",
      slug: "onboarding",
      description: "New workspaces, committee setup, and first-event help.",
      slaMinutes: 480,
      createdAt: daysAgo(400),
      updatedAt: daysAgo(30),
    },
  ];

  const customers: Customer[] = [
    {
      id: sid("customer:maya"),
      organizationId: orgId,
      name: "Maya Rao",
      email: "maya@kathacollective.in",
      club: "Katha Collective",
      role: "owner",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(18),
      workspaceCreatedAt: daysAgo(210),
      lastActiveAt: hoursAgo(2),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Design Summit 2026",
      upcomingEventDate: daysAhead(12),
      emailOptOut: false,
      createdAt: daysAgo(210),
      updatedAt: hoursAgo(2),
    },
    {
      id: sid("customer:arjun"),
      organizationId: orgId,
      name: "Arjun Mehta",
      email: "arjun@iiscquiz.club",
      club: "IISc Quiz Club",
      role: "manager",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(11),
      workspaceCreatedAt: daysAgo(160),
      lastActiveAt: daysAgo(1),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Lone Wolf Quiz Night",
      upcomingEventDate: daysAhead(6),
      emailOptOut: false,
      createdAt: daysAgo(160),
      updatedAt: daysAgo(1),
    },
    {
      id: sid("customer:zoya"),
      organizationId: orgId,
      name: "Zoya Khan",
      email: "zoya@lensandlight.art",
      club: "Lens & Light",
      role: "owner",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(9),
      workspaceCreatedAt: daysAgo(300),
      lastActiveAt: hoursAgo(5),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Monsoon Photo Walk",
      upcomingEventDate: daysAhead(20),
      emailOptOut: false,
      createdAt: daysAgo(300),
      updatedAt: hoursAgo(5),
    },
    {
      id: sid("customer:neel"),
      organizationId: orgId,
      name: "Neel Shah",
      email: "neel@hostel12.club",
      club: "Hostel 12 Cultural Committee",
      role: "manager",
      plan: "free",
      billingStatus: "active",
      periodEnd: null,
      workspaceCreatedAt: daysAgo(80),
      lastActiveAt: hoursAgo(3),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Courtyard Sessions",
      upcomingEventDate: daysAhead(15),
      emailOptOut: false,
      createdAt: daysAgo(80),
      updatedAt: hoursAgo(3),
    },
    {
      id: sid("customer:ishita"),
      organizationId: orgId,
      name: "Ishita Verma",
      email: "ishita@rangoli.collective",
      club: "Rangoli Collective",
      role: "owner",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(14),
      workspaceCreatedAt: daysAgo(2),
      lastActiveAt: hoursAgo(20),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: null,
      upcomingEventDate: null,
      emailOptOut: false,
      createdAt: daysAgo(2),
      updatedAt: hoursAgo(20),
    },
    {
      id: sid("customer:kabir"),
      organizationId: orgId,
      name: "Kabir Nair",
      email: "kabir@campuscomedy.club",
      club: "Campus Comedy Club",
      role: "manager",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(22),
      workspaceCreatedAt: daysAgo(140),
      lastActiveAt: daysAgo(9),
      draftEventName: "Open Mic Night — Edition 14",
      draftUpdatedAt: daysAgo(12),
      upcomingEventName: null,
      upcomingEventDate: null,
      emailOptOut: false,
      createdAt: daysAgo(140),
      updatedAt: daysAgo(9),
    },
    {
      id: sid("customer:aarav"),
      organizationId: orgId,
      name: "Aarav Desai",
      email: "aarav@meridiantechfest.in",
      club: "Meridian Tech Fest",
      role: "owner",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(30),
      workspaceCreatedAt: daysAgo(260),
      lastActiveAt: daysAgo(1),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Design Summit 2026",
      upcomingEventDate: daysAhead(12),
      emailOptOut: false,
      createdAt: daysAgo(260),
      updatedAt: daysAgo(1),
    },
    {
      id: sid("customer:priya"),
      organizationId: orgId,
      name: "Priya Iyer",
      email: "priya@womeninrobotics.org",
      club: "Women in Robotics",
      role: "owner",
      plan: "pro",
      billingStatus: "cancelled",
      periodEnd: daysAhead(10),
      workspaceCreatedAt: daysAgo(190),
      lastActiveAt: daysAgo(2),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Build Night: Line Followers",
      upcomingEventDate: daysAhead(18),
      emailOptOut: false,
      createdAt: daysAgo(190),
      updatedAt: daysAgo(2),
    },
    {
      id: sid("customer:rhea"),
      organizationId: orgId,
      name: "Rhea Menon",
      email: "rhea@litsociety.club",
      club: "Lit Society",
      role: "volunteer",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(16),
      workspaceCreatedAt: daysAgo(120),
      lastActiveAt: daysAgo(3),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Poetry at the Amphitheatre",
      upcomingEventDate: daysAhead(8),
      emailOptOut: false,
      createdAt: daysAgo(120),
      updatedAt: daysAgo(3),
    },
    {
      id: sid("customer:dev"),
      organizationId: orgId,
      name: "Dev Malhotra",
      email: "dev@sportscouncil.in",
      club: "Sports Council",
      role: "owner",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(27),
      workspaceCreatedAt: daysAgo(330),
      lastActiveAt: hoursAgo(6),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Inter-Hostel Track Meet",
      upcomingEventDate: daysAhead(25),
      emailOptOut: false,
      createdAt: daysAgo(330),
      updatedAt: hoursAgo(6),
    },
    {
      id: sid("customer:ananya"),
      organizationId: orgId,
      name: "Ananya Bose",
      email: "ananya@filmappreciation.club",
      club: "Film Appreciation Society",
      role: "manager",
      plan: "pro",
      billingStatus: "active",
      periodEnd: daysAhead(13),
      workspaceCreatedAt: daysAgo(95),
      lastActiveAt: hoursAgo(1),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Parallel Cinema Night",
      upcomingEventDate: daysAhead(4),
      emailOptOut: false,
      createdAt: daysAgo(95),
      updatedAt: hoursAgo(1),
    },
    {
      id: sid("customer:farah"),
      organizationId: orgId,
      name: "Farah Siddiqui",
      email: "farah@debateunion.club",
      club: "Debate Union",
      role: "owner",
      plan: "free",
      billingStatus: "active",
      periodEnd: null,
      workspaceCreatedAt: daysAgo(70),
      lastActiveAt: daysAgo(2),
      draftEventName: null,
      draftUpdatedAt: null,
      upcomingEventName: "Open Parliamentary Debate",
      upcomingEventDate: daysAhead(9),
      emailOptOut: false,
      createdAt: daysAgo(70),
      updatedAt: daysAgo(2),
    },
  ];

  const sources = knowledgeSources().map((s) => ({
    ...s,
    organizationId: orgId,
  }));
  const chunks = sources.flatMap(splitChunks);
  const sourceBySlug = new Map(sources.map((s) => [s.slug, s]));
  const chunkByHeading = (slug: string, heading: string) => {
    const source = sourceBySlug.get(slug);
    if (!source) throw new Error(`Missing seed source ${slug}`);
    const chunk = chunks.find(
      (c) => c.sourceId === source.id && c.heading === heading,
    );
    if (!chunk) throw new Error(`Missing chunk ${slug} / ${heading}`);
    return { source, chunk };
  };

  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const citations: Citation[] = [];
  const handoffs: Handoff[] = [];

  const addMessage = (
    key: string,
    conversationId: string,
    role: Message["role"],
    content: string,
    at: string,
    extra: Partial<Message> = {},
  ): Message => {
    const m: Message = {
      id: sid(`message:${key}`),
      organizationId: orgId,
      conversationId,
      role,
      content,
      decision: extra.decision ?? null,
      risk: extra.risk ?? null,
      model: extra.model ?? null,
      promptVersion: extra.promptVersion ?? null,
      policyVersion: extra.policyVersion ?? null,
      knowledgeSnapshotVersion: extra.knowledgeSnapshotVersion ?? null,
      latencyMs: extra.latencyMs ?? null,
      inputTokens: extra.inputTokens ?? null,
      outputTokens: extra.outputTokens ?? null,
      estimatedCostUsd: extra.estimatedCostUsd ?? null,
      traceId: extra.traceId ?? null,
      trace: extra.trace ?? null,
      createdAt: at,
    };
    messages.push(m);
    return m;
  };

  const addCitation = (
    key: string,
    message: Message,
    conversationId: string,
    slug: string,
    heading: string,
    score: number,
  ) => {
    const { source, chunk } = chunkByHeading(slug, heading);
    citations.push({
      id: sid(`citation:${key}`),
      organizationId: orgId,
      messageId: message.id,
      conversationId,
      sourceId: source.id,
      chunkId: chunk.id,
      sourceTitle: source.title,
      excerpt:
        chunk.content.length > 280
          ? `${chunk.content.slice(0, 277).trimEnd()}…`
          : chunk.content,
      sourceVersion: source.version,
      effectiveDate: source.effectiveDate,
      owner: source.owner,
      score,
      createdAt: message.createdAt,
    });
  };

  // 1. Maya — duplicate charge, complete handoff
  {
    const id = sid("conversation:maya-duplicate");
    const at = hoursAgo(2);
    const customerMsg = addMessage(
      "maya-1",
      id,
      "customer",
      "I was charged twice for one Design Summit ticket. My UPI shows ₹1,498 but I only registered once. Please fix this today.",
      at,
    );
    const assistantMsg = addMessage(
      "maya-2",
      id,
      "assistant",
      "I can see why that is alarming, Maya. A duplicate charge needs a billing specialist to verify the two payment references against your registration — I cannot reverse or promise a refund from chat. I have prepared a Billing handoff with your transcript, the event, and the ₹1,498 amount so you will not need to repeat any of it. Rohan from Billing will take it from here.",
      hoursAgo(1.9),
      {
        decision: "escalate",
        risk: "high",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 18,
        estimatedCostUsd: 0,
        traceId: "trace_seed_maya",
      },
    );
    addMessage(
      "maya-3",
      id,
      "system",
      "Handoff confirmed to Billing. Customer was told exactly what context travels with the case.",
      hoursAgo(1.85),
      { decision: "escalate", risk: "high" },
    );
    const transcript = transcriptFrom([customerMsg, assistantMsg]);
    const handoff: Handoff = {
      id: sid("handoff:maya"),
      organizationId: orgId,
      conversationId: id,
      queueId: sid("queue:billing"),
      customerGoal:
        "Get the duplicate ₹1,498 charge for Design Summit 2026 verified and refunded if it is confirmed.",
      summary:
        "Maya Rao reports two UPI charges of ₹1,498 for a single Design Summit 2026 registration. She wants the duplicate reversed today. No refund has been executed.",
      escalationReason: "Payment exception requires billing verification",
      riskClass: "high",
      sentiment: "frustrated",
      actionsAttempted: [
        "Retrieved the current payments and refunds policy",
        "Checked whether a refund can be executed from chat (it cannot)",
        "Prepared a Billing handoff instead of promising an outcome",
      ],
      sourcesConsulted: [
        {
          sourceId: sourceBySlug.get("event-payments-and-refunds")!.id,
          title: "Event payments and refunds",
          version: "5.1",
        },
      ],
      claimsAlreadyCommunicated: [
        "A duplicate charge needs billing verification.",
        "Chat cannot reverse or promise a refund.",
        "The handoff includes the transcript and the ₹1,498 amount.",
      ],
      missingInformation: [
        "The two payment reference IDs from the customer's UPI app",
        "The email used at registration, if different from the workspace email",
        "Whether both charges are settled or one is still pending",
      ],
      recommendedNextAction:
        "Match both UPI references to the registration, confirm whether one is a pending authorisation, and refund the duplicate if two settlements exist. Reply with the reference IDs and a realistic bank posting window.",
      destinationQueue: "Billing",
      fullTranscript: transcript,
      status: "confirmed",
      createdAt: hoursAgo(1.85),
      updatedAt: hoursAgo(1.85),
    };
    handoffs.push(handoff);
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:maya"),
      queueId: sid("queue:billing"),
      subject: "Charged twice for one Design Summit ticket",
      status: "needs_human",
      risk: "high",
      sentiment: "frustrated",
      decision: "escalate",
      assignedAgentId: null,
      handoffId: handoff.id,
      lastMessageAt: hoursAgo(1.85),
      lastCustomerQuestion:
        "I was charged twice for one Design Summit ticket. My UPI shows ₹1,498 but I only registered once.",
      page: "/events/design-summit-2026",
      failureCount: 0,
      createdAt: at,
      updatedAt: hoursAgo(1.85),
    });
  }

  // 2. Arjun — paid attendee export, resolved
  {
    const id = sid("conversation:arjun-export");
    const at = daysAgo(1);
    addMessage(
      "arjun-1",
      id,
      "customer",
      "How do I export only paid attendees for Design Summit 2026? I don't want the pending UPI registrations in the finance sheet.",
      at,
    );
    const assistantMsg = addMessage(
      "arjun-2",
      id,
      "assistant",
      "Open Events → Design Summit 2026 → Attendees → Export. In the export drawer, set Payment status to Paid, leave Ticket type on All, and choose Export CSV. Orbit downloads only registrations whose payment status is Paid, including attendee name, email, ticket type, amount paid, payment reference, and check-in status. Pending, failed, refunded, and complimentary registrations are excluded unless you add them back with the status filter.",
      new Date(new Date(at).getTime() + 9000).toISOString(),
      {
        decision: "answer",
        risk: "low",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 21,
        estimatedCostUsd: 0,
        traceId: "trace_seed_arjun",
      },
    );
    addCitation(
      "arjun-1",
      assistantMsg,
      id,
      "kb-attendee-export",
      "Export only paid registrations",
      0.86,
    );
    addMessage(
      "arjun-3",
      id,
      "customer",
      "Got it — the CSV has 412 rows and matches our settlement total. Thanks.",
      new Date(new Date(at).getTime() + 120000).toISOString(),
    );
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:arjun"),
      queueId: sid("queue:support"),
      subject: "Export paid attendees only",
      status: "resolved",
      risk: "low",
      sentiment: "calm",
      decision: "answer",
      assignedAgentId: sid("agent:asha"),
      handoffId: null,
      lastMessageAt: new Date(new Date(at).getTime() + 120000).toISOString(),
      lastCustomerQuestion: "How do I export only paid attendees for Design Summit 2026?",
      page: "/events/design-summit-2026/attendees",
      failureCount: 0,
      createdAt: at,
      updatedAt: new Date(new Date(at).getTime() + 120000).toISOString(),
    });
  }

  // 3. Zoya — deletion without owner email
  {
    const id = sid("conversation:zoya-deletion");
    const at = hoursAgo(5);
    const customerMsg = addMessage(
      "zoya-1",
      id,
      "customer",
      "We need to delete our workspace before the new committee takes over. I don't have access to the old committee email anymore. Can you do it today?",
      at,
    );
    const assistantMsg = addMessage(
      "zoya-2",
      id,
      "assistant",
      "I cannot delete a workspace from chat, and I cannot bypass the owner-email check — that check protects your committee's data. I have sent this to our Trust & Safety team with the full transcript and the detail that the old owner email is unavailable. They will verify your identity and authority before anything is deleted. You will not need to repeat the situation.",
      hoursAgo(4.95),
      {
        decision: "escalate",
        risk: "high",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 15,
        estimatedCostUsd: 0,
        traceId: "trace_seed_zoya",
      },
    );
    addMessage(
      "zoya-3",
      id,
      "system",
      "Handoff confirmed to Trust & Safety.",
      hoursAgo(4.9),
      { decision: "escalate", risk: "high" },
    );
    const handoff: Handoff = {
      id: sid("handoff:zoya"),
      organizationId: orgId,
      conversationId: id,
      queueId: sid("queue:trust"),
      customerGoal:
        "Delete the Lens & Light workspace before a committee handover, despite losing access to the owner email.",
      summary:
        "Zoya Khan, current owner, requests immediate workspace deletion. The workspace owner email is no longer accessible. Deletion and identity verification cannot be completed in chat.",
      escalationReason:
        "Workspace deletion with an identity exception requires Trust & Safety verification",
      riskClass: "high",
      sentiment: "confused",
      actionsAttempted: [
        "Explained the owner-email verification requirement",
        "Declined to delete the workspace from chat",
        "Prepared a Trust & Safety handoff",
      ],
      sourcesConsulted: [
        {
          sourceId: sourceBySlug.get("data-privacy-and-workspace-deletion")!.id,
          title: "Data privacy and workspace deletion",
          version: "2.9",
        },
      ],
      claimsAlreadyCommunicated: [
        "Workspace deletion cannot be completed from chat.",
        "The owner-email check cannot be bypassed.",
        "Trust & Safety will verify identity and authority before deletion.",
      ],
      missingInformation: [
        "A government or institution ID matching the owner name",
        "Evidence of committee authority for the handover",
        "A recent payment or event record for the workspace",
        "The new committee contact who should receive the deletion outcome",
      ],
      recommendedNextAction:
        "Run the lost-owner-email verification playbook. Confirm identity and committee authority, then schedule deletion with the standard 30-day grace period. Do not promise same-day deletion.",
      destinationQueue: "Trust & Safety",
      fullTranscript: transcriptFrom([customerMsg, assistantMsg]),
      status: "confirmed",
      createdAt: hoursAgo(4.9),
      updatedAt: hoursAgo(4.9),
    };
    handoffs.push(handoff);
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:zoya"),
      queueId: sid("queue:trust"),
      subject: "Delete workspace without the old owner email",
      status: "needs_human",
      risk: "high",
      sentiment: "confused",
      decision: "escalate",
      assignedAgentId: null,
      handoffId: handoff.id,
      lastMessageAt: hoursAgo(4.9),
      lastCustomerQuestion:
        "We need to delete our workspace before the new committee takes over. I don't have access to the old committee email anymore.",
      page: "/settings/data-privacy",
      failureCount: 0,
      createdAt: at,
      updatedAt: hoursAgo(4.9),
    });
  }

  // 4. Neel — unsupported auditorium request
  {
    const id = sid("conversation:neel-auditorium");
    const at = hoursAgo(3);
    addMessage(
      "neel-2",
      id,
      "assistant",
      "I don't know, and I won't guess: Orbit does not reserve or manage venue inventory, so I have no approved source that can confirm an auditorium booking for your cultural fest. Orbit can handle the event page, registrations, and QR check-in once the venue is confirmed with your institution. Would you like me to hand this to a person who can point you to the right campus office?",
      hoursAgo(2.98),
      {
        decision: "abstain",
        risk: "low",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 9,
        estimatedCostUsd: 0,
        traceId: "trace_seed_neel",
      },
    );
    addMessage(
      "neel-1",
      id,
      "customer",
      "Can Orbit reserve our auditorium for the cultural fest?",
      at,
    );
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:neel"),
      queueId: sid("queue:support"),
      subject: "Auditorium reservation question",
      status: "ai_active",
      risk: "low",
      sentiment: "calm",
      decision: "abstain",
      assignedAgentId: null,
      handoffId: null,
      lastMessageAt: hoursAgo(2.98),
      lastCustomerQuestion: "Can Orbit reserve our auditorium for the cultural fest?",
      page: "/help",
      failureCount: 0,
      createdAt: at,
      updatedAt: hoursAgo(2.98),
    });
  }

  // 5. Rhea — roles
  {
    const id = sid("conversation:rhea-roles");
    const at = daysAgo(3);
    const assistantMsg = addMessage(
      "rhea-2",
      id,
      "assistant",
      "Orbit has four workspace roles. Owners manage billing, team roles, and workspace deletion. Admins manage events, payments, refunds, exports, and announcements. Managers manage events, exports, and announcements but cannot issue refunds or change billing. Volunteers can scan tickets and view assigned attendee lists, but cannot see payment references, export data, issue refunds, or delete anything. Only owners and admins can issue refunds; only owners can delete a workspace.",
      new Date(new Date(at).getTime() + 7000).toISOString(),
      {
        decision: "answer",
        risk: "low",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 14,
        estimatedCostUsd: 0,
        traceId: "trace_seed_rhea",
      },
    );
    addMessage(
      "rhea-1",
      id,
      "customer",
      "I'm a volunteer this year. Can I issue a refund if a student asks at the desk?",
      at,
    );
    addCitation(
      "rhea-1",
      assistantMsg,
      id,
      "team-roles-and-permissions",
      "Volunteer",
      0.81,
    );
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:rhea"),
      queueId: sid("queue:support"),
      subject: "Can volunteers issue refunds?",
      status: "resolved",
      risk: "low",
      sentiment: "calm",
      decision: "answer",
      assignedAgentId: sid("agent:asha"),
      handoffId: null,
      lastMessageAt: new Date(new Date(at).getTime() + 7000).toISOString(),
      lastCustomerQuestion: "Can I issue a refund if a student asks at the desk?",
      page: "/help",
      failureCount: 0,
      createdAt: at,
      updatedAt: new Date(new Date(at).getTime() + 7000).toISOString(),
    });
  }

  // 6. Ananya — offline check-in
  {
    const id = sid("conversation:ananya-offline");
    const at = hoursAgo(1);
    const assistantMsg = addMessage(
      "ananya-2",
      id,
      "assistant",
      "Open Check-in → select your event → Prepare offline. Orbit downloads the attendee list and signing keys to the scanning device. Volunteers can scan up to 500 tickets without a connection; each scan is stored locally and synced when the device reconnects. If two devices scan the same ticket offline, Orbit keeps the first synced scan and flags the second for review. Offline check-in requires Pro and should be prepared while the device still has a connection.",
      hoursAgo(0.98),
      {
        decision: "answer",
        risk: "low",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 17,
        estimatedCostUsd: 0,
        traceId: "trace_seed_ananya",
      },
    );
    addMessage(
      "ananya-1",
      id,
      "customer",
      "Our screening venue has terrible wifi. How do we prepare offline QR check-in?",
      at,
    );
    addCitation(
      "ananya-1",
      assistantMsg,
      id,
      "qr-checkin-and-offline-mode",
      "Prepare offline check-in",
      0.88,
    );
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:ananya"),
      queueId: sid("queue:support"),
      subject: "Offline check-in at a low-signal venue",
      status: "ai_active",
      risk: "low",
      sentiment: "calm",
      decision: "answer",
      assignedAgentId: null,
      handoffId: null,
      lastMessageAt: hoursAgo(0.98),
      lastCustomerQuestion: "How do we prepare offline QR check-in?",
      page: "/events/parallel-cinema-night/check-in",
      failureCount: 0,
      createdAt: at,
      updatedAt: hoursAgo(0.98),
    });
  }

  // 7. Farah — cancel Pro
  {
    const id = sid("conversation:farah-cancel");
    const at = daysAgo(2);
    const assistantMsg = addMessage(
      "farah-2",
      id,
      "assistant",
      "Orbit Pro costs ₹2,499 per month or ₹24,990 per year. You can cancel from Settings → Billing → Cancel plan. Pro stays active until the end of the paid period shown on the billing page, then the workspace moves to Free. Events, attendee records, and exports stay available; paid registration and offline check-in are disabled. Orbit keeps workspace data for 90 days after downgrade, and you can reactivate Pro at any time during that window without losing history. Cancelling does not delete your events.",
      new Date(new Date(at).getTime() + 8000).toISOString(),
      {
        decision: "answer",
        risk: "low",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 19,
        estimatedCostUsd: 0,
        traceId: "trace_seed_farah",
      },
    );
    addMessage(
      "farah-1",
      id,
      "customer",
      "What happens if I cancel Pro? Do we lose our event history?",
      at,
    );
    addCitation(
      "farah-1",
      assistantMsg,
      id,
      "plans-billing-and-cancellation",
      "What happens after Pro ends",
      0.84,
    );
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:farah"),
      queueId: sid("queue:billing"),
      subject: "Cancelling Pro and keeping event history",
      status: "resolved",
      risk: "low",
      sentiment: "calm",
      decision: "answer",
      assignedAgentId: sid("agent:rohan"),
      handoffId: null,
      lastMessageAt: new Date(new Date(at).getTime() + 8000).toISOString(),
      lastCustomerQuestion: "What happens if I cancel Pro?",
      page: "/settings/billing",
      failureCount: 0,
      createdAt: at,
      updatedAt: new Date(new Date(at).getTime() + 8000).toISOString(),
    });
  }

  // 8. Dev — claimed handoff, human joined
  {
    const id = sid("conversation:dev-duplicate");
    const at = hoursAgo(7);
    const customerMsg = addMessage(
      "dev-1",
      id,
      "customer",
      "There are two ₹2,998 charges on our club card for the track meet. We only sold one pass at that price.",
      at,
    );
    const assistantMsg = addMessage(
      "dev-2",
      id,
      "assistant",
      "Two settled charges for one registration is a billing exception, so I have routed this to Rohan in Billing instead of guessing or promising a refund. Your transcript, the event, and both amounts travel with the case. You will not need to repeat the details.",
      hoursAgo(6.98),
      {
        decision: "escalate",
        risk: "high",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 13,
        estimatedCostUsd: 0,
        traceId: "trace_seed_dev",
      },
    );
    addMessage("dev-3", id, "system", "Handoff claimed by Rohan Kapoor.", hoursAgo(6.5), {
      decision: "escalate",
      risk: "high",
    });
    addMessage(
      "dev-4",
      id,
      "agent",
      "Hi Dev, Rohan here. I've pulled both settlement records. One is a duplicate authorisation from the same device. I'm reversing the duplicate now — it usually posts in 5–7 business days, and I'll reply here when the provider confirms it.",
      hoursAgo(6.2),
      { risk: "high" },
    );
    const handoff: Handoff = {
      id: sid("handoff:dev"),
      organizationId: orgId,
      conversationId: id,
      queueId: sid("queue:billing"),
      customerGoal:
        "Resolve two ₹2,998 charges for a single Inter-Hostel Track Meet pass.",
      summary:
        "Dev Malhotra reports two settled ₹2,998 charges for one pass. Rohan has claimed the case and identified one duplicate authorisation from the same device.",
      escalationReason: "Payment exception requires billing verification",
      riskClass: "high",
      sentiment: "frustrated",
      actionsAttempted: [
        "Retrieved the current refund policy",
        "Declined to execute a refund from chat",
        "Routed to Billing with both amounts and the event",
      ],
      sourcesConsulted: [
        {
          sourceId: sourceBySlug.get("event-payments-and-refunds")!.id,
          title: "Event payments and refunds",
          version: "5.1",
        },
      ],
      claimsAlreadyCommunicated: [
        "Two settled charges for one registration is a billing exception.",
        "A refund cannot be promised from chat.",
        "The case was routed to Rohan in Billing.",
      ],
      missingInformation: ["Provider confirmation that the duplicate reversal settled"],
      recommendedNextAction:
        "Monitor the reversal, confirm the provider reference, and reply in-thread once settled.",
      destinationQueue: "Billing",
      fullTranscript: transcriptFrom([customerMsg, assistantMsg]),
      status: "claimed",
      createdAt: hoursAgo(6.9),
      updatedAt: hoursAgo(6.2),
    };
    handoffs.push(handoff);
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:dev"),
      queueId: sid("queue:billing"),
      subject: "Two charges for one track meet pass",
      status: "human_owned",
      risk: "high",
      sentiment: "frustrated",
      decision: "escalate",
      assignedAgentId: sid("agent:rohan"),
      handoffId: handoff.id,
      lastMessageAt: hoursAgo(6.2),
      lastCustomerQuestion:
        "There are two ₹2,998 charges on our club card for the track meet.",
      page: "/events/track-meet/payments",
      failureCount: 0,
      createdAt: at,
      updatedAt: hoursAgo(6.2),
    });
  }

  // 9. Kabir — announcement question
  {
    const id = sid("conversation:kabir-announcement");
    const at = daysAgo(9);
    const assistantMsg = addMessage(
      "kabir-2",
      id,
      "assistant",
      "Open the event → Announcements → New announcement. Choose all attendees or a segment such as Paid or Not checked in, write the subject and message, and send a test to yourself first. Schedule it for a specific time or send now. Orbit sends email announcements only; SMS is not available. Delivery and open counts appear on the announcement page, and every message includes an unsubscribe link.",
      new Date(new Date(at).getTime() + 9000).toISOString(),
      {
        decision: "answer",
        risk: "low",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 16,
        estimatedCostUsd: 0,
        traceId: "trace_seed_kabir",
      },
    );
    addMessage(
      "kabir-1",
      id,
      "customer",
      "Can I schedule a reminder to everyone who hasn't checked in, and send myself a test first?",
      at,
    );
    addCitation(
      "kabir-1",
      assistantMsg,
      id,
      "attendee-announcements",
      "Test and schedule",
      0.79,
    );
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:kabir"),
      queueId: sid("queue:support"),
      subject: "Scheduling a not-checked-in reminder",
      status: "ai_active",
      risk: "low",
      sentiment: "confused",
      decision: "answer",
      assignedAgentId: null,
      handoffId: null,
      lastMessageAt: new Date(new Date(at).getTime() + 9000).toISOString(),
      lastCustomerQuestion:
        "Can I schedule a reminder to everyone who hasn't checked in?",
      page: "/events/open-mic-14/announcements",
      failureCount: 0,
      createdAt: at,
      updatedAt: new Date(new Date(at).getTime() + 9000).toISOString(),
    });
  }

  // 10. Priya — cancellation verified
  {
    const id = sid("conversation:priya-cancel");
    const at = daysAgo(2);
    const assistantMsg = addMessage(
      "priya-2",
      id,
      "assistant",
      "Your cancellation is verified. Pro stays active until 1 December 2026, then the workspace moves to Free. Your events, attendee records, and exports stay available; paid registration and offline check-in are disabled. Orbit keeps workspace data for 90 days after the downgrade, so you can reactivate without losing history. Cancelling does not delete your events.",
      new Date(new Date(at).getTime() + 10000).toISOString(),
      {
        decision: "answer",
        risk: "low",
        model: "deterministic-policy",
        policyVersion: "policy-2026.11.1",
        promptVersion: "answer-compose-1.2",
        knowledgeSnapshotVersion: KNOWLEDGE_SNAPSHOT_VERSION,
        latencyMs: 18,
        estimatedCostUsd: 0,
        traceId: "trace_seed_priya",
      },
    );
    addMessage(
      "priya-1",
      id,
      "customer",
      "I cancelled Pro yesterday. When does it end, and do we lose our Build Night registrations?",
      at,
    );
    addCitation(
      "priya-1",
      assistantMsg,
      id,
      "plans-billing-and-cancellation",
      "What happens after Pro ends",
      0.83,
    );
    conversations.push({
      id,
      organizationId: orgId,
      customerId: sid("customer:priya"),
      queueId: sid("queue:billing"),
      subject: "Cancellation timing and retained registrations",
      status: "resolved",
      risk: "low",
      sentiment: "calm",
      decision: "answer",
      assignedAgentId: sid("agent:rohan"),
      handoffId: null,
      lastMessageAt: new Date(new Date(at).getTime() + 10000).toISOString(),
      lastCustomerQuestion: "When does Pro end, and do we lose our registrations?",
      page: "/settings/billing",
      failureCount: 0,
      createdAt: at,
      updatedAt: new Date(new Date(at).getTime() + 10000).toISOString(),
    });
  }

  const journeys: Journey[] = [
    {
      id: sid("journey:welcome"),
      organizationId: orgId,
      key: "welcome",
      name: "Welcome",
      description:
        "A new workspace owner gets one clear first step, not a product tour.",
      triggerEvent: "user.created",
      condition: "New workspace owner",
      timing: "Immediately",
      subject: "Your club has a new home, {{first_name}}",
      preheader: "One setup step, then your first event page is live.",
      primaryAction: "Create your first event",
      exitRules: ["event.published"],
      entryLimit: "Once per workspace",
      emailKind: "welcome",
      status: "active",
      createdAt: daysAgo(400),
      updatedAt: daysAgo(20),
    },
    {
      id: sid("journey:inactivity"),
      organizationId: orgId,
      key: "inactivity-nudge",
      name: "Inactivity nudge",
      description:
        "A gentle reminder about a real unfinished draft. Never a guilt trip.",
      triggerEvent: "user.inactive",
      condition: "Inactive for 7+ days with an unfinished event draft",
      timing: "Cron, 09:30 workspace time",
      subject: "That event draft is getting stage fright",
      preheader:
        "{{draft_name}} is still saved. Pick it up when you have ten minutes.",
      primaryAction: "Continue {{draft_name}}",
      exitRules: ["event.published", "draft.deleted", "reminder.snoozed"],
      entryLimit: "Once per inactivity window",
      emailKind: "inactivity",
      status: "active",
      createdAt: daysAgo(400),
      updatedAt: daysAgo(20),
    },
    {
      id: sid("journey:feature"),
      organizationId: orgId,
      key: "offline-checkin",
      name: "Feature update",
      description:
        "Tell workspaces with an upcoming event about offline check-in — once per release.",
      triggerEvent: "feature.released",
      condition: "Release offline-checkin-v1 and workspace has an upcoming event",
      timing: "Immediately after release",
      subject: "The door works offline now",
      preheader: "Offline check-in is ready for {{event_name}}.",
      primaryAction: "Prepare offline check-in",
      exitRules: ["feature.adopted", "event.completed"],
      entryLimit: "Once per workspace per release version",
      emailKind: "feature-update",
      status: "active",
      createdAt: daysAgo(400),
      updatedAt: daysAgo(7),
    },
    {
      id: sid("journey:offboarding"),
      organizationId: orgId,
      key: "offboarding",
      name: "Offboarding",
      description:
        "A verified cancellation gets the facts: access, billing, data, and how to return.",
      triggerEvent: "subscription.cancelled",
      condition: "Cancellation verified by billing state",
      timing: "Within 5 minutes of verified cancellation",
      subject: "Pro ends on {{period_end}} — your events stay yours",
      preheader: "What stays, what changes, and how to come back.",
      primaryAction: "Review your billing options",
      exitRules: ["subscription.reactivated"],
      entryLimit: "Once per cancellation",
      emailKind: "offboarding",
      status: "active",
      createdAt: daysAgo(400),
      updatedAt: daysAgo(20),
    },
  ];

  const customerEvents: CustomerEvent[] = [
    {
      id: sid("event:ishita-created"),
      organizationId: orgId,
      customerId: sid("customer:ishita"),
      type: "user.created",
      payload: { workspaceOwner: true, source: "self_serve", plan: "pro_trial" },
      occurredAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      id: sid("event:priya-cancelled"),
      organizationId: orgId,
      customerId: sid("customer:priya"),
      type: "subscription.cancelled",
      payload: {
        billingStatus: "cancelled",
        periodEnd: daysAhead(10),
        plan: "pro",
      },
      occurredAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
  ];

  const enrollments: JourneyEnrollment[] = [];
  const journeyRuns: JourneyRun[] = [];
  const deliveries: Delivery[] = [];

  const { renderLifecycleEmail } = await import("@/lib/email/render");

  const seeded: {
    key: string;
    journeyKey: string;
    customerId: string;
    eventType: string;
    payload: Record<string, unknown>;
    at: string;
    status: "previewed" | "sent";
  }[] = [
    {
      key: "welcome-ishita",
      journeyKey: "welcome",
      customerId: sid("customer:ishita"),
      eventType: "user.created",
      payload: { workspaceOwner: true, source: "self_serve" },
      at: daysAgo(2),
      status: "previewed",
    },
    {
      key: "offboarding-priya",
      journeyKey: "offboarding",
      customerId: sid("customer:priya"),
      eventType: "subscription.cancelled",
      payload: { billingStatus: "cancelled", periodEnd: daysAhead(10) },
      at: daysAgo(2),
      status: "previewed",
    },
  ];

  for (const item of seeded) {
    const journey = journeys.find((j) => j.key === item.journeyKey)!;
    const customer = customers.find((c) => c.id === item.customerId)!;
    const enrollmentId = sid(`enrollment:${item.key}`);
    const enrollment: JourneyEnrollment = {
      id: enrollmentId,
      organizationId: orgId,
      journeyId: journey.id,
      customerId: customer.id,
      status: "active",
      suppressionReason: null,
      dedupeKey: `${journey.key}:${customer.id}:${item.at.slice(0, 10)}`,
      enteredAt: item.at,
      completedAt: null,
      updatedAt: item.at,
    };
    enrollments.push(enrollment);
    journeyRuns.push({
      id: sid(`run:${item.key}`),
      organizationId: orgId,
      journeyId: journey.id,
      enrollmentId,
      eventType: item.eventType,
      eventPayload: item.payload,
      status: "enrolled",
      detail: `Seeded example: ${journey.condition}.`,
      createdAt: item.at,
    });
    const rendered = await renderLifecycleEmail({
      journey,
      customer,
      organization: org,
    });
    deliveries.push({
      id: sid(`delivery:${item.key}`),
      organizationId: orgId,
      journeyId: journey.id,
      enrollmentId,
      customerId: customer.id,
      recipient: customer.email,
      subject: rendered.subject,
      preheader: rendered.preheader,
      html: rendered.html,
      text: rendered.text,
      status: item.status,
      provider: "demo-sink",
      error: null,
      attempts: item.status === "sent" ? 1 : 0,
      scheduledFor: null,
      sentAt: item.status === "sent" ? item.at : null,
      createdAt: item.at,
      updatedAt: item.at,
    });
  }

  const auditLogs: AuditLog[] = [
    {
      id: sid("audit:policy"),
      organizationId: orgId,
      actor: "Asha Menon",
      action: "policy.published",
      entityType: "policy",
      entityId: "policy-2026.11.1",
      detail: {
        change: "Added duplicate-charge and lost-owner-email escalation rules",
        version: "policy-2026.11.1",
      },
      createdAt: daysAgo(12),
    },
    {
      id: sid("audit:source-index"),
      organizationId: orgId,
      actor: "Arjun Mehta",
      action: "source.indexed",
      entityType: "knowledge_source",
      entityId: sourceBySlug.get("kb-attendee-export")!.id,
      detail: {
        title: "Exporting attendees",
        version: "2.4",
        chunks: chunks.filter(
          (c) => c.sourceId === sourceBySlug.get("kb-attendee-export")!.id,
        ).length,
      },
      createdAt: daysAgo(3),
    },
    {
      id: sid("audit:maya-handoff"),
      organizationId: orgId,
      actor: "ProofDesk policy engine",
      action: "handoff.created",
      entityType: "handoff",
      entityId: sid("handoff:maya"),
      detail: {
        queue: "Billing",
        reason: "Payment exception requires billing verification",
        risk: "high",
      },
      createdAt: hoursAgo(1.85),
    },
    {
      id: sid("audit:journey-feature"),
      organizationId: orgId,
      actor: "Kabir Sethi",
      action: "journey.updated",
      entityType: "journey",
      entityId: sid("journey:feature"),
      detail: {
        change: "Entry limit set to once per workspace per release version",
      },
      createdAt: daysAgo(7),
    },
    {
      id: sid("audit:dev-reply"),
      organizationId: orgId,
      actor: "Rohan Kapoor",
      action: "agent.replied",
      entityType: "conversation",
      entityId: sid("conversation:dev-duplicate"),
      detail: { message: "Duplicate authorisation reversal started" },
      createdAt: hoursAgo(6.2),
    },
    {
      id: sid("audit:export-arjun"),
      organizationId: orgId,
      actor: "Arjun Mehta",
      action: "attendee.exported",
      entityType: "event",
      entityId: "design-summit-2026",
      detail: { filter: "payment_status=paid", rows: 412 },
      createdAt: daysAgo(1),
    },
  ];

  return {
    organization: org,
    agents,
    customers,
    queues,
    knowledgeSources: sources,
    knowledgeChunks: chunks,
    conversations,
    messages,
    citations,
    handoffs,
    customerEvents,
    journeys,
    enrollments,
    journeyRuns,
    deliveries,
    evalCases: evalCases().map((c) => ({ ...c, organizationId: orgId })),
    auditLogs,
  };
}

export { KNOWLEDGE_SNAPSHOT_VERSION };
export const SEED_VERSION = "2026-11-24.1";
