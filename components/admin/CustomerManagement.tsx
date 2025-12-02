import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Customer, Sale } from '../../types';
import database from '../../services/database';

interface CustomerFormProps {
    customer: Customer | null;
    onSave: (customer: Customer) => void;
    onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Omit<Customer, 'id'>>({
        name: customer?.name || '',
        mobile: customer?.mobile || '',
        email: customer?.email || '',
        loyaltyPoints: customer?.loyaltyPoints || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: customer?.id || `cust_${Date.now()}` });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-on-surface mb-6">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Customer Name" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" required />
                    <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile Number" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" required />
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email (Optional)" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" />
                    <input name="loyaltyPoints" type="number" value={formData.loyaltyPoints} onChange={handleChange} placeholder="Loyalty Points" className="w-full p-3 bg-background border border-on-surface/20 rounded-md text-on-surface" required />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onCancel} className="py-2 px-4 bg-on-surface/10 text-on-surface rounded-md hover:bg-on-surface/20 transition">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-primary text-on-primary rounded-md hover:bg-indigo-500 transition">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CustomerHistoryModalProps {
    customer: Customer;
    sales: Sale[];
    onClose: () => void;
}

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({ customer, sales, onClose }) => {
    // Filter sales for this customer based on mobile number
    const customerSales = sales.filter(s => s.customerMobile === customer.mobile).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface p-6 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b border-on-surface/20 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">Purchase History</h2>
                        <p className="text-sm text-on-surface/70">{customer.name} ({customer.mobile})</p>
                    </div>
                    <button onClick={onClose} className="text-on-surface hover:text-primary text-2xl">&times;</button>
                </div>
                
                <div className="overflow-y-auto flex-1">
                    {customerSales.length > 0 ? (
                        <div className="space-y-4">
                            {customerSales.map(sale => (
                                <div key={sale.id} className="border border-on-surface/10 rounded-lg p-4 hover:bg-on-surface/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-primary">{new Date(sale.date).toLocaleString()}</span>
                                        <span className="font-bold text-lg text-on-surface">₹{sale.total.toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm text-on-surface/80">
                                        <p className="font-medium mb-1">Items:</p>
                                        <ul className="list-disc list-inside pl-2">
                                            {sale.items.map((item, idx) => (
                                                <li key={idx}>
                                                    {item.quantity} x {item.name} ({item.brand}) - ₹{(item.price * item.quantity).toFixed(2)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 text-on-surface/50">
                            No purchase history found for this customer.
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-on-surface/20 text-right">
                    <span className="text-sm text-on-surface/70 mr-2">Total Spend:</span>
                    <span className="text-lg font-bold text-primary">₹{customerSales.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

const CustomerManagement: React.FC = () => {
    const { customers, setCustomers, sales, showToast } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

    const handleSaveCustomer = async (customer: Customer) => {
        await database.saveCustomer(customer);
        if (editingCustomer) {
            setCustomers(customers.map(c => c.id === customer.id ? customer : c));
            showToast('Customer updated successfully!');
        } else {
            setCustomers([...customers, customer]);
            showToast('Customer added successfully!');
        }
        setIsFormOpen(false);
        setEditingCustomer(null);
    };

    const handleDeleteCustomer = async (customerId: string) => {
        if (window.confirm("Are you sure you want to delete this customer?")) {
            await database.deleteCustomer(customerId);
            setCustomers(customers.filter(c => c.id !== customerId));
            showToast('Customer deleted.', 'error');
        }
    };
    
    const handleExportCSV = () => {
        if (customers.length === 0) {
            showToast('No customer data to export.', 'error');
            return;
        }

        const headers = ['ID', 'Name', 'Mobile', 'Email', 'Loyalty Points'];
        const csvRows = [headers.join(',')];

        const escapeCsvField = (field: any): string => {
            const stringField = String(field ?? '');
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        customers.forEach(customer => {
            const row = [
                escapeCsvField(customer.id),
                escapeCsvField(customer.name),
                escapeCsvField(customer.mobile),
                escapeCsvField(customer.email),
                escapeCsvField(customer.loyaltyPoints)
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'customers.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Customer data export started!');
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">Customer Management</h1>
                <div className="flex items-center gap-4">
                     <button onClick={handleExportCSV} className="py-2 px-4 bg-secondary text-on-primary font-semibold rounded-md hover:bg-green-500 transition flex items-center gap-2">
                        <DownloadIcon /> Export CSV
                    </button>
                    <button onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }} className="py-2 px-4 bg-primary text-on-primary font-semibold rounded-md hover:bg-indigo-500 transition flex items-center gap-2">
                        <PlusIcon /> Add Customer
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-on-surface/5">
                        <tr>
                            <th className="p-4 text-on-surface font-semibold">Name</th>
                            <th className="p-4 text-on-surface font-semibold">Mobile</th>
                            <th className="p-4 text-on-surface font-semibold">Email</th>
                            <th className="p-4 text-on-surface font-semibold">Loyalty Points</th>
                            <th className="p-4 text-on-surface font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.id} className="border-b border-on-surface/20 hover:bg-on-surface/5">
                                <td className="p-4 text-on-surface">{customer.name}</td>
                                <td className="p-4 text-on-surface">{customer.mobile}</td>
                                <td className="p-4 text-on-surface">{customer.email || 'N/A'}</td>
                                <td className="p-4 text-on-surface">{customer.loyaltyPoints}</td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={() => setHistoryCustomer(customer)} className="p-2 text-on-surface/60 hover:text-secondary transition" title="View Purchase History"><ClockIcon /></button>
                                    <button onClick={() => { setEditingCustomer(customer); setIsFormOpen(true); }} className="p-2 text-on-surface/60 hover:text-primary transition" title="Edit Customer"><PencilIcon /></button>
                                    <button onClick={() => handleDeleteCustomer(customer.id)} className="p-2 text-on-surface/60 hover:text-red-500 transition" title="Delete Customer"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                         {customers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center p-8 text-on-surface/50">No customers found. Add one to get started!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && <CustomerForm customer={editingCustomer} onSave={handleSaveCustomer} onCancel={() => setIsFormOpen(false)} />}
            {historyCustomer && <CustomerHistoryModal customer={historyCustomer} sales={sales} onClose={() => setHistoryCustomer(null)} />}
        </div>
    );
};

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.293a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;

export default CustomerManagement;