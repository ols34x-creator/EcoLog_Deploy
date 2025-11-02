

import React, { useMemo, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAppStore } from '../hooks/useAppStore';
import { CalendarEvent, RecordType, FinancialRecord, RevenueRecord, ReceivableRecord, Demand, Vehicle, MaintenanceTask } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import DraggableWrapper from './DraggableWrapper';


ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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

const isVehicleInvalid = (vehicle: Vehicle): boolean => {
    return !vehicle.plate || !vehicle.model || !vehicle.year || !vehicle.driver;
}

const AlertsPanel = () => {
    const { financialData, calendarEvents, completeCalendarEvent, demands, fleetData, maintenanceTasks } = useAppStore();
    const { t } = useLanguage();
    const [modalState, setModalState] = useState<{isOpen: boolean; event: CalendarEvent | null; justification: string}>({
        isOpen: false,
        event: null,
        justification: ''
    });

    const alerts = useMemo(() => {
        const generatedAlerts = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // 1. Upcoming Payments
        const fiveDaysFromNow = new Date(now);
        fiveDaysFromNow.setDate(now.getDate() + 5);
        
        const upcomingPayments = calendarEvents.filter(e => {
            const dueDate = new Date(e.dueDate);
            return e.status === 'pending' && dueDate >= now && dueDate <= fiveDaysFromNow;
        });

        upcomingPayments.forEach(event => {
            generatedAlerts.push({
                id: `payment-${event.id}`,
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                title: 'Vencimento Próximo',
                message: `A conta "${event.description}" no valor de ${formatCurrency(event.value)} vence em ${new Date(event.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}.`,
                action: () => setModalState({ isOpen: true, event, justification: '' }),
                actionLabel: 'Finalizar'
            });
        });
        
        const { totalRevenue, totalFixedCosts, totalVariableCosts, netProfit } = {
            totalRevenue: financialData.revenues.reduce((sum, item) => sum + item.value, 0),
            totalFixedCosts: financialData.fixedCosts.reduce((sum, item) => sum + item.value, 0),
            totalVariableCosts: financialData.variableCosts.reduce((sum, item) => sum + item.value, 0),
            get netProfit() { return this.totalRevenue - this.totalFixedCosts - this.totalVariableCosts }
        };

        // 2. High Cost
        const allCosts = [...financialData.fixedCosts, ...financialData.variableCosts];
        const highCostThreshold = totalRevenue * 0.25; // An expense is "high" if it's > 25% of total revenue
        const highCostItems = allCosts.filter(c => c.value > highCostThreshold && totalRevenue > 0);
        if (highCostItems.length > 0) {
            generatedAlerts.push({
                id: 'high-cost',
                type: 'danger',
                icon: 'fa-dollar-sign',
                title: 'ATENÇÃO: ALTO CUSTO',
                message: `Detectado ${highCostItems.length} custo(s) (${highCostItems.map(c => c.description).join(', ')}) com valor elevado em relação à receita.`
            });
        }
        
        // 3. Incomplete Data (Financial)
        const allRecords = [
            ...financialData.fixedCosts.map(r => ({ ...r, type: 'fixedCosts' as RecordType })),
            ...financialData.variableCosts.map(r => ({ ...r, type: 'variableCosts' as RecordType })),
            ...financialData.revenues.map(r => ({ ...r, type: 'revenues' as RecordType })),
            ...financialData.receivables.map(r => ({ ...r, type: 'receivables' as RecordType })),
        ];

        const incompleteRecords = allRecords.filter(r => isRecordInvalid(r, r.type) || !r.attachment);
        if (incompleteRecords.length > 0) {
            const recordNames = incompleteRecords.map(r => r.name || `ID ${r.id}`).slice(0, 3).join(', ');
            const additionalCount = incompleteRecords.length > 3 ? ` e mais ${incompleteRecords.length - 3}` : '';
            
            generatedAlerts.push({
                id: 'incomplete-data',
                type: 'info',
                icon: 'fa-edit',
                title: `${incompleteRecords.length} REGISTRO(S) COM DADOS PENDENTES`,
                message: `Verifique: ${recordNames}${additionalCount}. Campos essenciais ou anexos podem estar faltando.`
            });
        }
        
        // 4. Costs exceed revenue
        if (netProfit < 0) {
            generatedAlerts.push({
                id: 'negative-balance',
                type: 'danger',
                icon: 'fa-chart-line',
                title: 'CUSTO ULTRAPASSOU RECEITA',
                message: `O total de custos (${formatCurrency(totalFixedCosts + totalVariableCosts)}) é maior que a receita total (${formatCurrency(totalRevenue)}).`
            });
        }

        // 5. Incomplete Demands
        const incompleteDemands = demands.filter(isDemandInvalid);
        if(incompleteDemands.length > 0) {
             generatedAlerts.push({
                id: 'incomplete-demands',
                type: 'info',
                icon: 'fa-tasks',
                title: `${incompleteDemands.length} DEMANDA(S) COM DADOS PENDENTES`,
                message: `Demandas para ${incompleteDemands.map(d => d.client).slice(0,2).join(', ')}... precisam de atenção (prazo, responsável, etc).`
            });
        }
        
        // 6. Demands nearing deadline
        const demandsNearDeadline = demands.filter(d => {
            if (!d.prazo || d.status === 'concluido') return false;
            const deadline = new Date(d.prazo);
            const daysDiff = (deadline.getTime() - now.getTime()) / (1000 * 3600 * 24);
            return daysDiff > 0 && daysDiff <= 3;
        });

        if (demandsNearDeadline.length > 0) {
             generatedAlerts.push({
                id: 'demands-deadline',
                type: 'warning',
                icon: 'fa-hourglass-half',
                title: 'PRAZOS DE DEMANDA EXPIRANDO',
                message: `${demandsNearDeadline.length} demanda(s) estão próximas do prazo final de entrega.`
            });
        }

        // 7. Overdue Maintenance
        const overdueMaintenance = maintenanceTasks.filter(task => {
            if (task.status !== 'Agendada') return false;
            const taskDate = new Date(task.date + 'T00:00:00');
            return taskDate < now;
        });

        if (overdueMaintenance.length > 0) {
            const vehicle = fleetData.find(v => v.id === overdueMaintenance[0].vehicleId);
             generatedAlerts.push({
                id: 'overdue-maintenance',
                type: 'danger',
                icon: 'fa-tools',
                title: 'MANUTENÇÃO DE FROTA VENCIDA',
                message: `${overdueMaintenance.length} tarefa(s) de manutenção estão vencidas. Ex: ${overdueMaintenance[0].serviceType} para o veículo ${vehicle?.plate || 'desconhecido'}.`
            });
        }

        return generatedAlerts;
    }, [financialData, calendarEvents, completeCalendarEvent, demands, fleetData, maintenanceTasks]);

    const handleCompleteEvent = () => {
        if (modalState.event && modalState.justification.trim()) {
            completeCalendarEvent(modalState.event.id, modalState.justification);
            setModalState({ isOpen: false, event: null, justification: '' });
        } else {
            alert("Por favor, forneça uma justificativa.");
        }
    };

    if (alerts.length === 0) return null;
    
    const alertColors = {
        danger: 'bg-red-500/20 border-danger text-red-200',
        warning: 'bg-yellow-500/20 border-warning text-yellow-200',
        info: 'bg-blue-500/20 border-secondary text-blue-200'
    };

    return (
        <>
            <div className="bg-bg-card rounded-lg p-4 shadow-lg mb-5 space-y-3">
                <h3 className="text-lg font-semibold text-light mb-2"><i className="fas fa-bell mr-2"></i> {t('biAlertsPanel')}</h3>
                {alerts.map(alert => (
                    <div key={alert.id} className={`flex items-center justify-between p-3 rounded-md border-l-4 ${alertColors[alert.type as keyof typeof alertColors]}`}>
                        <div className="flex items-center">
                            <i className={`fas ${alert.icon} text-xl w-8 text-center`}></i>
                            <div className="ml-3">
                                <p className="font-bold">{alert.title}</p>
                                <p className="text-sm">{alert.message}</p>
                            </div>
                        </div>
                        {alert.action && (
                            <button onClick={alert.action} className="bg-secondary text-white px-3 py-1 text-sm font-semibold rounded-md hover:bg-opacity-80 transition">
                                {alert.actionLabel}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {modalState.isOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-bg-card rounded-lg p-6 shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold text-light mb-4">Finalizar Alerta de Pagamento</h3>
                        <p className="text-gray-text mb-2">Conta: <span className="font-semibold text-light">{modalState.event?.description}</span></p>
                        <p className="text-gray-text mb-4">Valor: <span className="font-semibold text-light">{formatCurrency(modalState.event?.value ?? 0)}</span></p>
                        <div>
                            <label htmlFor="justification" className="block text-sm font-medium text-light mb-2">Justificativa (Obrigatório)</label>
                            <textarea
                                id="justification"
                                value={modalState.justification}
                                onChange={(e) => setModalState(s => ({ ...s, justification: e.target.value }))}
                                className="w-full bg-bg-main border border-border-color rounded-md p-2 text-sm text-light focus:outline-none focus:ring-2 focus:ring-secondary"
                                rows={3}
                                placeholder="Ex: Pagamento efetuado via PIX."
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setModalState({ isOpen: false, event: null, justification: '' })} className="px-4 py-2 bg-border-color text-light font-semibold rounded-md hover:bg-opacity-90">Cancelar</button>
                            <button onClick={handleCompleteEvent} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-opacity-90">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const KpiCard: React.FC<{ title: string; value: string | number; change?: string; changeType?: 'positive' | 'negative'; icon: string; iconBg: string; borderColor: string; }> = ({ title, value, change, changeType, icon, iconBg, borderColor }) => (
    <div className={`bg-bg-main rounded-lg p-4 shadow-md border-l-4 ${borderColor} transform hover:-translate-y-1 transition-transform duration-300`}>
        <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-semibold text-gray-text">{title}</div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white ${iconBg}`}>{icon}</div>
        </div>
        <div className="text-3xl font-bold text-light mb-1">{value}</div>
        {change && changeType && (
            <div className={`text-xs flex items-center gap-1 ${changeType === 'positive' ? 'text-success' : 'text-danger'}`}>
                <span>{changeType === 'positive' ? '↑' : '↓'}</span>
                <span>{change}% vs mês anterior</span>
            </div>
        )}
    </div>
);


const ChartCard: React.FC<{ title: string; children: React.ReactNode; actions?: React.ReactNode; }> = ({ title, children, actions }) => (
    <div className="bg-bg-card rounded-lg p-5 shadow-lg h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-light">{title}</h3>
            <div>{actions}</div>
        </div>
        <div className="h-72 w-full flex-grow">{children}</div>
    </div>
);

const Dashboard: React.FC = () => {
    const { financialData, fleetData, maintenanceTasks, demands, isLayoutMode, layouts, setLayouts, activeTab } = useAppStore();
    const { t } = useLanguage();
    const [draggedId, setDraggedId] = useState<string | null>(null);
    
    const pageId = activeTab;
    const initialLayout = useMemo(() => ['alerts', 'financialSummary', 'operationalSummary', 'cashFlowDistribution', 'fleetMaintenance'], []);
    const layout = useMemo(() => layouts[pageId] || initialLayout, [layouts, pageId, initialLayout]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
        if (!draggedId || draggedId === targetId) return;

        const draggedIndex = layout.indexOf(draggedId);
        const targetIndex = layout.indexOf(targetId);
        
        const newLayout = [...layout];
        const [removed] = newLayout.splice(draggedIndex, 1);
        newLayout.splice(targetIndex, 0, removed);
        
        setLayouts(prev => ({...prev, [pageId]: newLayout}));
        setDraggedId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };


    const kpiValues = useMemo(() => {
        const totalRevenue = financialData.revenues.reduce((sum, item) => sum + item.value, 0);
        const totalFixedCosts = financialData.fixedCosts.reduce((sum, item) => sum + item.value, 0);
        const totalVariableCosts = financialData.variableCosts.reduce((sum, item) => sum + item.value, 0);
        const totalReceivables = financialData.receivables.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.value, 0);
        const netProfit = totalRevenue - totalFixedCosts - totalVariableCosts;
        
        const operationalVehicles = fleetData.filter(v => v.status === 'Operacional').length;
        const maintenanceNow = fleetData.filter(v => v.status === 'Em Manutenção').length;
        const scheduledMaintenance = maintenanceTasks.filter(t => t.status === 'Agendada').length;
        const openDemands = demands.filter(d => d.status !== 'concluido').length;
        
        return { 
            totalRevenue, totalFixedCosts, totalVariableCosts, totalReceivables, netProfit,
            operationalVehicles, maintenanceNow, scheduledMaintenance, openDemands
        };
    }, [financialData, fleetData, maintenanceTasks, demands]);

    const chartData = useMemo(() => {
        const labels: string[] = [];
        const monthlyRevenues: number[] = [];
        const monthlyExpenses: number[] = [];
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            labels.push(`${monthNames[month]}/${year.toString().slice(-2)}`);
            
            const revenue = financialData.revenues.filter(r => { const d = new Date(r.date); return d.getMonth() === month && d.getFullYear() === year; }).reduce((s, i) => s + i.value, 0);
            const expense = [...financialData.fixedCosts, ...financialData.variableCosts].filter(c => { const d = new Date(c.date); return d.getMonth() === month && d.getFullYear() === year; }).reduce((s, i) => s + i.value, 0);

            monthlyRevenues.push(revenue);
            monthlyExpenses.push(expense);
        }

        const costDistribution: { [key: string]: number } = {};
        [...financialData.fixedCosts, ...financialData.variableCosts].forEach(item => {
            const category = item.category.split(':')[0] || 'Outros';
            costDistribution[category] = (costDistribution[category] || 0) + item.value;
        });

        return {
            labels,
            monthlyRevenues,
            monthlyExpenses,
            cashFlow: monthlyRevenues.map((r, i) => r - monthlyExpenses[i]),
            costDistribution,
        };
    }, [financialData]);

    const fleetChartData = useMemo(() => {
        const fleetStatusCounts = {
            'Operacional': 0,
            'Em Manutenção': 0,
            'Inativo': 0,
        };
        fleetData.forEach(v => {
            fleetStatusCounts[v.status]++;
        });

        const maintenanceCostByVehicle: { [key: string]: number } = {};
        maintenanceTasks.forEach(task => {
            const vehicle = fleetData.find(v => v.id === task.vehicleId);
            if (vehicle) {
                const plate = vehicle.plate;
                maintenanceCostByVehicle[plate] = (maintenanceCostByVehicle[plate] || 0) + task.cost;
            }
        });

        return {
            fleetStatusLabels: Object.keys(fleetStatusCounts),
            fleetStatusData: Object.values(fleetStatusCounts),
            maintenanceCostLabels: Object.keys(maintenanceCostByVehicle),
            maintenanceCostData: Object.values(maintenanceCostByVehicle),
        };
    }, [fleetData, maintenanceTasks]);
    
    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94A3B8' } } },
        scales: { 
            x: { ticks: { color: '#94A3B8' }, grid: { color: '#334155' } }, 
            y: { ticks: { color: '#94A3B8', callback: (value: any) => `R$${value/1000}k` }, grid: { color: '#334155' } } 
        }
    };

    const componentsMap = useMemo(() => ({
        alerts: <AlertsPanel />,
        financialSummary: (
            <div className="bg-bg-card rounded-lg p-5 shadow-lg">
                <h3 className="text-lg font-semibold text-light mb-4"><i className="fas fa-dollar-sign mr-2 text-primary"></i> {t('financialSummaryPanel')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                    <KpiCard title={t('totalRevenue')} value={formatCurrency(kpiValues.totalRevenue)} change="12" changeType="positive" icon="💰" iconBg="bg-success/80" borderColor="border-success" />
                    <KpiCard title={t('fixedCosts')} value={formatCurrency(kpiValues.totalFixedCosts)} change="5" changeType="negative" icon="🏢" iconBg="bg-danger/80" borderColor="border-danger" />
                    <KpiCard title={t('variableCosts')} value={formatCurrency(kpiValues.totalVariableCosts)} change="8" changeType="positive" icon="⛽" iconBg="bg-warning/80" borderColor="border-warning" />
                    <KpiCard title={t('netProfit')} value={formatCurrency(kpiValues.netProfit)} change="15" changeType="positive" icon="📈" iconBg="bg-secondary/80" borderColor="border-secondary" />
                    <KpiCard title={t('receivables')} value={formatCurrency(kpiValues.totalReceivables)} change="3" changeType="negative" icon="📋" iconBg="bg-primary/80" borderColor="border-primary" />
                </div>
            </div>
        ),
        operationalSummary: (
            <div className="bg-bg-card rounded-lg p-5 shadow-lg">
                <h3 className="text-lg font-semibold text-light mb-4"><i className="fas fa-cogs mr-2 text-primary"></i> {t('operationalSummaryPanel')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <KpiCard title={t('operationalVehicles')} value={kpiValues.operationalVehicles} icon="🚚" iconBg="bg-success/80" borderColor="border-success" />
                    <KpiCard title={t('inMaintenance')} value={kpiValues.maintenanceNow} icon="🛠️" iconBg="bg-warning/80" borderColor="border-warning" />
                    <KpiCard title={t('scheduledMaintenance')} value={kpiValues.scheduledMaintenance} icon="📅" iconBg="bg-blue-500/80" borderColor="border-blue-400" />
                    <KpiCard title={t('openDemands')} value={kpiValues.openDemands} icon="📂" iconBg="bg-purple-500/80" borderColor="border-purple-400" />
                </div>
            </div>
        ),
        cashFlowDistribution: (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3">
                    <ChartCard title={t('monthlyCashFlow')} actions={<select className="bg-bg-main border border-border-color rounded p-1 text-xs"><option>Últimos 6 meses</option></select>}>
                        <Bar options={commonChartOptions as any} data={{
                            labels: chartData.labels,
                            datasets: [{
                                label: 'Fluxo de Caixa',
                                data: chartData.cashFlow,
                                backgroundColor: chartData.cashFlow.map(v => v >= 0 ? 'rgb(var(--color-primary))' : 'rgb(var(--color-danger))'),
                                borderRadius: 4,
                            }]
                        }} />
                    </ChartCard>
                </div>
                <div className="lg:col-span-2">
                     <ChartCard title={t('costDistribution')} actions={<select className="bg-bg-main border border-border-color rounded p-1 text-xs"><option>Mês Atual</option></select>}>
                        <Doughnut options={{...commonChartOptions, scales: undefined, plugins: { legend: { position: 'right', labels: { color: 'rgb(var(--color-gray-text))' } } }}} data={{
                            labels: Object.keys(chartData.costDistribution),
                            datasets: [{
                                data: Object.values(chartData.costDistribution),
                                backgroundColor: ['#06B6D4', '#14B8A6', '#FBBF24', '#F87171', '#8B5CF6', '#EC4899'],
                                borderColor: 'rgb(var(--color-bg-card))',
                                borderWidth: 3,
                            }]
                        }} />
                    </ChartCard>
                </div>
            </div>
        ),
        fleetMaintenance: (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartCard title={t('fleetStatus')}>
                    <Bar 
                        options={{...commonChartOptions, scales: { x: commonChartOptions.scales.x, y: {...commonChartOptions.scales.y, ticks: { color: 'rgb(var(--color-gray-text))', stepSize: 1 } } }}} 
                        data={{
                            labels: fleetChartData.fleetStatusLabels,
                            datasets: [{
                                label: 'Nº de Veículos',
                                data: fleetChartData.fleetStatusData,
                                backgroundColor: ['rgb(var(--color-success))', 'rgb(var(--color-warning))', 'rgb(var(--color-danger))'],
                                borderRadius: 4,
                            }]
                        }} 
                    />
                </ChartCard>
                <ChartCard title={t('maintenanceCostsPerVehicle')}>
                    <Doughnut 
                        options={{...commonChartOptions, scales: undefined, plugins: { legend: { position: 'right', labels: { color: 'rgb(var(--color-gray-text))' } } }}} 
                        data={{
                            labels: fleetChartData.maintenanceCostLabels,
                            datasets: [{
                                data: fleetChartData.maintenanceCostData,
                                backgroundColor: ['#3B82F6', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
                                borderColor: 'rgb(var(--color-bg-card))',
                                borderWidth: 3,
                            }]
                        }} 
                    />
                </ChartCard>
            </div>
        )
    }), [kpiValues, chartData, fleetChartData, t, commonChartOptions]);


    return (
        <div className="space-y-5">
             {layout.map(id => (
                <DraggableWrapper 
                    key={id} 
                    id={id}
                    isDraggable={isLayoutMode}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    {componentsMap[id as keyof typeof componentsMap]}
                </DraggableWrapper>
            ))}
        </div>
    );
};

export default Dashboard;