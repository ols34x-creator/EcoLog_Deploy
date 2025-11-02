
import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { QuotationData, VehicleModel, Urgency, CalculationResult, HistoryItem } from '../types';
import { CONSUMPTION_RATES, URGENCY_FACTORS, MAINTENANCE_COSTS_PER_KM, DRIVER_HELPER_COSTS_PER_KM, INSURANCE_RATE } from '../constants';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleString('pt-BR');

const FreightQuotation: React.FC = () => {
    const { freightHistory, addFreightQuotation, logAction, deleteFreightQuotation } = useAppStore();
    const [formData, setFormData] = useState<QuotationData>({
        client: '',
        cnpj: '',
        origin: '',
        destination: '',
        distance: '',
        freightValue: '',
        vehicleModel: VehicleModel.Truck,
        fuelPrice: '',
        tollPerKm: '',
        urgency: Urgency.Media,
        hasEscort: false,
        escortCost: '',
    });
    const [result, setResult] = useState<CalculationResult | null>(null);

    const vehicleLabels: { [key in VehicleModel]: string } = {
        [VehicleModel.Truck]: `Caminhão (Truck) - ${CONSUMPTION_RATES[VehicleModel.Truck]} km/l`,
        [VehicleModel.PickupTruck]: `Picape - ${CONSUMPTION_RATES[VehicleModel.PickupTruck]} km/l`,
        [VehicleModel.Van]: `Van - ${CONSUMPTION_RATES[VehicleModel.Van]} km/l`,
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'hasEscort') {
            const hasEscort = value === 'true';
            setFormData({ 
                ...formData, 
                hasEscort,
                // Reset escort cost if escort is not selected
                escortCost: hasEscort ? formData.escortCost : ''
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    const handleClear = () => {
        setFormData({
            client: '',
            cnpj: '',
            origin: '',
            destination: '',
            distance: '',
            freightValue: '',
            vehicleModel: VehicleModel.Truck,
            fuelPrice: '',
            tollPerKm: '',
            urgency: Urgency.Media,
            hasEscort: false,
            escortCost: '',
        });
        setResult(null);
        logAction('Formulário de orçamento de transporte limpo.');
    };

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        
        const distance = parseFloat(formData.distance);
        const fuelPrice = parseFloat(formData.fuelPrice);
        const tollPerKm = parseFloat(formData.tollPerKm);
        const vehicle = formData.vehicleModel;
        const escortCost = formData.hasEscort ? parseFloat(formData.escortCost) || 0 : 0;

        if (isNaN(distance) || isNaN(fuelPrice) || isNaN(tollPerKm) || distance <= 0 || fuelPrice <= 0) {
            alert('Por favor, insira valores numéricos válidos e positivos para distância, preço do combustível e pedágio.');
            return;
        }

        const fuelConsumption = distance / CONSUMPTION_RATES[vehicle];
        const fuelCost = fuelConsumption * fuelPrice;
        const tollCost = distance * tollPerKm;
        const maintenanceCost = distance * MAINTENANCE_COSTS_PER_KM[vehicle];
        const driverAndHelperCost = distance * DRIVER_HELPER_COSTS_PER_KM[vehicle];
        
        const baseFreight = fuelCost + tollCost + maintenanceCost + driverAndHelperCost;
        const insuranceCost = baseFreight * INSURANCE_RATE;
        const subTotal = baseFreight + insuranceCost;
        
        const urgencySurcharge = subTotal * URGENCY_FACTORS[formData.urgency];
        const totalFreightValue = subTotal + urgencySurcharge + escortCost;
        const costPerKm = totalFreightValue / distance;

        setResult({
            distance,
            fuelConsumption,
            fuelCost,
            tollCost,
            maintenanceCost,
            driverAndHelperCost,
            insuranceCost,
            escortCost,
            baseFreight: subTotal,
            urgencySurcharge,
            totalFreightValue,
            costPerKm,
        });
        logAction(`Calculado orçamento de transporte: ${formData.origin} para ${formData.destination}`);
    };

    const handleSave = () => {
        if (!result) return;
        const newHistoryItem: HistoryItem = {
            ...result,
            id: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            client: formData.client,
            cnpj: formData.cnpj,
            origin: formData.origin,
            destination: formData.destination,
            vehicleModel: formData.vehicleModel,
            urgency: formData.urgency,
            fuelPrice: parseFloat(formData.fuelPrice),
            tollPerKm: parseFloat(formData.tollPerKm),
            escortCost: result.escortCost,
        };
        addFreightQuotation(newHistoryItem);
        alert('Orçamento salvo no histórico!');
    };
    
    const exportHistoryToCSV = () => {
        if (freightHistory.length === 0) {
            alert("Não há dados no histórico para exportar.");
            return;
        }
        const headers = ['ID', 'Data', 'Cliente', 'CNPJ', 'Origem', 'Destino', 'Distância (km)', 'Veículo', 'Urgência', 'Custo Escolta', 'Valor Total', 'Custo/km'];
        const rows = freightHistory.map(item => [
            item.id,
            formatDate(item.timestamp),
            `"${item.client}"`,
            item.cnpj,
            `"${item.origin}"`,
            `"${item.destination}"`,
            item.distance.toFixed(2),
            item.vehicleModel,
            item.urgency,
            item.escortCost.toFixed(2),
            item.totalFreightValue.toFixed(2),
            item.costPerKm.toFixed(2),
        ].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", 'historico_orcamentos_transporte.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        logAction('Histórico de orçamentos de transporte exportado para CSV.');
    };

    const handlePrint = () => {
        if (!result || !formData) {
            alert("Calcule um orçamento antes de imprimir.");
            return;
        }

        const budgetNumber = Date.now();
        const today = new Date().toLocaleDateString('pt-BR');

        const urgencyCheckboxes = Object.values(Urgency).map(u => 
            `<label class="checkbox-label">
                <span class="checkbox ${formData.urgency === u ? 'checked' : ''}"></span> ${u}
            </label>`
        ).join('');
        
        const escortCheckboxes = `
            <label class="checkbox-label">
                <span class="checkbox ${formData.hasEscort ? 'checked' : ''}"></span> Sim
            </label>
            <label class="checkbox-label">
                <span class="checkbox ${!formData.hasEscort ? 'checked' : ''}"></span> Não
            </label>
        `;

        const printContent = `
            <h1>EcoLog – Orçamento de Transporte e Serviços de Cargas</h1>
            <div class="header-info">
                <p><strong>Data:</strong> <span class="field-value">${today}</span></p>
                <p><strong>Número do Orçamento:</strong> <span class="field-value">${budgetNumber}</span></p>
            </div>

            <h2>1. Dados do Cliente (Opcional)</h2>
            <div class="field-group">
                <span class="field-label">Nome do Cliente:</span>
                <span class="field-value">${formData.client || '___________________________________________'}</span>
            </div>
            <div class="field-group">
                <span class="field-label">CNPJ:</span>
                <span class="field-value">${formData.cnpj || '00.000.000/0001-00'}</span>
            </div>

            <h2>2. Dados da Viagem</h2>
            <table>
                <thead>
                    <tr>
                        <th>Origem</th><th>CEP</th><th>Destino</th><th>CEP</th><th>Distância (km)</th><th>Urgência</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${formData.origin || '__________________________'}</td><td>______</td><td>${formData.destination || '__________________________'}</td><td>______</td><td>${formData.distance}</td><td>${urgencyCheckboxes}</td>
                    </tr>
                </tbody>
            </table>

            <h2>3. Veículo e Serviços Especiais</h2>
            <table>
                <thead>
                    <tr>
                        <th>Modelo do Veículo</th><th>Consumo médio</th><th>Preço do Combustível (R$/L)</th><th>Pedágio (R$/km)</th><th>Escolta Armada</th><th>Custo da Escolta (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${formData.vehicleModel}</td><td>${CONSUMPTION_RATES[formData.vehicleModel]} km/l</td><td>${formatCurrency(parseFloat(formData.fuelPrice))}</td><td>${formatCurrency(parseFloat(formData.tollPerKm))}</td><td>${escortCheckboxes}</td><td>${formData.hasEscort ? formatCurrency(parseFloat(formData.escortCost)) : 'N/A'}</td>
                    </tr>
                </tbody>
            </table>

            <h2>4. Valor do Frete</h2>
            <div class="field-group">
                <span class="field-label">Valor estimado do frete (R$):</span>
                <span class="field-value" style="font-size: 1.2em; font-weight: bold;">${formatCurrency(result.totalFreightValue)}</span>
            </div>
            
            <h2>5. Observações / Condições</h2>
            <div class="observations"></div>

            <h2>6. Assinaturas</h2>
            <div class="signatures">
                <div class="signature-block">
                    <p>___________________________</p>
                    <p>Responsável EcoLog</p>
                </div>
                <div class="signature-block">
                    <p>___________________________</p>
                    <p>Cliente</p>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Por favor, desative o bloqueador de pop-ups para imprimir o orçamento.");
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Orçamento de Transporte - ${budgetNumber}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; font-size: 10pt; color: #333; }
                        .container { max-width: 800px; margin: auto; }
                        h1, h2 { color: #000; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
                        h1 { text-align: center; font-size: 16pt; border-bottom: 2px solid #000; }
                        h2 { font-size: 12pt; background-color: #f2f2f2; padding: 5px; }
                        .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11pt; }
                        .field-group { margin-bottom: 8px; }
                        .field-label { font-weight: bold; }
                        .field-value { border-bottom: 1px dotted #555; padding: 0 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
                        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
                        th { background-color: #f9f9f9; }
                        .checkbox-label { margin-right: 10px; white-space: nowrap; }
                        .checkbox { display: inline-block; width: 10px; height: 10px; border: 1px solid #333; vertical-align: middle; margin-right: 4px; text-align: center; line-height: 10px; font-weight: bold;}
                        .checked::before { content: 'X'; }
                        .observations { border: 1px solid #ccc; min-height: 80px; padding: 10px; margin-top: 5px; }
                        .signatures { display: flex; justify-content: space-around; margin-top: 70px; }
                        .signature-block { text-align: center; }
                        .signature-block p { margin-top: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">${printContent}</div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 100);
                        }
                    <\/script>
                </body>
            </html>
        `);
        printWindow.document.close();
        logAction('Orçamento de transporte impresso.');
    };

    const handleEdit = (item: HistoryItem) => {
        setFormData({
            client: item.client,
            cnpj: item.cnpj,
            origin: item.origin,
            destination: item.destination,
            distance: item.distance.toString(),
            freightValue: '', // Not stored, user can re-enter
            vehicleModel: item.vehicleModel,
            fuelPrice: item.fuelPrice.toString(),
            tollPerKm: item.tollPerKm.toString(),
            urgency: item.urgency,
            hasEscort: item.escortCost > 0,
            escortCost: item.escortCost > 0 ? item.escortCost.toString() : '',
        });
        setResult(null); // Clear previous calculation
        window.scrollTo({ top: 0, behavior: 'smooth' });
        logAction(`Carregado para edição o orçamento para o cliente: ${item.client}`);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza de que deseja excluir este orçamento do histórico?')) {
            deleteFreightQuotation(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-bg-card rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-bold text-light mb-4"><i className="fas fa-route mr-2"></i> EcoLog / Orçamento de Transporte e Serviços de Cargas</h2>
                <form onSubmit={handleCalculate}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="client">Nome do Cliente (opcional)</label>
                                <input className="form-input" type="text" id="client" name="client" value={formData.client} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="origin">Origem (opcional)</label>
                                <div className="flex items-center gap-2">
                                    <input className="form-input w-full" type="text" id="origin" placeholder="Cidade / CEP" value={formData.origin} onChange={handleChange} name="origin" />
                                    <button type="button" className="px-3 py-2 bg-border-color text-light font-semibold rounded-md hover:bg-opacity-90 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow">Localizar CEP</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="distance">Distância (km) <span className="text-gray-text font-normal text-xs">— preencha ou deixe em branco</span></label>
                                <input className="form-input" type="number" step="0.1" min="0" id="distance" name="distance" value={formData.distance} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="fuelPrice">Preço do combustível (R$/L)</label>
                                <input className="form-input" type="number" step="0.01" min="0" id="fuelPrice" name="fuelPrice" value={formData.fuelPrice} onChange={handleChange} required />
                            </div>
                        </div>
                        {/* Right Column */}
                        <div className="space-y-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="cnpj">CNPJ (opcional)</label>
                                <input className="form-input" type="text" id="cnpj" name="cnpj" placeholder="00.000.000/0001-00" value={formData.cnpj} onChange={handleChange} />
                            </div>
                             <div className="form-group">
                                <label className="form-label" htmlFor="destination">Destino (opcional)</label>
                                <div className="flex items-center gap-2">
                                    <input className="form-input w-full" type="text" id="destination" name="destination" placeholder="Cidade / CEP" value={formData.destination} onChange={handleChange} />
                                    <button type="button" className="px-3 py-2 bg-border-color text-light font-semibold rounded-md hover:bg-opacity-90 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow">Localizar CEP</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="freightValue">Valor do frete (R$)</label>
                                <input className="form-input" type="number" step="0.01" min="0" id="freightValue" name="freightValue" value={formData.freightValue || ''} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="tollPerKm">Pedágio (R$/km)</label>
                                <input className="form-input" type="number" step="0.01" min="0" id="tollPerKm" name="tollPerKm" value={formData.tollPerKm} onChange={handleChange} required />
                            </div>
                        </div>
                        {/* Full width row at bottom */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-border-color mt-4">
                            <div className="form-group">
                                <label className="form-label" htmlFor="vehicleModel">Modelo de veículo</label>
                                <select className="form-select" id="vehicleModel" name="vehicleModel" value={formData.vehicleModel} onChange={handleChange}>{Object.values(VehicleModel).map(v => <option key={v} value={v}>{vehicleLabels[v]}</option>)}</select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="urgency">Urgência</label>
                                <select className="form-select" id="urgency" name="urgency" value={formData.urgency} onChange={handleChange}>{Object.values(Urgency).map(u => <option key={u} value={u}>{u}</option>)}</select>
                            </div>
                        </div>
                        {/* Escort Section */}
                         <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-border-color mt-4">
                            <div className="form-group">
                                <label className="form-label">Escolta Armada</label>
                                <div className="flex items-center gap-4 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="hasEscort" value="true" checked={formData.hasEscort === true} onChange={handleChange} className="form-radio" />
                                        Sim
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="hasEscort" value="false" checked={formData.hasEscort === false} onChange={handleChange} className="form-radio" />
                                        Não
                                    </label>
                                </div>
                            </div>
                             {formData.hasEscort && (
                                <div className="form-group animate-fade-in-up">
                                    <label className="form-label" htmlFor="escortCost">Custo da Escolta (R$)</label>
                                    <input className="form-input" type="number" step="0.01" min="0" id="escortCost" name="escortCost" value={formData.escortCost} onChange={handleChange} required />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button type="submit" className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-md hover:bg-opacity-90 flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg transition-shadow"><i className="fas fa-cogs"></i> Calcular estimativa</button>
                        <button type="button" onClick={handleClear} className="flex-1 px-4 py-3 bg-border-color text-light font-semibold rounded-md hover:bg-opacity-90 shadow-md hover:shadow-lg transition-shadow">Limpar</button>
                    </div>
                </form>
            </div>
            
            {result && (
                <div className="bg-bg-card rounded-lg p-6 shadow-lg animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-light"><i className="fas fa-poll mr-2 text-secondary"></i> Resultado do Orçamento</h2>
                        <div className="flex gap-2">
                            <button onClick={handleSave} className="px-4 py-2 bg-success text-white font-semibold rounded-md hover:bg-opacity-90 flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"><i className="fas fa-save"></i> Salvar</button>
                            <button onClick={handlePrint} className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-opacity-90 flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"><i className="fas fa-print"></i> Imprimir Orçamento</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                        <div className="bg-bg-main p-4 rounded-lg"><div className="text-sm text-gray-text">Custo Combustível</div><div className="text-xl font-bold text-light">{formatCurrency(result.fuelCost)}</div></div>
                        <div className="bg-bg-main p-4 rounded-lg"><div className="text-sm text-gray-text">Custo Manutenção</div><div className="text-xl font-bold text-light">{formatCurrency(result.maintenanceCost)}</div></div>
                        <div className="bg-bg-main p-4 rounded-lg"><div className="text-sm text-gray-text">Custo Motorista</div><div className="text-xl font-bold text-light">{formatCurrency(result.driverAndHelperCost)}</div></div>
                        <div className="bg-bg-main p-4 rounded-lg"><div className="text-sm text-gray-text">Seguro</div><div className="text-xl font-bold text-light">{formatCurrency(result.insuranceCost)}</div></div>
                         {result.escortCost > 0 && <div className="bg-bg-main p-4 rounded-lg"><div className="text-sm text-gray-text">Custo Escolta</div><div className="text-xl font-bold text-light">{formatCurrency(result.escortCost)}</div></div>}
                        <div className="bg-bg-main p-4 rounded-lg"><div className="text-sm text-gray-text">Taxa de Urgência</div><div className="text-xl font-bold text-light">{formatCurrency(result.urgencySurcharge)}</div></div>
                        <div className="bg-border-color p-4 rounded-lg col-span-2 md:col-span-full"><div className="text-sm text-gray-text">Custo por KM</div><div className="text-xl font-bold text-light">{formatCurrency(result.costPerKm)}</div></div>
                    </div>
                    <div className="mt-6 bg-secondary text-white p-4 rounded-lg text-center">
                        <div className="text-lg font-semibold">VALOR TOTAL DO FRETE</div>
                        <div className="text-4xl font-bold tracking-tight">{formatCurrency(result.totalFreightValue)}</div>
                    </div>
                </div>
            )}

            <div className="bg-bg-card rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-light"><i className="fas fa-history mr-2"></i> Histórico de Orçamentos</h2>
                    <button onClick={exportHistoryToCSV} className="px-4 py-2 bg-border-color text-light font-semibold rounded-md hover:bg-opacity-90 flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"><i className="fas fa-file-csv"></i> Exportar CSV</button>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left text-gray-text">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Origem/Destino</th>
                                <th className="px-4 py-3">Valor Total</th>
                                <th className="px-4 py-3">Custo/km</th>
                                <th className="px-4 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {freightHistory.length > 0 ? freightHistory.map(item => (
                                <tr key={item.id} className="hover:bg-border-color">
                                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.timestamp)}</td>
                                    <td className="px-4 py-3 font-medium text-light">{item.client}</td>
                                    <td className="px-4 py-3">{item.origin} ➔ {item.destination}</td>
                                    <td className="px-4 py-3 font-semibold text-secondary">{formatCurrency(item.totalFreightValue)}</td>
                                    <td className="px-4 py-3">{formatCurrency(item.costPerKm)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300 mr-4" title="Editar">✏️</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400" title="Excluir">🗑️</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-8">Nenhum orçamento no histórico.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Add simple animation for conditional fields
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
        animation: fade-in-up 0.3s ease-out;
    }
    .form-radio {
        width: 1.25em;
        height: 1.25em;
        accent-color: #3498db;
    }
`;
document.head.appendChild(style);

export default FreightQuotation;