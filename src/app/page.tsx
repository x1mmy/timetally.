/**
 * TimeTally Landing Page
 * Main marketing page for root domain
 * Shows product information and portal links
 */
import { Clock, Shield, Users, Building2, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-center">
            <Clock className="w-20 h-20 text-primary" />
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight">
            TimeTally
          </h1>
          <p className="text-2xl text-neutral-400">
            Simple, Powerful Timesheet Management
          </p>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
            Multi-tenant timesheet solution with subdomain-based client isolation.
            Perfect for businesses managing hourly employees across multiple locations.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
            <Building2 className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Multi-Tenant Architecture</h3>
            <p className="text-neutral-400">
              Each client gets their own subdomain with complete data isolation
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
            <Users className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy Employee Login</h3>
            <p className="text-neutral-400">
              Simple 4-digit PIN authentication for quick timesheet submission
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
            <Shield className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Manager Dashboard</h3>
            <p className="text-neutral-400">
              View all employee hours, manage staff, and export MYOB-ready CSVs
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
            <CheckCircle className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Automatic Break Calculation</h3>
            <p className="text-neutral-400">
              Configurable break rules automatically deduct breaks based on hours worked
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
            <Clock className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Weekly Reports</h3>
            <p className="text-neutral-400">
              View and export weekly timesheet summaries with totals
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
            <Building2 className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Admin Portal</h3>
            <p className="text-neutral-400">
              Central admin dashboard for managing multiple clients
            </p>
          </div>
        </div>
      </section>

      {/* Portal Links Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-neutral-800 p-8 rounded-lg border border-neutral-700 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Access Your Portal</h2>
          <p className="text-neutral-400 mb-6">
            Access TimeTally from your dedicated subdomain
          </p>
          <div className="space-y-4">
            <div className="bg-neutral-700 p-4 rounded">
              <p className="text-sm text-neutral-400 mb-1">Admin Portal</p>
              <code className="text-primary">admin.timetally.com</code>
            </div>
            <div className="bg-neutral-700 p-4 rounded">
              <p className="text-sm text-neutral-400 mb-1">Client Portal</p>
              <code className="text-primary">[your-company].timetally.com</code>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-neutral-500">
          <p>&copy; {new Date().getFullYear()} TimeTally. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
