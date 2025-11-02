import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';

type ReceiptTab = 'terceiros' | 'servicos';

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
                    body { font-family: Arial, sans-serif; margin: 40px; font-size: 11pt; color: #333; }
                    .receipt-container { max-width: 700px; margin: auto; border: 1px solid #ccc; padding: 20px; }
                    h2 { text-align: center; margin-bottom: 20px; font-size: 1.5em; }
                    h3 { font-size: 1.1em; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; }
                    p { margin: 5px 0; line-height: 1.6; }
                    .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .field { font-weight: bold; }
                    .value { border-bottom: 1px dotted #555; padding: 0 5px; }
                    .section-block { margin-bottom: 15px; }
                    .description-box, .declaration-box { border: 1px solid #eee; padding: 10px; min-height: 70px; margin-top: 5px; background: #f9f9f9; }
                    .signatures { display: flex; justify-content: space-around; margin-top: 60px; }
                    .signature-block { text-align: center; }
                    .signature-line { border-top: 1px solid #333; width: 250px; margin: 0 auto; padding-top: 5px; }
                    .legal-base { font-size: 8pt; color: #777; margin-top: 30px; text-align: justify; }
                </style>
            </head>
            <body>
                <main class="receipt-container">
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

const ReciboTerceiros = () => {
    const [formState, setFormState] = useState({
        reciboNo: '', reciboDate: '',
        prestadorNome: '', prestadorCpfCnpj: '', prestadorEndereco: '', prestadorCidade: '', prestadorContato: '',
        pagadorNome: '', pagadorCpfCnpj: '', pagadorEndereco: '', pagadorCidade: '',
        servicosDesc: '', periodoInicio: '', periodoFim: '',
        valorBruto: '', valorExtenso: '', formaPagamento: 'PIX', formaPagamentoOutro: '', dataPagamento: '',
        local: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const generateAndPrint = (e: React.FormEvent) => {
        e.preventDefault();
        
        const requiredFields: { key: keyof typeof formState; label: string }[] = [
            { key: 'reciboNo', label: 'Nº do Recibo' },
            { key: 'reciboDate', label: 'Data do Recibo' },
            { key: 'prestadorNome', label: 'Nome do Prestador' },
            { key: 'prestadorCpfCnpj', label: 'CPF/CNPJ do Prestador' },
            { key: 'pagadorNome', label: 'Nome do Contratante' },
            { key: 'pagadorCpfCnpj', label: 'CPF/CNPJ do Contratante' },
            { key: 'servicosDesc', label: 'Descrição dos Serviços' },
            { key: 'valorBruto', label: 'Valor Bruto' },
            { key: 'valorExtenso', label: 'Valor por Extenso' },
            { key: 'dataPagamento', label: 'Data do Pagamento' },
            { key: 'local', label: 'Local de emissão' },
        ];

        const missingFields = requiredFields.filter(field => !formState[field.key]?.trim());
        
        if (formState.formaPagamento === 'Outro' && !formState.formaPagamentoOutro.trim()) {
            missingFields.push({ key: 'formaPagamentoOutro', label: 'Especifique a Forma de Pagamento' });
        }

        if (missingFields.length > 0) {
            const missingFieldLabels = missingFields.map(field => field.label).join(', ');
            alert(`Por favor, preencha os seguintes campos obrigatórios: ${missingFieldLabels}.`);
            return;
        }

        const { reciboNo, reciboDate, prestadorNome, prestadorCpfCnpj, prestadorEndereco, prestadorCidade, prestadorContato, pagadorNome, pagadorCpfCnpj, pagadorEndereco, pagadorCidade, servicosDesc, periodoInicio, periodoFim, valorBruto, valorExtenso, formaPagamento, formaPagamentoOutro, dataPagamento, local } = formState;
        
        const formaPagamentoFinal = formaPagamento === 'Outro' ? `Outro: ${formaPagamentoOutro}` : formaPagamento;

        const content = `
            <h2>RECIBO DE PAGAMENTO DE SERVIÇOS</h2>
            <div class="header-info">
                <p><span class="field">Nº:</span> <span class="value">${reciboNo || '____________'}</span></p>
                <p><span class="field">Data:</span> <span class="value">${reciboDate ? new Date(reciboDate).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '____/____/______'}</span></p>
            </div>

            <h3>1. IDENTIFICAÇÃO DO PRESTADOR (RECEBEDOR)</h3>
            <p><span class="field">Nome/Razão Social:</span> <span class="value">${prestadorNome}</span></p>
            <p><span class="field">CPF/CNPJ:</span> <span class="value">${prestadorCpfCnpj}</span></p>
            <p><span class="field">Endereço:</span> <span class="value">${prestadorEndereco}</span></p>
            <p><span class="field">Cidade/UF:</span> <span class="value">${prestadorCidade}</span></p>
            <p><span class="field">Telefone/E-mail:</span> <span class="value">${prestadorContato}</span></p>
            
            <h3>2. IDENTIFICAÇÃO DO CONTRATANTE (PAGADOR)</h3>
            <p><span class="field">Nome/Razão Social:</span> <span class="value">${pagadorNome}</span></p>
            <p><span class="field">CPF/CNPJ:</span> <span class="value">${pagadorCpfCnpj}</span></p>
            <p><span class="field">Endereço:</span> <span class="value">${pagadorEndereco}</span></p>
            <p><span class="field">Cidade/UF:</span> <span class="value">${pagadorCidade}</span></p>

            <h3>3. OBJETO E DESCRIÇÃO DOS SERVIÇOS</h3>
            <div class="description-box">${servicosDesc.replace(/\n/g, '<br />') || '&nbsp;'}</div>
            <p><span class="field">Período de execução:</span> ${periodoInicio ? new Date(periodoInicio).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '____/____/______'} a ${periodoFim ? new Date(periodoFim).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '____/____/______'}</p>

            <h3>4. VALOR E FORMA DE PAGAMENTO</h3>
            <p><span class="field">Valor total bruto:</span> <span class="value">R$ ${valorBruto} (${valorExtenso})</span></p>
            <p><span class="field">Forma de pagamento:</span> <span class="value">${formaPagamentoFinal}</span></p>
            <p><span class="field">Data do pagamento:</span> <span class="value">${dataPagamento ? new Date(dataPagamento).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '____/____/______'}</span></p>

            <h3>5. DECLARAÇÕES E RESPONSABILIDADES</h3>
            <div class="declaration-box">
                <p>Declaro ter recebido integralmente o valor acima especificado, dando plena, geral e irrevogável quitação, para nada mais reclamar, seja a que título for, nos termos do art. 320 do Código Civil.</p>
                <p>O prestador declara que executou os serviços de forma autônoma, sem vínculo empregatício, nos termos do art. 3º da CLT, assumindo integral responsabilidade pelos encargos fiscais, previdenciários e tributários decorrentes de sua atividade.</p>
            </div>
            
            <div class="signatures">
                <div class="signature-block">
                    <div class="signature-line">${prestadorNome}</div>
                    <p>Assinatura do Prestador (Recebedor)</p>
                </div>
                <div class="signature-block">
                    <div class="signature-line">${pagadorNome}</div>
                    <p>Assinatura do Contratante (Pagador)</p>
                </div>
            </div>
            <p style="text-align: center; margin-top: 30px;">Local: ${local || '________________'}, ${new Date().toLocaleDateString('pt-BR')}</p>
        `;

        handlePrintForm("Recibo de Terceiros", content);
    };

    return (
        <form onSubmit={generateAndPrint} className="space-y-6">
            <h2 className="text-xl font-bold text-light"><i className="fas fa-user-friends mr-2"></i> Recibo de Pagamento de Terceiros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="form-input" name="reciboNo" placeholder="Nº do Recibo" onChange={handleChange} value={formState.reciboNo} required />
                <input className="form-input" name="reciboDate" type="date" onChange={handleChange} value={formState.reciboDate} required />
            </div>
            {/* Prestador */}
            <fieldset className="border border-border-color p-4 rounded-md">
                <legend className="px-2 font-semibold text-secondary">1. Prestador (Recebedor)</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input className="form-input" name="prestadorNome" placeholder="Nome/Razão Social" onChange={handleChange} value={formState.prestadorNome} required />
                    <input className="form-input" name="prestadorCpfCnpj" placeholder="CPF/CNPJ" onChange={handleChange} value={formState.prestadorCpfCnpj} required />
                    <input className="form-input md:col-span-2" name="prestadorEndereco" placeholder="Endereço" onChange={handleChange} value={formState.prestadorEndereco} />
                    <input className="form-input" name="prestadorCidade" placeholder="Cidade/UF" onChange={handleChange} value={formState.prestadorCidade} />
                    <input className="form-input" name="prestadorContato" placeholder="Telefone/E-mail" onChange={handleChange} value={formState.prestadorContato} />
                </div>
            </fieldset>
            {/* Pagador */}
            <fieldset className="border border-border-color p-4 rounded-md">
                <legend className="px-2 font-semibold text-secondary">2. Contratante (Pagador)</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input className="form-input" name="pagadorNome" placeholder="Nome/Razão Social" onChange={handleChange} value={formState.pagadorNome} required />
                    <input className="form-input" name="pagadorCpfCnpj" placeholder="CPF/CNPJ" onChange={handleChange} value={formState.pagadorCpfCnpj} required />
                    <input className="form-input md:col-span-2" name="pagadorEndereco" placeholder="Endereço" onChange={handleChange} value={formState.pagadorEndereco} />
                    <input className="form-input" name="pagadorCidade" placeholder="Cidade/UF" onChange={handleChange} value={formState.pagadorCidade} />
                </div>
            </fieldset>
            {/* Serviços */}
            <fieldset className="border border-border-color p-4 rounded-md">
                <legend className="px-2 font-semibold text-secondary">3. Descrição dos Serviços</legend>
                <textarea className="form-input w-full mt-2" name="servicosDesc" rows={3} placeholder="Descrição detalhada..." onChange={handleChange} value={formState.servicosDesc} required></textarea>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <input className="form-input" name="periodoInicio" type="date" onChange={handleChange} value={formState.periodoInicio} title="Início da execução" />
                    <input className="form-input" name="periodoFim" type="date" onChange={handleChange} value={formState.periodoFim} title="Fim da execução" />
                </div>
            </fieldset>
             {/* Pagamento */}
             <fieldset className="border border-border-color p-4 rounded-md">
                <legend className="px-2 font-semibold text-secondary">4. Valor e Pagamento</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input className="form-input" name="valorBruto" type="number" placeholder="Valor total bruto R$" onChange={handleChange} value={formState.valorBruto} required />
                    <input className="form-input md:col-span-2" name="valorExtenso" placeholder="Valor por extenso" onChange={handleChange} value={formState.valorExtenso} required />
                    <select className="form-select" name="formaPagamento" onChange={handleChange} value={formState.formaPagamento}>
                        <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Outro</option>
                    </select>
                    {formState.formaPagamento === 'Outro' && <input className="form-input" name="formaPagamentoOutro" placeholder="Especifique" onChange={handleChange} value={formState.formaPagamentoOutro} required />}
                    <input className="form-input" name="dataPagamento" type="date" onChange={handleChange} value={formState.dataPagamento} required />
                    <input className="form-input" name="local" placeholder="Local de emissão" onChange={handleChange} value={formState.local} required />
                </div>
            </fieldset>
            <button type="submit" className="w-full px-4 py-3 bg-secondary text-white font-bold rounded-md hover:bg-opacity-90 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow"><i className="fas fa-print"></i> GERAR E IMPRIMIR RECIBO</button>
        </form>
    );
};

const ReciboServicos = () => {
    // This form is very similar to the other one, so we can reuse the structure.
    // For a real app, this could be a single, more dynamic component.
    const [formState, setFormState] = useState({
        reciboNo: '', reciboDate: '',
        prestadorNome: '', prestadorCpfCnpj: '', prestadorEndereco: '', prestadorCidade: '', prestadorContato: '',
        clienteNome: '', clienteCpfCnpj: '', clienteEndereco: '', clienteCidade: '',
        servicosDesc: '', periodoInicio: '', periodoFim: '',
        valorTotal: '', valorExtenso: '', formaPagamento: 'PIX', formaPagamentoOutro: '', dataPagamento: '',
        local: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const generateAndPrint = (e: React.FormEvent) => {
        e.preventDefault();
        const requiredFields: { key: keyof typeof formState; label: string }[] = [
            { key: 'reciboNo', label: 'Nº do Recibo' },
            { key: 'reciboDate', label: 'Data do Recibo' },
            { key: 'prestadorNome', label: 'Nome do Prestador' },
            { key: 'prestadorCpfCnpj', label: 'CPF/CNPJ do Prestador' },
            { key: 'clienteNome', label: 'Nome do Cliente' },
            { key: 'clienteCpfCnpj', label: 'CPF/CNPJ do Cliente' },
            { key: 'servicosDesc', label: 'Descrição do Serviço' },
            { key: 'valorTotal', label: 'Valor Total' },
            { key: 'valorExtenso', label: 'Valor por Extenso' },
            { key: 'dataPagamento', label: 'Data do Pagamento' },
            { key: 'local', label: 'Local de emissão' },
        ];

        const missingFields = requiredFields.filter(field => !formState[field.key]?.trim());
        
        if (formState.formaPagamento === 'Outro' && !formState.formaPagamentoOutro.trim()) {
            missingFields.push({ key: 'formaPagamentoOutro', label: 'Especifique a Forma de Pagamento' });
        }

        if (missingFields.length > 0) {
            const missingFieldLabels = missingFields.map(field => field.label).join(', ');
            alert(`Por favor, preencha os seguintes campos obrigatórios: ${missingFieldLabels}.`);
            return;
        }

        const { reciboNo, reciboDate, prestadorNome, prestadorCpfCnpj, prestadorEndereco, prestadorCidade, prestadorContato, clienteNome, clienteCpfCnpj, clienteEndereco, clienteCidade, servicosDesc, periodoInicio, periodoFim, valorTotal, valorExtenso, formaPagamento, formaPagamentoOutro, dataPagamento, local } = formState;
        
        const formaPagamentoFinal = formaPagamento === 'Outro' ? `Outro: ${formaPagamentoOutro}` : formaPagamento;
        
        const content = `
            <h2>RECIBO DE PRESTAÇÃO DE SERVIÇOS</h2>
            <div class="header-info">
                <p><span class="field">Nº:</span> <span class="value">${reciboNo || '____________'}</span></p>
                <p><span class="field">Data:</span> <span class="value">${reciboDate ? new Date(reciboDate).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '____/____/______'}</span></p>
            </div>

            <h3>1. IDENTIFICAÇÃO DO PRESTADOR</h3>
            <p><span class="field">Nome/Razão Social:</span> <span class="value">${prestadorNome}</span></p>
            <p><span class="field">CPF/CNPJ:</span> <span class="value">${prestadorCpfCnpj}</span></p>
            <p><span class="field">Endereço:</span> <span class="value">${prestadorEndereco}</span></p>
            <p><span class="field">Cidade/UF:</span> <span class="value">${prestadorCidade}</span></p>
            <p><span class="field">Telefone/E-mail:</span> <span class="value">${prestadorContato}</span></p>
            
            <h3>2. IDENTIFICAÇÃO DO CLIENTE</h3>
            <p><span class="field">Nome/Razão Social:</span> <span class="value">${clienteNome}</span></p>
            <p><span class="field">CPF/CNPJ:</span> <span class="value">${clienteCpfCnpj}</span></p>
            <p><span class="field">Endereço:</span> <span class="value">${clienteEndereco}</span></p>
            <p><span class="field">Cidade/UF:</span> <span class="value">${clienteCidade}</span></p>

            <h3>3. DESCRIÇÃO DO SERVIÇO PRESTADO</h3>
            <div class="description-box">${servicosDesc.replace(/\n/g, '<br />') || '&nbsp;'}</div>
             <p><span class="field">Período de execução:</span> ${periodoInicio ? new Date(periodoInicio).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '____/____/______'} a ${periodoFim ? new Date(periodoFim).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '____/____/______'}</p>

            <h3>4. VALOR E PAGAMENTO</h3>
            <p><span class="field">Valor total recebido:</span> <span class="value">R$ ${valorTotal} (${valorExtenso})</span></p>
            <p><span class="field">Forma de pagamento:</span> <span class="value">${formaPagamentoFinal}</span></p>
            <p><span class="field">Data do pagamento:</span> <span class="value">${dataPagamento ? new Date(dataPagamento).toLocaleDateString('pt-BR', {timeZone:'UTC'}) : '____/____/______'}</span></p>

            <h3>5. DECLARAÇÃO E QUITAÇÃO</h3>
            <div class="declaration-box">
                <p>Declaro, para os devidos fins, que recebi do(a) cliente acima identificado(a) a quantia descrita neste recibo, referente aos serviços prestados. Dou plena, geral e irrevogável quitação pelo valor recebido, nada mais havendo a reclamar, nos termos do artigo 320 do Código Civil Brasileiro.</p>
                <p>Este recibo é emitido sem vínculo empregatício, de acordo com o artigo 593 e seguintes do Código Civil, caracterizando prestação de serviço autônoma.</p>
            </div>
            
            <div class="signatures">
                <div class="signature-block">
                    <div class="signature-line">${prestadorNome}</div>
                    <p>Assinatura do Prestador de Serviço</p>
                </div>
            </div>
             <p style="text-align: center; margin-top: 30px;">Local: ${local || '________________'}, ${new Date().toLocaleDateString('pt-BR')}</p>
        `;
        handlePrintForm("Recibo de Prestação de Serviços", content);
    };
    
     return (
        <form onSubmit={generateAndPrint} className="space-y-6">
            <h2 className="text-xl font-bold text-light"><i className="fas fa-file-invoice mr-2"></i> Recibo de Prestação de Serviços</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="form-input" name="reciboNo" placeholder="Nº do Recibo" onChange={handleChange} value={formState.reciboNo} required />
                <input className="form-input" name="reciboDate" type="date" onChange={handleChange} value={formState.reciboDate} required />
            </div>
            {/* Prestador */}
            <fieldset className="border border-border-color p-4 rounded-md">
                <legend className="px-2 font-semibold text-secondary">1. Prestador</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input className="form-input" name="prestadorNome" placeholder="Nome/Razão Social" onChange={handleChange} value={formState.prestadorNome} required />
                    <input className="form-input" name="prestadorCpfCnpj" placeholder="CPF/CNPJ" onChange={handleChange} value={formState.prestadorCpfCnpj} required />
                    <input className="form-input md:col-span-2" name="prestadorEndereco" placeholder="Endereço" onChange={handleChange} value={formState.prestadorEndereco} />
                    <input className="form-input" name="prestadorCidade" placeholder="Cidade/UF" onChange={handleChange} value={formState.prestadorCidade} />
                    <input className="form-input" name="prestadorContato" placeholder="Telefone/E-mail" onChange={handleChange} value={formState.prestadorContato} />
                </div>
            </fieldset>
            {/* Cliente */}
            <fieldset className="border border-border-color p-4 rounded-md">
                <legend className="px-2 font-semibold text-secondary">2. Cliente</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input className="form-input" name="clienteNome" placeholder="Nome/Razão Social" onChange={handleChange} value={formState.clienteNome} required />
                    <input className="form-input" name="clienteCpfCnpj" placeholder="CPF/CNPJ" onChange={handleChange} value={formState.clienteCpfCnpj} required />
                    <input className="form-input md:col-span-2" name="clienteEndereco" placeholder="Endereço" onChange={handleChange} value={formState.clienteEndereco} />
                    <input className="form-input" name="clienteCidade" placeholder="Cidade/UF" onChange={handleChange} value={formState.clienteCidade} />
                </div>
            </fieldset>
            {/* Serviços */}
            <fieldset className="border border-border-color p-4 rounded-md">
                <legend className="px-2 font-semibold text-secondary">3. Descrição do Serviço</legend>
                <textarea className="form-input w-full mt-2" name="servicosDesc" rows={3} placeholder="Descrição detalhada..." onChange={handleChange} value={formState.servicosDesc} required></textarea>
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <input className="form-input" name="periodoInicio" type="date" onChange={handleChange} value={formState.periodoInicio} title="Início da execução" />
                    <input className="form-input" name="periodoFim" type="date" onChange={handleChange} value={formState.periodoFim} title="Fim da execução" />
                </div>
            </fieldset>
             {/* Pagamento */}
             <fieldset className="border border-border-color p-4 rounded-md">
                <legend className="px-2 font-semibold text-secondary">4. Valor e Pagamento</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <input className="form-input" name="valorTotal" type="number" placeholder="Valor total recebido R$" onChange={handleChange} value={formState.valorTotal} required />
                    <input className="form-input md:col-span-2" name="valorExtenso" placeholder="Valor por extenso" onChange={handleChange} value={formState.valorExtenso} required />
                    <select className="form-select" name="formaPagamento" onChange={handleChange} value={formState.formaPagamento}>
                        <option>PIX</option><option>Dinheiro</option><option>Transferência</option><option>Outro</option>
                    </select>
                    {formState.formaPagamento === 'Outro' && <input className="form-input" name="formaPagamentoOutro" placeholder="Especifique" onChange={handleChange} value={formState.formaPagamentoOutro} required />}
                    <input className="form-input" name="dataPagamento" type="date" onChange={handleChange} value={formState.dataPagamento} required />
                    <input className="form-input" name="local" placeholder="Local de emissão" onChange={handleChange} value={formState.local} required />
                </div>
            </fieldset>
            <button type="submit" className="w-full px-4 py-3 bg-secondary text-white font-bold rounded-md hover:bg-opacity-90 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow"><i className="fas fa-print"></i> GERAR E IMPRIMIR RECIBO</button>
        </form>
    );
};


const Receipts: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReceiptTab>('terceiros');
    const { logAction } = useAppStore();

    const TabButton: React.FC<{ tabId: ReceiptTab; text: string; icon: string; }> = ({ tabId, text, icon }) => (
        <button
            onClick={() => {
                setActiveTab(tabId);
                logAction(`Receipts sub-tab opened: ${text}`);
            }}
            className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-semibold transition-colors duration-200 min-w-[180px]
                ${activeTab === tabId ? 'bg-secondary text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}`}
        >
            <i className={`fas ${icon}`}></i> {text}
        </button>
    );

    return (
        <div className="bg-bg-card rounded-lg p-5 shadow-lg">
            <div className="flex flex-wrap border-b border-border-color mb-4 rounded-lg overflow-hidden">
                <TabButton tabId="terceiros" text="Recibo de Terceiros" icon="fa-user-friends" />
                <TabButton tabId="servicos" text="Recibo de Prestação de Serviços" icon="fa-file-invoice" />
            </div>
            
            <div className="mt-4">
                {activeTab === 'terceiros' && <ReciboTerceiros />}
                {activeTab === 'servicos' && <ReciboServicos />}
            </div>
        </div>
    );
};

// Add reusable form styles for the reimbursement form
const formStyles = `
.form-input, .form-select {
    padding: 0.75rem;
    border: 1px solid #374151;
    border-radius: 0.375rem;
    font-size: 1rem;
    background-color: #111827;
    color: #f9fafb;
}
.form-input:focus, .form-select:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
.form-input:invalid, .form-select:invalid {
    border-color: #e74c3c;
}
.form-input:invalid:not(:placeholder-shown) {
    background-color: rgba(231, 76, 60, 0.1);
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = formStyles;
document.head.appendChild(styleSheet);

export default Receipts;