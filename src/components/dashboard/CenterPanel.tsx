"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import {
  Calendar,
  Mail,
  Users,
  DollarSign,
  TrendingUp,
  StickyNote,
  MessageSquare,
} from "lucide-react";
import CalendarView from "./views/CalendarView";
import EmailView from "./views/EmailView";
import ClientsView from "./views/ClientsView";
import FinancialView from "./views/FinancialView";
import MarketingView from "./views/MarketingView";
import NotesView from "./views/NotesView";
import ChatViewWrapper from "./ChatViewWrapper";

const CenterPanel = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="h-full bg-gray-900 p-6 overflow-y-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start mb-6">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Clients</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Financial</span>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            <span>Notes</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          <CalendarView />
        </TabsContent>

        <TabsContent value="email" className="mt-0">
          <EmailView />
        </TabsContent>

        <TabsContent value="clients" className="mt-0">
          <ClientsView />
        </TabsContent>

        <TabsContent value="financial" className="mt-0">
          <FinancialView />
        </TabsContent>

        <TabsContent value="marketing" className="mt-0">
          <MarketingView />
        </TabsContent>

        <TabsContent value="notes" className="mt-0">
          <NotesView />
        </TabsContent>

        <TabsContent value="chat" className="mt-0">
          <ChatViewWrapper />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CenterPanel;


