import { cn } from "~/lib/utils";

/**
 * The TimeTally mark used on the landing page: four PIN dots (the last one
 * blue) and the wordmark with an italic serif full stop.
 */
export function Logo({ className }: { className?: string }): React.JSX.Element {
  return (
    <span
      className={cn(
        "text-foreground inline-flex items-center gap-2.5 text-base font-semibold tracking-tight whitespace-nowrap",
        className,
      )}
    >
      <span aria-hidden className="grid grid-cols-2 gap-[3px]">
        <i className="bg-foreground size-1.5 rounded-full" />
        <i className="bg-foreground size-1.5 rounded-full" />
        <i className="bg-foreground size-1.5 rounded-full" />
        <i className="bg-primary size-1.5 rounded-full" />
      </span>
      <span>
        TimeTally
        <span className="text-primary font-[family-name:var(--font-instrument)] font-normal italic">
          .
        </span>
      </span>
    </span>
  );
}
