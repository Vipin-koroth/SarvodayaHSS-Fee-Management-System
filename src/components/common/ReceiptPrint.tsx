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
              font-size: 14px;
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
              padding: 5mm;
              background: white;
              overflow: hidden;
              border: 2px solid #000;
            }
            
            .receipt-content {
              position: relative;
              z-index: 2;
            }
            
            .receipt-header {
              text-align: center;
              margin-bottom: 3mm;
              padding-bottom: 2mm;
              border-bottom: 2px solid #000;
            }
            
            .school-name {
              font-size: 18px;
              font-weight: bold;
              color: #000;
              margin-bottom: 1mm;
              letter-spacing: 0.5px;
            }
            
            .school-subtitle {
              font-size: 16px;
              font-weight: 600;
              color: #000;
              margin-bottom: 1mm;
            }
            
            .location {
              font-size: 14px;
              color: #333;
              margin-bottom: 2mm;
            }
            
            .receipt-title {
              font-size: 13px;
              font-weight: 600;
              color: #000;
              margin-top: 2mm;
              text-decoration: underline;
            }
            
            .receipt-content {
              margin: 3mm 0;
              font-size: 13px;
              line-height: 1.4;
            }
            
            .receipt-content div {
              margin-bottom: 2px;
              display: flex;
              justify-content: space-between;
            }
            
            .receipt-content div strong {
              font-weight: bold;
            }
            
            .total-amount {
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 2mm;
              margin-top: 2mm;
              font-size: 15px;
              text-align: center;
            }
            
            .balance-section {
              margin: 3mm 0;
              padding-top: 2mm;
              border-top: 2px solid #000;
              font-size: 12px;
            }
            
            .balance-section div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
            }
            
            .footer {
              margin-top: 3mm;
              text-align: center;
              font-size: 11px;
              font-style: italic;
              border-top: 1px dashed #000;
              padding-top: 3mm;
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
          <h4 className="text-lg font-medium text-gray-900 mb-4 text-center">A6 Receipt Preview</h4>
          <div className="flex justify-center">
            <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
              <div id="professional-a6-receipt">
                <>
                  <div className="receipt-number">#{payment.id.slice(-6)}</div>
                    <div className="header">
                    <div className="receipt-header">
                      <div className="school-name">Sarvodaya</div>
                      <div className="school-subtitle">Higher Secondary School</div>
                      <div className="location">Eachome</div>
                      <div className="receipt-title">Fee Payment Receipt</div>
                    </div>
                    
                    <div className="receipt-content">
                      <div><strong>Name:</strong> <span>{payment.studentName}</span></div>
                      <div><strong>Adm No:</strong> <span>{payment.admissionNo}</span></div>
                      <div><strong>Class:</strong> <span>{payment.class}{payment.division ? `-${payment.division}` : ''}</span></div>
                      <div><strong>Date:</strong> <span>{new Date(payment.paymentDate).toLocaleDateString()}</span></div>
                      <div><strong>Receipt #:</strong> <span>{payment.id.slice(-6)}</span></div>
                      <div style={{ borderTop: '1px solid #000', paddingTop: '2mm', marginTop: '2mm', marginBottom: '2mm' }}>
                        <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '1mm' }}>Fee Details</div>
                        {payment.developmentFee > 0 && (
                          <div>
                            <div><strong>Development Fee:</strong> <span>₹{payment.developmentFee}</span></div>
                            {balance.developmentBalance > 0 && (
                              <div style={{ fontSize: '11px', color: '#666', marginLeft: '10px' }}>
                                Balance: ₹{balance.developmentBalance}
                              </div>
                            )}
                          </div>
                        )}
                        {payment.busFee > 0 && (
                          <div>
                            <div><strong>Bus Fee:</strong> <span>₹{payment.busFee}</span></div>
                            {balance.busBalance > 0 && (
                              <div style={{ fontSize: '11px', color: '#666', marginLeft: '10px' }}>
                                Balance: ₹{balance.busBalance}
                              </div>
                            )}
                          </div>
                        )}
                        {payment.specialFee > 0 && <div><strong>{payment.specialFeeType || 'Other Fee'}:</strong> <span>₹{payment.specialFee}</span></div>}
                      </div>
                    </div>
                    
                    <div className="total-amount">
                      TOTAL PAID: ₹{payment.totalAmount}
                    </div>
                    
                    {(balance.developmentBalance > 0 || balance.busBalance > 0) && (
                      <div className="balance-section">
                        <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '1mm' }}>Remaining Balance</div>
                        {balance.developmentBalance > 0 && (
                          <div><strong>Development:</strong> <span>₹{balance.developmentBalance}</span></div>
                        )}
                        {balance.busBalance > 0 && (
                          <div><strong>Bus Fee:</strong> <span>₹{balance.busBalance}</span></div>
                        )}
                      </div>
                    )}
                    
                    <div className="footer">
                      <div>Thank you for your payment!</div>
                      <div>Keep this receipt for your records</div>
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
          <h5 className="font-medium text-blue-900 mb-2">A6 Receipt Features:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>A6 Size:</strong> 105mm × 148mm (standard A6 paper)</li>
            <li>• <strong>Compact Layout:</strong> Matches bulk print receipt format</li>
            <li>• <strong>Grayscale Compatible:</strong> Optimized for black & white printing</li>
            <li>• <strong>Balance Display:</strong> Shows remaining fee balance</li>
            <li>• <strong>Clean Design:</strong> Simple layout with clear borders</li>
            <li>• <strong>Print Settings:</strong> A6 paper, 8mm margins, portrait orientation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;