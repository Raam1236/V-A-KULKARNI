
import React, { useState, useEffect, useCallback } from 'react';
import { Role, User, Product, Bill, ShopDetails, Sale, Customer, StockLogEntry } from './types';
import { AppContext } from './hooks/AppContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './components/admin/AdminDashboard';
import EmployeePOS from './components/employee/EmployeePOS';
import Toast from './components/Toast';
import database from './services/database';

// Initial Mock Data (used only if local storage/db is empty)
const initialShopDetails: ShopDetails = {
  name: "RG General Store",
  address: "123 Market St, Commerce City",
  contact: "555-123-4567"
};

// 100+ Realistic Indian Grocery Products
const initialProductsMock: Product[] = [
    // --- Dairy & Bread ---
    { id: 'd1', name: 'Milk (Nandini Blue)', brand: 'Nandini', price: 24.00, expireDate: '2026-02-01', stock: 50 },
    { id: 'd2', name: 'Milk (Nandini Green)', brand: 'Nandini', price: 28.00, expireDate: '2026-02-01', stock: 40 },
    { id: 'd3', name: 'Curd (500g)', brand: 'Nandini', price: 30.00, expireDate: '2026-02-01', stock: 25 },
    { id: 'd4', name: 'Paneer (200g)', brand: 'Amul', price: 95.00, expireDate: '2026-02-01', stock: 15 },
    { id: 'd5', name: 'Butter (100g)', brand: 'Amul', price: 58.00, expireDate: '2026-02-01', stock: 30 },
    { id: 'd6', name: 'Cheese Slices', brand: 'Amul', price: 140.00, expireDate: '2026-02-01', stock: 20 },
    { id: 'd7', name: 'Bread (White)', brand: 'Modern', price: 45.00, expireDate: '2026-02-01', stock: 40 },
    { id: 'd8', name: 'Bread (Brown)', brand: 'Britannia', price: 50.00, expireDate: '2026-02-01', stock: 25 },
    { id: 'd9', name: 'Eggs (Dozen)', brand: 'Farm Fresh', price: 84.00, expireDate: '2026-02-01', stock: 60 },
    
    // --- Staples (Rice, Atta, Dal) ---
    { id: 's1', name: 'Sona Masoori Rice (1kg)', brand: 'Royal', price: 65.00, expireDate: '2026-02-01', stock: 200 },
    { id: 's2', name: 'Basmati Rice (1kg)', brand: 'India Gate', price: 120.00, expireDate: '2026-02-01', stock: 100 },
    { id: 's3', name: 'Atta (5kg)', brand: 'Aashirvaad', price: 245.00, expireDate: '2026-02-01', stock: 50 },
    { id: 's4', name: 'Atta (1kg)', brand: 'Pillsbury', price: 55.00, expireDate: '2026-02-01', stock: 80 },
    { id: 's5', name: 'Toor Dal (1kg)', brand: 'Tata Sampann', price: 160.00, expireDate: '2026-02-01', stock: 100 },
    { id: 's6', name: 'Moong Dal (1kg)', brand: 'Loose', price: 110.00, expireDate: '2026-02-01', stock: 80 },
    { id: 's7', name: 'Chana Dal (1kg)', brand: 'Loose', price: 90.00, expireDate: '2026-02-01', stock: 70 },
    { id: 's8', name: 'Urad Dal (1kg)', brand: 'Tata Sampann', price: 150.00, expireDate: '2026-02-01', stock: 60 },
    { id: 's9', name: 'Sugar (1kg)', brand: 'Madhur', price: 48.00, expireDate: '2026-02-01', stock: 150 },
    { id: 's10', name: 'Jaggery (1kg)', brand: 'Organic', price: 80.00, expireDate: '2026-02-01', stock: 40 },
    { id: 's11', name: 'Salt (1kg)', brand: 'Tata Salt', price: 28.00, expireDate: '2026-02-01', stock: 200 },
    { id: 's12', name: 'Rava / Sooji (500g)', brand: 'Naga', price: 35.00, expireDate: '2026-02-01', stock: 45 },
    { id: 's13', name: 'Maida (500g)', brand: 'Naga', price: 32.00, expireDate: '2026-02-01', stock: 45 },
    { id: 's14', name: 'Poha (1kg)', brand: 'Loose', price: 50.00, expireDate: '2026-02-01', stock: 60 },

    // --- Oils & Ghee ---
    { id: 'o1', name: 'Sunflower Oil (1L)', brand: 'Sunpure', price: 145.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'o2', name: 'Sunflower Oil (1L)', brand: 'Gold Winner', price: 148.00, expireDate: '2026-02-01', stock: 80 },
    { id: 'o3', name: 'Groundnut Oil (1L)', brand: 'Freedom', price: 190.00, expireDate: '2026-02-01', stock: 40 },
    { id: 'o4', name: 'Mustard Oil (1L)', brand: 'Fortune', price: 160.00, expireDate: '2026-02-01', stock: 30 },
    { id: 'o5', name: 'Ghee (500ml)', brand: 'Nandini', price: 320.00, expireDate: '2026-02-01', stock: 50 },
    { id: 'o6', name: 'Ghee (200ml)', brand: 'GRB', price: 150.00, expireDate: '2026-02-01', stock: 40 },

    // --- Spices & Masalas ---
    { id: 'sp1', name: 'Chilli Powder (100g)', brand: 'Everest', price: 45.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'sp2', name: 'Turmeric Powder (100g)', brand: 'Everest', price: 35.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'sp3', name: 'Coriander Powder (100g)', brand: 'MTR', price: 40.00, expireDate: '2026-02-01', stock: 80 },
    { id: 'sp4', name: 'Garam Masala (50g)', brand: 'Everest', price: 38.00, expireDate: '2026-02-01', stock: 90 },
    { id: 'sp5', name: 'Chicken Masala (50g)', brand: 'Eastern', price: 40.00, expireDate: '2026-02-01', stock: 70 },
    { id: 'sp6', name: 'Sambar Powder (100g)', brand: 'MTR', price: 55.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'sp7', name: 'Jeera / Cumin (100g)', brand: 'Loose', price: 60.00, expireDate: '2026-02-01', stock: 50 },
    { id: 'sp8', name: 'Mustard Seeds (100g)', brand: 'Loose', price: 20.00, expireDate: '2026-02-01', stock: 60 },
    { id: 'sp9', name: 'Pepper (50g)', brand: 'Loose', price: 55.00, expireDate: '2026-02-01', stock: 40 },

    // --- Snacks & Biscuits ---
    { id: 'sn1', name: 'Maggi Noodles (Single)', brand: 'Nestle', price: 14.00, expireDate: '2026-02-01', stock: 500 },
    { id: 'sn2', name: 'Maggi Noodles (4-Pack)', brand: 'Nestle', price: 56.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'sn3', name: 'Good Day Butter', brand: 'Britannia', price: 30.00, expireDate: '2026-02-01', stock: 120 },
    { id: 'sn4', name: 'Marie Gold', brand: 'Britannia', price: 25.00, expireDate: '2026-02-01', stock: 150 },
    { id: 'sn5', name: 'Parle-G', brand: 'Parle', price: 10.00, expireDate: '2026-02-01', stock: 300 },
    { id: 'sn6', name: 'Oreo (Original)', brand: 'Cadbury', price: 35.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'sn7', name: 'Dark Fantasy', brand: 'Sunfeast', price: 40.00, expireDate: '2026-02-01', stock: 80 },
    { id: 'sn8', name: 'Lays Classic Salted', brand: 'Lays', price: 20.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'sn9', name: 'Lays Magic Masala', brand: 'Lays', price: 20.00, expireDate: '2026-02-01', stock: 150 },
    { id: 'sn10', name: 'Kurkure Masala Munch', brand: 'Pepsico', price: 20.00, expireDate: '2026-02-01', stock: 140 },
    { id: 'sn11', name: 'Bhujia Sev (200g)', brand: 'Haldirams', price: 55.00, expireDate: '2026-02-01', stock: 60 },
    
    // --- Beverages ---
    { id: 'b1', name: 'Tea Powder (250g)', brand: 'Red Label', price: 140.00, expireDate: '2026-02-01', stock: 50 },
    { id: 'b2', name: 'Tea Powder (250g)', brand: '3 Roses', price: 160.00, expireDate: '2026-02-01', stock: 45 },
    { id: 'b3', name: 'Coffee Powder (50g)', brand: 'Nescafe', price: 180.00, expireDate: '2026-02-01', stock: 60 },
    { id: 'b4', name: 'Coffee Powder (50g)', brand: 'Bru', price: 165.00, expireDate: '2026-02-01', stock: 65 },
    { id: 'b5', name: 'Boost (500g)', brand: 'Nestle', price: 280.00, expireDate: '2026-02-01', stock: 30 },
    { id: 'b6', name: 'Horlicks (500g)', brand: 'GSK', price: 290.00, expireDate: '2026-02-01', stock: 30 },
    { id: 'b7', name: 'Coca Cola (750ml)', brand: 'Coke', price: 40.00, expireDate: '2026-02-01', stock: 80 },
    { id: 'b8', name: 'Sprite (750ml)', brand: 'Coke', price: 40.00, expireDate: '2026-02-01', stock: 70 },
    { id: 'b9', name: 'Maaza (600ml)', brand: 'Coke', price: 38.00, expireDate: '2026-02-01', stock: 90 },

    // --- Personal Care ---
    { id: 'pc1', name: 'Lux Soap', brand: 'Unilever', price: 32.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'pc2', name: 'Santoor Soap', brand: 'Wipro', price: 34.00, expireDate: '2026-02-01', stock: 120 },
    { id: 'pc3', name: 'Lifebuoy Soap', brand: 'Unilever', price: 28.00, expireDate: '2026-02-01', stock: 110 },
    { id: 'pc4', name: 'Dove Soap', brand: 'Unilever', price: 55.00, expireDate: '2026-02-01', stock: 60 },
    { id: 'pc5', name: 'Colgate Toothpaste (100g)', brand: 'Colgate', price: 60.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'pc6', name: 'Close Up (100g)', brand: 'Unilever', price: 58.00, expireDate: '2026-02-01', stock: 80 },
    { id: 'pc7', name: 'Clinic Plus Shampoo (80ml)', brand: 'Unilever', price: 45.00, expireDate: '2026-02-01', stock: 50 },
    { id: 'pc8', name: 'Head & Shoulders (80ml)', brand: 'P&G', price: 90.00, expireDate: '2026-02-01', stock: 40 },
    { id: 'pc9', name: 'Coconut Oil (200ml)', brand: 'Parachute', price: 95.00, expireDate: '2026-02-01', stock: 60 },

    // --- Household ---
    { id: 'h1', name: 'Rin Bar', brand: 'Unilever', price: 20.00, expireDate: '2026-02-01', stock: 150 },
    { id: 'h2', name: 'Vim Bar', brand: 'Unilever', price: 20.00, expireDate: '2026-02-01', stock: 150 },
    { id: 'h3', name: 'Surf Excel Powder (1kg)', brand: 'Unilever', price: 140.00, expireDate: '2026-02-01', stock: 80 },
    { id: 'h4', name: 'Tide Powder (1kg)', brand: 'P&G', price: 120.00, expireDate: '2026-02-01', stock: 80 },
    { id: 'h5', name: 'Harpic Toilet Cleaner', brand: 'Reckitt', price: 95.00, expireDate: '2026-02-01', stock: 40 },
    { id: 'h6', name: 'Lizol Floor Cleaner', brand: 'Reckitt', price: 110.00, expireDate: '2026-02-01', stock: 40 },
    { id: 'h7', name: 'Comfort Fabric Conditioner', brand: 'Unilever', price: 220.00, expireDate: '2026-02-01', stock: 20 },

    // --- Vegetables (Mock IDs) ---
    { id: 'v1', name: 'Potatoes (1kg)', brand: 'Farm Fresh', price: 45.00, expireDate: '2026-02-01', stock: 200 },
    { id: 'v2', name: 'Onions (1kg)', brand: 'Farm Fresh', price: 50.00, expireDate: '2026-02-01', stock: 200 },
    { id: 'v3', name: 'Tomatoes (1kg)', brand: 'Farm Fresh', price: 30.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'v4', name: 'Green Chillies (250g)', brand: 'Farm Fresh', price: 20.00, expireDate: '2026-02-01', stock: 50 },
    { id: 'v5', name: 'Coriander Bunch', brand: 'Farm Fresh', price: 15.00, expireDate: '2026-02-01', stock: 40 },
    { id: 'v6', name: 'Carrots (500g)', brand: 'Farm Fresh', price: 35.00, expireDate: '2026-02-01', stock: 60 },
    
    // --- Dry Fruits ---
    { id: 'df1', name: 'Cashews / Kaju (100g)', brand: 'Good Life', price: 120.00, expireDate: '2026-02-01', stock: 50 },
    { id: 'df2', name: 'Almonds / Badam (100g)', brand: 'Good Life', price: 110.00, expireDate: '2026-02-01', stock: 50 },
    { id: 'df3', name: 'Raisins / Kishmish (100g)', brand: 'Good Life', price: 60.00, expireDate: '2026-02-01', stock: 60 },
    
    // --- Pooja Items ---
    { id: 'po1', name: 'Agarbatti (Pack)', brand: 'Cycle', price: 20.00, expireDate: '2026-02-01', stock: 100 },
    { id: 'po2', name: 'Camphor / Kapoor', brand: 'Cycle', price: 40.00, expireDate: '2026-02-01', stock: 80 },
    { id: 'po3', name: 'Oil Lamp Wicks', brand: 'Local', price: 10.00, expireDate: '2026-02-01', stock: 200 },
];

