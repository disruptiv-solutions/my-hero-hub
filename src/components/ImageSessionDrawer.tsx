'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Image } from 'lucide-react';

export const ImageSessionDrawer: React.FC = () => {
  // Mock data for user sessions
  const userSessions = [
    {
      id: 'session-001',
      title: 'Professional Headshots',
      imageCount: 8,
      creditsUsed: 16,
      lastActive: '2 hours ago',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 'session-002',
      title: 'Casual Portraits',
      imageCount: 5,
      creditsUsed: 10,
      lastActive: '1 day ago',
      thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 'session-003',
      title: 'Business Profiles',
      imageCount: 12,
      creditsUsed: 24,
      lastActive: '3 days ago',
      thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 'session-004',
      title: 'Creative Concepts',
      imageCount: 6,
      creditsUsed: 12,
      lastActive: '1 week ago',
      thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 'session-005',
      title: 'Outdoor Sessions',
      imageCount: 4,
      creditsUsed: 8,
      lastActive: '2 weeks ago',
      thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-muted/20 border-l shadow-sm">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-sm font-semibold">Sessions</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {userSessions.length} total sessions
        </p>
      </div>

      {/* Session Cards */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col">
          {userSessions.map((session, index) => (
            <Link key={session.id} href={`/generate/${session.id}`} className={`block ${index > 0 ? 'mt-1' : ''}`}>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={session.thumbnail}
                        alt={session.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{session.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      <span>{session.imageCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="truncate">{session.lastActive}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Total Images:</span>
            <span>{userSessions.reduce((sum, session) => sum + session.imageCount, 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
