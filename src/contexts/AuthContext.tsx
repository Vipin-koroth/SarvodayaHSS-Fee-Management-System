import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
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

  const value = {
    user,
    login,
    logout,
    changePassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};