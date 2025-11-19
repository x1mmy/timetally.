/**
 * Admin Dashboard Page
 * Main dashboard for admin portal
 * Features:
 * - Stats overview (total clients, active clients, etc.)
 * - Client list table
 * - Add new client functionality
 * - Edit/Delete client actions
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatsCards } from "./components/StatsCards";
import { ClientList } from "./components/ClientList";
import { NewClientDialog } from "./components/NewClientDialog";
import { EditClientDialog } from "./components/EditClientDialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import type { Client } from "@/types/database";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<
    (Client & { employees?: { count: number }[] })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  /**
   * Check if user is authenticated
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if admin_session cookie exists by making a request
        const response = await fetch("/api/admin/clients", { method: "HEAD" });

        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push("/admin");
          return;
        }

        // Authenticated
        setAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/admin");
      }
    };

    checkAuth();
  }, [router]);

  /**
   * Fetch clients from API
   */
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/clients");
      const data = await response.json();

      if (response.ok) {
        setClients(data.clients || []);
      } else if (response.status === 401) {
        // Session expired, redirect to login
        router.push("/admin");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load clients after authentication is confirmed
  useEffect(() => {
    if (authenticated) {
      fetchClients();
    }
  }, [authenticated]);

  /**
   * Calculate stats from clients data
   */
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === "active").length,
    totalEmployees: clients.reduce(
      (sum, c) => sum + (c.employees?.[0]?.count || 0),
      0,
    ),
    inactiveClients: clients.filter((c) => c.status === "inactive").length,
  };

  /**
   * Handle edit client action
   */
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setEditDialogOpen(true);
  };

  /**
   * Handle delete client action
   */
  const handleDelete = async (client: Client) => {
    if (!confirm(`Are you sure you want to delete ${client.business_name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh client list
        fetchClients();
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  /**
   * Handle logout action
   */
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", {
        method: "DELETE",
      });

      // Redirect to login page
      router.push("/admin");
    } catch (error) {
      console.error("Error logging out:", error);
      // Redirect anyway
      router.push("/admin");
    }
  };

  // Show loading screen while checking authentication
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-white">
        <div className="text-center">
          <Clock className="text-primary mx-auto mb-4 h-12 w-12 animate-pulse" />
          <p className="text-neutral-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="text-primary h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">TimeTally Admin</h1>
                <p className="text-sm text-neutral-400">
                  Client Management Dashboard
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <NewClientDialog onSuccess={fetchClients} />
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-neutral-600 bg-neutral-700 text-red-500 hover:border-red-500 hover:bg-red-500/20 hover:text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">Overview</h2>
            <StatsCards
              totalClients={stats.totalClients}
              activeClients={stats.activeClients}
              totalEmployees={stats.totalEmployees}
              inactiveClients={stats.inactiveClients}
            />
          </section>

          {/* Client List */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">All Clients</h2>
            {loading ? (
              <div className="py-12 text-center text-neutral-400">
                Loading clients...
              </div>
            ) : (
              <ClientList
                clients={clients}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </section>
        </div>
      </main>

      {/* Edit Client Dialog */}
      <EditClientDialog
        client={editingClient}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchClients}
      />
    </div>
  );
}
