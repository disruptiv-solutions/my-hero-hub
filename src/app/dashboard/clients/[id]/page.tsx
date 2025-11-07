"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Client } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, DollarSign, Mail, Phone, Users } from "lucide-react";
import { format } from "date-fns";

const ClientDetailPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idOrSlug = decodeURIComponent(params.id);

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-detail", idOrSlug],
    queryFn: async (): Promise<{ client: Client }> => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/clients/${encodeURIComponent(idOrSlug)}`, {
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load client");
      }
      return res.json();
    },
  });

  const client = data?.client;

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-400">Loading client...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
          onClick={() => router.push("/dashboard/clients")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="text-red-400">Client not found</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-900/40 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{client.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-gray-700/40 text-gray-300 border-gray-600">
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
        <Button
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
          onClick={() => router.push("/dashboard/clients")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700 p-4 lg:col-span-2">
          <h3 className="text-white font-semibold mb-3">Contact</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Mail className="w-4 h-4" />
              <span>{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center gap-2 text-gray-300">
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
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Calendar className="w-4 h-4" />
                <span>
                  Last contact: {format(new Date(client.lastContact), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
        </Card>
        <Card className="bg-gray-800 border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-3">Details</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div>Created: {format(new Date(client.createdDate), "PPpp")}</div>
            <div>Projects: {client.projectCount ?? 0}</div>
            {Array.isArray(client.events) && client.events.length > 0 && (
              <div>
                <div className="mb-1">Events:</div>
                <div className="flex flex-wrap gap-2">
                  {client.events.map((e) => (
                    <Badge key={e} className="bg-purple-900/40 text-purple-300 border-purple-700">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {client.notes && (
        <Card className="bg-gray-800 border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-3">Notes</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{client.notes}</p>
        </Card>
      )}
    </div>
  );
};

export default ClientDetailPage;


