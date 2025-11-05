"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/firebase-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import LeftSidebar from "@/components/dashboard/LeftSidebar";
import CenterPanel from "@/components/dashboard/CenterPanel";
import RightSidebar from "@/components/dashboard/RightSidebar";

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const session = {
    user: {
      name: user.displayName || "User",
      email: user.email || "",
      image: user.photoURL || undefined,
    }
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push("/auth/signin");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Hero Hub</h1>
              <p className="text-xs text-gray-400">Your Business Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-4 hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors group"
            >
              <div className="text-right">
                <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                  {session.user?.name}
                </div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                  {session.user?.email}
                </div>
              </div>
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-10 h-10 rounded-full ring-2 ring-transparent group-hover:ring-blue-500 transition-all"
                />
              )}
            </button>
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="outline"
              size="sm"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - 20% */}
        <div className="w-[20%] min-w-[280px] max-w-[350px]">
          <LeftSidebar />
        </div>

        {/* Center Panel - 55% */}
        <div className="flex-1">
          <CenterPanel />
        </div>

        {/* Right Sidebar - 25% */}
        <div className="w-[25%] min-w-[300px] max-w-[400px]">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
