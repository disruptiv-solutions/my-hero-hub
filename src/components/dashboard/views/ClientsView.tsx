"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Client } from "@/types";
import { getAuthHeaders } from "@/lib/api-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ClientsView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["clients", statusFilter],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const res = await fetch(`/api/clients?${params.toString()}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const filteredClients = data?.clients?.filter((client: Client) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-900/40 text-green-400 border-green-700";
      case "lead":
        return "bg-yellow-900/40 text-yellow-400 border-yellow-700";
      case "closed":
        return "bg-gray-700/40 text-gray-400 border-gray-600";
      default:
        return "bg-gray-700/40 text-gray-400 border-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Clients</h2>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          {["all", "lead", "active", "closed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className={`capitalize ${
                statusFilter === status
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients?.map((client: Client) => (
          <Card
            key={client.id}
            className="bg-gray-800 border-gray-700 p-4 hover:bg-gray-750 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{client.name}</h3>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-gray-400">
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
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Last contact:{" "}
                    {format(new Date(client.lastContact), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {client.notes && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 line-clamp-2">
                  {client.notes}
                </p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                View Details
              </Button>
              <Button size="sm" variant="outline">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {(!filteredClients || filteredClients.length === 0) && (
        <div className="text-center text-gray-500 py-12">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <div className="text-lg mb-2">No clients found</div>
          <p className="text-sm">
            {searchQuery
              ? "Try adjusting your search or filters"
              : "Add your first client to get started"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientsView;


