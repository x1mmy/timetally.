/**
 * TimeTally landing page — Stash Labs design system (v3, Claude Design "TimeTally Landing").
 */
"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  Button,
  ChipGroup,
  DayTile,
  FaqList,
  FigCaption,
  InlineLink,
  LabelledSection,
  Logo,
  NEXT_STEPS,
  Panel,
  PinPad,
  PullQuote,
  type SpecRow,
  SpecList,
  Stop,
  TextField,
  ThemeToggle,
  Ticker,
  label,
  micro,
} from "~/app/_components/landing/ds";
import { landingFonts } from "~/app/_components/landing/fonts";
import "~/styles/landing.css";

// ---------- sample data ----------

const STAFF = [
  { name: "Sam Reid", rate: 32, shift: "9:00 am – 5:00 pm", h: [7.5, 8, 0, 7.5, 8, 6, 0] },
  { name: "Priya Nair", rate: 34, shift: "7:00 am – 3:00 pm", h: [0, 7.5, 7.5, 8, 7.5, 0, 5.5] },
  { name: "Tom Chen", rate: 30, shift: "10:00 am – 4:30 pm", h: [6, 6, 6, 0, 6.5, 7, 6] },
  { name: "Mia Russo", rate: 31, shift: "8:30 am – 5:00 pm", h: [8, 0, 8, 8, 0, 7.5, 0] },
  { name: "Jack Hall", rate: 29, shift: "3:00 pm – 8:00 pm", h: [0, 5, 5, 5, 5, 0, 0] },
];
const MULT = [1, 1, 1, 1, 1, 1.25, 1.5];
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
const rowHours = (s: (typeof STAFF)[number], shown = 7): number => s.h.slice(0, shown).reduce((a, h) => a + h, 0);
const hoursFor = (days: number[]): number => STAFF.reduce((a, s) => a + days.reduce((b, d) => b + s.h[d]!, 0), 0);

const FULL_PAY = money(STAFF.reduce((a, s) => a + rowPay(s, 7), 0));
const TILES = { weekday: fmtH(hoursFor([0, 1, 2, 3, 4])), sat: fmtH(hoursFor([5])), sun: fmtH(hoursFor([6])) };
// 30 min unpaid break on shifts over 5h — exactly 5h gets none, same as the app (cff20eb).
const BREAKS = fmtH(STAFF.reduce((a, s) => a + s.h.filter((h) => h > 5).length * 0.5, 0)) + " this week";

const TICKER = [
  "Clock in with a four-digit code",
  "Breaks taken off for you",
  "Weekend pay worked out for you",
  "Works with MYOB, Xero and QuickBooks",
  "Set up in person by Stash Labs",
];

const PROBLEMS = [
  {
    problem: "Staff write their hours on paper, and someone adds them up by hand at the end of the week.",
    fix: "Staff type a four-digit code when they start and finish. Their hours add up on their own.",
  },
  {
    problem: "Breaks get forgotten or guessed, so people end up paid too much or too little.",
    fix: "Lunch and other unpaid breaks come off each shift for you, and you can see every one.",
  },
  {
    problem: "Saturday and Sunday pay is higher, so you work it out shift by shift.",
    fix: "Set each person’s weekday and weekend pay once. TimeTally uses the right rate every time.",
  },
  {
    problem: "You type the same hours again into Xero, MYOB or an email to your accountant.",
    fix: "Download one file with everyone’s hours and pay. We help you set it up the first time.",
  },
];

const STEPS = [
  {
    n: "01.",
    title: "Add your staff",
    body: "Type in each person’s name and pay. TimeTally gives everyone their own four-digit code.",
  },
  {
    n: "02.",
    title: "Staff start and finish",
    body: "At the start and end of each shift, staff type their code on a phone, tablet or the shop computer. Breaks come off on their own.",
  },
  {
    n: "03.",
    title: "Check and pay",
    body: "At the end of the week, see everyone’s hours and pay on one screen. Download the file and run your pay as usual.",
  },
];

const FEATURES = [
  {
    tag: "Clocking in",
    title: "A four-digit code",
    body: "Staff clock in on any phone, tablet or computer. No passwords and no app to download.",
  },
  { tag: "Breaks", title: "Breaks taken off for you", body: "Unpaid breaks come off each shift, in line with award rules." },
  { tag: "Pay rates", title: "Weekend rates built in", body: "Set a weekday, Saturday and Sunday rate for each person, once." },
  {
    tag: "Manager screen",
    title: "The whole week on one screen",
    body: "See everyone’s hours and pay before anyone gets paid.",
  },
  {
    tag: "Payroll",
    title: "One file for payroll",
    body: "Download it for MYOB, Xero or QuickBooks, or send it to your accountant.",
  },
  {
    tag: "Your account",
    title: "Your own web address",
    body: "Your business gets its own TimeTally link, and your data stays private.",
  },
];

