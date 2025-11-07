"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Client } from "@/types";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Loader2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ClientsView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvRaw, setCsvRaw] = useState<string>("");
  const [csvPreview, setCsvPreview] = useState<
    Array<{ name: string; email: string; phone?: string; newsletterSubscribed?: boolean; events?: string[] }>
  >([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importEventTag, setImportEventTag] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [eventInput, setEventInput] = useState<string>("");

  type ClientFormValues = {
    name: string;
    email: string;
    phone: string;
    status: string;
    value: string;
    notes: string;
    newsletterSubscribed: boolean;
    events: string[];
  };

  const initialFormValues: ClientFormValues = {
    name: "",
    email: "",
    phone: "",
    status: "lead",
    value: "",
    notes: "",
    newsletterSubscribed: false,
    events: [],
  };

  const [formValues, setFormValues] = useState<ClientFormValues>(
    initialFormValues
  );
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ClientFormValues, string>>
  >({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["clients", statusFilter],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/clients?${params.toString()}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const createClientMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const headers = await getAuthHeaders();
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        status: values.status,
        value:
          values.value.trim() !== ""
            ? Number.parseFloat(values.value.trim())
            : null,
        notes: values.notes.trim() || null,
        newsletterSubscribed: Boolean(values.newsletterSubscribed),
        events: Array.from(
          new Set((values.events || []).map((e) => e.trim()).filter((e) => e.length > 0))
        ),
      };

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to create client");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      handleDialogOpenChange(false);
      toast({
        title: "Client added",
        description: "The new client has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to add client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: ClientFormValues;
    }) => {
      const headers = await getAuthHeaders();
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        status: values.status,
        value:
          values.value.trim() !== ""
            ? Number.parseFloat(values.value.trim())
            : null,
        notes: values.notes.trim() || null,
        newsletterSubscribed: Boolean(values.newsletterSubscribed),
        events: Array.from(
          new Set((values.events || []).map((e) => e.trim()).filter((e) => e.length > 0))
        ),
      };

      const response = await fetch("/api/clients", {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...payload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to update client");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      handleDialogOpenChange(false);
      toast({
        title: "Client updated",
        description: "Client details saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update client",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDialogOpenChange = (open: boolean) => {
    setIsClientDialogOpen(open);
    if (!open) {
      setDialogMode("add");
      setSelectedClientId(null);
      setFormValues(initialFormValues);
      setFormErrors({});
    }
  };

  const handleOpenAddClient = () => {
    setDialogMode("add");
    setSelectedClientId(null);
    setFormValues(initialFormValues);
    setFormErrors({});
    setIsClientDialogOpen(true);
  };

  const handleOpenEditClient = (client: Client) => {
    setDialogMode("edit");
    setSelectedClientId(client.id);
    setFormValues({
      name: client.name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      status: client.status ?? "lead",
      value:
        client.value !== undefined && client.value !== null
          ? client.value.toString()
          : "",
      notes: client.notes ?? "",
      newsletterSubscribed: Boolean(client.newsletterSubscribed),
      events: Array.isArray(client.events) ? client.events : [],
    });
    setFormErrors({});
    setIsClientDialogOpen(true);
  };

  const handleInputChange = (
    field: keyof ClientFormValues,
    value: string
  ): void => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: Partial<Record<keyof ClientFormValues, string>> = {};

    if (!formValues.name.trim()) {
      errors.name = "Name is required.";
    }

    if (!formValues.email.trim()) {
      errors.email = "Email is required.";
    }

    if (formValues.value.trim() !== "") {
      const numericValue = Number.parseFloat(formValues.value.trim());
      if (Number.isNaN(numericValue) || numericValue < 0) {
        errors.value = "Enter a valid positive number.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (dialogMode === "edit" && selectedClientId) {
      updateClientMutation.mutate({
        id: selectedClientId,
        values: formValues,
      });
      return;
    }

    createClientMutation.mutate(formValues);
  };

  const isSubmitting =
    createClientMutation.isPending || updateClientMutation.isPending;

  const importClientsMutation = useMutation({
    mutationFn: async (
      rows: Array<{
        name: string;
        email: string;
        phone?: string;
        newsletterSubscribed?: boolean;
        events?: string[];
      }>
    ) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contacts: rows }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to import clients");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setIsImportOpen(false);
      setCsvPreview([]);
      setCsvError(null);
      toast({
        title: "Import complete",
        description: `${data.created} contacts created`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to delete client");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      handleDialogOpenChange(false);
      toast({
        title: "Client deleted",
        description: "The client has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const headers = await getAuthHeaders();
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/clients?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers,
          }).then(async (r) => {
            if (!r.ok) {
              const e = await r.json().catch(() => null);
              throw new Error(e?.error || `Failed to delete ${id}`);
            }
          })
        )
      );
      return { deleted: ids.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setSelectedIds(new Set());
      toast({
        title: "Clients deleted",
        description: `Deleted ${data.deleted} selected client(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${ids.length} selected client(s)? This cannot be undone.`
    );
    if (!confirmed) return;
    bulkDeleteMutation.mutate(ids);
  };

  const normalizeHeader = (str: string) =>
    str.trim().toLowerCase().replace(/[\s_-]+/g, "");

  const parseBoolean = (val: string) => {
    const v = val.trim().toLowerCase();
    return v === "true" || v === "yes" || v === "y" || v === "1";
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    // Basic CSV with quotes handling
    const splitCsvLine = (line: string) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' ) {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          result.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      result.push(current);
      return result.map((s) => s.replace(/^"(.*)"$/s, "$1").trim());
    };
    const headersRaw = splitCsvLine(lines[0]);
    const headers = headersRaw.map(normalizeHeader);
    const nameIdx = headers.findIndex((h) => ["name","fullname","contactname"].includes(h));
    const firstIdx = headers.findIndex((h) => ["firstname","first"].includes(h));
    const lastIdx = headers.findIndex((h) => ["lastname","last","surname"].includes(h));
    const emailIdx = headers.findIndex((h) => ["email","emailaddress"].includes(h));
    const phoneIdx = headers.findIndex((h) => ["phone","phonenumber"].includes(h));
    const newsletterIdx = headers.findIndex((h) =>
      ["newsletter","subscribed","newslettersubscribed","registeredfornewsletter"].includes(h)
    );
    const eventsIdx = headers.findIndex((h) =>
      ["event","eventname","events"].includes(h)
    );
    const rows = lines.slice(1).map(splitCsvLine);
    const result = rows
      .map((cols) => {
        const name =
          nameIdx >= 0
            ? cols[nameIdx]
            : [firstIdx >= 0 ? cols[firstIdx] : "", lastIdx >= 0 ? cols[lastIdx] : ""]
                .filter(Boolean)
                .join(" ")
                .trim();
        const email = emailIdx >= 0 ? cols[emailIdx] : "";
        const phone = phoneIdx >= 0 ? cols[phoneIdx] : "";
        const newsletter =
          newsletterIdx >= 0 ? parseBoolean(cols[newsletterIdx] || "") : false;
        let events: string[] = [];
        if (eventsIdx >= 0) {
          const raw = cols[eventsIdx] || "";
          events = raw
            ? raw.split(/[;|]+/).map((e) => e.trim()).filter(Boolean)
            : [];
        }
        return { name, email, phone, newsletterSubscribed: newsletter, events };
      })
      .filter((r) => r.name && r.email);
    return result;
  };

  const handleCsvFile = async (file: File | null) => {
    setCsvError(null);
    setCsvPreview([]);
    if (!file) return;
    try {
      const text = await file.text();
      setCsvRaw(text);
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setCsvError("No valid rows found. Ensure Name and Email are present.");
        return;
      }
      setCsvPreview(parsed);
    } catch (e: any) {
      setCsvError(e?.message || "Failed to read CSV file.");
    }
  };

  const cleanCsvMutation = useMutation({
    mutationFn: async (csv: string) => {
      const res = await fetch("/api/clients/import/clean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to clean CSV");
      }
      return res.json();
    },
    onSuccess: (data: { contacts: Array<{ name: string; email: string; phone?: string; newsletterSubscribed?: boolean }> }) => {
      setCsvPreview(data.contacts || []);
      toast({
        title: "CSV cleaned",
        description: `Prepared ${data.contacts?.length || 0} contacts for import`,
      });
    },
    onError: (error: Error) => {
      setCsvError(error.message);
      toast({
        title: "AI cleaning failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredClients = data?.clients?.filter((client: Client) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-900/40 text-green-400 border-green-700";
      case "lead":
        return "bg-yellow-900/40 text-yellow-400 border-yellow-700";
      case "closed":
        return "bg-gray-700/40 text-gray-400 border-gray-600";
      default:
        return "bg-gray-700/40 text-gray-400 border-gray-600";
    }
  };

  const areAllFilteredSelected =
    (filteredClients?.length || 0) > 0 &&
    filteredClients?.every((c: Client) => selectedIds.has(c.id));

  const handleToggleSelectAll = (checked: boolean) => {
    if (!filteredClients || filteredClients.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredClients.forEach((c: Client) => next.add(c.id));
      } else {
        filteredClients.forEach((c: Client) => next.delete(c.id));
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Clients</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
              checked={areAllFilteredSelected}
              onChange={(e) => handleToggleSelectAll(e.target.checked)}
              aria-label="Select all filtered clients"
            />
            <span className="text-sm text-gray-300">
              Select all{filteredClients?.length ? ` (${filteredClients.length})` : ""}
            </span>
          </label>
        </div>
        <Dialog open={isClientDialogOpen} onOpenChange={handleDialogOpenChange}>
          <Button
            onClick={handleOpenAddClient}
            className="bg-blue-600 hover:bg-blue-700"
            aria-label="Add a new client"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-[90vw]">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "edit" ? "Edit client" : "Add client"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {dialogMode === "edit"
                  ? "Update client details and save your changes."
                  : "Enter client details to save them to your workspace."}
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client-name" className="text-gray-200">
                    Name
                  </Label>
                  <Input
                    id="client-name"
                    value={formValues.name}
                    onChange={(event) =>
                      handleInputChange("name", event.target.value)
                    }
                    placeholder="Jane Doe"
                    className="bg-gray-800 border-gray-700 text-white"
                    aria-invalid={Boolean(formErrors.name)}
                    required
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-400" role="alert">
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client-email" className="text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      handleInputChange("email", event.target.value)
                    }
                    placeholder="jane@example.com"
                    className="bg-gray-800 border-gray-700 text-white"
                    aria-invalid={Boolean(formErrors.email)}
                    required
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-400" role="alert">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client-phone" className="text-gray-200">
                    Phone
                  </Label>
                  <Input
                    id="client-phone"
                    value={formValues.phone}
                    onChange={(event) =>
                      handleInputChange("phone", event.target.value)
                    }
                    placeholder="(555) 123-4567"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-gray-200">Status</Label>
                  <Select
                    value={formValues.status}
                    onValueChange={(value) => handleInputChange("status", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client-value" className="text-gray-200">
                    Value
                  </Label>
                  <Input
                    id="client-value"
                    value={formValues.value}
                    onChange={(event) =>
                      handleInputChange("value", event.target.value)
                    }
                    placeholder="5000"
                    inputMode="decimal"
                    className="bg-gray-800 border-gray-700 text-white"
                    aria-invalid={Boolean(formErrors.value)}
                  />
                  {formErrors.value && (
                    <p className="text-sm text-red-400" role="alert">
                      {formErrors.value}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <Label htmlFor="client-notes" className="text-gray-200">
                    Notes
                  </Label>
                  <Textarea
                    id="client-notes"
                    value={formValues.notes}
                    onChange={(event) =>
                      handleInputChange("notes", event.target.value)
                    }
                    placeholder="Add any relevant context..."
                    className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                  />
                </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="client-newsletter"
                  type="checkbox"
                  checked={formValues.newsletterSubscribed}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      newsletterSubscribed: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  aria-label="Newsletter subscription"
                />
                <Label htmlFor="client-newsletter" className="text-gray-200">
                  Subscribed to newsletter
                </Label>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="client-events" className="text-gray-200">Events</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    id="client-events"
                    placeholder="e.g., Class - 11/15/25"
                    value={eventInput}
                    onChange={(e) => setEventInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const tag = eventInput.trim();
                        if (!tag) return;
                        setFormValues((prev) => ({
                          ...prev,
                          events: Array.from(new Set([...(prev.events || []), tag])),
                        }));
                        setEventInput("");
                      }
                    }}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Button
                    type="button"
                    className="bg-gray-700 hover:bg-gray-600"
                    onClick={() => {
                      const tag = eventInput.trim();
                      if (!tag) return;
                      setFormValues((prev) => ({
                        ...prev,
                        events: Array.from(new Set([...(prev.events || []), tag])),
                      }));
                      setEventInput("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                {formValues.events && formValues.events.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formValues.events.map((ev) => (
                      <span
                        key={ev}
                        className="inline-flex items-center gap-2 rounded border border-purple-700 bg-purple-900/30 px-2 py-1 text-xs text-purple-200"
                      >
                        {ev}
                        <button
                          type="button"
                          className="text-purple-300 hover:text-purple-100"
                          onClick={() =>
                            setFormValues((prev) => ({
                              ...prev,
                              events: (prev.events || []).filter((e) => e !== ev),
                            }))
                          }
                          aria-label={`Remove ${ev}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              </div>
              <div className="flex justify-end gap-3">
                {dialogMode === "edit" && selectedClientId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                    onClick={() => {
                      const confirmed = window.confirm(
                        "Are you sure you want to delete this client? This cannot be undone."
                      );
                      if (!confirmed) return;
                      deleteClientMutation.mutate(selectedClientId);
                    }}
                    disabled={deleteClientMutation.isPending || isSubmitting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {dialogMode === "edit" ? "Saving..." : "Saving..."}
                    </span>
                  ) : (
                    dialogMode === "edit" ? "Save changes" : "Save client"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDeleteSelected}
              className="bg-red-700 hover:bg-red-800"
              aria-label="Delete selected clients"
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.size})
            </Button>
          </div>
        )}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <Button
            onClick={() => setIsImportOpen(true)}
            className="ml-2 bg-gray-700 hover:bg-gray-600"
            aria-label="Import clients from CSV"
          >
            Import CSV
          </Button>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-[90vw]">
            <DialogHeader>
              <DialogTitle>Import contacts from CSV</DialogTitle>
              <DialogDescription className="text-gray-400">
                CSV must include columns: Name, Email, Phone (optional), Newsletter (true/false).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700"
                aria-label="Upload CSV file"
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600"
                  disabled={!csvRaw || cleanCsvMutation.isPending}
                  onClick={() => csvRaw && cleanCsvMutation.mutate(csvRaw)}
                >
                  {cleanCsvMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cleaning with AI...
                    </span>
                  ) : (
                    "Clean with AI"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => {
                    setCsvRaw("");
                    setCsvPreview([]);
                    setCsvError(null);
                    setImportEventTag("");
                  }}
                >
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="import-event" className="text-gray-200">Apply event tag (optional)</Label>
                <Input
                  id="import-event"
                  placeholder="e.g., Class - 11/15/25"
                  value={importEventTag}
                  onChange={(e) => setImportEventTag(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              {csvError && <p className="text-sm text-red-400">{csvError}</p>}
              {csvPreview.length > 0 && (
                <div className="text-sm text-gray-300">
                  <div className="mb-2">
                    Ready to import {csvPreview.length} contact{csvPreview.length === 1 ? "" : "s"}.
                  </div>
                  <div className="max-h-40 w-full overflow-auto overflow-x-auto border border-gray-700 rounded">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Newsletter</th>
                          <th className="p-2">Events</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-t border-gray-800">
                            <td className="p-2">{r.name}</td>
                            <td className="p-2">{r.email}</td>
                            <td className="p-2">{r.phone || ""}</td>
                            <td className="p-2">{r.newsletterSubscribed ? "true" : "false"}</td>
                            <td className="p-2">{(r.events || []).join("; ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvPreview.length > 10 && (
                      <div className="p-2 text-gray-500">…and more</div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => setIsImportOpen(false)}
                  disabled={importClientsMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={importClientsMutation.isPending || csvPreview.length === 0}
                  onClick={() => {
                    const tag = importEventTag.trim();
                    const rows = csvPreview.map((r) => {
                      const combined = Array.from(new Set([...(r.events || []), ...(tag ? [tag] : [])]));
                      return { ...r, events: combined };
                    });
                    importClientsMutation.mutate(rows);
                  }}
                >
                  {importClientsMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </span>
                  ) : (
                    "Import contacts"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          {["all", "lead", "active", "closed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className={`capitalize ${
                statusFilter === status
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients?.map((client: Client) => (
          <Card
            key={client.id}
            className="bg-gray-800 border-gray-700 p-4 hover:bg-gray-750 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            role="button"
            tabIndex={0}
            aria-label={`Open details for ${client.name}`}
            onClick={() =>
              window.location.assign(`/dashboard/clients/${encodeURIComponent(client.id)}`)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                window.location.assign(`/dashboard/clients/${encodeURIComponent(client.id)}`);
              }
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <label
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(client.id)}
                  onChange={(e) => handleToggleSelected(client.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  aria-label={`Select ${client.name}`}
                />
                <span className="text-xs text-gray-400">Select</span>
              </label>
            </div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{client.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(client.status)}>
                      {client.status}
                    </Badge>
                    {client.newsletterSubscribed && (
                      <Badge className="bg-emerald-900/40 text-emerald-400 border-emerald-700">
                        newsletter
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.value && (
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <DollarSign className="w-4 h-4" />
                  <span>${client.value.toLocaleString()}</span>
                </div>
              )}
              {client.lastContact && (
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Last contact:{" "}
                    {format(new Date(client.lastContact), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 line-clamp-2">
                  {client.notes}
                </p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpenEditClient(client);
                }}
              >
                Edit Client
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(event) => event.stopPropagation()}
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {(!filteredClients || filteredClients.length === 0) && (
        <div className="text-center text-gray-500 py-12">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <div className="text-lg mb-2">No clients found</div>
          <p className="text-sm">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "Add your first client to get started"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientsView;


