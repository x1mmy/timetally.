/**
 * Client Portal Landing Page
 * Entry point for client subdomains (e.g., acme.timetally.com)
 * Features:
 * - Welcome message with business name
 * - Two login options: Employee and Manager
 * - Navigation to respective login pages
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Clock, Users, Shield, Lock } from "lucide-react";

export default function ClientLandingPage() {
  const [businessName, setBusinessName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  /**
   * Fetch client information on mount
   */
  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        // In a real implementation, you'd fetch this from an API endpoint
        // For now, we'll use a placeholder
        setBusinessName("Welcome");
      } catch (error) {
        console.error("Error fetching client info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            <Clock className="text-primary h-16 w-16" />
          </div>
          <h1 className="mb-2 text-4xl font-bold">
            TimeTally<span className="text-primary">.</span>
          </h1>
          <p className="text-xl text-neutral-400">Payroll Management System</p>
        </div>

        {/* Login Options */}
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Employee Login Card */}
          <Link href="/client/employee/login">
            <Card className="hover:border-primary h-full cursor-pointer border-neutral-700 bg-neutral-800 p-8 transition-colors">
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <Users className="text-primary h-16 w-16" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Employee Login
                </h2>
                <p className="text-neutral-400">Submit your weekly timesheet</p>
                <div className="pt-4">
                  <div className="bg-primary inline-block rounded-lg px-6 py-2 text-white">
                    Login with PIN
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          {/* Manager Login Card */}
          <Link href="/client/manager/login">
            <Card className="hover:border-primary h-full cursor-pointer border-neutral-700 bg-neutral-800 p-8 transition-colors">
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <Lock className="text-primary h-16 w-16" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Manager Access
                </h2>
                <p className="text-neutral-400">
                  Review and export payroll data
                </p>
                <div className="pt-4">
                  <div className="bg-primary inline-block rounded-lg px-6 py-2 text-white">
                    Manager Login
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-neutral-500">
          <p>
            2025 © TimeTally. | Built by{" "}
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
      </div>
    </div>
  );
}