const SUPPORT = [
  {
    n: "01",
    title: "We visit your business",
    body: "We add your staff and pay rates with you, then check the first clock-ins.",
  },
  { n: "02", title: "We show your staff", body: "Everyone learns how to clock in and gets their code in person." },
  {
    n: "03",
    title: "We connect your payroll",
    body: "We help get your first file into MYOB, Xero or to your accountant.",
  },
  {
    n: "04",
    title: "We’re a call away",
    body: "Talk to the people who built TimeTally. Email or phone, no chatbot.",
  },
];

const STASH_SPECS: SpecRow[] = [
  { label: "Studio", value: "Stash Labs" },
  { label: "Based in", value: "Sydney, AU" },
  { label: "Team", value: "3 people" },
  { label: "TimeTally status", value: "Live", tone: "brand" },
  { label: "Support", value: "Direct, no chatbot" },
];

const FAQS = [
  {
    q: "What do my staff need to clock in?",
    a: "Just their four-digit code. They type it on a phone, tablet or the shop computer. No passwords to forget.",
  },
  {
    q: "How are breaks handled?",
    a: "Unpaid breaks come off each shift for you, in line with award rules. You can see every one before you pay.",
  },
  {
    q: "Can I pay different rates on weekends?",
    a: "Yes. Each person has a weekday, Saturday and Sunday rate, and TimeTally uses the right one.",
  },
  {
    q: "Does it work with Xero, MYOB or QuickBooks?",
    a: "Yes. You download one file and bring it into your payroll software. We help you the first time, or set it up to go to your accountant.",
  },
  {
    q: "How long does setup take?",
    a: "Usually less than a week. We visit, add your staff, show the team how to clock in and hand out their codes.",
  },
  {
    q: "What does it cost?",
    a: "It depends on how many staff you have. We give you a price after the demo call.",
  },
];

const MENU_LINKS = [
  { n: "02.", label: "How it works", href: "#how" },
  { n: "03.", label: "Try it", href: "#demo" },
  { n: "04.", label: "What you get", href: "#features" },
  { n: "05.", label: "Setup and support", href: "#support" },
  { n: "06.", label: "Who builds it", href: "#stash" },
  { n: "07.", label: "Questions", href: "#faq" },
];

const STAFF_OPTS = ["1–5", "6–15", "16–40", "40+"];
const METHOD_OPTS = ["Paper", "Spreadsheet", "Other software"];

// ---------- hero intro ----------

const L1 = "THE WEEK’S HOURS,";
const L2 = "ALREADY ADDED UP";
const GLYPHS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789#%";
const T0 = 1150; // scramble starts
const PER = 22; // stagger per character
const SPIN = 300; // how long each character scrambles
const INTRO_END = T0 + SPIN + (L1.length + L2.length) * PER;

interface Intro {
  dots: boolean;
  l1: string;
  l2: string;
  pin: number;
  done: boolean;
  msg: boolean;
}
const INTRO_START: Intro = { dots: false, l1: "", l2: "", pin: 0, done: false, msg: false };
const INTRO_DONE: Intro = { dots: true, l1: L1, l2: L2, pin: 4, done: true, msg: true };

const glyph = (): string => GLYPHS[(Math.random() * GLYPHS.length) | 0]!;
const scramble = (str: string, off: number, t: number): string =>
  t < T0
    ? ""
    : str
        .split("")
        .map((c, i) => {
          const at = T0 + (off + i) * PER;
          if (c === " " || c === "," || c === "’") return t >= at ? c : c === " " ? " " : glyph();
          if (t >= at + SPIN) return c;
          if (t < T0 + (off + i) * PER * 0.35) return " ";
          return glyph();
        })
        .join("");

// ---------- shared styles ----------

