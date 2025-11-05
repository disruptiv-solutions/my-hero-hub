'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUser, getCredits, logout } from '@/lib/mockAuth';
import { useDrawer } from '@/contexts/DrawerContext';
import { Coins, Menu, X } from 'lucide-react';

export const Header: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isDrawerOpen } = useDrawer();
  const isDashboard = pathname?.startsWith('/dashboard');
  const isSidebarPage = pathname === '/dashboard' || pathname === '/generate' || pathname?.startsWith('/generate/') || pathname === '/gallery' || pathname === '/pricing';
  const hasAlwaysOpenDrawer = pathname === '/generate' || pathname?.startsWith('/generate/');
  const hasRightDrawer = pathname === '/generate' || pathname?.startsWith('/generate/');

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setCredits(getCredits());
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setCredits(0);
  };

  return (
    <header className={`${isSidebarPage ? `fixed top-0 left-64 right-0 z-30 transition-all duration-300` : ''} border-b bg-background/80 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-background/70`}>
      <div className={`container mx-auto ${isSidebarPage ? 'px-6 sm:px-8 lg:px-12' : 'px-4 sm:px-6 lg:px-8'}`}>
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Hidden on sidebar pages since sidebar has branding */}
          {!isSidebarPage && (
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">AI</span>
                </div>
                <span className="font-bold text-xl">AI Maven</span>
              </Link>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex items-center space-x-6 ${isSidebarPage || (!isSidebarPage && user) ? 'ml-auto' : ''}`}>
            {!isSidebarPage && !user && (
              <>
                <Link href="/" className="text-sm font-medium hover:text-primary">
                  Home
                </Link>
                <Link href="/pricing" className="text-sm font-medium hover:text-primary">
                  Pricing
                </Link>
                <Link href="/login" className="text-sm font-medium hover:text-primary">
                  Login
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
            {user && (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/generate" className="text-sm font-medium hover:text-primary">
                  Generate
                </Link>
                <Link href="/gallery" className="text-sm font-medium hover:text-primary">
                  Gallery
                </Link>
                <Link href="/pricing" className="text-sm font-medium hover:text-primary">
                  Pricing
                </Link>
                <div className="flex items-center space-x-2 bg-muted px-3 py-1 rounded-full">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{credits}</span>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4 bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-sm font-medium hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/generate"
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Generate
                  </Link>
                  <Link
                    href="/gallery"
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Gallery
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-full">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{credits} credits</span>
                  </div>
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full" onClick={() => setIsMenuOpen(false)}>Get Started</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
