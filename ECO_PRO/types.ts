
export type TabId = 'transactions' | 'reports' | 'add-record' | 'receipts' | 'operacional' | 'history' | 'freight-quotation' | 'briefing' | 'briefing-feedback' | 'fleet-control' | 'user-management' | 'eco-ia';

export type Role = 'Admin' | 'User';

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Should be hashed in a real app
    role: Role;
}

export interface FinancialRecord {
    id: number;
    name: string;
    description: string;
    category: string;
    value: number;
    date: string; // YYYY-MM-DD
    attachment?: string;
    observation?: string;
}

export interface RevenueRecord {
    id: number;
    name: string;
    description: string;
    client: string;
    value: number;
    date: string; // YYYY-MM-DD
    category: string;
    attachment?: string;
    observation?: string;
}

export interface ReceivableRecord {
    id: number;
    name: string;
    description: string;
    client: string;
    value: number;
    dueDate: string; // YYYY-MM-DD
    status: 'pending' | 'paid';
    category: string;
    attachment?: string;
    observation?: string;
}

export interface FinancialData {
    fixedCosts: FinancialRecord[];
    variableCosts: FinancialRecord[];
    revenues: RevenueRecord[];
    receivables: ReceivableRecord[];
}

export type RecordType = 'fixedCosts' | 'variableCosts' | 'revenues' | 'receivables';

export interface HistoryLog {
    time: string;
    action: string;
}

export interface OperationalEvent {
    id: string;
    date: string; // YYYY-MM-DD
    containerId: string;
    status: 'agendado' | 'ativo' | 'rota' | 'atrasado' | 'encerrado';
    driverName: string;
    // Add all other fields from the massive form
    [key: string]: any;
}

export interface CalendarEvent {
    id: number;
    description: string;
    value: number;
    dueDate: string; // YYYY-MM-DD
    status: 'pending' | 'completed';
    justification?: string;
    completionDate?: string;
    reminderMinutes?: number;
}

// New types for Freight Quotation
export interface QuotationData {
    client: string;
    cnpj: string;
    origin: string;
    destination: string;
    distance: string;
    freightValue?: string;
    vehicleModel: VehicleModel;
    fuelPrice: string;
    tollPerKm: string;
    urgency: Urgency;
    hasEscort: boolean;
    escortCost: string;
}

export enum VehicleModel {
    Truck = 'Caminhão',
    PickupTruck = 'Picape',
    Van = 'Van',
}

export enum Urgency {
    Baixa = 'Baixa',
    Media = 'Média',
    Alta = 'Alta',
}

export interface CalculationResult {
    distance: number;
    tollCost: number;
    fuelConsumption: number;
    fuelCost: number;
    driverAndHelperCost: number;
    maintenanceCost: number;
    insuranceCost: number;
    escortCost: number;
    baseFreight: number;
    urgencySurcharge: number;
    totalFreightValue: number;
    costPerKm: number;
}

export interface HistoryItem extends CalculationResult {
    id: string;
    timestamp: string;
    origin: string;
    destination: string;
    vehicleModel: VehicleModel;
    client: string;
    cnpj: string;
    urgency: Urgency;
    fuelPrice: number;
    tollPerKm: number;
    escortCost: number;
}

// Types for Kanban Demand Board
export type DemandStatus = 'demandas' | 'analise' | 'execucao' | 'concluido';

export interface Photo {
  id: string;
  src: string; // base64
  name: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
}

export interface Demand {
  id: string;
  client: string;
  contact: string;
  service: string;
  setor: string;
  urgencia: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  prazo: string;
  responsavel: string;
  emailAviso: string;
  celAviso: string;
  photos: Photo[];
  attachments: Attachment[];
  date: string;
  status: DemandStatus;
  dateStart?: string;
  dateEnd?: string;
}

export const STATUS_MAP: Record<DemandStatus, string> = {
  demandas: 'Demandas',
  analise: 'Em Análise',
  execucao: 'Em Execução',
  concluido: 'Concluído',
};

export const STATUS_ICON_MAP: Record<DemandStatus, string> = {
    demandas: 'fa-inbox',
    analise: 'fa-search-dollar',
    execucao: 'fa-truck-fast',
    concluido: 'fa-check-circle',
};

export const STATUS_COLOR_MAP: Record<DemandStatus, string> = {
    demandas: 'border-red-500',
    analise: 'border-yellow-500',
    execucao: 'border-blue-500',
    concluido: 'border-green-500',
}

// Types for Fleet Control
export type VehicleStatus = 'Operacional' | 'Em Manutenção' | 'Inativo';

export interface Vehicle {
    id: string;
    plate: string;
    model: string;
    year: number;
    driver: string;
    status: VehicleStatus;
}

export type MaintenanceStatus = 'Agendada' | 'Concluída';

export interface MaintenanceTask {
    id: string;
    vehicleId: string; // Corresponds to a Vehicle's id
    serviceType: string;
    date: string; // YYYY-MM-DD
    cost: number;
    notes: string;
    status: MaintenanceStatus;
}