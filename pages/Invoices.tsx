import React, { useState } from 'react';
import { Invoice, Rental, AppSettings } from '../types';
import { Search, FileText, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoicesProps {
    rentals: Rental[];
    settings: AppSettings;
}

const Invoices: React.FC<InvoicesProps> = ({ rentals, settings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Flatten all invoices
    const allInvoices = rentals.flatMap(r => r.invoices || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredInvoices = allInvoices.filter(inv => 
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                <h2 className="text-2xl font-bold text-gray-800">Invoice History</h2>
                <p className="text-gray-500 text-sm">View and download past generated invoices</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative max-w-md mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                    type="text" 
                    placeholder="Search invoices by ID or customer..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated By</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{inv.id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{inv.date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{inv.customerName}</td>
                                    <td className="px-6 py-4 font-bold text-blue-600">PKR {inv.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{inv.createdBy}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setSelectedInvoice(inv)} className="text-gray-400 hover:text-blue-600">
                                            <FileText size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No invoices found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* INVOICE MODAL FOR DOWNLOAD */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-200 p-8 h-full w-full overflow-y-auto flex justify-center">
                        <div className="relative">
                            <div className="absolute top-0 -right-16 flex flex-col gap-2 print:hidden">
                                <button onClick={() => setSelectedInvoice(null)} className="bg-white p-2 rounded-full text-gray-800 hover:bg-gray-100 shadow-lg"><X size={24}/></button>
                                <button 
                                    onClick={handleDownloadPDF} 
                                    disabled={isDownloading}
                                    className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 shadow-lg flex items-center justify-center"
                                >
                                    {isDownloading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download size={24}/>}
                                </button>
                            </div>
                            
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

export default Invoices;