
import React, { useState, useRef, useEffect } from 'react';
import { Product, Sale, Customer } from '../../types';
import { askShopAI } from '../../services/geminiService';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    context: {
        products: Product[];
        sales: Sale[];
        customers: Customer[];
    };
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, context }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ sender: 'ai', text: "Hello! I'm ProBot, your AI assistant. Ask me anything about your products, stock, or sales." }]);
        }
    }, [isOpen]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendQuery = async () => {
        if (!query.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        const aiResponseText = await askShopAI(context, query);
        
        const aiMessage: Message = { sender: 'ai', text: aiResponseText };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg shadow-2xl w-full max-w-lg h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-on-surface/20">
                    <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                        <AssistantIcon /> AI Assistant (ProBot)
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-on-surface/60 hover:bg-on-surface/10">&times;</button>
                </header>
                
                <main className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                             {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1"><AssistantIcon className="w-5 h-5 text-white" /></div>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-on-primary' : 'bg-on-surface/10 text-on-surface'}`}>
                                <div className="prose dark:prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1"><AssistantIcon className="w-5 h-5 text-white" /></div>
                            <div className="max-w-md p-3 rounded-lg bg-on-surface/10 text-on-surface">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-on-surface/50 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-on-surface/50 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-on-surface/50 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t border-on-surface/20">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
                            placeholder="e.g., Which products are low on stock?"
                            className="w-full p-2 bg-background border border-on-surface/20 rounded-md text-on-surface focus:ring-primary focus:border-primary"
                            disabled={isLoading}
                        />
                        <button onClick={handleSendQuery} disabled={isLoading} className="p-2 bg-primary text-on-primary rounded-md hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <SendIcon />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const AssistantIcon = ({className = "w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.023 13.142A5.965 5.965 0 013 11h14a5.964 5.964 0 011.977 2.142 2.053 2.053 0 01-1.35 3.35H2.373a2.053 2.053 0 01-1.35-3.35zM12 10a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;

export default AIAssistant;