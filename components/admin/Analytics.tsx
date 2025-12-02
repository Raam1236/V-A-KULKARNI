import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Sale } from '../../types';

const { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = (window as any).Recharts || {};

type Period = 'daily' | 'weekly' | 'monthly' | '2-months' | '3-months' | '6-months' | 'yearly';

const Analytics: React.FC = () => {
  const { sales, products, theme } = useAppContext();
  const [period, setPeriod] = useState<Period>('monthly');
  const [chartColors, setChartColors] = useState({
    onSurface: '#d1d5db',
    primary: '#4f46e5',
    secondary: '#10b981',
    grid: '#4a5568',
    tooltipSurface: '#1f2937',
    tooltipBorder: '#4a5568',
  });
  
  useEffect(() => {
    // Function to convert CSS variable to actual color value
    const getColor = (varName: string) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    
    setChartColors({
        onSurface: `rgb(${getColor('--color-on-surface')})`,
        primary: `rgb(${getColor('--color-primary')})`,
        secondary: `rgb(${getColor('--color-secondary')})`,
        grid: `rgb(${getColor('--color-on-surface')} / 0.2)`,
        tooltipSurface: `rgb(${getColor('--color-surface')})`,
        tooltipBorder: `rgb(${getColor('--color-on-surface')} / 0.2)`,
    });
  }, [theme]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (period) {
        case 'daily': return diffDays <= 1;
        case 'weekly': return diffDays <= 7;
        case 'monthly': return diffDays <= 30;
        case '2-months': return diffDays <= 60;
        case '3-months': return diffDays <= 90;
        case '6-months': return diffDays <= 180;
        case 'yearly': return diffDays <= 365;
        default: return true;
      }
    });
  }, [sales, period]);
  
  const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSales = filteredSales.length;

  const topSellingProducts = useMemo(() => {
    const productCount: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        productCount[item.id] = (productCount[item.id] || 0) + item.quantity;
      });
    });
    return Object.entries(productCount)
      .map(([id, quantity]) => ({
        product: products.find(p => p.id === id),
        quantity
      }))
      .filter(item => item.product)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales, products]);
  
  const salesByDate = useMemo(() => {
    const groupedSales: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
      const dateKey = new Date(sale.date).toLocaleDateString();
      groupedSales[dateKey] = (groupedSales[dateKey] || 0) + sale.total;
    });
    return Object.entries(groupedSales).map(([date, total]) => ({ date, total })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredSales]);

  const salesByMonth = useMemo(() => {
    const monthlySales: { [key: string]: number } = {};

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      // Format as 'YYYY-MM' for easy sorting
      const key = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      monthlySales[key] = (monthlySales[key] || 0) + sale.total;
    });

    return Object.keys(monthlySales)
      .sort() // Sorts 'YYYY-MM' strings chronologically
      .map(key => {
        const [year, month] = key.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return {
          name: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          revenue: monthlySales[key],
        };
      });
  }, [sales]);


  return (
    <div>
      <h1 className="text-3xl font-bold text-on-surface mb-6">Sales Analytics</h1>
      <div className="mb-6">
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="bg-surface p-2 rounded-md border border-on-surface/20 focus:ring-primary focus:border-primary">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="2-months">2 Months</option>
          <option value="3-months">3 Months</option>
          <option value="6-months">6 Months</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-on-surface/70">Total Revenue</h3>
          <p className="text-4xl font-bold text-on-surface mt-2">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-on-surface/70">Total Sales</h3>
          <p className="text-4xl font-bold text-on-surface mt-2">{totalSales}</p>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-on-surface/70">Avg. Sale Value</h3>
          <p className="text-4xl font-bold text-on-surface mt-2">₹{totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-lg shadow-md h-96">
          <h3 className="text-xl font-semibold text-on-surface mb-4">Sales Over Time</h3>
          {ResponsiveContainer && BarChart ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDate} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" stroke={chartColors.onSurface} />
                <YAxis stroke={chartColors.onSurface} />
                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipSurface, border: `1px solid ${chartColors.tooltipBorder}` }} />
                <Legend />
                <Bar dataKey="total" fill={chartColors.primary} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-on-surface">Loading chart...</p>
            </div>
          )}
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-md">
           <h3 className="text-xl font-semibold text-on-surface mb-4">Top Selling Products</h3>
           <ul>
             {topSellingProducts.map(({ product, quantity }) => (
               <li key={product!.id} className="flex justify-between items-center p-3 border-b border-on-surface/20">
                 <div>
                   <p className="font-semibold text-on-surface">{product!.name}</p>
                   <p className="text-sm text-on-surface/70">{product!.brand}</p>
                 </div>
                 <p className="text-lg font-bold text-primary">{quantity} sold</p>
               </li>
             ))}
           </ul>
        </div>
      </div>
      <div className="bg-surface p-6 rounded-lg shadow-md h-96 mt-6">
        <h3 className="text-xl font-semibold text-on-surface mb-4">Monthly Sales Trend</h3>
        {ResponsiveContainer && LineChart && Line ? (
          salesByMonth.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByMonth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="name" stroke={chartColors.onSurface} />
                <YAxis stroke={chartColors.onSurface} />
                <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipSurface, border: `1px solid ${chartColors.tooltipBorder}` }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke={chartColors.secondary} name="Monthly Revenue" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-on-surface">Not enough data for monthly trend. At least two months of sales required.</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-on-surface">Loading chart...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;