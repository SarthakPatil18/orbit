import type {
  Decision,
  PolicyRule,
  RetrievalResult,
  Risk,
  Sentiment,
  Signal,
} from "@/lib/types";

export const POLICY_VERSION = "policy-2026.11.1";
export const PROMPT_VERSION = "answer-compose-1.2";

export type RiskCategory =
  | "payment"
  | "security"
  | "deletion"
  | "identity"
  | "injection"
  | "hidden_instructions"
  | "third_party"
  | "out_of_scope"
  | "frustration"
  | "repetition"
  | "human"
  | "stale"
  | "conflict"
  | "unsupported"
  | "normal";

export interface PolicyInput {
  question: string;
  retrieval: RetrievalResult;
  priorTurns: { role: "customer" | "assistant"; content: string }[];
  failureCount: number;
  page?: string | null;
}

export interface PolicyOutcome {
  decision: Decision;
  risk: Risk;
  sentiment: Sentiment;
  reason: string | null;
  riskCategory: RiskCategory;
  signals: Signal[];
  rules: PolicyRule[];
  missingFields: string[];
  missingInformation: string[];
  answerability: {
    score: number;
    sufficient: boolean;
    reasons: string[];
  };
  injection: { detected: boolean; patterns: string[] };
  clarifyQuestion: string | null;
}

function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  if (
    /\b(scared|afraid|urgent|emergency|compromised|hacked|fraud|stolen|panic|desperate)\b/.test(
      lower,
    )
  ) {
    return "distressed";
  }
  if (
    /\b(angry|furious|unacceptable|ridiculous|useless|sick of|fed up|third time|charged twice|still not|again|terrible)\b/.test(
      lower,
    )
  ) {
    return "frustrated";
  }
  if (
    /\b(confused|not sure|don't understand|dont understand|unclear|which one|what happens|how do i|where do i)\b/.test(
      lower,
    )
  ) {
    return "confused";
  }
  return "calm";
}

function termsOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function rule(
  id: string,
  label: string,
  triggered: boolean,
  detail: string,
): PolicyRule {
  return { id, label, triggered, detail };
}

