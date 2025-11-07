"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ChatView from "./views/ChatView";

// This wrapper manages the conversation ID state
export default function ChatViewWrapper() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/dashboard/chat")) {
      setConversationId(null);
    }
  }, [pathname]);

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

  return (
    <ChatView
      conversationId={conversationId}
      onConversationChange={handleConversationChange}
    />
  );
}

