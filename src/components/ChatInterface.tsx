'use client';

import { useState, useRef } from 'react';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedModel, setSelectedModel] = useState('moonshotai/Kimi-K2-Thinking');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        const message = inputRef.current?.value?.trim();
        if (!message || isLoading) return;

        const userMessage: Message = {
            id: `msg_${Date.now()}`,
            content: message,
            role: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        inputRef.current!.value = '';

        try {
            // Try Hugging Face API first
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversationId,
                    model: selectedModel
                })
            });

            if (!response.ok) {
                throw new Error('Hugging Face API failed');
            }

            const data = await response.json();
            const aiMessage: Message = {
                id: `msg_${Date.now() + 1}`,
                content: data.response,
                role: 'assistant',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Chat error:', error);

            const errorMessage: Message = {
                id: `msg_${Date.now() + 1}`,
                content: 'عذراً، حدث خطأ في الاتصال مع Hugging Face. يرجى المحاولة مرة أخرى.',
                role: 'assistant',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white p-4">
                <h1 className="text-xl font-bold mb-2">🤖 Hugging Face Chat</h1>

                {/* Model Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium">اختر النموذج:</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="px-3 py-1 rounded text-sm bg-white/20  dark:bg-gray-800 border border-white/30 text-white"
                    >
                        <option value="moonshotai/Kimi-K2-Thinking">Kimi-K2-Thinking (تفكير شامل)</option>
                        <option value="moonshotai/Kimi-K2-Instruct">Kimi-K2-Instruct (رد سريع)</option>
                    </select>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <div className="text-4xl mb-4">💬</div>
                        <p className="text-lg">ابدأ المحادثة!</p>
                        <p className="text-sm">اختر النموذج المفضل واكتب رسالتك الأولى</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                                }`}
                        >
                            <p className="text-sm">{msg.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                                {msg.timestamp.toLocaleTimeString('ar-EG')}
                            </span>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <div className="animate-pulse">جاري التفكير...</div>
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="اكتب رسالتك هنا..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'جاري الإرسال...' : 'إرسال'}
                    </button>
                </div>
            </div>
        </div>
    );
}
