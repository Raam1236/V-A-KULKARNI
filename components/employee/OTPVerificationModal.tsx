
import React, { useState, useEffect } from 'react';

interface OTPVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    mobile: string;
    customerName: string;
    onVerified: () => void;
    onResend: () => Promise<boolean>;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({ 
    isOpen, onClose, mobile, customerName, onVerified, onResend 
}) => {
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let interval: any;
        if (isOpen && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen, timer]);

    const handleVerify = () => {
        // Correct OTP for demo is 123456 or the generated one
        // In local state, we'd check against customer.otpCode
        if (otp === '123456' || otp === localStorage.getItem('last_generated_otp')) {
            onVerified();
            setOtp('');
            onClose();
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };

    const handleResendClick = async () => {
        if (timer > 0) return;
        setIsResending(true);
        const success = await onResend();
        setIsResending(false);
        if (success) {
            setTimer(60);
            setError('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-fade-in-up border-4 border-blue-600">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Security Verification</h2>
                    <p className="text-sm text-gray-500 mt-1">Premium Customer: <span className="font-bold text-blue-600">{customerName}</span></p>
                    <p className="text-xs text-gray-400">Enter the 6-digit code sent to +91 {mobile.slice(-4).padStart(10, '*')}</p>
                </div>

                <div className="space-y-4">
                    <input 
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-3xl tracking-[0.5em] font-mono border-2 border-gray-200 focus:border-blue-500 rounded-lg p-3 outline-none transition-all"
                        placeholder="000000"
                        autoFocus
                    />
                    
                    {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

                    <button 
                        onClick={handleVerify}
                        disabled={otp.length !== 6}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg disabled:bg-gray-300 transition-colors"
                    >
                        Verify & Unlock Wallet
                    </button>

                    <div className="text-center">
                        <button 
                            onClick={handleResendClick}
                            disabled={timer > 0 || isResending}
                            className={`text-sm font-bold ${timer > 0 ? 'text-gray-400' : 'text-blue-600 hover:underline'}`}
                        >
                            {isResending ? 'Sending...' : timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP Now'}
                        </button>
                    </div>
                </div>

                <button onClick={onClose} className="w-full mt-4 py-2 text-gray-400 text-xs hover:text-gray-600">
                    Cancel and go back
                </button>
            </div>
        </div>
    );
};

export default OTPVerificationModal;
