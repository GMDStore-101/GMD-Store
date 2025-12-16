import React, { useState } from 'react';
import { Customer } from '../types';
import { Search, DollarSign, Wallet, ArrowRight, X } from 'lucide-react';

interface CreditProps {
  customers: Customer[];
  onSettleDebt: (customerId: string, amount: number) => void;
}

const Credit: React.FC<CreditProps> = ({ customers, onSettleDebt }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

  const debtors = customers.filter(c => (c.totalDebt || 0) > 0);
  const totalReceivable = debtors.reduce((sum, c) => sum + c.totalDebt, 0);

  const filteredDebtors = debtors.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleOpenSettle = (customer: Customer) => {
      setSelectedCustomer(customer);
      setSettleAmount(0);
  };

  const handleSubmitSettle = () => {
      if (selectedCustomer && settleAmount > 0) {
          if (settleAmount > selectedCustomer.totalDebt) {
              alert('Amount cannot exceed total debt');
              return;
          }
          onSettleDebt(selectedCustomer.id, settleAmount);
          setSelectedCustomer(null);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Credit Book (Udhaar)</h2>
                <p className="text-gray-500 text-sm">Manage outstanding balances from customers</p>
            </div>
            <div className="bg-red-50 px-6 py-3 rounded-xl border border-red-100 flex items-center gap-3">
                 <div className="p-2 bg-red-100 rounded-full text-red-600"><Wallet size={20}/></div>
                 <div>
                     <p className="text-xs text-red-600 font-bold uppercase">Total Receivable</p>
                     <p className="text-xl font-bold text-gray-900">PKR {totalReceivable.toLocaleString()}</p>
                 </div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search debtors..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDebtors.map(customer => (
                    <div key={customer.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-gray-900">{customer.name}</h3>
                                <p className="text-sm text-gray-500">{customer.phone}</p>
                            </div>
                            <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                Udhaar
                            </div>
                        </div>
                        <div className="my-4">
                             <p className="text-xs text-gray-500 uppercase font-bold">Pending Amount</p>
                             <p className="text-2xl font-bold text-red-600">PKR {customer.totalDebt.toLocaleString()}</p>
                        </div>
                        <button 
                            onClick={() => handleOpenSettle(customer)}
                            className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2"
                        >
                            <DollarSign size={16}/> Settle Debt
                        </button>
                    </div>
                ))}
                {filteredDebtors.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                        No pending debts found.
                    </div>
                )}
            </div>
        </div>

        {/* SETTLE DEBT MODAL */}
        {selectedCustomer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-4 border-b pb-4">
                        <h3 className="font-bold text-lg text-gray-800">Receive Payment</h3>
                        <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    </div>
                    
                    <div className="mb-6">
                        <p className="text-sm text-gray-500 mb-1">Receiving from <span className="font-bold text-gray-800">{selectedCustomer.name}</span></p>
                        <p className="text-xs text-gray-400">Total Outstanding: PKR {selectedCustomer.totalDebt.toLocaleString()}</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Amount Received (Cash)</label>
                        <input 
                            type="number" 
                            className="w-full border-2 border-green-500 rounded-lg px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-200"
                            value={settleAmount}
                            onChange={e => setSettleAmount(parseInt(e.target.value) || 0)}
                            max={selectedCustomer.totalDebt}
                        />
                    </div>

                    <div className="flex gap-3">
                         <button onClick={() => setSelectedCustomer(null)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                         <button 
                            onClick={handleSubmitSettle} 
                            disabled={settleAmount <= 0}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            Confirm Payment
                         </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Credit;