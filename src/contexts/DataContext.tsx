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
  developmentFees: Record<string, number>; // class -> amount (for classes 1-10) or class-division -> amount (for classes 11-12)
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

export const DataContext = createContext<DataContextType | undefined>(undefined);

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
      senderId: 'SCHOOL',
      deviceId: ''
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
          '7': 1100, '8': 1200, '9': 1300, '10': 1400,
          '11-A': 1500, '11-B': 1600, '11-C': 1700, '11-D': 1800, '11-E': 1900,
          '12-A': 1600, '12-B': 1700, '12-C': 1800, '12-D': 1900, '12-E': 2000
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
      // Get the correct fee key for classes 11 and 12 (class-division) or regular classes (class only)
      const feeKey = (student.class === '11' || student.class === '12') 
        ? `${student.class}-${student.division}` 
        : student.class;
      
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
    // Enhanced SMS sending with multiple service options
    try {
      // Option 1: Using Twilio (most popular)
      sendViaTwilio(mobile, message);
      
      // Option 2: Using TextLocal (India-specific)
      // sendViaTextLocal(mobile, message);
      
      // Option 3: Using MSG91 (India-specific)
      // sendViaMSG91(mobile, message);
      
      // Option 4: Using TextBee (India-specific)
      // sendViaTextBee(mobile, message);
      
      console.log(`✅ SMS sent successfully to ${mobile}`);
    } catch (error) {
      console.error(`❌ SMS failed to ${mobile}:`, error);
      // Fallback: Show notification to user
      alert(`SMS notification failed for ${mobile}. Please inform parent manually.`);
    }
  };

  // Twilio SMS Integration
  const sendViaTwilio = async (mobile: string, message: string) => {
    const savedCredentials = localStorage.getItem('smsCredentials');
    const credentials = savedCredentials ? JSON.parse(savedCredentials) : null;
    
    const TWILIO_ACCOUNT_SID = credentials?.twilio?.accountSid;
    const TWILIO_AUTH_TOKEN = credentials?.twilio?.authToken;
    const TWILIO_PHONE_NUMBER = credentials?.twilio?.phoneNumber;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio credentials not configured');
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: `+91${mobile}`, // Assuming Indian numbers
        Body: message
      })
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }
  };

  // TextLocal SMS Integration (India)
  const sendViaTextLocal = async (mobile: string, message: string) => {
    const savedCredentials = localStorage.getItem('smsCredentials');
    const credentials = savedCredentials ? JSON.parse(savedCredentials) : null;
    
    const TEXTLOCAL_API_KEY = credentials?.textlocal?.apiKey;
    const TEXTLOCAL_SENDER = credentials?.textlocal?.sender || 'SCHOOL';

    if (!TEXTLOCAL_API_KEY) {
      throw new Error('TextLocal API key not configured');
    }

    const response = await fetch('https://api.textlocal.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: TEXTLOCAL_API_KEY,
        numbers: mobile,
        message: message,
        sender: TEXTLOCAL_SENDER
      })
    });

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(`TextLocal error: ${result.errors?.[0]?.message || 'Unknown error'}`);
    }
  };

  // MSG91 SMS Integration (India)
  const sendViaMSG91 = async (mobile: string, message: string) => {
    const savedCredentials = localStorage.getItem('smsCredentials');
    const credentials = savedCredentials ? JSON.parse(savedCredentials) : null;
    
    const MSG91_API_KEY = credentials?.msg91?.apiKey;
    const MSG91_SENDER_ID = credentials?.msg91?.senderId || 'SCHOOL';
    const MSG91_ROUTE = credentials?.msg91?.route || '4';

    if (!MSG91_API_KEY) {
      throw new Error('MSG91 API key not configured');
    }

    const response = await fetch(`https://api.msg91.com/api/sendhttp.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        authkey: MSG91_API_KEY,
        mobiles: mobile,
        message: message,
        sender: MSG91_SENDER_ID,
        route: MSG91_ROUTE
      })
    });

    const result = await response.text();
    if (!result.includes('success')) {
      throw new Error(`MSG91 error: ${result}`);
    }
  };

  // TextBee SMS Integration (India)
  const sendViaTextBee = async (mobile: string, message: string) => {
    const savedCredentials = localStorage.getItem('smsCredentials');
    const credentials = savedCredentials ? JSON.parse(savedCredentials) : null;
    
    const TEXTBEE_API_KEY = credentials?.textbee?.apiKey;
    const TEXTBEE_DEVICE_ID = credentials?.textbee?.deviceId;

    if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
      throw new Error('TextBee API key and Device ID not configured');
    }

    const response = await fetch('https://api.textbee.dev/api/v1/gateway/devices/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEXTBEE_API_KEY}`,
      },
      body: JSON.stringify({
        device_id: TEXTBEE_DEVICE_ID,
        sim: 1,
        number: mobile,
        message: message,
        type: 'sms'
      })
    });

    const result = await response.json();
    if (!response.ok || result.status !== 'success') {
      throw new Error(`TextBee error: ${result.message || result.error || 'Unknown error'}`);
    }
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