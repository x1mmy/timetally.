/**
 * Client Portal Landing Page
 * Entry point for client subdomains (e.g., acme.timetally.com)
 * Shows the business's name and the two ways in: employee and manager login.
 */
import Link from "next/link";
import { Logo } from "~/components/Logo";
import { ThemeToggle } from "~/components/ThemeToggle";
import { createSupabaseAdmin } from "~/lib/supabase/server";
import { getSubdomain } from "~/lib/subdomain";
import type { Client } from "~/types/database";

async function getBusinessName(): Promise<string> {
  const subdomain = await getSubdomain();
  if (!subdomain) return "TimeTally";

  const { data } = await createSupabaseAdmin()
    .from("clients")
    .select("business_name")
    .eq("subdomain", subdomain)
    .single();
  const client = data as Pick<Client, "business_name"> | null;

  return client?.business_name ?? "TimeTally";
}

const doors = [
  {
    href: "/client/employee/login",
    title: "Employee login",
    description: "Submit your weekly timesheet",
    action: "Login with PIN",
  },
  {
    href: "/client/manager/login",
    title: "Manager login",
    description: "Review and export payroll data",
    action: "Manager login",
  },
];

export default async function ClientLandingPage(): Promise<React.JSX.Element> {
  const businessName = await getBusinessName();

  return (
    <div className="mx-auto grid max-w-3xl gap-9 px-4 py-10 sm:px-6 sm:py-14 [@media(orientation:landscape)_and_(max-height:540px)]:gap-6 [@media(orientation:landscape)_and_(max-height:540px)]:py-7">
      <div className="flex items-center justify-between gap-3">
        <Logo />
        <ThemeToggle />
      </div>

      <div>
        <h1 className="text-[clamp(40px,6vw,64px)] leading-none font-semibold tracking-tight break-words">
          {businessName}
        </h1>
        <p className="text-muted-foreground mt-3.5 text-lg">
          Payroll and timesheets
        </p>
      </div>

      <div>
        {doors.map((door) => (
          <Link
            key={door.href}
            href={door.href}
            className="group border-border hover:text-primary grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t py-5 transition-colors last:border-b"
          >
            <div>
              <div className="text-xl font-semibold tracking-tight sm:text-2xl">
                {door.title}
              </div>
              <div className="text-muted-foreground mt-0.5 text-[15px]">
                {door.description}
              </div>
            </div>
            <span className="border-input group-hover:border-primary inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-sm whitespace-nowrap transition-colors">
              {door.action} <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>

      <p className="text-muted-foreground text-[13px]">
        © 2026 TimeTally · Built by{" "}
        <a
          href="https://stashlabs.com.au"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary inline-block py-2 transition-colors"
        >
          Stash Labs
        </a>
      </p>
    </div>
  );
}
