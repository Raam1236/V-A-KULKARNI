
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Bill } from '../../types';
import { useAppContext } from '../../hooks/useAppContext';

interface InvoiceModalProps {
    bill: Bill;
    onNewBill: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ bill, onNewBill }) => {
    const { shopDetails } = useAppContext();
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [qrStatus, setQrStatus] = useState("Generating...");

    // Helper to ensure QR Lib is loaded
    const ensureQrLib = async (): Promise<any> => {
        if ((window as any).QRCode) return (window as any).QRCode;
        if ((window as any).qrcode) return (window as any).qrcode;

        return new Promise((resolve, reject) => {
            console.log("Invoice Modal: QR Lib missing, attempting dynamic load...");
            const script = document.createElement('script');
            // Use a reliable CDN fallback
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js";
            script.async = true;
            script.onload = () => {
                console.log("Invoice Modal: QR Lib loaded dynamically");
                resolve((window as any).QRCode || (window as any).qrcode);
            };
            script.onerror = () => {
                console.error("Invoice Modal: Dynamic QR Lib load failed");
                reject(new Error("Failed to load QR library"));
            };
            document.body.appendChild(script);
        });
    };

    // Use Callback Ref to ensure canvas is ready
    const qrCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
        if (canvas !== null) {
            
            const generate = async () => {
                try {
                     const lib = await ensureQrLib();
                     
                     const digitalReceipt = {
                        shop: shopDetails.name,
                        date: new Date().toLocaleDateString(),
                        total: bill.total,
                        items: bill.items.map(i => ({n: i.name, p: i.price, q: i.quantity})),
                        method: bill.paymentMethod
                    };
                    
                    const receiptString = JSON.stringify(digitalReceipt);
                    
                    // Check if toCanvas exists (node-qrcode style)
                    if (lib.toCanvas) {
                        lib.toCanvas(canvas, receiptString, {
                            width: 100,
                            margin: 0,
                            color: {
                                dark: "#000000",
                                light: "#ffffff"
                            }
                        }, (error: any) => {
                            if(error) {
                                 console.error(error);
                                 setQrStatus("QR Error");
                            } else {
                                setQrStatus(""); // Clear text if success
                            }
                        });
                    } else {
                        setQrStatus("Legacy Mode");
                    }
                } catch (e) {
                    console.error("QR Gen Error", e);
                    setQrStatus("Lib Missing");
                }
            };

            generate();
        }
    }, [bill, shopDetails]);

    const handlePrint = () => {
        const printContent = invoiceRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Receipt</title>');
                printWindow.document.write('<style>body { font-family: "Courier New", monospace; text-align: center; margin: 0; padding: 20px; }</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[80] bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-2xl flex flex-col max-h-[90vh] w-full max-w-sm overflow-hidden animate-fade-in-up">
                <div className="bg-green-600 p-4 text-white flex justify-between items-center">
                    <h2 className="font-bold text-lg">Payment Successful</h2>
                    <button onClick={onNewBill} className="text-white/80 hover:text-white">&times;</button>
                </div>
                
                <div className="overflow-y-auto p-6 bg-gray-100 flex-1 flex justify-center">
                    {/* Paper representation */}
                    <div ref={invoiceRef} className="bg-white text-black p-6 shadow-md w-full max-w-[300px] text-xs font-mono leading-tight">
                        <div className="text-center mb-4">
                            <h2 className="font-bold text-lg uppercase mb-1">{shopDetails.name}</h2>
                            <p className="text-gray-600">{shopDetails.address}</p>
                            <p className="text-gray-600">Tel: {shopDetails.contact}</p>
                            {shopDetails.gstNumber && <p className="text-gray-600">GSTIN: {shopDetails.gstNumber}</p>}
                        </div>
                        
                        <div className="border-b border-dashed border-gray-400 my-2"></div>
                        
                        <div className="flex justify-between mb-1">
                            <span>Date: {new Date().toLocaleDateString()}</span>
                            <span>Time: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        {bill.customerName && <div className="mb-1 text-left">Cust: {bill.customerName}</div>}
                        
                        <div className="border-b border-dashed border-gray-400 my-2"></div>
                        
                        <table className="w-full text-left mb-2">
                            <thead>
                                <tr>
                                    <th className="pb-1">Item</th>
                                    <th className="text-right pb-1">Qty</th>
                                    <th className="text-right pb-1">Amt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="truncate max-w-[120px] py-0.5">{item.name}</td>
                                        <td className="text-right py-0.5">{item.quantity}</td>
                                        <td className="text-right py-0.5">{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="border-b border-dashed border-gray-400 my-2"></div>
                        
                        <div className="flex justify-between mb-1">
                            <span>Subtotal:</span>
                            <span>₹{bill.subtotal.toFixed(2)}</span>
                        </div>

                        {bill.taxAmount > 0 && (
                            <div className="flex justify-between mb-1">
                                <span>GST ({shopDetails.defaultGstRate}%):</span>
                                <span>₹{bill.taxAmount.toFixed(2)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between font-bold text-sm mb-4 border-t border-dashed border-gray-400 pt-2">
                            <span>TOTAL:</span>
                            <span>₹{bill.total.toFixed(2)}</span>
                        </div>

                        <div className="mb-4 text-center">
                            <span className="border border-black px-2 py-1 rounded font-bold uppercase">
                                PAID VIA {bill.paymentMethod?.replace('_', ' ') || 'CASH'}
                            </span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center my-4 relative min-h-[100px]">
                            <canvas ref={qrCanvasRef} className="p-1 bg-white"></canvas>
                            {qrStatus && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">{qrStatus}</div>}
                            <div className="text-[9px] mt-1 text-gray-500">SCAN FOR E-RECEIPT</div>
                        </div>
                        
                        <div className="text-center font-bold text-sm mt-4">
                            THANK YOU ❣️
                        </div>
                        <div className="text-center text-[10px] text-gray-400 mt-2">
                            Visit Again
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                    <button onClick={handlePrint} className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-black transition-colors flex justify-center items-center gap-2">
                        <span>🖨️</span> Print
                    </button>
                    <button onClick={onNewBill} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                        Next Bill
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
