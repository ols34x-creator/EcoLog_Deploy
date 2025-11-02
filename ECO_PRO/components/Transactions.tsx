import React, { useMemo, useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { FinancialRecord, ReceivableRecord, RevenueRecord, RecordType } from '../types';
import DraggableWrapper from './DraggableWrapper';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
};

const TableCard: React.FC<{ title: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, children, actions }) => (
    <div className="bg-bg-card rounded-lg p-5 shadow-lg mb-5 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-light">{title}</h3>
            <div>{actions}</div>
        </div>
        <table className="w-full text-sm text-left text-gray-text">
            {children}
        </table>
    </div>
);

const Transactions: React.FC = () => {
    const { financialData, deleteRecord, markAsPaid, setActiveTab, logAction, isLayoutMode, layouts, setLayouts, activeTab } = useAppStore();
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const pageId = activeTab;
    const initialLayout = useMemo(() => ['fixedCosts', 'variableCosts', 'revenues', 'receivables'], []);
    const layout = useMemo(() => layouts[pageId] || initialLayout, [layouts, pageId, initialLayout]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
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
    };

    const isRecordInvalid = (item: FinancialRecord | RevenueRecord | ReceivableRecord, type: RecordType): boolean => {
        if (!item.name || !item.description || item.value == null || !item.category) {
            return true;
        }

        switch (type) {
            case 'fixedCosts':
            case 'variableCosts':
                return !(item as FinancialRecord).date;
            case 'revenues':
                const revenue = item as RevenueRecord;
                return !revenue.date || !revenue.client;
            case 'receivables':
                const receivable = item as ReceivableRecord;
                return !receivable.dueDate || !receivable.client;
            default:
                return false;
        }
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert("Não há dados para exportar.");
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                    cell = cell.replace(/"/g, '""'); // Escape double quotes
                    if (cell.search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        logAction(`Exported ${filename}`);
    };

    const handleEdit = (type: RecordType, id: number) => {
        // This is a simplified edit. A real app would open a modal with the record data.
        alert(`Editing ${type} record with ID ${id}. This action will delete the item and you can re-add it from the 'Adicionar' tab.`);
        deleteRecord(type, id);
        setActiveTab('add-record');
    };

    const handleDelete = (type: RecordType, id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este registro?')) {
            deleteRecord(type, id);
        }
    };
    
    const componentsMap = {
        fixedCosts: (
             <TableCard 
                title="Custos Fixos"
                actions={
                    <button 
                        onClick={() => exportToCSV(financialData.fixedCosts, 'custos_fixos.csv')}
                        className="px-3 py-1 bg-secondary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 flex items-center gap-1 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <i className="fas fa-file-csv mr-1"></i> Exportar CSV
                    </button>
                }
            >
                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">Descrição</th>
                        <th scope="col" className="px-6 py-3">Categoria</th>
                        <th scope="col" className="px-6 py-3">Valor</th>
                        <th scope="col" className="px-6 py-3">Data</th>
                        <th scope="col" className="px-6 py-3">Anexo</th>
                        <th scope="col" className="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {financialData.fixedCosts.map((item: FinancialRecord) => {
                        const isInvalid = isRecordInvalid(item, 'fixedCosts');
                        const rowClass = isInvalid
                            ? 'bg-red-900/50 border-b border-red-700 hover:bg-red-800/60'
                            : 'bg-bg-card border-b border-border-color hover:bg-border-color';
                        return (
                            <tr key={item.id} className={rowClass} title={item.observation || 'Sem observações.'}>
                                <td className="px-6 py-4">{item.name}</td>
                                <td className="px-6 py-4">{item.description}</td>
                                <td className="px-6 py-4">{item.category}</td>
                                <td className="px-6 py-4">{formatCurrency(item.value)}</td>
                                <td className="px-6 py-4">{formatDate(item.date)}</td>
                                <td className="px-6 py-4 text-center">{item.attachment ? '📎' : ''}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => handleEdit('fixedCosts', item.id)} className="text-blue-400 hover:text-blue-300">✏️</button>
                                    <button onClick={() => handleDelete('fixedCosts', item.id)} className="text-red-500 hover:text-red-400">🗑️</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </TableCard>
        ),
        variableCosts: (
            <TableCard 
                title="Custos Variáveis"
                actions={
                    <button 
                        onClick={() => exportToCSV(financialData.variableCosts, 'custos_variaveis.csv')}
                        className="px-3 py-1 bg-secondary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 flex items-center gap-1 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <i className="fas fa-file-csv mr-1"></i> Exportar CSV
                    </button>
                }
            >
                 <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">Descrição</th>
                        <th scope="col" className="px-6 py-3">Categoria</th>
                        <th scope="col" className="px-6 py-3">Valor</th>
                        <th scope="col" className="px-6 py-3">Data</th>
                        <th scope="col" className="px-6 py-3">Anexo</th>
                        <th scope="col" className="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {financialData.variableCosts.map((item: FinancialRecord) => {
                         const isInvalid = isRecordInvalid(item, 'variableCosts');
                         const rowClass = isInvalid
                             ? 'bg-red-900/50 border-b border-red-700 hover:bg-red-800/60'
                             : 'bg-bg-card border-b border-border-color hover:bg-border-color';
                        return (
                            <tr key={item.id} className={rowClass} title={item.observation || 'Sem observações.'}>
                                <td className="px-6 py-4">{item.name}</td>
                                <td className="px-6 py-4">{item.description}</td>
                                <td className="px-6 py-4">{item.category}</td>
                                <td className="px-6 py-4">{formatCurrency(item.value)}</td>
                                <td className="px-6 py-4">{formatDate(item.date)}</td>
                                <td className="px-6 py-4 text-center">{item.attachment ? '📎' : ''}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => handleEdit('variableCosts', item.id)} className="text-blue-400 hover:text-blue-300">✏️</button>
                                    <button onClick={() => handleDelete('variableCosts', item.id)} className="text-red-500 hover:text-red-400">🗑️</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </TableCard>
        ),
        revenues: (
             <TableCard 
                title="Receitas"
                actions={
                    <button 
                        onClick={() => exportToCSV(financialData.revenues, 'receitas.csv')}
                        className="px-3 py-1 bg-secondary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 flex items-center gap-1 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <i className="fas fa-file-csv mr-1"></i> Exportar CSV
                    </button>
                }
            >
                 <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">Descrição</th>
                        <th scope="col" className="px-6 py-3">Categoria</th>
                        <th scope="col" className="px-6 py-3">Cliente</th>
                        <th scope="col" className="px-6 py-3">Valor</th>
                        <th scope="col" className="px-6 py-3">Data</th>
                        <th scope="col" className="px-6 py-3">Anexo</th>
                        <th scope="col" className="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {financialData.revenues.map((item: RevenueRecord) => {
                        const isInvalid = isRecordInvalid(item, 'revenues');
                        const rowClass = isInvalid
                            ? 'bg-red-900/50 border-b border-red-700 hover:bg-red-800/60'
                            : 'bg-bg-card border-b border-border-color hover:bg-border-color';
                        return (
                            <tr key={item.id} className={rowClass} title={item.observation || 'Sem observações.'}>
                                <td className="px-6 py-4">{item.name}</td>
                                <td className="px-6 py-4">{item.description}</td>
                                <td className="px-6 py-4">{item.category}</td>
                                <td className="px-6 py-4">{item.client}</td>
                                <td className="px-6 py-4">{formatCurrency(item.value)}</td>
                                <td className="px-6 py-4">{formatDate(item.date)}</td>
                                <td className="px-6 py-4 text-center">{item.attachment ? '📎' : ''}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => handleEdit('revenues', item.id)} className="text-blue-400 hover:text-blue-300">✏️</button>
                                    <button onClick={() => handleDelete('revenues', item.id)} className="text-red-500 hover:text-red-400">🗑️</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </TableCard>
        ),
        receivables: (
            <TableCard 
                title="Recebíveis"
                actions={
                    <button 
                        onClick={() => exportToCSV(financialData.receivables, 'recebiveis.csv')}
                        className="px-3 py-1 bg-secondary text-white text-xs font-semibold rounded-md hover:bg-opacity-90 flex items-center gap-1 shadow-md hover:shadow-lg transition-shadow"
                    >
                        <i className="fas fa-file-csv mr-1"></i> Exportar CSV
                    </button>
                }
            >
                 <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">Descrição</th>
                        <th scope="col" className="px-6 py-3">Categoria</th>
                        <th scope="col" className="px-6 py-3">Cliente</th>
                        <th scope="col" className="px-6 py-3">Valor</th>
                        <th scope="col" className="px-6 py-3">Vencimento</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Anexo</th>
                        <th scope="col" className="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {financialData.receivables.map((item: ReceivableRecord) => {
                         const isInvalid = isRecordInvalid(item, 'receivables');
                         const rowClass = isInvalid
                             ? 'bg-red-900/50 border-b border-red-700 hover:bg-red-800/60'
                             : 'bg-bg-card border-b border-border-color hover:bg-border-color';
                        return (
                            <tr key={item.id} className={rowClass} title={item.observation || 'Sem observações.'}>
                                <td className="px-6 py-4">{item.name}</td>
                                <td className="px-6 py-4">{item.description}</td>
                                <td className="px-6 py-4">{item.category}</td>
                                <td className="px-6 py-4">{item.client}</td>
                                <td className="px-6 py-4">{formatCurrency(item.value)}</td>
                                <td className="px-6 py-4">{formatDate(item.dueDate)}</td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'paid' ? 'bg-green-500/20 text-success' : 'bg-yellow-500/20 text-warning'}`}>
                                        {item.status === 'paid' ? 'Pago' : 'Pendente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">{item.attachment ? '📎' : ''}</td>
                                <td className="px-6 py-4 space-x-2">
                                    {item.status === 'pending' && <button onClick={() => markAsPaid(item.id)} className="text-green-400 hover:text-green-300">✅</button>}
                                    <button onClick={() => handleEdit('receivables', item.id)} className="text-blue-400 hover:text-blue-300">✏️</button>
                                    <button onClick={() => handleDelete('receivables', item.id)} className="text-red-500 hover:text-red-400">🗑️</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </TableCard>
        )
    };
    
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

export default Transactions;