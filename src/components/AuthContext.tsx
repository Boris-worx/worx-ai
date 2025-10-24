import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAzureAuthData, isAzureAuthEnabled } from '../lib/azure-auth';

export type UserRole = 'admin' | 'view' | 'edit';
export type AccessSection = 'Tenants' | 'Transactions' | 'Data Plane';
export type AccessLevel = 'All' | AccessSection[];

interface User {
  username: string;
  role: UserRole;
  access: AccessLevel;
  email?: string;
  name?: string;
  azureRole?: string;
  isAzureAuth?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  refreshAzureAuth: () => Promise<void>;
  hasAccessTo: (section: AccessSection) => boolean;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock credentials for testing
const MOCK_USERS: Record<string, { password: string; role: UserRole; access: AccessLevel }> = {
  admin: { password: 'admin123', role: 'admin', access: 'All' },
  viewer: { password: 'view123', role: 'view', access: 'All' },
  editor: { password: 'edit123', role: 'edit', access: 'All' },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAzureLogout, setIsAzureLogout] = useState(false);

  // Check for Azure AD authentication first, then fallback to stored session
  useEffect(() => {
    const initAuth = async () => {
      setIsLoadingAuth(true);
      
      // Check if user is in test mode (testing different roles)
      const testRole = localStorage.getItem('bfs_test_role');
      const storedUser = localStorage.getItem('bfs_user');
      
      if (testRole && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Use the test role instead of real Azure role
          if (parsedUser.isAzureAuth) {
            console.log('Using test role:', testRole);
            setUser(parsedUser);
            setIsLoadingAuth(false);
            return;
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
        }
      }
      
      // Try Azure AD authentication first
      try {
        const azureUser = await fetchAzureAuthData();
        
        if (azureUser) {
          const authenticatedUser: User = {
            username: azureUser.email.split('@')[0], // Use email prefix as username
            email: azureUser.email,
            name: azureUser.name,
            role: azureUser.role,
            azureRole: azureUser.azureRole,
            isAzureAuth: true,
            access: azureUser.access,
          };
          setUser(authenticatedUser);
          localStorage.setItem('bfs_user', JSON.stringify(authenticatedUser));
          setIsLoadingAuth(false);
          return;
        }
      } catch (error) {
        console.error('Azure auth failed:', error);
      }
      
      // Fallback to local authentication for development
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // If it's an Azure user but we couldn't refresh, clear it
          if (parsedUser.isAzureAuth && !testRole) {
            localStorage.removeItem('bfs_user');
          } else {
            // Migrate old users without access field
            if (!parsedUser.access) {
              parsedUser.access = 'All';
            }
            setUser(parsedUser);
            setIsLoadingAuth(false);
            return;
          }
        } catch (error) {
          localStorage.removeItem('bfs_user');
        }
      }
      
      // Default: Create guest user with viewer role
      const guestUser: User = {
        username: 'guest',
        role: 'view',
        isAzureAuth: false,
        access: 'All', // Assuming guest users have full access
      };
      setUser(guestUser);
      setIsLoadingAuth(false);
    };

    initAuth();
  }, []);

  const refreshAzureAuth = async () => {
    const azureUser = await fetchAzureAuthData();
    
    if (azureUser) {
      const authenticatedUser: User = {
        username: azureUser.email.split('@')[0],
        email: azureUser.email,
        name: azureUser.name,
        role: azureUser.role,
        azureRole: azureUser.azureRole,
        isAzureAuth: true,
        access: azureUser.access, // Assuming Azure users have full access
      };
      setUser(authenticatedUser);
      localStorage.setItem('bfs_user', JSON.stringify(authenticatedUser));
    }
  };

  const login = (username: string, password: string): boolean => {
    const userCredentials = MOCK_USERS[username];
    
    if (userCredentials && userCredentials.password === password) {
      const loggedInUser: User = { 
        username, 
        role: userCredentials.role,
        isAzureAuth: false,
        access: userCredentials.access,
      };
      setUser(loggedInUser);
      localStorage.setItem('bfs_user', JSON.stringify(loggedInUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bfs_user');
    
    // If Azure auth, redirect to logout endpoint
    if (user?.isAzureAuth && isAzureAuthEnabled()) {
      window.location.href = '/.auth/logout';
    }
  };

  const hasAccessTo = (section: AccessSection): boolean => {
    // If no access defined, give full access (backward compatibility)
    if (!user?.access) {
      return true;
    }
    
    if (user.access === 'All') {
      return true;
    }
    
    if (Array.isArray(user.access)) {
      return user.access.includes(section);
    }
    
    return false;
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('bfs_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoadingAuth,
        refreshAzureAuth,
        hasAccessTo,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};