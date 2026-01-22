'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function DebugAuthPage() {
  const { user, session, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth-demo');
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Authentication Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Authentication Status</h3>
            <p>Is Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p>Is Loading: {isLoading ? 'Yes' : 'No'}</p>
          </div>

          {user && (
            <div>
              <h3 className="font-semibold mb-2">User Information</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(user, null, 2)}
              </pre>
              <div className="mt-2">
                <p className="text-lg">
                  <strong>Is Admin:</strong>{' '}
                  {user.isAdmin ? (
                    <span className="text-green-600 font-bold">✅ YES</span>
                  ) : (
                    <span className="text-red-600 font-bold">❌ NO</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {session && (
            <div>
              <h3 className="font-semibold mb-2">Session Information</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
                {JSON.stringify(
                  {
                    id: session.id,
                    userId: session.userId,
                    expiresAt: session.expiresAt,
                    createdAt: session.createdAt,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {!isAuthenticated && (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                You are not logged in.
              </p>
              <Button onClick={() => router.push('/auth-demo')}>
                Go to Login
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {isAuthenticated && (
              <>
                <Button onClick={handleLogout} variant="destructive">
                  Logout
                </Button>
                {user?.isAdmin && (
                  <>
                    <Button
                      onClick={() => router.push('/admin/business-ideas')}
                      variant="default"
                    >
                      Admin: Business Ideas
                    </Button>
                    <Button
                      onClick={() => router.push('/admin/partnership-requests')}
                      variant="default"
                    >
                      Admin: Requests
                    </Button>
                  </>
                )}
              </>
            )}
            <Button onClick={clearLocalStorage} variant="outline">
              Clear LocalStorage & Reload
            </Button>
          </div>

          <div className="text-sm text-muted-foreground pt-4 border-t">
            <p className="font-semibold mb-2">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>If isAdmin shows NO but you are an admin, click "Logout" and log back in</li>
              <li>Or click "Clear LocalStorage & Reload" to force a fresh session</li>
              <li>Make sure your user has isAdmin=true in the database</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
