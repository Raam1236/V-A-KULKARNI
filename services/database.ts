
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updatePassword } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp, 
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured, saveERPConfig, disconnectERP } from "./firebaseConfig";
import { Product, Sale, Customer, User, Role, ShopDetails } from "../types";

// --- Configuration ---
const isCloud = isFirebaseConfigured();

// --- Firebase Initialization (Cloud Mode) ---
let auth: any = null;
let db: any = null;

if (isCloud) {
  try {
    // console.log("Initializing ERP Connection...", firebaseConfig);
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("✅ ERP System Connected");
  } catch (error) {
    console.error("ERP Connection Failed:", error);
    // Fallback to local if cloud fails (optional, but good for stability)
  }
}

// --- SQLite Simulation (Local Mode) ---
class SQLiteSimulator {
    constructor() {
        this.create_database();
    }

    private create_database() {
        if (!localStorage.getItem('table_users')) localStorage.setItem('table_users', JSON.stringify([]));
        if (!localStorage.getItem('table_products')) localStorage.setItem('table_products', JSON.stringify([]));
        if (!localStorage.getItem('table_sales')) localStorage.setItem('table_sales', JSON.stringify([]));
        if (!localStorage.getItem('table_customers')) localStorage.setItem('table_customers', JSON.stringify([]));
        if (!localStorage.getItem('table_shop_details')) localStorage.setItem('table_shop_details', JSON.stringify(null));
    }

    private getTable(tableName: string): any[] {
        const data = localStorage.getItem(tableName);
        return data ? JSON.parse(data) : [];
    }

    private saveTable(tableName: string, data: any[]) {
        localStorage.setItem(tableName, JSON.stringify(data));
    }

    // --- Local Auth ---
    register_user(username: string, password: string): boolean {
        const users = this.getTable('table_users');
        if (users.find((u: any) => u.username === username)) return false;
        users.push({ id: users.length + 1, username, password, role: 'ADMIN' });
        this.saveTable('table_users', users);
        return true;
    }

    check_login(username: string, password: string): User | null {
        const users = this.getTable('table_users');
        const user = users.find((u: any) => u.username === username && u.password === password);
        if (user) return { 
            id: user.id.toString(), 
            username: user.username, 
            role: (user.role as Role) || Role.EMPLOYEE,
            fullName: user.fullName,
            phone: user.phone 
        };
        return null; 
    }

    save_employee(user: User, password?: string) {
        const users = this.getTable('table_users');
        const existingIndex = users.findIndex((u: any) => u.username === user.username); 
        if (existingIndex >= 0) {
            users[existingIndex] = { ...users[existingIndex], ...user, password: password || users[existingIndex].password };
        } else {
            users.push({ 
                id: users.length + 1, 
                username: user.username, 
                password: password || '1234', 
                role: Role.EMPLOYEE,
                fullName: user.fullName,
                phone: user.phone 
            });
        }
        this.saveTable('table_users', users);
    }

    get_all_employees(): User[] {
        return this.getTable('table_users').filter((u: any) => u.role === Role.EMPLOYEE).map((u: any) => ({ 
            id: u.id.toString(), 
            username: u.username, 
            role: Role.EMPLOYEE,
            fullName: u.fullName,
            phone: u.phone
        }));
    }
    
    delete_user(userId: string) {
        let users = this.getTable('table_users');
        users = users.filter((u: any) => u.id.toString() !== userId);
        this.saveTable('table_users', users);
    }
    
    reset_admin_password_with_key(key: string): boolean {
        if (key === "RGcreation") {
            const users = this.getTable('table_users');
            const adminIndex = users.findIndex((u: any) => u.role === 'ADMIN');
            if (adminIndex >= 0) {
                users[adminIndex].password = "1234"; 
                this.saveTable('table_users', users);
                return true;
            }
        }
        return false;
    }

    update_user_password(userId: string, newPassword: string): boolean {
        const users = this.getTable('table_users');
        const index = users.findIndex((u: any) => u.id.toString() === userId);
        if (index >= 0) {
            users[index].password = newPassword;
            this.saveTable('table_users', users);
            return true;
        }
        return false;
    }

