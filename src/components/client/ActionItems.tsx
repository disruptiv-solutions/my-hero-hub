"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { ClientActionItem } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from "@/lib/hooks/use-toast";
import {
  Plus,
  Loader2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
  Edit2,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface ActionItemsProps {
  clientId: string;
}

const ActionItems = ({ clientId }: ActionItemsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClientActionItem | null>(null);
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"pending" | "in-progress" | "completed" | "cancelled">("pending");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["client-action-items", clientId],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/action-items`, {
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch action items");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (item: Partial<ClientActionItem>) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}/action-items`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create action item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-action-items", clientId] });
      queryClient.invalidateQueries({ queryKey: ["master-priorities"] });
      handleCloseDialog();
      toast({
        title: "Action item created",
        description: "The action item has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create action item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: Partial<ClientActionItem> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/action-items/${id}`,
        {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update action item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-action-items", clientId] });
      queryClient.invalidateQueries({ queryKey: ["master-priorities"] });
      handleCloseDialog();
      toast({
        title: "Action item updated",
        description: "The action item has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update action item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/clients/${encodeURIComponent(clientId)}/action-items/${id}`,
        {
          method: "DELETE",
          headers,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete action item");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-action-items", clientId] });
      queryClient.invalidateQueries({ queryKey: ["master-priorities"] });
      toast({
        title: "Action item deleted",
        description: "The action item has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete action item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (item?: ClientActionItem) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setDescription(item.description || "");
      setStatus(item.status);
      setPriority(item.priority);
      setDueDate(item.dueDate || "");
    } else {
      setEditingItem(null);
      setTitle("");
      setDescription("");
      setStatus("pending");
      setPriority("medium");
      setDueDate("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setStatus("pending");
    setPriority("medium");
    setDueDate("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the action item.",
        variant: "destructive",
      });
      return;
    }

    const itemData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, item: itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-900/40 text-green-400 border-green-700";
      case "in-progress":
        return "bg-blue-900/40 text-blue-400 border-blue-700";
      case "cancelled":
        return "bg-gray-700/40 text-gray-400 border-gray-600";
      default:
        return "bg-yellow-900/40 text-yellow-400 border-yellow-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-900/40 text-red-400 border-red-700";
      case "medium":
        return "bg-orange-900/40 text-orange-400 border-orange-700";
      default:
        return "bg-gray-700/40 text-gray-400 border-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const actionItems = data?.actionItems || [];
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingPriorityId(null);
      }
    };

    if (editingPriorityId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingPriorityId]);

  const handleQuickPriorityChange = (itemId: string, newPriority: "low" | "medium" | "high") => {
    updateMutation.mutate({
      id: itemId,
      item: { priority: newPriority },
    });
    setEditingPriorityId(null);
  };

  return (
    <>
      <Card className="bg-gray-800 border-gray-700 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 p-4 pb-0 flex-shrink-0">
          <h3 className="text-white font-semibold">Action Items</h3>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : actionItems.length > 0 ? (
            <div className="space-y-2">
              {actionItems.map((item: ClientActionItem) => (
              <Card
                key={item.id}
                className="bg-gray-900 border-gray-700 p-3 hover:bg-gray-850 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400">{getStatusIcon(item.status)}</span>
                      <h4 className="text-white font-medium text-sm truncate">{item.title}</h4>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace("-", " ")}
                      </Badge>
                      <div className="relative" ref={editingPriorityId === item.id ? dropdownRef : null}>
                        {editingPriorityId === item.id ? (
                          <div className="absolute top-0 left-0 z-50 bg-gray-800 border border-gray-700 rounded-md shadow-lg min-w-[80px]">
                            <button
                              onClick={() => handleQuickPriorityChange(item.id, "low")}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 first:rounded-t-md last:rounded-b-md ${
                                item.priority === "low" ? "bg-gray-700/40 text-gray-300" : "text-gray-300"
                              }`}
                            >
                              Low
                            </button>
                            <button
                              onClick={() => handleQuickPriorityChange(item.id, "medium")}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 ${
                                item.priority === "medium" ? "bg-orange-900/40 text-orange-300" : "text-gray-300"
                              }`}
                            >
                              Medium
                            </button>
                            <button
                              onClick={() => handleQuickPriorityChange(item.id, "high")}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 ${
                                item.priority === "high" ? "bg-red-900/40 text-red-300" : "text-gray-300"
                              }`}
                            >
                              High
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPriorityId(item.id);
                            }}
                            className="focus:outline-none"
                            disabled={updateMutation.isPending}
                          >
                            <Badge className={`${getPriorityColor(item.priority)} cursor-pointer hover:opacity-80 transition-opacity`}>
                              {item.priority}
                            </Badge>
                          </button>
                        )}
                      </div>
                      {item.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(item.dueDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      onClick={() => handleOpenDialog(item)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                      aria-label="Edit action item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this action item?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      disabled={deleteMutation.isPending}
                      aria-label="Delete action item"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No action items yet</p>
              <p className="text-xs mt-1">Add your first action item to get started</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Action Item" : "Create Action Item"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingItem
                ? "Update the action item details."
                : "Add a new action item for this client."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="action-title" className="text-gray-200">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="action-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Follow up on proposal"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="action-description" className="text-gray-200">
                Description
              </Label>
              <Textarea
                id="action-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this action item..."
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-gray-200">Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-gray-200">Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="action-due-date" className="text-gray-200">
                Due Date
              </Label>
              <Input
                id="action-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={handleCloseDialog}
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
                    {editingItem ? "Saving..." : "Creating..."}
                  </span>
                ) : (
                  editingItem ? "Save Changes" : "Create Item"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActionItems;

