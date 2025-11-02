
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { FinancialRecord, RevenueRecord, ReceivableRecord, RecordType, Demand } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Message {
    text: string;
    sender: 'user' | 'bot';
}

const isRecordInvalid = (item: FinancialRecord | RevenueRecord | ReceivableRecord, type: RecordType): boolean => {
    if (!item.name || !item.description || item.value == null || !item.category) return true;
    switch (type) {
        case 'fixedCosts': case 'variableCosts': return !(item as FinancialRecord).date;
        case 'revenues': return !(item as RevenueRecord).date || !(item as RevenueRecord).client;
        case 'receivables': return !(item as ReceivableRecord).dueDate || !(item as ReceivableRecord).client;
        default: return false;
    }
};

const isDemandInvalid = (demand: Demand): boolean => {
    return !demand.client || !demand.service || !demand.prazo || !demand.responsavel;
};

const ChatWidget: React.FC = () => {
    const { financialData, calendarEvents, demands } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const alerts = useMemo(() => {
        const generatedAlerts = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // 1. Upcoming Payments
        const upcomingPayments = calendarEvents.filter(e => {
            const dueDate = new Date(e.dueDate);
            return e.status === 'pending' && dueDate >= now;
        });
        if (upcomingPayments.length > 0) {
            generatedAlerts.push({ title: 'Contas a Vencer', message: `Existem ${upcomingPayments.length} contas próximas do vencimento.` });
        }

        // 2. Incomplete Financial Data
        const allRecords = [
            ...financialData.fixedCosts.map(r => ({ ...r, type: 'fixedCosts' as RecordType })),
            ...financialData.variableCosts.map(r => ({ ...r, type: 'variableCosts' as RecordType })),
            ...financialData.revenues.map(r => ({ ...r, type: 'revenues' as RecordType })),
            ...financialData.receivables.map(r => ({ ...r, type: 'receivables' as RecordType })),
        ];
        const incompleteRecords = allRecords.filter(r => isRecordInvalid(r, r.type) || !r.attachment);
        if (incompleteRecords.length > 0) {
            generatedAlerts.push({ title: 'Registros Incompletos', message: `${incompleteRecords.length} transações financeiras precisam de atenção.` });
        }

        // 3. Incomplete Demands
        const incompleteDemands = demands.filter(isDemandInvalid);
        if(incompleteDemands.length > 0) {
             generatedAlerts.push({ title: 'Demandas Incompletas', message: `${incompleteDemands.length} demandas no painel Kanban estão com dados pendentes.` });
        }

        return generatedAlerts;
    }, [financialData, calendarEvents, demands]);

    const hasAlerts = alerts.length > 0;

    useEffect(() => {
        if (isOpen) {
            let initialMessage = "Olá! Eu sou o ECO.IA, seu assistente virtual. Em que posso ajudar?";
            if (alerts.length > 0) {
                initialMessage += `\n\n**Detectei ${alerts.length} alerta(s) para você:**`;
                alerts.forEach(alert => {
                    initialMessage += `\n- **${alert.title}:** ${alert.message}`;
                });
            }
            setMessages([{ text: initialMessage, sender: 'bot' }]);
        }
    }, [isOpen, hasAlerts]); // Depend on hasAlerts to refresh message when opening

    useEffect(() => {
        if (messagesContainerRef.current) {
            const { scrollHeight } = messagesContainerRef.current;
            messagesContainerRef.current.scrollTop = scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim() !== '' && !isLoading) {
            e.preventDefault();
            const userMessage: Message = { text: inputValue, sender: 'user' };
            const currentInput = inputValue;
            setMessages(prev => [...prev, userMessage]);
            setInputValue('');
            setIsLoading(true);

            try {
                if (!process.env.API_KEY) {
                    throw new Error("API key not configured.");
                }
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

                const chatHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Histórico da conversa anterior:\n${chatHistory}\n\nNova pergunta do usuário: ${currentInput}`,
                    config: {
                         systemInstruction: "Você é o ECO.IA, um assistente prestativo para o aplicativo de logística EcoLog. Suas respostas devem ser concisas, úteis e formatadas em markdown simples. Responda em português brasileiro."
                    }
                });
                
                const botResponse: Message = { text: response.text, sender: 'bot' };
                setMessages(prev => [...prev, botResponse]);
            } catch (error) {
                console.error("Gemini API error:", error);
                const errorMessage: Message = { text: "Desculpe, não consegui processar sua solicitação no momento.", sender: 'bot' };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 h-[450px] bg-bg-card border border-border-color rounded-lg shadow-2xl flex flex-col animate-fade-in-up">
                    <div className="p-4 bg-border-color rounded-t-lg font-semibold text-light flex items-center gap-2">
                        <i className="fas fa-robot text-secondary"></i> ECO.IA - Assistente Virtual
                    </div>
                    <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto text-sm space-y-4">
                        {messages.map((message, index) => (
                             <div key={index} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {message.sender === 'bot' && <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-white flex-shrink-0">IA</div>}
                                <div className={`max-w-[80%] p-2 rounded-lg ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-border-color text-light'}`} dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-white flex-shrink-0">IA</div>
                                <div className="max-w-[80%] p-2 rounded-lg bg-border-color text-light">
                                    <i className="fas fa-spinner fa-spin"></i>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-2 border-t border-border-color">
                        <input
                            type="text"
                            placeholder="Pergunte ao ECO.IA..."
                            className="w-full p-2 bg-bg-main border border-border-color rounded text-light text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleSendMessage}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-16 h-16 bg-secondary text-white rounded-full text-3xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200"
            >
                {hasAlerts && !isOpen && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-danger ring-2 ring-white"></span>
                )}
                <i className={`fas ${isOpen ? 'fa-times' : 'fa-brain'}`}></i>
            </button>
        </div>
    );
};

// Add simple animation for the chat window appearing
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
        animation: fade-in-up 0.3s ease-out;
    }
`;
document.head.appendChild(style);

export default ChatWidget;