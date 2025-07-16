import React, { useState } from 'react';
import { Printer, Calendar, Users, Download } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const BulkPrintBills: React.FC = () => {
  const { payments, students, feeConfig } = useData();
  const [printType, setPrintType] = useState<'date' | 'class'>('date');
  const [printFormat, setPrintFormat] = useState<'a4-9' | '3x5' | 'a6'>('a4-9');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const getFilteredPayments = () => {
    if (printType === 'date') {
      return payments.filter(payment => 
        new Date(payment.paymentDate).toDateString() === new Date(selectedDate).toDateString()
      );
    } else {
      let classPayments = payments.filter(payment => 
        payment.class === selectedClass && payment.division === selectedDivision
      );
      
      if (filterDate) {
        classPayments = classPayments.filter(payment =>
          new Date(payment.paymentDate).toDateString() === new Date(filterDate).toDateString()
        );
      }
      
      return classPayments;
    }
  };

  const printBulkBills = () => {
    const filteredPayments = getFilteredPayments();
    if (filteredPayments.length === 0) {
      alert('No payments found for the selected criteria');
      return;
    }

    // Calculate balances for each payment
    const paymentsWithBalance = filteredPayments.map(payment => {
      const student = students.find(s => s.id === payment.studentId);
      if (!student) return { ...payment, balance: { developmentBalance: 0, busBalance: 0 } };
      
      const studentPayments = payments.filter(p => p.studentId === payment.studentId);
      const totalPaidDevelopment = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
      const totalPaidBus = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
      
      const totalDevelopmentRequired = feeConfig.developmentFees[student.class] || 0;
      const totalBusRequired = feeConfig.busStops[student.busStop] || 0;
      
      return {
        ...payment,
        balance: {
          developmentBalance: Math.max(0, totalDevelopmentRequired - totalPaidDevelopment),
          busBalance: Math.max(0, totalBusRequired - totalPaidBus)
        }
      };
    });

    const printContent = document.getElementById('bulk-bills-print');
    if (printContent) {
      const newWindow = window.open('', '_blank');
      newWindow!.document.write(`
        <html>
          <head>
            <title>Bulk Payment Bills - ${printType === 'date' ? selectedDate : `Class ${selectedClass}-${selectedDivision}`}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 10px; 
                background: white;
                font-size: 10px;
              }
              .bills-container {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                page-break-inside: avoid;
              }
              .bill {
                width: 250px;
                height: 380px;
                border: 1px solid #000;
                padding: 10px;
                margin-bottom: 10px;
                font-size: 11px;
                line-height: 1.3;
                page-break-inside: avoid;
              }
              .bill-header {
                text-align: center;
                border-bottom: 1px solid #000;
                padding-bottom: 6px;
                margin-bottom: 8px;
              }
              .school-name {
                font-size: 13px;
                font-weight: bold;
                margin: 0 0 1px 0;
              }
              .school-subtitle {
                font-size: 11px;
                font-weight: bold;
                margin: 0 0 1px 0;
              }
              .location {
                font-size: 10px;
                margin: 0 0 3px 0;
              }
              .receipt-title {
                font-size: 9px;
                margin: 0;
              }
              .bill-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 11px;
              }
              .bill-total {
                border-top: 1px solid #000;
                padding-top: 6px;
                margin-top: 8px;
                font-weight: bold;
                font-size: 12px;
              }
              .bill-footer {
                text-align: center;
                margin-top: 8px;
                font-size: 9px;
                border-top: 1px solid #000;
                padding-top: 6px;
              }
              @media print {
                body { margin: 0; padding: 5px; }
                .bills-container { gap: 5px; }
                .bill { margin-bottom: 5px; }
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

  const downloadClassCSV = () => {
    if (!selectedClass || !selectedDivision) {
      alert('Please select class and division');
      return;
    }

    const classStudents = students.filter(s => s.class === selectedClass && s.division === selectedDivision);
    
    if (classStudents.length === 0) {
      alert('No students found for the selected class');
      return;
    }

    const headers = ['Admission No', 'Name', 'Mobile', 'Class', 'Division', 'Bus Stop', 'Bus Number', 'Trip Number'];
    const csvData = classStudents.map(student => [
      student.admissionNo,
      student.name,
      student.mobile,
      student.class,
      student.division,
      student.busStop,
      student.busNumber,
      student.tripNumber
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_${selectedClass}_${selectedDivision}_students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPayments = getFilteredPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Print Bills</h1>
        <p className="text-gray-600">Print multiple payment bills in A4 format</p>
      </div>

      {/* Print Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Print Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setPrintType('date')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              printType === 'date' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Date-wise Bills</div>
            <div className="text-sm text-gray-600">Print all bills for a specific date</div>
          </button>
          
          <button
            onClick={() => setPrintType('class')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              printType === 'class' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Class-wise Bills</div>
            <div className="text-sm text-gray-600">Print all bills for a specific class</div>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {printType === 'date' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Class</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(cls => (
                    <option key={cls} value={cls.toString()}>Class {cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Division</option>
                  {['A', 'B', 'C', 'D', 'E'].map(div => (
                    <option key={div} value={div}>Division {div}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date (Optional)</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={downloadClassCSV}
                  disabled={!selectedClass || !selectedDivision}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        {/* Print Format Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Print Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setPrintFormat('a4-9')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                printFormat === 'a4-9' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">A4 - 9 per Sheet</div>
              <div className="text-sm text-gray-600">9 receipts per A4 page</div>
            </button>
            
            <button
              onClick={() => setPrintFormat('3x5')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                printFormat === '3x5' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">3x5 Inch</div>
              <div className="text-sm text-gray-600">Individual 3x5 receipts</div>
            </button>
            
            <button
              onClick={() => setPrintFormat('a6')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                printFormat === 'a6' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">A6 Size</div>
              <div className="text-sm text-gray-600">Individual A6 receipts</div>
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Bills</div>
                <div className="text-xl font-bold text-gray-900">{filteredPayments.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-xl font-bold text-green-600">
                  ₹{filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Print Format</div>
                <div className="text-xl font-bold text-blue-600">
                  {printFormat === 'a4-9' ? 'A4 (9 per sheet)' : printFormat === '3x5' ? '3x5 Inch' : 'A6 Size'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <button
          onClick={printBulkBills}
          disabled={filteredPayments.length === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Printer className="h-5 w-5" />
          <span>Print {filteredPayments.length} Bills ({printFormat.toUpperCase()})</span>
        </button>
      </div>

      {/* Hidden Print Content */}
      {['a4-9', '3x5', 'a6'].map(format => (
        <div key={format} id={`bulk-bills-print-${format}`} style={{ display: 'none' }}>
          <div className="bills-container">
            {filteredPayments.map((payment) => {
              const student = students.find(s => s.id === payment.studentId);
              const studentPayments = payments.filter(p => p.studentId === payment.studentId);
              const totalPaidDevelopment = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
              const totalPaidBus = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
              
              // Get the correct fee key for classes 11 and 12 (class-division) or regular classes (class only)
              const feeKey = (student && (student.class === '11' || student.class === '12')) 
                ? `${student.class}-${student.division}` 
                : student?.class || '';
              const totalDevelopmentRequired = student ? (feeConfig.developmentFees[feeKey] || 0) : 0;
              const totalBusRequired = student ? (feeConfig.busStops[student.busStop] || 0) : 0;
              
              const developmentBalance = Math.max(0, totalDevelopmentRequired - totalPaidDevelopment);
              const busBalance = Math.max(0, totalBusRequired - totalPaidBus);
              
              return (
              <div key={payment.id} className="bill">
                <div className="bill-header">
                  <div className="school-name">Sarvodaya</div>
                  <div className="school-subtitle">Higher Secondary School</div>
                  <div className="location">Eachome</div>
                  <div className="receipt-title">Fee Payment Receipt</div>
                </div>
                
                <div className="bill-row">
                  <span>Receipt #:</span>
                  <span>{payment.id.slice(-6)}</span>
                </div>
                
                <div className="bill-row">
                  <span>Date:</span>
                  <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                </div>
                
                <div className="bill-row">
                  <span>Student:</span>
                  <span>{payment.studentName}</span>
                </div>
                
                <div className="bill-row">
                  <span>Adm No:</span>
                  <span>{payment.admissionNo}</span>
                </div>
                
                <div className="bill-row">
                  <span>Class:</span>
                  <span>{payment.class}-{payment.division}</span>
                </div>
                
                <div style={{ 
                  borderTop: '1px solid #000', 
                  paddingTop: format === 'a4-9' ? '2px' : '4px', 
                  marginTop: format === 'a4-9' ? '3px' : '6px', 
                  marginBottom: format === 'a4-9' ? '2px' : '4px' 
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: format === 'a4-9' ? '1px' : '2px', 
                    fontSize: format === 'a4-9' ? '8px' : format === '3x5' ? '10px' : '11px' 
                  }}>Fee Details:</div>
                  
                  {payment.developmentFee > 0 && (
                    <div className="bill-row">
                      <span>Development Fee:</span>
                      <span>₹{payment.developmentFee}</span>
                    </div>
                  )}
                  
                  {payment.busFee > 0 && (
                    <div className="bill-row">
                      <span>Bus Fee:</span>
                      <span>₹{payment.busFee}</span>
                    </div>
                  )}
                  
                  {payment.specialFee > 0 && (
                    <div className="bill-row">
                      <span>{payment.specialFeeType}:</span>
                      <span>₹{payment.specialFee}</span>
                    </div>
                  )}
                </div>
                
                <div className="bill-total">
                  <div className="bill-row">
                    <span>Total Amount:</span>
                    <span>₹{payment.totalAmount}</span>
                  </div>
                </div>
                
                {(developmentBalance > 0 || busBalance > 0) && (
                  <div className="bill-balance">
                    <div style={{ fontWeight: 'bold', marginBottom: format === 'a4-9' ? '1px' : '2px' }}>Remaining Balance:</div>
                    {developmentBalance > 0 && (
                      <div className="bill-row">
                        <span>Development:</span>
                        <span>₹{developmentBalance}</span>
                      </div>
                    )}
                    {busBalance > 0 && (
                      <div className="bill-row">
                        <span>Bus Fee:</span>
                        <span>₹{busBalance}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bill-footer">
                  <div>Thank you for your payment!</div>
                  <div>Keep this receipt for records</div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BulkPrintBills;