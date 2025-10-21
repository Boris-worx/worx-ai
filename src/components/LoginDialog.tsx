import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
import { Shield, Mail, RefreshCw, User } from 'lucide-react';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginDialog = ({ open, onOpenChange }: LoginDialogProps) => {
  const { login, isAuthenticated, user, isLoadingAuth, refreshAzureAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate slight delay for better UX
    setTimeout(() => {
      const success = login(username, password);
      
      if (!success) {
        setError('Invalid username or password');
        setPassword('');
      } else {
        // Close dialog on successful login
        onOpenChange(false);
        setUsername('');
        setPassword('');
      }
      
      setIsLoading(false);
    }, 300);
  };

  const handleRefreshAuth = async () => {
    setIsRefreshing(true);
    await refreshAzureAuth();
    setIsRefreshing(false);
  };

  // Show loading state while checking Azure auth
  if (isLoadingAuth) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-[425px]" 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center">Authentication</DialogTitle>
            <DialogDescription className="text-center">
              Checking authentication status
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-[#1D6BCD] mb-4" />
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show login form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">BFS Authentication</DialogTitle>
          <DialogDescription className="text-center">
            Please login to access the Transaction and Data Management system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            style={{
              backgroundColor: '#1D6BCD',
              color: 'white',
            }}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>

          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-xs mb-2">Test Credentials (Development Only):</p>
            <div className="text-xs space-y-1">
              <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>Viewer:</strong> viewer / view123</p>
              <p><strong>Editor:</strong> editor / edit123</p>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};