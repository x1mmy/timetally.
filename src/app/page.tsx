/**
 * TimeTally landing page — Stash Labs design system (v2, ledger hero).
 */
"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  InlineLink,
  LabelledSection,
  NEXT_STEPS,
  PullQuote,
  SpecList,
  Stat,
  Stop,
  Ticker,
  label,
  micro,
} from "~/app/_components/landing/ds";
import { landingFonts } from "~/app/_components/landing/fonts";
import "~/styles/landing.css";

// ---------- sample data ----------

const STAFF = [
  { name: "Sam Reid", rate: 32, h: [7.5, 8, 0, 7.5, 8, 6, 0] },
  { name: "Priya Nair", rate: 34, h: [0, 7.5, 7.5, 8, 7.5, 0, 5.5] },
  { name: "Tom Chen", rate: 30, h: [6, 6, 6, 0, 6.5, 7, 6] },
  { name: "Mia Russo", rate: 31, h: [8, 0, 8, 8, 0, 7.5, 0] },
  { name: "Jack Hall", rate: 29, h: [0, 5, 5, 5, 5, 0, 0] },
];
const MULT = [1, 1, 1, 1, 1, 1.25, 1.5];
const DAYC = ["var(--wk)", "var(--wk)", "var(--wk)", "var(--wk)", "var(--wk)", "var(--sat)", "var(--sun)"];
const DAY_HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const fmtH = (h: number): string => {
  if (!h) return "—";
  const m = Math.round((h % 1) * 60);
  return Math.floor(h) + "h" + (m ? " " + String(m).padStart(2, "0") + "m" : "");
};
const money = (n: number): string =>
  "$" + n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rowPay = (s: (typeof STAFF)[number], shown: number): number =>
  s.h.reduce((a, h, d) => a + (d < shown ? h * s.rate * MULT[d]! : 0), 0);
const hoursFor = (days: number[]): number => STAFF.reduce((a, s) => a + days.reduce((b, d) => b + s.h[d]!, 0), 0);

