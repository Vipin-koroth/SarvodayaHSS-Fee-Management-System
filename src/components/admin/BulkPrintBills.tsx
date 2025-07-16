import React, { useState, useContext } from 'react';
import { DataContext } from '../../contexts/DataContext';
import { Printer, Calendar, Users, FileText } from 'lucide-react';

interface BulkPrintBillsProps {}

const BulkPrintBills: React.FC<BulkPrintBillsProps> = () => {
  const { payments, students, feeStructure } = useContext(DataContext);
  const [printCriteria, setPrintCriteria] = useState<'date' | 'class'>('date');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedDivision, setSelectedDivision] = useState('A');
  const [printFormat, setPrintFormat] = useState<'a4-9' | '3x5' | 'a6'>('a4-9');

  const getFilteredPayments = () => {
    if (printCriteria === 'date') {
      return payments.filter(payment => payment.date === selectedDate);
    } else {
      const classKey = ['11', '12'].includes(selectedClass) 
        ? `${selectedClass}-${selectedDivision}` 
        : selectedClass;
      return payments.filter(payment => {
        const student = students.find(s => s.id === payment.studentId);
        const studentClassKey = ['11', '12'].includes(student?.class || '') 
          ? `${student?.class}-${student?.division}` 
          : student?.class;
        return studentClassKey === classKey;
      });
    }
  };

  const getStudentBalance = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { devBalance: 0, busBalance: 0 };

    const classKey = ['11', '12'].includes(student.class) 
      ? `${student.class}-${student.division}` 
      : student.class;

    const totalDevFee = feeStructure[classKey]?.developmentFee || 0;
    const totalBusFee = feeStructure[classKey]?.busFee || 0;

    const studentPayments = payments.filter(p => p.studentId === studentId);
    const paidDevFee = studentPayments.reduce((sum, p) => sum + (p.developmentFee || 0), 0);
    const paidBusFee = studentPayments.reduce((sum, p) => sum + (p.busFee || 0), 0);

    return {
      devBalance: Math.max(0, totalDevFee - paidDevFee),
      busBalance: Math.max(0, totalBusFee - paidBusFee)
    };
  };

  const handlePrint = () => {
    const filteredPayments = getFilteredPayments();
    if (filteredPayments.length === 0) {
      alert('No payments found for the selected criteria.');
      return;
    }

    const printContent = document.getElementById(`bulk-bills-print-${printFormat}`);
    if (!printContent) {
      alert('Print content not found. Please try again.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to enable printing.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bulk Print Bills</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            ${printContent.innerHTML.includes('grid-cols-3') ? `
              .receipt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; padding: 5mm; }
              .receipt { width: 60mm; height: 85mm; border: 1px solid #000; padding: 2mm; font-size: 8px; }
            ` : printFormat === '3x5' ? `
              .receipt { width: 3in; height: 5in; border: 1px solid #000; padding: 5mm; font-size: 10px; page-break-after: always; }
            ` : `
              .receipt { width: 105mm; height: 148mm; border: 1px solid #000; padding: 5mm; font-size: 11px; page-break-after: always; }
            `}
            .receipt-header { text-align: center; margin-bottom: 3mm; }
            .receipt-content { margin-bottom: 2mm; }
            .balance-section { margin-top: 2mm; padding-top: 2mm; border-top: 1px solid #ccc; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const filteredPayments = getFilteredPayments();
  const totalAmount = filteredPayments.reduce((sum, payment) => 
    sum + (payment.developmentFee || 0) + (payment.busFee || 0), 0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Printer className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Bulk Print Bills</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Print Criteria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Print Criteria
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="date"
                checked={printCriteria === 'date'}
                onChange={(e) => setPrintCriteria(e.target.value as 'date')}
                className="mr-2"
              />
              <Calendar className="w-4 h-4 mr-1" />
              Date-wise
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="class"
                checked={printCriteria === 'class'}
                onChange={(e) => setPrintCriteria(e.target.value as 'class')}
                className="mr-2"
              />
              <Users className="w-4 h-4 mr-1" />
              Class-wise
            </label>
          </div>
        </div>

        {/* Selection Inputs */}
        <div>
          {printCriteria === 'date' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                  ))}
                </select>
              </div>
              {['11', '12'].includes(selectedClass) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Division
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['A', 'B', 'C', 'D', 'E'].map(division => (
                      <option key={division} value={division}>Division {division}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Print Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Print Format
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setPrintFormat('a4-9')}
            className={`p-3 border rounded-lg text-left transition-colors ${
              printFormat === 'a4-9' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <FileText className="w-5 h-5 mb-1" />
            <div className="font-medium">A4 - 9 Receipts</div>
            <div className="text-sm text-gray-600">9 receipts per A4 sheet</div>
          </button>
          <button
            onClick={() => setPrintFormat('3x5')}
            className={`p-3 border rounded-lg text-left transition-colors ${
              printFormat === '3x5' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <FileText className="w-5 h-5 mb-1" />
            <div className="font-medium">3x5 Inch</div>
            <div className="text-sm text-gray-600">Single receipt per page</div>
          </button>
          <button
            onClick={() => setPrintFormat('a6')}
            className={`p-3 border rounded-lg text-left transition-colors ${
              printFormat === 'a6' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <FileText className="w-5 h-5 mb-1" />
            <div className="font-medium">A6 Size</div>
            <div className="text-sm text-gray-600">Single A6 receipt</div>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-800 mb-2">Print Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Bills:</span>
            <span className="ml-2 font-medium">{filteredPayments.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <span className="ml-2 font-medium">₹{totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={filteredPayments.length === 0}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Printer className="w-4 h-4" />
        Print {filteredPayments.length} Bills
      </button>

      {/* Hidden Print Content */}
      <div style={{ display: 'none' }}>
        <div id={`bulk-bills-print-${printFormat}`}>
          {printFormat === 'a4-9' ? (
            <div className="receipt-grid">
              {filteredPayments.map((payment) => {
                const student = students.find(s => s.id === payment.studentId);
                const balance = getStudentBalance(payment.studentId);
                return (
                  <div key={payment.id} className="receipt">
                    <div className="receipt-header">
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Sarvodaya</div>
                      <div style={{ fontSize: '8px' }}>Higher Secondary School</div>
                      <div style={{ fontSize: '8px' }}>Eachome</div>
                      <div style={{ fontSize: '7px', marginTop: '1mm' }}>Fee Payment Receipt</div>
                    </div>
                    <div className="receipt-content">
                      <div><strong>Name:</strong> {student?.name}</div>
                      <div><strong>Class:</strong> {student?.class}{student?.division ? `-${student.division}` : ''}</div>
                      <div><strong>Date:</strong> {payment.date}</div>
                      <div><strong>Receipt:</strong> {payment.receiptNumber}</div>
                      {payment.developmentFee > 0 && <div><strong>Dev Fee:</strong> ₹{payment.developmentFee}</div>}
                      {payment.busFee > 0 && <div><strong>Bus Fee:</strong> ₹{payment.busFee}</div>}
                      <div><strong>Total:</strong> ₹{(payment.developmentFee || 0) + (payment.busFee || 0)}</div>
                    </div>
                    {(balance.devBalance > 0 || balance.busBalance > 0) && (
                      <div className="balance-section">
                        <div style={{ fontSize: '7px', fontWeight: 'bold' }}>Balance:</div>
                        {balance.devBalance > 0 && <div style={{ fontSize: '7px' }}>Dev: ₹{balance.devBalance}</div>}
                        {balance.busBalance > 0 && <div style={{ fontSize: '7px' }}>Bus: ₹{balance.busBalance}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            filteredPayments.map((payment) => {
              const student = students.find(s => s.id === payment.studentId);
              const balance = getStudentBalance(payment.studentId);
              return (
                <div key={payment.id} className="receipt">
                  <div className="receipt-header">
                    <div style={{ fontSize: printFormat === '3x5' ? '14px' : '16px', fontWeight: 'bold' }}>Sarvodaya</div>
                    <div style={{ fontSize: printFormat === '3x5' ? '12px' : '14px' }}>Higher Secondary School</div>
                    <div style={{ fontSize: printFormat === '3x5' ? '12px' : '14px' }}>Eachome</div>
                    <div style={{ fontSize: printFormat === '3x5' ? '10px' : '12px', marginTop: '2mm' }}>Fee Payment Receipt</div>
                  </div>
                  <div className="receipt-content">
                    <div><strong>Name:</strong> {student?.name}</div>
                    <div><strong>Class:</strong> {student?.class}{student?.division ? `-${student.division}` : ''}</div>
                    <div><strong>Date:</strong> {payment.date}</div>
                    <div><strong>Receipt Number:</strong> {payment.receiptNumber}</div>
                    {payment.developmentFee > 0 && <div><strong>Development Fee:</strong> ₹{payment.developmentFee}</div>}
                    {payment.busFee > 0 && <div><strong>Bus Fee:</strong> ₹{payment.busFee}</div>}
                    <div><strong>Total Paid:</strong> ₹{(payment.developmentFee || 0) + (payment.busFee || 0)}</div>
                  </div>
                  {(balance.devBalance > 0 || balance.busBalance > 0) && (
                    <div className="balance-section">
                      <div style={{ fontWeight: 'bold' }}>Remaining Balance:</div>
                      {balance.devBalance > 0 && <div>Development Fee: ₹{balance.devBalance}</div>}
                      {balance.busBalance > 0 && <div>Bus Fee: ₹{balance.busBalance}</div>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkPrintBills;