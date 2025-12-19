import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Inventory from './pages/Inventory.tsx';
import Rentals from './pages/Rentals.tsx';
import Customers from './pages/Customers.tsx';
import Revenue from './pages/Revenue.tsx';
import Login from './pages/Login.tsx';
import UsersPage from './pages/Users.tsx';
import Settings from './pages/Settings.tsx';
import Invoices from './pages/Invoices.tsx'; 
import Credit from './pages/Credit.tsx';
import { api } from './services/api.ts';
import { Menu, Loader2 } from 'lucide-react';
import { User, UserRole, Product, Customer, Rental, RentalStatus, Invoice, AppSettings } from './types.ts';

const DEFAULT_ADMIN: User = {
  id: 'u1',
  username: 'sajjad900',
  password: 'Sajjad@2022',
  name: 'Sajjad Ahmad',
  role: UserRole.ADMIN
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [openNewRentalModal, setOpenNewRentalModal] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [settings, setSettings] = useState<AppSettings>(api.getSettings());

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const [hostUsers, hostProducts, hostCustomers, hostRentals] = await Promise.all([
          api.getUsers(),
          api.getProducts(),
          api.getCustomers(),
          api.getRentals()
        ]);

        setUsers(hostUsers.length > 0 ? hostUsers : [DEFAULT_ADMIN]);
        setProducts(hostProducts);
        setCustomers(hostCustomers);
        setRentals(hostRentals);
      } catch (e) {
        console.error("Host fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => { if(!isLoading) api.saveUsers(users); }, [users, isLoading]);
  useEffect(() => { if(!isLoading) api.saveProducts(products); }, [products, isLoading]);
  useEffect(() => { if(!isLoading) api.saveCustomers(customers); }, [customers, isLoading]);
  useEffect(() => { if(!isLoading) api.saveRentals(rentals); }, [rentals, isLoading]);
  useEffect(() => { if(!isLoading) api.saveSettings(settings); }, [settings, isLoading]);

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

  const handleAddProduct = (prod: Product) => setProducts(prev => [...prev, prod]);
  const handleUpdateProduct = (prod: Product) => setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
  const handleDeleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddCustomer = (cust: Customer) => setCustomers(prev => [...prev, cust]);
  const handleUpdateCustomer = (cust: Customer) => setCustomers(prev => prev.map(c => c.id === cust.id ? cust : c));
  const handleDeleteCustomer = (id: string) => {
      setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleSettleDebt = (customerId: string, amount: number) => {
      setCustomers(prev => prev.map(c => {
          if (c.id === customerId) {
              return { ...c, totalDebt: Math.max(0, (c.totalDebt || 0) - amount) };
          }
          return c;
      }));
  };

  const handleAddRental = (rent: Rental) => {
    const updatedProducts = products.map(p => {
        const item = rent.items.find(i => i.productId === p.id);
        if(item) {
            return { ...p, availableQuantity: p.availableQuantity - item.quantity };
        }
        return p;
    });
    setProducts(updatedProducts);
    setRentals([rent, ...rentals]);
    setOpenNewRentalModal(false); 
  };

  const handleDeleteRental = (id: string) => {
      setRentals(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateRentalStatus = (id: string, status: RentalStatus) => {
    setRentals(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleReturnItems = (
      rentalId: string, 
      returnedItems: { productId: string; qty: number }[], 
      createdBy: string, 
      returnDate: string, 
      discount: number = 0,
      receivedAmount: number = 0,
      previousDebt: number = 0
    ): Invoice | null => {
    
    const rental = rentals.find(r => r.id === rentalId);
    if(!rental) return null;

    const customer = customers.find(c => c.id === rental.customerId);
    const customerName = customer ? customer.name : 'Unknown';
    const customerPhone = customer ? customer.phone : '';
    const customerAddress = customer ? customer.address : '';

    const start = new Date(rental.startDate);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
    
    let subTotal = 0;
    const invoiceItems: any[] = [];

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

    const newStatus = updatedItems.length === 0 ? RentalStatus.COMPLETED : RentalStatus.ACTIVE;

    const updatedProducts = products.map(p => {
        const returned = returnedItems.find(r => r.productId === p.id);
        if(returned) {
            return { ...p, availableQuantity: p.availableQuantity + returned.qty };
        }
        return p;
    });
    setProducts(updatedProducts);

    const totalAdvanceAvailable = rental.advancePayment || 0;
    const netBillAfterDiscount = Math.max(0, subTotal - discount);
    
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
    
    const currentPayable = netBillAfterDiscount - advanceAdjusted;
    const totalOutstanding = currentPayable + previousDebt;
    const balanceDue = Math.max(0, totalOutstanding - receivedAmount);

    const updatedCustomers = customers.map(c => {
        if(c.id === rental.customerId) {
            const updatedC = { 
                ...c, 
                totalSpent: c.totalSpent + subTotal,
                totalDebt: balanceDue
            }; 
            return api.recalculateCustomerTier(updatedC);
        }
        return c;
    });
    setCustomers(updatedCustomers);

    const totalInvoices = rentals.reduce((count, r) => count + (r.invoices ? r.invoices.length : 0), 0);
    const nextInvoiceId = (totalInvoices + 1).toString().padStart(2, '0');

    const newInvoice: Invoice = {
        id: nextInvoiceId,
        rentalId: rental.id,
        date: returnDate,
        items: invoiceItems,
        subTotal: subTotal,
        discount: discount,
        totalAmount: netBillAfterDiscount,
        advanceAdjusted: advanceAdjusted,
        previousDebt: previousDebt,
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
        startDate: rental.startDate,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <h1 className="text-2xl font-bold">GMD Shuttering Store</h1>
        <p className="text-slate-400 mt-2">Connecting to Server...</p>
      </div>
    );
  }

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
            customers={customers}
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