import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Product } from '../../types';

const QRCodeCanvas: React.FC<{ value: string }> = ({ value }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useAppContext();

    useEffect(() => {
        if (canvasRef.current && value && (window as any).QRCode) {
            const onSurfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--color-on-surface').trim();
            const colorDark = theme === 'dark' ? `rgb(${onSurfaceColor})` : '#000000';
            const colorLight = theme === 'dark' ? '#00000000' : '#ffffff'; // Transparent background for dark mode

            try {
                (window as any).QRCode.toCanvas(canvasRef.current, value, {
                    width: 100,
                    margin: 1,
                    color: {
                        dark: colorDark,
                        light: colorLight
                    }
                }, function (error: any) {
                    if (error) console.error(error);
                });
            } catch (e) {
                console.error("QRCode error:", e);
            }
        }
    }, [value, theme]);

    if (!(window as any).QRCode) {
        return <p className="text-gray-800 text-xs">Loading QR Lib...</p>;
    }

    return <canvas ref={canvasRef}></canvas>;
};

const BarcodeCanvas: React.FC<{ value: string }> = ({ value }) => {
    const ref = useRef<SVGSVGElement>(null);
    const { theme } = useAppContext();

    useEffect(() => {
        if (ref.current && value && (window as any).JsBarcode) {
            const onSurfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--color-on-surface').trim();
            const color = theme === 'dark' ? `rgb(${onSurfaceColor})` : '#000';

            try {
                (window as any).JsBarcode(ref.current, value, {
                    format: 'CODE128',
                    lineColor: color,
                    background: 'transparent',
                    width: 1.5,
                    height: 40,
                    displayValue: false, // We display value manually in the label for better styling
                    margin: 0,
                    fontOptions: "monospace",
                });
            } catch (e) {
                console.error("JsBarcode error:", e);
                if (ref.current) ref.current.innerHTML = '';
            }
        }
    }, [value, theme]);

    if (!(window as any).JsBarcode) {
        return <p className="text-gray-800 text-xs">Loading Barcode Lib...</p>;
    }

    return <svg ref={ref} className="max-w-full"></svg>;
};

const QRGenerator: React.FC = () => {
    const { products } = useAppContext();
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const printableRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [format, setFormat] = useState<'qrcode' | 'barcode'>('qrcode');

    const handleSelectProduct = (product: Product) => {
        setSelectedProducts(prev =>
            prev.find(p => p.id === product.id)
                ? prev.filter(p => p.id !== product.id)
                : [...prev, product]
        );
    };

    const handlePrint = () => {
        const content = printableRef.current?.innerHTML;
        if (content) {
            const printWindow = window.open('', '', 'height=800,width=600');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Print Product Labels</title>');
                printWindow.document.write(`
                    <style>
                        @media print {
                            @page { 
                                size: A4;
                                margin: 0.5in; 
                            }
                            body { 
                                font-family: Arial, sans-serif;
                                margin: 0;
                                padding: 0;
                            }
                            .label-grid { 
                                display: grid; 
                                grid-template-columns: repeat(3, 1fr); 
                                gap: 15px; 
                                page-break-inside: auto;
                            }
                            .label { 
                                border: 1px solid #000; 
                                padding: 5px; 
                                text-align: center; 
                                page-break-inside: avoid; 
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                                align-items: center;
                                height: 160px;
                            }
                            .label h4 { 
                                margin: 0 0 2px 0; 
                                font-size: 9pt; 
                                height: 35px;
                                overflow: hidden;
                            }
                            .label p { 
                                margin: 0; 
                                font-size: 11pt; 
                                font-weight: bold;
                            }
                            .label canvas, .label svg { 
                                max-width: 100%; 
                                margin: 5px auto; 
                            }
                            .no-print { 
                                display: none; 
                            }
                        }
                    </style>
                `);
                printWindow.document.write('</head><body><div class="label-grid">');
                printWindow.document.write(content);
                printWindow.document.write('</div></body></html>');
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            }
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">Label Generator</h1>
                <div className="flex gap-4 items-center">
                    <div className="bg-surface border border-on-surface/20 rounded-md p-1 flex">
                        <button 
                            onClick={() => setFormat('qrcode')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${format === 'qrcode' ? 'bg-primary text-white' : 'text-on-surface hover:bg-on-surface/10'}`}
                        >
                            QR Code
                        </button>
                        <button 
                            onClick={() => setFormat('barcode')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${format === 'barcode' ? 'bg-primary text-white' : 'text-on-surface hover:bg-on-surface/10'}`}
                        >
                            Barcode
                        </button>
                    </div>
                    <button
                        onClick={handlePrint}
                        disabled={selectedProducts.length === 0}
                        className="py-2 px-4 bg-secondary text-on-primary font-semibold rounded-md hover:bg-green-500 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <PrintIcon /> Print {selectedProducts.length} Label(s)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Selection List */}
                <div className="bg-surface p-4 rounded-lg shadow-md max-h-[75vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold text-on-surface mb-4">Select Products</h2>
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        className="w-full p-2 mb-4 bg-background border border-on-surface/20 rounded text-on-surface"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <ul>
                        {filteredProducts.map(product => (
                            <li key={product.id} className="flex items-center p-2 border-b border-on-surface/10">
                                <input
                                    type="checkbox"
                                    id={`product-${product.id}`}
                                    checked={selectedProducts.some(p => p.id === product.id)}
                                    onChange={() => handleSelectProduct(product)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor={`product-${product.id}`} className="ml-3 text-on-surface cursor-pointer">
                                    {product.name} <span className="text-on-surface/60">({product.brand})</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Preview */}
                <div className="bg-surface p-4 rounded-lg shadow-md max-h-[75vh] overflow-y-auto">
                    <h2 className="text-xl font-semibold text-on-surface mb-4">Label Preview ({format === 'qrcode' ? 'QR' : 'Barcode'})</h2>
                    {selectedProducts.length > 0 ? (
                        <div ref={printableRef} className="grid grid-cols-2 gap-4">
                            {selectedProducts.map(product => {
                                 // For QR, we embed full JSON. For Barcode, usually just ID is best as they have low capacity for text.
                                 // However, the scanner logic supports JSON fallback or direct ID. 
                                 // To be safe for Barcode (Code128), we just use the ID if it's alphanumeric. 
                                 const qrValue = JSON.stringify({
                                     id: product.id,
                                     name: product.name,
                                 });
                                 const barcodeValue = product.id; 

                                 return (
                                    <div key={product.id} className="label border border-on-surface/20 p-2 text-center break-words bg-white text-black rounded h-40 flex flex-col justify-between items-center">
                                         <h4 className="font-bold text-sm leading-tight mb-1 h-8 overflow-hidden">{product.name}</h4>
                                         <p className="text-lg font-bold">₹{product.price.toFixed(2)}</p>
                                         <div className="flex justify-center my-1 flex-1 items-center">
                                            {format === 'qrcode' ? (
                                                <QRCodeCanvas value={qrValue} />
                                            ) : (
                                                <BarcodeCanvas value={barcodeValue} />
                                            )}
                                         </div>
                                         <p className="text-[10px] text-gray-500">{product.id}</p>
                                     </div>
                                 )
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-on-surface/50">
                            <p>Select products to preview.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>;

export default QRGenerator;