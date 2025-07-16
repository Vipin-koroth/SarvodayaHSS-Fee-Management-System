import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { Payment, useData } from '../../contexts/DataContext';

interface ReceiptPrintProps {
  payment: Payment;
  onClose: () => void;
}

const ReceiptPrint: React.FC<ReceiptPrintProps> = ({ payment, onClose }) => {
  const { students, feeConfig, payments } = useData();
  const [printSize, setPrintSize] = useState<'a4-9' | '3x5' | 'a6'>('3x5');
  
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
    const printContent = document.getElementById(`receipt-print-${printSize}`);
    if (!printContent) {
      alert('Print content not found. Please try again.');
      return;
    }
    
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Please allow popups for printing');
      return;
    }
    
    let pageStyles = '';
    let pageSetup = '';
    
    switch (printSize) {
      case 'a4-9':
        pageSetup = '@page { size: A4; margin: 5mm; }';
        pageStyles = `
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 5mm; 
            background: white;
            font-size: 8px;
          }
          .receipt-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3mm;
            width: 100%;
            height: calc(100vh - 10mm);
          }
          .receipt { 
            width: 58mm; 
            height: 82mm; 
            border: 1px solid #000; 
            padding: 2mm; 
            font-size: 7px;
            line-height: 1.1;
            page-break-inside: avoid;
            overflow: hidden;
          }
        `;
        break;
      case '3x5':
        pageSetup = '@page { size: 3in 5in; margin: 2mm; }';
        pageStyles = `
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white;
            font-size: 9px;
          }
          .receipt { 
            width: calc(3in - 4mm); 
            height: calc(5in - 4mm); 
            border: 1px solid #000; 
            padding: 2mm; 
            font-size: 9px;
            line-height: 1.2;
            margin: 2mm;
            overflow: hidden;
          }
        `;
        break;
      case 'a6':
        pageSetup = '@page { size: A6; margin: 3mm; }';
        pageStyles = `
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white;
            font-size: 10px;
          }
          .receipt { 
            width: calc(105mm - 6mm); 
            height: calc(148mm - 6mm); 
            border: 1px solid #000; 
            padding: 3mm; 
            font-size: 10px;
            line-height: 1.3;
            margin: 3mm;
            overflow: hidden;
          }
        `;
        break;
    }

    const commonStyles = `
      ${pageSetup}
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .receipt { page-break-inside: avoid; }
      }
      .receipt .school-name {
        margin: 0 0 1px 0;
        font-size: ${printSize === 'a4-9' ? '8px' : printSize === '3x5' ? '10px' : '12px'};
        text-align: center;
        font-weight: bold;
      }
      .receipt .school-subtitle {
        margin: 0 0 1px 0;
        font-size: ${printSize === 'a4-9' ? '7px' : printSize === '3x5' ? '9px' : '10px'};
        text-align: center;
        font-weight: bold;
      }
      .receipt .location {
        margin: 0 0 3px 0;
        font-size: ${printSize === 'a4-9' ? '6px' : printSize === '3x5' ? '8px' : '9px'};
        text-align: center;
      }
      .receipt .receipt-title {
        font-size: ${printSize === 'a4-9' ? '6px' : printSize === '3x5' ? '7px' : '8px'};
        text-align: center;
        margin: 0 0 ${printSize === 'a4-9' ? '2px' : '3px'} 0;
      }
      .receipt .header {
        text-align: center;
        border-bottom: 1px solid #000;
        padding-bottom: ${printSize === 'a4-9' ? '2px' : '4px'};
        margin-bottom: ${printSize === 'a4-9' ? '3px' : '6px'};
      }
      .receipt .row { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: ${printSize === 'a4-9' ? '1px' : '2px'};
        font-size: ${printSize === 'a4-9' ? '6px' : printSize === '3x5' ? '8px' : '9px'};
        line-height: 1.1;
      }
      .receipt .total { 
        border-top: 1px solid #000; 
        padding-top: ${printSize === 'a4-9' ? '2px' : '4px'}; 
        margin-top: ${printSize === 'a4-9' ? '3px' : '6px'};
        font-weight: bold;
        font-size: ${printSize === 'a4-9' ? '7px' : printSize === '3x5' ? '9px' : '10px'};
      }
      .receipt .balance-section {
        border-top: 1px solid #000;
        padding-top: ${printSize === 'a4-9' ? '2px' : '4px'};
        margin-top: ${printSize === 'a4-9' ? '3px' : '6px'};
        font-size: ${printSize === 'a4-9' ? '6px' : printSize === '3x5' ? '8px' : '9px'};
      }
      .receipt .footer {
        text-align: center;
        margin-top: ${printSize === 'a4-9' ? '3px' : '6px'};
        font-size: ${printSize === 'a4-9' ? '5px' : printSize === '3x5' ? '7px' : '8px'};
        border-top: 1px solid #000;
        padding-top: ${printSize === 'a4-9' ? '2px' : '4px'};
      }
    `;

    newWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${printSize.toUpperCase()}</title>
          <style>
            ${pageStyles}
            ${commonStyles}
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

  const renderReceipt = (size: string) => (
    <div className="receipt">
      <div className="header">
        <div className="school-name">Sarvodaya</div>
        <div className="school-subtitle">Higher Secondary School</div>
        <div className="location">Eachome</div>
        <div className="receipt-title">Fee Payment Receipt</div>
      </div>
      
      <div className="row">
        <span>Receipt #:</span>
        <span>{payment.id.slice(-6)}</span>
      </div>
      
      <div className="row">
        <span>Date:</span>
        <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
      </div>
      
      <div className="row">
        <span>Student:</span>
        <span>{payment.studentName}</span>
      </div>
      
      <div className="row">
        <span>Adm No:</span>
        <span>{payment.admissionNo}</span>
      </div>
      
      <div className="row">
        <span>Class:</span>
        <span>{payment.class}-{payment.division}</span>
      </div>
      
      <div style={{ borderTop: '1px solid #000', paddingTop: size === 'a4-9' ? '2px' : '4px', marginTop: size === 'a4-9' ? '3px' : '6px', marginBottom: size === 'a4-9' ? '2px' : '4px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: size === 'a4-9' ? '1px' : '2px', fontSize: size === 'a4-9' ? '8px' : size === '3x5' ? '10px' : '11px' }}>Fee Details:</div>
        
        {payment.developmentFee > 0 && (
          <div className="row">
            <span>Development Fee:</span>
            <span>₹{payment.developmentFee}</span>
          </div>
        )}
        
        {payment.busFee > 0 && (
          <div className="row">
            <span>Bus Fee:</span>
            <span>₹{payment.busFee}</span>
          </div>
        )}
        
        {payment.specialFee > 0 && (
          <div className="row">
            <span>{payment.specialFeeType}:</span>
            <span>₹{payment.specialFee}</span>
          </div>
        )}
      </div>
      
      <div className="total">
        <div className="row">
          <span>Total Amount:</span>
          <span>₹{payment.totalAmount}</span>
        </div>
      </div>
      
      {(balance.developmentBalance > 0 || balance.busBalance > 0) && (
        <div className="balance-section">
          <div style={{ fontWeight: 'bold', marginBottom: size === 'a4-9' ? '1px' : '2px' }}>Remaining Balance:</div>
          {balance.developmentBalance > 0 && (
            <div className="row">
              <span>Development:</span>
              <span>₹{balance.developmentBalance}</span>
            </div>
          )}
          {balance.busBalance > 0 && (
            <div className="row">
              <span>Bus Fee:</span>
              <span>₹{balance.busBalance}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="footer">
        <div>Thank you for your payment!</div>
        <div>Keep this receipt for records</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Print Size Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Print Size</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setPrintSize('a4-9')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                printSize === 'a4-9' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">A4 - 9 Receipts</div>
              <div className="text-sm text-gray-600">9 receipts per A4 sheet</div>
            </button>
            
            <button
              onClick={() => setPrintSize('3x5')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                printSize === '3x5' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">3x5 Inch</div>
              <div className="text-sm text-gray-600">Single receipt 3x5 inch</div>
            </button>
            
            <button
              onClick={() => setPrintSize('a6')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                printSize === 'a6' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">A6 Size</div>
              <div className="text-sm text-gray-600">Single receipt A6 size</div>
            </button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Preview - {printSize.toUpperCase()}</h4>
          <div className="flex justify-center">
            <div 
              style={{ 
                transform: printSize === 'a4-9' ? 'scale(0.6)' : printSize === '3x5' ? 'scale(0.8)' : 'scale(0.7)',
                transformOrigin: 'top center'
              }}
            >
              <div id={`receipt-print-${printSize}`}>
                {printSize === 'a4-9' ? (
                  <div className="receipt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: '600px' }}>
                    {Array(9).fill(0).map((_, index) => (
                      <div key={index}>
                        {renderReceipt('a4-9')}
                      </div>
                    ))}
                  </div>
                ) : (
                  renderReceipt(printSize)
                )}
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
            <span>Print Receipt ({printSize.toUpperCase()})</span>
          </button>
        </div>

        {/* Print Instructions */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Print Instructions:</strong>
            {printSize === 'a4-9' && ' A4 format with 9 receipts per sheet. Use regular printer with A4 paper. Margins: 5mm all sides.'}
            {printSize === '3x5' && ' 3x5 inch format for single receipt. Set printer to 3x5 inch paper size. Margins: 2mm all sides.'}
            {printSize === 'a6' && ' A6 format for single receipt. Set printer to A6 paper size (105×148mm). Margins: 3mm all sides.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;