    // --- Local Data Methods ---
    add_product(product: Product) {
        const products = this.getTable('table_products');
        const existingIndex = products.findIndex((p: any) => p.id === product.id);
        const row = { id: product.id, product_name: product.name, price: product.price, quantity: product.stock, brand: product.brand, expireDate: product.expireDate, stockHistory: product.stockHistory };
        if (existingIndex >= 0) products[existingIndex] = row;
        else products.push(row);
        this.saveTable('table_products', products);
    }

    get_all_products(): Product[] {
        return this.getTable('table_products').map((row: any) => ({ id: row.id, name: row.product_name, price: row.price, stock: row.quantity, brand: row.brand || 'Generic', expireDate: row.expireDate || '', stockHistory: row.stockHistory || [] }));
    }

    delete_product(productId: string) {
        const products = this.getTable('table_products').filter((p: any) => p.id !== productId);
        this.saveTable('table_products', products);
    }

    get_all_sales(): Sale[] { return this.getTable('table_sales'); }
    add_sale(sale: Sale) { const sales = this.getTable('table_sales'); sales.push(sale); this.saveTable('table_sales', sales); }

    get_all_customers(): Customer[] { return this.getTable('table_customers'); }
    save_customer(customer: Customer) {
        const customers = this.getTable('table_customers');
        const index = customers.findIndex((c: any) => c.id === customer.id);
        if (index >= 0) customers[index] = customer;
        else customers.push(customer);
        this.saveTable('table_customers', customers);
    }
    delete_customer(id: string) {
        const customers = this.getTable('table_customers').filter((c: any) => c.id !== id);
        this.saveTable('table_customers', customers);
    }

    get_shop_details(): ShopDetails | null {
        try { return JSON.parse(localStorage.getItem('table_shop_details') || 'null'); } catch { return null; }
    }
    save_shop_details(details: ShopDetails) { localStorage.setItem('table_shop_details', JSON.stringify(details)); }

    export_database(): string {
        return JSON.stringify({
            users: this.getTable('table_users'),
            products: this.getTable('table_products'),
            sales: this.getTable('table_sales'),
            customers: this.getTable('table_customers'),
            shop_details: this.getTable('table_shop_details')
        }, null, 2);
    }

    import_database(jsonData: string): boolean {
        try {
            const data = JSON.parse(jsonData);
            if (data.users) this.saveTable('table_users', data.users);
            if (data.products) this.saveTable('table_products', data.products);
            if (data.sales) this.saveTable('table_sales', data.sales);
            if (data.customers) this.saveTable('table_customers', data.customers);
            if (data.shop_details) this.saveTable('table_shop_details', data.shop_details);
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    }
}

const sqlite = new SQLiteSimulator();

const generateInvoiceNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = now.getTime().toString().slice(-6);
  return `RG-INV-${dateStr}-${timeStr}`;
};

