/**
 * Stash Labs design system primitives, ported from the DS bundle.
 * Styles read the tokens defined in ~/styles/landing.css.
 * Some components hold state, so import them from client components only.
 */
import { type CSSProperties, type ReactNode, useState } from "react";

type Tone = "ink" | "tt" | "accent" | "brand";

const toneColor = (tone?: Tone, fallback = "var(--ink-3)"): string =>
  tone === "tt"
    ? "var(--tt)"
    : tone === "accent"
      ? "var(--accent)"
      : tone === "brand"
        ? "var(--brand-accent)"
        : fallback;

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
  fullWidth?: boolean;
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
  fullWidth = false,
  onClick,
  type = "button",
}: ButtonProps): React.JSX.Element {
  const s = SIZES[size];
  const mono = size === "sm";
  const style: CSSProperties = {
    display: fullWidth ? "flex" : "inline-flex",
    width: fullWidth ? "100%" : "auto",
    boxSizing: "border-box",
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
    <a href={href} onClick={onClick} data-lift="" style={style}>
      {content}
    </a>
  ) : (
    <button type={type} onClick={onClick} disabled={disabled} data-lift="" style={style}>
      {content}
    </button>
  );
}

export function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o)}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: `1px solid ${on ? "var(--tt)" : "var(--line-strong)"}`,
              background: on ? "var(--tt)" : "transparent",
              color: on ? "var(--accent-ink)" : "var(--ink-2)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              lineHeight: 1.2,
              cursor: "pointer",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
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

export function ThemeToggle({ theme, onToggle }: { theme: "paper" | "ink"; onToggle: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onToggle}
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
  );
}

/** The TimeTally mark: four PIN dots in a 2×2 grid, the last one blue. Sizes take px numbers or CSS (e.g. clamp()). */
export function LogoMark({
  dot,
  gap,
  pinAnimation,
  style,
}: {
  dot: number | string;
  gap: number | string;
  pinAnimation?: string;
  style?: CSSProperties;
}): React.JSX.Element {
  return (
    <span aria-hidden style={{ display: "grid", gridTemplateColumns: "auto auto", gap, flexShrink: 0, ...style }}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          data-pin-dot={i === 3 ? "" : undefined}
          style={{
            width: dot,
            height: dot,
            borderRadius: 999,
            background: i === 3 ? "var(--tt)" : "var(--ink)",
            animation: i === 3 ? pinAnimation : undefined,
          }}
        />
      ))}
    </span>
  );
}

/** The mark plus the wordmark. */
export function Logo({
  size = 19,
  animated = false,
  byline = false,
}: {
  size?: number;
  animated?: boolean;
  byline?: boolean;
}): React.JSX.Element {
  const dot = Math.round(size * 0.42);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "14px" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: dot, color: "var(--ink)" }}>
        <LogoMark
          dot={dot}
          gap={Math.max(3, Math.round(size * 0.21))}
          pinAnimation={animated ? "tt-pin 5.4s cubic-bezier(.16,1,.3,1) infinite" : undefined}
        />
        <span style={{ fontSize: size, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1 }}>
          TimeTally
          <Stop />
        </span>
      </span>
      {byline && (
        <>
          <span style={{ width: 1, height: 16, background: "var(--line-strong)" }} />
          <span style={{ ...micro, color: "var(--ink-2)", whiteSpace: "nowrap" }}>
            A Stash Labs<span style={{ color: "var(--brand-accent)" }}>.</span> product
          </span>
        </>
      )}
    </span>
  );
}

const DAY_TONES = {
  weekday: ["Weekday", "var(--wk)"],
  saturday: ["Saturday", "var(--sat)"],
  sunday: ["Sunday", "var(--sun)"],
} as const;

