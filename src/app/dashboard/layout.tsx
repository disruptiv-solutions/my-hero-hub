"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/firebase-auth";
import { Button } from "@/components/ui/button";
import LeftSidebar from "@/components/dashboard/LeftSidebar";
import CenterPanel from "@/components/dashboard/CenterPanel";
import RightSidebar from "@/components/dashboard/RightSidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
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
    },
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
    <div className="flex h-screen flex-col bg-gray-900">
      <header className="border-b border-gray-700 bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-xl font-bold text-white">H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Hero Hub</h1>
              <p className="text-xs text-gray-400">
                Your Business Command Center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileClick}
              className="group flex items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:bg-gray-700"
              aria-label="Open profile"
            >
              <div className="text-right">
                <div className="text-sm font-medium text-white transition-colors group-hover:text-blue-400">
                  {session.user?.name}
                </div>
                <div className="text-xs text-gray-400 transition-colors group-hover:text-gray-300">
                  {session.user?.email}
                </div>
              </div>
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-10 w-10 rounded-full ring-2 ring-transparent transition-all group-hover:ring-blue-500"
                />
              )}
            </button>
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="outline"
              size="sm"
              className="border-gray-600 bg-gray-700 text-white transition-colors hover:bg-gray-600 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="min-w-[280px] max-w-[350px] w-[20%]">
          <LeftSidebar />
        </div>
        <div className="flex-1">
          <CenterPanel>{children}</CenterPanel>
        </div>
        <div className="min-w-[300px] max-w-[400px] w-[25%]">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

