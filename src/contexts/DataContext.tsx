import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { studentsApi, paymentsApi, feeConfigApi, notificationsApi } from '../lib/api';

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
  sendWhatsApp: (mobile: string, message: string) => void;
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
  const [loading, setLoading] = useState(true);
  const [feeConfig, setFeeConfig] = useState<FeeConfiguration>({
    developmentFees: {},
    busStops: {}
  });
  const [useApi, setUseApi] = useState(false);

  useEffect(() => {
    // Check if Supabase is configured
    const supabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    setUseApi(supabaseConfigured);
    
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is properly configured by testing a simple query
      const supabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseConfigured) {
        try {
          // Test Supabase connection with a simple query
          const { data, error } = await supabase
            .from('students')
            .select('count')
            .limit(1);
          
          if (error) {
            console.warn('Supabase connection failed, falling back to localStorage:', error.message);
            throw error;
          }
          
          // If test succeeds, load data from Supabase
          if (useApi) {
            // Use API endpoints
            await Promise.all([
              loadStudentsFromApi(),
              loadPaymentsFromApi(),
              loadFeeConfigFromApi()
            ]);
          } else {
            // Use direct Supabase client
            await Promise.all([
              loadStudents(),
              loadPayments(),
              loadFeeConfig()
            ]);
          }
        } catch (supabaseError) {
          console.warn('Supabase not available, using localStorage:', supabaseError);
          loadFromLocalStorage();
        }
      } else {
        console.log('Supabase not configured, using localStorage');
        loadFromLocalStorage();
      }
    } catch (error) {
      console.warn('Error loading initial data, falling back to localStorage:', error);
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  // API-based data loading functions
  const loadStudentsFromApi = async () => {
    try {
      const data = await studentsApi.getAll();
      setStudents(data);
    } catch (error) {
      console.warn('Error loading students from API, falling back:', error);
      throw error;
    }
  };

  const loadPaymentsFromApi = async () => {
    try {
      const data = await paymentsApi.getAll();
      setPayments(data);
    } catch (error) {
      console.warn('Error loading payments from API, falling back:', error);
      throw error;
    }
  };

  const loadFeeConfigFromApi = async () => {
    try {
      const data = await feeConfigApi.get();
      setFeeConfig(data);
    } catch (error) {
      console.warn('Error loading fee config from API, falling back:', error);
      throw error;
    }
  };

  const loadFromLocalStorage = () => {
    const savedStudents = localStorage.getItem('students');
    const savedPayments = localStorage.getItem('payments');
    const savedFeeConfig = localStorage.getItem('feeConfig');

    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedFeeConfig) {
      setFeeConfig(JSON.parse(savedFeeConfig));
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedStudents: Student[] = data.map(student => ({
        id: student.id,
        admissionNo: student.admission_no,
        name: student.name,
        mobile: student.mobile,
        class: student.class,
        division: student.division,
        busStop: student.bus_stop,
        busNumber: student.bus_number,
        tripNumber: student.trip_number
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.warn('Error loading students from Supabase:', error);
      throw error;
    }
  };

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPayments: Payment[] = data.map(payment => ({
        id: payment.id,
        studentId: payment.student_id,
        studentName: payment.student_name,
        admissionNo: payment.admission_no,
        developmentFee: payment.development_fee,
        busFee: payment.bus_fee,
        specialFee: payment.special_fee,
        specialFeeType: payment.special_fee_type,
        totalAmount: payment.total_amount,
        paymentDate: payment.payment_date,
        addedBy: payment.added_by,
        class: payment.class,
        division: payment.division
      }));

      setPayments(formattedPayments);
    } catch (error) {
      console.warn('Error loading payments from Supabase:', error);
      throw error;
    }
  };

  const loadFeeConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('fee_config')
        .select('*');

      if (error) throw error;

      const developmentFees: Record<string, number> = {};
      const busStops: Record<string, number> = {};

      data.forEach(config => {
        if (config.config_type === 'development_fee') {
          developmentFees[config.config_key] = config.config_value;
        } else if (config.config_type === 'bus_stop') {
          busStops[config.config_key] = config.config_value;
        }
      });

      setFeeConfig({ developmentFees, busStops });
    } catch (error) {
      console.warn('Error loading fee config from Supabase:', error);
      throw error;
    }
  };

  const addStudent = async (student: Omit<Student, 'id'>) => {
    try {
      if (useApi) {
        const data = await studentsApi.create({
          admission_no: student.admissionNo,
          name: student.name,
          mobile: student.mobile,
          class: student.class,
          division: student.division,
          bus_stop: student.busStop,
          bus_number: student.busNumber,
          trip_number: student.tripNumber
        });
        
        const newStudent: Student = {
          id: data.id,
          admissionNo: data.admission_no,
          name: data.name,
          mobile: data.mobile,
          class: data.class,
          division: data.division,
          busStop: data.bus_stop,
          busNumber: data.bus_number,
          tripNumber: data.trip_number
        };
        
        setStudents(prev => [newStudent, ...prev]);
      } else {
        // Direct Supabase client fallback
        const { data, error } = await supabase
          .from('students')
          .insert({
            admission_no: student.admissionNo,
            name: student.name,
            mobile: student.mobile,
            class: student.class,
            division: student.division,
            bus_stop: student.busStop,
            bus_number: student.busNumber,
            trip_number: student.tripNumber
          })
          .select()
          .single();

        if (error) throw error;

        const newStudent: Student = {
          id: data.id,
          admissionNo: data.admission_no,
          name: data.name,
          mobile: data.mobile,
          class: data.class,
          division: data.division,
          busStop: data.bus_stop,
          busNumber: data.bus_number,
          tripNumber: data.trip_number
        };

        setStudents(prev => [newStudent, ...prev]);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const updateStudent = async (id: string, studentData: Partial<Student>) => {
    try {
      const updateData: any = {};
      if (studentData.admissionNo) updateData.admission_no = studentData.admissionNo;
      if (studentData.name) updateData.name = studentData.name;
      if (studentData.mobile) updateData.mobile = studentData.mobile;
      if (studentData.class) updateData.class = studentData.class;
      if (studentData.division) updateData.division = studentData.division;
      if (studentData.busStop) updateData.bus_stop = studentData.busStop;
      if (studentData.busNumber) updateData.bus_number = studentData.busNumber;
      if (studentData.tripNumber) updateData.trip_number = studentData.tripNumber;

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.map(student =>
        student.id === id ? { ...student, ...studentData } : student
      ));
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.filter(student => student.id !== id));
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  const importStudents = async (newStudents: Omit<Student, 'id'>[]) => {
    try {
      const insertData = newStudents.map(student => ({
        admission_no: student.admissionNo,
        name: student.name,
        mobile: student.mobile,
        class: student.class,
        division: student.division,
        bus_stop: student.busStop,
        bus_number: student.busNumber,
        trip_number: student.tripNumber
      }));

      const { data, error } = await supabase
        .from('students')
        .insert(insertData)
        .select();

      if (error) throw error;

      const formattedStudents: Student[] = data.map(student => ({
        id: student.id,
        admissionNo: student.admission_no,
        name: student.name,
        mobile: student.mobile,
        class: student.class,
        division: student.division,
        busStop: student.bus_stop,
        busNumber: student.bus_number,
        tripNumber: student.trip_number
      }));

      setStudents(prev => [...formattedStudents, ...prev]);
    } catch (error) {
      console.error('Error importing students:', error);
      throw error;
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'paymentDate'>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          student_id: payment.studentId,
          student_name: payment.studentName,
          admission_no: payment.admissionNo,
          development_fee: payment.developmentFee,
          bus_fee: payment.busFee,
          special_fee: payment.specialFee,
          special_fee_type: payment.specialFeeType,
          total_amount: payment.totalAmount,
          payment_date: new Date().toISOString(),
          added_by: payment.addedBy,
          class: payment.class,
          division: payment.division
        })
        .select()
        .single();

      if (error) throw error;

      const newPayment: Payment = {
        id: data.id,
        studentId: data.student_id,
        studentName: data.student_name,
        admissionNo: data.admission_no,
        developmentFee: data.development_fee,
        busFee: data.bus_fee,
        specialFee: data.special_fee,
        specialFeeType: data.special_fee_type,
        totalAmount: data.total_amount,
        paymentDate: data.payment_date,
        addedBy: data.added_by,
        class: data.class,
        division: data.division
      };

      setPayments(prev => [newPayment, ...prev]);

      // Send SMS notification
      const student = students.find(s => s.id === payment.studentId);
      if (student) {
        const message = `Dear Parent, Payment of ₹${payment.totalAmount} received for ${student.name} (${student.admissionNo}). Date: ${new Date().toLocaleDateString()}. Thank you! - Sarvodaya School`;
        await sendSMS(student.mobile, message);
        await sendWhatsApp(student.mobile, message);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  const updatePayment = async (id: string, paymentData: Partial<Payment>) => {
    try {
      const updateData: any = {};
      if (paymentData.developmentFee !== undefined) updateData.development_fee = paymentData.developmentFee;
      if (paymentData.busFee !== undefined) updateData.bus_fee = paymentData.busFee;
      if (paymentData.specialFee !== undefined) updateData.special_fee = paymentData.specialFee;
      if (paymentData.specialFeeType !== undefined) updateData.special_fee_type = paymentData.specialFeeType;
      if (paymentData.totalAmount !== undefined) updateData.total_amount = paymentData.totalAmount;

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setPayments(prev => prev.map(payment =>
        payment.id === id ? { ...payment, ...paymentData } : payment
      ));
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPayments(prev => prev.filter(payment => payment.id !== id));
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  };

  const updateFeeConfig = async (config: Partial<FeeConfiguration>) => {
    try {
      const updates: any[] = [];

      if (config.developmentFees) {
        Object.entries(config.developmentFees).forEach(([key, value]) => {
          updates.push({
            config_type: 'development_fee',
            config_key: key,
            config_value: value
          });
        });
      }

      if (config.busStops) {
        Object.entries(config.busStops).forEach(([key, value]) => {
          updates.push({
            config_type: 'bus_stop',
            config_key: key,
            config_value: value
          });
        });
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('fee_config')
          .upsert(update, {
            onConflict: 'config_type,config_key'
          });

        if (error) throw error;
      }

      const updatedConfig = { ...feeConfig, ...config };
      setFeeConfig(updatedConfig);
    } catch (error) {
      console.error('Error updating fee config:', error);
      throw error;
    }
  };

  const sendSMS = async (mobile: string, message: string) => {
    const savedProvider = localStorage.getItem('smsProvider') || 'twilio';
    const savedCredentials = localStorage.getItem('smsCredentials');
    
    if (!savedCredentials) {
      console.log('SMS credentials not configured, skipping SMS notification...');
      return;
    }

    const credentials = JSON.parse(savedCredentials);
    
    try {
      if (useApi) {
        // Use API endpoint
        await notificationsApi.sendSMS({
          provider: savedProvider,
          credentials: credentials[savedProvider],
          mobile,
          message
        });
      } else {
        // Direct provider calls
        switch (savedProvider) {
          case 'twilio':
            await sendViaTwilio(mobile, message, credentials.twilio);
            break;
          case 'textlocal':
            await sendViaTextLocal(mobile, message, credentials.textlocal);
            break;
          case 'msg91':
            await sendViaMSG91(mobile, message, credentials.msg91);
            break;
          case 'textbee':
            await sendViaTextBee(mobile, message, credentials.textbee);
            break;
          default:
            console.log(`Unknown SMS provider: ${savedProvider}`);
            return;
        }
      }
      
      console.log(`✅ SMS sent successfully to ${mobile}`);
    } catch (error) {
      console.error(`❌ SMS failed to ${mobile}:`, error);
      // Silent failure - don't interrupt payment flow
      console.log('SMS notification failed, but payment was successful');
    }
  };

  // Twilio SMS Integration
  const sendViaTwilio = async (mobile: string, message: string, credentials: any) => {
    const TWILIO_ACCOUNT_SID = credentials?.accountSid;
    const TWILIO_AUTH_TOKEN = credentials?.authToken;
    const TWILIO_PHONE_NUMBER = credentials?.phoneNumber;

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
  const sendViaTextLocal = async (mobile: string, message: string, credentials: any) => {
    const TEXTLOCAL_API_KEY = credentials?.apiKey;
    const TEXTLOCAL_SENDER = credentials?.sender || 'SCHOOL';

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
  const sendViaMSG91 = async (mobile: string, message: string, credentials: any) => {
    const MSG91_API_KEY = credentials?.apiKey;
    const MSG91_SENDER_ID = credentials?.senderId || 'SCHOOL';
    const MSG91_ROUTE = credentials?.route || '4';

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
  const sendViaTextBee = async (mobile: string, message: string, credentials: any) => {
    const TEXTBEE_API_KEY = credentials?.apiKey;
    const TEXTBEE_DEVICE_ID = credentials?.deviceId;

    if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
      throw new Error('TextBee API key and Device ID not configured');
    }

    const response = await fetch('https://api.textbee.dev/api/v1/gateway/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEXTBEE_API_KEY,
      },
      body: JSON.stringify({
        device: TEXTBEE_DEVICE_ID,
        phone: `+91${mobile}`,
        message: message,
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(`TextBee error: ${result.message || result.error || response.statusText || 'Unknown error'}`);
    }
  };

  const sendWhatsApp = async (mobile: string, message: string) => {
    try {
      const savedCredentials = localStorage.getItem('whatsappCredentials');
      const savedProvider = localStorage.getItem('whatsappProvider');
      
      if (!savedCredentials || !savedProvider) {
        console.log('WhatsApp not configured, skipping...');
        return;
      }

      const credentials = JSON.parse(savedCredentials);
      
      if (useApi) {
        // Use API endpoint
        await notificationsApi.sendWhatsApp({
          provider: savedProvider,
          credentials: credentials[savedProvider],
          mobile,
          message
        });
      } else {
        // Direct provider calls
        switch (savedProvider) {
          case 'twilio':
            await sendWhatsAppViaTwilio(mobile, message, credentials.twilio);
            break;
          case 'whatsapp-business':
            await sendWhatsAppViaBusinessAPI(mobile, message, credentials.business);
            break;
          case 'ultramsg':
            await sendWhatsAppViaUltraMsg(mobile, message, credentials.ultramsg);
            break;
          case 'callmebot':
            await sendWhatsAppViaCallMeBot(mobile, message, credentials.callmebot);
            break;
          default:
            throw new Error('Unknown WhatsApp provider');
        }
      }
      
      console.log(`✅ WhatsApp sent successfully to ${mobile}`);
    } catch (error) {
      console.error(`❌ WhatsApp failed to ${mobile}:`, error);
      // Don't show alert for WhatsApp failures to avoid interrupting workflow
    }
  };

  // Twilio WhatsApp Integration
  const sendWhatsAppViaTwilio = async (mobile: string, message: string, credentials: any) => {
    const { accountSid, authToken, phoneNumber } = credentials;
    
    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error('Twilio WhatsApp credentials not configured');
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${phoneNumber}`,
        To: `whatsapp:+91${mobile}`,
        Body: message
      })
    });

    if (!response.ok) {
      throw new Error(`Twilio WhatsApp API error: ${response.status}`);
    }
  };

  // WhatsApp Business API Integration
  const sendWhatsAppViaBusinessAPI = async (mobile: string, message: string, credentials: any) => {
    const { accessToken, phoneNumberId } = credentials;
    
    if (!accessToken || !phoneNumberId) {
      throw new Error('WhatsApp Business API credentials not configured');
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: `91${mobile}`,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp Business API error: ${response.status}`);
    }
  };

  // UltraMsg WhatsApp Integration
  const sendWhatsAppViaUltraMsg = async (mobile: string, message: string, credentials: any) => {
    const { token, instanceId } = credentials;
    
    if (!token || !instanceId) {
      throw new Error('UltraMsg credentials not configured');
    }

    const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: token,
        to: `91${mobile}`,
        body: message
      })
    });

    const result = await response.json();
    if (!response.ok || result.sent !== true) {
      throw new Error(`UltraMsg error: ${result.error || 'Unknown error'}`);
    }
  };

  // CallMeBot WhatsApp Integration
  const sendWhatsAppViaCallMeBot = async (mobile: string, message: string, credentials: any) => {
    const { apiKey } = credentials;
    
    if (!apiKey) {
      throw new Error('CallMeBot API key not configured');
    }

    const response = await fetch(`https://api.callmebot.com/whatsapp.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Note: CallMeBot requires phone number to be registered first
    // This is a simplified implementation
    const url = `https://api.callmebot.com/whatsapp.php?phone=91${mobile}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`CallMeBot error: ${result.status}`);
    }
  };

  const value = {
    students,
    payments,
    feeConfig,
    loading,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    addPayment,
    updatePayment,
    deletePayment,
    updateFeeConfig,
    sendSMS,
    sendWhatsApp
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};