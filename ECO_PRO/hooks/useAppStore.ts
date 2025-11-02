import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FinancialData, HistoryLog, OperationalEvent, RecordType, TabId, ReceivableRecord, CalendarEvent, HistoryItem as FreightHistoryItem, Vehicle, MaintenanceTask, Demand, STATUS_MAP, DemandStatus } from '../types';

// Initial data structure if localStorage is empty
const initialFinancialData: FinancialData = {
    fixedCosts: [],
    variableCosts: [],
    revenues: [],
    receivables: []
};

const initialOperationalData: OperationalEvent[] = [];
const initialCalendarEvents: CalendarEvent[] = [];
const initialFreightHistory: FreightHistoryItem[] = [];
const initialFleetData: Vehicle[] = [];
const initialMaintenanceTasks: MaintenanceTask[] = [];
const initialDemands: Demand[] = [];


export interface Notification {
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'danger';
}

type Theme = 'default' | 'orange';
type Layouts = { [key in TabId]?: string[] };

interface AppState {
    activeTab: TabId;
    setActiveTab: (tabId: TabId) => void;
    financialData: FinancialData;
    updateFinancialData: (type: RecordType, data: any[]) => void;
    addRecord: (type: string, record: any) => void;
    deleteRecord: (type: RecordType, id: number) => void;
    markAsPaid: (id: number) => void;
    history: HistoryLog[];
    logAction: (action: string) => void;
    clearHistory: () => void;
    operationalData: OperationalEvent[];
    setOperationalData: React.Dispatch<React.SetStateAction<OperationalEvent[]>>;
    calendarEvents: CalendarEvent[];
    addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'status' | 'justification' | 'completionDate'>) => void;
    completeCalendarEvent: (id: number, justification: string) => void;
    updateCalendarEvent: (event: CalendarEvent) => void;
    freightHistory: FreightHistoryItem[];
    addFreightQuotation: (quotation: FreightHistoryItem) => void;
    deleteFreightQuotation: (id: string) => void;
    isMusicPlayerOpen: boolean;
    setIsMusicPlayerOpen: (isOpen: boolean) => void;
    isMusicPlayerMinimized: boolean;
    setIsMusicPlayerMinimized: (isMinimized: boolean) => void;
    notifications: Notification[];
    dismissNotification: (id: number) => void;
    fleetData: Vehicle[];
    addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
    updateVehicle: (vehicle: Vehicle) => void;
    deleteVehicle: (id: string) => void;
    maintenanceTasks: MaintenanceTask[];
    addMaintenanceTask: (task: Omit<MaintenanceTask, 'id'>) => void;
    updateMaintenanceTask: (task: MaintenanceTask) => void;
    deleteMaintenanceTask: (id: string) => void;
    demands: Demand[];
    setDemands: React.Dispatch<React.SetStateAction<Demand[]>>;
    columnTitles: Record<DemandStatus, string>;
    setColumnTitles: React.Dispatch<React.SetStateAction<Record<DemandStatus, string>>>;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isLayoutMode: boolean;
    setIsLayoutMode: (isLayoutMode: boolean) => void;
    layouts: Layouts;
    setLayouts: React.Dispatch<React.SetStateAction<Layouts>>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeTab, setActiveTabState] = useState<TabId>('reports');
    const [financialData, setFinancialData] = useState<FinancialData>(initialFinancialData);
    const [operationalData, setOperationalData] = useState<OperationalEvent[]>(initialOperationalData);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialCalendarEvents);
    const [history, setHistory] = useState<HistoryLog[]>([]);
    const [freightHistory, setFreightHistory] = useState<FreightHistoryItem[]>(initialFreightHistory);
    const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
    const [isMusicPlayerMinimized, setIsMusicPlayerMinimized] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifiedEventIds, setNotifiedEventIds] = useState<Set<number>>(new Set());
    const [fleetData, setFleetData] = useState<Vehicle[]>(initialFleetData);
    const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(initialMaintenanceTasks);
    const [demands, setDemands] = useState<Demand[]>(initialDemands);
    const [columnTitles, setColumnTitles] = useState<Record<DemandStatus, string>>(STATUS_MAP);
    const [theme, setThemeState] = useState<Theme>('default');
    const [isLayoutMode, setIsLayoutMode] = useState(false);
    const [layouts, setLayouts] = useState<Layouts>({});


    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const newNotification = { ...notification, id: Date.now() };
        setNotifications(prev => [newNotification, ...prev].slice(0, 5));
        
        setTimeout(() => {
            dismissNotification(newNotification.id);
        }, 7000);
    }, []);
    
    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            calendarEvents.forEach(event => {
                if (event.status === 'pending' && event.reminderMinutes && !notifiedEventIds.has(event.id)) {
                    const dueDate = new Date(event.dueDate + 'T23:59:59Z');
                    const reminderDateTime = new Date(dueDate.getTime() - event.reminderMinutes * 60 * 1000);

                    if (now >= reminderDateTime) {
                        addNotification({
                            message: `Lembrete: Conta '${event.description}' vence em breve.`,
                            type: 'warning'
                        });
                        setNotifiedEventIds(prev => new Set(prev).add(event.id));
                    }
                }
            });
        };

        const interval = setInterval(checkReminders, 30000);
        return () => clearInterval(interval);
    }, [calendarEvents, notifiedEventIds, addNotification]);

    useEffect(() => {
        try {
            const storedFinancialData = localStorage.getItem('portFinancialData');
            if (storedFinancialData) setFinancialData(JSON.parse(storedFinancialData));
            
            const storedOperationalData = localStorage.getItem('portOperationalData');
            if (storedOperationalData) setOperationalData(JSON.parse(storedOperationalData));

            const storedCalendarEvents = localStorage.getItem('portCalendarEvents');
            if (storedCalendarEvents) setCalendarEvents(JSON.parse(storedCalendarEvents));

            const storedFreightHistory = localStorage.getItem('portFreightHistory');
            if (storedFreightHistory) setFreightHistory(JSON.parse(storedFreightHistory));
            
            const storedFleetData = localStorage.getItem('portFleetData');
            if (storedFleetData) setFleetData(JSON.parse(storedFleetData));

            const storedMaintenanceTasks = localStorage.getItem('portMaintenanceTasks');
            if (storedMaintenanceTasks) setMaintenanceTasks(JSON.parse(storedMaintenanceTasks));
            
            const storedDemands = localStorage.getItem('portDemands');
            if (storedDemands) setDemands(JSON.parse(storedDemands));
            
            const storedColumnTitles = localStorage.getItem('portColumnTitles');
            if (storedColumnTitles) {
                setColumnTitles(JSON.parse(storedColumnTitles));
            } else {
                setColumnTitles(STATUS_MAP);
            }
            
            const storedTheme = localStorage.getItem('ecolog-theme') as Theme;
            if (storedTheme) setThemeState(storedTheme);
            
            const storedLayouts = localStorage.getItem('ecolog-layouts');
            if (storedLayouts) setLayouts(JSON.parse(storedLayouts));

        } catch (e) {
            console.error("Failed to parse data from localStorage", e);
        }
    }, []);
    
    // Save demands whenever they change
    useEffect(() => {
        saveData('portDemands', demands);
    }, [demands]);

    // Save column titles whenever they change
    useEffect(() => {
        saveData('portColumnTitles', columnTitles);
    }, [columnTitles]);

    // Save layouts whenever they change
    useEffect(() => {
        saveData('ecolog-layouts', layouts);
    }, [layouts]);
    
    const setTheme = (theme: Theme) => {
        setThemeState(theme);
        saveData('ecolog-theme', theme);
    }

    const logAction = useCallback((action: string) => {
        const now = new Date();
        const timestamp = now.toLocaleTimeString('pt-BR');
        const logEntry = { time: timestamp, action: action };
        setHistory(prevHistory => [logEntry, ...prevHistory].slice(0, 100));
    }, []);

    const setActiveTab = (tabId: TabId) => {
        setActiveTabState(tabId);
        setIsLayoutMode(false); // Turn off layout mode when changing tabs
        logAction(`Navigated to tab: ${tabId}`);
    };

    const saveData = (key: string, data: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save data to localStorage for key: ${key}`, error);
        }
    };

    const updateFinancialData = (type: RecordType, data: any[]) => {
        setFinancialData(prevData => {
            const newData = { ...prevData, [type]: data };
            saveData('portFinancialData', newData);
            return newData;
        });
    };
    
    const addRecord = (type: string, record: any) => {
        const recordTypeMap: { [key: string]: RecordType } = {
            'fixed-cost': 'fixedCosts',
            'variable-cost': 'variableCosts',
            'revenue': 'revenues',
            'receivable': 'receivables',
        };
        const recordType = recordTypeMap[type];
        if(!recordType) return;

        setFinancialData(prevData => {
            const updatedData = {
                ...prevData,
                [recordType]: [...prevData[recordType], record]
            };
            saveData('portFinancialData', updatedData);
            return updatedData;
        });
        logAction(`Added record: ${type} - ${record.description}`);
    };

    const deleteRecord = (type: RecordType, id: number) => {
        setFinancialData(prevData => {
            const itemToDelete = prevData[type].find(item => (item as any).id === id);
            const updatedList = prevData[type].filter(item => (item as any).id !== id);
            const updatedData = { ...prevData, [type]: updatedList };
            saveData('portFinancialData', updatedData);
            if (itemToDelete) {
                logAction(`Deleted record: ${type} - ${(itemToDelete as any).description}`);
            }
            return updatedData;
        });
    };

    const markAsPaid = (id: number) => {
        setFinancialData(prevData => {
            let recordDescription = '';
            // Fix: Explicitly type the return value of the map function to ensure type correctness.
            const updatedReceivables = prevData.receivables.map((r): ReceivableRecord => {
                if (r.id === id) {
                    recordDescription = r.description;
                    return { ...r, status: 'paid' };
                }
                return r;
            });
            const updatedData = { ...prevData, receivables: updatedReceivables };
            saveData('portFinancialData', updatedData);
            logAction(`Marked receivable as paid: ${recordDescription}`);
            return updatedData;
        });
    };
    
    const addCalendarEvent = (event: Omit<CalendarEvent, 'id' | 'status' | 'justification' | 'completionDate'>) => {
        setCalendarEvents(prev => {
            const newEvent: CalendarEvent = {
                ...event,
                id: Date.now(),
                status: 'pending',
            };
            const updatedEvents = [...prev, newEvent];
            saveData('portCalendarEvents', updatedEvents);
            logAction(`Added calendar event: ${event.description}`);
            return updatedEvents;
        });
    };
    
    const completeCalendarEvent = (id: number, justification: string) => {
        setCalendarEvents(prev => {
            // Fix: Explicitly type the return value of the map function to prevent type widening from `string` to `'pending' | 'completed'`.
            const updatedEvents = prev.map((e): CalendarEvent => {
                if (e.id === id) {
                    logAction(`Completed calendar event: ${e.description}`);
                    return { 
                        ...e, 
                        status: 'completed', 
                        justification,
                        completionDate: new Date().toISOString().split('T')[0]
                    };
                }
                return e;
            });
            saveData('portCalendarEvents', updatedEvents);
            return updatedEvents;
        });
        setNotifiedEventIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    };

    const updateCalendarEvent = (updatedEvent: CalendarEvent) => {
        setCalendarEvents(prev => {
            const updatedEvents = prev.map(e => (e.id === updatedEvent.id ? updatedEvent : e));
            saveData('portCalendarEvents', updatedEvents);
            logAction(`Updated calendar event: ${updatedEvent.description}`);
            return updatedEvents;
        });
        setNotifiedEventIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(updatedEvent.id);
            return newSet;
        });
    };

    const addFreightQuotation = (quotation: FreightHistoryItem) => {
        setFreightHistory(prev => {
            const updatedHistory = [quotation, ...prev].slice(0, 100); // Keep last 100
            saveData('portFreightHistory', updatedHistory);
            logAction(`Adicionado orçamento de transporte para o cliente: ${quotation.client}`);
            return updatedHistory;
        });
    };

    const deleteFreightQuotation = (id: string) => {
        setFreightHistory(prev => {
            const itemToDelete = prev.find(item => item.id === id);
            const updatedHistory = prev.filter(item => item.id !== id);
            saveData('portFreightHistory', updatedHistory);
            if (itemToDelete) {
                logAction(`Excluído orçamento de transporte para o cliente: ${itemToDelete.client}`);
            }
            return updatedHistory;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        logAction("History cleared.");
    };

    // Fleet Management Functions
    const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
        setFleetData(prev => {
            const newVehicle: Vehicle = { ...vehicle, id: `VEH-${Date.now()}` };
            const updatedData = [...prev, newVehicle];
            saveData('portFleetData', updatedData);
            logAction(`Adicionado novo veículo: ${vehicle.plate} - ${vehicle.model}`);
            return updatedData;
        });
    };

    const updateVehicle = (updatedVehicle: Vehicle) => {
        setFleetData(prev => {
            const updatedData = prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
            saveData('portFleetData', updatedData);
            logAction(`Atualizado veículo: ${updatedVehicle.plate}`);
            return updatedData;
        });
    };

    const deleteVehicle = (id: string) => {
        setFleetData(prev => {
            const vehicleToDelete = prev.find(v => v.id === id);
            const updatedData = prev.filter(v => v.id !== id);
            saveData('portFleetData', updatedData);
            if (vehicleToDelete) {
                logAction(`Removido veículo: ${vehicleToDelete.plate}`);
            }
            return updatedData;
        });
    };

    const addMaintenanceTask = (task: Omit<MaintenanceTask, 'id'>) => {
        setMaintenanceTasks(prev => {
            const newTask: MaintenanceTask = { ...task, id: `MAINT-${Date.now()}` };
            const updatedData = [...prev, newTask];
            saveData('portMaintenanceTasks', updatedData);
            logAction(`Agendada manutenção para veículo ID ${task.vehicleId}: ${task.serviceType}`);
            return updatedData;
        });
    };

    const updateMaintenanceTask = (updatedTask: MaintenanceTask) => {
        setMaintenanceTasks(prev => {
            const updatedData = prev.map(t => t.id === updatedTask.id ? updatedTask : t);
            saveData('portMaintenanceTasks', updatedData);
            logAction(`Atualizada manutenção ID ${updatedTask.id}`);
            return updatedData;
        });
    };

    const deleteMaintenanceTask = (id: string) => {
        setMaintenanceTasks(prev => {
            const taskToDelete = prev.find(t => t.id === id);
            const updatedData = prev.filter(t => t.id !== id);
            saveData('portMaintenanceTasks', updatedData);
            if (taskToDelete) {
                logAction(`Removida manutenção ID ${taskToDelete.id}`);
            }
            return updatedData;
        });
    };

    const value: AppState = {
        activeTab,
        setActiveTab,
        financialData,
        updateFinancialData,
        addRecord,
        deleteRecord,
        markAsPaid,
        history,
        logAction,
        clearHistory,
        operationalData,
        setOperationalData,
        calendarEvents,
        addCalendarEvent,
        completeCalendarEvent,
        updateCalendarEvent,
        freightHistory,
        addFreightQuotation,
        deleteFreightQuotation,
        isMusicPlayerOpen,
        setIsMusicPlayerOpen,
        isMusicPlayerMinimized,
        setIsMusicPlayerMinimized,
        notifications,
        dismissNotification,
        fleetData,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        maintenanceTasks,
        addMaintenanceTask,
        updateMaintenanceTask,
        deleteMaintenanceTask,
        demands,
        setDemands,
        columnTitles,
        setColumnTitles,
        theme,
        setTheme,
        isLayoutMode,
        setIsLayoutMode,
        layouts,
        setLayouts,
    };

    // FIX: Replaced JSX with React.createElement because this file has a .ts extension,
    // which was causing JSX parsing errors. Using React.createElement avoids this issue.
    return React.createElement(AppContext.Provider, { value: value }, children);
};

export const useAppStore = (): AppState => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppStore must be used within an AppProvider');
    }
    return context;
};