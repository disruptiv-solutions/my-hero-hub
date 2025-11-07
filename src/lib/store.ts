import { create } from "zustand";
import { Task, ActivityItem } from "@/types";

interface AppState {
  tasks: Task[];
  activityFeed: ActivityItem[];
  selectedCalendarIds: string[];
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  addActivity: (activity: Omit<ActivityItem, "id">) => void;
  toggleCalendar: (calendarId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  tasks: [
    {
      id: "1",
      title: "Review client proposals",
      completed: false,
      priority: "high",
      order: 0,
    },
    {
      id: "2",
      title: "Follow up with Tech Innovations",
      completed: false,
      priority: "medium",
      order: 1,
    },
    {
      id: "3",
      title: "Prepare marketing report",
      completed: false,
      priority: "medium",
      order: 2,
    },
  ],
  activityFeed: [
    {
      id: "1",
      type: "email",
      title: "New email from Acme Corporation",
      description: "Monthly project update",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      color: "blue",
    },
    {
      id: "2",
      type: "calendar",
      title: "Meeting reminder",
      description: "Team sync in 30 minutes",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      color: "green",
    },
    {
      id: "3",
      type: "payment",
      title: "Payment received",
      description: "$5,000 from Acme Corporation",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      color: "emerald",
    },
  ],
  selectedCalendarIds: [],
  addTask: (task) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        { ...task, id: Date.now().toString(), order: state.tasks.length },
      ],
    })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  reorderTasks: (tasks) => set({ tasks }),
  addActivity: (activity) =>
    set((state) => ({
      activityFeed: [
        { ...activity, id: Date.now().toString() },
        ...state.activityFeed,
      ].slice(0, 20),
    })),
  toggleCalendar: (calendarId) =>
    set((state) => ({
      selectedCalendarIds: state.selectedCalendarIds.includes(calendarId)
        ? state.selectedCalendarIds.filter((id) => id !== calendarId)
        : [...state.selectedCalendarIds, calendarId],
    })),
}));


