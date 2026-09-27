/**
 * Stash Labs design system primitives, ported from the DS bundle.
 * Styles read the tokens defined in ~/styles/landing.css.
 */
import type { CSSProperties, ReactNode } from "react";

type Tone = "ink" | "tt" | "accent";

const toneColor = (tone?: Tone, fallback = "var(--ink-3)"): string =>
  tone === "tt" ? "var(--tt)" : tone === "accent" ? "var(--accent)" : fallback;

const SIZES = {
  lg: { padding: "15px 26px", fontSize: "15px" },
  md: { padding: "13px 22px", fontSize: "14px" },
  sm: { padding: "11px 16px", fontSize: "11px" },
} as const;

const SKINS: Record<string, CSSProperties> = {
  primary: { background: "var(--accent)", color: "var(--accent-ink)" },
  secondary: { background: "transparent", color: "var(--ink)", borderColor: "var(--line-strong)" },
  ghost: { background: "transparent", color: "var(--ink-2)" },
};

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: keyof typeof SIZES;
  arrow?: boolean;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}

export function Button({
  children,
  variant = "primary",
  size = "lg",
  arrow = true,
  href,
  disabled = false,
  onClick,
  type = "button",
}: ButtonProps): React.JSX.Element {
  const s = SIZES[size];
  const mono = size === "sm";
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: s.padding,
    borderRadius: "var(--radius-pill)",
    fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
    fontSize: s.fontSize,
    fontWeight: mono ? 400 : "var(--weight-strong)",
    letterSpacing: mono ? "var(--ls-label)" : 0,
    textTransform: mono ? "uppercase" : "none",
    lineHeight: 1,
    whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    border: "1px solid transparent",
    ...SKINS[variant],
  };
  const content = (
    <>
      {children}
      {arrow && <span style={{ fontFamily: "var(--font-mono)" }}>→</span>}
    </>
  );
  return href ? (
    <a href={href} data-lift="" style={style}>
      {content}
    </a>
  ) : (
    <button type={type} onClick={onClick} disabled={disabled} data-lift="" style={style}>
      {content}
    </button>
  );
}

export function InlineLink({
  children,
  href,
  external = false,
}: {
  children: ReactNode;
  href: string;
  external?: boolean;
}): React.JSX.Element {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "9px",
        fontFamily: "var(--font-sans)",
        fontSize: "15px",
        fontWeight: "var(--weight-strong)",
        color: "var(--accent)",
        borderBottom: "1px solid currentColor",
        paddingBottom: "3px",
      }}
    >
      {children}
      {external && <span style={{ fontFamily: "var(--font-mono)" }}>↗</span>}
    </a>
  );
}

export interface SpecRow {
  label: string;
  value: string;
  tone?: Tone;
}

export function SpecList({ rows, open = true }: { rows: SpecRow[]; open?: boolean }): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderTop: open ? "var(--border-open)" : "var(--border-panel)",
      }}
    >
      {rows.map((r) => (
        <div
          key={r.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            padding: "11px 0",
            borderBottom: "var(--border-panel)",
            fontSize: "15px",
            color: "var(--ink)",
          }}
        >
          <span>{r.label}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: toneColor(r.tone) }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Stat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: Tone;
}): React.JSX.Element {
  return (
    <div style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
      <div
        style={{
          fontSize: "var(--size-stat)",
          lineHeight: 1,
          fontWeight: "var(--weight-strong)",
          letterSpacing: "-.03em",
          color: toneColor(tone, "var(--ink)"),
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--size-micro-sm)",
          letterSpacing: "var(--ls-label)",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginTop: "8px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export function Ticker({ items, separator = "—" }: { items: string[]; separator?: string }): React.JSX.Element {
  return (
    <div
      aria-hidden
      style={{
        overflow: "hidden",
        borderTop: "var(--border-panel)",
        borderBottom: "var(--border-panel)",
        background: "var(--bg)",
        padding: "14px 0",
      }}
    >
      <div
        data-ticker=""
        style={{ display: "flex", width: "max-content", animation: "sl-ticker var(--loop-ticker) linear infinite" }}
      >
        {[...items, ...items].map((t, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "22px",
              paddingRight: "22px",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--size-micro)",
              letterSpacing: "var(--ls-label)",
              textTransform: "uppercase",
              color: "var(--ink-2)",
              whiteSpace: "nowrap",
            }}
          >
            {t}
            <span style={{ color: "var(--accent)" }}>{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function PullQuote({ children, attribution }: { children: ReactNode; attribution: string }): React.JSX.Element {
  return (
    <figure style={{ margin: 0 }}>
      <p
        style={{
          fontFamily: "var(--font-serif-display)",
          fontSize: "var(--size-pull)",
          lineHeight: "var(--lh-pull)",
          letterSpacing: "var(--ls-pull)",
          color: "var(--ink)",
          margin: 0,
          maxWidth: "var(--measure-pull)",
        }}
      >
        {children}
      </p>
      <figcaption
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--size-micro-sm)",
          letterSpacing: "var(--ls-label)",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginTop: "18px",
        }}
      >
        {attribution}
      </figcaption>
    </figure>
  );
}

interface LabelledSectionProps {
  number: string;
  label: string;
  note?: string;
  surface?: boolean;
  id?: string;
  children: ReactNode;
}

export function LabelledSection({
  number,
  label,
  note,
  surface = false,
  id,
  children,
}: LabelledSectionProps): React.JSX.Element {
  return (
    <section
      id={id}
      style={{ borderTop: "var(--border-panel)", background: surface ? "var(--surface)" : "var(--bg)" }}
    >
      <div
        style={{
          maxWidth: "var(--measure-page)",
          margin: "0 auto",
          padding: "var(--section-pad-y-tight) var(--gutter)",
        }}
      >
        <div
          data-r="split"
          style={{
            display: "grid",
            gridTemplateColumns: "var(--split-label) var(--split-content)",
            gap: "clamp(28px,5vw,80px)",
          }}
        >
          <div>
            <div style={{ display: "flex", gap: "10px", ...micro, color: "var(--ink-2)" }}>
              <span style={{ color: "var(--accent)" }}>{number}</span>
              <span>{label}</span>
            </div>
            {note && (
              <p
                style={{
                  fontSize: "var(--size-body-fixed)",
                  lineHeight: "var(--lh-body-tight)",
                  color: "var(--ink-3)",
                  margin: "16px 0 0",
                  maxWidth: "var(--measure-body-narrow)",
                }}
              >
                {note}
              </p>
            )}
          </div>
          <div style={{ minWidth: 0 }}>{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Mono uppercase label style, reused all over the page. */
export const micro: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--size-micro)",
  letterSpacing: "var(--ls-label)",
  textTransform: "uppercase",
};

/** Smaller mono label used in panel headers and table heads. */
export const label: CSSProperties = { ...micro, fontSize: "10.5px", color: "var(--ink-3)" };

/** Italic serif full stop that ends every headline. */
export function Stop({ color = "var(--tt)" }: { color?: string }): React.JSX.Element {
  return (
    <span style={{ fontFamily: "var(--font-serif-display)", fontStyle: "italic", fontWeight: 400, color }}>.</span>
  );
}

/** "What happens next" rows, shared by the landing form and the thank-you page. */
export const NEXT_STEPS: SpecRow[] = [
  { label: "We get in touch to book a time", value: "01" },
  { label: "Demo with your staff and pay rates", value: "02" },
  { label: "If it fits, we set up on site", value: "03", tone: "tt" },
];
