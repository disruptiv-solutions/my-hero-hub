"use client";

import { useState, useEffect } from "react";
import ChatView from "./views/ChatView";
import { useAppStore } from "@/lib/store";

// This wrapper manages the conversation ID state
export default function ChatViewWrapper() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { activeTab } = useAppStore();

  // Reset conversation when switching away from chat tab
  useEffect(() => {
    if (activeTab !== "chat") {
      setConversationId(null);
    }
  }, [activeTab]);

  // Listen for conversation selection from sidebar
  useEffect(() => {
    const handleConversationSelect = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>;
      setConversationId(customEvent.detail);
    };

    window.addEventListener("conversation-select", handleConversationSelect);
    return () => {
      window.removeEventListener("conversation-select", handleConversationSelect);
    };
  }, []);

  const handleConversationChange = (id: string | null) => {
    setConversationId(id);
    // Also dispatch event so sidebar can update
    window.dispatchEvent(new CustomEvent("conversation-select", { detail: id }));
  };

  return <ChatView conversationId={conversationId} onConversationChange={handleConversationChange} />;
}

