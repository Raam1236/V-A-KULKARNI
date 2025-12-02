import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Product, StockLogEntry } from '../../types';
import database from '../../services/database';

interface StockHistoryModalProps {
    product: Product;
    onClose: () => void;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ product, onClose }) => {
    const { employees, currentUser } = useAppContext();
    
    const getUsername = (userId: string) => {
        if (currentUser && currentUser.id === userId) return `${currentUser.username} (You)`;
        if (userId.includes('admin')) return 'Administrator';
        const emp = employees.find(e => e.id === userId);
        return emp ? emp.username : userId;
    };

    const history = (product.stockHistory || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface p-6 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-on-surface">Stock History: {product.name}</h2>
                    <button onClick={onClose} className="text-on-surface hover:text-primary text-2xl">&times;</button>
                </div>
                
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-surface border-b border-on-surface/20">
                            <tr>
                                <th className="p-3 text-on-surface text-sm">Date</th>
                                <th className="p-3 text-on-surface text-sm">User</th>
                                <th className="p-3 text-on-surface text-sm text-center">Change</th>
                                <th className="p-3 text-on-surface text-sm text-right">Stock</th>
                                <th className="p-3 text-on-surface text-sm">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? history.map(log => (
                                <tr key={log.id} className="border-b border-on-surface/10 hover:bg-on-surface/5">
                                    <td className="p-3 text-on-surface text-sm">
                                        {new Date(log.date).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-on-surface text-sm font-medium">
                                        {getUsername(log.userId)}
                                    </td>
                                    <td className={`p-3 text-sm text-center font-bold ${log.change > 0 ? 'text-green-500' : log.change < 0 ? 'text-red-500' : 'text-on-surface'}`}>
                                        {log.change > 0 ? '+' : ''}{log.change}
                                    </td>
                                    <td className="p-3 text-on-surface text-sm text-right">
                                        {log.newStock}
                                    </td>
                                    <td className="p-3 text-on-surface/80 text-sm italic">
                                        {log.reason}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-on-surface/50">No history available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


interface ProductFormProps {
    product: Product | null;
    onSave: (product: Product) => void;
    onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
    const { currentUser } = useAppContext();
    const [formData, setFormData] = useState<Omit<Product, 'id' | 'stockHistory'>>({
        name: product?.name || '',
        brand: product?.brand || '',
        price: product?.price || 0,
        expireDate: product?.expireDate || '',
        stock: product?.stock || 0,
    });
    const [stockReason, setStockReason] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const productId = product?.id || `prod_${Date.now()}`;
        const initialStock = product?.stock || 0;
        const stockDiff = formData.stock - initialStock;
        
        let updatedHistory = product?.stockHistory || [];

        // If it's a new product or stock has changed, add a log entry
        if (!product || stockDiff !== 0) {
             const logEntry: StockLogEntry = {
                id: `log_${Date.now()}`,
                date: new Date().toISOString(),
                change: stockDiff,
                previousStock: initialStock,
                newStock: formData.stock,
                reason: !product ? 'Initial Stock' : (stockReason || 'Manual Adjustment'),
                userId: currentUser?.id || 'unknown'
            };
            updatedHistory = [...updatedHistory, logEntry];
        }

        const newProduct: Product = {
            ...formData,
            id: productId,
            stockHistory: updatedHistory
        };
        
        onSave(newProduct);
    };
    
    const showStockReasonInput = product && formData.stock !== product.stock;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onCancel}>
            <div className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-on-surface mb-6">{product ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" required />
                    <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" required />
                    <div className="flex gap-4">
                        <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} placeholder="Price" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" required />
                        <input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Stock" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" required />
                    </div>
                    {showStockReasonInput && (
                        <div className="animate-fade-in-down">
                            <label className="block text-xs text-secondary mb-1">Reason for stock change:</label>
                            <input 
                                type="text" 
                                value={stockReason} 
                                onChange={e => setStockReason(e.target.value)} 
                                placeholder="e.g., Restock, Damaged, Correction" 
                                className="w-full p-3 bg-background border border-secondary/50 rounded-md text-on-surface focus:ring-secondary focus:border-secondary" 
                            />
                        </div>
                    )}
                    <input name="expireDate" type="date" value={formData.expireDate} onChange={handleChange} placeholder="Expiry Date" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" required />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="py-2 px-4 bg-on-surface/10 text-on-surface rounded-md hover:bg-on-surface/20 transition">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-on-primary rounded-md hover:bg-indigo-500 transition">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Barcode: React.FC<{ value: string; displayValue?: boolean }> = ({ value, displayValue = false }) => {
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
                    width: displayValue ? 2 : 1.5,
                    height: displayValue ? 60 : 40,
                    displayValue: displayValue,
                    margin: 10,
                    fontOptions: "monospace",
                    fontColor: color,
                    fontSize: 14,
                });
            } catch (e) {
                console.error("JsBarcode error:", e);
                if (ref.current) ref.current.innerHTML = '';
            }
        }
    }, [value, theme, displayValue]);

    if (!(window as any).JsBarcode) {
        return <p className="text-gray-800 text-xs">Loading barcode...</p>;
    }

    return <svg ref={ref}></svg>;
};


