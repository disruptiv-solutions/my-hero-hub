"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Palette,
  Save,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/api-helpers";
import { addEmailAccount } from "@/lib/add-email-account";
import { toast } from "@/lib/hooks/use-toast";

interface EmailAccount {
  id: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  isPrimary: boolean;
  addedAt: string;
  label?: string;
}

const ProfilePage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // Fetch email accounts
  const { data: emailAccountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["email-accounts"],
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/email-accounts", { headers });
      if (!res.ok) throw new Error("Failed to fetch email accounts");
      return res.json();
    },
  });

  // Delete email account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/email-accounts?accountId=${accountId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      toast({
        title: "Success",
        description: "Email account removed successfully",
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

  const handleAddEmailAccount = async () => {
    try {
      setIsAddingEmail(true);
      await addEmailAccount();
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      toast({
        title: "Success",
        description: "Email account added successfully",
      });
    } catch (error: any) {
      // Provide user-friendly error messages
      let errorMessage = error.message || "Failed to add email account";
      
      if (error.message?.includes('popup') || error.message?.includes('blocked')) {
        errorMessage = "Popup was blocked. Please allow popups for this site and try again.";
      } else if (error.message?.includes('cancelled')) {
        errorMessage = "Sign-in was cancelled.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingEmail(false);
    }
  };

  // Mock profile data
  const [profile, setProfile] = useState({
    name: "Demo User",
    email: "demo@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    bio: "Business owner and entrepreneur focused on growth and innovation.",
    company: "Demo Company",
    role: "CEO & Founder",
    joinDate: "January 2024",
    timezone: "Pacific Standard Time (PST)",
    language: "English",
    notifications: {
      email: true,
      push: true,
      calendar: true,
      marketing: false,
    },
    preferences: {
      theme: "dark",
      autoRefresh: true,
      compactMode: false,
    },
  });

  const handleSave = () => {
    // In a real app, this would save to the backend
    setIsEditing(false);
    console.log("Profile saved:", profile);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (section: string, field: string, value: boolean) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card className="bg-gray-800 border-gray-700 p-6">
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
                  alt="Profile"
                  className="w-24 h-24 rounded-full mx-auto border-4 border-gray-600"
                />
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <User className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-white">{profile.name}</h2>
                <p className="text-gray-400">{profile.role}</p>
                <p className="text-sm text-gray-500">{profile.company}</p>
              </div>

              <div className="space-y-2">
                <Badge className="bg-green-900/40 text-green-400 border-green-700">
                  Active
                </Badge>
                <p className="text-xs text-gray-500">
                  Member since {profile.joinDate}
                </p>
              </div>
            </div>
          </Card>

          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-gray-300">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-900 border-gray-700 text-white"
                    rows={3}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </Card>

            {/* Email Accounts */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Accounts
                </h3>
                <Button
                  onClick={handleAddEmailAccount}
                  disabled={isAddingEmail}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isAddingEmail ? "Adding..." : "Add Account"}
                </Button>
              </div>

              <div className="space-y-3">
                {isLoadingAccounts ? (
                  <div className="text-gray-400 text-sm">Loading accounts...</div>
                ) : emailAccountsData?.accounts?.length > 0 ? (
                  emailAccountsData.accounts.map((account: EmailAccount) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium truncate">
                              {account.label || account.email}
                            </p>
                            {account.isPrimary && (
                              <Badge className="bg-blue-900/40 text-blue-400 border-blue-700 text-xs">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">{account.email}</p>
                          {account.expiresAt && new Date(account.expiresAt) < new Date() && (
                            <p className="text-xs text-yellow-400 mt-1">Token expired</p>
                          )}
                        </div>
                      </div>
                      {!account.isPrimary && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAccountMutation.mutate(account.id)}
                          disabled={deleteAccountMutation.isPending}
                          className="bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No email accounts connected</p>
                    <p className="text-xs mt-1">Add an account to view emails from multiple inboxes</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Account Settings */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" />
                Account Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Timezone</p>
                    <p className="text-sm text-gray-400">{profile.timezone}</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-gray-900 border-gray-700 text-white">
                    Change
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Language</p>
                    <p className="text-sm text-gray-400">{profile.language}</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-gray-900 border-gray-700 text-white">
                    Change
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Password</p>
                    <p className="text-sm text-gray-400">Last changed 3 months ago</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-gray-900 border-gray-700 text-white">
                    Change
                  </Button>
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5" />
                Notifications
              </h3>

              <div className="space-y-4">
                {Object.entries(profile.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium capitalize">{key} Notifications</p>
                      <p className="text-sm text-gray-400">
                        {key === "email" && "Receive email notifications"}
                        {key === "push" && "Receive push notifications"}
                        {key === "calendar" && "Calendar reminders and updates"}
                        {key === "marketing" && "Marketing updates and promotions"}
                      </p>
                    </div>
                    <Button
                      variant={value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleNestedInputChange("notifications", key, !value)}
                      className={value 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-gray-900 border-gray-700 text-white"
                      }
                    >
                      {value ? "On" : "Off"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Preferences */}
            <Card className="bg-gray-800 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5" />
                Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Theme</p>
                    <p className="text-sm text-gray-400">Dark mode (recommended for extended use)</p>
                  </div>
                  <Badge className="bg-gray-700 text-gray-300">
                    {profile.preferences.theme}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Auto Refresh</p>
                    <p className="text-sm text-gray-400">Automatically update data every 2-5 minutes</p>
                  </div>
                  <Button
                    variant={profile.preferences.autoRefresh ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleNestedInputChange("preferences", "autoRefresh", !profile.preferences.autoRefresh)}
                    className={profile.preferences.autoRefresh 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-gray-900 border-gray-700 text-white"
                    }
                  >
                    {profile.preferences.autoRefresh ? "On" : "Off"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Compact Mode</p>
                    <p className="text-sm text-gray-400">Use smaller spacing for more content</p>
                  </div>
                  <Button
                    variant={profile.preferences.compactMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleNestedInputChange("preferences", "compactMode", !profile.preferences.compactMode)}
                    className={profile.preferences.compactMode 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-gray-900 border-gray-700 text-white"
                    }
                  >
                    {profile.preferences.compactMode ? "On" : "Off"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-gray-800 border-red-700 p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Delete Account</p>
                    <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-red-900 border-red-700 text-red-400 hover:bg-red-800">
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ProfilePage;
