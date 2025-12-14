"use client";

import { useEffect, useState, useRef } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  Mail,
  Calendar as CalendarIcon,
  CreditCard,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/lib/hooks/use-toast";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import ConversationsSidebar from "./ConversationsSidebar";
import { MasterPriority } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  order: number;
}

type SidebarSectionKey = "quick-stats" | "priorities" | "master-priorities" | "activity";
const DEFAULT_SECTION_ORDER: SidebarSectionKey[] = [
  "quick-stats",
  "priorities",
  "master-priorities",
  "activity",
];

const RightSidebar = () => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newPriorityTitle, setNewPriorityTitle] = useState("");
  const [newPriorityPriority, setNewPriorityPriority] = useState<"low" | "medium" | "high">("medium");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [editingPriorityId, setEditingPriorityId] = useState<string | null>(null);
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
  const [sectionOrder, setSectionOrder] = useState<SidebarSectionKey[]>(() => {
    if (typeof window === "undefined") return DEFAULT_SECTION_ORDER;
    try {
      const raw = window.localStorage.getItem("rightSidebarSectionOrder");
      if (!raw) return DEFAULT_SECTION_ORDER;
      const parsed = JSON.parse(raw) as SidebarSectionKey[];
      // Validate and ensure all sections exist exactly once
      const unique = Array.from(new Set(parsed)).filter((s): s is SidebarSectionKey =>
        ["quick-stats", "priorities", "master-priorities", "activity"].includes(s)
      );
      const missing = DEFAULT_SECTION_ORDER.filter((s) => !unique.includes(s));
      return [...unique, ...missing].slice(0, DEFAULT_SECTION_ORDER.length);
    } catch {
      return DEFAULT_SECTION_ORDER;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("rightSidebarSectionOrder", JSON.stringify(sectionOrder));
    } catch {
      // ignore persistence errors
    }
  }, [sectionOrder]);
  const moveSection = (fromKey: SidebarSectionKey, toKey: SidebarSectionKey) => {
    if (fromKey === toKey) return;
    setSectionOrder((prev) => {
      const next = prev.slice();
      const fromIdx = next.indexOf(fromKey);
      const toIdx = next.indexOf(toKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromKey);
      return next;
    });
  };
  const handleDragStartFor = (key: SidebarSectionKey) => (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDropOn = (targetKey: SidebarSectionKey) => (e: React.DragEvent) => {
    e.preventDefault();
    const sourceKey = e.dataTransfer.getData("text/plain") as SidebarSectionKey;
    if (!sourceKey) return;
    moveSection(sourceKey, targetKey);
  };
  const handleKeyReorderFor = (key: SidebarSectionKey) => (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    setSectionOrder((prev) => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      if (e.key === "ArrowUp" && idx > 0) {
        const next = prev.slice();
        const [item] = next.splice(idx, 1);
        next.splice(idx - 1, 0, item);
        return next;
      }
      if (e.key === "ArrowDown" && idx < prev.length - 1) {
        const next = prev.slice();
        const [item] = next.splice(idx, 1);
        next.splice(idx + 1, 0, item);
        return next;
      }
      return prev;
    });
  };
  
  // Fetch tasks from API
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/tasks", { headers });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  const tasks: Task[] = tasksData?.tasks || [];
  
  // Filter to show incomplete tasks first, then completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return (b.order || 0) - (a.order || 0);
  });
  
  // Only show incomplete tasks and recently completed (last 5)
  const incompleteTasks = sortedTasks.filter(t => !t.completed);
  const recentCompleted = sortedTasks.filter(t => t.completed).slice(0, 5);
  const displayTasks = [...incompleteTasks, ...recentCompleted];

  // Fetch financial metrics
  const { data: financialData } = useQuery({
    queryKey: ["finances"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/finances", { headers });
      if (!res.ok) throw new Error("Failed to fetch finances");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch clients count
  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/clients", { headers });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Fetch marketing metrics
  const { data: marketingData } = useQuery({
    queryKey: ["marketing"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/marketing", { headers });
      if (!res.ok) throw new Error("Failed to fetch marketing");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          priority: "medium",
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle("");
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTaskMutation.mutate(newTaskTitle.trim());
  };

  const handleToggleTask = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { completed: !task.completed },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  // Master Priorities queries and mutations
  const { data: prioritiesData, isLoading: isLoadingPriorities } = useQuery({
    queryKey: ["master-priorities"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/priorities", { headers });
      if (!res.ok) throw new Error("Failed to fetch priorities");
      const data = await res.json();
      
      // Fetch client names for priorities that have clientId
      const prioritiesWithClientNames = await Promise.all(
        (data.priorities || []).map(async (priority: MasterPriority) => {
          if (priority.clientId) {
            try {
              const clientRes = await fetch(`/api/clients/${encodeURIComponent(priority.clientId)}`, { headers });
              if (clientRes.ok) {
                const clientData = await clientRes.json();
                return { ...priority, clientName: clientData.client?.name };
              }
            } catch (error) {
              console.warn("Failed to fetch client name:", error);
            }
          }
          return priority;
        })
      );
      
      return { priorities: prioritiesWithClientNames };
    },
    refetchInterval: 30 * 1000,
  });

  const priorities: MasterPriority[] = prioritiesData?.priorities || [];
  
  // Filter to show incomplete priorities first, then completed
  const sortedPriorities = [...priorities].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    
    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  const incompletePriorities = sortedPriorities.filter(p => p.status !== "completed");
  const recentCompletedPriorities = sortedPriorities.filter(p => p.status === "completed").slice(0, 5);
  const displayPriorities = [...incompletePriorities, ...recentCompletedPriorities];

  const addPriorityMutation = useMutation({
    mutationFn: async ({ title, priority }: { title: string; priority: "low" | "medium" | "high" }) => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/priorities", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, priority }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add priority");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-priorities"] });
      setNewPriorityTitle("");
      setNewPriorityPriority("medium");
      toast({
        title: "Success",
        description: "Priority added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MasterPriority> }) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/priorities/${id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update priority");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["master-priorities"] });
      // Invalidate all client action items queries to sync changes
      queryClient.invalidateQueries({ queryKey: ["client-action-items"] });
      // If this priority is linked to a client action item, invalidate that specific query
      if (data?.priority?.clientId) {
        queryClient.invalidateQueries({ queryKey: ["client-action-items", data.priority.clientId] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePriorityMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/priorities/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete priority");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-priorities"] });
      toast({
        title: "Success",
        description: "Priority deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddPriority = () => {
    if (!newPriorityTitle.trim()) return;
    addPriorityMutation.mutate({
      title: newPriorityTitle.trim(),
      priority: newPriorityPriority,
    });
  };

  const handleTogglePriority = (priority: MasterPriority) => {
    const newStatus = priority.status === "completed" ? "pending" : "completed";
    updatePriorityMutation.mutate({
      id: priority.id,
      updates: { status: newStatus },
    });
  };

  const handleDeletePriority = (priorityId: string) => {
    deletePriorityMutation.mutate(priorityId);
  };

  const handlePriorityChange = (priorityId: string, newPriority: "low" | "medium" | "high") => {
    updatePriorityMutation.mutate({
      id: priorityId,
      updates: { priority: newPriority },
    });
    setEditingPriorityId(null);
  };

  // Activity feed still uses local store (can be migrated later)
  const activityFeed = useAppStore((state) => state.activityFeed);

  const activeClientsCount =
    clientsData?.clients?.filter((c: any) => c.status === "active").length || 0;

  // Show Conversations sidebar when Chat tab is active
  if (pathname?.startsWith("/dashboard/chat")) {
    const handleConversationSelect = (id: string | null) => {
      setActiveConversationId(id);
      // Dispatch custom event to notify ChatView
      window.dispatchEvent(new CustomEvent("conversation-select", { detail: id }));
    };

    return (
      <ConversationsSidebar
        activeConversationId={activeConversationId}
        onSelectConversation={handleConversationSelect}
      />
    );
  }

  const QuickStatsSection = (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Quick Stats</h3>
        <button
          draggable
          onDragStart={handleDragStartFor("quick-stats")}
          onKeyDown={handleKeyReorderFor("quick-stats")}
          className="text-gray-400 hover:text-gray-200 p-1 rounded cursor-grab active:cursor-grabbing"
          aria-label="Reorder Quick Stats section. Use drag or arrow keys."
          tabIndex={0}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700/50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-green-300">Weekly Revenue</div>
            <div className="text-xl font-bold text-white">
              ${(financialData?.weeklyRevenue || 0).toLocaleString()}
            </div>
          </div>
          <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-300">Pipeline Value</div>
            <div className="text-xl font-bold text-white">
              ${(financialData?.pipelineValue || 0).toLocaleString()}
            </div>
          </div>
          <TrendingUp className="w-8 h-8 text-blue-400 opacity-50" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-700/50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-purple-300">Active Clients</div>
            <div className="text-xl font-bold text-white">
              {activeClientsCount}
            </div>
          </div>
          <Users className="w-8 h-8 text-purple-400 opacity-50" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-orange-700/50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-orange-300">Marketing Spend</div>
            <div className="text-xl font-bold text-white">
              ${(marketingData?.totalSpend || 0).toLocaleString()}
            </div>
          </div>
          <CreditCard className="w-8 h-8 text-orange-400 opacity-50" />
        </div>
      </Card>
    </div>
  );

  const PrioritiesSection = (
    <Card className="bg-gray-800 border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">
          Today&apos;s Priorities
        </h3>
        <button
          draggable
          onDragStart={handleDragStartFor("priorities")}
          onKeyDown={handleKeyReorderFor("priorities")}
          className="text-gray-400 hover:text-gray-200 p-1 rounded cursor-grab active:cursor-grabbing"
          aria-label="Reorder Today's Priorities section. Use drag or arrow keys."
          tabIndex={0}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 mb-3">
        {isLoadingTasks ? (
          <div className="text-center py-4 text-gray-400 text-sm">Loading tasks...</div>
        ) : displayTasks.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No tasks yet. Add one below!</div>
        ) : (
          displayTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 group hover:bg-gray-750 p-2 rounded transition-colors"
            >
              <button
                onClick={() => handleToggleTask(task)}
                className="flex-shrink-0"
                disabled={updateTaskMutation.isPending}
                aria-label={
                  task.completed ? "Mark as incomplete" : "Mark as complete"
                }
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  task.completed
                    ? "line-through text-gray-500"
                    : "text-gray-300"
                }`}
              >
                {task.title}
              </span>
              <button
                onClick={() => handleDeleteTask(task.id)}
                disabled={deleteTaskMutation.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 text-sm"
        />
        <Button
          onClick={handleAddTask}
          disabled={addTaskMutation.isPending || !newTaskTitle.trim()}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          aria-label="Add task"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );

  const MasterPrioritiesSection = (
    <Card className="bg-gray-800 border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Priorities</h3>
        <button
          draggable
          onDragStart={handleDragStartFor("master-priorities")}
          onKeyDown={handleKeyReorderFor("master-priorities")}
          className="text-gray-400 hover:text-gray-200 p-1 rounded cursor-grab active:cursor-grabbing"
          aria-label="Reorder Priorities section. Use drag or arrow keys."
          tabIndex={0}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 mb-3">
        {isLoadingPriorities ? (
          <div className="text-center py-4 text-gray-400 text-sm">Loading priorities...</div>
        ) : displayPriorities.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">No priorities yet. Add one below!</div>
        ) : (
          displayPriorities.map((priority) => (
            <div
              key={priority.id}
              className="flex items-start gap-2 group hover:bg-gray-750 p-2 rounded transition-colors"
            >
              <button
                onClick={() => handleTogglePriority(priority)}
                className="flex-shrink-0 mt-0.5"
                disabled={updatePriorityMutation.isPending}
                aria-label={
                  priority.status === "completed" ? "Mark as incomplete" : "Mark as complete"
                }
              >
                {priority.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-sm flex-1 min-w-0 ${
                      priority.status === "completed"
                        ? "line-through text-gray-500"
                        : "text-gray-300"
                    }`}
                  >
                    {priority.title}
                  </span>
                  <div className="relative flex-shrink-0" ref={editingPriorityId === priority.id ? dropdownRef : null}>
                    {editingPriorityId === priority.id ? (
                      <div className="absolute top-0 right-0 z-50 bg-gray-800 border border-gray-700 rounded-md shadow-lg min-w-[80px]">
                        <button
                          onClick={() => {
                            handlePriorityChange(priority.id, "low");
                            setEditingPriorityId(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 first:rounded-t-md last:rounded-b-md ${
                            priority.priority === "low" ? "bg-blue-900/40 text-blue-300" : "text-gray-300"
                          }`}
                        >
                          Low
                        </button>
                        <button
                          onClick={() => {
                            handlePriorityChange(priority.id, "medium");
                            setEditingPriorityId(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 ${
                            priority.priority === "medium" ? "bg-yellow-900/40 text-yellow-300" : "text-gray-300"
                          }`}
                        >
                          Medium
                        </button>
                        <button
                          onClick={() => {
                            handlePriorityChange(priority.id, "high");
                            setEditingPriorityId(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-700 ${
                            priority.priority === "high" ? "bg-red-900/40 text-red-300" : "text-gray-300"
                          }`}
                        >
                          High
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPriorityId(priority.id);
                        }}
                        className="focus:outline-none"
                        disabled={updatePriorityMutation.isPending}
                      >
                        <Badge
                          className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                            priority.priority === "high"
                              ? "bg-red-900/40 text-red-300 border-red-700"
                              : priority.priority === "medium"
                              ? "bg-yellow-900/40 text-yellow-300 border-yellow-700"
                              : "bg-blue-900/40 text-blue-300 border-blue-700"
                          }`}
                        >
                          {priority.priority}
                        </Badge>
                      </button>
                    )}
                  </div>
                </div>
                {priority.clientId && (
                  <div className="text-xs text-gray-500">
                    {(priority as any).clientName || `Client: ${priority.clientId.substring(0, 8)}...`}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeletePriority(priority.id)}
                disabled={deletePriorityMutation.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                aria-label="Delete priority"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>
      <div className="space-y-2 border-t border-gray-700 pt-3">
        <Input
          placeholder="Add priority..."
          value={newPriorityTitle}
          onChange={(e) => setNewPriorityTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddPriority()}
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 text-sm w-full"
        />
        <div className="flex gap-2">
          <Select
            value={newPriorityPriority}
            onValueChange={(value) => setNewPriorityPriority(value as "low" | "medium" | "high")}
          >
            <SelectTrigger className="flex-1 bg-gray-900 border-gray-700 text-white text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="low" className="text-white">Low</SelectItem>
              <SelectItem value="medium" className="text-white">Medium</SelectItem>
              <SelectItem value="high" className="text-white">High</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleAddPriority}
            disabled={addPriorityMutation.isPending || !newPriorityTitle.trim()}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 flex-shrink-0 h-9"
            aria-label="Add priority"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Priority
          </Button>
        </div>
      </div>
    </Card>
  );

  const ActivitySection = (
    <Card className="bg-gray-800 border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        <button
          draggable
          onDragStart={handleDragStartFor("activity")}
          onKeyDown={handleKeyReorderFor("activity")}
          className="text-gray-400 hover:text-gray-200 p-1 rounded cursor-grab active:cursor-grabbing"
          aria-label="Reorder Recent Activity section. Use drag or arrow keys."
          tabIndex={0}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {activityFeed.map((item) => {
          const Icon =
            item.type === "email"
              ? Mail
              : item.type === "calendar"
              ? CalendarIcon
              : item.type === "payment"
              ? DollarSign
              : Users;

          return (
            <div key={item.id} className="flex gap-3">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full bg-${item.color}-900/40 flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 text-${item.color}-400`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  {item.title}
                </div>
                <div className="text-xs text-gray-400">{item.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(item.timestamp), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );

  const renderSectionByKey = (key: SidebarSectionKey) => {
    if (key === "quick-stats") return QuickStatsSection;
    if (key === "priorities") return PrioritiesSection;
    if (key === "master-priorities") return MasterPrioritiesSection;
    return ActivitySection;
  };

  return (
    <div className="h-full bg-gray-900 border-l border-gray-800 p-4 space-y-6 overflow-y-auto">
      {sectionOrder.map((key) => (
        <div
          key={key}
          onDragOver={handleDragOver}
          onDrop={handleDropOn(key)}
          className="rounded outline-none"
          tabIndex={0}
          aria-label={`Section ${key}`}
        >
          {renderSectionByKey(key)}
        </div>
      ))}
    </div>
  );
};

export default RightSidebar;


