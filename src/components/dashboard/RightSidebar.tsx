"use client";

import { useState } from "react";
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

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  order: number;
}

const RightSidebar = () => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
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

  return (
    <div className="h-full bg-gray-900 border-l border-gray-800 p-4 space-y-6 overflow-y-auto">
      {/* Quick Stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white mb-3">Quick Stats</h3>

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

      {/* Today's Priorities */}
      <Card className="bg-gray-800 border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          Today&apos;s Priorities
        </h3>
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

      {/* Recent Activity Feed */}
      <Card className="bg-gray-800 border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Recent Activity</h3>
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
    </div>
  );
};

export default RightSidebar;


