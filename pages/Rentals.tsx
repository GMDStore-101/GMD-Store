import React, { useState, useEffect } from 'react';
import { Rental, RentalStatus, Customer, Product, RentalItem, Invoice, User, AppSettings } from '../types';
import { Calendar, Eye, FileText, Search, Plus, X, Trash, Download, ShoppingCart, User as UserIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface RentalsProps {
  rentals: Rental[];
  customers: Customer[];
  products: Product[];
  currentUser: User;
  settings: AppSettings;
  openNewRentalModal?: boolean; 
  onAddRental: (rental: Rental) => void;
  onUpdateRentalStatus: (id: string, status: RentalStatus) => void;
  onReturnItems: (
      rentalId: string, 
      returnedItems: { productId: string; qty: number }[], 
      createdBy: string, 
      returnDate: string, 
      discount: number,
      receivedAmount: number,
      previousDebt: number
  ) => Invoice | null;
  onDeleteRental: (id: string) => void;
}

const Rentals: React.FC<RentalsProps> = ({ 
    rentals, customers, products, currentUser, settings, openNewRentalModal, 
    onAddRental, onUpdateRentalStatus, onReturnItems, onDeleteRental 
}) => {
  const [isNewRentalOpen, setIsNewRentalOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState<1 | 2>(1); // 1: Products, 2: Checkout

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [selectedRentalForReturn, setSelectedRentalForReturn] = useState<Rental | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewingRentalInvoices, setViewingRentalInvoices] = useState<Rental | null>(null);
  
  useEffect(() => {
    if (openNewRentalModal) {
        setIsNewRentalOpen(true);
        setMobileStep(1);
    }
  }, [openNewRentalModal]);

  const [newRentalData, setNewRentalData] = useState({
    customerId: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedReturnDate: '',
    notes: '',
    advancePayment: 0
  });
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);

  // Return Logic State
  const [returnQuantities, setReturnQuantities] = useState<{ [key: string]: number }>({});
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [discount, setDiscount] = useState(0);
  const [collectedPayment, setCollectedPayment] = useState(0);

  // --- HELPERS ---

  const handleProductSelect = (productId: string) => {
    if (!selectedItems.find(i => i.productId === productId)) {
      setSelectedItems([...selectedItems, { productId, quantity: 1 }]);
    } else {
        // If already selected, just increment
        handleQuantityChange(productId, (selectedItems.find(i => i.productId === productId)?.quantity || 0) + 1);
    }
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    const max = product ? product.availableQuantity : 0;
    const validQty = Math.max(1, Math.min(qty, max));
    
    setSelectedItems(items => items.map(item => 
      item.productId === productId ? { ...item, quantity: validQty } : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(items => items.filter(i => i.productId !== productId));
  };

  const calculateNewOrderTotal = () => {
    return selectedItems.reduce((acc, item) => {
      const prod = products.find(p => p.id === item.productId);
      return acc + (prod ? prod.rate * item.quantity : 0);
    }, 0);
  };

  const handleSubmitNewRental = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === newRentalData.customerId);
    if (!customer || selectedItems.length === 0) return;

    const nextId = (rentals.length + 1).toString().padStart(2, '0');

    const items: RentalItem[] = selectedItems.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
            productId: item.productId,
            productName: prod?.name || 'Unknown',
            productImage: prod?.image || '',
            quantity: item.quantity,
            returnedQuantity: 0,
            unitPrice: prod?.rate || 0
        };
    });

    const newRental: Rental = {
        id: nextId,
        customerId: customer.id,
        customerName: customer.name,
        startDate: newRentalData.startDate,
        expectedReturnDate: newRentalData.expectedReturnDate,
        status: RentalStatus.ACTIVE,
        items: items,
        advancePayment: newRentalData.advancePayment,
        totalAmount: 0, 
        notes: newRentalData.notes,
        invoices: []
    };

    onAddRental(newRental);
    setIsNewRentalOpen(false);
    // Reset
    setNewRentalData({ customerId: '', startDate: new Date().toISOString().split('T')[0], expectedReturnDate: '', notes: '', advancePayment: 0 });
    setSelectedItems([]);
    setMobileStep(1);
  };

  const handleOpenReturnModal = (rental: Rental) => {
    setSelectedRentalForReturn(rental);
    const initial: {[key: string]: number} = {};
    rental.items.forEach(item => {
        initial[item.productId] = 0; 
    });
    setReturnQuantities(initial);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setDiscount(0);
    setCollectedPayment(0);
    setIsReturnModalOpen(true);
  };

  const calculateReturnBill = () => {
    if(!selectedRentalForReturn) return { total: 0, days: 0 };
    
    const start = new Date(selectedRentalForReturn.startDate);
    const end = new Date(returnDate);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const finalDays = Math.max(diffDays, 1); 

    let total = 0;
    selectedRentalForReturn.items.forEach(item => {
        const qtyToReturn = returnQuantities[item.productId] || 0;
        if(qtyToReturn > 0) {
            total += (qtyToReturn * item.unitPrice * finalDays);
        }
    });
    return { total, days: finalDays };
  };

  const handleSubmitReturn = () => {
     if(!selectedRentalForReturn) return;
     const customer = customers.find(c => c.id === selectedRentalForReturn.customerId);
     const previousDebt = customer ? (customer.totalDebt || 0) : 0;
     const itemsToReturn = (Object.entries(returnQuantities) as [string, number][])
        .filter(([_, qty]) => qty > 0)
        .map(([pid, qty]) => ({ productId: pid, qty }));
     
     if(itemsToReturn.length > 0) {
         const invoice = onReturnItems(
             selectedRentalForReturn.id, 
             itemsToReturn, 
             currentUser.username, 
             returnDate, 
             discount,
             collectedPayment,
             previousDebt
        );
         if (invoice) {
             setIsReturnModalOpen(false);
             setSelectedInvoice(invoice);
             setIsInvoiceModalOpen(true);
         }
     }
  };

  const openInvoice = (invoice: Invoice) => {
      setSelectedInvoice(invoice);
      setIsInvoiceModalOpen(true);
  };

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.ACTIVE: return 'bg-blue-100 text-blue-800';
      case RentalStatus.COMPLETED: return 'bg-gray-100 text-gray-800';
      case RentalStatus.OVERDUE: return 'bg-red-100 text-red-800';
      case RentalStatus.PARTIAL: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadPDF = async () => {
      const element = document.getElementById('invoice-content');
      if(!element) return;
      
      setIsDownloading(true);
      try {
        const canvas = await html2canvas(element, {
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Invoice_${selectedInvoice?.id || 'GMD'}.pdf`);
      } catch (err) {
          console.error(err);
          alert('Failed to generate PDF');
      } finally {
          setIsDownloading(false);
      }
  };

  // --- SIMPLE PLAIN INVOICE STYLE ---
  const InvoiceA4 = ({ invoice }: { invoice: Invoice }) => (
      <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-12 text-black font-sans relative flex flex-col">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
               <h1 className="text-3xl font-bold uppercase tracking-wide mb-1">{settings.storeName}</h1>
               <p className="text-sm font-bold text-gray-800 uppercase mb-1">Prop: {settings.ownerName}</p>
               <p className="text-gray-600">{settings.storeAddress}</p>
               <p className="text-gray-600 font-bold">{settings.storePhone}</p>
          </div>

          {/* Info Grid */}
          <div className="flex justify-between items-start mb-8">
              <div>
                  <h3 className="text-sm font-bold uppercase text-gray-500 mb-1">Bill To:</h3>
                  <h2 className="text-xl font-bold">{invoice.customerName}</h2>
                  <p className="text-gray-700">{invoice.customerPhone}</p>
                  <p className="text-gray-700">{invoice.customerAddress}</p>
              </div>
              <div className="text-right">
                  <div className="mb-1"><span className="font-bold">Invoice #:</span> {invoice.id}</div>
                  <div className="mb-1"><span className="font-bold">Date:</span> {invoice.date}</div>
                  <div className="mb-1"><span className="font-bold">Order Ref:</span> #{invoice.rentalId}</div>
                  <div><span className="font-bold">Operator:</span> {invoice.createdBy}</div>
              </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-gray-300 mb-6 text-sm">
              <thead>
                  <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left font-bold">Item Description</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-bold">Days</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-bold">Qty</th>
                      <th className="border border-gray-300 px-4 py-2 text-right font-bold">Total</th>
                  </tr>
              </thead>
              <tbody>
                  {invoice.items.map((item, i) => (
                      <tr key={i}>
                          <td className="border border-gray-300 px-4 py-2">{item.productName}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{item.days}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-bold">PKR {item.amount.toLocaleString()}</td>
                      </tr>
                  ))}
              </tbody>
          </table>

          {/* Summary Section */}
          <div className="flex justify-end mb-12">
              <div className="w-1/2 space-y-2 text-sm">
                  <div className="flex justify-between">
                      <span className="font-bold">Subtotal:</span>
                      <span>PKR {invoice.subTotal.toLocaleString()}</span>
                  </div>
                  {invoice.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                          <span>Discount:</span>
                          <span>- PKR {invoice.discount.toLocaleString()}</span>
                      </div>
                  )}
                  {invoice.advanceAdjusted && invoice.advanceAdjusted > 0 && (
                      <div className="flex justify-between text-green-600">
                          <span>Advance Deducted:</span>
                          <span>- PKR {invoice.advanceAdjusted.toLocaleString()}</span>
                      </div>
                  )}
                  
                  <div className="border-t border-black my-2"></div>
                  
                  <div className="flex justify-between font-bold text-lg">
                      <span>Net Total:</span>
                      <span>PKR {(invoice.totalAmount - (invoice.advanceAdjusted || 0)).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-500">
                      <span>Previous Balance:</span>
                      <span>+ PKR {(invoice.previousDebt || 0).toLocaleString()}</span>
                  </div>

                  <div className="border-t-2 border-black my-2"></div>

                  <div className="flex justify-between text-xl font-bold">
                      <span>Grand Total:</span>
                      <span>PKR {((invoice.totalAmount - (invoice.advanceAdjusted || 0)) + (invoice.previousDebt || 0)).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                      <span>Amount Received:</span>
                      <span>- PKR {invoice.receivedAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between font-bold text-lg bg-gray-100 p-2 border border-gray-300 mt-2">
                      <span>Balance Due:</span>
                      <span>PKR {invoice.balanceDue.toLocaleString()}</span>
                  </div>
              </div>
          </div>

          {/* Footer */}
          <div className="mt-auto">
              <div className="flex justify-between items-end pt-8">
                  <div className="text-center">
                      <div className="h-px w-40 bg-black mb-2"></div>
                      <p className="text-xs font-bold uppercase">Customer Signature</p>
                  </div>
                  <div className="text-center">
                      <div className="h-px w-40 bg-black mb-2"></div>
                      <p className="text-xs font-bold uppercase">Manager Signature</p>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Rental Orders</h2>
          <p className="text-gray-500 text-sm">Track active and past rentals</p>
        </div>
        <button 
          onClick={() => { setIsNewRentalOpen(true); setMobileStep(1); }}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 transition shadow-sm flex items-center gap-2"
        >
          <Plus size={18} /> New Rental Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rental ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoiced Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rentals.map((rental) => {
                 const invoicedTotal = (rental.invoices || []).reduce((sum, inv) => sum + inv.totalAmount, 0);

                 return (
                <tr key={rental.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{rental.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="font-medium">{rental.customerName}</div>
                      {rental.advancePayment > 0 && <div className="text-xs text-green-600 font-bold">Adv: {rental.advancePayment}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1"><Calendar size={14}/> {rental.startDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col gap-1">
                        {rental.items.map(i => (
                            <div key={i.productId} className="text-xs">
                                <span className="font-semibold">{i.productName}:</span> {i.returnedQuantity}/{i.quantity} returned
                            </div>
                        ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    PKR {invoicedTotal.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(rental.status)}`}>
                      {rental.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                        {rental.status !== RentalStatus.COMPLETED && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenReturnModal(rental); }}
                                className="bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 text-xs font-bold border border-blue-200"
                            >
                                Process Return
                            </button>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setViewingRentalInvoices(rental); }}
                            className="text-gray-400 hover:text-gray-600 transition" title="View Invoices"
                        >
                            <FileText size={18} />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(confirm('Delete this rental order? Inventory will not be restored automatically.')) {
                                    onDeleteRental(rental.id);
                                }
                            }}
                            className="text-gray-400 hover:text-red-600 transition" title="Delete"
                        >
                            <Trash size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              )})}
              {rentals.length === 0 && (
                  <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">No rentals found. Create a new order to get started.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* RESPONSIVE NEW RENTAL MODAL */}
       {isNewRentalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden h-[90vh] flex flex-col animate-fade-in">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Create New Rental Order</h3>
                    <button onClick={() => setIsNewRentalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                {/* Mobile Tabs */}
                <div className="lg:hidden flex border-b border-gray-200">
                    <button 
                        onClick={() => setMobileStep(1)}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mobileStep === 1 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    >
                        <ShoppingCart size={16} /> Select Items
                    </button>
                    <button 
                        onClick={() => setMobileStep(2)}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${mobileStep === 2 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    >
                        <UserIcon size={16} /> Checkout ({selectedItems.length})
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Left: Product Selection (Shown on Step 1 or Desktop) */}
                    <div className={`w-full lg:w-1/2 border-r border-gray-100 flex flex-col ${mobileStep === 1 ? 'block' : 'hidden lg:flex'}`}>
                        <div className="p-3 border-b bg-white sticky top-0 z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                <input type="text" placeholder="Search products..." className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white transition" />
                            </div>
                        </div>
                        <div className="overflow-y-auto p-3 grid grid-cols-2 gap-3 pb-20 lg:pb-3">
                            {products.map(p => {
                                const isSelected = selectedItems.some(i => i.productId === p.id);
                                return (
                                <div 
                                    key={p.id} 
                                    onClick={() => handleProductSelect(p.id)}
                                    className={`border rounded-lg p-2 cursor-pointer transition flex flex-col items-center text-center relative ${isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}
                                >
                                    {isSelected && <div className="absolute top-1 right-1 bg-blue-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">✓</div>}
                                    {p.image ? (
                                        <img src={p.image} alt={p.name} className="h-16 w-16 object-cover rounded mb-2" />
                                    ) : (
                                        <div className="h-16 w-16 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                    )}
                                    <div className="text-xs font-bold line-clamp-1">{p.name}</div>
                                    <div className="text-[10px] text-gray-500">Stock: {p.availableQuantity}</div>
                                    <div className="text-xs text-blue-600 font-bold mt-1">PKR {p.rate}</div>
                                </div>
                            )})}
                        </div>
                        {/* Mobile Next Floating Button */}
                        <div className="lg:hidden absolute bottom-4 right-4 left-4">
                            <button 
                                onClick={() => setMobileStep(2)}
                                className="w-full bg-slate-900 text-white py-3 rounded-lg shadow-lg font-bold flex justify-between px-6 items-center"
                            >
                                <span>{selectedItems.length} Items Selected</span>
                                <span className="flex items-center">Next <ArrowRight size={16} className="ml-2"/></span>
                            </button>
                        </div>
                    </div>

                    {/* Right: Order Details (Shown on Step 2 or Desktop) */}
                    <div className={`w-full lg:w-1/2 flex flex-col bg-gray-50 ${mobileStep === 2 ? 'block' : 'hidden lg:flex'}`}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <form id="rentalForm" onSubmit={handleSubmitNewRental}>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer</label>
                                    <select 
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                        value={newRentalData.customerId}
                                        onChange={(e) => setNewRentalData({...newRentalData, customerId: e.target.value})}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                     <div>
                                         <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Date</label>
                                         <input 
                                            type="date" required 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                            value={newRentalData.startDate} 
                                            readOnly 
                                         />
                                    </div>
                                    <div>
                                         <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expected Return</label>
                                         <input 
                                            type="date" 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                            value={newRentalData.expectedReturnDate} onChange={e => setNewRentalData({...newRentalData, expectedReturnDate: e.target.value})}
                                         />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Advance Payment (PKR)</label>
                                    <input 
                                        type="number" min="0" 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                        value={newRentalData.advancePayment}
                                        onChange={(e) => setNewRentalData({...newRentalData, advancePayment: parseInt(e.target.value) || 0})}
                                    />
                                </div>

                                <div className="mt-6">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Selected Items</label>
                                    {selectedItems.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-lg bg-white">No items selected</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedItems.map(item => {
                                                const prod = products.find(p => p.id === item.productId);
                                                return (
                                                    <div key={item.productId} className="flex items-center justify-between bg-white p-2 rounded border shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            {prod?.image && <img src={prod.image} className="w-8 h-8 rounded object-cover" alt=""/>}
                                                            <div className="text-sm font-medium w-32 truncate">{prod?.name}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" min="1" 
                                                                className="w-16 border rounded px-1 py-1 text-center text-sm"
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value))}
                                                            />
                                                            <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash size={14}/></button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4">
                                     <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Notes</label>
                                     <textarea 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                        rows={2}
                                        value={newRentalData.notes} onChange={e => setNewRentalData({...newRentalData, notes: e.target.value})}
                                     ></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t bg-white shadow-up">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-gray-600">Daily Rate Total:</span>
                                <span className="text-xl font-bold text-blue-600">PKR {calculateNewOrderTotal().toLocaleString()}</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setMobileStep(1)} className="lg:hidden px-4 py-3 bg-gray-100 rounded-lg text-gray-600"><ArrowLeft /></button>
                                <button type="submit" form="rentalForm" className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 shadow-lg">Confirm Order</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* RETURN ITEMS MODAL */}
      {isReturnModalOpen && selectedRentalForReturn && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Process Return</h3>
                    <button onClick={() => setIsReturnModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Return Date</label>
                        <input 
                            type="date" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={returnDate} 
                            onChange={(e) => setReturnDate(e.target.value)}
                        />
                         <p className="text-xs text-gray-500 mt-1">Start Date was: {selectedRentalForReturn.startDate}</p>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border rounded p-2 mb-4 bg-gray-50">
                        <label className="block text-xs font-bold text-gray-700 uppercase sticky top-0 bg-gray-50 pb-1">Items to Return</label>
                        {selectedRentalForReturn.items.map(item => {
                            const remaining = item.quantity; // Uses quantity directly as we reduce it now
                            if (remaining === 0) return null; 

                            return (
                                <div key={item.productId} className="flex justify-between items-center bg-white p-2 rounded border mt-2 shadow-sm">
                                    <div className="text-sm">
                                        <div className="font-medium">{item.productName}</div>
                                        <div className="text-xs text-gray-500">Current Qty: {remaining}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" min="0" max={remaining}
                                            className="w-16 border rounded px-1 text-center"
                                            value={returnQuantities[item.productId] || 0}
                                            onChange={(e) => setReturnQuantities({...returnQuantities, [item.productId]: Math.min(parseInt(e.target.value) || 0, remaining)})}
                                        />
                                        <span className="text-xs text-gray-500">qty</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount (PKR)</label>
                            <input 
                                type="number" min="0" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={discount} 
                                onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Amount Received (Cash)</label>
                            <input 
                                type="number" min="0" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 font-bold text-blue-800"
                                value={collectedPayment} 
                                onChange={(e) => setCollectedPayment(parseInt(e.target.value) || 0)}
                            />
                             <p className="text-[10px] text-gray-500 mt-1">Enter total cash collected from customer now.</p>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        {(() => {
                            // Find Customer Debt
                            const currentCust = customers.find(c => c.id === selectedRentalForReturn.customerId);
                            const prevDebt = currentCust ? (currentCust.totalDebt || 0) : 0;

                            const bill = calculateReturnBill();
                            const netBill = Math.max(0, bill.total - discount);
                            const totalAdvance = selectedRentalForReturn.advancePayment || 0;
                            
                            let advUsed = 0;
                            if(totalAdvance >= netBill) advUsed = netBill;
                            else advUsed = totalAdvance;

                            const currentPayable = netBill - advUsed;
                            const totalReceivable = currentPayable + prevDebt;
                            const balanceDue = Math.max(0, totalReceivable - collectedPayment);

                            return (
                                <>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Current Bill:</span>
                                        <span className="font-bold">PKR {bill.total.toLocaleString()}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm mb-1 text-red-600">
                                            <span>Discount:</span>
                                            <span>- PKR {discount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {advUsed > 0 && (
                                        <div className="flex justify-between text-sm mb-1 text-green-600">
                                            <span>Advance Adj:</span>
                                            <span>- PKR {advUsed.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-1 mt-1">
                                        <span>Net Current Bill:</span>
                                        <span>PKR {currentPayable.toLocaleString()}</span>
                                    </div>
                                     <div className="flex justify-between text-sm text-slate-500">
                                        <span>Previous Balance:</span>
                                        <span>+ PKR {prevDebt.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className="flex justify-between text-lg font-bold text-blue-800 border-t border-blue-200 pt-2 mt-2">
                                        <span>Total Receivable:</span>
                                        <span>PKR {totalReceivable.toLocaleString()}</span>
                                    </div>

                                    {balanceDue > 0 && (
                                        <div className="flex justify-between text-sm mt-2 text-red-600 font-bold bg-red-50 p-1 rounded">
                                            <span>New Balance Due:</span>
                                            <span>PKR {balanceDue.toLocaleString()}</span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    <div className="mt-4 flex gap-3">
                         <button onClick={() => setIsReturnModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                         <button onClick={handleSubmitReturn} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-bold">Generate Invoice</button>
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* RENTAL INVOICES LIST MODAL */}
      {viewingRentalInvoices && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg text-gray-800">Invoices for Rental #{viewingRentalInvoices.id}</h3>
                        <button onClick={() => setViewingRentalInvoices(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="p-6">
                      {viewingRentalInvoices.invoices && viewingRentalInvoices.invoices.length > 0 ? (
                          <div className="space-y-4">
                              {viewingRentalInvoices.invoices.map(inv => (
                                  <div key={inv.id} className="flex justify-between items-center border p-4 rounded-lg hover:bg-gray-50 transition cursor-pointer" onClick={() => {setViewingRentalInvoices(null); openInvoice(inv);}}>
                                      <div>
                                          <div className="font-bold text-gray-800">Invoice #{inv.id}</div>
                                          <div className="text-sm text-gray-500">{inv.date}</div>
                                          <div className="text-xs text-gray-400">Generated by: {inv.createdBy}</div>
                                      </div>
                                      <div className="text-right">
                                          <div className="font-bold text-blue-600">PKR {inv.totalAmount.toLocaleString()}</div>
                                          <div className="text-xs text-gray-400">{inv.items.length} line items</div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center text-gray-400 py-8">No invoices generated yet.</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* ACTUAL INVOICE MODAL FOR DOWNLOAD */}
      {isInvoiceModalOpen && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-200 p-8 h-full w-full overflow-y-auto flex justify-center">
                 <div className="relative">
                    <div className="absolute top-0 -right-16 flex flex-col gap-2 print:hidden">
                        <button onClick={() => setIsInvoiceModalOpen(false)} className="bg-white p-2 rounded-full text-gray-800 hover:bg-gray-100 shadow-lg"><X size={24}/></button>
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isDownloading}
                            className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 shadow-lg flex items-center justify-center"
                        >
                            {isDownloading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download size={24}/>}
                        </button>
                    </div>
                    
                    {/* INVOICE CONTENT */}
                    <div id="invoice-content" className="shadow-2xl">
                        <InvoiceA4 invoice={selectedInvoice} />
                    </div>
                 </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Rentals;