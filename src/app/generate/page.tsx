'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserSidebar } from '@/components/UserSidebar';
import { GenerateDrawer } from '@/components/GenerateDrawer';
import { ImageGrid } from '@/components/ImageGrid';
import { getUser, getCredits } from '@/lib/mockAuth';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function GeneratePage() {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setCredits(getCredits());
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to generate images</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <UserSidebar />

      {/* Always Open Drawer */}
      <div className="fixed left-64 top-16 bottom-0 bg-muted/20 border-l border-r shadow-sm z-20 w-80">
        <GenerateDrawer />
      </div>

      {/* Main Content */}
      <div className="ml-[576px] mr-[220px] min-h-screen pt-16 p-6 bg-background">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Your Generations</h1>
            <p className="text-sm text-muted-foreground">
              View and manage your AI-generated images. You have {credits} credits remaining.
            </p>
          </div>
          <Button className="flex items-center gap-2" size="sm">
            <Plus className="w-4 h-4" />
            Generate New
          </Button>
        </div>

        {/* Gallery */}
        <div className="w-full">
          <ImageGrid />
        </div>
      </div>
    </>
  );
}
