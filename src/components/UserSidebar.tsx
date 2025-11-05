'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUser, getCredits, logout } from '@/lib/mockAuth';
import {
  LayoutDashboard,
  Sparkles,
  Image,
  CreditCard,
  Settings,
  LogOut,
  User,
  Coins
} from 'lucide-react';

interface SidebarItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/generate', icon: Sparkles, label: 'Generate' },
  { href: '/gallery', icon: Image, label: 'Gallery' },
  { href: '/pricing', icon: CreditCard, label: 'Pricing' },
];

export const UserSidebar: React.FC = () => {
  const pathname = usePathname();
  const user = getUser();
  const credits = getCredits();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="fixed left-0 top-0 w-64 bg-muted/50 border-r h-screen p-6 flex flex-col z-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">AI</span>
          </div>
          <span className="font-bold text-xl text-foreground">AI Maven</span>
        </Link>
      </div>

      {/* User Profile Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.email || 'User'}</p>
              <p className="text-sm text-muted-foreground">Free Account</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-medium">{credits}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <nav>
        {sidebarItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} className={index > 0 ? 'block mt-3' : 'block'}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  isActive ? 'bg-secondary' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Spacer to push bottom section to bottom */}
      <div className="flex-1"></div>

      {/* Bottom Section */}
      <div className="mt-6">
        <Link href="/settings" className="block">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </Link>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive mt-3"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
