/**
 * @file components/departments/LoanCard.tsx
 * @description Individual loan display card
 * @created 2025-11-13
 */

'use client';

interface LoanCardProps {
  loan: {
    _id: string;
    loanType: string;
    principal: number;
    balance: number;
    interestRate: number;
    monthlyPayment: number;
    status: string;
    nextPaymentDate: string;
    remainingPayments: number;
    percentPaidOff: number;
  };
  onUpdate: () => void;
}

export default function LoanCard({ loan }: LoanCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'PaidOff':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Defaulted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{loan.loanType} Loan</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(loan.status)}`}>
          {loan.status}
        </span>
      </div>

      {/* Loan Details */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Principal:</span>
          <span className="font-semibold">${loan.principal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Balance:</span>
          <span className="font-semibold">${loan.balance.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Interest Rate:</span>
          <span className="font-semibold">{loan.interestRate.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment:</span>
          <span className="font-semibold">${loan.monthlyPayment.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Remaining Payments:</span>
          <span className="font-semibold">{loan.remainingPayments}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Paid Off</span>
          <span className="text-xs font-semibold">{loan.percentPaidOff.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${loan.percentPaidOff}%` }}
          />
        </div>
      </div>

      {/* Next Payment */}
      {loan.status === 'Active' && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Next Payment Due:</p>
          <p className="text-sm font-semibold">
            {new Date(loan.nextPaymentDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
