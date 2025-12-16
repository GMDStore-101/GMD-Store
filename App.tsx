import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Rentals from './pages/Rentals';
import Customers from './pages/Customers';
import Revenue from './pages/Revenue';
import Login from './pages/Login';
import UsersPage from './pages/Users';
import Settings from './pages/Settings';
import Invoices from './pages/Invoices'; 
import Credit from './pages/Credit';
import { api } from './services/api';
import { Menu } from 'lucide-react';
import { User, UserRole, Product, Customer, Rental, RentalStatus, Invoice, AppSettings } from './types';

// Default Admin User (For first run)
const DEFAULT_ADMIN: User = {
  id: 'u1',
  username: 'sajjad900',
  password: 'Sajjad@2022',
  name: 'Sajjad Ahmad',
  role: UserRole.ADMIN
};

const App: React.FC = () => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [openNewRentalModal, setOpenNewRentalModal] = useState(false);

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [settings, setSettings] = useState<AppSettings>(api.getSettings());

  // Initial Load
  useEffect(() => {
    const loadedUsers = api.getUsers();
    if(loadedUsers.length === 0) {
        api.saveUsers([DEFAULT_ADMIN]);
        setUsers([DEFAULT_ADMIN]);
    } else {
        setUsers(loadedUsers);
    }
    setProducts(api.getProducts());
    setCustomers(api.getCustomers());
    setRentals(api.getRentals());
  }, []);

  // --- PERSISTENCE ---
  // Rely exclusively on these effects for saving to avoid race conditions in delete handlers
  useEffect(() => api.saveUsers(users), [users]);
  useEffect(() => api.saveProducts(products), [products]);
  useEffect(() => api.saveCustomers(customers), [customers]);
  useEffect(() => api.saveRentals(rentals), [rentals]);
  useEffect(() => api.saveSettings(settings), [settings]);

  // --- AUTH HANDLERS ---
  const handleLogin = (u: string, p: string) => {
    const foundUser = users.find(user => user.username === u && user.password === p);
    if (foundUser) {
      setCurrentUser(foundUser);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // --- DATA HANDLERS ---
  
  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    setUsers(prev => [...prev, { ...newUser, id: `u${Date.now()}` }]);
  };
  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };
  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if(currentUser && currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser);
      }
  };

  // Inventory - FIXED DELETION: Only update state, let useEffect handle save
  const handleAddProduct = (prod: Product) => setProducts(prev => [...prev, prod]);
  const handleUpdateProduct = (prod: Product) => setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
  const handleDeleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Customers - FIXED DELETION: Only update state
  const handleAddCustomer = (cust: Customer) => setCustomers(prev => [...prev, cust]);
  const handleUpdateCustomer = (cust: Customer) => setCustomers(prev => prev.map(c => c.id === cust.id ? cust : c));
  const handleDeleteCustomer = (id: string) => {
      setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // Credit / Udhaar Settlement
  const handleSettleDebt = (customerId: string, amount: number) => {
      setCustomers(prev => prev.map(c => {
          if (c.id === customerId) {
              return { ...c, totalDebt: Math.max(0, (c.totalDebt || 0) - amount) };
          }
          return c;
      }));
  };

  // Rentals
  const handleAddRental = (rent: Rental) => {
    // 1. Update Inventory Stock
    const updatedProducts = products.map(p => {
        const item = rent.items.find(i => i.productId === p.id);
        if(item) {
            return { ...p, availableQuantity: p.availableQuantity - item.quantity };
        }
        return p;
    });
    setProducts(updatedProducts);

    // 2. Check if Customer has an ACTIVE rental profile
    const existingRentalIndex = rentals.findIndex(r => r.customerId === rent.customerId && r.status === RentalStatus.ACTIVE);

    if (existingRentalIndex > -1) {
        // MERGE INTO EXISTING
        const updatedRentals = [...rentals];
        const existingRental = updatedRentals[existingRentalIndex];
        
        // Update Advance Payment (Accumulate)
        const newAdvance = (existingRental.advancePayment || 0) + (rent.advancePayment || 0);
        
        // Merge Items
        const newItemsList = [...existingRental.items];
        rent.items.forEach(newItem => {
            const existingItemIndex = newItemsList.findIndex(i => i.productId === newItem.productId);
            if (existingItemIndex > -1) {
                newItemsList[existingItemIndex].quantity += newItem.quantity;
            } else {
                newItemsList.push(newItem);
            }
        });

        updatedRentals[existingRentalIndex] = {
            ...existingRental,
            advancePayment: newAdvance,
            items: newItemsList
        };
        setRentals(updatedRentals);
    } else {
        // CREATE NEW
        setRentals([rent, ...rentals]);
    }
    
    setOpenNewRentalModal(false); 
  };

  const handleDeleteRental = (id: string) => {
      setRentals(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateRentalStatus = (id: string, status: RentalStatus) => {
    setRentals(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  // Return Items - Generates Invoice
  const handleReturnItems = (
      rentalId: string, 
      returnedItems: { productId: string; qty: number }[], 
      createdBy: string, 
      returnDate: string, 
      discount: number = 0,
      receivedAmount: number = 0,
      previousDebt: number = 0 // New Parameter
    ): Invoice | null => {
    
    const rental = rentals.find(r => r.id === rentalId);
    if(!rental) return null;

    // FIND CUSTOMER FIRST to ensure we have the name for the invoice
    const customer = customers.find(c => c.id === rental.customerId);
    const customerName = customer ? customer.name : 'Unknown';
    const customerPhone = customer ? customer.phone : '';
    const customerAddress = customer ? customer.address : '';

    // 1. Calculate Invoice Amount (Original Start Date to Return Date)
    const start = new Date(rental.startDate);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
    
    let subTotal = 0;
    const invoiceItems: any[] = [];

    // 2. Update Rental Items (Reduce Quantity)
    const updatedItems = rental.items.map(item => {
        const returned = returnedItems.find(r => r.productId === item.productId);
        if (returned) {
             const amount = returned.qty * item.unitPrice * diffDays;
             subTotal += amount;
             invoiceItems.push({
                 productName: item.productName,
                 quantity: returned.qty,
                 days: diffDays,
                 amount: amount
             });
             return { ...item, quantity: item.quantity - returned.qty };
        }
        return item;
    }).filter(item => item.quantity > 0); 

    // 3. Determine New Status
    const newStatus = updatedItems.length === 0 ? RentalStatus.COMPLETED : RentalStatus.ACTIVE;

    // 4. Update Product Stock
    const updatedProducts = products.map(p => {
        const returned = returnedItems.find(r => r.productId === p.id);
        if(returned) {
            return { ...p, availableQuantity: p.availableQuantity + returned.qty };
        }
        return p;
    });
    setProducts(updatedProducts);

    // 5. Financial Calculations
    const totalAdvanceAvailable = rental.advancePayment || 0;
    const netBillAfterDiscount = Math.max(0, subTotal - discount);
    
    // Auto-adjust Advance first
    let advanceAdjusted = 0;
    let remainingAdvance = totalAdvanceAvailable;

    if (totalAdvanceAvailable > 0) {
        if (totalAdvanceAvailable >= netBillAfterDiscount) {
            advanceAdjusted = netBillAfterDiscount;
            remainingAdvance = totalAdvanceAvailable - netBillAfterDiscount;
        } else {
            advanceAdjusted = totalAdvanceAvailable;
            remainingAdvance = 0;
        }
    }
    
    // Logic:
    // Current Payable = Bill - Advance
    // Total Outstanding = Current Payable + Previous Debt
    // New Balance Due = Total Outstanding - Received Amount
    
    const currentPayable = netBillAfterDiscount - advanceAdjusted;
    const totalOutstanding = currentPayable + previousDebt;
    const balanceDue = Math.max(0, totalOutstanding - receivedAmount);

    // 6. Update Customer stats & Debt
    const updatedCustomers = customers.map(c => {
        if(c.id === rental.customerId) {
            const updatedC = { 
                ...c, 
                totalSpent: c.totalSpent + subTotal,
                totalDebt: balanceDue // Set to the new calculated balance
            }; 
            return api.recalculateCustomerTier(updatedC);
        }
        return c;
    });
    setCustomers(updatedCustomers);

    // 7. Generate Invoice
    const totalInvoices = rentals.reduce((count, r) => count + (r.invoices ? r.invoices.length : 0), 0);
    const nextInvoiceId = (totalInvoices + 1).toString().padStart(2, '0');

    const newInvoice: Invoice = {
        id: nextInvoiceId,
        rentalId: rental.id,
        date: returnDate,
        items: invoiceItems,
        subTotal: subTotal,
        discount: discount,
        totalAmount: netBillAfterDiscount, // Current Bill
        advanceAdjusted: advanceAdjusted,
        
        previousDebt: previousDebt, // Recorded history
        receivedAmount: receivedAmount,
        balanceDue: balanceDue,
        
        isPaid: balanceDue === 0,
        createdBy: createdBy,
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress
    };

    const updatedRental: Rental = {
        ...rental,
        items: updatedItems,
        status: newStatus,
        startDate: rental.startDate, // No Reset
        advancePayment: remainingAdvance, 
        totalAmount: rental.totalAmount + subTotal,
        invoices: [...(rental.invoices || []), newInvoice]
    };

    setRentals(prevRentals => prevRentals.map(r => r.id === rentalId ? updatedRental : r));
    
    return newInvoice; 
  };
  
  const handleCreateOrder = () => {
      setActiveTab('rentals');
      setOpenNewRentalModal(true);
  };

  // --- RENDERING ---

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
            rentals={rentals} 
            products={products} 
            customersCount={customers.length} 
            customers={customers} // Pass customers for debt calc
            onNavigate={setActiveTab}
            onCreateOrder={handleCreateOrder}
        />;
      case 'revenue':
        return <Revenue rentals={rentals} />;
      case 'credit':
        return <Credit customers={customers} onSettleDebt={handleSettleDebt} />;
      case 'inventory':
        return <Inventory 
          products={products} 
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
        />;
      case 'rentals':
        return <Rentals 
          rentals={rentals} 
          customers={customers}
          products={products}
          currentUser={currentUser}
          settings={settings}
          openNewRentalModal={openNewRentalModal}
          onAddRental={handleAddRental}
          onUpdateRentalStatus={handleUpdateRentalStatus}
          onReturnItems={handleReturnItems}
          onDeleteRental={handleDeleteRental}
        />;
      case 'invoices':
        return <Invoices rentals={rentals} settings={settings} />;
      case 'customers':
        const customersWithCounts = customers.map(c => {
            const count = rentals.filter(r => r.customerId === c.id && (r.status === RentalStatus.ACTIVE || r.status === RentalStatus.PARTIAL)).length;
            return { ...c, activeRentalsCount: count };
        });
        return <Customers 
          customers={customersWithCounts} 
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
        />;
      case 'users':
        return <UsersPage 
          users={users} 
          currentUser={currentUser} 
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
          onUpdateUser={handleUpdateUser}
        />;
      case 'settings':
        return <Settings settings={settings} onUpdateSettings={setSettings} />;
      default:
        return <Dashboard rentals={rentals} products={products} customersCount={customers.length} customers={customers} onNavigate={setActiveTab} onCreateOrder={handleCreateOrder} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
        settings={settings}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <button onClick={() => setIsMobileOpen(true)} className="text-gray-600">
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-800">{settings.storeName}</span>
          <div className="w-8"></div> 
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {renderContent()}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;