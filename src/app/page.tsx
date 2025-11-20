/**
 * TimeTally Landing Page
 * Main marketing page for root domain
 * Shows product information and portal links
 */
import { Clock, Shield, Users, Building2, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <div className="flex justify-center">
            <Clock className="text-primary h-20 w-20" />
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight">TimeTally</h1>
          <p className="text-2xl text-neutral-400">
            Simple, Powerful Timesheet Management
          </p>
          <p className="mx-auto max-w-2xl text-lg text-neutral-500">
            Multi-tenant timesheet solution with subdomain-based client
            isolation. Perfect for businesses managing hourly employees across
            multiple locations.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">Features</h2>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
            <Building2 className="text-primary mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">
              Multi-Tenant Architecture
            </h3>
            <p className="text-neutral-400">
              Each client gets their own subdomain with complete data isolation
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
            <Users className="text-primary mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">Easy Employee Login</h3>
            <p className="text-neutral-400">
              Simple 4-digit PIN authentication for quick timesheet submission
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
            <Shield className="text-primary mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">Manager Dashboard</h3>
            <p className="text-neutral-400">
              View all employee hours, manage staff, and export MYOB-ready CSVs
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
            <CheckCircle className="text-primary mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">
              Automatic Break Calculation
            </h3>
            <p className="text-neutral-400">
              Configurable break rules automatically deduct breaks based on
              hours worked
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-6">
            <Clock className="text-primary mb-4 h-12 w-12" />
            <h3 className="mb-2 text-xl font-semibold">Weekly Reports</h3>
            <p className="text-neutral-400">
              View and export weekly timesheet summaries with totals
            </p>
          </div>

          {/* Feature 6 */}
          {/* <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
            <Building2 className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Admin Portal</h3>
            <p className="text-neutral-400">
              Central admin dashboard for managing multiple clients
            </p>
          </div> */}
        </div>
      </section>

      {/* Portal Links Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-lg border border-neutral-700 bg-neutral-800 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Access Your Portal</h2>
          <p className="mb-6 text-neutral-400">
            Access TimeTally from your dedicated subdomain
          </p>
          <div className="space-y-4">
            <div className="rounded bg-neutral-700 p-4">
              <p className="mb-1 text-sm text-neutral-400">Admin Portal</p>
              <code className="text-primary">admin.timetally.com</code>
            </div>
            <div className="rounded bg-neutral-700 p-4">
              <p className="mb-1 text-sm text-neutral-400">Client Portal</p>
              <code className="text-primary">[your-company].timetally.com</code>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-neutral-800 py-8">
        <div className="container mx-auto px-4 text-center text-neutral-500">
          <p>
            &copy; {new Date().getFullYear()} TimeTally. All rights reserved. |
            Built by{" "}
            <a
              href="https://stashlabs.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Stash Labs.
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}