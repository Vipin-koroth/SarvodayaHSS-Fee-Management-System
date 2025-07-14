import React from 'react';
import { X, Printer } from 'lucide-react';
import { Payment, useData } from '../../contexts/DataContext';

interface ReceiptPrintProps {
  payment: Payment;
  onClose: () => void;
}

const ReceiptPrint: React.FC<ReceiptPrintProps> = ({ payment, onClose }) => {
  const { students, feeConfig, payments } = useData();
  
  // Calculate balance for the student
  const calculateBalance = () => {
    const student = students.find(s => s.id === payment.studentId);
    if (!student) return { developmentBalance: 0, busBalance: 0 };
    
    const studentPayments = payments.filter(p => p.studentId === payment.studentId);
    const totalPaidDevelopment = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
    const totalPaidBus = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
    
    const totalDevelopmentRequired = feeConfig.developmentFees[student.class] || 0;
    const totalBusRequired = feeConfig.busStops[student.busStop] || 0;
    
    return {
      developmentBalance: Math.max(0, totalDevelopmentRequired - totalPaidDevelopment),
      busBalance: Math.max(0, totalBusRequired - totalPaidBus)
    };
  };
  
  const balance = calculateBalance();
  
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-print-content');
    if (printContent) {
      const newWindow = window.open('', '_blank');
      newWindow!.document.write(`
        <html>
          <head>
            <title>Payment Receipt</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white;
              }
              .receipt { 
                width: 2.5in; 
                height: 4in; 
                border: 1px solid #000; 
                padding: 10px; 
                margin: 0 auto;
                font-size: 11px;
                line-height: 1.3;
              }
              .receipt h3 { 
                margin: 0 0 2px 0; 
                font-size: 13px; 
                text-align: center; 
                font-weight: bold;
              }
              .receipt .school-name {
                margin: 0 0 1px 0;
                font-size: 13px;
                text-align: center;
                font-weight: bold;
              }
              .receipt .school-subtitle {
                margin: 0 0 1px 0;
                font-size: 11px;
                text-align: center;
                font-weight: bold;
              }
              .receipt .location {
                margin: 0 0 3px 0;
                font-size: 10px;
                text-align: center;
              }
              .receipt .header {
                text-align: center;
                border-bottom: 1px solid #000;
                padding-bottom: 6px;
                margin-bottom: 10px;
              }
              .receipt .row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 4px;
                font-size: 11px;
              }
              .receipt .total { 
                border-top: 1px solid #000; 
                padding-top: 6px; 
                margin-top: 10px;
                font-weight: bold;
                font-size: 12px;
              }
              .receipt .footer {
                text-align: center;
                margin-top: 10px;
                font-size: 9px;
                border-top: 1px solid #000;
                padding-top: 6px;
              }
              @media print { 
                body { margin: 0; padding: 0; }
                .receipt { margin: 0; border: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      newWindow!.document.close();
      newWindow!.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Receipt Preview */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div id="receipt-print-content">
            <div className="receipt" style={{ width: '240px', height: '380px', border: '1px solid #000', padding: '10px', fontSize: '11px', lineHeight: '1.3', margin: '0 auto' }}>
              <div className="header" style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '6px', marginBottom: '10px' }}>
                <div className="school-name" style={{ margin: '0 0 1px 0', fontSize: '13px', fontWeight: 'bold' }}>Sarvodaya</div>
                <div className="school-subtitle" style={{ margin: '0 0 1px 0', fontSize: '11px', fontWeight: 'bold' }}>Higher Secondary School</div>
                <div className="location" style={{ margin: '0 0 3px 0', fontSize: '10px' }}>Eachome</div>
                <div style={{ fontSize: '9px' }}>Fee Payment Receipt</div>
              </div>
              
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span>Receipt #:</span>
                <span>{payment.id.slice(-6)}</span>
              </div>
              
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span>Date:</span>
                <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
              </div>
              
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span>Student:</span>
                <span>{payment.studentName}</span>
              </div>
              
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span>Adm No:</span>
                <span>{payment.admissionNo}</span>
              </div>
              
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                <span>Class:</span>
                <span>{payment.class}-{payment.division}</span>
              </div>
              
              <div style={{ borderTop: '1px solid #000', paddingTop: '6px', marginTop: '10px', marginBottom: '6px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}>Fee Details:</div>
                
                {payment.developmentFee > 0 && (
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11px' }}>
                    <span>Development Fee:</span>
                    <span>₹{payment.developmentFee}</span>
                  </div>
                )}
                
                {payment.busFee > 0 && (
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11px' }}>
                    <span>Bus Fee:</span>
                    <span>₹{payment.busFee}</span>
                  </div>
                )}
                
                {payment.specialFee > 0 && (
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11px' }}>
                    <span>{payment.specialFeeType}:</span>
                    <span>₹{payment.specialFee}</span>
                  </div>
                )}
              </div>
              
              <div className="total" style={{ borderTop: '1px solid #000', paddingTop: '6px', marginTop: '10px', fontWeight: 'bold', fontSize: '12px' }}>
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Total Amount:</span>
                  <span>₹{payment.totalAmount}</span>
                </div>
              </div>
              
              {(balance.developmentBalance > 0 || balance.busBalance > 0) && (
                <div style={{ borderTop: '1px solid #000', paddingTop: '6px', marginTop: '6px', fontSize: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Remaining Balance:</div>
                  {balance.developmentBalance > 0 && (
                    <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '10px' }}>
                      <span>Development:</span>
                      <span>₹{balance.developmentBalance}</span>
                    </div>
                  )}
                  {balance.busBalance > 0 && (
                    <div className="row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                      <span>Bus Fee:</span>
                      <span>₹{balance.busBalance}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="footer" style={{ textAlign: 'center', marginTop: '10px', fontSize: '9px', borderTop: '1px solid #000', paddingTop: '6px' }}>
                <div>Thank you for your payment!</div>
                <div>Keep this receipt for records</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* Print Instructions */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Print Instructions:</strong> The receipt is designed for 2x3 inch thermal printers. 
            For regular printers, adjust print settings to fit the receipt size or print multiple receipts per page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;