export function DayTile({
  day,
  value,
  style,
}: {
  day: keyof typeof DAY_TONES;
  value: string;
  style?: CSSProperties;
}): React.JSX.Element {
  const [name, color] = DAY_TONES[day];
  return (
    <div style={{ padding: "16px", ...style }}>
      <div style={{ ...label, color }}>{name}</div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 600,
          letterSpacing: "-.02em",
          marginTop: "6px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
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

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  error?: string;
  style?: CSSProperties;
}

const fieldStyle: CSSProperties = {
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

export function TextField({
  label: text,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
  error,
  style,
}: TextFieldProps): React.JSX.Element {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }}>
      <span style={label}>{text}</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          data-focus-tt=""
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          data-focus-tt=""
          style={fieldStyle}
        />
      )}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-error)", minHeight: "14px" }}>
        {error}
      </span>
    </label>
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
              ...micro,
              display: "inline-flex",
              alignItems: "center",
              gap: "22px",
              paddingRight: "22px",
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

interface PanelProps {
  title?: string;
  meta?: ReactNode;
  surface?: "surface" | "bg";
  padded?: boolean;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  children: ReactNode;
}

export function Panel({
  title,
  meta,
  surface = "surface",
  padded = false,
  style,
  bodyStyle,
  children,
}: PanelProps): React.JSX.Element {
  return (
    <div
      style={{
        border: "var(--border-panel)",
        borderRadius: "var(--radius-panel)",
        background: surface === "bg" ? "var(--bg)" : "var(--surface)",
        overflow: "hidden",
        ...style,
      }}
    >
      {(title ?? meta) && (
        <div
          style={{
            ...label,
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            padding: "12px 16px",
            borderBottom: "var(--border-panel)",
          }}
        >
          <span>{title}</span>
          {meta && <span style={{ color: "var(--tt)" }}>{meta}</span>}
        </div>
      )}
      <div style={{ padding: padded ? "28px 24px 24px" : 0, ...bodyStyle }}>{children}</div>
    </div>
  );
}

export function FigCaption({ number, children }: { number: string; children: ReactNode }): React.JSX.Element {
  return (
    <p
      style={{
        margin: "12px 2px 0",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--size-micro)",
        color: "var(--ink-3)",
      }}
    >
      <span style={{ color: "var(--tt)" }}>{number}</span>
      {"  "}
      {children}
    </p>
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
          data-split=""
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

export function FaqList({ items }: { items: { q: string; a: string }[] }): React.JSX.Element {
  const [open, setOpen] = useState(0);
  return (
    <div style={{ borderTop: "var(--border-open)" }}>
      {items.map((f, i) => (
        <div key={f.q} style={{ borderBottom: "var(--border-panel)" }}>
          <button
            type="button"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
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
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i && (
            <p
              style={{
                margin: 0,
                padding: "0 0 22px",
                maxWidth: "60ch",
                color: "var(--ink-2)",
                fontSize: "var(--size-body-fixed)",
                lineHeight: "var(--lh-body-tight)",
              }}
            >
              {f.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Del"];

export function PinPad({ message, onComplete }: { message: string; onComplete: () => void }): React.JSX.Element {
  const [pin, setPin] = useState("");
  const press = (k: string): void => {
    // Locked while "checking", so a second PIN can't complete before the first lands.
    if (pin.length >= 4) return;
    if (k === "Clear") return setPin("");
    if (k === "Del") return setPin((p) => p.slice(0, -1));
    const next = pin + k;
    setPin(next);
    if (next.length === 4)
      setTimeout(() => {
        onComplete();
        setPin("");
      }, 450);
  };
  return (
    <div>
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
        {pin.length === 4 ? "Checking…" : message}
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
  );
}

/** "What happens next" rows, shared by the landing form and the thank-you page. */
export const NEXT_STEPS: SpecRow[] = [
  { label: "We contact you to book a time", value: "01" },
  { label: "We show you TimeTally with your staff and pay", value: "02" },
  { label: "If it suits you, we set it up in person", value: "03", tone: "tt" },
];
