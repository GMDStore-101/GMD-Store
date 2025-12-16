import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Package, ShoppingCart, Users, ArrowRight, Plus, RotateCcw, Wallet } from 'lucide-react';
import { Rental, Product, RentalStatus, Customer } from '../types';

interface DashboardProps {
  rentals: Rental[];
  products: Product[];
  customersCount: number;
  customers: Customer[];
  onNavigate: (tab: string) => void;
  onCreateOrder: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ rentals, products, customersCount, customers, onNavigate, onCreateOrder }) => {
  // Metrics
  const activeRentalsList = rentals.filter(r => r.status === RentalStatus.ACTIVE || r.status === RentalStatus.PARTIAL);
  
  // Consolidate Active Rentals
  type CustomerRentalData = { customerName: string, totalItems: number, rentals: Rental[], advance: number };

  const consolidatedRentals = activeRentalsList.reduce((acc, rental) => {
      if (!acc[rental.customerId]) {
          acc[rental.customerId] = {
              customerName: rental.customerName,
              totalItems: 0,
              rentals: [],
              advance: 0
          };
      }
      const itemsOut = rental.items.reduce((sum, i) => sum + (i.quantity - i.returnedQuantity), 0);
      acc[rental.customerId].totalItems += itemsOut;
      acc[rental.customerId].rentals.push(rental);
      acc[rental.customerId].advance += (rental.advancePayment || 0);
      return acc;
  }, {} as Record<string, CustomerRentalData>);

  const consolidatedList: CustomerRentalData[] = Object.values(consolidatedRentals);
  const activeRentalsCount = activeRentalsList.length;

  const totalRevenue = rentals.reduce((sum, r) => {
      const rentalInvoiced = (r.invoices || []).reduce((isum, inv) => isum + inv.totalAmount, 0);
      return sum + rentalInvoiced;
  }, 0);
  
  const totalReceivable = customers ? customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0) : 0;
  
  const lowStockItems = products.filter(p => p.availableQuantity < (p.totalQuantity * 0.2)).length;

  const inventoryStatusData = [
    { name: 'Available', value: products.reduce((sum, p) => sum + p.availableQuantity, 0) },
    { name: 'Rented', value: products.reduce((sum, p) => sum + (p.totalQuantity - p.availableQuantity), 0) },
  ];

  const COLORS = ['#10B981', '#F97316'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
           <div className="text-sm text-gray-500">Live Status & Quick Actions</div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
             <button 
                onClick={() => onNavigate('rentals')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2 justify-center flex-1 md:flex-none"
            >
            <RotateCcw size={20} /> Returns
            </button>
            <button 
            onClick={onCreateOrder}
            className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2 justify-center flex-1 md:flex-none"
            >
            <Plus size={20} /> New Order
            </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Receivable (Udhaar)" 
          value={`PKR ${totalReceivable.toLocaleString()}`} 
          icon={<Wallet className="text-white" size={24} />}
          color="bg-red-500"
          onClick={() => onNavigate('credit')}
        />
        <MetricCard 
          title="Active Rentals" 
          value={activeRentalsCount.toString()} 
          icon={<ShoppingCart className="text-white" size={24} />}
          color="bg-blue-500"
          onClick={() => onNavigate('rentals')}
        />
        <MetricCard 
          title="Total Customers" 
          value={customersCount.toString()} 
          icon={<Users className="text-white" size={24} />}
          color="bg-purple-500"
          onClick={() => onNavigate('customers')}
        />
        <MetricCard 
          title="Low Stock Alert" 
          value={lowStockItems.toString()} 
          icon={<Package className="text-white" size={24} />}
          color="bg-orange-500"
          onClick={() => onNavigate('inventory')}
          isAlert={lowStockItems > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Active Orders (Consolidated) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h3 className="text-lg font-semibold text-gray-800">Active Customers (Rentals)</h3>
             <button onClick={() => onNavigate('rentals')} className="text-blue-600 text-sm hover:underline flex items-center">View All <ArrowRight size={14} className="ml-1"/></button>
          </div>
          <div className="overflow-x-auto flex-1">
             <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500">
                   <tr>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Total Items Out</th>
                      <th className="px-6 py-3">Total Advance</th>
                      <th className="px-6 py-3">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {consolidatedList.slice(0, 5).map((data, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                         <td className="px-6 py-4 font-medium text-gray-800">{data.customerName}</td>
                         <td className="px-6 py-4">{data.totalItems} items</td>
                         <td className="px-6 py-4 font-bold text-green-600">PKR {data.advance.toLocaleString()}</td>
                         <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                               Active
                            </span>
                         </td>
                      </tr>
                   ))}
                   {consolidatedList.length === 0 && (
                      <tr>
                         <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No active rentals found</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* Inventory Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Distribution</h3>
          {products.length === 0 ? (
             <div className="h-64 flex items-center justify-center text-gray-400 text-center">
                Add products to<br/>see analytics
             </div>
          ) : (
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {inventoryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-xl font-bold text-gray-800">
                    {products.reduce((acc, p) => acc + p.totalQuantity, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 space-y-2">
             <div className="flex justify-between text-sm">
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>Available</span>
                <span className="font-bold">{inventoryStatusData[0].value}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>Rented Out</span>
                <span className="font-bold">{inventoryStatusData[1].value}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; onClick: () => void; isAlert?: boolean }> = ({ title, value, icon, color, onClick, isAlert }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition transform hover:-translate-y-1 ${isAlert ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900 mt-2">{value}</h4>
      </div>
      <div className={`p-3 rounded-lg ${color} shadow-lg shadow-opacity-20`}>
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;