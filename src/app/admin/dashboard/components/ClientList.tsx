/**
 * ClientList Component
 * Displays table of all clients with actions
 * Features:
 * - Sortable columns
 * - Status badges
 * - Edit/Delete actions
 * - View subdomain links
 */
"use client";

import type { Client } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";

interface ClientListProps {
  clients: (Client & { employees?: { count: number }[] })[];
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export function ClientList({ clients, onEdit, onDelete }: ClientListProps) {
  /**
   * Get badge variant based on client status
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge className="bg-yellow-500">Inactive</Badge>;
      case "suspended":
        return <Badge className="bg-red-500">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  /**
   * Get employee count from aggregated data
   */
  const getEmployeeCount = (
    client: Client & { employees?: { count: number }[] },
  ) => {
    return client.employees?.[0]?.count ?? 0;
  };

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-800">
      <Table>
        <TableHeader>
          <TableRow className="border-neutral-700 hover:bg-transparent">
            <TableHead className="text-white">Business Name</TableHead>
            <TableHead className="text-white">Subdomain</TableHead>
            <TableHead className="text-white">Contact Email</TableHead>
            <TableHead className="text-white">Status</TableHead>
            <TableHead className="text-white">Employees</TableHead>
            <TableHead className="text-white">Created</TableHead>
            <TableHead className="text-center text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-8 text-center text-neutral-400"
              >
                No clients found. Create your first client to get started.
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow
                key={client.id}
                className="border-neutral-700 hover:bg-neutral-700/60"
              >
                {/* Business Name */}
                <TableCell className="font-medium">
                  {client.business_name}
                </TableCell>

                {/* Subdomain with link */}
                <TableCell>
                  <a
                    href={`http://${client.subdomain}.timetally.local:3000`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1 hover:underline"
                  >
                    {client.subdomain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>

                {/* Contact Email */}
                <TableCell className="text-neutral-400">
                  {client.contact_email}
                </TableCell>

                {/* Status Badge */}
                <TableCell>{getStatusBadge(client.status)}</TableCell>

                {/* Employee Count */}
                <TableCell>{getEmployeeCount(client)}</TableCell>

                {/* Created Date */}
                <TableCell className="text-neutral-400">
                  {new Date(client.created_at).toLocaleDateString()}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(client)}
                      className="hover:bg-primary/20 hover:border-primary border-neutral-600 bg-neutral-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete?.(client)}
                      className="border-neutral-600 bg-neutral-700 hover:border-red-500 hover:bg-red-900/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
