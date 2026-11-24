"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./ui";

const nav = [
  { href: "/#product", label: "Product" },
  { href: "/desk", label: "Desk" },
  { href: "/journeys", label: "Journeys" },
  { href: "/trust", label: "Trust" },
  { href: "/knowledge", label: "Knowledge" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="page-shell flex h-[62px] items-center justify-between gap-3">
        <Link href="/" aria-label="Orbit home" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-paper-2 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/trust"
            className="mono hidden items-center gap-2 rounded-full border border-line bg-white/60 px-3 py-1.5 text-[12px] uppercase tracking-[0.1em] text-muted lg:inline-flex"
          >
            <span className="size-1.5 rounded-full bg-forest" />
            Evidence-conditioned
          </Link>
          <Link href="/desk" className="btn btn-primary !px-3.5 !py-2 !text-[12.5px] sm:!px-4">
            Open the desk
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg border border-line bg-white/70 text-ink md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-line bg-paper px-6 py-2 md:hidden" aria-label="Mobile">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center border-b border-line/70 text-[14px] font-medium last:border-b-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-2/60">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
            The event operating system for campus clubs and committees. ProofDesk
            is the support desk that cites its evidence and knows when to stop.
          </p>
          <p className="mono mt-6 text-[12px] uppercase tracking-[0.12em] text-muted">
            YARC Builder Fellowship 2027 · Track 05
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            { href: "/#product", label: "Event operations" },
            { href: "/journeys", label: "Lifecycle email" },
            { href: "/knowledge", label: "Knowledge base" },
          ]}
        />
        <FooterCol
          title="ProofDesk"
          links={[
            { href: "/desk", label: "Agent desk" },
            { href: "/trust", label: "Trust Center" },
            { href: "/api/health", label: "Health" },
          ]}
        />
        <FooterCol
          title="Demo"
          links={[
            { href: "/trust", label: "Run the eval" },
            { href: "/knowledge", label: "Retrieval playground" },
            { href: "/journeys", label: "Email sink" },
          ]}
        />
      </div>
      <div className="page-shell flex flex-col gap-2 border-t border-line py-5 text-[12px] leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Orbit is a fictional product built for the YARC Builder Fellowship
          application. All customers are synthetic.
        </span>
        <span className="mono text-[12px] uppercase tracking-[0.1em]">
          No real email · No live payments
        </span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[13px] text-ink-2 transition-colors hover:text-forest"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
