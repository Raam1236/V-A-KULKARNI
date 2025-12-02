import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { User, Role } from '../../types';
import database from '../../services/database';

const EmployeeManagement: React.FC = () => {
    const { employees, setEmployees, showToast } = useAppContext();
    const [newEmployee, setNewEmployee] = useState({ username: '', password: '' });

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmployee.username || !newEmployee.password) {
            showToast('Username and password are required', 'error');
            return;
        }

        const newEmployeeUser: User = {
            id: `emp_${Date.now()}`,
            username: newEmployee.username,
            role: Role.EMPLOYEE,
        };

        // Save via database service (Local or Cloud)
        await database.saveEmployee(newEmployeeUser, newEmployee.password);
        
        setEmployees([...employees, { ...newEmployeeUser, password: newEmployee.password }]);
        setNewEmployee({ username: '', password: '' });
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
                    Note: In Cloud Mode, employees added here are stored in the database. For full security, consider setting up separate Firebase Auth accounts for each employee in the future.
                </p>
            )}
            
            <div className="bg-surface p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-on-surface mb-4">Add New Employee</h2>
                <form onSubmit={handleAddEmployee} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Employee ID / Username"
                        value={newEmployee.username}
                        onChange={e => setNewEmployee({ ...newEmployee, username: e.target.value })}
                        className="flex-grow p-3 bg-background border border-on-surface/20 rounded-md text-on-surface"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={newEmployee.password}
                        onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                        className="flex-grow p-3 bg-background border border-on-surface/20 rounded-md text-on-surface"
                    />
                    <button type="submit" className="py-3 px-6 bg-primary text-on-primary font-semibold rounded-md hover:bg-indigo-500 transition">Add Employee</button>
                </form>
            </div>

            <div className="bg-surface rounded-lg shadow-md overflow-hidden">
                <h2 className="text-xl font-semibold text-on-surface p-4 border-b border-on-surface/20">Current Employees</h2>
                <ul>
                    {employees.map(employee => (
                        <li key={employee.id} className="flex justify-between items-center p-4 border-b border-on-surface/20 last:border-b-0">
                            <span className="text-on-surface">{employee.username}</span>
                            <button onClick={() => handleDeleteEmployee(employee.id)} className="text-red-500 hover:text-red-400 font-semibold">
                                Remove
                            </button>
                        </li>
                    ))}
                    {employees.length === 0 && <p className="p-4 text-on-surface/60">No employees added yet.</p>}
                </ul>
            </div>
        </div>
    );
};

export default EmployeeManagement;