const container: CSSProperties = { maxWidth: "var(--measure-page)", margin: "0 auto" };
const h2: CSSProperties = {
  fontSize: "var(--size-section)",
  lineHeight: "var(--lh-section)",
  letterSpacing: "var(--ls-section)",
  fontWeight: 600,
  margin: "0 0 clamp(28px,4vw,48px)",
  maxWidth: "var(--measure-section-heading)",
  textWrap: "balance",
};
const bodyFixed: CSSProperties = {
  fontSize: "var(--size-body-fixed)",
  lineHeight: "var(--lh-body-tight)",
  textWrap: "pretty",
};
const bigNumber: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-.02em",
  textTransform: "none",
  color: "var(--tt)",
  fontVariantNumeric: "tabular-nums",
};
const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: "12px",
  padding: "12px 16px",
  borderTop: "var(--border-panel)",
};
const navLink: CSSProperties = { ...micro, color: "var(--ink-2)" };
const panelFill: CSSProperties = { height: "100%", display: "flex", flexDirection: "column" };
const panelFillBody: CSSProperties = { flex: 1, display: "flex", flexDirection: "column" };
const LEDGER_COLS = "minmax(150px,1.6fr) repeat(7,minmax(0,1fr)) minmax(90px,1fr)";
const LEDGER_COLS_TAB = "minmax(0,1fr) 64px 92px";

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

const reducedMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function Home(): React.JSX.Element {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("paper");
  const [intro, setIntro] = useState<Intro>(INTRO_START);
  const [tick, setTick] = useState(7);
  const progressRef = useRef<HTMLDivElement>(null);
  const [sticky, setSticky] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinMsg, setPinMsg] = useState("Enter your PIN");
  const [onShift, setOnShift] = useState<{ name: string; time: string }[]>([]);
  const [exported, setExported] = useState(false);
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
  const [sendError, setSendError] = useState(false);

  // Hero intro: dots pop in, headline scrambles into place, then the PIN fills.
  useEffect(() => {
    if (reducedMotion()) return setIntro(INTRO_DONE);
    const start = performance.now();
    let timer = 0;
    const step = (): void => {
      const t = performance.now() - start;
      setIntro({
        dots: t > 60,
        l1: scramble(L1, 0, t),
        l2: scramble(L2, L1.length, t),
        pin: t < INTRO_END + 250 ? 0 : Math.min(4, Math.floor((t - INTRO_END - 250) / 140) + 1),
        done: t >= INTRO_END,
        msg: t >= INTRO_END + 250 + 4 * 140,
      });
      if (t < INTRO_END + 250 + 5 * 140) timer = window.setTimeout(step, 40);
      else setIntro(INTRO_DONE);
    };
    step();
    return () => clearTimeout(timer);
  }, []);

  // Ledger: reveal one day every 700ms, hold, then loop.
  useEffect(() => {
    if (reducedMotion()) return;
    const t = setInterval(() => setTick((n) => (n >= 14 ? -1 : n + 1)), 700);
    return () => clearInterval(t);
  }, []);

  // Scroll progress bar is written straight to the DOM; the sticky CTA only re-renders when it flips.
  useEffect(() => {
    const onScroll = (): void => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? el.scrollTop / max : 0;
      if (progressRef.current) progressRef.current.style.width = p * 100 + "%";
      setSticky(p > 0.06 && p < 0.8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: lock page scroll, close on Escape or when the window grows past mobile width.
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const onResize = (): void => {
      if (window.innerWidth > 680) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);
  const closeMenu = (): void => setMenuOpen(false);

  const shown = Math.max(0, Math.min(tick, 7));
  const total = STAFF.reduce((a, s) => a + rowPay(s, shown), 0);
  const ledgerHours = Math.round(STAFF.reduce((a, s) => a + rowHours(s, shown), 0)) + "h";
  const ledgerTotal = money(total);

  // PinPad locks itself until this fires, so onShift can't change in between.
  const clockIn = (): void => {
    const next = STAFF.find((s) => !onShift.some((c) => c.name === s.name));
    if (!next) {
      setOnShift([]);
      setPinMsg("Everyone is on shift");
      return;
    }
    const time = new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).toLowerCase();
    setOnShift([...onShift, { name: next.name, time }]);
    setPinMsg(next.name + " clocked in");
  };

  const last = onShift[onShift.length - 1];
  const lastStaff = last && STAFF.find((s) => s.name === last.name);
  const emp = lastStaff
    ? {
        meta: "Signed in ✓",
        heading: "Your shift: " + lastStaff.name,
        rows: [
          { label: "Clocked in", value: last.time + " ✓", color: "var(--tt)" },
          { label: "Hours this week", value: fmtH(rowHours(lastStaff)), color: "var(--ink-2)" },
          { label: "Unpaid break", value: "30m, taken off when you finish", color: "var(--ink-3)" },
        ],
      }
    : {
        meta: "PIN",
        heading: "Next on the roster",
        rows: [
          { label: STAFF[0]!.name, value: "Rostered 9:00 am", color: "var(--ink-2)" },
          { label: "Rostered this week", value: fmtH(rowHours(STAFF[0]!)), color: "var(--ink-2)" },
          { label: "Unpaid break", value: "Taken off for you", color: "var(--ink-3)" },
        ],
      };

  const setField = (k: keyof DemoForm) => (v: string) => {
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
    setSendError(false);
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
      setSendError(true);
    }
  };

  const toggleTheme = (): void => setTheme(theme === "paper" ? "ink" : "paper");
  const microLabel: CSSProperties = { ...label, display: "block" };

  return (
    <div data-tt-root="" data-theme={theme} className={landingFonts}>
      {/* ---------- nav ---------- */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg)", borderBottom: "var(--border-panel)" }}>
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
          <a href="#top" aria-label="TimeTally home" style={{ color: "var(--ink)", minWidth: 0 }}>
            <span data-hide-sm="" style={{ display: "block" }}>
              <Logo size={19} animated byline />
            </span>
            <span data-show-sm="" style={{ display: "block" }}>
              <Logo size={18} animated />
            </span>
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            <a data-hide-sm="" href="#how" style={navLink}>
              How it works
            </a>
            <a data-hide-sm="" href="#demo" style={navLink}>
              Try it
            </a>
            <a data-hide-md="" href="#support" style={navLink}>
              Support
            </a>
            <a data-hide-md="" href="#faq" style={navLink}>
              FAQ
            </a>
            <span data-hide-sm="" style={{ display: "flex" }}>
              <Button size="sm" arrow={false} href="#book">
                Request a demo
              </Button>
            </span>
            <button
              data-show-sm=""
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              style={{
                width: 44,
                height: 44,
                marginRight: -10,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ display: "block", width: 22, height: 1.5, background: "var(--ink)" }} />
              ))}
            </button>
          </nav>
        </div>
      </header>

      {/* ---------- mobile menu ---------- */}
      {menuOpen && (
        <div
          data-show-sm=""
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "var(--bg)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            padding: "0 var(--gutter) 28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 0" }}>
            <a href="#top" onClick={closeMenu} style={{ color: "var(--ink)" }}>
              <Logo size={18} />
            </a>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              style={{
                position: "relative",
                width: 44,
                height: 44,
                marginRight: -10,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              {[45, -45].map((deg) => (
                <span
                  key={deg}
                  style={{
                    position: "absolute",
                    left: 11,
                    top: 21,
                    width: 22,
                    height: 1.5,
                    background: "var(--ink)",
                    transform: `rotate(${deg}deg)`,
                  }}
                />
              ))}
            </button>
          </div>
          <div style={{ padding: "28px 0 36px" }}>
            <Button href="#book" fullWidth onClick={closeMenu}>
              Request a demo
            </Button>
          </div>
          <nav style={{ display: "flex", flexDirection: "column" }}>
            {MENU_LINKS.map((m) => (
              <a
                key={m.href}
                href={m.href}
                onClick={closeMenu}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  minHeight: 64,
                  borderBottom: "var(--border-panel)",
                  color: "var(--ink)",
                }}
              >
                <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-micro)", color: "var(--tt)" }}>
                    {m.n}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.02em" }}>{m.label}</span>
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--ink-3)" }}>→</span>
              </a>
            ))}
          </nav>
          <div
            style={{
              marginTop: "auto",
              paddingTop: 36,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--size-micro)",
              color: "var(--ink-3)",
            }}
          >
            <span>Sydney, AU</span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      )}

      {/* ---------- hero ---------- */}
      <section id="top" style={{ ...container, padding: "clamp(48px,7vw,96px) var(--gutter) clamp(48px,6vw,88px)" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "clamp(16px,4vw,48px) 0 clamp(48px,6vw,88px)",
          }}
        >
          <div
            aria-hidden
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,clamp(18px,2.1vw,27px))",
              gap: "clamp(8px,1vw,12px)",
              marginBottom: "clamp(36px,5vw,56px)",
              opacity: intro.dots ? 1 : 0,
              transform: intro.dots ? "none" : "translateY(10px) scale(.92)",
              transition: "opacity .8s var(--ease-out-expo), transform .9s var(--ease-out-expo)",
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                {...(i === 3 ? { "data-pin-dot": "" } : {})}
                style={{
                  aspectRatio: 1,
                  borderRadius: 999,
                  background: i === 3 ? "var(--tt)" : "var(--ink)",
                  animation: i === 3 ? "tt-hero-pulse 3.5s cubic-bezier(.16,1,.3,1) .6s 1 both" : undefined,
                }}
              />
            ))}
          </div>
          <h1
            aria-label="The week’s hours, already added up."
            style={{
              fontSize: "clamp(40px,7vw,104px)",
              lineHeight: "var(--lh-hero)",
              letterSpacing: "var(--ls-hero)",
              fontWeight: 600,
              textTransform: "uppercase",
              margin: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span aria-hidden style={{ whiteSpace: "pre" }}>
              {intro.l1 || " "}
            </span>
            <span aria-hidden style={{ whiteSpace: "pre" }}>
              {intro.l2 || " "}
              <span
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  textTransform: "none",
                  color: "var(--tt)",
                  opacity: intro.done ? 1 : 0,
                  transition: "opacity .4s",
                }}
              >
                .
              </span>
            </span>
          </h1>
          <p
            style={{
              margin: "clamp(20px,2.4vw,30px) 0 0",
              fontFamily: "var(--font-mono)",
              fontSize: "clamp(12px,1.15vw,17px)",
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              textWrap: "balance",
              opacity: intro.done ? 1 : 0,
              transition: "opacity .6s var(--ease-out-expo)",
            }}
          >
            Timesheets and payroll for Australian small businesses
          </p>
          <p
            style={{
              margin: "clamp(16px,2vw,22px) 0 0",
              maxWidth: "44ch",
              fontSize: "var(--size-lead)",
              lineHeight: 1.5,
              color: "var(--ink-2)",
              textWrap: "pretty",
              opacity: intro.done ? 1 : 0,
              transition: "opacity .6s var(--ease-out-expo)",
            }}
          >
            Staff clock in with a four-digit code. TimeTally adds up the hours and pay for you.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px",
              marginTop: "clamp(32px,4vw,48px)",
              opacity: intro.done ? 1 : 0,
              transform: intro.done ? "none" : "translateY(12px)",
              transition: "opacity .7s var(--ease-out-expo), transform .7s var(--ease-out-expo)",
            }}
          >
            <Button href="#book">Request a demo</Button>
            <Button variant="secondary" arrow={false} href="#how">
              See how it works
            </Button>
          </div>
          <a
            href="#demo"
            aria-label="Try clocking in"
            data-hover-tt=""
            style={{
              marginTop: "clamp(24px,3vw,32px)",
              width: "min(100%,520px)",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              padding: "14px 18px",
              background: "var(--surface-2)",
              border: "1px solid transparent",
              borderRadius: "4px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              textAlign: "left",
              color: "inherit",
              opacity: intro.done ? 1 : 0,
              transition: "opacity .7s var(--ease-out-expo), border-color .2s",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--ink-2)" }}>
              <span style={{ color: "var(--ink-3)" }}>&gt;</span>
              <span>PIN</span>
              <span style={{ display: "flex", gap: "6px" }}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      boxSizing: "border-box",
                      border: `1px solid ${intro.pin > i ? "var(--tt)" : "var(--line-strong)"}`,
                      background: intro.pin > i ? "var(--tt)" : "transparent",
                      transition: "background .2s, border-color .2s",
                    }}
                  />
                ))}
              </span>
            </span>
            <span
              style={{
                color: "var(--tt)",
                whiteSpace: "nowrap",
                opacity: intro.msg ? 1 : 0,
                transition: "opacity .4s",
              }}
            >
              Sam Reid · in 9:02 am ✓
            </span>
          </a>
          <p
            style={{
              ...micro,
              margin: "18px 0 0",
              color: "var(--ink-3)",
              opacity: intro.done ? 1 : 0,
              transition: "opacity .7s var(--ease-out-expo)",
            }}
          >
            <span style={{ color: "var(--tt)" }}>20+ hours</span> back every month for managers
          </p>
        </div>

        <Panel title="Payroll dashboard: week of 21 Sep 2026" meta={shown < 7 ? "Tallying…" : "Ready to export ✓"}>
          {/* desktop: full week table */}
          <div data-hide-tab="" style={{ overflowX: "auto" }}>
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
                {DAY_HEAD.map((d) => (
                  <span key={d}>{d}</span>
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
                  }}
                >
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>
                    {s.name}
                  </span>
                  {s.h.map((h, d) => (
                    <span
                      key={d}
                      style={{
                        color: "var(--ink-2)",
                        opacity: d < shown ? 1 : 0,
                        transition: "opacity .6s var(--ease-out-expo)",
                      }}
                    >
                      {fmtH(h)}
                    </span>
                  ))}
                  <span style={{ textAlign: "right", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                    {shown ? money(rowPay(s, shown)) : ""}
                  </span>
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
                <span style={{ ...bigNumber, textAlign: "right" }}>{ledgerTotal}</span>
              </div>
            </div>
          </div>

          {/* tablet / mobile: hours and pay only */}
          <div data-show-tab="">
            <div
              style={{
                ...label,
                display: "grid",
                gridTemplateColumns: LEDGER_COLS_TAB,
                gap: "12px",
                padding: "12px 16px",
                borderBottom: "var(--border-panel)",
              }}
            >
              <span>Employee</span>
              <span>Hours</span>
              <span style={{ textAlign: "right" }}>Pay</span>
            </div>
            {STAFF.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: LEDGER_COLS_TAB,
                  gap: "12px",
                  alignItems: "center",
                  padding: "13px 16px",
                  borderBottom: "var(--border-panel)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              >
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>
                  {s.name}
                </span>
                <span style={{ color: "var(--ink-2)" }}>{shown ? fmtH(rowHours(s, shown)) : ""}</span>
                <span style={{ textAlign: "right", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                  {shown ? money(rowPay(s, shown)) : ""}
                </span>
              </div>
            ))}
            <div
              style={{
                ...label,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "12px",
                padding: "16px",
              }}
            >
              <span>
                Total: {ledgerHours}, {shown ? "Mon to " + DAY_HEAD[shown - 1] : "Tallying"}
              </span>
              <span style={bigNumber}>{ledgerTotal}</span>
            </div>
          </div>
        </Panel>
        <FigCaption number="fig. 01">A week of hours adding up on their own. Sample data.</FigCaption>
      </section>

      <Ticker items={TICKER} separator="/" />

      {/* ---------- customers ---------- */}
      <section style={{ borderTop: "var(--border-panel)", background: "var(--bg)" }}>
        <div
          style={{
            ...container,
            padding: "clamp(28px,4vw,44px) var(--gutter)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "18px 28px",
          }}
        >
          <span style={label}>In use at</span>
          <span style={{ flex: "1 1 40px", minWidth: 40, height: 1, background: "var(--line)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <Image
              src="/trims-fresh-logo-144.png"
              alt="Trim’s Fresh & Co."
              width={72}
              height={72}
              style={{ borderRadius: 999, display: "block", background: "#fff" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontWeight: 600, fontSize: "17px", letterSpacing: "-.01em" }}>Trim’s Fresh &amp; Co.</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-micro)", color: "var(--ink-3)" }}>
                Staff clock in with TimeTally
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 01 problem ---------- */}
      <LabelledSection
        number="01."
        label="The problem"
        note="Where paper timesheets and spreadsheets cost you time and money."
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
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))",
              gap: "12px 28px",
              padding: "18px 0",
              borderTop: "var(--border-panel)",
            }}
          >
            <span style={{ ...bodyFixed, display: "flex", flexDirection: "column", gap: 6, color: "var(--ink-3)" }}>
              <span data-show-sm="" style={label}>
                Today
              </span>
              {p.problem}
            </span>
            <span style={{ ...bodyFixed, display: "flex", flexDirection: "column", gap: 6, color: "var(--ink)" }}>
              <span data-show-sm="" style={{ ...label, color: "var(--tt)" }}>
                With TimeTally
              </span>
              {p.fix}
            </span>
          </div>
        ))}
      </LabelledSection>

      {/* ---------- 02 how ---------- */}
      <LabelledSection id="how" number="02." label="How it works" note="Most businesses are up and running within a week.">
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
              <p style={{ ...bodyFixed, margin: 0, color: "var(--ink-2)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </LabelledSection>

      {/* ---------- 03 try it ---------- */}
      <LabelledSection
        id="demo"
        number="03."
        label="Try it"
        note="Type any four digits on the pad. The manager screen updates as each person clocks in."
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
            alignItems: "stretch",
          }}
        >
          <Panel title="Staff screen" meta={emp.meta} surface="bg" style={panelFill} bodyStyle={panelFillBody}>
            <div style={{ padding: "clamp(16px,4vw,24px) clamp(16px,4vw,24px) 20px" }}>
              <PinPad message={pinMsg} onComplete={clockIn} />
            </div>
            <div style={{ marginTop: "auto", borderTop: "var(--border-panel)" }}>
              <div style={{ ...microLabel, padding: "12px 16px 8px" }}>{emp.heading}</div>
              {emp.rows.map((r) => (
                <div key={r.label} style={row}>
                  <span style={{ fontSize: "15px", color: "var(--ink-2)" }}>{r.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: r.color, textAlign: "right" }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Manager screen: this week"
            meta={onShift.length + " of 5 on shift"}
            surface="bg"
            style={panelFill}
            bodyStyle={panelFillBody}
          >
            <div
              style={
                {
                  "--wk": "var(--ink-3)",
                  "--sat": "var(--ink-3)",
                  "--sun": "var(--ink-3)",
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  borderBottom: "var(--border-panel)",
                } as CSSProperties
              }
            >
              <DayTile day="weekday" value={TILES.weekday} style={{ borderRight: "var(--border-panel)" }} />
              <DayTile day="saturday" value={TILES.sat} style={{ borderRight: "var(--border-panel)" }} />
              <DayTile day="sunday" value={TILES.sun} />
            </div>
            <div style={{ ...microLabel, padding: "12px 16px 8px" }}>Roster today</div>
            {STAFF.map((s) => {
              const o = onShift.find((x) => x.name === s.name);
              return (
                <div key={s.name} style={row}>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: "15px", color: o ? "var(--ink)" : "var(--ink-3)" }}>
                      {s.name}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-3)" }}>
                      {s.shift}
                    </span>
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: o ? "var(--tt)" : "var(--ink-3)" }}>
                    {o ? "In " + o.time + " ✓" : "Not in yet"}
                  </span>
                </div>
              );
            })}
            <div style={{ ...row, marginTop: "auto" }}>
              <span style={label}>Breaks taken off</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--ink-2)" }}>{BREAKS}</span>
            </div>
            <div style={{ ...row, padding: "16px" }}>
              <span style={label}>Total payroll</span>
              <span style={bigNumber}>{FULL_PAY}</span>
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
              {exported ? "payroll-2026-09-21.csv exported ✓" : "Download payroll file →"}
            </button>
          </Panel>
        </div>
        <FigCaption number="fig. 02">What your staff see, and what you see. Sample data.</FigCaption>
      </LabelledSection>

      {/* ---------- 04 features ---------- */}
      <LabelledSection
        id="features"
        number="04."
        label="What you get"
        note="Everything you need to get from hours worked to pay day."
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
              <h3 style={{ fontSize: "20px", lineHeight: 1.2, letterSpacing: "-.02em", fontWeight: 600, margin: "0 0 10px" }}>
                {f.title}
              </h3>
              <p style={{ ...bodyFixed, margin: 0, color: "var(--ink-2)" }}>{f.body}</p>
            </div>
          ))}
        </div>
      </LabelledSection>

      {/* ---------- 05 support ---------- */}
      <LabelledSection
        id="support"
        number="05."
        label="Setup and support"
        note="Included for every business. You won’t be left to work it out alone."
        surface
      >
        <h2 style={h2}>
          We set it up with you, on site
          <Stop />
        </h2>
        {SUPPORT.map((s) => (
          <div
            key={s.n}
            style={{
              display: "grid",
              gridTemplateColumns: "32px minmax(0,1fr)",
              gap: "16px",
              padding: "18px 0",
              borderTop: "var(--border-panel)",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-micro)", color: "var(--tt)", paddingTop: 3 }}>
              {s.n}
            </span>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: "6px 20px" }}
            >
              <span style={{ fontWeight: 600, fontSize: "17px", lineHeight: 1.35 }}>{s.title}</span>
              <span style={{ ...bodyFixed, color: "var(--ink-2)" }}>{s.body}</span>
            </div>
          </div>
        ))}
      </LabelledSection>

      {/* ---------- 06 stash labs (brand accent) ---------- */}
      <div style={{ "--accent": "var(--brand-accent)", "--accent-hover": "var(--brand-accent-press)" } as CSSProperties}>
        <LabelledSection
          id="stash"
          number="06."
          label="Who builds it"
          note="TimeTally is made and looked after by Stash Labs, a small team in Sydney."
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
              <PullQuote attribution="Stash Labs, Sydney, AU">
                We build the tools we wished existed while working these jobs ourselves.
              </PullQuote>
              <p style={{ ...bodyFixed, margin: "28px 0 24px", color: "var(--ink-2)", maxWidth: "44ch" }}>
                We’re a three-person team in Sydney. We build simple tools for businesses still running on paper and
                spreadsheets. When you call, you talk to the people who made TimeTally.
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
      <LabelledSection id="faq" number="07." label="Questions" note="Anything else, just ask us on the demo call." surface>
        <FaqList items={FAQS} />
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
            <h2
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
              Get 20 hours a month back
              <Stop />
            </h2>
            <p
              style={{
                fontSize: "var(--size-lead)",
                lineHeight: 1.5,
                color: "var(--ink-2)",
                margin: "0 0 40px",
                maxWidth: "40ch",
                textWrap: "pretty",
              }}
            >
              Tell us about your business. We’ll show you TimeTally using your own staff and pay rates. No obligation.
            </p>
            <div style={{ ...microLabel, marginBottom: 4 }}>What happens next</div>
            <SpecList rows={NEXT_STEPS} />
          </div>

          <form
            noValidate
            onSubmit={(ev) => {
              ev.preventDefault();
              void submit();
            }}
            style={{ position: "relative" }}
          >
            <Panel
              title="Request a demo"
              meta="Takes a minute"
              bodyStyle={{
                padding: "24px 18px 22px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
                gap: "6px 16px",
              }}
            >
              <TextField label="Your name" placeholder="Sam Reid" value={form.name} onChange={setField("name")} error={errors.name} />
              <TextField
                label="Business name"
                placeholder="Harbour Café"
                value={form.business}
                onChange={setField("business")}
                error={errors.business}
              />
              <TextField
                label="Email"
                type="email"
                placeholder="sam@harbourcafe.com.au"
                value={form.email}
                onChange={setField("email")}
                error={errors.email}
              />
              <TextField
                label="Phone (optional)"
                type="tel"
                placeholder="04xx xxx xxx"
                value={form.phone}
                onChange={setField("phone")}
              />
              {/* honeypot: invisible to people, bots fill it in */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                value={form.website}
                onChange={(ev) => setField("website")(ev.target.value)}
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              />
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                <span style={label}>How many staff</span>
                <ChipGroup options={STAFF_OPTS} value={form.staff} onChange={setField("staff")} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                <span style={label}>How you do timesheets today</span>
                <ChipGroup options={METHOD_OPTS} value={form.method} onChange={setField("method")} />
              </div>
              <TextField
                label="Anything we should know (optional)"
                multiline
                placeholder="Two locations, casual staff on weekends…"
                value={form.notes}
                onChange={setField("notes")}
                style={{ gridColumn: "1 / -1", marginBottom: "8px" }}
              />
              <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Request a demo"}
                </Button>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--size-micro)", color: "var(--ink-3)" }}>
                  We reply by email or phone. No mailing list.
                </span>
              </div>
              {sendError && (
                <p role="alert" style={{ ...bodyFixed, gridColumn: "1 / -1", margin: "14px 0 0", color: "var(--text-error)" }}>
                  We couldn’t send that. Try again, or{" "}
                  <a href="mailto:hello@stashlabs.com.au" style={{ color: "inherit", textDecoration: "underline" }}>
                    email us
                  </a>
                  . Your details are still here.
                </p>
              )}
            </Panel>
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
              TimeTally<span style={{ color: "var(--tt)" }}>.</span> © {new Date().getFullYear()}. Built and supported by{" "}
              <a href="https://stashlabs.com.au" style={{ color: "var(--ink-2)" }}>
                Stash Labs<span style={{ color: "var(--brand-accent)" }}>.</span>
              </a>{" "}
              Sydney, AU
            </span>
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "22px" }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <a href="#book" style={{ color: "var(--tt)" }}>
              Request a demo →
            </a>
          </div>
        </div>
      </footer>

      {/* ---------- mobile sticky CTA ---------- */}
      <div data-show-sm="" aria-hidden style={{ height: 80 }} />
      <div
        data-show-sm=""
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          padding: "12px var(--gutter) calc(12px + env(safe-area-inset-bottom))",
          background: "var(--bg)",
          borderTop: "var(--border-panel)",
          transform: sticky && !menuOpen ? "none" : "translateY(110%)",
          transition: "transform .5s var(--ease-out-expo)",
        }}
      >
        <Button href="#book" fullWidth>
          Request a demo
        </Button>
      </div>
    </div>
  );
}
