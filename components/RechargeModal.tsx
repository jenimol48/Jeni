import React, { useState } from 'react';
import type { Recharge } from '../types';

interface RechargeModalProps {
  currentBalance: number;
  onClose: () => void;
  onRecharge: (amount: number, paymentMethod: Recharge['paymentMethod']) => Promise<boolean>;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ currentBalance, onClose, onRecharge }) => {
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rechargeStatus, setRechargeStatus] = useState<'success' | 'fail' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<Recharge['paymentMethod']>('UPI');

  const presetAmounts = [100, 200, 500];

  const handleAmountSelect = (preset: number) => {
    setAmount(preset);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomAmount(value);
      setAmount(Number(value));
    }
  };
  
  const handleRecharge = async () => {
      if (amount <= 0) return;
      setIsProcessing(true);
      setRechargeStatus(null);
      const success = await onRecharge(amount, paymentMethod);
      setIsProcessing(false);
      setRechargeStatus(success ? 'success' : 'fail');
      if(success) {
          setTimeout(() => {
              onClose();
          }, 1500);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative transform transition-all animate-in slide-in-from-bottom-10 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Recharge Card</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Current Balance: ₹{currentBalance.toFixed(2)}</p>

        {!rechargeStatus ? (
        <>
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Amount</label>
            <div className="flex space-x-2">
            {presetAmounts.map(preset => (
                <button
                key={preset}
                onClick={() => handleAmountSelect(preset)}
                className={`flex-1 py-3 px-2 rounded-md font-semibold transition-colors ${
                    amount === preset && !customAmount ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
                >
                ₹{preset}
                </button>
            ))}
            </div>
        </div>

        <div className="mb-6">
            <label htmlFor="custom-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or Enter Amount</label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                <input
                type="text"
                id="custom-amount"
                inputMode="numeric"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="e.g., 300"
                className="w-full pl-7 pr-4 py-3 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
        </div>

        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
            <div className="flex space-x-2">
            {(['UPI', 'Card', 'Net Banking'] as const).map(method => (
                <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-3 px-2 rounded-md font-semibold transition-colors ${
                    paymentMethod === method ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
                >
                {method}
                </button>
            ))}
            </div>
        </div>


        <button
            onClick={handleRecharge}
            disabled={isProcessing || amount <= 0}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
            {isProcessing ? (
                <i className="fa-solid fa-spinner fa-spin text-xl"></i>
            ) : (
                `Pay ₹${amount}`
            )}
        </button>
        </>
        ) : (
            <div className="text-center py-8">
                {rechargeStatus === 'success' && (
                    <>
                        <i className="fa-solid fa-circle-check text-green-500 text-6xl mb-4"></i>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Recharge Successful!</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">₹{amount} has been added to your card.</p>
                    </>
                )}
                {rechargeStatus === 'fail' && (
                    <>
                        <i className="fa-solid fa-circle-xmark text-red-500 text-6xl mb-4"></i>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Recharge Failed</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">Please try again later.</p>
                        <button onClick={() => setRechargeStatus(null)} className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg">Try Again</button>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default RechargeModal;