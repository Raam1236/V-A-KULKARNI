import React, { useRef, useState, useEffect } from 'react';

interface VisualScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: string) => void;
    isProcessing: boolean;
}

const VisualScannerModal: React.FC<VisualScannerModalProps> = ({ isOpen, onClose, onCapture, isProcessing }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !stream) {
            startCamera();
        } else if (!isOpen && stream) {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        if (!window.isSecureContext) {
            setError("Camera access requires a secure context (HTTPS or localhost).");
            return;
        }

        try {
            // Try environment facing mode first, fall back if needed
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err: any) {
            console.error("Camera Error:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Permission denied. Please allow camera access.");
            } else if (err.name === 'NotFoundError') {
                setError("No camera found.");
            } else {
                setError("Could not start camera. " + (err.message || ""));
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                const { videoWidth, videoHeight } = videoRef.current;
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
                context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
                
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
                const base64Data = dataUrl.split(',')[1];
                onCapture(base64Data);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-surface p-6 rounded-lg shadow-2xl w-full max-w-md flex flex-col items-center relative animate-fade-in-down border border-on-surface/20" 
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button X */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-on-surface/50 hover:text-red-500 transition-colors p-2 z-20"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold text-on-surface mb-6">AI Visual Scanner</h2>
                
                {error ? (
                    <div className="text-center p-4 w-full">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="text-red-500 font-bold mb-2">Camera Error</p>
                        <p className="text-on-surface/80 text-sm mb-6">{error}</p>
                        <button onClick={startCamera} className="px-6 py-2 bg-primary text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all">Retry Camera</button>
                    </div>
                ) : (
                    <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden mb-6 border-4 border-surface shadow-inner group">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-100" />
                        
                        {isProcessing && (
                             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                <span className="text-white font-bold animate-pulse text-lg">AI Identifying...</span>
                             </div>
                        )}
                        
                        {!isProcessing && (
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10">
                                <button 
                                    onClick={handleCapture}
                                    className="w-20 h-20 bg-white rounded-full border-4 border-gray-200 shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/50"
                                    aria-label="Capture Photo"
                                >
                                    <div className="w-full h-full rounded-full border-2 border-white"></div>
                                </button>
                            </div>
                        )}
                        
                        {/* Guide Overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-50">
                             <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-white/50 rounded-lg"></div>
                        </div>
                    </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
                
                <button 
                    onClick={onClose} 
                    className="w-full py-3 bg-on-surface/10 hover:bg-red-500/10 hover:text-red-500 text-on-surface font-semibold rounded-lg transition-colors"
                >
                    Cancel Scan
                </button>
            </div>
        </div>
    );
};

export default VisualScannerModal;