export function decideAutonomy(input: PolicyInput): PolicyOutcome {
  const question = input.question.trim();
  const lower = question.toLowerCase();
  const sentiment = detectSentiment(question);
  const retrieval = input.retrieval;
  const top = retrieval.candidates[0];
  const priorCustomers = input.priorTurns.filter((t) => t.role === "customer");
  const repeated =
    priorCustomers.length > 0 &&
    jaccard(
      termsOf(question),
      termsOf(priorCustomers[priorCustomers.length - 1]?.content ?? ""),
    ) >= 0.6;
  const explicitHuman =
    /\b(talk|speak|connect|chat)\b.{0,24}\b(person|human|someone|representative|agent)\b/.test(
      lower,
    ) ||
    /\b(real person|human being|human support|support agent|account manager)\b/.test(
      lower,
    ) ||
    /\bi (need|want) (a )?(person|human|someone)\b/.test(lower);

  const duplicateCharge =
    /\b(charged twice|double charge|duplicate charge|duplicate payment|two charges|charged again|unrecogni[sz]ed charge|unrecognised payment|extra charge|billing dispute|wrongly charged|overcharged)\b/.test(
      lower,
    ) ||
    /\b(charge|charged|payment)\b.{0,40}\b(twice|duplicate|double|again|two)\b/.test(
      lower,
    );

  const securityConcern =
    /\b(compromised|hacked|account takeover|unauthori[sz]ed|someone changed|bank details|settlement account|suspicious login|security concern|fraud)\b/.test(
      lower,
    ) ||
    /\b(change|changed|update|updated|edit|edited)\b.{0,30}\b(payment details|bank details|settlement account)\b/.test(
      lower,
    );

  const deletionOrIdentity =
    /\b(delete|deletion|erase|destroy|remove)\b.{0,30}\b(workspace|account|data|organization|organisation)\b/.test(
      lower,
    ) ||
    /\b(workspace|account) deletion\b/.test(lower) ||
    /\b(owner email|change ownership|transfer ownership|identity change|lost access)\b/.test(
      lower,
    ) ||
    /\bno longer have access\b.{0,40}\bemail\b/.test(lower) ||
    /\b(privacy exception|gdpr|dpdp)\b/.test(lower);

  const refundRequest =
    /\b(refund me|give me a refund|send me a refund|process (a|the) refund)\b/.test(
      lower,
    ) ||
    /\b(please|can you|could you|go ahead and|i want you to|i need you to)\b.{0,30}\brefund\b/.test(
      lower,
    ) ||
    /\brefund\b.{0,30}\b(outside|exception)\b/.test(lower) ||
    /\b(outside|exception)\b.{0,30}\brefund\b/.test(lower) ||
    (explicitHuman && /\brefund\b/.test(lower));

  const hiddenInstructions =
    /\b(system prompt|developer instructions|hidden instructions|hidden prompt|internal policy|prompt injection|reveal your (rules|instructions|prompt)|show me your (rules|prompt|instructions))\b/.test(
      lower,
    );

  const bypassInstruction =
    /\b(ignore|bypass|override|disregard|circumvent)\b.{0,40}\b(policy|rules|instructions|guardrails|approval)\b/.test(
      lower,
    ) ||
    /\bapprove every refund\b/.test(lower) ||
    /\b(act as|pretend to be)\b.{0,30}\b(admin|owner|developer)\b/.test(lower) ||
    /\bfollow (any )?instructions? (inside|in|from) (the|that|this|a) (source|article|document|excerpt|it)\b/.test(
      lower,
    ) ||
    /\b(follow|obey|execute)\b.{0,40}\binstructions?\b/.test(lower) ||
    /\binstructions? (inside|in|from)\b/.test(lower);

  const sensitiveAction =
    /\b(refund|payment details|bank details|settlement|delete|deletion|erase|owner email|transfer ownership|change payment)\b/.test(
      lower,
    );

  const thirdPartyPromise =
    /\b(guarantee|promise|ensure|make sure)\b.{0,70}\b(students?|attendees?|turnout|attendance|sales|show up|people will)\b/.test(
      lower,
    ) || /\b(guarantee|promise)\b.{0,40}\b(outcome|result|revenue)\b/.test(lower);

  const outOfScopeVenue =
    /\b(reserve|reserving|book|booking)\b.{0,40}\b(auditorium|venue|hall|room|grounds?)\b/.test(
      lower,
    ) || /\bauditorium\b/.test(lower);

  const executiveContact =
    /\b(ceo|founder|director)\b.{0,40}\b(phone|number|email|address|contact)\b/.test(
      lower,
    ) ||
    /\b(personal|private)\b.{0,20}\b(phone|number|email|address)\b/.test(lower);

  const frustration =
    /\b(angry|furious|unacceptable|ridiculous|useless|sick of|fed up|third time|terrible|worst)\b/.test(
      lower,
    );
  const twoFailures = input.failureCount >= 2;
  const repetition = repeated && !input.priorTurns.length ? false : repeated;

  const injectionDetected = hiddenInstructions || bypassInstruction;
  const injectionPatterns: string[] = [];
  if (hiddenInstructions) injectionPatterns.push("hidden_instructions");
  if (bypassInstruction) injectionPatterns.push("policy_bypass");
  if (/\b(ignore|disregard)\b/.test(lower) && /\b(previous|prior|above)\b/.test(lower)) {
    injectionPatterns.push("instruction_override");
  }

  const signals: Signal[] = [];
  const addSignal = (
    code: string,
    label: string,
    detail: string,
    severity: Signal["severity"],
    weight: number,
  ) => signals.push({ code, label, detail, severity, weight });

  if (explicitHuman) {
    addSignal(
      "explicit_human",
      "Explicit request for a person",
      "The customer asked to speak with a human.",
      "warn",
      0.5,
    );
  }
  if (duplicateCharge) {
    addSignal(
      "payment_exception",
      "Payment exception",
      "Duplicate, unrecognised, or disputed charge detected.",
      "critical",
      0.8,
    );
  }
  if (securityConcern) {
    addSignal(
      "security_concern",
      "Security concern",
      "Account compromise or settlement-detail change detected.",
      "critical",
      0.9,
    );
  }
  if (deletionOrIdentity) {
    addSignal(
      "deletion_identity",
      "Deletion or identity exception",
      "Workspace deletion, ownership, or identity verification is involved.",
      "critical",
      0.85,
    );
  }
  if (injectionDetected) {
    addSignal(
      "injection",
      "Instruction-boundary attempt",
      `Detected: ${injectionPatterns.join(", ") || "policy override"}.`,
      "critical",
      0.9,
    );
  }
  if (frustration) {
    addSignal(
      "frustration",
      "Strong frustration",
      "The wording signals strong frustration.",
      "warn",
      0.35,
    );
  }
  if (twoFailures) {
    addSignal(
      "repeated_failure",
      "Two recent failed attempts",
      `${input.failureCount} recent assistant attempts did not resolve the request.`,
      "warn",
      0.4,
    );
  }
  if (repetition) {
    addSignal(
      "repetition",
      "Repeated request",
      "The customer repeated substantially the same request.",
      "warn",
      0.25,
    );
  }
  if (retrieval.topScore < retrieval.threshold) {
    addSignal(
      "retrieval_weak",
      "No source above threshold",
      `Top evidence score ${retrieval.topScore.toFixed(2)} is below the ${retrieval.threshold.toFixed(2)} threshold.`,
      "warn",
      -0.4,
    );
  } else {
    addSignal(
      "evidence_sufficient",
      "Approved evidence above threshold",
      `${top?.sourceTitle ?? "A source"} scored ${retrieval.topScore.toFixed(2)} with a ${retrieval.margin.toFixed(2)} separation margin.`,
      "info",
      0.3,
    );
  }
  if (retrieval.staleTop) {
    addSignal(
      "source_stale",
      "Stale evidence",
      "The strongest matching source is stale or retired.",
      "critical",
      -0.5,
    );
  }
  if (retrieval.contradiction) {
    addSignal(
      "source_conflict",
      "Conflicting sources",
      retrieval.contradiction,
      "critical",
      -0.5,
    );
  }
  if (retrieval.topScore >= retrieval.threshold && retrieval.margin < 0.02) {
    addSignal(
      "thin_separation",
      "Thin source separation",
      "Two sources are too close to choose safely.",
      "warn",
      -0.2,
    );
  }

  const answerabilityReasons: string[] = [];
  let sufficient = true;
  if (!top) {
    sufficient = false;
    answerabilityReasons.push("No approved source matched the question.");
  }
  if (retrieval.topScore < retrieval.threshold) {
    sufficient = false;
    answerabilityReasons.push(
      `Top score ${retrieval.topScore.toFixed(2)} is below the ${retrieval.threshold.toFixed(2)} threshold.`,
    );
  }
  if (retrieval.staleTop) {
    sufficient = false;
    answerabilityReasons.push("The strongest source is stale or retired.");
  }
  if (retrieval.contradiction) {
    sufficient = false;
    answerabilityReasons.push("Approved sources contradict each other.");
  }
  if (
    retrieval.topScore >= retrieval.threshold &&
    retrieval.margin < 0.02 &&
    retrieval.topScore < 0.65
  ) {
    sufficient = false;
    answerabilityReasons.push("Source separation is too thin for a safe answer.");
  }
  if (sufficient && top) {
    answerabilityReasons.push(
      `${top.sourceTitle} (${top.version}) is approved, current, and above threshold.`,
    );
  }

  const rules: PolicyRule[] = [
    rule(
      "explicit_human",
      "Explicit human request",
      explicitHuman,
      "Escalate when the customer asks for a person.",
    ),
    rule(
      "payment_exception",
      "Duplicate or disputed charge",
      duplicateCharge || refundRequest,
      "Escalate billing exceptions for account verification.",
    ),
    rule(
      "security",
      "Account compromise or security concern",
      securityConcern,
      "Escalate security incidents immediately.",
    ),
    rule(
      "deletion_identity",
      "Workspace deletion or identity exception",
      deletionOrIdentity,
      "Escalate deletion and identity changes for verification.",
    ),
    rule(
      "prompt_injection",
      "Instruction-boundary or policy-bypass attempt",
      injectionDetected,
      "Never let retrieved or customer text override policy.",
    ),
    rule(
      "third_party_promise",
      "Third-party outcome promise",
      thirdPartyPromise,
      "Abstain from promising attendance, sales, or other third-party outcomes.",
    ),
    rule(
      "out_of_scope",
      "Outside Orbit product scope",
      outOfScopeVenue || executiveContact,
      "Abstain when the request is outside approved product scope.",
    ),
    rule(
      "frustration",
      "Strong frustration",
      frustration,
      "Escalate strong frustration instead of making the customer repeat themselves.",
    ),
    rule(
      "repeated_failure",
      "Repeated failure or repetition",
      twoFailures || repetition,
      "Escalate after repeated attempts or a repeated request.",
    ),
    rule(
      "no_evidence",
      "No approved evidence above threshold",
      retrieval.topScore < retrieval.threshold,
      `Threshold is ${retrieval.threshold.toFixed(2)}.`,
    ),
    rule(
      "stale_or_conflicting",
      "Stale or contradictory evidence",
      retrieval.staleTop || Boolean(retrieval.contradiction),
      retrieval.contradiction ?? (retrieval.staleTop ? "Top source is stale." : "No conflict."),
    ),
  ];

  let decision: Decision;
  let risk: Risk;
  let riskCategory: RiskCategory;
  let reason: string | null = null;
  let clarifyQuestion: string | null = null;

  const clarifyExport = /^(how do i|how can i|where do i)\s+export\??$/i.test(
    question,
  );
  const clarifyNotWorking =
    /\b(not working|doesn't work|does not work|isn't working|is not working|broken)\b/.test(
      lower,
    ) && input.retrieval.normalizedQuery.split(" ").length < 4;
  const clarifyChange = /\b(change it|update it|fix it|do that|change that)\b/.test(
    lower,
  );
  const clarifyPaidOnes =
    /^only the paid ones\.?$/i.test(question) &&
    !input.priorTurns.some((t) => t.role === "customer");
  const clarifyWhatAbout =
    /\bwhat about (it|that|this|them)\b/.test(lower) && !input.priorTurns.length;

  if (duplicateCharge || refundRequest) {
    decision = "escalate";
    risk = "high";
    riskCategory = "payment";
    reason = "Payment exception requires billing verification";
  } else if (securityConcern) {
    decision = "escalate";
    risk = "high";
    riskCategory = "security";
    reason = "Security concern requires immediate human review";
  } else if (deletionOrIdentity) {
    decision = "escalate";
    risk = "high";
    riskCategory = "deletion";
    reason = "Workspace deletion or identity verification requires Trust & Safety";
  } else if (bypassInstruction || (hiddenInstructions && sensitiveAction)) {
    decision = "escalate";
    risk = "high";
    riskCategory = "injection";
    reason = "Instruction-boundary attempt combined with a sensitive action";
  } else if (hiddenInstructions) {
    decision = "abstain";
    risk = "low";
    riskCategory = "hidden_instructions";
    reason = "Hidden system or developer instructions cannot be disclosed";
  } else if (thirdPartyPromise) {
    decision = "abstain";
    risk = "low";
    riskCategory = "third_party";
    reason = "Orbit cannot promise a third-party outcome";
  } else if (outOfScopeVenue || executiveContact) {
    decision = "abstain";
    risk = "low";
    riskCategory = "out_of_scope";
    reason = executiveContact
      ? "Personal contact details are outside product support scope"
      : "Venue reservation is outside Orbit product scope";
  } else if (explicitHuman) {
    decision = "escalate";
    risk = "medium";
    riskCategory = "human";
    reason = "Customer explicitly requested a human";
  } else if (twoFailures || repetition) {
    decision = "escalate";
    risk = "medium";
    riskCategory = "repetition";
    reason = "Repeated attempts did not resolve the request";
  } else if (frustration) {
    decision = "escalate";
    risk = "medium";
    riskCategory = "frustration";
    reason = "Strong frustration detected";
  } else if (clarifyExport) {
    decision = "clarify";
    risk = "low";
    riskCategory = "normal";
    clarifyQuestion =
      "Which export do you need: attendee CSV, payments, or a full workspace export?";
    reason = "One detail is needed to answer safely";
  } else if (clarifyNotWorking) {
    decision = "clarify";
    risk = "low";
    riskCategory = "normal";
    clarifyQuestion =
      "Which part isn't working: the registration page, check-in, payments, or email delivery?";
    reason = "One detail is needed to answer safely";
  } else if (clarifyChange) {
    decision = "clarify";
    risk = "low";
    riskCategory = "normal";
    clarifyQuestion =
      "What would you like to change: the event details, ticket price, or team permissions?";
    reason = "One detail is needed to answer safely";
  } else if (clarifyPaidOnes) {
    decision = "clarify";
    risk = "low";
    riskCategory = "normal";
    clarifyQuestion =
      "Which list should I filter to paid: attendees for a specific event, or payments?";
    reason = "The previous context is missing";
  } else if (clarifyWhatAbout) {
    decision = "clarify";
    risk = "low";
    riskCategory = "normal";
    clarifyQuestion =
      "What does “that” refer to — your event, a registration, a payment, or your plan?";
    reason = "One detail is needed to answer safely";
  } else if (retrieval.staleTop || retrieval.contradiction) {
    decision = "abstain";
    risk = "low";
    riskCategory = retrieval.contradiction ? "conflict" : "stale";
    reason = retrieval.contradiction
      ? "Approved sources conflict and the answer cannot be safely qualified"
      : "The only matching source is stale and cannot be used as current guidance";
  } else if (sufficient) {
    decision = "answer";
    risk = "low";
    riskCategory = "normal";
    reason = null;
  } else {
    decision = "abstain";
    risk = "low";
    riskCategory = "unsupported";
    reason = "No approved evidence is sufficient to answer";
  }

  const missingInformation: string[] = [];
  const missingFields: string[] = [];
  if (riskCategory === "payment") {
    missingFields.push("payment_reference", "registration_email");
    missingInformation.push(
      "The payment reference IDs for both charges",
      "The email used at registration, if different from the workspace email",
      "Whether both charges are settled or one is still pending",
    );
  } else if (riskCategory === "deletion") {
    missingFields.push("owner_verification", "committee_authority");
    missingInformation.push(
      "Identity verification for the workspace owner",
      "Evidence of committee authority for the change",
      "An accessible contact email for the outcome",
    );
  } else if (riskCategory === "security") {
    missingFields.push("affected_account", "change_time");
    missingInformation.push(
      "Which account or payment method was changed",
      "When the change happened",
      "Whether the customer still has access to the account",
    );
  } else if (riskCategory === "human" || riskCategory === "frustration") {
    missingInformation.push(
      "The outcome the customer needs from a person",
      "Any deadline the customer is working against",
    );
  } else if (decision === "escalate") {
    missingInformation.push("Account or workspace verification");
  }

  return {
    decision,
    risk,
    sentiment,
    reason,
    riskCategory,
    signals,
    rules,
    missingFields,
    missingInformation,
    answerability: {
      score: Number(retrieval.topScore.toFixed(4)),
      sufficient,
      reasons: answerabilityReasons,
    },
    injection: {
      detected: injectionDetected,
      patterns: injectionPatterns,
    },
    clarifyQuestion,
  };
}
