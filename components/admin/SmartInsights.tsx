
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { generateSmartInsights, fetchRetailNewsInsights } from '../../services/geminiService';

const SmartInsights: React.FC = () => {
    const { sales, products, isLoading, setIsLoading } = useAppContext();
    const [insights, setInsights] = useState<{
        stockPrediction: string;
        staffPerformance: string;
        salesHeatmap: { productName: string; score: number }[];
    } | null>(null);
    const [newsTrends, setNewsTrends] = useState<string>('');

    const fetchInsights = async () => {
        setIsLoading(true);
        // Execute both internal analysis and external news search in parallel
        const [internalData, externalNews] = await Promise.all([
            generateSmartInsights(sales, products),
            fetchRetailNewsInsights()
        ]);
        
        setInsights(internalData);
        setNewsTrends(externalNews);
        setIsLoading(false);
    };

    useEffect(() => {
        // Fetch initially if no data
        if (!insights && sales.length > 0) {
            fetchInsights();
        }
    }, []);

    return (
        <div className="animate-fade-in-down">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-on-surface">AI Smart Insights</h1>
                <button 
                    onClick={fetchInsights} 
                    className="py-2 px-4 bg-primary text-on-primary rounded-md hover:bg-indigo-500 transition flex items-center gap-2"
                    disabled={isLoading}
                >
                    <SparklesIcon /> {isLoading ? 'Analyzing...' : 'Refresh Insights'}
                </button>
            </div>

            {!insights && !isLoading && sales.length === 0 && (
                <div className="text-center p-8 bg-surface rounded-lg text-on-surface/60">
                    Not enough sales data to generate insights. Make some sales first!
                </div>
            )}

            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Real-time Market News (New Feature) */}
                    <div className="bg-surface p-6 rounded-lg shadow-md border-l-4 border-purple-500 col-span-1 md:col-span-2">
                        <h2 className="text-xl font-semibold text-on-surface mb-4 flex items-center gap-2">
                            <GlobeIcon /> Real-time Market Trends (Google Search)
                        </h2>
                        <div className="text-on-surface prose prose-sm max-w-none">
                            {newsTrends ? (
                                <div dangerouslySetInnerHTML={{ __html: newsTrends.replace(/\n/g, '<br/>').replace(/- /g, '• ') }} />
                            ) : (
                                <p className="italic text-gray-500">Fetching latest market news...</p>
                            )}
                        </div>
                    </div>

                    {/* Stock Prediction Card */}
                    <div className="bg-surface p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                        <h2 className="text-xl font-semibold text-on-surface mb-4 flex items-center gap-2">
                            <TrendingUpIcon /> Stock Predictions
                        </h2>
                        <p className="text-on-surface whitespace-pre-line leading-relaxed">
                            {insights.stockPrediction}
                        </p>
                    </div>

                    {/* Staff Performance Card */}
                    <div className="bg-surface p-6 rounded-lg shadow-md border-l-4 border-green-500">
                        <h2 className="text-xl font-semibold text-on-surface mb-4 flex items-center gap-2">
                            <UserGroupIcon /> Staff Performance AI Summary
                        </h2>
                        <p className="text-on-surface whitespace-pre-line leading-relaxed">
                            {insights.staffPerformance}
                        </p>
                    </div>

                    {/* Sales Heatmap (Top Products) */}
                    <div className="bg-surface p-6 rounded-lg shadow-md col-span-1 md:col-span-2">
                        <h2 className="text-xl font-semibold text-on-surface mb-6 flex items-center gap-2">
                            <FireIcon /> Product "Hotness" Heatmap
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {insights.salesHeatmap.map((item, idx) => (
                                <div key={idx} className="bg-background rounded-lg p-4 flex items-center justify-between relative overflow-hidden">
                                    <div 
                                        className="absolute inset-0 bg-red-500 opacity-10" 
                                        style={{ width: `${item.score}%` }} 
                                    />
                                    <span className="font-medium text-on-surface z-10">{item.productName}</span>
                                    <span className={`font-bold z-10 ${item.score > 80 ? 'text-red-500' : 'text-orange-500'}`}>
                                        {item.score} 🔥
                                    </span>
                                </div>
                            ))}
                            {insights.salesHeatmap.length === 0 && <p className="text-on-surface/50">No hot products identified yet.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L14.086 5H3a1 1 0 110-2h11.086L12.707 1.707A1 1 0 0112 1z" clipRule="evenodd" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const UserGroupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const FireIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default SmartInsights;
