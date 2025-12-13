
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { User, Role } from '../../types';
import database from '../../services/database';

const EmployeeManagement: React.FC = () => {
    const { employees, setEmployees, showToast } = useAppContext();
    const [newEmployee, setNewEmployee] = useState({ username: '', password: '', fullName: '', phone: '' });

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmployee.username || !newEmployee.password || !newEmployee.fullName) {
            showToast('Username, Password and Full Name are required', 'error');
            return;
        }

        const newEmployeeUser: User = {
            id: `emp_${Date.now()}`,
            username: newEmployee.username,
            role: Role.EMPLOYEE,
            fullName: newEmployee.fullName,
            phone: newEmployee.phone
        };

        // Save via database service (Local or Cloud)
        await database.saveEmployee(newEmployeeUser, newEmployee.password);
        
        setEmployees([...employees, { ...newEmployeeUser, password: newEmployee.password }]);
        setNewEmployee({ username: '', password: '', fullName: '', phone: '' });
        showToast('Employee added successfully!');
    };

    const handleDeleteEmployee = async (employeeId: string) => {
        if(window.confirm("Are you sure you want to delete this employee?")){
            await database.deleteEmployee(employeeId);
            setEmployees(employees.filter(emp => emp.id !== employeeId));
            showToast('Employee removed.', 'error');
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-on-surface mb-6">Employee Management</h1>
            {database.isCloud && (
                <p className="text-sm text-yellow-600 mb-4 bg-yellow-100 p-2 rounded">
                    Note: In Cloud Mode, employees added here are stored in the database. 
                </p>
            )}
            
            <div className="bg-surface p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-on-surface mb-4">Register New Employee</h2>
                <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Full Name (e.g. Rahul Kumar)"
                        value={newEmployee.fullName}
                        onChange={e => setNewEmployee({ ...newEmployee, fullName: e.target.value })}
                        className="p-3 bg-background border border-on-surface/20 rounded-md text-on-surface"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Phone Number (Optional)"
                        value={newEmployee.phone}
                        onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                        className="p-3 bg-background border border-on-surface/20 rounded-md text-on-surface"
                    />
                    <input
                        type="text"
                        placeholder="Username / Login ID"
                        value={newEmployee.username}
                        onChange={e => setNewEmployee({ ...newEmployee, username: e.target.value })}
                        className="p-3 bg-background border border-on-surface/20 rounded-md text-on-surface"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={newEmployee.password}
                        onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                        className="p-3 bg-background border border-on-surface/20 rounded-md text-on-surface"
                        required
                    />
                    <div className="md:col-span-2">
                        <button type="submit" className="w-full py-3 px-6 bg-primary text-on-primary font-semibold rounded-md hover:bg-indigo-500 transition shadow-md">
                            Create Employee Account
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-surface rounded-lg shadow-md overflow-hidden">
                <h2 className="text-xl font-semibold text-on-surface p-4 border-b border-on-surface/20">Current Employees</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-on-surface/5 text-sm uppercase">
                            <tr>
                                <th className="p-4 text-on-surface">Name</th>
                                <th className="p-4 text-on-surface">Username</th>
                                <th className="p-4 text-on-surface">Mobile</th>
                                <th className="p-4 text-on-surface text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(employee => (
                                <tr key={employee.id} className="border-b border-on-surface/10 hover:bg-on-surface/5 transition-colors">
                                    <td className="p-4 text-on-surface font-medium">{employee.fullName || 'N/A'}</td>
                                    <td className="p-4 text-on-surface font-mono text-sm">{employee.username}</td>
                                    <td className="p-4 text-on-surface">{employee.phone || '-'}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDeleteEmployee(employee.id)} className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 px-3 py-1 rounded">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-on-surface/50">No employees added yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeManagement;
