import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import TeacherStats from './TeacherStats';
import ClassStudents from './ClassStudents';
import ClassPayments from './ClassPayments';
import ChangePassword from '../common/ChangePassword';

const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TeacherStats />;
      case 'students':
        return <ClassStudents />;
      case 'payments':
        return <ClassPayments />;
      case 'password':
        return <ChangePassword />;
      default:
        return <TeacherStats />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole="teacher" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user!} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;