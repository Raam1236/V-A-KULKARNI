
import React, { useState, useRef, useEffect } from 'react';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (data: string, keepOpen?: boolean) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const codeReaderRef = useRef<any | null>(null);
    const [isLibraryReady, setIsLibraryReady] = useState(false);
    
    // Camera Selection
    const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    
    // Feature Toggles & State
    const [continuousMode, setContinuousMode] = useState(false);
    const [flashGreen, setFlashGreen] = useState(false);
    const [lastScan, setLastScan] = useState<{data: string, time: number} | null>(null);
    const [torchSupported, setTorchSupported] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Effect to check for the ZXing library and handle loading
    useEffect(() => {
        if (!isOpen) {
            setIsLibraryReady(false);
            setError(null);
            setStream(null);
            return;
        }

        if ((window as any).ZXing) {
            setIsLibraryReady(true);
            return;
        }

        const intervalId = setInterval(() => {
            if ((window as any).ZXing) {
                setIsLibraryReady(true);
                clearInterval(intervalId);
            }
        }, 200);

        return () => {
            clearInterval(intervalId);
        };
    }, [isOpen]);

    // Initialize Reader and List Devices
    useEffect(() => {
        if (!isOpen || !isLibraryReady) return;

        const requestPermissionAndListDevices = async () => {
             const zxing = (window as any).ZXing;
             if (!zxing) {
                 setError("Scanning library is not available.");
                 return;
             }

             if (!codeReaderRef.current) {
                codeReaderRef.current = new zxing.BrowserMultiFormatReader();
             }

             try {
                // Request Initial Permission
                const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
                // We don't stop tracks here immediately, we let ZXing handle it or reuse.
                // Actually, checking devices is safer if we just stop this probe stream.
                initialStream.getTracks().forEach(track => track.stop());

                const devices = await zxing.BrowserCodeReader.listVideoInputDevices();
                setVideoInputDevices(devices);
                
                if (devices.length > 0) {
                     const rearCamera = devices.find((device: any) => /back|rear|environment/i.test(device.label));
                     const defaultId = rearCamera ? rearCamera.deviceId : devices[0].deviceId;
                     if (!selectedDeviceId) setSelectedDeviceId(defaultId);
                } else {
                    setError("No video devices found.");
                }
             } catch (err: any) {
                console.error("Camera Permission Error:", err);
                setError("Permission denied. Please allow camera access.");
             }
        };

        requestPermissionAndListDevices();

    }, [isOpen, isLibraryReady]);

    // Start Scanning loop
    useEffect(() => {
        if (!isOpen || !isLibraryReady || !selectedDeviceId) return;

        const codeReader = codeReaderRef.current;
        if (!codeReader) return;
        
        codeReader.reset();
        setError(null);
        setTorchOn(false);
        setTorchSupported(false);

        if (!window.isSecureContext) {
            setError("Camera access requires a secure context (HTTPS).");
            return;
        }

        codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result: any, err: any) => {
            if (result) {
                const text = result.getText();
                const now = Date.now();
                
                if (continuousMode) {
                    // Debounce: prevent duplicate scan of SAME code within 2 seconds
                    if (lastScan && lastScan.data === text && (now - lastScan.time < 2000)) {
                        return;
                    }
                    setLastScan({data: text, time: now});
                    setFlashGreen(true);
                    setTimeout(() => setFlashGreen(false), 300);
                    onScan(text, true);
                } else {
                    onScan(text, false);
                }
            }
        }).then((controls: any) => {
            // Check for Torch capability once stream is running
            if (videoRef.current && videoRef.current.srcObject) {
                const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
                if (track) {
                    setStream(videoRef.current.srcObject as MediaStream);
                    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
                    setTorchSupported(!!(capabilities as any).torch);
                }
            }
        }).catch((err: any) => {
             console.error("Scanning Error:", err);
             if (err.name === "NotAllowedError") setError("Permission denied.");
        });

        return () => {
            codeReader.reset();
            setStream(null);
        };

    }, [selectedDeviceId, isOpen, isLibraryReady, continuousMode, onScan]); // Added continuousMode dependency to refresh logic if needed, though callback closure handles it usually.

    const toggleTorch = () => {
        if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track) {
                track.applyConstraints({
                    advanced: [{ torch: !torchOn } as any]
                }).then(() => {
                    setTorchOn(!torchOn);
                }).catch(e => console.error("Torch error", e));
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface p-4 rounded-lg shadow-2xl w-full max-w-md text-on-surface relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        Scanner
                    </h2>
                    <button onClick={onClose} className="text-on-surface/50 hover:text-red-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Viewport */}
                <div className={`relative w-full aspect-square bg-black rounded-lg overflow-hidden border-4 transition-colors duration-300 ${flashGreen ? 'border-green-500' : 'border-surface'}`}>
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                    
                    {/* Scanning UI Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Red Laser Line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-scan-line z-10"></div>
                        
                        {/* Corners */}
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/50 rounded-tl-lg"></div>
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/50 rounded-tr-lg"></div>
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/50 rounded-bl-lg"></div>
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/50 rounded-br-lg"></div>
                        
                        {/* Flashlight Button (Interactive, so pointer-events-auto) */}
                        {torchSupported && (
                             <button 
                                onClick={toggleTorch}
                                className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto p-3 rounded-full bg-black/50 border border-white/30 backdrop-blur-sm transition-colors ${torchOn ? 'text-yellow-400 bg-yellow-400/20' : 'text-white'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                             </button>
                        )}
                    </div>
                </div>

                {/* Controls & Feedback */}
                <div className="mt-4 space-y-3">
                    {/* Device Selector */}
                    {videoInputDevices.length > 1 && (
                        <select 
                            value={selectedDeviceId} 
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="w-full p-2 text-sm bg-background border border-on-surface/20 rounded text-on-surface"
                        >
                            {videoInputDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label || `Camera ${device.deviceId.substring(0, 4)}...`}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Continuous Mode Toggle */}
                    <div className="flex items-center justify-between bg-on-surface/5 p-3 rounded-lg">
                        <span className="text-sm font-medium">Continuous Scan</span>
                        <button 
                            onClick={() => setContinuousMode(!continuousMode)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${continuousMode ? 'bg-primary' : 'bg-gray-400'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${continuousMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {error ? (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-center">
                            <p className="text-red-500 text-xs font-bold">{error}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-center text-on-surface/60">
                            {continuousMode ? "Ready to scan multiple items..." : "Align code within frame to scan."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
