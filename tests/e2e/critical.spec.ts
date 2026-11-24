import { expect, test } from "@playwright/test";

test("1. paid-attendee question returns grounded answer and only relevant evidence", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Orbit home" })).toBeVisible();
  await page.getByLabel("Open ProofDesk support chat").click();
  await page
    .getByRole("button", { name: "How do I export only paid attendees?" })
    .click();
  await expect(page.getByText(/1 approved source cited/)).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByText(/Exporting attendees/).first()).toBeVisible();
  await expect(page.getByText("kb-attendee-export")).toBeVisible();
  await expect(page.getByText("updated 2026-10-18")).toBeVisible();
  await expect(page.getByText(/Payment status to Paid/).first()).toBeVisible();
  await page.getByRole("button", { name: /1 approved source cited/ }).click();
  await expect(page.getByText(/Exporting attendees/i).first()).toBeVisible();
  await expect(page.getByText(/Capacity, waitlists/)).toHaveCount(0);
});

test("1b. follow-up keeps the export conversation and explains the Paid filter", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Open ProofDesk support chat").click();
  await page
    .getByLabel("Message ProofDesk")
    .fill("How do I export everyone registered for our hackathon?");
  await page.getByLabel("Send message").click();
  await expect(page.getByText(/kb-attendee-export/).first()).toBeVisible({
    timeout: 20000,
  });
  await page.reload();
  await page.getByLabel("Open ProofDesk support chat").click();
  await expect(
    page.getByText("How do I export everyone registered for our hackathon?"),
  ).toBeVisible();
  await page.getByLabel("Message ProofDesk").fill("Only those who paid, though.");
  await page.getByLabel("Send message").click();
  await expect(page.getByText("kb-attendee-export").last()).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByText(/Payment status to Paid/).last()).toBeVisible();
});

test("2. unsupported auditorium request abstains and attaches no weak source", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Open ProofDesk support chat").click();
  await page
    .getByRole("button", { name: "Can Orbit reserve our auditorium?" })
    .click();
  await expect(
    page
      .getByText(/outside product support scope|don't have an approved Orbit source/i)
      .first(),
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/\d+ approved source/)).toHaveCount(0);
});

test("3. duplicate-charge escalation in Context A appears in /desk in Context B", async ({
  browser,
}) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await pageA.setViewportSize({ width: 1440, height: 900 });
  await pageB.setViewportSize({ width: 1440, height: 900 });
  await pageA.goto("/");
  await pageA.getByLabel("Open ProofDesk support chat").click();
  await pageA
    .getByLabel("Message ProofDesk")
    .fill("I was charged twice for one ticket.");
  await pageA.getByLabel("Send message").click();
  await expect(pageA.getByText("Escalation").first()).toBeVisible({
    timeout: 20000,
  });
  const deskLink = pageA.getByRole("link", {
    name: "Open this conversation on the agent desk",
  });
  await expect(deskLink).toBeVisible();
  const href = await deskLink.getAttribute("href");
  expect(href).toContain("/desk?conversation=");

  await pageB.goto(href ?? "/desk");
  await expect(pageB.getByText("I was charged twice for one ticket.").first()).toBeVisible({
    timeout: 20000,
  });
  await expect(
    pageB.getByText("Payment exception requires billing verification").first(),
  ).toBeVisible();
  await expect(pageB.getByText("Customer goal")).toBeVisible();
  await expect(pageB.getByText("Recommended next action")).toBeVisible();

  await contextA.close();
  await contextB.close();
});

test("4. agent reply and resolution persist after reload", async ({ page }) => {
  await page.goto("/desk");
  await expect(page.getByLabel("Search conversations")).toBeVisible();
  const firstRow = page
    .getByRole("button", { name: /Maya Rao|Aarav|Kavita|Design Summit|Unknown/ })
    .first();
  await firstRow.click();

  const reopenBtn = page
    .locator("main")
    .getByRole("button", { name: "Reopen" });
  if (await reopenBtn.isVisible()) {
    await reopenBtn.click();
    await page.waitForTimeout(400);
  }

  const uniqueReply = `Resolution note verified ${Date.now()}`;
  const textarea = page.locator("main").getByPlaceholder(/Reply as/);
  if (await textarea.isVisible()) {
    await textarea.fill(uniqueReply);
    await page
      .locator("main")
      .getByRole("button", { name: "Send & resolve" })
      .click();
    await expect(
      page.getByText(/Reply sent\.|Conversation resolved\./),
    ).toBeVisible({
      timeout: 15000,
    });
  } else {
    const resolveBtn = page
      .locator("main")
      .getByRole("button", { name: "Resolve" });
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
      await expect(page.getByText("Conversation resolved.")).toBeVisible({
        timeout: 15000,
      });
    }
  }

  await page.reload();
  await expect(page.getByLabel("Search conversations")).toBeVisible();
  const firstRowReloaded = page
    .getByRole("button", { name: /Maya Rao|Aarav|Kavita|Design Summit|Unknown/ })
    .first();
  await firstRowReloaded.click();
  await expect(
    page.locator("main").getByText(/resolved/i).first(),
  ).toBeVisible({
    timeout: 15000,
  });
});

