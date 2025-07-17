import React, { useState, useContext } from 'react';
import { DataContext } from '../../contexts/DataContext';
import { Printer, Calendar, Users, FileText } from 'lucide-react';

interface BulkPrintBillsProps {}

const BulkPrintBills: React.FC<BulkPrintBillsProps> = () => {
  const { payments, students, feeConfig } = useContext(DataContext);
  const [printCriteria, setPrintCriteria] = useState<'date' | 'class'>('date');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedDivision, setSelectedDivision] = useState('A');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [printFormat, setPrintFormat] = useState<'a4-9' | '3x5' | 'a6'>('a4-9');

  const getFilteredPayments = () => {
    if (printCriteria === 'date') {
      return payments.filter(payment => new Date(payment.paymentDate).toISOString().split('T')[0] === selectedDate);
    } else {
      return payments.filter(payment => {
        const matchesClass = payment.class === selectedClass && payment.division === selectedDivision;
        
        if (!fromDate && !toDate) return matchesClass;
        
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        const matchesFromDate = !fromDate || paymentDate >= fromDate;
        const matchesToDate = !toDate || paymentDate <= toDate;
        
        return matchesClass && matchesFromDate && matchesToDate;
      });
    }
  };

  const getStudentBalance = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { devBalance: 0, busBalance: 0 };

    const classKey = ['11', '12'].includes(student.class) 
      ? `${student.class}-${student.division}` 
      : student.class;

    const totalDevFee = feeConfig.developmentFees[classKey] || 0;
    const totalBusFee = feeConfig.busStops[student.busStop] || 0;

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
            body { font-family: Arial, sans-serif; font-size: 8px; }
            @media print {
              body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none; }
              .receipt { page-break-inside: avoid; }
            }
            ${printFormat === 'a4-9' ? `
              @page { size: A4; margin: 5mm; }
              .receipt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; padding: 0; }
              .receipt { width: 60mm; height: 85mm; padding: 3mm; font-size: 10px; line-height: 1.3; overflow: hidden; }
            ` : printFormat === '3x5' ? `
              @page { size: 3in 5in; margin: 2mm; }
              .receipt { width: calc(3in - 4mm); height: calc(5in - 4mm); padding: 4mm; font-size: 12px; line-height: 1.4; page-break-after: always; margin: 2mm; overflow: hidden; }
            ` : `
              @page { size: A6; margin: 3mm; }
              .receipt { width: calc(105mm - 6mm); height: calc(148mm - 6mm); padding: 5mm; font-size: 14px; line-height: 1.5; page-break-after: always; margin: 3mm; overflow: hidden; }
            `}
            .receipt-header { text-align: center; margin-bottom: 3mm; border-bottom: 2px solid #000; padding-bottom: 2mm; }
            .receipt-header .school-name { font-size: ${printFormat === 'a4-9' ? '16px' : printFormat === '3x5' ? '20px' : '22px'}; font-weight: bold; margin-bottom: 1mm; }
            .receipt-header .school-subtitle { font-size: ${printFormat === 'a4-9' ? '14px' : printFormat === '3x5' ? '18px' : '20px'}; font-weight: bold; margin-bottom: 1mm; }
            .receipt-header .location { font-size: ${printFormat === 'a4-9' ? '9px' : printFormat === '3x5' ? '12px' : '14px'}; margin-bottom: 1mm; }
            .receipt-header .receipt-title { font-size: ${printFormat === 'a4-9' ? '8px' : printFormat === '3x5' ? '11px' : '13px'}; margin-top: 1mm; font-weight: bold; text-decoration: underline; }
            .receipt-content { margin-bottom: 2mm; font-size: ${printFormat === 'a4-9' ? '9px' : printFormat === '3x5' ? '11px' : '13px'}; line-height: 1.4; }
            .receipt-content div { margin-bottom: 2px; display: flex; justify-content: space-between; }
            .receipt-content div strong { font-weight: bold; }
            .balance-section { margin-top: 2mm; padding-top: 2mm; border-top: 2px solid #000; font-size: ${printFormat === 'a4-9' ? '8px' : printFormat === '3x5' ? '10px' : '12px'}; }
            .balance-section div { display: flex; justify-content: space-between; margin-bottom: 1px; }
            .total-amount { font-weight: bold; border-top: 2px solid #000; padding-top: 2mm; margin-top: 2mm; font-size: ${printFormat === 'a4-9' ? '10px' : printFormat === '3x5' ? '13px' : '15px'}; text-align: center; }
            .footer { text-align: center; margin-top: 2mm; font-size: ${printFormat === 'a4-9' ? '7px' : printFormat === '3x5' ? '9px' : '11px'}; font-style: italic; border-top: 1px dashed #000; padding-top: 1mm; }
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
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 From Date (Optional)
               </label>
               <input
                 type="date"
                 value={fromDate}
                 onChange={(e) => setFromDate(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 To Date (Optional)
               </label>
               <input
                 type="date"
                 value={toDate}
                 onChange={(e) => setToDate(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>
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
        {printCriteria === 'class' && (
          <div className="mb-2 text-sm text-gray-600">
            <span className="font-medium">Selected:</span> Class {selectedClass}-{selectedDivision}
            {(fromDate || toDate) && (
              <div className="mt-1">
                <span className="font-medium">Date Range:</span>
                {fromDate && ` From ${new Date(fromDate).toLocaleDateString()}`}
                {toDate && ` To ${new Date(toDate).toLocaleDateString()}`}
                {!fromDate && !toDate && ' All dates'}
              </div>
            )}
          </div>
        )}
        {printCriteria === 'date' && (
          <div className="mb-2 text-sm text-gray-600">
            <span className="font-medium">Selected Date:</span> {new Date(selectedDate).toLocaleDateString()}
          </div>
        )}
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
                      <div className="school-name">Sarvodaya</div>
                      <div className="school-subtitle">Higher Secondary School</div>
                      <div className="location">Eachome</div>
                      <div className="receipt-title">Fee Payment Receipt</div>
                    </div>
                    <div className="receipt-content">
                      <div><strong>Name:</strong> <span>{student?.name}</span></div>
                      <div><strong>Adm No:</strong> <span>{payment.admissionNo}</span></div>
                      <div><strong>Class:</strong> <span>{student?.class}{student?.division ? `-${student.division}` : ''}</span></div>
                      <div><strong>Date:</strong> <span>{new Date(payment.paymentDate).toLocaleDateString()}</span></div>
                      <div><strong>Receipt #:</strong> <span>{payment.id.slice(-6)}</span></div>
                      <div style={{ borderTop: '1px solid #000', paddingTop: '2mm', marginTop: '2mm', marginBottom: '2mm' }}>
                        <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '1mm' }}>Fee Details</div>
                        {payment.developmentFee > 0 && <div><strong>Development Fee:</strong> <span>₹{payment.developmentFee}</span></div>}
                        {payment.busFee > 0 && <div><strong>Bus Fee:</strong> <span>₹{payment.busFee}</span></div>}
                        {payment.specialFee > 0 && <div><strong>{payment.specialFeeType || 'Other Fee'}:</strong> <span>₹{payment.specialFee}</span></div>}
                      </div>
                    </div>
                    <div className="total-amount">
                      TOTAL PAID: ₹{payment.totalAmount}
                    </div>
                    {(balance.devBalance > 0 || balance.busBalance > 0) && (
                      <div className="balance-section">
                        <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '1mm' }}>Remaining Balance</div>
                        {balance.devBalance > 0 && <div><strong>Development:</strong> <span>₹{balance.devBalance}</span></div>}
                        {balance.busBalance > 0 && <div><strong>Bus Fee:</strong> <span>₹{balance.busBalance}</span></div>}
                      </div>
                    )}
                    <div className="footer">
                      <div>Thank you for your payment!</div>
                      <div>Keep this receipt for your records</div>
                    </div>
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
                    <div className="school-name">Sarvodaya</div>
                    <div className="school-subtitle">Higher Secondary School</div>
                    <div className="location">Eachome</div>
                    <div className="receipt-title">Fee Payment Receipt</div>
                  </div>
                  <div className="receipt-content">
                   <div><strong>Student Name:</strong> <span>{student?.name}</span></div>
                   <div><strong>Admission No:</strong> <span>{payment.admissionNo}</span></div>
                   <div><strong>Class:</strong> <span>{student?.class}{student?.division ? `-${student.division}` : ''}</span></div>
                   <div><strong>Payment Date:</strong> <span>{new Date(payment.paymentDate).toLocaleDateString()}</span></div>
                   <div><strong>Receipt Number:</strong> <span>{payment.id.slice(-6)}</span></div>
                   <div style={{ borderTop: '1px solid #000', paddingTop: '3mm', marginTop: '3mm', marginBottom: '3mm' }}>
                     <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '2mm' }}>Fee Details</div>
                     {payment.developmentFee > 0 && <div><strong>Development Fee:</strong> <span>₹{payment.developmentFee}</span></div>}
                     {payment.busFee > 0 && <div><strong>Bus Fee:</strong> <span>₹{payment.busFee}</span></div>}
                     {payment.specialFee > 0 && <div><strong>{payment.specialFeeType || 'Other Fee'}:</strong> <span>₹{payment.specialFee}</span></div>}
                   </div>
                  </div>
                  <div className="total-amount">
                   TOTAL PAID: ₹{payment.totalAmount}
                  </div>
                  {(balance.devBalance > 0 || balance.busBalance > 0) && (
                    <div className="balance-section">
                     <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '2mm' }}>Remaining Balance</div>
                     {balance.devBalance > 0 && <div><strong>Development Fee:</strong> <span>₹{balance.devBalance}</span></div>}
                     {balance.busBalance > 0 && <div><strong>Bus Fee:</strong> <span>₹{balance.busBalance}</span></div>}
                    </div>
                  )}
                 <div className="footer">
                   <div>Thank you for your payment!</div>
                   <div>Keep this receipt for your records</div>
                 </div>
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