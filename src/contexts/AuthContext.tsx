import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'teacher';
  class?: string;
  division?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  resetUserPassword: (username: string, newPassword: string) => Promise<boolean>;
  getAllUsers: () => Array<{ username: string; role: 'admin' | 'teacher'; class?: string; division?: string }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // User is authenticated, set user data
        const userData: User = {
          id: session.user.id,
          username: session.user.email?.split('@')[0] || 'user',
          role: session.user.user_metadata?.role || 'admin'
        };
        setUser(userData);
      } else {
        // Check localStorage for fallback
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            role: session.user.user_metadata?.role || 'admin'
          };
          setUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem('currentUser');
        }
      }
    );

    // Auto logout when window/tab is closed
    const handleBeforeUnload = () => {
      localStorage.removeItem('currentUser');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Optional: Also logout when tab becomes hidden (user switches tabs)
        // Uncomment the line below if you want this behavior
        // localStorage.removeItem('currentUser');
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Try Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@sarvodaya.school`,
        password: password
      });

      if (data.user && !error) {
        return true;
      }
    } catch (error) {
      console.log('Supabase auth failed, falling back to localStorage');
    }

    // Get stored users or use defaults
    const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Initialize default users if not exists
    if (!storedUsers.admin) {
      const defaultUsers: Record<string, { password: string; role: 'admin' | 'teacher'; class?: string; division?: string }> = {
        admin: { password: 'admin', role: 'admin' }
      };

      // Generate class teacher accounts
      for (let classNum = 1; classNum <= 12; classNum++) {
        for (let division of ['a', 'b', 'c', 'd', 'e']) {
          const teacherUsername = `class${classNum}${division}`;
          defaultUsers[teacherUsername] = {
            password: 'admin',
            role: 'teacher',
            class: classNum.toString(),
            division: division.toUpperCase()
          };
        }
      }

      localStorage.setItem('users', JSON.stringify(defaultUsers));
      Object.assign(storedUsers, defaultUsers);
    }

    const userAccount = storedUsers[username];
    if (userAccount && userAccount.password === password) {
      const userData: User = {
        id: username,
        username,
        role: userAccount.role,
        class: userAccount.class,
        division: userAccount.division
      };
      
      setUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;

    const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
    const userAccount = storedUsers[user.username];

    if (userAccount && userAccount.password === oldPassword) {
      userAccount.password = newPassword;
      localStorage.setItem('users', JSON.stringify(storedUsers));
      return true;
    }

    return false;
  };

  const resetUserPassword = async (username: string, newPassword: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') return false;

    const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
    const targetUser = storedUsers[username];

    if (targetUser) {
      targetUser.password = newPassword;
      localStorage.setItem('users', JSON.stringify(storedUsers));
      return true;
    }

    return false;
  };

  const getAllUsers = () => {
    if (!user || user.role !== 'admin') return [];

    const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
    return Object.entries(storedUsers).map(([username, userData]: [string, any]) => ({
      username,
      role: userData.role,
      class: userData.class,
      division: userData.division
    }));
  };

  const value = {
    user,
    login,
    logout,
    changePassword,
    resetUserPassword,
    getAllUsers,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};