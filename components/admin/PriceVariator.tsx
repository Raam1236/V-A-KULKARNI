
import React, { useState } from 'react';
import { fetchPriceVariationSuggestion } from '../../services/geminiService';
import { useAppContext } from '../../hooks/useAppContext';

const PriceVariator: React.FC = () => {
    const { products, setProducts, setIsLoading, showToast } = useAppContext();
    const [marketUpdate, setMarketUpdate] = useState('');
    const [suggestion, setSuggestion] = useState('');

    const getUpdate = async () => {
        setIsLoading(true);
        const response = await fetchPriceVariationSuggestion();
        const [news, sug] = response.split('\nSUGGESTION:');
        setMarketUpdate(news || response);
        setSuggestion(sug || '');
        setIsLoading(false);
    };

    const applySuggestion = () => {
        if (!suggestion) return;

        const percentageMatch = suggestion.match(/(-?\d+)%/);
        if (!percentageMatch) {
            showToast("Couldn't parse the suggestion percentage.", 'error');
            return;
        }
        const percentage = parseInt(percentageMatch[1], 10) / 100;
        
        const categoryMatch = suggestion.match(/for all (.*?) products/i) || suggestion.match(/(\w+) product prices/i);
        if (!categoryMatch) {
            showToast("Couldn't parse the product category from suggestion.", 'error');
            return;
        }
        const category = categoryMatch[1].toLowerCase();

        const updatedProducts = products.map(p => {
            if (p.name.toLowerCase().includes(category) || p.brand.toLowerCase().includes(category)) {
                const newPrice = p.price * (1 + percentage);
                return { ...p, price: parseFloat(newPrice.toFixed(2)) };
            }
            return p;
        });
        
        setProducts(updatedProducts);
        showToast(`Prices for '${category}' products updated by ${percentage*100}%!`, 'success');
        setSuggestion('');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-on-surface mb-6">Live Price Variation (Market AI)</h1>
            <div className="bg-surface p-8 rounded-lg shadow-md max-w-3xl mx-auto text-center">
                <p className="text-on-surface mb-6">
                    Get AI-powered market insights to dynamically adjust your product pricing.
                    The AI will generate a fictional market event and suggest a price adjustment.
                </p>
                <button
                    onClick={getUpdate}
                    className="py-3 px-8 bg-secondary text-on-primary font-bold rounded-full hover:bg-green-500 transition transform hover:scale-105"
                >
                    Get Market Update
                </button>

                {marketUpdate && (
                    <div className="mt-8 text-left p-6 bg-background rounded-lg border border-on-surface/20">
                        <h3 className="text-lg font-semibold text-primary mb-2">Market News:</h3>
                        <p className="text-on-surface italic">"{marketUpdate}"</p>
                        
                        {suggestion && (
                             <div className="mt-4 p-4 bg-primary/10 rounded-md">
                                <h3 className="font-semibold text-secondary">AI Suggestion:</h3>
                                <p className="text-on-surface">{suggestion}</p>
                                <div className="text-right mt-4">
                                    <button onClick={applySuggestion} className="py-2 px-4 bg-primary text-on-primary rounded-md text-sm font-semibold hover:bg-indigo-500">
                                        Apply This Change
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceVariator;