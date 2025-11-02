

import React from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Transactions from './Transactions';
import Dashboard from './Dashboard';
import AddRecord from './AddRecord';
import Receipts from './Receipts';
import Operational from './Operational';
import History from './History';
import FreightQuotation from './FreightQuotation';
import DemandDashboard from './DemandDashboard';
import BriefingFeedback from './BriefingFeedback';
import FleetControl from './FleetControl';
import UserManagement from './UserManagement';
import EcoIAPage from './EcoIAPage';
import LayoutSettingsModal from './LayoutSettingsModal';


const FeatureTabs: React.FC = () => {
    const { activeTab } = useAppStore();

    const tabBaseClass = 'w-full transition-opacity duration-300 ease-in-out';
    const activeClass = 'opacity-100';
    const inactiveClass = 'opacity-0 pointer-events-none absolute';

    const getTabClassName = (tabId: string) => {
        return `${tabBaseClass} ${activeTab === tabId ? activeClass : inactiveClass}`;
    }

    return (
        <div className="relative min-h-[70vh]">
            <div className={getTabClassName('transactions')}><Transactions /></div>
            <div className={getTabClassName('reports')}><Dashboard /></div>
            <div className={getTabClassName('add-record')}><AddRecord /></div>
            <div className={getTabClassName('receipts')}><Receipts /></div>
            <div className={getTabClassName('operacional')}><Operational /></div>
            <div className={getTabClassName('freight-quotation')}><FreightQuotation /></div>
            <div className={getTabClassName('history')}><History /></div>
            <div className={getTabClassName('briefing')}><DemandDashboard /></div>
            <div className={getTabClassName('briefing-feedback')}><BriefingFeedback /></div>
            <div className={getTabClassName('fleet-control')}><FleetControl /></div>
            <div className={getTabClassName('user-management')}><UserManagement /></div>
            <div className={getTabClassName('eco-ia')}><EcoIAPage /></div>
        </div>
    );
};

export default FeatureTabs;