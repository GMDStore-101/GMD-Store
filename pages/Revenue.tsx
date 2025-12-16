import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, DollarSign, ArrowUpRight, Filter } from 'lucide-react';
import { Rental } from '../types';

interface RevenueProps {
  rentals: Rental[];
}

const Revenue: React.FC<RevenueProps> = ({ rentals }) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Process Real Data
  const chartData = useMemo(() => {
    const dataMap: { [key: string]: { revenue: number, orders: number } } = {};
    
    // Flatten all invoices from all rentals
    const allInvoices = rentals.flatMap(r => r.invoices || []);

    if (allInvoices.length === 0) return [];

    allInvoices.forEach(inv => {
        const date = new Date(inv.date);
        
        // Filter by Custom Range
        if (timeframe === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            if (date < start || date > end) return;
        }

        let key = '';
        
        if (timeframe === 'daily' || timeframe === 'custom') {
            key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (timeframe === 'weekly') {
             // Calculate start of week (Sunday)
             const day = date.getDay();
             const diff = date.getDate() - day;
             const weekStart = new Date(date.setDate(diff));
             key = `Week of ${weekStart.toISOString().split('T')[0]}`;
        } else {
            key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        }

        if (!dataMap[key]) {
            dataMap[key] = { revenue: 0, orders: 0 };
        }
        dataMap[key].revenue += inv.totalAmount;
        dataMap[key].orders += 1;
    });

    return Object.entries(dataMap).map(([name, data]) => ({
        name,
        revenue: data.revenue,
        orders: data.orders
    })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  }, [rentals, timeframe, customStartDate, customEndDate]);

  const totalRevenue = chartData.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalOrders = chartData.reduce((acc, curr) => acc + curr.orders, 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Financial Performance</h2>
          <p className="text-gray-500 text-sm">Track your actual realized revenue from invoices</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
            <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex overflow-x-auto">
            {(['daily', 'weekly', 'monthly', 'custom'] as const).map((t) => (
                <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    timeframe === t 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
            ))}
            </div>
            
            {timeframe === 'custom' && (
                <div className="flex gap-2 items-center bg-white p-1 rounded-lg border border-gray-200">
                    <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="border rounded px-2 py-1 text-sm"/>
                    <span className="text-gray-400">-</span>
                    <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="border rounded px-2 py-1 text-sm"/>
                </div>
            )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">PKR {totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Invoices Generated</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{totalOrders}</h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <ReceiptIcon />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Invoice Value</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">PKR {averageOrderValue.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <Calendar size={18} className="mr-2 text-gray-400" />
            Revenue Timeline
        </h3>
        {chartData.length === 0 ? (
            <div className="h-96 w-full flex items-center justify-center text-gray-400">
                No revenue data available yet. Generate invoices to see charts.
            </div>
        ) : (
            <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6B7280', fontSize: 12}}
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `Rs. ${value >= 1000 ? (value/1000) + 'k' : value}`} 
                    tick={{fill: '#6B7280', fontSize: 12}}
                />
                <Tooltip 
                    formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        )}
      </div>
    </div>
  );
};

const ReceiptIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 17V7"/>
  </svg>
);

export default Revenue;