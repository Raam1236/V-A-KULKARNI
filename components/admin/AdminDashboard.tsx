import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import Analytics from './Analytics';
import ProductManagement from './ProductManagement';
import EmployeeManagement from './EmployeeManagement';
import CustomerManagement from './CustomerManagement';
import ShopSettings from './ShopSettings';
import PriceVariator from './PriceVariator';
import AIAssistant from './AIAssistant';
import QRGenerator from './QRGenerator';
import SmartInsights from './SmartInsights';

type Tab = 'analytics' | 'insights' | 'products' | 'employees' | 'customers' | 'settings' | 'price-variator' | 'qr-generator';

const AdminDashboard: React.FC = () => {
  const { currentUser, logout, shopDetails, products, sales, customers, theme, setTheme } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactElement }[] = [
    { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon /> },
    { id: 'insights', label: 'Smart Insights', icon: <LightningIcon /> },
    { id: 'products', label: 'Products', icon: <CubeIcon /> },
    { id: 'employees', label: 'Employees', icon: <UsersIcon /> },
    { id: 'customers', label: 'Customers', icon: <IdentificationIcon /> },
    { id: 'price-variator', label: 'Market AI', icon: <SparklesIcon /> },
    { id: 'qr-generator', label: 'Barcode Generator', icon: <BarcodeIcon /> },
    { id: 'settings', label: 'Shop Settings', icon: <CogIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics': return <Analytics />;
      case 'insights': return <SmartInsights />;
      case 'products': return <ProductManagement />;
      case 'employees': return <EmployeeManagement />;
      case 'customers': return <CustomerManagement />;
      case 'settings': return <ShopSettings />;
      case 'price-variator': return <PriceVariator />;
      case 'qr-generator': return <QRGenerator />;
      default: return <Analytics />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-on-surface">
      {/* Sidebar */}
      <nav className="w-64 bg-surface p-4 flex flex-col justify-between shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-8 text-center">{shopDetails.name}</h1>
          <ul>
            {tabs.map(tab => (
              <li key={tab.id} className="mb-2">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-on-primary'
                      : 'hover:bg-on-surface/10'
                  }`}
                >
                  {tab.icon}
                  <span className="ml-3 font-medium">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-on-surface/20 pt-4">
             <div className="flex items-center p-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-on-primary">
                    {currentUser?.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                    <p className="font-semibold text-on-surface">{currentUser?.username}</p>
                    <p className="text-xs text-on-surface/70">Administrator</p>
                </div>
            </div>
            <button
                onClick={toggleTheme}
                className="w-full flex items-center mt-4 p-3 rounded-lg hover:bg-on-surface/10 text-on-surface transition-colors"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                <span className="ml-3 font-medium">
                  {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </button>
             <button
                onClick={logout}
                className="w-full flex items-center mt-2 p-3 rounded-lg hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors"
              >
                <LogoutIcon />
                <span className="ml-3 font-medium">Logout</span>
              </button>
        </div>
      </nav>
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        {renderContent()}

        {/* AI Assistant FAB */}
        <button 
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-8 right-8 bg-secondary text-white p-4 rounded-full shadow-lg hover:bg-green-500 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-secondary"
          aria-label="Open AI Assistant"
        >
          <AssistantIcon />
        </button>
        
        <AIAssistant 
          isOpen={isAssistantOpen} 
          onClose={() => setIsAssistantOpen(false)}
          context={{ products, sales, customers }}
        />
      </main>
    </div>
  );
};


// SVG Icons
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a4 4 0 110-5.292" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6.343 17.657l-2.828 2.828M20.485 3.515l-2.828 2.828M3 21v-4M5 19H1m17-14l2.828-2.828M17.657 6.343l2.828-2.828M21 3v4M19 5h4M12 21a9 9 0 110-18 9 9 0 010 18zM8.464 15.536L5.636 18.364m12.728-12.728L15.536 8.464" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const IdentificationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-4 0h4m-4 0a2 2 0 100 4h4a2 2 0 100-4H7m10 8v-2a3 3 0 00-3-3H9a3 3 0 00-3 3v2" /></svg>
const AssistantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.023 13.142A5.965 5.965 0 013 11h14a5.964 5.964 0 011.977 2.142 2.053 2.053 0 01-1.35 3.35H2.373a2.053 2.053 0 01-1.35-3.35zM12 10a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const BarcodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2 6h2v12H2V6zm3 0h1v12H5V6zm2 0h2v12H7V6zm3 0h1v12h-1V6zm2 0h3v12h-3V6zm4 0h2v12h-2V6zm3 0h1v12h-1V6z"/></svg>;
const LightningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

export default AdminDashboard;