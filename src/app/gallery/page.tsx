'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageGrid } from '@/components/ImageGrid';
import { UserSidebar } from '@/components/UserSidebar';
import { getUser } from '@/lib/mockAuth';

export default function GalleryPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your gallery</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <div className="ml-64 min-h-screen pt-16 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Gallery</h1>
          <p className="text-muted-foreground">
            All your AI-generated images in one place
          </p>
        </div>

        <ImageGrid />
      </div>
    </>
  );
}
