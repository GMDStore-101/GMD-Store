import React, { useState } from 'react';
import { Customer, CustomerTier } from '../types';
import { Phone, MapPin, Award, Search, Edit, Trash2, X, Plus, UserCheck, CreditCard, Eye, FileText, Printer, Wallet } from 'lucide-react';
import { formatCNIC, formatPhoneNumber } from '../utils/format';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    address: '',
    cnic: '',
    photo: '',
    cnicFront: '',
    cnicBack: '',
    guarantorName: '',
    guarantorPhone: '',
    tier: CustomerTier.NEW,
    totalSpent: 0,
    totalDebt: 0,
    activeRentalsCount: 0,
    rating: 5
  });

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
        cnic: '',
        photo: '',
        cnicFront: '',
        cnicBack: '',
        guarantorName: '',
        guarantorPhone: '',
        tier: CustomerTier.NEW,
        totalSpent: 0,
        totalDebt: 0,
        activeRentalsCount: 0,
        rating: 5
      });
    }
    setIsModalOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
      setViewCustomer(customer);
      setIsViewModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'cnicFront' | 'cnicBack') => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData(prev => ({ ...prev, [field]: url }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) });
  };
  
  const handleGuarantorPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, guarantorPhone: formatPhoneNumber(e.target.value) });
  };

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, cnic: formatCNIC(e.target.value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      onUpdateCustomer({ ...editingCustomer, ...formData } as Customer);
    } else {
      const newCustomer: Customer = {
        id: `c${Date.now()}`,
        ...formData
      } as Customer;
      onAddCustomer(newCustomer);
    }
    setIsModalOpen(false);
  };

  const getTierColor = (tier: CustomerTier) => {
    switch (tier) {
      case CustomerTier.PLATINUM: return 'bg-slate-800 text-white border-slate-600';
      case CustomerTier.GOLD: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case CustomerTier.SILVER: return 'bg-gray-100 text-gray-800 border-gray-200';
      case CustomerTier.BRONZE: return 'bg-orange-50 text-orange-800 border-orange-200';
      default: return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.cnic.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
          <p className="text-gray-500 text-sm">Manage client relationships, documents, and guarantors</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={18} /> Add New Customer
        </button>
      </div>

       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search customers by name, phone or CNIC..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition relative group">
            
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                <button 
                    onClick={(e) => { e.stopPropagation(); handleViewCustomer(customer); }} 
                    className="bg-white shadow text-gray-500 hover:text-blue-600 p-1.5 rounded-md"
                    title="View Full Details"
                >
                    <Eye size={16} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(customer); }} 
                    className="bg-white shadow text-gray-500 hover:text-blue-600 p-1.5 rounded-md"
                    title="Edit"
                >
                    <Edit size={16} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm('Delete Customer?')) onDeleteCustomer(customer.id); }} 
                    className="bg-white shadow text-gray-500 hover:text-red-600 p-1.5 rounded-md"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex items-start gap-4 mb-4 cursor-pointer" onClick={() => handleViewCustomer(customer)}>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {customer.photo ? (
                  <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {customer.name.substring(0, 2).toUpperCase()}
                   </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition">{customer.name}</h3>
                <div className="text-xs text-gray-500 mb-1">CNIC: {customer.cnic}</div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getTierColor(customer.tier)}`}>
                    <Award size={10} className="mr-1" /> {customer.tier}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4 cursor-pointer" onClick={() => handleViewCustomer(customer)}>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="truncate">{customer.address}</span>
              </div>
              <div className="flex items-center gap-2">
                 <UserCheck size={14} className="text-gray-400" />
                 <span className="text-xs">Guarantor: {customer.guarantorName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="text-lg font-bold text-blue-600">Rs. {customer.totalSpent.toLocaleString()}</p>
              </div>
              <div className="text-center border-l border-gray-100">
                <p className="text-xs text-gray-500">Current Debt</p>
                <p className={`text-lg font-bold ${customer.totalDebt > 0 ? 'text-red-600' : 'text-gray-900'}`}>Rs. {(customer.totalDebt || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD/EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input 
                            type="text" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input 
                            type="text" required
                            placeholder="0300-1234567"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={formData.phone} onChange={handlePhoneChange}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Number</label>
                        <input 
                            type="text"
                            placeholder="35202-1234567-8"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={formData.cnic} onChange={handleCNICChange}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input 
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                     </div>
                </div>

                <div className="border-t pt-4 mt-2">
                    <h4 className="text-sm font-bold text-gray-800 mb-3">Guarantor Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor Name</label>
                            <input 
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.guarantorName} onChange={e => setFormData({...formData, guarantorName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor Phone</label>
                            <input 
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.guarantorPhone} onChange={handleGuarantorPhoneChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4 mt-2">
                     <h4 className="text-sm font-bold text-gray-800 mb-3">Documents & Photos</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Customer Photo</label>
                             <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:bg-gray-50 cursor-pointer relative h-32 flex items-center justify-center">
                                 {formData.photo ? (
                                     <img src={formData.photo} className="h-full w-full object-contain" alt="Preview"/>
                                 ) : (
                                     <span className="text-gray-400 text-xs">Upload Photo</span>
                                 )}
                                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'photo')} />
                             </div>
                         </div>
                         <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">CNIC Front</label>
                             <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:bg-gray-50 cursor-pointer relative h-32 flex items-center justify-center">
                                 {formData.cnicFront ? (
                                     <img src={formData.cnicFront} className="h-full w-full object-contain" alt="Preview"/>
                                 ) : (
                                     <span className="text-gray-400 text-xs">Upload Front</span>
                                 )}
                                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'cnicFront')} />
                             </div>
                         </div>
                         <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">CNIC Back</label>
                             <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:bg-gray-50 cursor-pointer relative h-32 flex items-center justify-center">
                                 {formData.cnicBack ? (
                                     <img src={formData.cnicBack} className="h-full w-full object-contain" alt="Preview"/>
                                 ) : (
                                     <span className="text-gray-400 text-xs">Upload Back</span>
                                 )}
                                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'cnicBack')} />
                             </div>
                         </div>
                     </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Customer</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW FULL DETAILS MODAL (PRINTABLE) */}
      {isViewModalOpen && viewCustomer && (
           <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-3xl shadow-2xl overflow-hidden rounded-xl animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:hidden">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600"/> Customer File: {viewCustomer.name}
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"><Printer size={16}/> Print File</button>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                  </div>
                  
                  <div className="p-8 overflow-y-auto print-modal">
                      <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                           <h1 className="text-3xl font-bold uppercase text-gray-800">Customer Profile</h1>
                           <p className="text-gray-500">Registered Client Record</p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-8 mb-8">
                          <div className="w-40 h-40 bg-gray-200 rounded-lg overflow-hidden border-4 border-white shadow-lg mx-auto md:mx-0">
                                {viewCustomer.photo ? (
                                    <img src={viewCustomer.photo} className="w-full h-full object-cover" alt="Customer"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 bg-gray-100">No Img</div>
                                )}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Full Name</label>
                                    <p className="text-lg font-medium text-gray-900">{viewCustomer.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">CNIC Number</label>
                                    <p className="text-lg font-medium text-gray-900 font-mono">{viewCustomer.cnic}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Phone Number</label>
                                    <p className="text-lg font-medium text-gray-900 font-mono">{viewCustomer.phone}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Customer Tier</label>
                                    <p className="text-lg font-medium text-blue-600">{viewCustomer.tier}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-gray-500 uppercase font-bold">Address</label>
                                    <p className="text-gray-900">{viewCustomer.address}</p>
                                </div>
                          </div>
                      </div>

                      <div className="mb-8">
                          <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Guarantor Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Guarantor Name</label>
                                    <p className="text-base font-medium text-gray-900">{viewCustomer.guarantorName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Guarantor Phone</label>
                                    <p className="text-base font-medium text-gray-900 font-mono">{viewCustomer.guarantorPhone}</p>
                                </div>
                          </div>
                      </div>

                      <div className="mb-8 page-break-inside-avoid">
                          <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Identification Documents</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <p className="text-sm font-bold text-gray-500 mb-2">CNIC Front</p>
                                  <div className="h-48 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                                      {viewCustomer.cnicFront ? (
                                          <img src={viewCustomer.cnicFront} className="w-full h-full object-contain" alt="CNIC Front"/>
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 italic">No Front Image</div>
                                      )}
                                  </div>
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-gray-500 mb-2">CNIC Back</p>
                                  <div className="h-48 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                                      {viewCustomer.cnicBack ? (
                                          <img src={viewCustomer.cnicBack} className="w-full h-full object-contain" alt="CNIC Back"/>
                                      ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400 italic">No Back Image</div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div>
                          <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Financial Summary</h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 bg-blue-50 rounded-lg text-center">
                                  <p className="text-sm text-blue-600 font-bold uppercase">Lifetime Spend</p>
                                  <p className="text-2xl font-bold text-gray-900">PKR {viewCustomer.totalSpent.toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-green-50 rounded-lg text-center">
                                  <p className="text-sm text-green-600 font-bold uppercase">Rentals</p>
                                  <p className="text-2xl font-bold text-gray-900">{viewCustomer.activeRentalsCount}</p>
                              </div>
                              <div className="p-4 bg-red-50 rounded-lg text-center">
                                  <p className="text-sm text-red-600 font-bold uppercase">Pending Balance</p>
                                  <p className="text-2xl font-bold text-gray-900">PKR {(viewCustomer.totalDebt || 0).toLocaleString()}</p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
           </div>
      )}
    </div>
  );
};

export default Customers;