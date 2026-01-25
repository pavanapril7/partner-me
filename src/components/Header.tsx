'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-8">
        {/* Logo */}
        <Link href="/business-ideas" className="flex items-center space-x-2 group">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm">
                PM
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Partner Me
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                Find Your Business Partner
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            href="/business-ideas"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              isActive('/business-ideas')
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            Business Ideas
          </Link>

          {isAuthenticated && user ? (
            <>
              {user.isAdmin && (
                <>
                  <Link
                    href="/admin/business-ideas"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      isActive('/admin/business-ideas')
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    Manage Ideas
                  </Link>
                  <Link
                    href="/admin/submissions"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      pathname?.startsWith('/admin/submissions')
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    Submissions
                  </Link>
                  <Link
                    href="/admin/partnership-requests"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      isActive('/admin/partnership-requests')
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    Requests
                  </Link>
                </>
              )}
              <div className="flex items-center gap-3 ml-2 pl-2 border-l">
                <span className="text-sm text-muted-foreground">
                  {user.username || user.mobileNumber || user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Link href="/auth-demo">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
