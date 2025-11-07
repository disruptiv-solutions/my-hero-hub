"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { toast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ConversationsSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export default function ConversationsSidebar({
  activeConversationId,
  onSelectConversation,
}: ConversationsSidebarProps) {
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/conversations", { headers });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
  });

  // Create new conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Conversation",
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create conversation");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onSelectConversation(data.conversation.id);
      toast({
        title: "Success",
        description: "New conversation created",
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

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete conversation");
      }
      return res.json();
    },
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (activeConversationId === conversationId) {
        onSelectConversation(null);
      }
      toast({
        title: "Success",
        description: "Conversation deleted",
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

  const conversations: Conversation[] = conversationsData?.conversations || [];

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversationMutation.mutate(conversationId);
    }
  };

  return (
    <div className="h-full bg-gray-900 border-l border-gray-800 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Conversations</h3>
        <Button
          onClick={handleNewConversation}
          disabled={createConversationMutation.isPending}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-2"
          aria-label="New conversation"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : conversations.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className={`bg-gray-800 border-gray-700 p-3 cursor-pointer transition-colors group ${
                activeConversationId === conversation.id
                  ? "bg-blue-900/30 border-blue-600"
                  : "hover:bg-gray-750"
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-white truncate">
                      {conversation.title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {conversation.messageCount} message{conversation.messageCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(conversation.updatedAt), "MMM d, h:mm a")}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, conversation.id)}
                  disabled={deleteConversationMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}




