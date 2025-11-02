import React from 'react';
import { useAppStore } from '../hooks/useAppStore';

interface LayoutSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LayoutSettingsModal: React.FC<LayoutSettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, isLayoutMode, setIsLayoutMode } = useAppStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000]" onClick={onClose}>
      <div className="bg-bg-card p-6 rounded-lg shadow-xl w-full max-w-md text-light" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Layout & Tema</h2>
          <button onClick={onClose} className="text-gray-text hover:text-light text-2xl">&times;</button>
        </div>
        
        <div className="space-y-6">
          {/* Theme Section */}
          <div>
            <h3 className="font-semibold mb-2">Tema de Cores</h3>
            <div className="flex gap-4">
              <button onClick={() => setTheme('default')} className={`flex-1 p-3 rounded-md border-2 ${theme === 'default' ? 'border-secondary' : 'border-transparent'}`}>
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full" style={{backgroundColor: 'rgb(20, 184, 166)'}}></div>
                  <div className="w-6 h-6 rounded-full" style={{backgroundColor: 'rgb(59, 130, 246)'}}></div>
                </div>
                <span className="font-semibold">Padrão</span>
              </button>
              <button onClick={() => setTheme('orange')} className={`flex-1 p-3 rounded-md border-2 ${theme === 'orange' ? 'border-primary' : 'border-transparent'}`}>
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full" style={{backgroundColor: 'rgb(255, 95, 31)'}}></div>
                  <div className="w-6 h-6 rounded-full" style={{backgroundColor: 'rgb(17, 17, 17)'}}></div>
                </div>
                <span className="font-semibold">Neon Laranja</span>
              </button>
            </div>
          </div>
          
          {/* Layout Mode Section */}
          <div>
            <h3 className="font-semibold mb-2">Modo de Layout</h3>
            <label htmlFor="layout-toggle" className="flex items-center justify-between bg-bg-main p-3 rounded-md cursor-pointer">
              <span>Ativar modo de edição</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  id="layout-toggle" 
                  className="sr-only" 
                  checked={isLayoutMode}
                  onChange={() => setIsLayoutMode(!isLayoutMode)} 
                />
                <div className="block bg-border-color w-14 h-8 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isLayoutMode ? 'transform translate-x-6 bg-primary' : ''}`}></div>
              </div>
            </label>
            <p className="text-xs text-gray-text mt-2">Quando ativado, você pode arrastar e soltar os painéis para reordenar a página.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutSettingsModal;
