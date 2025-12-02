
import React, { useState, useEffect } from 'react';
import { fetchMarketNews } from '../../services/geminiService';

const MarketNews: React.FC = () => {
    const [news, setNews] = useState('Loading news...');

    useEffect(() => {
        const getNews = async () => {
            const fetchedNews = await fetchMarketNews();
            setNews(fetchedNews);
        };
        getNews();
    }, []);

    return (
        <div className="bg-gray-800 p-2 rounded-lg max-w-xs hidden md:flex items-center gap-2">
            <span className="font-bold text-sm text-secondary">Update:</span>
            <p className="text-xs text-on-surface truncate">{news}</p>
        </div>
    );
};

export default MarketNews;
