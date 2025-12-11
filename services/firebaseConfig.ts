
// services/firebaseConfig.ts

// 1. Try to get config from Local Storage (User entered via UI)
const getStoredConfig = () => {
  const stored = localStorage.getItem('rg_erp_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Invalid ERP Config stored");
      return null;
    }
  }
  return null;
};

const storedConfig = getStoredConfig();

// 2. Fallback to Environment variables (Dev mode)
export const firebaseConfig = storedConfig || {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Check if config is actually set and valid
export const isFirebaseConfigured = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
};

export const saveERPConfig = (config: any) => {
    localStorage.setItem('rg_erp_config', JSON.stringify(config));
    window.location.reload(); // Reload to initialize firebase with new config
};

export const disconnectERP = () => {
    localStorage.removeItem('rg_erp_config');
    window.location.reload();
};