const FULL_WEEK = STAFF.reduce((a, s) => a + rowPay(s, 7), 0);
const TILES = {
  weekday: fmtH(hoursFor([0, 1, 2, 3, 4])),
  sat: fmtH(hoursFor([5])),
  sun: fmtH(hoursFor([6])),
  total: money(FULL_WEEK),
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Del"];

const TICKER = [
  "4-digit PIN clock-in",
  "Automatic break deductions",
  "Weekday, Saturday and Sunday rates",
  "CSV export for MYOB, Xero and QuickBooks",
  "Set up on site by Stash Labs",
];

const PROBLEMS = [
  {
    problem: "Hours are written on paper or typed into a spreadsheet, then added up by hand.",
    fix: "Staff clock in and out with a PIN. Hours are totalled as they happen.",
  },
  {
    problem: "Breaks are forgotten or guessed, and pay comes out wrong.",
    fix: "Breaks are deducted automatically, and every deduction is visible.",
  },
  {
    problem: "Saturday and Sunday rates are worked out shift by shift.",
    fix: "Each employee has three rates. Pay is split by day type for you.",
  },
  {
    problem: "Getting the numbers into Xero or MYOB means typing them in again.",
    fix: "One CSV export. We help you import it the first time.",
  },
];

const STEPS = [
  { n: "01.", title: "Add your employees", body: "Enter names and pay rates. TimeTally generates a PIN for each person." },
  {
    n: "02.",
    title: "Your team clocks in",
    body: "Staff enter their PIN at the start and end of each shift. Breaks come off automatically.",
  },
  {
    n: "03.",
    title: "Review and export",
    body: "Check the week’s hours and pay on one dashboard, then export a CSV for payroll.",
  },
];

const FEATURES = [
  {
    tag: "Employee portal",
    title: "PIN clock-in",
    body: "Four digits, on any device. No passwords, no app to install, no training session.",
  },
  {
    tag: "Compliance",
    title: "Automatic break deductions",
    body: "Unpaid breaks come off each shift according to Modern Award requirements.",
  },
  { tag: "Pay", title: "Day-specific rates", body: "Separate weekday, Saturday and Sunday rates for every employee." },
  {
    tag: "Manager portal",
    title: "Weekly payroll dashboard",
    body: "Hours and pay for everyone on one screen, split by day type, before anything is final.",
  },
  {
    tag: "Export",
    title: "Payroll-ready CSV",
    body: "Works with MYOB, Xero and QuickBooks, or send it straight to your accountant.",
  },
  {
    tag: "Admin portal",
    title: "Your own address",
    body: "Each business gets its own TimeTally subdomain, with its data kept separate.",
  },
];

const SUPPORT = [
  {
    n: "01",
    title: "Setup visit to your location",
    body: "We come to you, add your team and pay rates with you, and check the first clock-ins.",
  },
  {
    n: "02",
    title: "Team training and PINs",
    body: "Your staff get shown how to clock in and receive their PINs in person.",
  },
  { n: "03", title: "Payroll system integration", body: "We get your first export into MYOB, Xero or to your accountant." },
  {
    n: "04",
    title: "Ongoing support",
    body: "Direct access to the people who built TimeTally. Email or call, no chatbot.",
  },
];

const STASH_SPECS = [
  { label: "Studio", value: "Stash Labs" },
  { label: "Based in", value: "Sydney, AU" },
  { label: "Team", value: "3 people" },
  { label: "TimeTally status", value: "Live", tone: "accent" as const },
  { label: "Support", value: "Direct, no chatbot" },
];

const FAQS = [
  {
    q: "What do my staff need to clock in?",
    a: "A four-digit PIN. They open your business’s TimeTally address on a phone, tablet or the computer at the counter and enter it. There are no passwords to reset.",
  },
  {
    q: "How are breaks handled?",
    a: "Unpaid breaks are deducted automatically based on shift length, following Modern Award requirements. You can see every deduction on the dashboard before you export.",
  },
  {
    q: "Can I pay different rates on weekends?",
    a: "Yes. Each employee has a weekday, Saturday and Sunday rate, and the dashboard splits hours and pay by day type.",
  },
  {
    q: "Does it work with Xero, MYOB or QuickBooks?",
    a: "TimeTally exports a payroll-ready CSV. We help you import it into Xero, MYOB or QuickBooks, or set it up to go straight to your accountant.",
  },
  {
    q: "How long does setup take?",
    a: "Adding employees and pay rates takes minutes. We then visit your location, train the team and hand out PINs so the first week runs cleanly.",
  },
  {
    q: "What does it cost?",
    a: "Pricing depends on the size of your team. We quote after the demo call, once we know how many staff and locations you have.",
  },
];

const STAFF_OPTS = ["1–5", "6–15", "16–40", "40+"];
const METHOD_OPTS = ["Paper", "Spreadsheet", "Other software"];

// ---------- shared styles ----------

const container: CSSProperties = { maxWidth: "var(--measure-page)", margin: "0 auto" };
const panel: CSSProperties = { border: "var(--border-panel)", borderRadius: "var(--radius-panel)", overflow: "hidden" };
const panelHead: CSSProperties = {
  ...label,
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "12px 16px",
  borderBottom: "var(--border-panel)",
};
const h2: CSSProperties = {
  fontSize: "var(--size-section)",
  lineHeight: "var(--lh-section)",
  letterSpacing: "var(--ls-section)",
  fontWeight: 600,
  margin: "0 0 clamp(28px,4vw,48px)",
  maxWidth: "var(--measure-section-heading)",
  textWrap: "balance",
};
const display: CSSProperties = {
  fontSize: "var(--size-display)",
  lineHeight: "var(--lh-display)",
  letterSpacing: "var(--ls-display)",
  fontWeight: 600,
  textWrap: "balance",
};
const bodyFixed: CSSProperties = { fontSize: "var(--size-body-fixed)", lineHeight: "var(--lh-body-tight)" };
const caption: CSSProperties = {
  margin: "12px 2px 0",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--size-micro)",
  color: "var(--ink-3)",
};
const bigNumber: CSSProperties = {
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-.02em",
  color: "var(--tt)",
  fontVariantNumeric: "tabular-nums",
};
const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px",
  borderRadius: "4px",
  border: "1px solid var(--line-strong)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontFamily: "var(--font-sans)",
  fontSize: "16px",
  outline: "none",
  transition: "border-color .2s var(--ease-out-expo)",
};
const errorText: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  color: "var(--sun)",
  minHeight: "14px",
};
const fade = (on: boolean | number): CSSProperties => ({
  opacity: on ? 1 : 0,
  transition: "opacity .6s var(--ease-out-expo)",
});
const LEDGER_COLS = "minmax(150px,1.6fr) repeat(7,minmax(0,1fr)) minmax(90px,1fr)";

