import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'teacher';
  class?: string;
  division?: string;
}

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const { logout } = useAuth();

  const getUserDisplayName = () => {
    if (user.role === 'admin') {
      return 'Administrator';
    }
    return `Class ${user.class}-${user.division} Teacher`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {getUserDisplayName()}
          </h2>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user.username}</p>
              <p className="text-gray-600 capitalize">{user.role}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;