const database = {
  isCloud,
  
  // --- ERP Connection Methods ---
  setupERP: (config: any) => {
      saveERPConfig(config);
  },
  disconnectERP: () => {
      disconnectERP();
  },

  // --- Real-time ERP Monitoring ---
  async sendHeartbeat(user: User, deviceId: string) {
      if (isCloud && db) {
          try {
              const deviceRef = doc(db, "active_devices", deviceId);
              await setDoc(deviceRef, {
                  userId: user.id,
                  username: user.username,
                  role: user.role,
                  lastSeen: serverTimestamp(),
                  status: 'online',
                  userAgent: navigator.userAgent
              }, { merge: true });
          } catch (e) {
              console.error("Heartbeat fail", e);
          }
      }
  },

  listenToDevices(callback: (devices: any[]) => void): () => void {
      if (isCloud && db) {
          const q = query(collection(db, "active_devices"));
          const unsubscribe = onSnapshot(q, (snapshot) => {
              const devices = snapshot.docs.map(doc => {
                  const data = doc.data();
                  // Check if active within last 2 minutes
                  const lastSeenDate = data.lastSeen ? (data.lastSeen instanceof Timestamp ? data.lastSeen.toDate() : new Date(data.lastSeen)) : new Date(0);
                  const isOnline = (Date.now() - lastSeenDate.getTime()) < 2 * 60 * 1000;
                  
                  return {
                      id: doc.id,
                      ...data,
                      isOnline,
                      lastSeen: lastSeenDate.toLocaleString()
                  };
              });
              callback(devices);
          }, (error) => {
              console.error("ERP Listener Error:", error);
          });
          return unsubscribe;
      }
      return () => {};
  },

  // --- Auth ---
  async login(usernameOrEmail: string, password: string): Promise<User | null> {
    if (isCloud && auth) {
       try {
        // In Cloud mode, we treat username as email if it doesn't have @
        const email = usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@rgshop.com`;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const userDocRef = doc(db, "users", fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return { 
              id: fbUser.uid, 
              username: userData.username || userData.displayName || fbUser.email, 
              role: userData.role as Role,
              fullName: userData.fullName,
              phone: userData.phone
          };
        } else {
            return { id: fbUser.uid, username: fbUser.email?.split('@')[0] || 'User', role: Role.EMPLOYEE };
        }
      } catch (error) {
        console.error("Cloud Login Error:", error);
        return null;
      }
    } else {
      return sqlite.check_login(usernameOrEmail, password);
    }
  },

  async registerAdmin(user: User, password: string): Promise<boolean> {
    if (isCloud && auth) {
      try {
        const email = user.username.includes('@') ? user.username : `${user.username}@rgshop.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        await setDoc(doc(db, "users", fbUser.uid), {
          id: fbUser.uid, 
          email: email, 
          username: user.username, 
          displayName: user.username, 
          role: Role.ADMIN, 
          createdAt: serverTimestamp()
        });
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    } else {
      return sqlite.register_user(user.username, password);
    }
  },
  
  async resetAdminPassword(keyOrEmail: string): Promise<{success: boolean, message: string}> {
      if (isCloud && auth) {
          try {
              if (!keyOrEmail.includes('@')) return { success: false, message: "Please enter a valid email address." };
              await sendPasswordResetEmail(auth, keyOrEmail);
              return { success: true, message: "Password reset email sent!" };
          } catch (e: any) {
              return { success: false, message: e.message || "Failed to send reset email." };
          }
      } else {
          const success = sqlite.reset_admin_password_with_key(keyOrEmail);
          if (success) {
              return { success: true, message: "Admin Password Reset to '1234'" };
          } else {
              return { success: false, message: "Invalid Master Recovery Key." };
          }
      }
  },

  async changePassword(newPassword: string): Promise<{success: boolean, message: string}> {
      if (isCloud && auth) {
        try {
          if (!auth.currentUser) return { success: false, message: "No user logged in." };
          await updatePassword(auth.currentUser, newPassword);
          return { success: true, message: "Password updated successfully." };
        } catch (error: any) {
          return { success: false, message: error.message || "Failed to update password. You may need to re-login." };
        }
      } else {
        const currentUserStr = localStorage.getItem('rg_current_user');
        if (currentUserStr) {
            const u = JSON.parse(currentUserStr);
            const success = sqlite.update_user_password(u.id, newPassword);
            return success ? { success: true, message: "Password updated successfully." } : { success: false, message: "User not found." };
        }
        return { success: false, message: "No active user session found." };
      }
  },
  
  async logout() {
      if (isCloud && auth) await signOut(auth);
  },

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    if (isCloud && db) {
      const querySnapshot = await getDocs(collection(db, "products"));
      return querySnapshot.docs.map(docData => {
         const data = docData.data();
         return { 
             id: docData.id, 
             name: data.name,
             brand: data.brand,
             price: data.currentPrice || data.basePrice || 0,
             expireDate: data.expireDate || '', 
             stock: data.stock || 0,
             stockHistory: data.stockHistory || []
         } as Product;
      });
    } else {
      return sqlite.get_all_products();
    }
  },

  async saveProduct(product: Product): Promise<void> {
    if (isCloud && db) {
      const docRef = doc(db, "products", product.id);
      const productData = {
          name: product.name,
          brand: product.brand,
          basePrice: product.price, 
          currentPrice: product.price,
          stock: product.stock,
          expireDate: product.expireDate,
          stockHistory: product.stockHistory || [],
          qrCodeData: `rgstore://product/${product.id}`,
          lastPriceUpdate: serverTimestamp(),
      };
      await setDoc(docRef, productData, { merge: true }); 
    } else {
      sqlite.add_product(product);
    }
  },
  
  async deleteProduct(productId: string): Promise<void> {
      if (isCloud && db) await deleteDoc(doc(db, "products", productId));
      else sqlite.delete_product(productId);
  },

  // --- Sales ---
  async getSales(): Promise<Sale[]> {
    if (isCloud && db) {
      const q = query(collection(db, "sales")); 
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docData => {
          const data = docData.data();
          return {
              id: docData.id,
              date: data.saleDate instanceof Timestamp ? data.saleDate.toDate().toISOString() : data.saleDate,
              items: data.items.map((i: any) => ({ id: i.productId, name: i.name, brand: i.brand, price: i.unitPrice, quantity: i.quantity })),
              total: data.totalAmount,
              employeeId: data.generatedByEmployeeId,
              customerName: data.customerName,
              customerMobile: data.customerMobile
          } as Sale;
      });
    } else {
      return sqlite.get_all_sales();
    }
  },

  async addSale(sale: Sale): Promise<void> {
    if (isCloud && db) {
      const invoiceNumber = generateInvoiceNumber();
      const shopDetails = await this.getShopDetails();
      const saleRecord = {
        invoiceNumber: invoiceNumber,
        saleDate: serverTimestamp(),
        customerName: sale.customerName || "Walk-in Customer",
        customerMobile: sale.customerMobile || null,
        items: sale.items.map(item => ({
            productId: item.id, name: item.name, brand: item.brand, unitPrice: item.price, quantity: item.quantity, totalItemPrice: item.price * item.quantity
        })),
        totalAmount: sale.total,
        generatedByEmployeeId: sale.employeeId,
        shopDetails: shopDetails || { name: "RG Shop" },
        thankYouMessage: "THANK YOU ❣️",
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, "sales", sale.id), saleRecord);
    } else {
      sqlite.add_sale(sale);
    }
  },

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    if (isCloud && db) {
      const querySnapshot = await getDocs(collection(db, "customers"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    } else {
      return sqlite.get_all_customers();
    }
  },

  async saveCustomer(customer: Customer): Promise<void> {
    if (isCloud && db) await setDoc(doc(db, "customers", customer.id), customer, { merge: true });
    else sqlite.save_customer(customer);
  },
  
  async deleteCustomer(customerId: string): Promise<void> {
      if (isCloud && db) await deleteDoc(doc(db, "customers", customerId));
      else sqlite.delete_customer(customerId);
  },

  // --- Employees ---
  async getEmployees(): Promise<User[]> {
    if (isCloud && db) {
       const q = query(collection(db, "users"), where("role", "==", Role.EMPLOYEE));
       const querySnapshot = await getDocs(q);
       return querySnapshot.docs.map(doc => {
           const data = doc.data();
           return { 
               id: doc.id, 
               username: data.username,
               role: data.role,
               fullName: data.fullName,
               phone: data.phone
           } as User;
       });
    } else {
      return sqlite.get_all_employees();
    }
  },

  async saveEmployee(user: User, password?: string): Promise<void> {
      if (isCloud && db) {
          await setDoc(doc(db, "users", user.id), { ...user, password, createdAt: serverTimestamp() }); 
      } else {
          sqlite.save_employee(user, password);
      }
  },
  
  async deleteEmployee(userId: string): Promise<void> {
      if(isCloud && db) await deleteDoc(doc(db, "users", userId));
      else sqlite.delete_user(userId);
  },

  // --- Shop Details ---
  async getShopDetails(): Promise<ShopDetails | null> {
    if (isCloud && db) {
        const docRef = doc(db, "settings", "shop_details");
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() as ShopDetails : null;
    } else {
        return sqlite.get_shop_details();
    }
  },

  async saveShopDetails(details: ShopDetails): Promise<void> {
    if (isCloud && db) await setDoc(doc(db, "settings", "shop_details"), details);
    else sqlite.save_shop_details(details);
  },

  // --- Backup / Restore ---
  async backupData(): Promise<string> {
      if(isCloud) return "Backup not available for Cloud mode directly.";
      return sqlite.export_database();
  },

  async restoreData(jsonData: string): Promise<boolean> {
      if(isCloud) return false;
      return sqlite.import_database(jsonData);
  }
};

export default database;