test("5. lifecycle run and delivery preview persist after reload", async ({
  page,
}) => {
  await page.goto("/journeys");
  await expect(page.getByText("Email that knows when to stop.")).toBeVisible();

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/cron/inactivity") &&
        res.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Run inactivity cron" }).click(),
  ]);
  expect(response.status()).toBe(200);

  await page.getByRole("button", { name: /Email sink/ }).click();
  await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });
  const rowCount = await page.locator("tbody tr").count();
  expect(rowCount).toBeGreaterThan(0);

  await page.reload();
  await page.getByRole("button", { name: /Email sink/ }).click();
  await expect(page.getByRole("table")).toBeVisible({ timeout: 10000 });
  const rowCountAfter = await page.locator("tbody tr").count();
  expect(rowCountAfter).toBeGreaterThanOrEqual(rowCount);
});

test("5b. each lifecycle journey can be tested and stays previewed", async ({
  page,
}) => {
  await page.goto("/journeys");
  for (const name of [
    "Welcome",
    "Inactivity nudge",
    "Feature update",
    "Offboarding",
  ]) {
    await page.getByRole("button", { name: new RegExp(name) }).first().click();
    await expect(page.getByTestId("journey-final-copy")).not.toContainText("{{");
    await page.getByRole("button", { name: "Test journey" }).click();
    await expect(page.getByTestId("journey-test-result")).toContainText(
      "previewed",
      { timeout: 20000 },
    );
    await expect(page.getByTestId("journey-test-result")).not.toContainText("{{");
    await page.getByRole("button", { name: "Close preview" }).click();
  }
});

test("5c. answer endpoint returns the public contract", async ({ request }) => {
  const response = await request.post("/api/answer", {
    data: { question: "How do I export only paid attendees?" },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as {
    answer: string;
    decision: string;
    sources: { key: string }[];
    escalate: boolean;
    escalationReason: string | null;
    conversationId: string;
    model: string;
    mode: string;
    latencyMs: number;
    estimatedCostUsd: number;
    traceId: string;
  };
  expect(body.answer.length).toBeGreaterThan(40);
  expect(body.decision).toBe("answer");
  expect(body.sources).toHaveLength(1);
  expect(body.sources[0]?.key).toBe("kb-attendee-export");
  expect(body.escalate).toBe(false);
  expect(body.conversationId).toBeTruthy();
  expect(body.model).toBeTruthy();
  expect(body.mode).toBe("deterministic-demo");
  expect(body.latencyMs).toBeGreaterThan(0);
  expect(body.estimatedCostUsd).toBe(0);
  expect(body.traceId).toMatch(/^trace_/);
  expect(body.escalationReason).toBeNull();
});

test("6. trust center runs suite, updates metrics, and persists run", async ({
  page,
}) => {
  await page.goto("/trust");
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/evaluations/run") &&
        res.request().method() === "POST",
    ),
    page.getByRole("button", { name: /20-case suite/ }).click(),
  ]);
  expect(response.status()).toBe(201);
  const payload = (await response.json()) as {
    run: { passed: number; total: number; status: string };
  };
  expect(payload.run.status).toBe("completed");
  expect(payload.run.passed).toBe(20);
  expect(payload.run.total).toBe(20);
  await expect(page.getByText("20/20").first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText("All gates passed")).toBeVisible();

  await page.reload();
  await expect(page.getByText("20/20").first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("All gates passed")).toBeVisible();
});

test("7. reviewer-facing controls produce observable outcomes", async ({
  page,
}) => {
  await page.goto("/knowledge");
  await expect(page.getByText("Knowledge, with receipts.")).toBeVisible();

  await page.getByRole("button", { name: "Retrieval" }).click();
  await expect(
    page.getByPlaceholder("Ask the knowledge base…"),
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Retrieve", exact: true }).click();
  await expect(page.getByText("Answered from evidence")).toBeVisible({
    timeout: 20000,
  });

  await page.getByRole("button", { name: "Audit trail" }).click();
  await expect(
    page.getByText(/indexed|seeded|audit/i).first(),
  ).toBeVisible({ timeout: 10000 });

  await page.goto("/journeys");
  await expect(
    page.getByRole("button", { name: "Preview" }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview" }).first().click();
  await expect(
    page.getByRole("button", { name: "Plain text" }),
  ).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Plain text" }).click();
  await page.getByRole("button", { name: "Close preview" }).click();
  await expect(page.getByRole("button", { name: "Close preview" })).toHaveCount(0);
});

test("8. mobile chat fits 390x844 viewport and remains usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Orbit home" })).toBeVisible();

  const chatBtn = page.getByLabel("Open ProofDesk support chat");
  await expect(chatBtn).toBeVisible();
  await chatBtn.click();

  const chatDialog = page.getByLabel("ProofDesk support chat");
  await expect(chatDialog).toBeVisible();

  const box = await chatDialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThanOrEqual(390);

  const input = page.getByLabel("Message ProofDesk");
  await expect(input).toBeVisible();
  await input.fill("Which roles can issue a refund?");
  await page.getByLabel("Send message").click();

  await expect(
    page.getByText(/Owners and admins can issue/i).first(),
  ).toBeVisible({
    timeout: 20000,
  });
});

test("9. zero console errors or failed first-party requests across routes", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    if (url.includes("127.0.0.1") || url.includes("localhost")) {
      failedRequests.push(`${req.method()} ${url}: ${req.failure()?.errorText}`);
    }
  });

  for (const path of ["/", "/desk", "/journeys", "/trust", "/knowledge"]) {
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");
  }

  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