// ---------- page ----------

type Theme = "paper" | "ink";
type FormField = "name" | "business" | "email" | "phone" | "notes";

interface DemoForm {
  name: string;
  business: string;
  email: string;
  phone: string;
  notes: string;
  staff: string;
  method: string;
  website: string; // honeypot
}

export default function Home(): React.JSX.Element {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("paper");
  const [tick, setTick] = useState(7);
  const [shownTotal, setShownTotal] = useState(FULL_WEEK);
  const shownRef = useRef(FULL_WEEK);
  const progressRef = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState("Enter your PIN");
  const [onShift, setOnShift] = useState<{ name: string; time: string }[]>([]);
  const [exported, setExported] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState<DemoForm>({
    name: "",
    business: "",
    email: "",
    phone: "",
    notes: "",
    staff: "6–15",
    method: "Spreadsheet",
    website: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Ledger: reveal one day every 700ms, hold, then loop.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => (n >= 14 ? -1 : n + 1)), 700);
    return () => clearInterval(t);
  }, []);

  // Scroll progress bar, written straight to the DOM so scrolling doesn't re-render the page.
  useEffect(() => {
    const onScroll = (): void => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      if (progressRef.current) progressRef.current.style.width = (max > 0 ? (el.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shown = Math.max(0, Math.min(tick, 7));
  const total = STAFF.reduce((a, s) => a + rowPay(s, shown), 0);
  const ledgerHours = fmtH(hoursFor([0, 1, 2, 3, 4, 5, 6].slice(0, shown))).replace(/ .*/, "");

  // Ease the displayed total toward the real one.
  useEffect(() => {
    let raf = 0;
    const step = (): void => {
      const cur = shownRef.current;
      const next = Math.abs(total - cur) < 0.5 ? total : cur + (total - cur) * 0.1;
      shownRef.current = next;
      setShownTotal(next);
      if (next !== total) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const press = (k: string): void => {
    if (pin.length >= 4) return;
    if (k === "Clear") {
      setPin("");
      setPinMsg("Enter your PIN");
      return;
    }
    if (k === "Del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const nextPin = pin + k;
    setPin(nextPin);
    setPinMsg(nextPin.length < 4 ? "Enter your PIN" : "Checking…");
    if (nextPin.length < 4) return;
    // The pad is locked until this fires, so onShift can't change in between.
    setTimeout(() => {
      setPin("");
      const next = STAFF.find((s) => !onShift.some((c) => c.name === s.name));
      if (!next) {
        setPinMsg("Everyone is on shift");
        setOnShift([]);
        return;
      }
      const time = new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).toLowerCase();
      setPinMsg(next.name + " clocked in");
      setOnShift([...onShift, { name: next.name, time }]);
    }, 450);
  };

  const setField = (k: FormField, v: string): void => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = async (): Promise<void> => {
    const e: Partial<Record<FormField, string>> = {};
    if (!form.name.trim()) e.name = "Add your name";
    if (!form.business.trim()) e.business = "Add your business name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Check this email address";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(String(res.status));
      try {
        sessionStorage.setItem("tt-demo-request", JSON.stringify(form));
      } catch {}
      router.push("/thanks");
    } catch {
      setSending(false);
      setSubmitError("That didn’t send. Try again, or email hello@stashlabs.com.au.");
    }
  };

  const chips = (key: "staff" | "method", opts: string[]): React.JSX.Element => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {opts.map((o) => {
        const on = form[key] === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => setForm((f) => ({ ...f, [key]: o }))}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: `1px solid ${on ? "var(--tt)" : "var(--line-strong)"}`,
              background: on ? "var(--tt)" : "transparent",
              color: on ? "var(--accent-ink)" : "var(--ink-2)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );

  const textField = (k: FormField, text: string, type: string, placeholder: string): React.JSX.Element => (
    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={label}>{text}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={form[k]}
        onChange={(ev) => setField(k, ev.target.value)}
        data-focus-tt=""
        style={input}
      />
      <span style={errorText}>{errors[k]}</span>
    </label>
  );

  return (
    <div data-tt-root="" data-theme={theme} className={landingFonts}>
      {/* ---------- nav ---------- */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg)", borderBottom: "var(--border-panel)" }}>
        <div
          ref={progressRef}
          style={{ position: "absolute", left: 0, top: 0, height: "2px", width: 0, background: "var(--tt)" }}
        />
        <div
          style={{
            ...container,
            padding: "18px var(--gutter)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div data-r="brand" style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            <a
              href="#"
              aria-label="TimeTally home"
              style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)" }}
            >
              <span style={{ display: "grid", gridTemplateColumns: "8px 8px", gap: "4px", flexShrink: 0 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: 999, background: "var(--ink)" }} />
                ))}
                <span
                  data-pin-dot=""
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--tt)",
                    animation: "tt-pin 5.4s cubic-bezier(.16,1,.3,1) infinite",
                  }}
                />
              </span>
              <span style={{ fontSize: "19px", fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1 }}>
                TimeTally
                <Stop />
              </span>
            </a>
            <span data-hide-md="" style={{ width: 1, height: 16, background: "var(--line-strong)" }} />
            <a
              data-hide-md=""
              href="https://stashlabs.com.au"
              style={{ ...micro, color: "var(--ink-2)", whiteSpace: "nowrap" }}
            >
              A Stash Labs<span style={{ color: "var(--brand-accent)" }}>.</span> product
            </a>
          </div>
          <nav style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "22px", minWidth: 0 }}>
            <a data-hide-sm="" href="#how" style={{ ...micro, color: "var(--ink-2)" }}>
              How it works
            </a>
            <a data-hide-sm="" href="#demo" style={{ ...micro, color: "var(--ink-2)" }}>
              Try it
            </a>
            <a data-hide-sm="" data-hide-md="" href="#support" style={{ ...micro, color: "var(--ink-2)" }}>
              Support
            </a>
            <a data-hide-sm="" data-hide-md="" href="#faq" style={{ ...micro, color: "var(--ink-2)" }}>
              FAQ
            </a>
            <Button size="sm" arrow={false} href="#book">
              Request a demo
            </Button>
          </nav>
        </div>
      </div>

      {/* ---------- hero ---------- */}
      <section style={{ ...container, padding: "clamp(48px,7vw,96px) var(--gutter) clamp(48px,6vw,88px)" }}>
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
          <span
            data-blink=""
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: "var(--tt)",
              animation: "sl-blink 2.4s linear infinite",
            }}
          />
          <span data-hide-sm="">Timesheets and payroll</span>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span style={{ color: "var(--tt)" }}>Live — taking new businesses</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
            gap: "clamp(28px,5vw,72px)",
            alignItems: "start",
            marginBottom: "clamp(40px,5vw,64px)",
          }}
        >
          <h1 style={{ ...display, margin: 0, maxWidth: "14ch" }}>
            The week’s hours, already added up
            <Stop />
          </h1>
          <div>
            <p
              style={{
                fontSize: "var(--size-lead)",
                lineHeight: 1.5,
                color: "var(--ink-2)",
                margin: "0 0 28px",
                maxWidth: "46ch",
                textWrap: "pretty",
              }}
            >
              Staff clock in with a four-digit PIN. TimeTally deducts breaks, applies weekday, Saturday and Sunday
              rates, and hands you a payroll file. Managers get back more than 20 hours a month of admin.
            </p>
            <div data-r="ctas" style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Button href="#book">Request a demo</Button>
              <Button variant="secondary" arrow={false} href="#how">
                See how it works
              </Button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "20px",
                marginTop: "32px",
                paddingTop: "22px",
                borderTop: "var(--border-panel)",
              }}
            >
              <Stat value="20+" label="Hours back every month" tone="tt" />
              <p style={{ ...bodyFixed, margin: "0 0 2px", maxWidth: "28ch", color: "var(--ink-3)" }}>
                The admin and payroll time a manager stops spending on timesheets.
              </p>
            </div>
          </div>
        </div>

        <div style={{ ...panel, background: "var(--surface)" }}>
          <div style={panelHead}>
            <span>Payroll dashboard — week of 21 Sep 2026</span>
            <span style={{ color: "var(--tt)" }}>{shown < 7 ? "Tallying…" : "Ready to export ✓"}</span>
          </div>

          {/* mobile: day chips */}
          <div data-show-sm="">
            {STAFF.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: "10px 12px",
                  alignItems: "baseline",
                  padding: "14px 16px",
                  borderBottom: "var(--border-panel)",
                }}
              >
                <span style={{ fontSize: "15px", fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{money(rowPay(s, shown))}</span>
                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "grid",
                    gridTemplateColumns: "repeat(7,minmax(0,1fr))",
                    gap: "4px",
                  }}
                >
                  {s.h.map((h, d) => {
                    const on = d < shown && h > 0;
                    return (
                      <div
                        key={d}
                        style={{
                          height: 24,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          background: on ? DAYC[d] : "var(--surface-2)",
                          color: on ? "var(--on-tt)" : "var(--ink-3)",
                          transition: "background .4s var(--ease-out-expo)",
                        }}
                      >
                        {"MTWTFSS"[d]}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", padding: "16px" }}
            >
              <span style={label}>Total payroll · {ledgerHours}</span>
              <span style={bigNumber}>{money(shownTotal)}</span>
            </div>
          </div>

          {/* desktop: table */}
          <div data-hide-sm="" style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 760 }}>
              <div
                style={{
                  ...label,
                  display: "grid",
                  gridTemplateColumns: LEDGER_COLS,
                  gap: "12px",
                  padding: "12px 16px",
                  borderBottom: "var(--border-panel)",
                }}
              >
                <span>Employee</span>
                {DAY_HEAD.map((d, i) => (
                  <span key={d} style={i > 4 ? { color: DAYC[i] } : undefined}>
                    {d}
                  </span>
                ))}
                <span style={{ textAlign: "right" }}>Pay</span>
              </div>
              {STAFF.map((s) => (
                <div
                  key={s.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: LEDGER_COLS,
                    gap: "12px",
                    alignItems: "center",
                    padding: "13px 16px",
                    borderBottom: "var(--border-panel)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "var(--ink-2)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>
                    {s.name}
                  </span>
                  {s.h.map((h, d) => (
                    <span key={d} style={{ color: d > 4 ? DAYC[d] : undefined, ...fade(d < shown) }}>
                      {fmtH(h)}
                    </span>
                  ))}
                  <span style={{ textAlign: "right", color: "var(--ink)", ...fade(shown) }}>{money(rowPay(s, shown))}</span>
                </div>
              ))}
              <div
                style={{
                  ...label,
                  display: "grid",
                  gridTemplateColumns: LEDGER_COLS,
                  gap: "12px",
                  alignItems: "baseline",
                  padding: "16px",
                }}
              >
                <span>Total payroll</span>
                <span style={{ gridColumn: "2 / 9" }}>{ledgerHours} logged, breaks deducted</span>
                <span
                  style={{
                    ...bigNumber,
                    textAlign: "right",
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "-.02em",
                    textTransform: "none",
                  }}
                >
                  {money(shownTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p style={caption}>
          <span style={{ color: "var(--tt)" }}>fig. 01</span>  A week of timesheets tallying itself. Sample data.
        </p>
      </section>

      <Ticker items={TICKER} separator="/" />

      {/* ---------- 01 problem ---------- */}
      <LabelledSection
        number="01."
        label="The problem"
        note="What goes wrong when hours live on paper and in spreadsheets."
        surface
      >
        <h2 style={h2}>
          Spreadsheet payroll costs a manager about five hours a week
          <Stop />
        </h2>
        <div
          data-hide-sm=""
          style={{
            ...label,
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: "0 28px",
            borderTop: "var(--border-open)",
          }}
        >
          <span style={{ padding: "12px 0" }}>Today</span>
          <span style={{ padding: "12px 0", color: "var(--tt)" }}>With TimeTally</span>
        </div>
        {PROBLEMS.map((p) => (
          <div
            key={p.problem}
            data-r="two"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
              gap: "28px",
              padding: "18px 0",
              borderTop: "var(--border-panel)",
            }}
          >
            <span style={{ ...bodyFixed, color: "var(--ink-3)" }}>
              <span data-show-sm="" style={{ ...label, marginBottom: 4 }}>
                Today
              </span>
              {p.problem}
            </span>
            <span style={{ ...bodyFixed, color: "var(--ink)" }}>
              <span data-show-sm="" style={{ ...label, color: "var(--tt)", margin: "6px 0 4px" }}>
                With TimeTally
              </span>
              {p.fix}
            </span>
          </div>
        ))}
      </LabelledSection>

      {/* ---------- 02 how ---------- */}
      <LabelledSection id="how" number="02." label="How it works" note="Most businesses are running inside a week.">
        <h2 style={h2}>
          Three steps, then it runs itself
          <Stop />
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "28px" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ borderTop: "var(--border-open)", paddingTop: "18px" }}>
              <div style={{ ...micro, color: "var(--tt)", marginBottom: "28px" }}>{s.n}</div>
              <h3
                style={{
                  fontSize: "var(--size-card-heading)",
                  lineHeight: "var(--lh-card-heading)",
                  letterSpacing: "var(--ls-card-heading)",
                  fontWeight: 600,
                  margin: "0 0 10px",
                }}
              >
                {s.title}
              </h3>
              <p style={{ ...bodyFixed, margin: 0, color: "var(--ink-2)", textWrap: "pretty" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </LabelledSection>

      {/* ---------- 03 try it ---------- */}
      <LabelledSection
        id="demo"
        number="03."
        label="Try it"
        note="Enter any four digits on the pad. The manager view updates as each person clocks in."
        surface
      >
        <h2 style={h2}>
          Clock in as one of the team
          <Stop />
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div style={{ ...panel, background: "var(--bg)" }}>
            <div style={panelHead}>
              <span>Employee portal</span>
              <span style={{ color: "var(--tt)" }}>PIN</span>
            </div>
            <div style={{ padding: "28px 24px 24px" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "14px" }}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      boxSizing: "border-box",
                      ...(i < pin.length ? { background: "var(--tt)" } : { border: "1px solid var(--line-strong)" }),
                    }}
                  />
                ))}
              </div>
              <p
                aria-live="polite"
                style={{ ...micro, margin: "0 0 22px", textAlign: "center", color: "var(--ink-3)", minHeight: 18 }}
              >
                {pinMsg}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
                {KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => press(k)}
                    data-hover-tt=""
                    style={{
                      height: 56,
                      borderRadius: 4,
                      border: "var(--border-panel)",
                      background: "var(--surface)",
                      color: "var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontSize: k.length > 1 ? "11px" : "18px",
                      letterSpacing: "var(--ls-label)",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...panel, background: "var(--bg)" }}>
            <div style={panelHead}>
              <span>Manager portal — this week</span>
              <span style={{ color: "var(--tt)" }}>{onShift.length} of 5 on shift</span>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", borderBottom: "var(--border-panel)" }}
            >
              {(
                [
                  ["Weekday", "var(--wk)", TILES.weekday],
                  ["Saturday", "var(--sat)", TILES.sat],
                  ["Sunday", "var(--sun)", TILES.sun],
                ] as const
              ).map(([name, color, value], i) => (
                <div
                  key={name}
                  data-r="tilebox"
                  style={{ padding: "16px", borderRight: i < 2 ? "var(--border-panel)" : undefined }}
                >
                  <div style={{ ...label, color }}>{name}</div>
                  <div data-r="tile" style={{ fontSize: "24px", fontWeight: 600, letterSpacing: "-.02em", marginTop: "6px" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...label, padding: "12px 16px 4px" }}>On shift now</div>
            {onShift.length === 0 && (
              <p style={{ ...bodyFixed, margin: 0, padding: "14px 16px 18px", color: "var(--ink-3)" }}>
                Nobody yet. Enter a PIN on the left.
              </p>
            )}
            {onShift.map((c) => (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "12px 16px",
                  borderTop: "var(--border-panel)",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "15px" }}>{c.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--tt)" }}>In {c.time} ✓</span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "12px",
                padding: "16px",
                borderTop: "var(--border-panel)",
              }}
            >
              <span style={label}>Total payroll</span>
              <span style={bigNumber}>{TILES.total}</span>
            </div>
            <button
              type="button"
              onClick={() => setExported((x) => !x)}
              data-hover-text-tt=""
              style={{
                ...micro,
                fontSize: "11px",
                width: "100%",
                padding: "14px 16px",
                border: "none",
                borderTop: "var(--border-panel)",
                background: "var(--surface)",
                color: "var(--ink)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {exported ? "payroll-2026-09-21.csv exported ✓" : "Export to CSV →"}
            </button>
          </div>
        </div>
        <p style={caption}>
          <span style={{ color: "var(--tt)" }}>fig. 02</span>  Employee and manager portals, side by side. Sample data.
        </p>
      </LabelledSection>

      {/* ---------- 04 features ---------- */}
      <LabelledSection
        number="04."
        label="What you get"
        note="Everything a small business needs between the roster and the pay run."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))",
            borderTop: "var(--border-open)",
            borderLeft: "var(--border-panel)",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{ padding: "24px 22px 28px", borderRight: "var(--border-panel)", borderBottom: "var(--border-panel)" }}
            >
              <div style={{ ...micro, color: "var(--ink-3)", marginBottom: "22px" }}>{f.tag}</div>
              <h3
                style={{
                  fontSize: "20px",
                  lineHeight: "var(--lh-card-heading)",
                  letterSpacing: "var(--ls-card-heading)",
                  fontWeight: 600,
                  margin: "0 0 10px",
                }}
              >
                {f.title}
              </h3>
              <p style={{ ...bodyFixed, margin: 0, color: "var(--ink-2)", textWrap: "pretty" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </LabelledSection>

      {/* ---------- 05 support ---------- */}
      <LabelledSection
        id="support"
        number="05."
        label="Setup and support"
        note="Included with every business. Nobody is left with a login and a help article."
        surface
      >
        <h2 style={h2}>
          We set it up with you, on site
          <Stop />
        </h2>
        {SUPPORT.map((s) => (
          <div
            key={s.n}
            data-r="support"
            style={{
              display: "grid",
              gridTemplateColumns: "40px minmax(0,1fr) minmax(0,1.4fr)",
              gap: "20px",
              padding: "18px 0",
              borderTop: "var(--border-panel)",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-micro)", color: "var(--tt)", paddingTop: 3 }}>
              {s.n}
            </span>
            <span style={{ fontWeight: 600, fontSize: "17px", lineHeight: 1.35 }}>{s.title}</span>
            <span style={{ ...bodyFixed, color: "var(--ink-2)" }}>{s.body}</span>
          </div>
        ))}
      </LabelledSection>

      {/* ---------- 06 stash labs (brand accent) ---------- */}
      <div style={{ "--accent": "var(--brand-accent)", "--accent-hover": "var(--brand-accent-press)" } as CSSProperties}>
        <LabelledSection
          number="06."
          label="Who builds it"
          note="TimeTally is made and supported by Stash Labs, a software studio in Sydney."
        >
          <h2 style={h2}>
            Built by Stash Labs
            <Stop color="var(--brand-accent)" />
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))",
              gap: "clamp(28px,4vw,56px)",
              alignItems: "start",
            }}
          >
            <div>
              <PullQuote attribution="Stash Labs — Sydney, AU">
                We build the tools we wished existed while working these jobs ourselves.
              </PullQuote>
              <p style={{ ...bodyFixed, margin: "28px 0 24px", color: "var(--ink-2)", maxWidth: "44ch" }}>
                We are a three-person studio that builds internal tools for businesses still running on spreadsheets.
                TimeTally is our own product. When you call, you talk to the people who wrote it.
              </p>
              <InlineLink href="https://stashlabs.com.au" external>
                stashlabs.com.au
              </InlineLink>
            </div>
            <SpecList rows={STASH_SPECS} />
          </div>
        </LabelledSection>
      </div>

      {/* ---------- 07 faq ---------- */}
      <LabelledSection id="faq" number="07." label="Questions" note="Anything else, ask us on the demo call." surface>
        <div style={{ borderTop: "var(--border-open)" }}>
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} style={{ borderBottom: "var(--border-panel)" }}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    padding: "20px 0",
                    background: "none",
                    border: "none",
                    color: "var(--ink)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "18px",
                    fontWeight: 600,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span>{f.q}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", color: "var(--tt)" }}>
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open && (
                  <p style={{ ...bodyFixed, margin: 0, padding: "0 0 22px", maxWidth: "60ch", color: "var(--ink-2)" }}>
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </LabelledSection>

      {/* ---------- book a demo ---------- */}
      <section id="book" style={{ borderTop: "var(--border-panel)" }}>
        <div
          style={{
            ...container,
            padding: "var(--section-pad-y) var(--gutter)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))",
            gap: "clamp(40px,6vw,96px)",
            alignItems: "start",
          }}
        >
          <div>
            <h2 style={{ ...display, margin: "0 0 28px", maxWidth: "12ch" }}>
              Get 20 hours a month back
              <Stop />
            </h2>
            <p
              style={{ fontSize: "var(--size-lead)", lineHeight: 1.5, color: "var(--ink-2)", margin: "0 0 40px", maxWidth: "40ch" }}
            >
              Tell us about your business and we will show you TimeTally with your own staff list and pay rates. No
              obligation.
            </p>
            <div style={{ ...label, marginBottom: 4 }}>What happens next</div>
            <SpecList rows={NEXT_STEPS} />
          </div>

          <form
            noValidate
            onSubmit={(ev) => {
              ev.preventDefault();
              void submit();
            }}
            style={{ ...panel, position: "relative", background: "var(--surface)" }}
          >
            <div style={{ ...panelHead, padding: "12px 18px" }}>
              <span>Request a demo</span>
              <span style={{ color: "var(--tt)" }}>Takes a minute</span>
            </div>
            <div
              style={{
                padding: "24px 18px 22px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                gap: "6px 16px",
              }}
            >
              {textField("name", "Your name", "text", "Sam Reid")}
              {textField("business", "Business name", "text", "Harbour Café")}
              {textField("email", "Email", "email", "sam@harbourcafe.com.au")}
              {textField("phone", "Phone (optional)", "tel", "04xx xxx xxx")}
              {/* honeypot: invisible to people, bots fill it in */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={form.website}
                onChange={(ev) => setForm((f) => ({ ...f, website: ev.target.value }))}
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              />
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                <span style={label}>How many staff</span>
                {chips("staff", STAFF_OPTS)}
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                <span style={label}>How you do timesheets today</span>
                {chips("method", METHOD_OPTS)}
              </div>
              <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "22px" }}>
                <span style={label}>Anything we should know (optional)</span>
                <textarea
                  rows={3}
                  placeholder="Two locations, casual staff on weekends…"
                  value={form.notes}
                  onChange={(ev) => setField("notes", ev.target.value)}
                  data-focus-tt=""
                  style={{ ...input, resize: "vertical" }}
                />
              </label>
              <div
                data-r="ctas"
                style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}
              >
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Request a demo"}
                </Button>
                <span
                  role={submitError ? "alert" : undefined}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--size-micro)",
                    color: submitError ? "var(--sun)" : "var(--ink-3)",
                  }}
                >
                  {submitError || "We reply by email or phone. No mailing list."}
                </span>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer style={{ borderTop: "var(--border-panel)", background: "var(--surface)" }}>
        <div
          style={{
            ...container,
            padding: "clamp(40px,5vw,64px) var(--gutter) clamp(24px,3vw,36px)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--size-micro)",
            color: "var(--ink-3)",
          }}
        >
          <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <span style={{ display: "grid", gridTemplateColumns: "5px 5px", gap: "3px", flexShrink: 0 }}>
              {["var(--ink-2)", "var(--ink-2)", "var(--ink-2)", "var(--tt)"].map((c, i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: c }} />
              ))}
            </span>
            <span>
              TimeTally<span style={{ color: "var(--tt)" }}>.</span> © 2026 — built and supported by{" "}
              <a href="https://stashlabs.com.au" style={{ color: "var(--ink-2)" }}>
                Stash Labs<span style={{ color: "var(--brand-accent)" }}>.</span>
              </a>{" "}
              Sydney, AU
            </span>
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "22px" }}>
            <button
              type="button"
              onClick={() => setTheme(theme === "paper" ? "ink" : "paper")}
              aria-label="Switch colour theme"
              data-lift=""
              style={{
                ...micro,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid var(--line-strong)",
                background: "transparent",
                color: "var(--ink-2)",
                cursor: "pointer",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--tt)" }} />
              {theme === "paper" ? "Dark" : "Light"}
            </button>
            <a href="#book" style={{ color: "var(--tt)" }}>
              Request a demo →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
