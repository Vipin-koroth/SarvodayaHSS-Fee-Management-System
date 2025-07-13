import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import DashboardStats from './DashboardStats';
import StudentManagement from './StudentManagement';
import PaymentManagement from './PaymentManagement';
import FeeConfiguration from './FeeConfiguration';
import Reports from './Reports';
import ChangePassword from '../common/ChangePassword';
import BulkPrintBills from './BulkPrintBills';
import DataManagement from './DataManagement';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  const { students, payments } = useData();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats />;
      case 'students':
        return <StudentManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'fees':
        return <FeeConfiguration />;
      case 'reports':
        return <Reports />;
      case 'bulk-print':
        return <BulkPrintBills />;
      case 'data-management':
        return <DataManagement />;
      case 'password':
        return <ChangePassword />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole="admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user!} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;