const TRIAL_DURATION_DAYS = 7;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('rg_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [shopDetails, setShopDetails] = useState<ShopDetails>(initialShopDetails);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('rg_theme') as 'light' | 'dark' | null;
    return savedTheme || 'dark';
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Trial State
  const [trialStatus, setTrialStatus] = useState<'loading' | 'active' | 'expired'>('loading');
  const [daysRemaining, setDaysRemaining] = useState(0);

  // --- ERP / Heartbeat Logic ---
  useEffect(() => {
      // Create a unique Device ID for this browser if not exists
      let deviceId = localStorage.getItem('rg_device_id');
      if (!deviceId) {
          deviceId = `TERM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          localStorage.setItem('rg_device_id', deviceId);
      }

      if (database.isCloud && currentUser) {
          // Send initial heartbeat
          database.sendHeartbeat(currentUser, deviceId);
          
          // Interval heartbeat
          const interval = setInterval(() => {
              database.sendHeartbeat(currentUser, deviceId);
          }, 30000); // 30s

          return () => clearInterval(interval);
      }
  }, [currentUser]);

  // --- Trial Logic ---
  useEffect(() => {
      const checkTrial = () => {
          const installDateStr = localStorage.getItem('rg_trial_start_date');
          let installDate: number;

          if (!installDateStr) {
              installDate = Date.now();
              localStorage.setItem('rg_trial_start_date', installDate.toString());
          } else {
              installDate = parseInt(installDateStr, 10);
          }

          const now = Date.now();
          // Calculate full days passed
          const daysPassed = (now - installDate) / (1000 * 60 * 60 * 24);

          if (daysPassed > TRIAL_DURATION_DAYS) {
              setTrialStatus('expired');
          } else {
              setTrialStatus('active');
              setDaysRemaining(Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - daysPassed)));
          }
      };
      checkTrial();
  }, []);

  // --- Data Loading ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [loadedProducts, loadedEmployees, loadedCustomers, loadedSales, loadedShop] = await Promise.all([
          database.getProducts(),
          database.getEmployees(),
          database.getCustomers(),
          database.getSales(),
          database.getShopDetails()
        ]);

        // Seed products if empty (Demo purposes)
        if (loadedProducts.length === 0 && !database.isCloud) {
            setProducts(initialProductsMock);
            // Save mock data to local storage immediately so it persists
            initialProductsMock.forEach(p => database.saveProduct(p));
        } else {
            setProducts(loadedProducts);
        }

        setEmployees(loadedEmployees);
        setCustomers(loadedCustomers);
        setSales(loadedSales);
        if (loadedShop) setShopDetails(loadedShop);

      } catch (error) {
        console.error("Data load error", error);
        showToast("Error loading data", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (trialStatus === 'active') {
        loadData();
    }
  }, [trialStatus]);

  // --- Persistence Wrappers ---
  
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rg_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('rg_current_user');
    }
  }, [currentUser]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('rg_theme', theme);
  }, [theme]);


  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (!user) {
        database.logout();
    }
  };
  
  const handleSetTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const logout = () => {
    handleSetCurrentUser(null);
  };

  const addSale = useCallback(async (bill: Bill) => {
    if (!currentUser) return;
    
    // --- UPDATED: SECURE PREMIUM CHECK ---
    const customer = bill.customerMobile ? customers.find(c => c.mobile === bill.customerMobile) : null;
    const isPremium = customer?.isPremium || false;
    
    // Calculate the secret surcharge that was added: surcharge = total * (5 / 105)
    // This credits exactly the "extra money taken" back to the digital wallet.
    const secretWalletCredit = isPremium ? Math.floor(bill.total * (5 / 105)) : 0;
    const walletUsed = bill.walletRedeemed || 0;

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      date: new Date().toISOString(),
      items: bill.items,
      total: bill.total,
      employeeId: currentUser.id,
      customerName: bill.customerName,
      customerMobile: bill.customerMobile,
      paymentMethod: bill.paymentMethod,
      walletUsed: walletUsed,
      walletCredited: secretWalletCredit,
      taxAmount: bill.taxAmount
    };

    // Optimistic Update Sales
    setSales(prev => [...prev, newSale]);
    await database.addSale(newSale); // DB handles persistence
    
    // Optimistic Update Customer Wallet Local State
    if (bill.customerMobile) {
        setCustomers(prevCustomers => prevCustomers.map(c => {
            if (c.mobile === bill.customerMobile) {
                const oldBalance = c.walletBalance || 0;
                // New Balance = Old - Redeemed + Surcharge Amount Taken
                const newBalance = oldBalance - walletUsed + secretWalletCredit;
                return { ...c, walletBalance: newBalance };
            }
            return c;
        }));
    }
    
    // Update Stocks
    const updatedProducts = [...products];
    for (const item of bill.items) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
        if (productIndex !== -1) {
            const product = { ...updatedProducts[productIndex] };
            const previousStock = product.stock;
            const newStock = product.stock - item.quantity;
            product.stock = newStock;

            const logEntry: StockLogEntry = {
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                date: new Date().toISOString(),
                change: -item.quantity,
                previousStock: previousStock,
                newStock: newStock,
                reason: 'Sale',
                userId: currentUser.id
            };
            product.stockHistory = [...(product.stockHistory || []), logEntry];
            updatedProducts[productIndex] = product;
            
            // Persist
            await database.saveProduct(product);
        }
    }
    setProducts(updatedProducts);

  }, [currentUser, products, customers]);

  const updateShopDetails = useCallback(async (details: ShopDetails) => {
    setShopDetails(details);
    await database.saveShopDetails(details);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const renderContent = () => {
    if (!currentUser) {
      return <LoginPage />;
    }
    if (currentUser.role === Role.ADMIN) {
      return <AdminDashboard />;
    }
    if (currentUser.role === Role.EMPLOYEE) {
      return <EmployeePOS />;
    }
    return <LoginPage />;
  };
  
  const getStatusText = () => {
      if (database.isCloud) return { text: "● ERP ONLINE", color: "text-green-400" };
      return { text: "● SINGLE PC MODE", color: "text-yellow-400" };
  };

  const status = getStatusText();

  // --- EXPIRED SCREEN ---
  if (trialStatus === 'expired') {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center font-sans">
              <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border-t-8 border-red-500 animate-fade-in-up">
                  <div className="text-red-500 mb-6 flex justify-center">
                      <div className="bg-red-100 p-4 rounded-full">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-800 mb-2">License Expired</h1>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                      Your 7-Day Trial for <span className="font-bold text-gray-800">RG Shop Billing Pro</span> has ended.
                      <br/>
                      Access to the software has been restricted.
                  </p>
                  
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-6">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">To Reactivate</p>
                      <p className="text-lg text-gray-700">Please purchase a full license.</p>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                           <p className="text-sm font-semibold text-gray-500">Administrator Contact</p>
                           <p className="text-2xl font-bold text-blue-600 mt-1">6361380854</p>
                      </div>
                  </div>
                  
                  <p className="text-xs text-gray-400">ID: {localStorage.getItem('rg_trial_start_date')}</p>
              </div>
          </div>
      );
  }

  // --- LOADING SCREEN ---
  if (trialStatus === 'loading') {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        </div>
      );
  }

  // --- MAIN APP ---
  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser: handleSetCurrentUser,
      logout,
      products,
      setProducts, 
      sales,
      addSale,
      shopDetails,
      updateShopDetails,
      employees,
      setEmployees,
      customers,
      setCustomers,
      theme,
      setTheme: handleSetTheme,
      isLoading,
      setIsLoading,
      showToast
    }}>
      <div className="min-h-screen bg-background">
        {/* Status Bar */}
        <div className="h-6 w-full bg-gray-900 text-white flex justify-between items-center px-4 text-xs font-mono">
            <div className="flex items-center gap-4">
                <span className={`${status.color} font-bold truncate max-w-[200px]`}>
                    {status.text}
                </span>
            </div>
            {/* Trial Counter */}
            <div className="flex items-center gap-2">
                 <span className="text-gray-400">LICENSE:</span>
                 {daysRemaining <= 3 ? (
                     <span className="text-red-400 font-bold animate-pulse">TRIAL ENDING ({daysRemaining} DAYS LEFT)</span>
                 ) : (
                     <span className="text-green-400 font-bold">TRIAL ACTIVE ({daysRemaining} DAYS LEFT)</span>
                 )}
            </div>
        </div>

        {renderContent()}
      </div>
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppContext.Provider>
  );
};

export default App;
