import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  FileText, 
  Lock,
  School,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'teacher';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'fees', label: 'Fee Configuration', icon: Settings },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'bulk-print', label: 'Bulk Print Bills', icon: FileText },
    { id: 'data-management', label: 'Data Management', icon: Settings },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  const teacherMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'My Students', icon: UserCheck },
    { id: 'payments', label: 'Add Payment', icon: CreditCard },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : teacherMenuItems;

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <School className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Sarvodaya</h1>
            <p className="text-sm text-gray-600">Fee Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Version 1.0</p>
          <p>© 2024 Sarvodaya School</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;