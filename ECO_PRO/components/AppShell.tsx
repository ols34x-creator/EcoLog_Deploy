import React, { useState, useEffect } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { useAuth } from '../hooks/useAuth';
import { TabId } from '../types';
import ChatWidget from './ChatWidget';
import MusicPlayer from './MusicPlayer';
import NotificationPanel from './NotificationPanel';
import { useLanguage } from '../hooks/useLanguage';
import LayoutSettingsModal from './LayoutSettingsModal';

interface SidebarProps {
    onReturnToLanding: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onReturnToLanding }) => {
    const { activeTab, setActiveTab, isMusicPlayerOpen, setIsMusicPlayerOpen } = useAppStore();
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const allNavItems = [
        { id: 'reports', icon: 'fa-chart-pie', textKey: 'overview' },
        { id: 'eco-ia', icon: 'fa-robot', textKey: 'ecoIA' },
        { id: 'freight-quotation', icon: 'fa-calculator', textKey: 'freightQuotation' },
        { id: 'transactions', icon: 'fa-exchange-alt', textKey: 'transactions' },
        { id: 'operacional', icon: 'fa-truck', textKey: 'operational' },
        { id: 'briefing', icon: 'fa-tasks', textKey: 'demandDashboard' },
        { id: 'fleet-control', icon: 'fa-truck-pickup', textKey: 'fleetControl' },
        { id: 'user-management', icon: 'fa-users-cog', textKey: 'userManagement', adminOnly: true },
        { id: 'briefing-feedback', icon: 'fa-file-alt', textKey: 'briefingFeedback' },
        { id: 'abertura', icon: 'fa-door-open', textKey: 'landingPage' },
        { id: 'music-player', icon: 'fa-music', textKey: 'ecoPlay' },
        { id: 'receipts', icon: 'fa-receipt', textKey: 'receipts' },
        { id: 'add-record', icon: 'fa-plus-circle', textKey: 'addRecord' },
    ];

    const navItems = allNavItems.filter(item => !item.adminOnly || currentUser?.role === 'Admin');

    return (
        <nav className="fixed top-0 left-0 h-full bg-bg-card border-r border-border-color z-40 w-[60px] hover:w-72 transition-all duration-300 group">
            <div className="flex items-center p-4 h-16 text-light">
                <span className="text-xl w-[28px] text-center"><i className="fas fa-cog"></i></span>
                <span className="ml-5 font-bold text-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
                    EcoLog - intelligence Pulse
                </span>
            </div>
            
            <ul className="mt-0">
                {navItems.map(item => (
                    <li key={item.id}>
                        <a
                            href="#"
                            onClick={(e) => { 
                                e.preventDefault(); 
                                if (item.id === 'music-player') {
                                    setIsMusicPlayerOpen(!isMusicPlayerOpen);
                                } else if (item.id === 'abertura') {
                                    onReturnToLanding();
                                } else {
                                    setActiveTab(item.id as TabId);
                                }
                            }}
                            className={`flex items-center p-4 text-gray-text hover:bg-border-color hover:text-light transition-colors duration-200 
                                ${activeTab === item.id || (item.id === 'music-player' && isMusicPlayerOpen) ? 'bg-border-color text-light' : ''}`}
                        >
                            <span className="text-xl w-[28px] text-center"><i className={`fas ${item.icon}`}></i></span>
                            <span className="ml-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 whitespace-nowrap">
                                {t(item.textKey)}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};


const Header: React.FC = () => {
    const [currentDate, setCurrentDate] = useState('');
    const { logAction } = useAppStore();
    const { currentUser, logout } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);

    const languages = {
        pt: { name: 'Português', flag: '🇧🇷' },
        en: { name: 'English', flag: '🇺🇸' },
        es: { name: 'Español', flag: '🇪🇸' },
        zh: { name: '中文', flag: '🇨🇳' },
        ja: { name: '日本語', flag: '🇯🇵' },
    };

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' }));
    }, []);

    const resetData = () => {
        if (window.confirm('Tem certeza que deseja redefinir todos os dados? Esta ação não pode ser desfeita.')) {
            localStorage.clear();
            logAction("DADOS DO SISTEMA RESETADOS.");
            window.location.reload();
        }
    }
    
    const userInitials = currentUser?.name.split(' ').map(n => n[0]).join('').toUpperCase() || '..';

    return (
        <>
        <header className="bg-bg-card p-5 rounded-lg mb-5 shadow-lg border-l-4 border-secondary">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                     <div className="text-3xl text-secondary">🚢</div>
                     <h1 className="text-2xl font-bold text-light">{t('appName')}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <button onClick={() => setLangDropdownOpen(!langDropdownOpen)} className="w-10 h-10 rounded-full bg-border-color flex items-center justify-center text-xl">
                            {languages[language].flag}
                        </button>
                        {langDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-bg-card border border-border-color rounded-md shadow-lg z-50">
                                {Object.entries(languages).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setLanguage(key as any); setLangDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-light hover:bg-border-color flex items-center gap-2"
                                    >
                                        <span className="text-lg">{value.flag}</span> {value.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm">{userInitials}</div>
                    <div>
                        <div className="font-semibold text-light">{currentUser?.name}</div>
                        <div className="text-xs text-gray-text">{currentUser?.role}</div>
                    </div>
                     <button onClick={logout} className="ml-2 px-3 py-1.5 text-xs bg-danger text-white rounded-md hover:opacity-90 flex items-center gap-1.5 shadow-md hover:shadow-lg transition-shadow" title={t('logout')}>
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
            <div className="mt-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="system-info text-sm">
                    <div className="text-lg font-semibold text-light">{currentDate}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-2 text-sm bg-border-color text-light rounded-md hover:opacity-90 flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow" onClick={() => setIsLayoutModalOpen(true)}>
                        <i className="fas fa-palette"></i> Layout
                    </button>
                    <button className="px-3 py-2 text-sm bg-border-color text-light rounded-md hover:opacity-90 flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow" onClick={() => { logAction('Generate PDF clicked'); window.print(); }}>
                        <i className="fas fa-file-pdf"></i> {t('generatePDF')}
                    </button>
                     <button className="px-3 py-2 text-sm bg-danger/80 text-light rounded-md hover:bg-danger flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow" onClick={resetData}>
                        <i className="fas fa-sync-alt"></i> {t('resetData')}
                    </button>
                </div>
            </div>
        </header>
        <LayoutSettingsModal isOpen={isLayoutModalOpen} onClose={() => setIsLayoutModalOpen(false)} />
        </>
    );
};

interface AppShellProps {
    children: React.ReactNode;
    onReturnToLanding: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ children, onReturnToLanding }) => {
    const { isMusicPlayerOpen, theme } = useAppStore();

    useEffect(() => {
        if (isMusicPlayerOpen) {
            document.body.classList.add('music-player-active');
        } else {
            document.body.classList.remove('music-player-active');
        }
        return () => {
            document.body.classList.remove('music-player-active');
        };
    }, [isMusicPlayerOpen]);

    useEffect(() => {
        document.body.classList.remove('theme-default', 'theme-orange');
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);


    return (
        <>
            <Sidebar onReturnToLanding={onReturnToLanding} />
            <div className="flex-1 transition-all duration-300 ml-[60px]">
                <main className="container mx-auto p-5 max-w-7xl">
                    <Header />
                    {children}
                    <footer className="text-center text-gray-text text-xs py-8 mt-8 border-t border-border-color">
                        <p>By_JorgeNasser</p>
                        <p>Brainwave #ols34</p>
                        <p>Tecnologia.</p>
                    </footer>
                </main>
            </div>
            {isMusicPlayerOpen && <MusicPlayer />}
            <ChatWidget />
            <NotificationPanel />
        </>
    );
};


export default AppShell;