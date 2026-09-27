/**
 * Thank-you page shown after a demo request is sent from the landing page.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, NEXT_STEPS, SpecList, Stop, label, micro } from "~/app/_components/landing/ds";
import { landingFonts } from "~/app/_components/landing/fonts";
import "~/styles/landing.css";

interface DemoRequest {
  name: string;
  business: string;
  email: string;
  phone: string;
  staff: string;
  method: string;
}

export default function ThanksPage(): React.JSX.Element {
  const [req, setReq] = useState<DemoRequest | null>(null);

  useEffect(() => {
    try {
      setReq(JSON.parse(sessionStorage.getItem("tt-demo-request") ?? "null") as DemoRequest | null);
    } catch {}
  }, []);

  const first = req?.name.trim().split(/\s+/)[0];

  return (
    <div
      data-tt-root=""
      data-theme="paper"
      className={landingFonts}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg)", borderBottom: "var(--border-panel)" }}>
        <div
          style={{
            maxWidth: "var(--measure-page)",
            margin: "0 auto",
            padding: "18px var(--gutter)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div data-r="brand" style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            <Link href="/" style={{ fontSize: "19px", fontWeight: 600, letterSpacing: "-.02em", color: "var(--ink)" }}>
              TimeTally
              <Stop />
            </Link>
            <span data-hide-sm="" style={{ width: 1, height: 16, background: "var(--line-strong)" }} />
            <a href="https://stashlabs.com.au" style={{ ...micro, color: "var(--ink-2)", whiteSpace: "nowrap" }}>
              A Stash Labs<span style={{ color: "var(--brand-accent)" }}>.</span> product
            </a>
          </div>
          <Button size="sm" variant="secondary" arrow={false} href="/">
            Back to site
          </Button>
        </div>
      </div>

      <section
        style={{
          flex: 1,
          maxWidth: "var(--measure-page)",
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto",
          padding: "clamp(56px,9vw,130px) var(--gutter)",
        }}
      >
        <div
          style={{
            ...micro,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "clamp(28px,4vw,48px)",
            color: "var(--ink-2)",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--tt)" }} />
          <span>Demo request</span>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span style={{ color: "var(--tt)" }}>Received ✓</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))",
            gap: "clamp(40px,6vw,96px)",
            alignItems: "end",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "var(--size-display)",
                lineHeight: "var(--lh-display)",
                letterSpacing: "var(--ls-display)",
                fontWeight: 600,
                margin: "0 0 28px",
                maxWidth: "12ch",
                textWrap: "balance",
              }}
            >
              Thanks, {first ?? "we have it"}
              <Stop />
            </h1>
            <p style={{ fontSize: "var(--size-lead)", lineHeight: 1.5, color: "var(--ink-2)", margin: "0 0 36px", maxWidth: "42ch" }}>
              {req
                ? `Your request for ${req.business} is in. Someone from Stash Labs will contact you at ${req.email} to book a time.`
                : "Your request is in. Someone from Stash Labs will contact you to book a time."}{" "}
              You will be speaking with the people who built TimeTally.
            </p>
            <div data-r="ctas" style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Button href="/#demo">Try the demo again</Button>
              <Button variant="secondary" arrow={false} href="https://stashlabs.com.au">
                Meet Stash Labs ↗
              </Button>
            </div>
          </div>
          <div>
            <div style={{ ...label, marginBottom: 4 }}>What happens next</div>
            <SpecList rows={NEXT_STEPS} />
            <div style={{ ...label, margin: "36px 0 4px" }}>What you sent</div>
            <SpecList
              open={false}
              rows={
                req
                  ? [
                      { label: "Business", value: req.business },
                      { label: "Staff", value: req.staff },
                      { label: "Timesheets today", value: req.method },
                      { label: "Phone", value: req.phone || "—" },
                    ]
                  : [{ label: "Details", value: "Not available" }]
              }
            />
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "var(--border-panel)", background: "var(--surface)" }}>
        <div
          style={{
            maxWidth: "var(--measure-page)",
            margin: "0 auto",
            padding: "clamp(28px,4vw,44px) var(--gutter)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "16px",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--size-micro)",
            color: "var(--ink-3)",
          }}
        >
          <span>
            TimeTally<span style={{ color: "var(--tt)" }}>.</span> © 2026 — built and supported by{" "}
            <a href="https://stashlabs.com.au" style={{ color: "var(--ink-2)" }}>
              Stash Labs<span style={{ color: "var(--brand-accent)" }}>.</span>
            </a>{" "}
            Sydney, AU
          </span>
          <Link href="/" style={{ color: "var(--ink-2)" }}>
            Back to TimeTally →
          </Link>
        </div>
      </footer>
    </div>
  );
}
