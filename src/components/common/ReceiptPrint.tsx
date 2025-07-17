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
    
    // Get the correct fee key for classes 11 and 12 (class-division) or regular classes (class only)
    const feeKey = (student.class === '11' || student.class === '12') 
      ? `${student.class}-${student.division}` 
      : student.class;
    const totalDevelopmentRequired = feeConfig.developmentFees[feeKey] || 0;
    const totalBusRequired = feeConfig.busStops[student.busStop] || 0;
    
    return {
      developmentBalance: Math.max(0, totalDevelopmentRequired - totalPaidDevelopment),
      busBalance: Math.max(0, totalBusRequired - totalPaidBus)
    };
  };
  
  const balance = calculateBalance();
  
  const handlePrint = () => {
    const printContent = document.getElementById('professional-a6-receipt');
    if (!printContent) {
      alert('Print content not found. Please try again.');
      return;
    }
    
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Please allow popups for printing');
      return;
    }
    
    newWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment.studentName}</title>
          <style>
            @page { 
              size: A6; 
              margin: 8mm; 
            }
            
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 0; 
              background: white;
              font-size: 11px;
              line-height: 1.4;
              color: #333;
            }
            
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
            }
            
            .receipt-container {
              position: relative;
              width: 105mm;
              min-height: 148mm;
              padding: 8mm;
              background: white;
              overflow: hidden;
              border: 1px solid #000;
            }
            
            .receipt-content {
              position: relative;
              z-index: 2;
            }
            
            .header {
              text-align: center;
              margin-bottom: 4mm;
              padding-bottom: 3mm;
              border-bottom: 2px solid #000;
            }
            
            .logo {
              width: 20mm;
              height: 20mm;
              margin: 0 auto 2mm auto;
              background-image: url('/New Logo.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
            }
            
            .school-name {
              font-size: 14px;
              font-weight: bold;
              color: #000;
              margin-bottom: 1mm;
              letter-spacing: 0.5px;
            }
            
            .school-subtitle {
              font-size: 12px;
              font-weight: 600;
              color: #000;
              margin-bottom: 1mm;
            }
            
            .location {
              font-size: 10px;
              color: #333;
              margin-bottom: 2mm;
            }
            
            .receipt-title {
              font-size: 10px;
              font-weight: 600;
              color: #000;
              background: #f0f0f0;
              padding: 2mm;
              border-radius: 2mm;
              margin-top: 2mm;
              border: 1px solid #ccc;
            }
            
            .info-section {
              margin: 3mm 0;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1mm 0;
              border-bottom: 1px dotted #999;
            }
            
            .info-row:last-child {
              border-bottom: none;
            }
            
            .info-label {
              font-weight: 600;
              color: #000;
              font-size: 10px;
            }
            
            .info-value {
              font-weight: 500;
              color: #000;
              font-size: 10px;
            }
            
            .fee-section {
              margin: 3mm 0;
              background: #f8f8f8;
              padding: 3mm;
              border: 1px solid #ccc;
            }
            
            .fee-title {
              font-size: 10px;
              font-weight: 700;
              color: #000;
              margin-bottom: 2mm;
              text-align: center;
              text-decoration: underline;
            }
            
            .fee-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1mm 0;
              font-size: 10px;
            }
            
            .fee-label {
              color: #000;
              font-weight: 500;
            }
            
            .fee-amount {
              color: #000;
              font-weight: 600;
            }
            
            .total-section {
              margin: 3mm 0;
              background: #e0e0e0;
              color: #000;
              padding: 3mm;
              text-align: center;
              border: 2px solid #000;
            }
            
            .total-label {
              font-size: 10px;
              font-weight: 500;
              margin-bottom: 1mm;
            }
            
            .total-amount {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 0.5px;
            }
            
            .balance-section {
              margin: 3mm 0;
              background: #f5f5f5;
              padding: 3mm;
              border: 1px solid #999;
            }
            
            .balance-title {
              font-size: 10px;
              font-weight: 700;
              color: #000;
              margin-bottom: 2mm;
              text-align: center;
              text-decoration: underline;
            }
            
            .balance-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1mm 0;
              font-size: 10px;
            }
            
            .balance-label {
              color: #000;
              font-weight: 500;
            }
            
            .balance-amount {
              color: #000;
              font-weight: 600;
            }
            
            .footer {
              margin-top: 3mm;
              text-align: center;
              padding-top: 3mm;
              border-top: 1px solid #999;
            }
            
            .footer-text {
              font-size: 9px;
              color: #000;
              margin-bottom: 1mm;
            }
            
            .footer-note {
              font-size: 8px;
              color: #333;
              font-style: italic;
            }
            
            .receipt-number {
              position: absolute;
              top: 2mm;
              right: 2mm;
              font-size: 8px;
              color: #000;
              background: #f0f0f0;
              padding: 1mm 2mm;
              border: 1px solid #999;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    newWindow.document.close();
    
    setTimeout(() => {
      try {
        newWindow.print();
        setTimeout(() => {
          newWindow.close();
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        alert('Print failed. Please try again.');
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Professional A6 Receipt Preview */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 text-center">Professional A6 Receipt Preview</h4>
          <div className="flex justify-center">
            <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
              <div id="professional-a6-receipt">
                <>
                  <div className="receipt-number">#{payment.id.slice(-6)}</div>
                  
                  <div className="receipt-content">
                    <div className="header">
                      <div className="logo"></div>
                      <div className="logo"></div>
                      <div className="school-name">SARVODAYA</div>
                      <div className="school-subtitle">Higher Secondary School</div>
                      <div className="location">Eachome, Kerala</div>
                      <div className="receipt-title">Fee Payment Receipt</div>
                    </div>
                    
                    <div className="info-section">
                      <div className="info-row">
                        <span className="info-label">Date:</span>
                        <span className="info-value">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Student Name:</span>
                        <span className="info-value">{payment.studentName}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Admission No:</span>
                        <span className="info-value">{payment.admissionNo}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Class:</span>
                        <span className="info-value">{payment.class}-{payment.division}</span>
                      </div>
                    </div>
                    
                    <div className="fee-section">
                      <div className="fee-title">Payment Details</div>
                      
                      {payment.developmentFee > 0 && (
                        <div className="fee-row">
                          <span className="fee-label">Development Fee</span>
                          <span className="fee-amount">₹{payment.developmentFee.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {payment.busFee > 0 && (
                        <div className="fee-row">
                          <span className="fee-label">Bus Fee</span>
                          <span className="fee-amount">₹{payment.busFee.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {payment.specialFee > 0 && (
                        <div className="fee-row">
                          <span className="fee-label">{payment.specialFeeType}</span>
                          <span className="fee-amount">₹{payment.specialFee.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="total-section">
                      <div className="total-label">Total Amount Paid</div>
                      <div className="total-amount">₹{payment.totalAmount.toLocaleString()}</div>
                    </div>
                    
                    {(balance.developmentBalance > 0 || balance.busBalance > 0) && (
                      <div className="balance-section">
                        <div className="balance-title">Remaining Balance</div>
                        {balance.developmentBalance > 0 && (
                          <div className="balance-row">
                            <span className="balance-label">Development Fee</span>
                            <span className="balance-amount">₹{balance.developmentBalance.toLocaleString()}</span>
                          </div>
                        )}
                        {balance.busBalance > 0 && (
                          <div className="balance-row">
                            <span className="balance-label">Bus Fee</span>
                            <span className="balance-amount">₹{balance.busBalance.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="footer">
                      <div className="footer-text">Thank you for your payment!</div>
                      <div className="footer-note">Please keep this receipt for your records</div>
                    </div>
                  </div>
                </>
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
            <span>Print Professional Receipt</span>
          </button>
        </div>

        {/* Print Instructions */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Professional A6 Receipt Features:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>A6 Size:</strong> 105mm × 148mm (standard A6 paper)</li>
            <li>• <strong>School Logo:</strong> Visible logo in header section</li>
            <li>• <strong>Grayscale Compatible:</strong> Optimized for black & white printing</li>
            <li>• <strong>Balance Display:</strong> Shows remaining fee balance</li>
            <li>• <strong>Professional Design:</strong> Clean layout with proper borders</li>
            <li>• <strong>Print Settings:</strong> A6 paper, 8mm margins, portrait orientation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;