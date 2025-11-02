
import React from 'react';
import { Demand } from '../types';
import { base64ToSrc } from '../services/fileService';

interface DemandDetailsModalProps {
  demand: Demand | null;
  onClose: () => void;
  onEdit: (demand: Demand) => void;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={className}>
        <p className="text-sm text-gray-text">{label}</p>
        <p className="text-light font-semibold">{value || '-'}</p>
    </div>
);

const DemandDetailsModal: React.FC<DemandDetailsModalProps> = ({ demand, onClose, onEdit }) => {
    if (!demand) return null;

    const urgencyColorMap = {
        'Baixa': 'bg-green-500/20 text-green-300',
        'Média': 'bg-yellow-500/20 text-yellow-300',
        'Alta': 'bg-orange-500/20 text-orange-300',
        'Crítica': 'bg-red-500/20 text-red-300',
    };

    const handleEditClick = () => {
        if (demand) {
            onEdit(demand);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1001]" onClick={onClose}>
            <div className="bg-bg-card p-8 rounded-lg shadow-xl w-full max-w-3xl text-light max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Detalhes da Demanda</h2>
                        <p className="text-secondary font-mono bg-bg-main px-2 py-1 rounded-md inline-block">{demand.id}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-text hover:text-light text-2xl">&times;</button>
                </div>

                <div className="mt-6 border-t border-border-color pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem label="Cliente" value={demand.client} />
                        <DetailItem label="Contato" value={demand.contact} />
                        <DetailItem label="Setor" value={demand.setor} />
                        <DetailItem label="Data de Criação" value={demand.date} />
                        <DetailItem label="Prazo Final" value={demand.prazo ? new Date(demand.prazo).toLocaleString('pt-BR') : '-'} />
                        <div className="form-group">
                            <p className="text-sm text-gray-text">Urgência</p>
                            <span className={`px-3 py-1 text-sm font-bold rounded-full ${urgencyColorMap[demand.urgencia]}`}>{demand.urgencia}</span>
                        </div>
                        <DetailItem label="Data de Início" value={demand.dateStart ? new Date(demand.dateStart + 'T00:00:00').toLocaleDateString('pt-BR') : '-'} />
                        <DetailItem label="Data de Fim" value={demand.dateEnd ? new Date(demand.dateEnd + 'T00:00:00').toLocaleDateString('pt-BR') : '-'} />
                    </div>

                    <div className="mt-6">
                        <DetailItem label="Descrição do Serviço" value={<pre className="whitespace-pre-wrap font-sans bg-bg-main p-3 rounded-md">{demand.service}</pre>} className="col-span-full" />
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                         <DetailItem label="Responsável pelo Aviso" value={demand.responsavel} />
                         <DetailItem label="Email para Aviso" value={demand.emailAviso} />
                         <DetailItem label="Celular para Aviso" value={demand.celAviso} />
                    </div>

                    {demand.photos.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-text">Fotos</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {demand.photos.map(photo => (
                                    <a key={photo.id} href={base64ToSrc(photo.src, 'image/jpeg')} target="_blank" rel="noopener noreferrer">
                                        <img src={base64ToSrc(photo.src, 'image/jpeg')} alt={photo.name} className="w-full h-32 object-cover rounded-lg shadow-md hover:scale-105 transition-transform" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {demand.attachments.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-text">Anexos</h3>
                            <div className="space-y-2">
                                {demand.attachments.map(att => (
                                    <div key={att.id} className="bg-bg-main p-3 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <i className="fas fa-paperclip text-gray-text"></i>
                                            <span className="font-medium truncate">{att.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-text">{(att.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={handleEditClick} className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-opacity-80">
                        <i className="fas fa-edit mr-2"></i>Editar
                    </button>
                    <button onClick={onClose} className="px-6 py-2 bg-border-color text-light font-semibold rounded-md hover:bg-opacity-80">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default DemandDetailsModal;
