'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserSidebar } from '@/components/UserSidebar';
import { GenerateDrawer } from '@/components/GenerateDrawer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2, Trash2 } from 'lucide-react';
import { getUser, getCredits } from '@/lib/mockAuth';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const sessionId = params.sessionId as string;

  // Mock session data - in a real app, this would be fetched based on sessionId
  const sessionImages = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      prompt: 'Professional headshot with studio lighting',
      model: 'FLUX.1 Pro',
      timestamp: '2 hours ago',
      credits: 2
    },
    {
      id: '2', 
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
      prompt: 'Casual portrait with natural lighting',
      model: 'FLUX.1 Schnell',
      timestamp: '2 hours ago',
      credits: 1
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      prompt: 'Business casual outdoor setting',
      model: 'FLUX.1 Pro',
      timestamp: '2 hours ago',
      credits: 2
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
      prompt: 'Creative artistic portrait',
      model: 'FLUX.1 Dev',
      timestamp: '2 hours ago',
      credits: 3
    }
  ];

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
          <p>Loading...</p>
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
        {/* Back Button */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/generate')}
            className="flex items-center gap-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Generate
          </Button>
        </div>

        {/* Session Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Session: {sessionId}</h1>
              <p className="text-sm text-muted-foreground">
                {sessionImages.length} images generated in this session
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share Session
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Session
              </Button>
            </div>
          </div>
        </div>

        {/* Session Images Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sessionImages.map((img) => (
            <div key={img.id} className="bg-card rounded-lg border overflow-hidden">
              <div className="aspect-square">
                <img
                  src={img.image}
                  alt={img.prompt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium mb-2 line-clamp-2">{img.prompt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{img.model}</span>
                  <span>{img.credits} credit{img.credits !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Reuse
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
