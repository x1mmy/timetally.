/**
 * Admin Login Page
 * Entry point for admin portal at admin.timetally.com
 * Features:
 * - Email and password authentication
 * - Session cookie creation
 * - Redirect to dashboard on success
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handle login form submission
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Redirect to dashboard on successful login
      router.push("/admin/dashboard");
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-neutral-700 bg-neutral-800 p-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <Clock className="text-primary h-12 w-12" />
          </div>
          <h1 className="text-primary text-3xl font-bold">TimeTally Admin</h1>
          <p className="text-neutral-400">Login to Admin Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@timetally.com"
              className="border-neutral-600 bg-white"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-neutral-600 bg-white"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login to Admin Portal"}
          </Button>
        </form>
      </div>
    </div>
  );
}
