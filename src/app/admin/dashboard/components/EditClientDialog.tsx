/**
 * EditClientDialog Component
 * Dialog form for editing existing clients
 * Features:
 * - Update business name and contact email
 * - Change client status (active, inactive, suspended)
 * - Update manager PIN
 * - Subdomain is read-only (cannot be changed)
 */
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Client } from "@/types/database";

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditClientDialog({
  client,
  open,
  onOpenChange,
  onSuccess,
}: EditClientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">(
    "active",
  );
  const [managerPin, setManagerPin] = useState("");

  /**
   * Pre-populate form when client changes
   */
  useEffect(() => {
    if (client) {
      setBusinessName(client.business_name);
      setContactEmail(client.contact_email);
      setStatus(client.status);
      setManagerPin(""); // Don't show existing PIN
      setError("");
    }
  }, [client]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          contactEmail,
          status,
          managerPin: managerPin || undefined, // Only update if provided
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update client");
        return;
      }

      // Success - close dialog
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-neutral-700 bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-white">
              Business Name *
            </Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Corporation"
              className="border-neutral-600 text-white"
              required
            />
          </div>

          {/* Subdomain (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="subdomain" className="text-white">
              Subdomain
            </Label>
            <Input
              id="subdomain"
              value={client.subdomain}
              className="cursor-not-allowed border-neutral-600 bg-white text-black opacity-60"
              disabled
            />
            <p className="text-xs text-neutral-400">
              Subdomain cannot be changed
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-white">
              Contact Email *
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="manager@acme.com"
              className="border-neutral-600 text-white"
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-white">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value: any) => setStatus(value)}
            >
              <SelectTrigger className="border-neutral-600 bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-neutral-700 bg-neutral-800 text-white">
                <SelectItem value="active" className="text-white">
                  Active
                </SelectItem>
                <SelectItem value="inactive" className="text-white">
                  Inactive
                </SelectItem>
                <SelectItem value="suspended" className="text-white">
                  Suspended
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manager PIN (optional) */}
          <div className="space-y-2">
            <Label htmlFor="managerPin" className="text-white">
              Manager PIN
              <span className="ml-2 text-xs text-neutral-400">
                Leave blank to keep current PIN
              </span>
            </Label>
            <Input
              id="managerPin"
              type="text"
              value={managerPin}
              onChange={(e) =>
                setManagerPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="****"
              maxLength={4}
              className="border-neutral-600 text-white"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-neutral-600 bg-white text-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