const ProductManagement: React.FC = () => {
    const { products, setProducts, showToast } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
    const [lowStockThreshold, setLowStockThreshold] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSaveProduct = async (product: Product) => {
        await database.saveProduct(product);
        if (editingProduct) {
            setProducts(products.map(p => p.id === product.id ? product : p));
            showToast('Product updated successfully!');
        } else {
            setProducts([...products, product]);
            showToast('Product added successfully!');
        }
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await database.deleteProduct(productId);
            setProducts(products.filter(p => p.id !== productId));
            showToast('Product deleted.', 'error');
        }
    };

    const handleCopyBarcodeData = (product: Product) => {
        const barcodeValue = JSON.stringify({
            id: product.id,
            name: product.name,
            price: product.price,
            brand: product.brand,
            expireDate: product.expireDate
        });
        navigator.clipboard.writeText(barcodeValue).then(() => {
            showToast(`Copied barcode data for ${product.name} to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy barcode data.', 'error');
        });
    };
    
    const barcodeValue = barcodeProduct ? JSON.stringify({
        id: barcodeProduct.id,
        name: barcodeProduct.name,
        price: barcodeProduct.price,
        brand: barcodeProduct.brand,
        expireDate: barcodeProduct.expireDate
    }) : "";

    const filteredProducts = useMemo(() => {
        if (!searchTerm) {
            return products;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return products.filter(product =>
            product.name.toLowerCase().includes(lowercasedTerm) ||
            product.brand.toLowerCase().includes(lowercasedTerm) ||
            product.id.toLowerCase().includes(lowercasedTerm)
        );
    }, [products, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by name, brand, ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-sm p-2 pl-10 bg-surface border border-on-surface/20 rounded-md text-on-surface"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <label htmlFor="low-stock-threshold" className="text-sm font-medium text-on-surface whitespace-nowrap">Low Stock Alert:</label>
                        <input
                            id="low-stock-threshold"
                            type="number"
                            value={lowStockThreshold}
                            onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
                            className="w-20 p-2 bg-surface border border-on-surface/20 rounded-md text-on-surface"
                        />
                    </div>
                    <button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="py-2 px-4 bg-primary text-on-primary font-semibold rounded-md hover:bg-indigo-500 transition flex items-center gap-2">
                        <PlusIcon /> Add Product
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-on-surface/5">
                        <tr>
                            <th className="p-4 text-on-surface font-semibold">Name</th>
                            <th className="p-4 text-on-surface font-semibold">Brand</th>
                            <th className="p-4 text-on-surface font-semibold">Price</th>
                            <th className="p-4 text-on-surface font-semibold">Stock</th>
                            <th className="p-4 text-on-surface font-semibold">Expiry Date</th>
                            <th className="p-4 text-on-surface font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="border-b border-on-surface/20 hover:bg-on-surface/5">
                                <td className="p-4 text-on-surface">{product.name}</td>
                                <td className="p-4 text-on-surface">{product.brand}</td>
                                <td className="p-4 text-on-surface">₹{product.price.toFixed(2)}</td>
                                <td className="p-4 text-on-surface">
                                    <div className="flex items-center gap-2">
                                        {product.stock}
                                        {product.stock <= lowStockThreshold && (
                                            <span title="Low Stock!" className="text-red-500">
                                                <AlertIcon />
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-on-surface">{product.expireDate}</td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => setHistoryProduct(product)} className="p-2 text-on-surface/60 hover:text-secondary transition" title="View Stock History"><HistoryIcon /></button>
                                    <button onClick={() => setBarcodeProduct(product)} className="p-2 text-on-surface/60 hover:text-primary transition" title={`Generate barcode for ${product.name}`}><BarcodeIcon /></button>
                                    <button onClick={() => handleCopyBarcodeData(product)} className="p-2 text-on-surface/60 hover:text-primary transition" title={`Copy barcode data for ${product.name}`}><ClipboardCopyIcon /></button>
                                    <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="p-2 text-on-surface/60 hover:text-primary transition" title={`Edit ${product.name}`}><PencilIcon /></button>
                                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-on-surface/60 hover:text-red-500 transition" title={`Delete ${product.name}`}><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-on-surface/50">
                                    No products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && <ProductForm product={editingProduct} onSave={handleSaveProduct} onCancel={() => setIsFormOpen(false)} />}
            
            {barcodeProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setBarcodeProduct(null)}>
                    <div className="bg-white p-8 rounded-lg text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{barcodeProduct.name}</h3>
                        <p className="text-gray-600 mb-4">{barcodeProduct.brand}</p>
                        <Barcode value={barcodeValue} displayValue={true} />
                        <button onClick={() => setBarcodeProduct(null)} className="mt-6 py-2 px-6 bg-primary text-white rounded-md">Close</button>
                    </div>
                </div>
            )}
            
            {historyProduct && (
                <StockHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
            )}
        </div>
    );
};

// Icons
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-on-surface/50" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const BarcodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M1.5 5h1.5v10H1.5V5zm2.5 0h.5v10h-.5V5zm1.5 0h1.5v10H5.5V5zm2.5 0h.5v10h-.5V5zm1.5 0h2v10h-2V5zm3 0h1.5v10h-1.5V5zm2.5 0h.5v10h-.5V5z"/></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const ClipboardCopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;

export default ProductManagement;