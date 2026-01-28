'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  /**
   * Handle logout with redirect to home page
   * Requirements: 4.5, 6.3
   */
  const handleLogout = async () => {
    await logout();
    // Redirect to home page after logout
    router.push('/');
  };

  const isActive = (path: string) => pathname === path;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-primary to-secondary text-primary-foreground px-3 py-1.5 rounded-lg font-bold text-sm shadow-md">
                PM
              </div>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                Partner Me
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                Find Your Business Partner
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/business-ideas"
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
              isActive('/business-ideas')
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
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
                      'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                      isActive('/admin/business-ideas')
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    Manage Ideas
                  </Link>
                  <Link
                    href="/admin/submissions"
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                      pathname?.startsWith('/admin/submissions')
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    Submissions
                  </Link>
                  <Link
                    href="/admin/partnership-requests"
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                      isActive('/admin/partnership-requests')
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    Requests
                  </Link>
                </>
              )}
              <div className="flex items-center gap-3 ml-2 pl-4 border-l relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/50 transition-all duration-200"
                >
                  <span className="text-muted-foreground">
                    {user.username || user.mobileNumber || user.email}
                  </span>
                  <svg
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      userMenuOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-background border rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={() => {
                        handleLogout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-accent/50 transition-colors text-destructive hover:text-destructive"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : isLoading ? (
            <div className="flex items-center gap-2 ml-2">
              <div className="h-9 w-20 bg-accent/50 animate-pulse rounded-md"></div>
              <div className="h-9 w-20 bg-accent/50 animate-pulse rounded-md"></div>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-accent/50 transition-all duration-200"
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Register
                </Button>
              </Link>
            </div>
          )}
          
          {/* Theme Toggle */}
          <div className="ml-2 pl-2 border-l">
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-md hover:bg-accent/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container px-4 py-4 flex flex-col gap-2">
            <Link
              href="/business-ideas"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-4 py-3 text-sm font-medium rounded-md transition-all duration-200',
                isActive('/business-ideas')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
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
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'px-4 py-3 text-sm font-medium rounded-md transition-all duration-200',
                        isActive('/admin/business-ideas')
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                    >
                      Manage Ideas
                    </Link>
                    <Link
                      href="/admin/submissions"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'px-4 py-3 text-sm font-medium rounded-md transition-all duration-200',
                        pathname?.startsWith('/admin/submissions')
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                    >
                      Submissions
                    </Link>
                    <Link
                      href="/admin/partnership-requests"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'px-4 py-3 text-sm font-medium rounded-md transition-all duration-200',
                        isActive('/admin/partnership-requests')
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      )}
                    >
                      Requests
                    </Link>
                  </>
                )}
                <div className="flex flex-col gap-2 pt-2 mt-2 border-t">
                  <span className="px-4 text-sm text-muted-foreground">
                    {user.username || user.mobileNumber || user.email}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : isLoading ? (
              <div className="flex flex-col gap-2">
                <div className="h-10 bg-accent/50 animate-pulse rounded-md"></div>
                <div className="h-10 bg-accent/50 animate-pulse rounded-md"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full hover:bg-accent/50 transition-all duration-200"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant="default" 
                    size="sm"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
