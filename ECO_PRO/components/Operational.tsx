import React, { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { CalendarEvent } from '../types';
import OperationalReport from './OperationalReport';

type OperationalTab = 'calendar' | 'account-delay-report' | 'report' | 'bi' | 'operational-report';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
};

const handlePrintForm = (title: string, content: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Não foi possível abrir a janela de impressão. Por favor, desative o bloqueador de pop-ups.");
        return;
    }
    printWindow.document.write(`
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; font-size: 12pt; color: #333; }
                    .form-container { max-width: 680px; margin: auto; }
                    h3, h4 { margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; text-align: center; }
                    h4 { text-align: left; font-size: 1.1em; }
                    p { margin: 8px 0; }
                    .field { display: inline-block; border-bottom: 1px solid #333; min-width: 200px; padding: 0 5px; font-weight: bold; }
                    .textarea-content {
                        border: 1px solid #ccc;
                        padding: 10px;
                        min-height: 80px;
                        margin-top: 5px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    .declaration { margin-top: 30px; font-style: italic; font-size: 11pt; text-align: justify; }
                    .signature-line { margin-top: 60px; text-align: center; }
                    .signature-line p { margin: 0; }
                </style>
            </head>
            <body>
                <main class="form-container">
                    ${content}
                </main>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 150);
                    }
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
};


const ReimbursementForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        role: '',
        employeeId: '',
        requestDate: new Date().toISOString().split('T')[0],
        expenseType: 'Alimentação',
        otherExpenseType: '',
        expenseDate: '',
        amount: '',
        location: '',
        justification: '',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const generateAndPrint = () => {
        const expenseTypeDisplay = formData.expenseType === 'Outros' ? `Outros: ${formData.otherExpenseType}` : formData.expenseType;
        const printContent = `
            <h3>FORMULÁRIO DE JUSTIFICATIVA DE REEMBOLSO SEM COMPROVANTE</h3>
            
            <h4>1. IDENTIFICAÇÃO DO SOLICITANTE</h4>
            <p><strong>Nome completo:</strong> <span class="field">${formData.fullName || '&nbsp;'}</span></p>
            <p><strong>Cargo / Setor:</strong> <span class="field">${formData.role || '&nbsp;'}</span></p>
            <p><strong>Matrícula / ID:</strong> <span class="field">${formData.employeeId || '&nbsp;'}</span></p>
            <p><strong>Data da solicitação:</strong> <span class="field">${formData.requestDate ? new Date(formData.requestDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '&nbsp;'}</span></p>

            <h4>2. DETALHAMENTO DO REEMBOLSO</h4>
            <p><strong>Tipo de despesa:</strong> <span class="field">${expenseTypeDisplay || '&nbsp;'}</span></p>
            <p><strong>Data da despesa:</strong> <span class="field">${formData.expenseDate ? new Date(formData.expenseDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '&nbsp;'}</span></p>
            <p><strong>Valor solicitado:</strong> <span class="field">R$ ${formData.amount || '&nbsp;'}</span></p>
            <p><strong>Local / cidade:</strong> <span class="field">${formData.location || '&nbsp;'}</span></p>

            <h4>3. JUSTIFICATIVA DA AUSÊNCIA DE COMPROVANTE</h4>
            <div class="textarea-content">${formData.justification.replace(/\n/g, '<br />') || 'Nenhuma justificativa fornecida.'}</div>
            
            <h4>4. DESCRIÇÃO DA DESPESA E CONTEXTO</h4>
            <div class="textarea-content">${formData.description.replace(/\n/g, '<br />') || 'Nenhuma descrição fornecida.'}</div>

            <h4>5. DECLARAÇÃO DO SOLICITANTE</h4>
            <p class="declaration">
                Declaro, sob minha responsabilidade, que as informações prestadas neste formulário são verdadeiras e correspondem a despesas efetivamente realizadas em função do serviço.
                Estou ciente de que a falsidade das informações poderá implicar em sanções disciplinares e/ou legais.
            </p>

            <div class="signature-line">
                <p>___________________________________________</p>
                <p>Assinatura do solicitante</p>
            </div>
             <p style="text-align: center; margin-top: 20px;"><strong>Data:</strong> ____ / ____ / ______</p>
        `;
        handlePrintForm("Justificativa de Reembolso", printContent);
    };

    return (
        <div>
             <h2 className="text-xl font-bold mb-4"><i className="fas fa-file-signature mr-2"></i> Formulário de Justificativa de Reembolso</h2>
             <div className="bg-trade-secondary p-5 rounded-lg space-y-6">
                <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-semibold">1. IDENTIFICAÇÃO DO SOLICITANTE</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <input className="form-input" name="fullName" placeholder="Nome completo" value={formData.fullName} onChange={handleChange} />
                        <input className="form-input" name="role" placeholder="Cargo / Setor" value={formData.role} onChange={handleChange} />
                        <input className="form-input" name="employeeId" placeholder="Matrícula / ID" value={formData.employeeId} onChange={handleChange} />
                        <input className="form-input" name="requestDate" type="date" value={formData.requestDate} onChange={handleChange} />
                    </div>
                </fieldset>
                
                <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-semibold">2. DETALHAMENTO DO REEMBOLSO</legend>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                         <select className="form-select" name="expenseType" value={formData.expenseType} onChange={handleChange}>
                             <option>Alimentação</option>
                             <option>Transporte</option>
                             <option>Hospedagem</option>
                             <option>Outros</option>
                         </select>
                         {formData.expenseType === 'Outros' && <input className="form-input" name="otherExpenseType" placeholder="Especifique o tipo" value={formData.otherExpenseType} onChange={handleChange} />}
                         <input className="form-input" name="expenseDate" type="date" value={formData.expenseDate} onChange={handleChange} />
                         <input className="form-input" name="amount" type="number" placeholder="Valor solicitado R$" value={formData.amount} onChange={handleChange} />
                         <input className="form-input" name="location" placeholder="Local / Cidade" value={formData.location} onChange={handleChange} />
                    </div>
                </fieldset>

                <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-semibold">3. JUSTIFICATIVA DA AUSÊNCIA DE COMPROVANTE</legend>
                    <textarea className="form-input w-full mt-2" name="justification" rows={4} placeholder="Descreva o motivo..." value={formData.justification} onChange={handleChange}></textarea>
                </fieldset>
                
                <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-semibold">4. DESCRIÇÃO DA DESPESA E CONTEXTO</legend>
                    <textarea className="form-input w-full mt-2" name="description" rows={4} placeholder="Explique o serviço ou despesa e o contexto..." value={formData.description} onChange={handleChange}></textarea>
                </fieldset>

                 <button onClick={generateAndPrint} className="w-full px-4 py-3 bg-accent text-white font-bold rounded-md hover:bg-opacity-90 flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-105 shadow-md hover:shadow-lg">
                    <i className="fas fa-print"></i> GERAR PDF / IMPRIMIR
                 </button>
             </div>
        </div>
    );
};


const AccountDelayReport = () => {
    const { calendarEvents } = useAppStore();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const delayedAccounts = useMemo(() => calendarEvents.filter(event => {
        if (event.status !== 'pending') return false;
        const dueDate = new Date(event.dueDate);
        // Ensure timezone doesn't shift the date
        const utcDueDate = new Date(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());
        const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        
        return utcDueDate.getMonth() === currentMonth && 
               utcDueDate.getFullYear() === currentYear &&
               utcDueDate < utcNow;
    }), [calendarEvents, currentMonth, currentYear]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4"><i className="fas fa-file-invoice-dollar mr-2"></i> Relatório de Atrasos de Contas - {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)}</h2>
            <div className="bg-trade-secondary p-4 rounded-lg overflow-x-auto">
                {delayedAccounts.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Data de Vencimento</th>
                                <th className="px-4 py-3">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {delayedAccounts.map(event => (
                                <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                    <td className="px-4 py-3 font-medium">{event.description}</td>
                                    <td className="px-4 py-3 text-red-400 font-semibold">{formatDate(event.dueDate)}</td>
                                    <td className="px-4 py-3">{formatCurrency(event.value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-400 py-4">Nenhuma conta em atraso para o mês atual.</p>
                )}
            </div>
        </div>
    );
};

const InterestPaidReport = () => {
    const { calendarEvents } = useAppStore();
    const MOCK_INTEREST_RATE = 0.02; // 2%

    const latePayments = useMemo(() => calendarEvents.filter(event => 
        event.status === 'completed' &&
        event.completionDate &&
        new Date(event.completionDate) > new Date(event.dueDate)
    ), [calendarEvents]);

    const totalInterest = useMemo(() => latePayments.reduce((sum, event) => {
        return sum + (event.value * MOCK_INTEREST_RATE);
    }, 0), [latePayments]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4"><i className="fas fa-percent mr-2"></i> Total de Juros Pagos por Atrasos</h2>
            <div className="bg-trade-secondary p-5 rounded-lg text-center mb-5">
                <p className="text-gray-400">Valor Total Estimado de Juros Pagos</p>
                <p className="text-4xl font-bold text-danger my-2">{formatCurrency(totalInterest)}</p>
                <p className="text-xs text-gray-500">(Baseado em uma taxa simulada de {MOCK_INTEREST_RATE * 100}%)</p>
            </div>
            <div className="bg-trade-secondary p-4 rounded-lg overflow-x-auto">
                <h3 className="font-semibold mb-3">Detalhes dos Pagamentos em Atraso</h3>
                 {latePayments.length > 0 ? (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Vencimento</th>
                                <th className="px-4 py-3">Data do Pagamento</th>
                                <th className="px-4 py-3">Valor Original</th>
                                <th className="px-4 py-3">Juros Estimado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {latePayments.map(event => (
                                <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                    <td className="px-4 py-3 font-medium">{event.description}</td>
                                    <td className="px-4 py-3">{formatDate(event.dueDate)}</td>
                                    <td className="px-4 py-3 font-semibold text-warning">{formatDate(event.completionDate)}</td>
                                    <td className="px-4 py-3">{formatCurrency(event.value)}</td>
                                    <td className="px-4 py-3 text-red-400">{formatCurrency(event.value * MOCK_INTEREST_RATE)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-400 py-4">Nenhum pagamento com juros por atraso registrado.</p>
                )}
            </div>
        </div>
    );
};


const OperationalCalendar = () => {
    const { calendarEvents, addCalendarEvent, updateCalendarEvent } = useAppStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [formState, setFormState] = useState({ description: '', value: '', dueDate: '', reminderMinutes: '' });
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    const { month, year, daysInMonth } = useMemo(() => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonthCount = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push({ key: `pad-${i}`, day: null });
        for (let i = 1; i <= daysInMonthCount; i++) days.push({ key: `day-${i}`, day: i });
        
        return { month, year, daysInMonth: days };
    }, [currentDate]);

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formState.description && formState.value && formState.dueDate) {
            addCalendarEvent({
                description: formState.description,
                value: parseFloat(formState.value),
                dueDate: formState.dueDate,
                reminderMinutes: formState.reminderMinutes ? parseInt(formState.reminderMinutes, 10) : undefined
            });
            setFormState({ description: '', value: '', dueDate: '', reminderMinutes: '' });
        } else {
            alert('Por favor, preencha todos os campos obrigatórios.');
        }
    };
    
    const handleSaveEvent = () => {
        if (editingEvent) {
            updateCalendarEvent(editingEvent);
            setEditingEvent(null);
        }
    };

    return (
        <div className="bg-trade-secondary p-5 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 rounded hover:bg-gray-700"><i className="fas fa-chevron-left"></i></button>
                <h2 className="text-xl font-bold">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate)}</h2>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 rounded hover:bg-gray-700"><i className="fas fa-chevron-right"></i></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-400 mb-2">
                <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map(d => {
                    const eventsForDay = d.day ? calendarEvents.filter(e => {
                        const eventDate = new Date(e.dueDate);
                        return eventDate.getUTCFullYear() === year &&
                               eventDate.getUTCMonth() === month &&
                               eventDate.getUTCDate() === d.day;
                    }) : [];
                    return (
                        <div key={d.key} className={`h-28 p-1.5 rounded bg-bg-main/70 flex flex-col gap-1 overflow-hidden ${d.day ? 'border border-transparent hover:border-accent' : 'opacity-50'}`}>
                            <span className="font-bold">{d.day}</span>
                            <div className="overflow-y-auto space-y-1">
                                {eventsForDay.map(event => (
                                    <div 
                                        key={event.id} 
                                        onClick={() => setEditingEvent(event)}
                                        title={`${event.description} - ${formatCurrency(event.value)}`} 
                                        className={`text-xs p-1 rounded-md truncate cursor-pointer ${event.status === 'completed' ? 'bg-green-500/30' : 'bg-accent/80'}`}
                                    >
                                        {event.reminderMinutes && <i className="fas fa-bell fa-xs mr-1"></i>}
                                        {event.description}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-trade-secondary">
                <h3 className="text-lg font-semibold mb-3">Cadastrar Conta ou Dívida</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="form-group">
                        <label className="form-label" htmlFor="op-description">Descrição</label>
                        <input className="form-input" type="text" id="op-description" name="description" value={formState.description} onChange={handleFormChange} required />
                    </div>
                     <div className="form-group">
                        <label className="form-label" htmlFor="op-value">Valor (R$)</label>
                        <input className="form-input" type="number" id="op-value" name="value" step="0.01" min="0" value={formState.value} onChange={handleFormChange} required />
                    </div>
                     <div className="form-group">
                        <label className="form-label" htmlFor="op-dueDate">Data de Vencimento</label>
                        <input className="form-input" type="date" id="op-dueDate" name="dueDate" value={formState.dueDate} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="op-reminder">Lembrete</label>
                        <select className="form-select" id="op-reminder" name="reminderMinutes" value={formState.reminderMinutes} onChange={handleFormChange}>
                            <option value="">Nenhum</option>
                            <option value="15">15 minutos antes</option>
                            <option value="60">1 hora antes</option>
                            <option value="1440">1 dia antes</option>
                            <option value="2880">2 dias antes</option>
                        </select>
                    </div>
                    <button type="submit" className="px-4 py-2.5 bg-accent text-white font-semibold rounded-md hover:bg-opacity-90 h-fit shadow-md hover:shadow-lg transition-shadow">Adicionar ao Calendário</button>
                </form>
            </div>
             {editingEvent && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-bg-card rounded-lg p-6 shadow-xl w-full max-w-md text-light">
                        <h3 className="text-xl font-bold text-light mb-4">Editar Evento do Calendário</h3>
                        <div className="space-y-2 mb-4">
                            <p><strong className="text-gray-text">Descrição:</strong> {editingEvent.description}</p>
                            <p><strong className="text-gray-text">Valor:</strong> {formatCurrency(editingEvent.value)}</p>
                            <p><strong className="text-gray-text">Vencimento:</strong> {formatDate(editingEvent.dueDate)}</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-reminder">Lembrete</label>
                            <select 
                                className="form-select" 
                                id="edit-reminder"
                                value={editingEvent.reminderMinutes || ''}
                                onChange={(e) => setEditingEvent({
                                    ...editingEvent,
                                    reminderMinutes: e.target.value ? parseInt(e.target.value, 10) : undefined
                                })}
                            >
                                <option value="">Nenhum</option>
                                <option value="15">15 minutos antes</option>
                                <option value="60">1 hora antes</option>
                                <option value="1440">1 dia antes</option>
                                <option value="2880">2 dias antes</option>
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setEditingEvent(null)} className="px-4 py-2 bg-border-color text-light font-semibold rounded-md hover:bg-opacity-90">Cancelar</button>
                            <button onClick={handleSaveEvent} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-opacity-90">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const Operational: React.FC = () => {
    const [activeTab, setActiveTab] = useState<OperationalTab>('calendar');

    const TabButton: React.FC<{ tabId: OperationalTab; text: string; icon: string; }> = ({ tabId, text, icon }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-bold transition-colors duration-200
                ${activeTab === tabId ? 'bg-accent text-white' : 'bg-trade-secondary text-light hover:bg-gray-700'}`}
        >
            <i className={`fas ${icon}`}></i> {text}
        </button>
    );

    return (
        <div className="bg-trade-primary rounded-lg p-5 shadow-lg text-light">
             <div className="text-center mb-5">
                <h1 className="text-2xl font-bold"><i className="fas fa-dolly-flatbed"></i> Controle Operacional - Eco Log</h1>
            </div>
            <div className="flex flex-wrap rounded-lg overflow-hidden border border-trade-secondary mb-4">
                <TabButton tabId="calendar" text="Calendário Operacional" icon="fa-calendar-alt" />
                <TabButton tabId="operational-report" text="Relatório Operacional" icon="fa-chart-pie" />
                <TabButton tabId="account-delay-report" text="Relatorio de Atrasos de Contas Mês" icon="fa-file-invoice-dollar" />
                <TabButton tabId="report" text="Juros por Atraso" icon="fa-percent" />
                <TabButton tabId="bi" text="Justificativa de Reembolso" icon="fa-file-signature" />
            </div>

            <div>
                {activeTab === 'calendar' && <OperationalCalendar />}
                {activeTab === 'operational-report' && <OperationalReport />}
                {activeTab === 'account-delay-report' && <AccountDelayReport />}
                {activeTab === 'report' && <InterestPaidReport />}
                {activeTab === 'bi' && <ReimbursementForm />}
            </div>
        </div>
    );
};

const opFormStyles = `
.form-group { display: flex; flex-direction: column; }
.form-label { margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #d1d5db; }
.form-input, .form-select {
    padding: 0.6rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    font-size: 1rem;
    background-color: #111827;
    color: #f9fafb;
}
`;
const opStyleSheet = document.createElement("style");
opStyleSheet.innerText = opFormStyles;
document.head.appendChild(opStyleSheet);

export default Operational;