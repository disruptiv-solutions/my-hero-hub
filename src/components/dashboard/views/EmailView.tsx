"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Email } from "@/types";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Star, Archive, Inbox } from "lucide-react";

const EmailView = () => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["gmail-messages"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/gmail/messages?maxResults=50", { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 && errorData.code === "GOOGLE_NOT_CONNECTED") {
          throw new Error("Google not connected. Please sign out and sign in again.");
        }
        throw new Error(errorData.error || "Failed to fetch emails");
      }
      return res.json();
    },
    refetchInterval: 2 * 60 * 1000,
    retry: false,
  });

  const getEmailBody = (email: Email) => {
    const parts = email.payload.parts || [];
    const textPart = parts.find((part) => part.mimeType === "text/plain");
    const bodyData = textPart?.body?.data || email.payload.body?.data;

    if (!bodyData) return email.snippet;

    try {
      return atob(bodyData.replace(/-/g, "+").replace(/_/g, "/"));
    } catch {
      return email.snippet;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading emails...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-yellow-400 text-lg font-semibold">
          {error.message || "Failed to load emails"}
        </div>
        <div className="text-gray-400 text-sm text-center max-w-md">
          Please sign out and sign in again to connect your Gmail account.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Inbox</h2>
        <div className="text-sm text-gray-400">
          {data?.emails?.length || 0} messages
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Email List */}
        <Card className="bg-gray-800 border-gray-700 p-4 h-[calc(100vh-250px)] overflow-y-auto">
          <div className="space-y-2">
            {data?.emails?.map((email: Email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedEmail?.id === email.id
                    ? "bg-gray-700 border-l-4 border-blue-500"
                    : "bg-gray-900 hover:bg-gray-750"
                } ${email.isUnread ? "border-l-2 border-yellow-500" : ""}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Mail
                      className={`w-4 h-4 flex-shrink-0 ${
                        email.isUnread ? "text-blue-400" : "text-gray-400"
                      }`}
                    />
                    <div className="font-medium text-white truncate text-sm">
                      {email.from?.split("<")[0].trim() || email.from}
                    </div>
                  </div>
                  {email.isStarred && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  )}
                </div>
                <div className="text-sm font-medium text-gray-300 truncate mb-1">
                  {email.subject}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {email.snippet}
                </div>
                {email.accountEmail && (
                  <div className="text-xs text-blue-400 mb-1">
                    {email.accountEmail}
                  </div>
                )}
                <div className="text-xs text-gray-600 mt-1">
                  {email.internalDate &&
                    format(new Date(parseInt(email.internalDate)), "MMM d, h:mm a")}
                </div>
              </div>
            ))}
            {(!data?.emails || data.emails.length === 0) && (
              <div className="text-center text-gray-500 py-8">
                <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <div>No emails found</div>
              </div>
            )}
          </div>
        </Card>

        {/* Email Preview */}
        <Card className="bg-gray-800 border-gray-700 p-4 h-[calc(100vh-250px)] overflow-y-auto">
          {selectedEmail ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedEmail.subject}
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" aria-label="Star email">
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" aria-label="Archive email">
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  From: {selectedEmail.from}
                </div>
                <div className="text-sm text-gray-400">
                  To: {selectedEmail.to}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedEmail.internalDate &&
                    format(
                      new Date(parseInt(selectedEmail.internalDate)),
                      "MMMM d, yyyy 'at' h:mm a"
                    )}
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4">
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {getEmailBody(selectedEmail).slice(0, 2000)}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <div>Select an email to read</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmailView;


