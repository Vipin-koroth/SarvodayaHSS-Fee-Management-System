import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  mobile: string;
  class: string;
  division: string;
  busStop: string;
  busNumber: string;
  tripNumber: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  developmentFee: number;
  busFee: number;
  specialFee: number;
  specialFeeType: string;
  totalAmount: number;
  paymentDate: string;
  addedBy: string;
  class: string;
  division: string;
}

export interface FeeConfiguration {
  developmentFees: Record<string, number>; // class -> amount
  busStops: Record<string, number>; // stop -> amount
}

interface DataContextType {
  students: Student[];
  payments: Payment[];
  feeConfig: FeeConfiguration;
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  importStudents: (students: Omit<Student, 'id'>[]) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'paymentDate'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  updateFeeConfig: (config: Partial<FeeConfiguration>) => void;
  sendSMS: (mobile: string, message: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfiguration>({
    developmentFees: {},
    busStops: {}
  });

  useEffect(() => {
    // Load data from localStorage
    const savedStudents = localStorage.getItem('students');
    const savedPayments = localStorage.getItem('payments');
    const savedFeeConfig = localStorage.getItem('feeConfig');

    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedFeeConfig) {
      setFeeConfig(JSON.parse(savedFeeConfig));
    } else {
      // Initialize default fee configuration
      const defaultConfig: FeeConfiguration = {
        developmentFees: {
          '1': 500, '2': 600, '3': 700, '4': 800, '5': 900, '6': 1000,
          '7': 1100, '8': 1200, '9': 1300, '10': 1400, '11': 1500, '12': 1600
        },
        busStops: {
          'Main Gate': 800, 'Market Square': 900, 'Railway Station': 1000,
          'City Center': 850, 'Park Avenue': 750, 'School Road': 700
        }
      };
      setFeeConfig(defaultConfig);
      localStorage.setItem('feeConfig', JSON.stringify(defaultConfig));
    }
  }, []);

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...student,
      id: Date.now().toString()
    };
    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  const updateStudent = (id: string, studentData: Partial<Student>) => {
    const updatedStudents = students.map(student =>
      student.id === id ? { ...student, ...studentData } : student
    );
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  const deleteStudent = (id: string) => {
    const updatedStudents = students.filter(student => student.id !== id);
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  const importStudents = (newStudents: Omit<Student, 'id'>[]) => {
    const studentsWithIds = newStudents.map(student => ({
      ...student,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    const updatedStudents = [...students, ...studentsWithIds];
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  const addPayment = (payment: Omit<Payment, 'id' | 'paymentDate'>) => {
    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString(),
      paymentDate: new Date().toISOString()
    };
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    localStorage.setItem('payments', JSON.stringify(updatedPayments));

    // Send SMS notification
    const student = students.find(s => s.id === payment.studentId);
    if (student) {
      const message = `Dear Parent, Payment of ₹${payment.totalAmount} received for ${student.name} (${student.admissionNo}). Date: ${new Date().toLocaleDateString()}. Thank you! - Sarvodaya School`;
      sendSMS(student.mobile, message);
    }
  };

  const updatePayment = (id: string, paymentData: Partial<Payment>) => {
    const updatedPayments = payments.map(payment =>
      payment.id === id ? { ...payment, ...paymentData } : payment
    );
    setPayments(updatedPayments);
    localStorage.setItem('payments', JSON.stringify(updatedPayments));
  };

  const deletePayment = (id: string) => {
    const updatedPayments = payments.filter(payment => payment.id !== id);
    setPayments(updatedPayments);
    localStorage.setItem('payments', JSON.stringify(updatedPayments));
  };

  const updateFeeConfig = (config: Partial<FeeConfiguration>) => {
    const updatedConfig = { ...feeConfig, ...config };
    setFeeConfig(updatedConfig);
    localStorage.setItem('feeConfig', JSON.stringify(updatedConfig));
  };

  const sendSMS = (mobile: string, message: string) => {
    // Simulate SMS sending
    console.log(`SMS sent to ${mobile}: ${message}`);
    // In a real application, you would integrate with an SMS service like Twilio
  };

  const value = {
    students,
    payments,
    feeConfig,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    addPayment,
    updatePayment,
    deletePayment,
    updateFeeConfig,
    sendSMS
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};