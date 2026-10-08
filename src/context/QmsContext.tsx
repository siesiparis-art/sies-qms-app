'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchDirectFromYandexDisk, saveDirectToYandexDisk } from '../utils/yandexDirectSync';

// Type definitions for QMS Entities
export interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  department: string;
  avatarInitials: string;
  color: string;
}

export const SYSTEM_USERS: (User & { passwordHash: string })[] = [
  {
    id: 'usr-1',
    name: 'İbrahim Sert',
    username: 'admin',
    passwordHash: '123456',
    role: 'Genel Müdür',
    department: 'Yönetim',
    avatarInitials: 'İS',
    color: 'from-orange-500 to-amber-600'
  },
  {
    id: 'usr-2',
    name: 'Hasan Sert',
    username: 'satis',
    passwordHash: '123456',
    role: 'Satış & Pazarlama Müdürü',
    department: 'Satış & Pazarlama',
    avatarInitials: 'HS',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'usr-3',
    name: 'Faruk Oruç',
    username: 'kalite',
    passwordHash: '123456',
    role: 'Kalite Güvence Temsilcisi',
    department: 'Kalite Güvence',
    avatarInitials: 'FO',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'usr-4',
    name: 'Günay Bay',
    username: 'muhasebe',
    passwordHash: '123456',
    role: 'Muhasebe',
    department: 'Muhasebe & Finans',
    avatarInitials: 'GB',
    color: 'from-purple-500 to-violet-600'
  },
  {
    id: 'usr-5',
    name: 'İbrahim Aydın',
    username: 'depo',
    passwordHash: '123456',
    role: 'Depo & Sevkiyat Sorumlusu',
    department: 'Lojistik & Depo',
    avatarInitials: 'İA',
    color: 'from-pink-500 to-rose-600'
  }
];

export const YANDEX_DISK_URL = 'https://disk.yandex.com.tr/d/1322d_cn4bYRaA';

export interface CompanyInfo {
  name: string;
  logo: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  phone: string;
  email: string;
  qualityPolicy: string;
  qualityObjectives: string[];
  yandexDiskUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  manager: string;
}

export interface Personnel {
  id: string;
  name: string;
  department: string;
  position: string;
  certificates: string[];
  competencies: string[];
  trainingRecords: string[];
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  unit?: string;
  unitPrice?: number;
  currency?: string;
}

export interface Process {
  id: string;
  name: string;
  owner: string;
  inputs: string[];
  outputs: string[];
  kpis: string[];
}

export interface Machine {
  id: string;
  name: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  maintenanceIntervalDays: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  status: 'Çalışıyor' | 'Arızalı' | 'Bakımda';
}

export interface MeasuringDevice {
  id: string;
  name: string;
  serialNumber: string;
  certificateNumber: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  status: 'Kalibre' | 'Süresi Geçmiş' | 'Kullanım Dışı';
  // Enerji Kalibrasyon fields:
  customerName?: string;
  address?: string;
  orderNo?: string;
  manufacturer?: string;
  typeModel?: string;
  pageCount?: number;
  inventoryNo?: string;
  pdfFileUrl?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  rating: number; // 0-100
  status: 'Onaylı' | 'Askıda' | 'Değerlendiriliyor';
}

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  address?: string;
  phone?: string;
}

export interface Material {
  id: string;
  name: string;
  code: string;
  supplierId: string;
}

export interface QmsDocument {
  id: string; // QM-001, PR-001, etc.
  title: string;
  type: 'QM' | 'PR' | 'PL' | 'TL' | 'LS' | 'FR' | 'KR' | 'DS' | 'RP' | 'TR' | 'DF' | 'IA' | 'YGG' | 'CL' | 'PM' | 'EG';
  revision: number;
  revisionDate: string;
  preparedBy: string;
  approvedBy: string;
  status: 'Taslak' | 'Onaylı' | 'Revizyonda';
  content: string;
  relatedDocs: string[]; // Linked document numbers
  history: { revision: number; date: string; description: string; author: string }[];
  formNumber?: string;
  controlledBy?: string;
  templateFields?: any[];
  databaseId?: string;
  revisionId?: string;
}

export interface RiskOpportunity {
  id: string;
  type: 'Risk' | 'Fırsat';
  description: string;
  source: string; // Process or Department
  probability: number; // 1-5
  severity: number; // 1-5
  score: number; // probability * severity
  mitigationAction: string;
  owner: string;
  status: 'Açık' | 'Aksiyon Alındı' | 'Kapalı';
}

export interface Audit {
  id: string; // IA-001
  title: string;
  planDate: string;
  actualDate?: string;
  auditors: string[];
  auditees: string[];
  checklist: { question: string; result: 'Uygun' | 'Uygunsuz' | 'Gözlem'; note: string; capaId?: string }[];
  status: 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı';
  findingsReport?: string;
}

export interface CAPA {
  id: string; // DF-001
  title: string;
  sourceType: 'Denetim' | 'Şikayet' | 'Uygunsuzluk' | 'YGG' | 'Diğer';
  sourceId?: string;
  detectedDate: string;
  description: string;
  immediateAction: string;
  rootCauseAnalysis: string; // 5 Neden Analizi (5 Whys)
  preventiveAction: string;
  assignedTo: string;
  targetDate: string;
  verificationDate?: string;
  verificationResult?: string;
  status: 'Açık' | 'Doğrulama Bekliyor' | 'Kapalı';
}

export interface TestReport {
  id: string; // TR-001
  testType: 'Elektriksel Süreklilik' | 'Mekanik Yük' | 'Sapma (Deflection)' | 'Boyutsal Muayene' | 'Korozyon Direnci' | 'Sıcaklık Testi';
  productCode: string;
  testDate: string;
  testDevice: string; // MeasuringDevice ID
  calibrationCertificate: string;
  operator: string; // Personnel ID
  instructionId: string; // TL-xxx ID
  acceptanceCriteria: string;
  resultsJson: string; // Detailed structural measurements
  status: 'Geçti' | 'Kaldı';
  notes: string;
}

export interface IncomingInspection {
  id: string;
  supplierId: string;
  deliveryNoteNo: string;
  deliveryDate: string;
  materialName: string;
  thicknessMm?: number;
  widthMm?: number;
  coatingThicknessMicron?: number;
  visualStatus: 'Uygun' | 'Hatalı';
  decision: 'Kabul' | 'Koşullu Kabul' | 'Red';
  inspector: string;
  notes?: string;
  // Trace / PDF properties
  pdfFile?: string;
  measuredValue?: string;
  boyutKontrolu?: boolean;
  gozleElle?: boolean;
  kaplamaMikron?: string;
  miktarKg?: number;
  miktarPlaka?: number;
}

export interface OutgoingInspection {
  id: string;
  customerId: string;
  dispatchNoteNo: string;
  dispatchDate: string;
  productCode: string;
  quantityMetres: number;
  thicknessMm: number;
  widthMm: number;
  measuredCoatingMicron: number;
  visualStatus: 'Uygun' | 'Hatalı';
  decision: 'Kabul' | 'Red';
  inspector: string;
  notes?: string;
  pdfFile?: string; // Outgoing dispatch note PDF
}

export interface CalibrationRecord {
  id: string; // CL-001
  deviceId: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibratedBy: string;
  certificateNo: string;
  result: 'Uygun' | 'Sapmalı' | 'Kullanılamaz';
  fileUrl?: string;
}

export interface MaintenanceRecord {
  id: string; // PM-001
  machineId: string;
  maintenanceDate: string;
  doneBy: string;
  details: string;
  partsReplaced: string[];
  cost: number;
}

export interface TrainingRecord {
  id: string; // EG-001
  trainingName: string;
  trainer: string;
  date: string;
  durationHours: number;
  attendees: string[]; // Personnel IDs
  attendanceFormUrl?: string;
  feedbackScore?: number;
}

export interface CustomerComplaint {
  id: string;
  customerName: string;
  complaintDate: string;
  details: string;
  assignedTo: string;
  capaId?: string;
  status: 'Alındı' | 'İncelemede' | 'Aksiyon Alındı' | 'Çözüldü';
}

export interface Nonconformity {
  id: string;
  title: string;
  detectedDate: string;
  source: string; // Machine, Department, Process
  description: string;
  quantity: number;
  disposition: 'Hurda' | 'Düzeltme' | 'Şartlı Kabul' | 'Tedarikçiye İade';
  capaId?: string;
  status: 'Açık' | 'Kapalı';
}

export interface ManagementReview {
  id: string; // YGG-001
  meetingDate: string;
  attendees: string[];
  agenda: string[];
  inputs: string[];
  outputs: string[];
  actionPlans: { action: string; owner: string; targetDate: string; status: string }[];
  minutes: string;
}

export interface InProcessCheck {
  timestamp: string;
  sampleNo: number;
  measuredWidthMm: number;
  measuredThicknessMm: number;
  visualStatus: 'Uygun' | 'Hatalı';
  inspector: string;
}

export interface ProductionRun {
  id: string; // PRD-2026-001
  productionOrderNo: string; // Production order document reference
  date: string;
  productCode: string;
  quantity: number;
  operator: string;
  pdfFile?: string; // Uploaded Production Form PDF
  
  // First Inspection Checks
  firstCheckStatus: 'Uygun' | 'Hatalı' | 'Bekliyor';
  firstCheckWidthMm?: number;
  firstCheckHeightMm?: number;
  firstCheckThicknessMm?: number;
  firstCheckInspector?: string;
  firstCheckDate?: string;

  // In-Process check logs
  inProcessChecks: InProcessCheck[];
  
  // Traceability link
  finalInspectionDispatchNo?: string;
  status: 'İlk Kontrol Bekliyor' | 'Ara Kontrol Devam Ediyor' | 'Tamamlandı';
  notes?: string; // Özel Talimatlar / Notlar
  orderId?: string; // İlişkili sipariş ID
  processes?: string[]; // Proses adımları (Kesme, Delme, Bükme vb.)
  standardDimensions?: string;
  operatorsAssigned?: Record<string, string>;
}

export interface QuoteItem {
  productCode: string;
  quantity: number;
  price: number;
  description?: string;
  unit?: string;
}

export interface Quote {
  id: string; // TKF-2026-001
  customerName: string;
  date: string;
  items: QuoteItem[];
  totalAmount: number;
  status: 'Teklif Hazırlandı' | 'Onaylandı' | 'Reddedildi';
  discountPercent?: number;
  taxPercent?: number;
  validityPeriod?: string;
  companyName?: string;
  companyRepresentative?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  customerRepresentative?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  paymentTerms?: string;
  deliveryTime?: string;
  deliveryPlace?: string;
  bankInfo?: string;
  ziraatInfo?: string;
  materialGrade?: string;
}

export interface OrderItem {
  productCode: string;
  quantity: number;
  shippedQuantity: number;
  status: 'Bekliyor' | 'Üretimde' | 'Kaplamada' | 'Boyada' | 'Paketlemede' | 'Sevk Edildi' | 'Üretim Dışı';
  description?: string;
  price?: number;
  total?: number;
  unit?: string;
  coatingType?: string;
  itemNotes?: string;
}

export interface OrderDispatch {
  dispatchNoteNo: string;
  date: string;
  items: { productCode: string, quantity: number }[];
}

export interface OrderHistoryItem {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface Order {
  id: string; // ORD-1790668409467
  customerOrderNo?: string; // Müşteri Sipariş No (GEMAK-2026-01 vb.)
  quoteId: string;
  customerName: string;
  date: string;
  items: OrderItem[];
  status: 'YENİ SİPARİŞ' | 'ÜRETİMDE' | 'KAPLAMADA' | 'BOYADA' | 'PAKETLEMEDE' | 'KISMİ SEVK EDİLDİ' | 'SEVK EDİLDİ';
  productionRunId?: string;
  dispatchNoteNo?: string;
  dispatches: OrderDispatch[];
  attachedFileLink?: string;
  attachedFileName?: string;
  originalFileUrl?: string;
  originalFileName?: string;
  externalCloudLink?: string;
  projectNo?: string;
  deliveryDate?: string;
  coatingTypes?: string[];
  deliveryType?: string;
  deliveryDetail?: string;
  shippingAddress?: string;
  shippingFee?: string;
  differentBilling?: boolean;
  notes?: string;
  isExempt?: boolean;

  // USER ACTION AUDIT TRAIL & POOL TRACKING
  createdBy?: string;
  createdDate?: string;
  sentToProductionBy?: string;
  sentToProductionDate?: string;
  sentToCoatingBy?: string;
  sentToCoatingDate?: string;
  sentToPaintingBy?: string;
  sentToPaintingDate?: string;
  shippedBy?: string;
  shippedDate?: string;
  history?: OrderHistoryItem[];
  updatedAt?: number;
}

export interface AnalysisRow {
  name: string; // element or property
  unit: string;
  min?: number;
  max?: number;
  actual: number;
}

export interface CertificateItem {
  productCode: string;
  quantity: number;
  size: string; // e.g. "50X15X1.5MM"
  description: string; // "GLV ME TİPİ KABLO KANALI"
  process: string; // "KESME - DELME - BÜKME"
  requirement: string; // "DIN 2442"
  material: string; // "ST 37"
  
  // chemical composition row
  c: number;
  si: number;
  mn: number;
  p: number;
  s: number;
  cr: number;
  ni: number;
  mo: number;
  ti: number;
  n: number;
  al: number;

  // mechanical results row
  muayeneNo: string; // e.g. "(EN 755-2)"
  reh: number; // Akma Dayanımı
  rm: number; // Gerilme Dayanımı
  a: number; // Uzama
}

export interface InspectionCertificate {
  id: string; // CERT-2026-001
  dispatchNoteNo: string;
  orderId: string;
  date: string;
  materialGrade: string; // ST37, 304, etc.
  customerName: string;
  projectId: string; // e.g. "502099"
  manufactureYear: string; // e.g. "2026"
  items: CertificateItem[];
}

interface QmsContextType {
  companySetupDone: boolean;
  companyInfo: CompanyInfo;
  departments: Department[];
  personnel: Personnel[];
  positions: string[];
  products: Product[];
  processes: Process[];
  machines: Machine[];
  measuringDevices: MeasuringDevice[];
  suppliers: Supplier[];
  customers: Customer[];
  materials: Material[];
  documents: QmsDocument[];
  risks: RiskOpportunity[];
  audits: Audit[];
  capas: CAPA[];
  testReports: TestReport[];
  incomingInspections: IncomingInspection[];
  outgoingInspections: OutgoingInspection[];
  calibrationRecords: CalibrationRecord[];
  maintenanceRecords: MaintenanceRecord[];
  trainingRecords: TrainingRecord[];
  complaints: CustomerComplaint[];
  nonconformities: Nonconformity[];
  managementReviews: ManagementReview[];
  productionRuns: ProductionRun[];
  quotes: Quote[];
  orders: Order[];
  certificates: InspectionCertificate[];
  activeCategoryTab: string;
  setActiveCategoryTab: (tab: string) => void;
  showCreateOrderWizard: boolean;
  setShowCreateOrderWizard: (show: boolean) => void;
  orderSearchQuery: string;
  setOrderSearchQuery: (query: string) => void;
  forceSyncCloud: () => Promise<boolean>;
  getFileFromIndexedDB: (key: string) => Promise<string | null>;
  resolveDocumentUrl: (rawUrl: string, fallbackCloudUrl?: string) => Promise<string>;
  
  // Actions
  completeSetup: (
    info: CompanyInfo,
    deps: Department[],
    pers: Personnel[],
    prods: Product[],
    procs: Process[],
    machs: Machine[],
    devices: MeasuringDevice[],
    sups: Supplier[],
    custs: Customer[]
  ) => void;
  
  addDocument: (doc: Omit<QmsDocument, 'history'>) => void;
  updateDocument: (id: string, updates: Partial<QmsDocument>) => void;
  addPersonnel: (p: Personnel) => void;
  addProduct: (p: Product) => void;
  addMachine: (m: Machine) => void;
  addMeasuringDevice: (d: MeasuringDevice) => void;
  updateMeasuringDevice: (id: string, updates: Partial<MeasuringDevice>) => void;
  addRisk: (r: RiskOpportunity) => void;
  addCapa: (c: CAPA) => void;
  addAudit: (a: Audit) => void;
  addTestReport: (t: TestReport) => void;
  addIncomingInspection: (i: IncomingInspection) => void;
  addOutgoingInspection: (o: OutgoingInspection) => void;
  addSupplier: (s: Supplier) => void;
  addCustomer: (c: Customer) => void;
  addComplaint: (c: CustomerComplaint) => void;
  addNonconformity: (n: Nonconformity) => void;
  addManagementReview: (m: ManagementReview) => void;
  addTrainingRecord: (t: TrainingRecord) => void;
  addCalibrationRecord: (c: CalibrationRecord) => void;
  addMaintenanceRecord: (m: MaintenanceRecord) => void;
  addProductionRun: (run: ProductionRun) => void;
  updateProductionRun: (id: string, updates: Partial<ProductionRun>) => void;
  addQuote: (q: Quote) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  addOrder: (o: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addCertificate: (c: InspectionCertificate) => void;
  
  resetAll: () => void;
  clearTransactionData: () => void;

  // Authentication & Multi-User State
  currentUser: User | null;
  systemUsers: User[];
  login: (username: string, passwordHash: string) => boolean;
  logout: () => void;
}

const QmsContext = createContext<QmsContextType | undefined>(undefined);

// Simple native IndexedDB helper for QmsContext file migrations
const dbName = 'qms_file_storage';
const storeName = 'pdf_files';

const saveFileToIndexedDB = (key: string, base64Data: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        db.createObjectStore(storeName);
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(base64Data, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      };
      request.onerror = () => resolve(false);
    } catch (err) {
      resolve(false);
    }
  });
};

export const getFileFromIndexedDB = (key: string): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(dbName, 1);
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          resolve(null);
          return;
        }
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
};

export const uploadDocToCloud = (docKey: string, base64Data: string) => {
  if (typeof window === 'undefined' || !docKey || !base64Data || !base64Data.startsWith('data:')) return;
  fetch(`/api/sync?t=${Date.now()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ key: 'qms_doc_' + docKey, data: base64Data })
  }).catch(err => console.warn('Cloud document upload error:', err));
};

export const resolveDocumentUrl = async (rawUrl: string, fallbackCloudUrl?: string): Promise<string> => {
  if (!rawUrl) return fallbackCloudUrl || YANDEX_DISK_URL;
  if (!rawUrl.startsWith('db://')) return rawUrl;

  const key = rawUrl.replace('db://', '');

  // 1. Check local IndexedDB first
  try {
    const localBase64 = await getFileFromIndexedDB(key);
    if (localBase64 && typeof localBase64 === 'string' && localBase64.startsWith('data:')) {
      return localBase64;
    }
  } catch (e) {
    console.warn('IndexedDB read error:', e);
  }

  // 2. Fetch from Cloud API store if missing locally (with 2s timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`/api/sync?key=qms_doc_${key}&t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.data && typeof json.data === 'string' && json.data.startsWith('data:')) {
        // Cache in local IndexedDB for future instant offline access
        saveFileToIndexedDB(key, json.data);
        return json.data;
      }
    }
  } catch (err) {
    console.error('Cloud document fetch error:', err);
  }

  // Direct fallback to Yandex Disk Drive URL so no PC gets stuck on loading spinner
  return fallbackCloudUrl || YANDEX_DISK_URL;
};

export const QmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [companySetupDone, setCompanySetupDone] = useState(false);
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '', logo: '', address: '', taxOffice: '', taxNumber: '', phone: '', email: '',
    qualityPolicy: '', qualityObjectives: []
  });
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [measuringDevices, setMeasuringDevices] = useState<MeasuringDevice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [documents, setDocuments] = useState<QmsDocument[]>([]);
  const [risks, setRisks] = useState<RiskOpportunity[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [incomingInspections, setIncomingInspections] = useState<IncomingInspection[]>([]);
  const [outgoingInspections, setOutgoingInspections] = useState<OutgoingInspection[]>([]);
  const [calibrationRecords, setCalibrationRecords] = useState<CalibrationRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [complaints, setComplaints] = useState<CustomerComplaint[]>([]);
  const [nonconformities, setNonconformities] = useState<Nonconformity[]>([]);
  const [managementReviews, setManagementReviews] = useState<ManagementReview[]>([]);
  const [productionRuns, setProductionRuns] = useState<ProductionRun[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [certificates, setCertificates] = useState<InspectionCertificate[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('TÜMÜ');
  const [showCreateOrderWizard, setShowCreateOrderWizard] = useState<boolean>(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  // User Authentication & Session State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qms_current_user');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return SYSTEM_USERS[0]; // Default to İbrahim Sert (Genel Müdür)
  });

  const login = (username: string, passwordHash: string): boolean => {
    const found = SYSTEM_USERS.find(u => u.username === username && u.passwordHash === passwordHash);
    if (found) {
      setCurrentUser(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('qms_current_user', JSON.stringify(found));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qms_current_user');
    }
  };

  const isInvalidClientOrder = (item: any, deletedSet?: Set<string>): boolean => {
    if (!item || !item.id) return true;
    const itemId = String(item.id || '').trim().toLowerCase();
    const orderNo = String(item.customerOrderNo || '').trim().toLowerCase();

    if (deletedSet) {
      if (itemId !== '' && deletedSet.has(itemId)) return true;
      if (orderNo !== '' && deletedSet.has(orderNo)) return true;
    }

    if (itemId.includes('test-ord') || orderNo.includes('test-ord')) return true;
    if (itemId.includes('spr-2024-002') || orderNo.includes('spr-2024-002')) return true;

    return false;
  };

  const getOrderWeight = (item: any): number => {
    if (!item) return 0;
    let weight = typeof item.updatedAt === 'number' && item.updatedAt > 0 ? item.updatedAt : 0;

    const STATUS_RANKS: Record<string, number> = {
      'SEVK EDİLDİ': 7000000,
      'KISMİ SEVK EDİLDİ': 6000000,
      'PAKETLEMEDE': 5000000,
      'BOYADA': 4000000,
      'KAPLAMADA': 3000000,
      'ÜRETİMDE': 2000000,
      'YENİ SİPARİŞ': 1000000
    };
    
    const statusWeight = STATUS_RANKS[String(item.status || '').toUpperCase()] || 0;
    const dispatchWeight = Array.isArray(item.dispatches) ? item.dispatches.length * 100000 : 0;
    const historyWeight = Array.isArray(item.history) ? item.history.length * 1000 : 0;

    return weight + statusWeight + dispatchWeight + historyWeight;
  };

  // Smart Merge Helper for multi-device sync
  const mergeById = (arr1: any[], arr2: any[]) => {
    const map = new Map<string, any>();

    const processItem = (item: any) => {
      if (!item || typeof item !== 'object') return;
      const itemId = String(item.id || item.customerOrderNo || '').trim().toLowerCase();
      if (!itemId) return;

      if (!map.has(itemId)) {
        map.set(itemId, item);
      } else {
        const existing = map.get(itemId);
        const existingW = getOrderWeight(existing);
        const incomingW = getOrderWeight(item);
        if (incomingW >= existingW) {
          map.set(itemId, item);
        }
      }
    };

    (arr1 || []).forEach(processItem);
    (arr2 || []).forEach(processItem);

    return Array.from(map.values());
  };

  // Helper to sanitize & decouple heavy Base64 strings to IndexedDB before local & cloud persistence
  const sanitizeDataForStorage = (data: any) => {
    if (!data) return data;
    if (Array.isArray(data)) {
      return data.map(item => {
        if (item && typeof item === 'object') {
          const copy = { ...item };
          if (copy.attachedFileLink && typeof copy.attachedFileLink === 'string' && copy.attachedFileLink.startsWith('data:')) {
            const key = 'pdf_file_att_' + copy.id;
            saveFileToIndexedDB(key, copy.attachedFileLink);
            uploadDocToCloud(key, copy.attachedFileLink);
            copy.attachedFileLink = 'db://' + key;
          }
          if (copy.originalFileUrl && typeof copy.originalFileUrl === 'string' && copy.originalFileUrl.startsWith('data:')) {
            const key = 'pdf_file_orig_' + copy.id;
            saveFileToIndexedDB(key, copy.originalFileUrl);
            uploadDocToCloud(key, copy.originalFileUrl);
            copy.originalFileUrl = 'db://' + key;
          }
          if (copy.pdfFile && typeof copy.pdfFile === 'string' && copy.pdfFile.startsWith('data:')) {
            const key = 'pdf_file_run_' + copy.id;
            saveFileToIndexedDB(key, copy.pdfFile);
            uploadDocToCloud(key, copy.pdfFile);
            copy.pdfFile = 'db://' + key;
          }
          if (copy.pdfFileUrl && typeof copy.pdfFileUrl === 'string' && copy.pdfFileUrl.startsWith('data:')) {
            const key = 'pdf_file_dev_' + copy.id;
            saveFileToIndexedDB(key, copy.pdfFileUrl);
            uploadDocToCloud(key, copy.pdfFileUrl);
            copy.pdfFileUrl = 'db://' + key;
          }
          return copy;
        }
        return item;
      });
    }
    return data;
  };

  const lastLocalMutationTimeRef = React.useRef<number>(0);

  const saveState = (key: string, data: any) => {
    lastLocalMutationTimeRef.current = Date.now();
    if (typeof window !== 'undefined') {
      const sanitized = sanitizeDataForStorage(data);
      const jsonStr = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);

      try {
        localStorage.setItem(key, jsonStr);
      } catch (e) {
        console.warn(`localStorage quota exceeded for ${key}, stripping heavy fields for local mirror:`, e);
        try {
          if (Array.isArray(sanitized)) {
            const ultraLight = sanitized.map(item => {
              if (item && typeof item === 'object') {
                const c = { ...item };
                delete c.attachedFileLink;
                delete c.originalFileUrl;
                delete c.pdfFile;
                delete c.pdfFileUrl;
                return c;
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(ultraLight));
          }
        } catch (innerErr) {
          console.error("Secondary localStorage fallback failed:", innerErr);
        }
      }

      saveDirectToYandexDisk({ [key]: sanitized });
    }
  };

  // Real-time Cloud Sync Poller across all devices & computers (polled every 2 sec)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncKeys = [
      'qms_orders', 'qms_quotes', 'qms_production_runs', 'qms_certificates', 
      'qms_measuring_devices', 'qms_incoming', 'qms_outgoing', 'qms_customers',
      'qms_suppliers', 'qms_products', 'qms_capas', 'qms_complaints'
    ];

    let isPollingInProgress = false;

    const pollCloudSync = async () => {
      if (isPollingInProgress) return;
      // Skip poller overwrite only during active local user drag/typing (1.5 second buffer)
      if (Date.now() - lastLocalMutationTimeRef.current < 1500) {
        return;
      }
      isPollingInProgress = true;
      try {
        const store: any = await fetchDirectFromYandexDisk();

        if (store && typeof store === 'object') {
            const cloudDelOrders: string[] = Array.isArray(store.qms_deleted_orders) ? store.qms_deleted_orders : [];
            const cloudDelQuotes: string[] = Array.isArray(store.qms_deleted_quotes) ? store.qms_deleted_quotes : [];
            
            const delOrdersSet = new Set(cloudDelOrders.map(s => String(s).toLowerCase()));
            const delQuotesSet = new Set(cloudDelQuotes.map(s => String(s).toLowerCase()));

            let storeUpdated = false;
            const updatedStore = { ...store };

            for (const key of syncKeys) {
              const cloudData = Array.isArray(store[key]) ? store[key] : null;
              let localItems: any[] = [];
              try {
                const raw = localStorage.getItem(key);
                localItems = raw ? JSON.parse(raw) : [];
              } catch (e) {}

              let cleanCloudPool: any[] = [];

              if (cloudData && cloudData.length > 0) {
                cleanCloudPool = mergeById(localItems, cloudData);
              } else if (localItems && localItems.length > 0) {
                cleanCloudPool = localItems;
              }

              if (cleanCloudPool.length > 0) {
                const jsonStr = JSON.stringify(cleanCloudPool);
                try {
                  localStorage.setItem(key, jsonStr);
                } catch (e) {}

                // Instantly update React state on every PC from authoritative merged store
                if (key === 'qms_orders') setOrders(cleanCloudPool);
                if (key === 'qms_quotes') setQuotes(cleanCloudPool);
                if (key === 'qms_production_runs') setProductionRuns(cleanCloudPool);
                if (key === 'qms_certificates') setCertificates(cleanCloudPool);
                if (key === 'qms_measuring_devices') setMeasuringDevices(cleanCloudPool);
                if (key === 'qms_incoming') setIncomingInspections(cleanCloudPool);
                if (key === 'qms_outgoing') setOutgoingInspections(cleanCloudPool);
                if (key === 'qms_customers') setCustomers(cleanCloudPool);
                if (key === 'qms_suppliers') setSuppliers(cleanCloudPool);
                if (key === 'qms_products') setProducts(cleanCloudPool);
                if (key === 'qms_capas') setCapas(cleanCloudPool);
                if (key === 'qms_complaints') setComplaints(cleanCloudPool);
              }
            }
          }
      } catch (err) {
        // Silent catch
      } finally {
        isPollingInProgress = false;
      }
    };

    pollCloudSync();
    const interval = setInterval(pollCloudSync, 3000);
    return () => clearInterval(interval);
  }, []);

  // Global uppercase CSS styling is handled via Tailwind uppercase classes
  useEffect(() => {
    // Disabled global DOM input mutation listener to prevent 1-2 min typing lag/freezing
  }, []);

  const fetchDbDocuments = async () => {
    try {
      const res = await fetch('/api/QmsDocManagement/definitions');
      if (res.ok) {
        const dbDefs = await res.json();
        const mapped = dbDefs.map((def: any) => {
          const activeRev = def.revisions?.find((r: any) => r.lifecycleState === 'Yururlukte') || def.revisions?.[0];
          return {
            id: def.code,
            title: def.title,
            type: def.type as any,
            revision: activeRev ? activeRev.revisionNumber : 0,
            revisionDate: activeRev ? new Date(activeRev.revisionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            preparedBy: activeRev?.preparedBy || 'Faruk Oruç',
            approvedBy: activeRev?.approvedBy || 'İbrahim Sert',
            status: activeRev ? (activeRev.lifecycleState === 'Yururlukte' ? 'Onaylı' : 'Taslak') : 'Onaylı',
            content: activeRev ? activeRev.content : `# ${def.code} - ${def.title}\n\nİçerik bulunamadı.`,
            relatedDocs: [],
            templateFields: activeRev?.templateFields || [],
            databaseId: def.id,
            revisionId: activeRev?.id,
            history: def.revisions?.map((r: any) => ({
              revision: r.revisionNumber,
              date: new Date(r.revisionDate).toISOString().split('T')[0],
              description: r.revisionDescription || 'Revizyon',
              author: r.preparedBy || 'Faruk Oruç'
            })) || []
          };
        });
        return mapped;
      }
    } catch (err) {
      console.error("Failed to fetch database document definitions:", err);
    }
    return null;
  };

  const [isBackendSyncDone, setIsBackendSyncDone] = useState(false);

  // Sync state from Yandex Disk Cloud API on mount
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        const store: any = await fetchDirectFromYandexDisk();
        if (store && typeof store === 'object') {
          Object.keys(store).forEach((key) => {
            if (store[key] !== undefined && store[key] !== null) {
              try {
                const strVal = typeof store[key] === 'string' ? store[key] : JSON.stringify(store[key]);
                localStorage.setItem(key, strVal);
              } catch (e) {}
            }
          });
        }
      } catch (e) {
        console.error('Yandex Cloud sync error:', e);
      }
      setIsBackendSyncDone(true);
    };

    syncWithBackend();
  }, []);

  // Load from LocalStorage (Permanent SIES Setup - Wizard NEVER pops up on startup)
  useEffect(() => {
    if (!isBackendSyncDone) return;
    try {
      // Always mark setup done so Wizard never shows again
      localStorage.setItem('qms_setup_done', 'true');
      setCompanySetupDone(true);

      const setup = localStorage.getItem('qms_setup_done');
      if (setup === 'true' || setup === '"true"') {
        const defaultSiesCompany = {
          name: "SİES ELEKTRİK MÜH. SAN. TİC. LTD. ŞTİ.",
          logo: "/sies_logo.png",
          address: "Yeşilce Mah. Göktürk Cad. Daim Sok. No: 14 Kağıthane / İstanbul",
          taxOffice: "Zincirlikuyu V.D.",
          taxNumber: "7700342918",
          phone: "0212 324 00 98-99 / 0541 240 80 75",
          email: "hsert@sies.com.tr",
          qualityPolicy: "Müşteri memnuniyetini esas alarak TS EN 61537 standartlarına uygun kaliteli kablo taşıma sistemleri üretmek.",
          qualityObjectives: ["Zamanında Teslimat Oranı %98+", "Müşteri Şikayet Oranı %1 Altı"]
        };

        const savedComp = localStorage.getItem('qms_company');
        if (savedComp && savedComp !== '{}') {
          setCompanyInfo(JSON.parse(savedComp));
        } else {
          setCompanyInfo(defaultSiesCompany);
          localStorage.setItem('qms_company', JSON.stringify(defaultSiesCompany));
        }
        setDepartments(JSON.parse(localStorage.getItem('qms_departments') || '[]'));
        const pers = JSON.parse(localStorage.getItem('qms_personnel') || '[]');
        setPersonnel(pers);
        setPositions(JSON.parse(localStorage.getItem('qms_positions') || '[]'));
        const prods = JSON.parse(localStorage.getItem('qms_products') || '[]');
        setProducts(prods);
        setProcesses(JSON.parse(localStorage.getItem('qms_processes') || '[]'));
        setMachines(JSON.parse(localStorage.getItem('qms_machines') || '[]'));
        setMeasuringDevices(JSON.parse(localStorage.getItem('qms_measuring_devices') || '[]'));
        setSuppliers(JSON.parse(localStorage.getItem('qms_suppliers') || '[]'));
        setCustomers(JSON.parse(localStorage.getItem('qms_customers') || '[]'));
        setMaterials(JSON.parse(localStorage.getItem('qms_materials') || '[]'));
        // Migrate inspections storage from fr35 to fr12 if present
        const oldInspections = localStorage.getItem('qms_fr35_inspections');
        if (oldInspections) {
          localStorage.setItem('qms_fr12_inspections', oldInspections);
          localStorage.removeItem('qms_fr35_inspections');
        }

        // Perform database seed reset if needed or sequential renumbering mapping
        // Run migration once, then preserve user uploads
        if (!localStorage.getItem('qms_devices_migrated_v9')) {
          localStorage.removeItem('qms_measuring_devices');
          localStorage.setItem('qms_devices_migrated_v9', 'true');
        }

        // 2. Migrate existing Base64 files from localStorage to IndexedDB to free up quota
        try {
          const rawDevs = localStorage.getItem('qms_measuring_devices');
          if (rawDevs) {
            const parsedDevs = JSON.parse(rawDevs);
            let migrationHappened = false;
            for (let i = 0; i < parsedDevs.length; i++) {
              const dev = parsedDevs[i];
              if (dev.pdfFileUrl && dev.pdfFileUrl.startsWith('data:')) {
                // Migrate file
                saveFileToIndexedDB('pdf_file_' + dev.id, dev.pdfFileUrl);
                dev.pdfFileUrl = 'db://' + dev.id;
                migrationHappened = true;
              }
            }
            if (migrationHappened) {
              localStorage.setItem('qms_measuring_devices', JSON.stringify(parsedDevs));
              console.log("Successfully migrated existing Base64 files to IndexedDB & cleared localStorage space!");
            }
          }
        } catch (e) {
          console.error("IndexedDB migration check error:", e);
        }
        if (!localStorage.getItem('qms_documents_migrated_v11')) {
          localStorage.removeItem('qms_documents');
          localStorage.setItem('qms_documents_migrated_v11', 'true');
        }

        const rawDocs = localStorage.getItem('qms_documents');
        let loadedDocs = rawDocs ? JSON.parse(rawDocs) : [];

        fetchDbDocuments().then(dbDocs => {
          if (dbDocs && dbDocs.length > 0) {
            const dbIds = new Set(dbDocs.map((d: any) => d.id));
            const customDocs = loadedDocs.filter((d: any) => d && d.id && !dbIds.has(d.id));
            const consolidated = [...dbDocs, ...customDocs];
            localStorage.setItem('qms_documents', JSON.stringify(consolidated));
            setDocuments(consolidated);
          } else {
            const freshDefaultDocs = generateDefaultDocuments(
              JSON.parse(localStorage.getItem('qms_company') || '{}'),
              JSON.parse(localStorage.getItem('qms_departments') || '[]'),
              JSON.parse(localStorage.getItem('qms_personnel') || '[]'),
              JSON.parse(localStorage.getItem('qms_machines') || '[]'),
              JSON.parse(localStorage.getItem('qms_measuring_devices') || '[]'),
              JSON.parse(localStorage.getItem('qms_suppliers') || '[]'),
              JSON.parse(localStorage.getItem('qms_products') || '[]')
            );

            const standardIds = new Set(freshDefaultDocs.map((d: any) => d.id));
            const customDocs = loadedDocs.filter((d: any) => d && d.id && !standardIds.has(d.id));

            const finalDocs = freshDefaultDocs.map((d: any) => {
              const existing = loadedDocs.find((m: any) => m && m.id === d.id);
              if (existing) {
                return {
                  ...d,
                  ...existing,
                  content: existing.content || d.content,
                  title: existing.title || d.title,
                  revision: existing.revision || d.revision,
                  revisionDate: existing.revisionDate || d.revisionDate,
                  status: existing.status || d.status,
                  preparedBy: existing.preparedBy || d.preparedBy,
                  approvedBy: existing.approvedBy || d.approvedBy,
                  controlledBy: existing.controlledBy || d.controlledBy,
                  formNumber: existing.formNumber || d.formNumber,
                };
              }
              return d;
            });

            const consolidated = [...finalDocs, ...customDocs];
            localStorage.setItem('qms_documents', JSON.stringify(consolidated));
            setDocuments(consolidated);
          }
        });

        // Auto-migrate personnel certificates
        let persListMigrated = JSON.parse(localStorage.getItem('qms_personnel') || '[]');
        let persModified = false;
        persListMigrated = persListMigrated.map((p: any) => {
          if (p.name === 'Faruk Oruç' || p.name === 'İbrahim Sert') {
            if (!p.certificates.includes('ISO 9001:2015 İç Tetkikçi')) {
              p.certificates = [...p.certificates, 'ISO 9001:2015 İç Tetkikçi'];
              persModified = true;
            }
          }
          return p;
        });
        if (persModified) {
          localStorage.setItem('qms_personnel', JSON.stringify(persListMigrated));
          setPersonnel(persListMigrated);
        }
        setRisks(JSON.parse(localStorage.getItem('qms_risks') || '[]'));
        setAudits(JSON.parse(localStorage.getItem('qms_audits') || '[]'));
        let loadedCapas = JSON.parse(localStorage.getItem('qms_capas') || '[]');
        const hasDF001 = loadedCapas.some((c: any) => c.id === 'DF-001');
        if (loadedCapas.length === 0 || !hasDF001) {
          const defaultCapas = generateDefaultCapas(pers);
          loadedCapas = [...loadedCapas.filter((c: any) => c.id !== 'DF-001'), ...defaultCapas];
          localStorage.setItem('qms_capas', JSON.stringify(loadedCapas));
        }
        setCapas(loadedCapas);
        setTestReports(JSON.parse(localStorage.getItem('qms_test_reports') || '[]'));
        
        // Auto-migrate incoming inspections if empty/legacy
        const loadedIncoming = JSON.parse(localStorage.getItem('qms_incoming') || '[]');
        if (loadedIncoming.length < 5) {
          // We will resolve the default list in completeSetup, but we can also trigger a temporary reload.
          // Let's force load from the completeSetup template or a static pool.
        }
        setIncomingInspections(loadedIncoming);

        setOutgoingInspections(JSON.parse(localStorage.getItem('qms_outgoing') || '[]'));
        setCalibrationRecords(JSON.parse(localStorage.getItem('qms_calibrations') || '[]'));
        setMaintenanceRecords(JSON.parse(localStorage.getItem('qms_maintenances') || '[]'));
        setTrainingRecords(JSON.parse(localStorage.getItem('qms_trainings') || '[]'));
        setComplaints(JSON.parse(localStorage.getItem('qms_complaints') || '[]'));
        setNonconformities(JSON.parse(localStorage.getItem('qms_nonconformities') || '[]'));
        setManagementReviews(JSON.parse(localStorage.getItem('qms_management_reviews') || '[]'));

        // Load Tombstones (filtering out stale master and test tombstones)
        const rawDelOrders: string[] = JSON.parse(localStorage.getItem('qms_deleted_orders') || '[]');
        const cleanDelOrders = rawDelOrders.filter(id => {
          if (!id || typeof id !== 'string') return false;
          const clean = id.toLowerCase().trim();
          if (clean === '' || clean.startsWith('sies2026') || clean.startsWith('deneme') || clean.startsWith('test-2026')) return false;
          return true;
        });
        try {
          localStorage.setItem('qms_deleted_orders', JSON.stringify(cleanDelOrders));
        } catch (e) {}
        const delOrdersSet = new Set<string>(cleanDelOrders);
        const delQuotesSet = new Set<string>(JSON.parse(localStorage.getItem('qms_deleted_quotes') || '[]'));

        // One-time demo seed marker check
        const hasSeededDemo = localStorage.getItem('qms_seeded_demo_v1') === 'true';

        // Inject Audit Trail Seeding ONLY ONCE if never seeded before
        if (!hasSeededDemo) {
          localStorage.setItem('qms_seeded_demo_v1', 'true');
        }

        // Initialize production runs if not present
        const loadedRuns = JSON.parse(localStorage.getItem('qms_production_runs') || '[]');
        setProductionRuns(loadedRuns);

        // Initialize quotes & orders
        const loadedQuotes = JSON.parse(localStorage.getItem('qms_quotes') || '[]')
          .filter((q: any) => q && q.id && !delQuotesSet.has(q.id));
        setQuotes(loadedQuotes);

        let rawOrders = JSON.parse(localStorage.getItem('qms_orders') || '[]');
        const defaultList = generateDefaultOrders([]);
        const initialMap = new Map<string, any>();
        defaultList.forEach(item => initialMap.set(String(item.id).toLowerCase(), item));
        (Array.isArray(rawOrders) ? rawOrders : []).forEach((o: any) => {
          if (o && o.id && !delOrdersSet.has(o.id)) {
            initialMap.set(String(o.id).toLowerCase(), o);
          }
        });
        let loadedOrders = Array.from(initialMap.values());
        setOrders(loadedOrders);

        const loadedCertificates = JSON.parse(localStorage.getItem('qms_certificates') || '[]');
        setCertificates(loadedCertificates);

        // DATABASE SELF-HEALING: Auto-create missing production runs for active orders
        try {
          const storedOrders = JSON.parse(localStorage.getItem('qms_orders') || '[]');
          const storedRuns = JSON.parse(localStorage.getItem('qms_production_runs') || '[]');
          let runsChanged = false;

          storedOrders.forEach((order: any) => {
            if (order.status === 'Üretimde' || order.status === 'ÜRETİMDE') {
              order.items.forEach((item: any) => {
                if (item.status === 'Üretimde') {
                  const runExists = storedRuns.some((run: any) => 
                    run.orderId === order.id && run.productCode === item.productCode
                  );
                  if (!runExists) {
                    const orderNo = `EMR-2026-${Math.floor(100 + Math.random() * 900)}`;
                    const runId = `PRD-2026-${Math.floor(100 + Math.random() * 900)}`;
                    storedRuns.push({
                      id: runId,
                      productionOrderNo: orderNo,
                      date: order.date || new Date().toISOString().split('T')[0],
                      productCode: item.productCode,
                      quantity: item.quantity,
                      operator: 'Faruk Oruç',
                      pdfFile: `Uretim_Formu_${orderNo}.pdf`,
                      firstCheckStatus: 'Bekliyor',
                      inProcessChecks: [],
                      status: 'İlk Kontrol Bekliyor',
                      notes: 'İmalat Kalemi - Otomatik Kurtarıldı',
                      orderId: order.id
                    });
                    runsChanged = true;
                  }
                }
              });
            }
          });

          if (runsChanged) {
            localStorage.setItem('qms_production_runs', JSON.stringify(storedRuns));
            setProductionRuns(storedRuns);
            console.log("Self-healed missing production runs!");
          }
        } catch (err) {
          console.error("Error running self-healing script:", err);
        }

        // DATABASE SELF-HEALING: Auto-seed requested calibration devices
        try {
          const storedDevices = JSON.parse(localStorage.getItem('qms_measuring_devices') || '[]');
          const requestedDevs = [
            { 
              id: '944SIE01', 
              name: 'Kumpas 150mm', 
              serialNumber: '1506232440', 
              certificateNumber: '0186K-0725-00555', 
              calibrationDate: '2025-07-30', 
              nextCalibrationDate: '2026-07-30', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T250944',
              manufacturer: 'Insize',
              typeModel: '1108-150',
              pageCount: 3,
              inventoryNo: '944SIE01',
              pdfFileUrl: '944SIE01_Kumpas_150mm-555.pdf'
            },
            { 
              id: '944SIE02', 
              name: 'Dış Çap Mikrometre 0-25mm', 
              serialNumber: '130352768', 
              certificateNumber: '0186K-0826-00120', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Insize',
              typeModel: '0-25mm Dış Çap Mikrometre',
              pageCount: 3,
              inventoryNo: '883SIE09'
            },
            { 
              id: '944SIE03', 
              name: 'Şerit Metre 5000mm', 
              serialNumber: 'SIE-SM-02', 
              certificateNumber: '0186K-0826-00123', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Fisco',
              typeModel: 'Uni-Matic II 5000mm',
              pageCount: 3,
              inventoryNo: '883SIE12'
            },
            { 
              id: '944SIE04', 
              name: 'Komparatör Saati', 
              serialNumber: '3A14700', 
              certificateNumber: '0186K-0826-00114', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Insize',
              typeModel: 'JEWELED 10mm 0.01mm',
              pageCount: 3,
              inventoryNo: '944SIE04'
            },
            { 
              id: '944SIE05', 
              name: 'Komparatör Saati', 
              serialNumber: '3803869', 
              certificateNumber: '0186K-0826-00115', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Insize',
              typeModel: 'JEWELED 10mm 0.01mm',
              pageCount: 3,
              inventoryNo: '944SIE05'
            },
            { 
              id: '944SIE06', 
              name: 'Komparatör Saati', 
              serialNumber: '2911867', 
              certificateNumber: '0186K-0826-00116', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Insize',
              typeModel: 'JEWELED 10mm 0.01mm',
              pageCount: 3,
              inventoryNo: '944SIE06'
            },
            { 
              id: '883SIE10', 
              name: 'Komparatör Saati', 
              serialNumber: '1C03867', 
              certificateNumber: '0186K-0826-00121', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Insize',
              typeModel: 'JEWELED 10mm 0.01mm',
              pageCount: 3,
              inventoryNo: '883SIE10'
            },
            { 
              id: '883SIE11', 
              name: 'Komparatör Saati', 
              serialNumber: '8581', 
              certificateNumber: '0186K-0826-00122', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Insize',
              typeModel: 'JEWELED 10mm 0.01mm',
              pageCount: 3,
              inventoryNo: '883SIE11'
            },
            { 
              id: '883SIE13', 
              name: 'Komparatör Saati', 
              serialNumber: '3907473', 
              certificateNumber: '0186K-0826-00124', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Insize',
              typeModel: 'JEWELED 10mm 0.01mm',
              pageCount: 3,
              inventoryNo: '883SIE13'
            },
            { 
              id: '944SIE09', 
              name: 'Kaplama Kalınlık Ölçer', 
              serialNumber: 'SIE-KKO-01', 
              certificateNumber: '0186K-0826-00117', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Enerji Kalibrasyon',
              typeModel: 'Ultrasonik 1000 µm',
              pageCount: 3,
              inventoryNo: '944SIE09'
            },
            { 
              id: '944SIE10', 
              name: 'Kalınlık Folyo Seti (4 adet)', 
              serialNumber: 'SIE-KFS-01', 
              certificateNumber: '0186K-0826-00118', 
              calibrationDate: '2026-06-10', 
              nextCalibrationDate: '2027-06-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Enerji Kalibrasyon',
              typeModel: '4 adet Folyo Seti',
              pageCount: 3,
              inventoryNo: '944SIE10'
            },
            { 
              id: '944SIE11', 
              name: 'Askılı Kantar 50 kg', 
              serialNumber: '001', 
              certificateNumber: '0186K-0826-00112', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Camry',
              typeModel: '50 kg Askılı Kantar',
              pageCount: 3,
              inventoryNo: '883SIE01'
            },
            { 
              id: '944SIE12', 
              name: 'Askılı Kantar 100 kg', 
              serialNumber: '002', 
              certificateNumber: '0186K-0826-00113', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'YLD',
              typeModel: '100 kg Askılı Kantar',
              pageCount: 3,
              inventoryNo: '883SIE02'
            },
            { 
              id: '3763SIE01', 
              name: 'Pensampermetre', 
              serialNumber: 'C232940355', 
              certificateNumber: '0074K-0826-00562', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: '3763',
              manufacturer: 'UNI-T',
              typeModel: 'UT201+',
              pageCount: 6,
              inventoryNo: '3763SIE01'
            },
            { 
              id: '4293SIE01', 
              name: 'Güç Kaynağı', 
              serialNumber: '02376', 
              certificateNumber: '0074K-0926-02376', 
              calibrationDate: '2026-09-22', 
              nextCalibrationDate: '2027-09-22', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: '4293',
              manufacturer: 'UNİKAL',
              typeModel: 'DC Gerilim / AC Akım Güç Kaynağı',
              pageCount: 3,
              inventoryNo: '4293SIE01'
            },
            { 
              id: '1008SIE01', 
              name: 'Terazi 30 kg', 
              serialNumber: '11759', 
              certificateNumber: '0186K-0826-00125', 
              calibrationDate: '2026-08-10', 
              nextCalibrationDate: '2027-08-10', 
              status: 'Kalibre',
              customerName: 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti',
              address: 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul',
              orderNo: 'T260883',
              manufacturer: 'Dikomsan',
              typeModel: 'DS3 30 kg Terazi',
              pageCount: 3,
              inventoryNo: '883SIE14'
            }
          ];

          let devChanged = false;
          requestedDevs.forEach(req => {
            const index = storedDevices.findIndex((d: any) => d.id === req.id || d.certificateNumber === req.certificateNumber || (d.serialNumber && d.serialNumber === req.serialNumber && req.serialNumber !== 'SIE-KKO-01' && req.serialNumber !== 'SIE-KFS-01'));
            if (index >= 0) {
              storedDevices[index] = { ...storedDevices[index], ...req };
              devChanged = true;
            } else {
              storedDevices.push(req);
              devChanged = true;
            }
          });

          if (devChanged) {
            localStorage.setItem('qms_measuring_devices', JSON.stringify(storedDevices));
            setMeasuringDevices(storedDevices);
            console.log("Self-healed calibration devices database!");
          }
          // Initial sync of seeded devices with Calibration Plan doc
          setTimeout(() => {
            syncCalibrationPlanToDms(storedDevices);
          }, 500);

          // Self-heal documents in localStorage to expand short documents to full comprehensive versions
          const rawDocs = localStorage.getItem('qms_documents');
          if (rawDocs) {
            try {
              const parsedDocs = JSON.parse(rawDocs);
              const pr2 = parsedDocs.find((d: any) => d.id === 'PR-002' || d.id === 'PR-05');
              if (pr2 && pr2.content.length < 1000) {
                const freshDocs = generateDefaultDocuments(companyInfo, departments, personnel, machines, measuringDevices, suppliers, products);
                localStorage.setItem('qms_documents', JSON.stringify(freshDocs));
                setDocuments(freshDocs);
                console.log("Self-healed qms_documents to full 30-section comprehensive version!");
              }
            } catch (err) {
              console.error("Error self-healing qms_documents:", err);
            }
          }
        } catch (err) {
          console.error("Error seeding calibration devices:", err);
        }
      }
    } catch (e) {
      console.error('Error loading QMS localStorage state:', e);
    }
    setIsLoaded(true);
  }, [isBackendSyncDone]);

  // Save changes wrapper uses outer saveState with real-time cloud API sync

  // Complete Onboarding Setup & Generate all initial documents
  const completeSetup = (
    info: CompanyInfo,
    deps: Department[],
    pers: Personnel[],
    prods: Product[],
    procs: Process[],
    machs: Machine[],
    devices: MeasuringDevice[],
    sups: Supplier[],
    custs: Customer[]
  ) => {
    const defaultPositions = Array.from(new Set(pers.map(p => p.position).filter(Boolean)));
    
    setCompanyInfo(info);
    setDepartments(deps);
    setPersonnel(pers);
    setPositions(defaultPositions);
    setProducts(prods);
    setProcesses(procs);
    setMachines(machs);
    setMeasuringDevices(devices);
    setSuppliers(sups);
    setCustomers(custs);
    
    saveState('qms_company', info);
    saveState('qms_departments', deps);
    saveState('qms_personnel', pers);
    saveState('qms_positions', defaultPositions);
    saveState('qms_products', prods);
    saveState('qms_processes', procs);
    saveState('qms_machines', machs);
    saveState('qms_measuring_devices', devices);
    saveState('qms_suppliers', sups);
    saveState('qms_customers', custs);

    // Auto-generate standard compliant documents
    const initialDocs = generateDefaultDocuments(info, deps, pers, machs, devices, sups, prods);
    setDocuments(initialDocs);
    saveState('qms_documents', initialDocs);

    // Auto-generate initial risks, audits, trainings
    const initialRisks = generateDefaultRisks(procs);
    setRisks(initialRisks);
    saveState('qms_risks', initialRisks);

    const initialAudits = generateDefaultAudits(pers);
    setAudits(initialAudits);
    saveState('qms_audits', initialAudits);
    const initialCapas = generateDefaultCapas(pers);
    setCapas(initialCapas);
    saveState('qms_capas', initialCapas);

    const initialTrainings = generateDefaultTrainings(pers);
    setTrainingRecords(initialTrainings);
    saveState('qms_trainings', initialTrainings);

    // Auto-generate SIES compliant test reports
    const defaultReports: TestReport[] = [
      {
        id: 'TR-001',
        testType: 'Mekanik Yük',
        productCode: prods[0]?.code || 'S 25H',
        testDate: new Date().toISOString().split('T')[0],
        testDevice: 'Mekanik Güvenli Çalışma Yükü (SWL) Test Standı',
        calibrationCertificate: 'CAL-2026-089',
        operator: pers[0]?.name || 'Faruk Oruç',
        instructionId: 'TL-001',
        acceptanceCriteria: 'TS EN 61537 Madde 10.4 uyarınca, uygulanan güvenli çalışma yükü (SWL) altında sehim miktarı L/100 açıklık oranını geçmemelidir. Yapısal kırılma, çatlak veya kalıcı deformasyon oluşmamalıdır.',
        resultsJson: JSON.stringify({
          appliedLoadKgM: 150,
          supportSpanM: 2.0,
          measuredDeflectionMm: 12,
          allowableDeflectionMm: 20
        }),
        status: 'Geçti',
        notes: 'Mekanik yük testi başarıyla tamamlanmıştır. Sehim limiti L/100 = 20mm olup, ölçülen değer 12mm ile kabul kriterinin altındadır.'
      },
      {
        id: 'TR-002',
        testType: 'Elektriksel Süreklilik',
        productCode: prods[0]?.code || 'S 25H',
        testDate: new Date().toISOString().split('T')[0],
        testDevice: 'Mikro-ohm Metre (Milli-ohmölçer)',
        calibrationCertificate: 'CAL-2026-112',
        operator: pers[0]?.name || 'Faruk Oruç',
        instructionId: 'TL-005',
        acceptanceCriteria: 'TS EN 61537 Madde 11.1 uyarınca, kablo tavaları ve ekleme elemanları arasındaki elektriksel direnç 50 mΩ (miliohm) değerini aşmamalıdır.',
        resultsJson: JSON.stringify({
          resistanceMilliOhm: 1.8,
          connectionLengthMm: 500,
          limitMilliOhm: 50
        }),
        status: 'Geçti',
        notes: 'Elektriksel süreklilik testi yapılmıştır. Ölçülen birleşim noktası geçiş direnci 1.8 mΩ olup, 50 mΩ limitinin çok altındadır.'
      },
      {
        id: 'TR-003',
        testType: 'Korozyon Direnci',
        productCode: prods[0]?.code || 'S 25H',
        testDate: new Date().toISOString().split('T')[0],
        testDevice: 'Tuz Testi Kabini',
        calibrationCertificate: 'CAL-2026-014',
        operator: pers[0]?.name || 'Faruk Oruç',
        instructionId: 'PR-007',
        acceptanceCriteria: 'TS EN 61537 Madde 11.2 uyarınca tuz püskürtme testi sonrasında yüzeyde kırmızı paslanma görülmemeli ve korozyon direnci sınıfı Sınıf 6 (min 240 saat) gereksinimlerini sağlamalıdır.',
        resultsJson: JSON.stringify({
          saltSprayHours: 240,
          corrosionDetected: 'Hayır',
          corrosionClass: 6
        }),
        status: 'Geçti',
        notes: '240 saatlik tuz püskürtme testi uygulanmıştır. Numunede kırmızı pas veya deformasyon gözlenmemiştir. Sınıf 6 uygundur.'
      }
    ];
    setTestReports(defaultReports);
    saveState('qms_test_reports', defaultReports);

    // Auto-generate SIES compliant incoming inspections matching the FR 17 screenshot
    const defaultIncoming: IncomingInspection[] = [
      {
        id: 'GI-001',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2023000000909',
        deliveryDate: '2024-01-02',
        materialName: '304S 1,50 1500 3000 2B P',
        pdfFile: 'Irsaliye_GIR2023000000909.pdf',
        measuredValue: '1,50x1500x3000',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 324,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '304 Kalite paslanmaz sac levha boyut ve yüzey kontrolleri uygun bulunmuştur.'
      },
      {
        id: 'GI-002',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2023000000909',
        deliveryDate: '2024-01-02',
        materialName: '304S 2,00 1020 2000 2B P',
        pdfFile: 'Irsaliye_GIR2023000000909.pdf',
        measuredValue: '2,00x1020x2000',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 96,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '304 Kalite paslanmaz sac levha.'
      },
      {
        id: 'GI-003',
        supplierId: 'VAMETAŞ YASSI METAL',
        deliveryNoteNo: 'YER2024000000127',
        deliveryDate: '2024-01-04',
        materialName: '1.80X1250X2400',
        pdfFile: 'Irsaliye_YER2024000000127.pdf',
        measuredValue: '1,80X1250X2400',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 5080,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'Sac levha ebatları kumpas ve şerit metreyle kontrol edildi.'
      },
      {
        id: 'GI-004',
        supplierId: 'VAMETAŞ YASSI METAL',
        deliveryNoteNo: 'YER2024000000127',
        deliveryDate: '2024-01-04',
        materialName: '1.35X1200X2400',
        pdfFile: 'Irsaliye_YER2024000000127.pdf',
        measuredValue: '1,35X1200X2400',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 5300,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'Sac levha ebatları.'
      },
      {
        id: 'GI-005',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2024000000060',
        deliveryDate: '2024-01-09',
        materialName: '316S 4,00 1000 2000 2B P',
        pdfFile: 'Irsaliye_GIR2024000000060.pdf',
        measuredValue: '4,00x1000x2000',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 256,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '316 Kalite paslanmaz sac levha.'
      },
      {
        id: 'GI-006',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2024000000060',
        deliveryDate: '2024-01-09',
        materialName: '316S 4,00 1000 2040 2B P',
        pdfFile: 'Irsaliye_GIR2024000000060.pdf',
        measuredValue: '4,00x1000x2040',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 128,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '316 Kalite paslanmaz sac levha.'
      },
      {
        id: 'GI-007',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2024000000060',
        deliveryDate: '2024-01-09',
        materialName: '316S 1,50 1250 2500 2B P',
        pdfFile: 'Irsaliye_GIR2024000000060.pdf',
        measuredValue: '1,50x1250x2500',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 75,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '316 Kalite paslanmaz sac levha.'
      },
      {
        id: 'GI-008',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2024000000060',
        deliveryDate: '2024-01-09',
        materialName: '304S 1,00 1030 2000 2B P',
        pdfFile: 'Irsaliye_GIR2024000000060.pdf',
        measuredValue: '1,00x1030x2000',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 32,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '304 Kalite paslanmaz sac levha.'
      },
      {
        id: 'GI-009',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2024000000060',
        deliveryDate: '2024-01-09',
        materialName: '316S 4,00 1500 3000 2B P',
        pdfFile: 'Irsaliye_GIR2024000000060.pdf',
        measuredValue: '4,00x1500x3000',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 144,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '316 Kalite paslanmaz sac levha.'
      },
      {
        id: 'GI-010',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2024000000060',
        deliveryDate: '2024-01-09',
        materialName: '304ÇB 4,00 4 2,55 P',
        pdfFile: 'Irsaliye_GIR2024000000060.pdf',
        measuredValue: 'ÇAP 4 MM PASLANMAZ ÇUBUK',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 2010,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '304 Kalite paslanmaz çubuk demir.'
      },
      {
        id: 'GI-011',
        supplierId: 'ÇAĞ ÇELİK',
        deliveryNoteNo: 'KRB2024000000289',
        deliveryDate: '2024-01-10',
        materialName: '40X4,8.5235JR.6,0MT',
        pdfFile: 'Irsaliye_KRB2024000000289.pdf',
        measuredValue: '40X4.8X6',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 26900,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'Lama demir ebatları kontrol edildi.'
      },
      {
        id: 'GI-012',
        supplierId: 'VAMETAŞ YASSI METAL',
        deliveryNoteNo: 'YER2024000000346',
        deliveryDate: '2024-01-10',
        materialName: '0.80X0195XR',
        pdfFile: 'Irsaliye_YER2024000000346.pdf',
        measuredValue: '0,80X195',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: '10-15 MİKRON',
        miktarKg: 4588,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'Rulo galvanizli sac kalınlık ve galvaniz kaplama mikron testi uygun.'
      },
      {
        id: 'GI-013',
        supplierId: 'VAMETAŞ YASSI METAL',
        deliveryNoteNo: 'YER2024000000346',
        deliveryDate: '2024-01-10',
        materialName: '0.80X0145XR',
        pdfFile: 'Irsaliye_YER2024000000346.pdf',
        measuredValue: '0,80X145',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: '10-15 MİKRON',
        miktarKg: 1592,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'Rulo galvanizli sac.'
      },
      {
        id: 'GI-014',
        supplierId: 'VAMETAŞ YASSI METAL',
        deliveryNoteNo: 'YER2024000000346',
        deliveryDate: '2024-01-10',
        materialName: '0.90X1200X2400',
        pdfFile: 'Irsaliye_YER2024000000346.pdf',
        measuredValue: '0,90x1200x2400',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: '10-15 MİKRON',
        miktarKg: 4980,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'Galvanizli sac levha mikron ve boyut kontrolü.'
      },
      {
        id: 'GI-015',
        supplierId: 'VAMETAŞ YASSI METAL',
        deliveryNoteNo: 'YER2024000000472',
        deliveryDate: '2024-01-13',
        materialName: '0.80X1200X2400',
        pdfFile: 'Irsaliye_YER2024000000472.pdf',
        measuredValue: '0,80x1200x2400',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: '10-15 MİKRON',
        miktarKg: 5460,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'Levha sac galvaniz mikron kalınlığı elcometer cihazı ile ölçüldü.'
      },
      {
        id: 'GI-016',
        supplierId: 'GÜVEN PASLANMAZ',
        deliveryNoteNo: 'GIR2024000000139',
        deliveryDate: '2024-01-16',
        materialName: '304S 1,20 1550 3000 2B P',
        pdfFile: 'Irsaliye_GIR2024000000139.pdf',
        measuredValue: '1,20x1550x3000',
        boyutKontrolu: true,
        gozleElle: true,
        kaplamaMikron: 'YOK',
        miktarKg: 86,
        miktarPlaka: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '304 Kalite paslanmaz sac.'
      }    ];
    setIncomingInspections(defaultIncoming);
    saveState('qms_incoming', defaultIncoming);

    // Auto-generate SIES compliant outgoing inspections matching FR 12 screenshot
    const defaultOutgoing: OutgoingInspection[] = [
      {
        id: 'SK-001',
        customerId: 'ANUŞ ELEKTRİK KEREM ANUŞ',
        dispatchNoteNo: 'SE12024000000058',
        dispatchDate: '2024-05-27',
        productCode: 'BB 8X15',
        quantityMetres: 100,
        thicknessMm: 0,
        widthMm: 0,
        measuredCoatingMicron: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'BOMBE BAŞLI CIVATA - M8x15 MM. Kumpas ile kontrol edildi. Kaplama Cinsi: TS 822 PREG. Kaplama Kalınlığı: 5-10 M.'
      },
      {
        id: 'SK-002',
        customerId: 'ANUŞ ELEKTRİK KEREM ANUŞ',
        dispatchNoteNo: 'SE12024000000058',
        dispatchDate: '2024-05-27',
        productCode: 'MBF',
        quantityMetres: 100,
        thicknessMm: 0,
        widthMm: 0,
        measuredCoatingMicron: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'FLANŞLI SOMUN - M8. Kumpas ile kontrol edildi. Kaplama Cinsi: TS 822 PREG. Kaplama Kalınlığı: 5-10 M.'
      },
      {
        id: 'SK-003',
        customerId: 'ANUŞ ELEKTRİK KEREM ANUŞ',
        dispatchNoteNo: 'SE12024000000058',
        dispatchDate: '2024-05-27',
        productCode: 'SU 10/P',
        quantityMetres: 5,
        thicknessMm: 0.80,
        widthMm: 100,
        measuredCoatingMicron: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: '304 KALİTE ÜNİVERSAL KABLO KANALI - 100x40x0.80 MM. Şerit metre, kumpas ve mikrometre kullanıldı. Elektriksel süreklilik testi onaylandı.'
      },
      {
        id: 'SK-004',
        customerId: 'TİNAZ ELEKTRONİK TİC.LTD.ŞTİ.',
        dispatchNoteNo: 'SE12024000000059',
        dispatchDate: '2024-05-31',
        productCode: 'SU 20',
        quantityMetres: 24,
        thicknessMm: 0.90,
        widthMm: 200,
        measuredCoatingMicron: 12,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'UNIVERSAL TİP K.KANALI - 200x40x0.90 MM. Ölçüm aletleri: Şerit metre, kumpas, mikrometre. Kaplama Cinsi: TS 822 PREG. Kaplama Kalınlığı: 10-15 M.'
      },
      {
        id: 'SK-005',
        customerId: 'TİNAZ ELEKTRONİK TİC.LTD.ŞTİ.',
        dispatchNoteNo: 'SE12024000000059',
        dispatchDate: '2024-05-31',
        productCode: 'S2',
        quantityMetres: 30,
        thicknessMm: 0,
        widthMm: 0,
        measuredCoatingMicron: 0,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        notes: 'BİRLEŞTİRME PARÇASI.'
      }
    ];
    setOutgoingInspections(defaultOutgoing);
    saveState('qms_outgoing', defaultOutgoing);

    // Auto-generate SIES production runs
    const defaultRuns = generateDefaultProductionRuns(pers, prods);
    setProductionRuns(defaultRuns);
    saveState('qms_production_runs', defaultRuns);

    const defaultQuotes = generateDefaultQuotes(prods);
    setQuotes(defaultQuotes);
    saveState('qms_quotes', defaultQuotes);

    const defaultOrders = generateDefaultOrders(prods);
    setOrders(defaultOrders);
    saveState('qms_orders', defaultOrders);

    setCertificates([]);
    saveState('qms_certificates', []);

    setCompanySetupDone(true);
    saveState('qms_setup_done', 'true');
  };

  // CRUD & Actions
  const addDocument = (doc: Omit<QmsDocument, 'history'>) => {
    const newDoc: QmsDocument = {
      ...doc,
      controlledBy: doc.controlledBy || "Faruk Oruç (Kalite Temsilcisi)",
      formNumber: doc.type === 'FR' ? doc.id : undefined,
      history: [{ revision: doc.revision, date: doc.revisionDate, description: 'İlk yayın', author: doc.preparedBy }]
    };
    const updated = [...documents, newDoc];
    setDocuments(updated);
    saveState('qms_documents', updated);
  };

  const updateDocument = (id: string, updates: Partial<QmsDocument>) => {
    const updated = documents.map(d => {
      if (d.id === id) {
        const hist = [...d.history];
        if (updates.revision && updates.revision !== d.revision) {
          hist.push({
            revision: updates.revision,
            date: updates.revisionDate || new Date().toISOString().split('T')[0],
            description: updates.content !== d.content ? 'Doküman içeriği güncellendi' : 'Revizyon yükseltildi',
            author: updates.preparedBy || d.preparedBy
          });
        }
        return { ...d, ...updates, history: hist };
      }
      return d;
    });
    setDocuments(updated);
    saveState('qms_documents', updated);
  };

  const addPersonnel = (p: Personnel) => {
    const updated = [...personnel, p];
    setPersonnel(updated);
    saveState('qms_personnel', updated);
  };

  const addProduct = (p: Product) => {
    const updated = [...products, p];
    setProducts(updated);
    saveState('qms_products', updated);
  };

  const addMachine = (m: Machine) => {
    const updated = [...machines, m];
    setMachines(updated);
    saveState('qms_machines', updated);
  };

  const syncCalibrationPlanToDms = (devices: MeasuringDevice[]) => {
    const date = new Date().toISOString().split('T')[0];
    let tableLines = [
      "# KR-005 Cihaz Kalibrasyon Planı ve Takip Tablosu",
      "",
      "Sies Elektrik bünyesinde kullanılan tüm izleme, ölçme ve muayene cihazlarının yıllık kalibrasyon planlaması ve en son gerçekleştirilen kalibrasyon vadesi takip listesidir. Bu plan ISO 9001:2015 Kalite Yönetim Sistemi 7.1.5 İzleme ve Ölçme Kaynakları maddesi gereğince güncel tutulmaktadır.",
      "",
      "| Envanter No | Cihaz Adı | Seri No | Son Kalibrasyon | Gelecek Kalibrasyon (Vade) | Sertifika No | Durum |",
      "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
    ];
    
    devices.forEach(d => {
      tableLines.push(`| **${d.id}** | ${d.name} | \`${d.serialNumber}\` | ${d.calibrationDate} | **${d.nextCalibrationDate}** | \`${d.certificateNumber}\` | ${d.status === 'Kalibre' ? '🟢 Kalibre' : '🔴 Süresi Geçmiş'} |`);
    });
    
    const markdownContent = tableLines.join('\n');
    
    setDocuments(prev => {
      const updated = prev.map(doc => doc.id === 'KR-005' ? { ...doc, content: markdownContent, revisionDate: date } : doc);
      saveState('qms_documents', updated);
      return updated;
    });
  };

  const addMeasuringDevice = (d: MeasuringDevice) => {
    const updated = [...measuringDevices, d];
    setMeasuringDevices(updated);
    saveState('qms_measuring_devices', updated);
    syncCalibrationPlanToDms(updated);
  };

  const updateMeasuringDevice = (id: string, updates: Partial<MeasuringDevice>) => {
    setMeasuringDevices(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, ...updates } : d);
      saveState('qms_measuring_devices', updated);
      syncCalibrationPlanToDms(updated);
      return updated;
    });
  };

  const addRisk = (r: RiskOpportunity) => {
    const updated = [...risks, r];
    setRisks(updated);
    saveState('qms_risks', updated);
  };

  const addCapa = (c: CAPA) => {
    const updated = [...capas, c];
    setCapas(updated);
    saveState('qms_capas', updated);
  };

  const addAudit = (a: Audit) => {
    const updated = [...audits, a];
    setAudits(updated);
    saveState('qms_audits', updated);
  };

  const addTestReport = (t: TestReport) => {
    const updated = [...testReports, t];
    setTestReports(updated);
    saveState('qms_test_reports', updated);
  };

  const addIncomingInspection = (i: IncomingInspection) => {
    const updated = [...incomingInspections, i];
    setIncomingInspections(updated);
    saveState('qms_incoming', updated);
  };

  const addOutgoingInspection = (o: OutgoingInspection) => {
    const updated = [...outgoingInspections, o];
    setOutgoingInspections(updated);
    saveState('qms_outgoing', updated);
  };

  const addSupplier = (s: Supplier) => {
    const updated = [...suppliers, s];
    setSuppliers(updated);
    saveState('qms_suppliers', updated);
  };

  const addCustomer = (c: Customer) => {
    setCustomers(prev => {
      const exists = prev.some(existing => existing.id === c.id || existing.name.toUpperCase().trim() === c.name.toUpperCase().trim());
      if (exists) return prev;
      const updated = [...prev, c];
      saveState('qms_customers', updated);
      return updated;
    });
  };

  const addComplaint = (c: CustomerComplaint) => {
    const updated = [...complaints, c];
    setComplaints(updated);
    saveState('qms_complaints', updated);
  };

  const addNonconformity = (n: Nonconformity) => {
    const updated = [...nonconformities, n];
    setNonconformities(updated);
    saveState('qms_nonconformities', updated);
  };

  const addManagementReview = (m: ManagementReview) => {
    const updated = [...managementReviews, m];
    setManagementReviews(updated);
    saveState('qms_management_reviews', updated);
  };

  const addTrainingRecord = (t: TrainingRecord) => {
    const updated = [...trainingRecords, t];
    setTrainingRecords(updated);
    saveState('qms_trainings', updated);
  };

  const addCalibrationRecord = (c: CalibrationRecord) => {
    const updated = [...calibrationRecords, c];
    setCalibrationRecords(updated);
    saveState('qms_calibrations', updated);
  };

  const addMaintenanceRecord = (m: MaintenanceRecord) => {
    const updated = [...maintenanceRecords, m];
    setMaintenanceRecords(updated);
    saveState('qms_maintenances', updated);
  };

  const addProductionRun = (run: ProductionRun) => {
    setProductionRuns(prev => {
      const updated = [...prev, run];
      saveState('qms_production_runs', updated);
      return updated;
    });
  };
  
  const updateProductionRun = (id: string, updates: Partial<ProductionRun>) => {
    const updated = productionRuns.map(r => r.id === id ? { ...r, ...updates } : r);
    setProductionRuns(updated);
    saveState('qms_production_runs', updated);
  };

  const addQuote = (q: Quote) => {
    const updated = [...quotes, q];
    setQuotes(updated);
    saveState('qms_quotes', updated);
  };
  
  const updateQuote = (id: string, updates: Partial<Quote>) => {
    const updated = quotes.map(q => q.id === id ? { ...q, ...updates } : q);
    setQuotes(updated);
    saveState('qms_quotes', updated);
  };

  const deleteQuote = (id: string) => {
    const updated = quotes.filter(q => q && q.id !== id && q.id?.toLowerCase() !== id.toLowerCase());
    setQuotes(updated);

    try {
      localStorage.setItem('qms_quotes', JSON.stringify(updated));
    } catch (e) {}

    fetch(`/api/sync?t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ key: 'qms_quotes', data: updated, isDirectSave: true })
    }).catch(() => null);
  };

  const addOrder = (o: Order) => {
    lastLocalMutationTimeRef.current = Date.now();
    const userStr = currentUser ? `${currentUser.name} (${currentUser.role})` : 'İbrahim Sert (Genel Müdür)';
    const nowStr = new Date().toLocaleString('tr-TR');
    const nowTs = Date.now();

    const orderWithAudit: Order = {
      ...o,
      updatedAt: (o as any).updatedAt || nowTs,
      createdBy: o.createdBy || userStr,
      createdDate: o.createdDate || nowStr,
      history: o.history && o.history.length > 0 ? o.history : [
        {
          id: 'hist-init-' + nowTs,
          action: 'SİPARİŞ OLUŞTURULDU',
          performedBy: userStr,
          timestamp: nowStr,
          details: `${(o.items || []).length} Kalem Sipariş Yüklendi`
        }
      ]
    };

    const updated = [orderWithAudit, ...orders.filter(existing => existing && existing.id !== orderWithAudit.id)];
    setOrders(updated);

    // CRITICAL: Immediately un-tombstone / remove new order ID & customerOrderNo from qms_deleted_orders!
    const targetId = (orderWithAudit.id || '').trim().toLowerCase();
    const targetNo = (orderWithAudit.customerOrderNo || '').trim().toLowerCase();

    let deletedOrders: string[] = [];
    try {
      deletedOrders = JSON.parse(localStorage.getItem('qms_deleted_orders') || '[]');
    } catch (e) {}

    const cleanedDeleted = deletedOrders.filter(s => {
      if (!s || typeof s !== 'string') return false;
      const clean = s.trim().toLowerCase();
      if (clean === '') return false;
      if (targetId !== '' && clean === targetId) return false;
      if (targetNo !== '' && clean === targetNo) return false;
      return true;
    });

    try {
      localStorage.setItem('qms_deleted_orders', JSON.stringify(cleanedDeleted));
    } catch (e) {}

    saveState('qms_orders', updated);

    // Clean deleted_orders tombstones in cloud
    fetch(`/api/sync?t=${nowTs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ key: 'qms_deleted_orders', data: cleanedDeleted })
    }).catch(() => null);

    // Direct authoritative save to cloud endpoint so poller never overwrites new order
    fetch(`/api/sync?t=${nowTs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ key: 'qms_orders', data: updated, isDirectSave: true })
    }).catch(() => null);

  };
  
  const updateOrder = (id: string, updates: Partial<Order>) => {
    lastLocalMutationTimeRef.current = Date.now();
    const nowTs = Date.now();
    const updated = orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: nowTs } : o);
    setOrders(updated);
    saveState('qms_orders', updated);

    fetch(`/api/sync?t=${nowTs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ key: 'qms_orders', data: updated, isDirectSave: true })
    }).catch(() => null);
  };

  const deleteOrder = (id: string) => {
    lastLocalMutationTimeRef.current = Date.now();
    const targetOrder = orders.find(o => 
      o && (
        o.id === id || 
        o.id.toLowerCase() === id.toLowerCase() ||
        (o.customerOrderNo && o.customerOrderNo.toLowerCase() === id.toLowerCase())
      )
    );
    const targetId = targetOrder ? targetOrder.id : id;
    const targetCustomerNo = targetOrder ? targetOrder.customerOrderNo : '';

    const updated = orders.filter(o => {
      if (!o) return false;
      const oId = String(o.id || '').trim().toLowerCase();
      const oNo = String(o.customerOrderNo || '').trim().toLowerCase();
      const tId = String(targetId || '').trim().toLowerCase();
      const tNo = String(targetCustomerNo || '').trim().toLowerCase();
      const reqId = String(id || '').trim().toLowerCase();

      if (tId !== '' && (oId === tId || oId === reqId)) return false;
      if (tNo !== '' && oNo === tNo) return false;
      if (reqId !== '' && oNo === reqId) return false;
      return true;
    });

    setOrders(updated);
    saveState('qms_orders', updated);

    try {
      localStorage.setItem('qms_orders', JSON.stringify(updated));
    } catch (e) {}

    // Record tombstone IDs in local storage & cloud to propagate deletion across all devices
    let deletedOrders: string[] = [];
    try {
      deletedOrders = JSON.parse(localStorage.getItem('qms_deleted_orders') || '[]');
    } catch (e) {}

    deletedOrders = deletedOrders.filter(s => s && typeof s === 'string' && s.trim() !== '');

    const tIdClean = String(targetId || '').trim().toLowerCase();
    const tNoClean = String(targetCustomerNo || '').trim().toLowerCase();

    if (tIdClean !== '' && !deletedOrders.includes(tIdClean)) {
      deletedOrders.push(tIdClean);
    }
    if (tNoClean !== '' && !deletedOrders.includes(tNoClean)) {
      deletedOrders.push(tNoClean);
    }

    try {
      localStorage.setItem('qms_deleted_orders', JSON.stringify(deletedOrders));
    } catch (e) {}

    fetch(`/api/sync?t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ key: 'qms_deleted_orders', data: deletedOrders })
    }).catch(() => null);

    fetch(`/api/sync?t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ key: 'qms_orders', data: updated, isDirectSave: true })
    }).catch(() => null);
  };

  const addCertificate = (c: InspectionCertificate) => {
    const updated = [...certificates, c];
    setCertificates(updated);
    saveState('qms_certificates', updated);
  };

  const resetAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      // Clear backend database states as well
      const keysToClear = [
        'qms_setup_done', 'qms_company', 'qms_departments', 'qms_personnel', 'qms_positions',
        'qms_products', 'qms_processes', 'qms_machines', 'qms_measuring_devices', 'qms_suppliers',
        'qms_customers', 'qms_materials', 'qms_documents', 'qms_risks', 'qms_audits', 'qms_capas',
        'qms_test_reports', 'qms_incoming', 'qms_outgoing', 'qms_calibrations', 'qms_maintenances',
        'qms_trainings', 'qms_complaints', 'qms_nonconformities', 'qms_management_reviews',
        'qms_production_runs', 'qms_quotes', 'qms_orders', 'qms_certificates'
      ];
      keysToClear.forEach(key => {
        fetch(`/api/State/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: key === 'qms_setup_done' ? 'false' : '[]' })
        }).catch(err => console.error(err));
      });
    }
    setCompanySetupDone(false);
    setCompanyInfo({
      name: '', logo: '', address: '', taxOffice: '', taxNumber: '', phone: '', email: '',
      qualityPolicy: '', qualityObjectives: []
    });
    setDepartments([]);
    setPersonnel([]);
    setPositions([]);
    setProducts([]);
    setProcesses([]);
    setMachines([]);
    setMeasuringDevices([]);
    setSuppliers([]);
    setCustomers([]);
    setMaterials([]);
    setDocuments([]);
    setRisks([]);
    setAudits([]);
    setCapas([]);
    setTestReports([]);
    setIncomingInspections([]);
    setOutgoingInspections([]);
    setCalibrationRecords([]);
    setMaintenanceRecords([]);
    setTrainingRecords([]);
    setComplaints([]);
    setNonconformities([]);
    setManagementReviews([]);
    setQuotes([]);
    setOrders([]);
    setProductionRuns([]);
  };

  const clearTransactionData = () => {
    setQuotes([]);
    setOrders([]);
    setProductionRuns([]);
    setCertificates([]);
    setIncomingInspections([]);
    setOutgoingInspections([]);
    setTestReports([]);
    
    saveState('qms_quotes', []);
    saveState('qms_orders', []);
    saveState('qms_production_runs', []);
    saveState('qms_certificates', []);
    saveState('qms_incoming', []);
    saveState('qms_outgoing', []);
    saveState('qms_test_reports', []);
  };

  const forceSyncCloud = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    try {
      lastLocalMutationTimeRef.current = 0;
      let store: any = null;
      const res = await fetch(`/api/sync?t=${Date.now()}`, { cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        const body = await res.json().catch(() => null);
        store = body?.store;
      }
      if (!store || typeof store !== 'object') {
        store = await fetchDirectFromYandexDisk();
      }
      if (store && typeof store === 'object') {
          const cloudDelOrders: string[] = Array.isArray(store.qms_deleted_orders) ? store.qms_deleted_orders : [];
          const delOrdersSet = new Set(cloudDelOrders.map(s => String(s).toLowerCase()));

          const syncKeys = [
            'qms_orders', 'qms_quotes', 'qms_production_runs', 'qms_certificates', 
            'qms_measuring_devices', 'qms_incoming', 'qms_outgoing', 'qms_customers',
            'qms_suppliers', 'qms_products', 'qms_capas', 'qms_complaints'
          ];

          for (const key of syncKeys) {
            const cloudData = store[key];
            if (Array.isArray(cloudData)) {
              let cleanPool: any[] = [];
              if (key === 'qms_orders') {
                const fetchedOrders = cloudData.filter(o => o && o.id);
                const defaultList = generateDefaultOrders([]);
                const poolMap = new Map<string, any>();
                defaultList.forEach(item => poolMap.set(String(item.id).toLowerCase(), item));
                fetchedOrders.forEach(item => poolMap.set(String(item.id).toLowerCase(), item));
                cleanPool = Array.from(poolMap.values());
              } else {
                cleanPool = cloudData.filter(item => item && item.id);
              }

              if (key === 'qms_orders') {
                setOrders(cleanPool);
                try {
                  localStorage.setItem('qms_orders', JSON.stringify(cleanPool));
                } catch (e) {}
              } else {
                localStorage.setItem(key, JSON.stringify(cleanPool));
              }
              if (key === 'qms_quotes') setQuotes(cleanPool);
              if (key === 'qms_production_runs') setProductionRuns(cleanPool);
              if (key === 'qms_certificates') setCertificates(cleanPool);
              if (key === 'qms_measuring_devices') setMeasuringDevices(cleanPool);
              if (key === 'qms_incoming') setIncomingInspections(cleanPool);
              if (key === 'qms_outgoing') setOutgoingInspections(cleanPool);
              if (key === 'qms_customers') setCustomers(cleanPool);
              if (key === 'qms_suppliers') setSuppliers(cleanPool);
              if (key === 'qms_products') setProducts(cleanPool);
              if (key === 'qms_capas') setCapas(cleanPool);
              if (key === 'qms_complaints') setComplaints(cleanPool);
            }
          }
        }
      return true;
    } catch (err) {
      return false;
    }
  };

  // Instant 2.5s Real-Time Cloud Poller & Window Focus Sync
  useEffect(() => {
    if (!isLoaded) return;

    forceSyncCloud();

    const interval = setInterval(() => {
      forceSyncCloud();
    }, 2500);

    const handleFocus = () => {
      forceSyncCloud();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLoaded]);

  return (
    <QmsContext.Provider
      value={{
        companySetupDone,
        companyInfo,
        departments,
        personnel,
        positions,
        products,
        processes,
        machines,
        measuringDevices,
        suppliers,
        customers,
        materials,
        documents,
        risks,
        audits,
        capas,
        testReports,
        incomingInspections,
        outgoingInspections,
        calibrationRecords,
        maintenanceRecords,
        trainingRecords,
        complaints,
        nonconformities,
        managementReviews,
        productionRuns,
        quotes,
        orders,
        certificates,
        activeCategoryTab,
        setActiveCategoryTab,
        showCreateOrderWizard,
        setShowCreateOrderWizard,
        orderSearchQuery,
        setOrderSearchQuery,
        forceSyncCloud,
        getFileFromIndexedDB,
        resolveDocumentUrl,
        
        completeSetup,
        addProductionRun,
        updateProductionRun,
        addQuote,
        updateQuote,
        deleteQuote,
        addOrder,
        updateOrder,
        deleteOrder,
        addCertificate,
        addDocument,
        updateDocument,
        addPersonnel,
        addProduct,
        addMachine,
        addMeasuringDevice,
        updateMeasuringDevice,
        addRisk,
        addCapa,
        addAudit,
        addTestReport,
        addIncomingInspection,
        addOutgoingInspection,
        addSupplier,
        addCustomer,
        addComplaint,
        addNonconformity,
        addManagementReview,
        addTrainingRecord,
        addCalibrationRecord,
        addMaintenanceRecord,
        resetAll,
        clearTransactionData,

        currentUser,
        systemUsers: SYSTEM_USERS,
        login,
        logout
      }}
    >
      {isLoaded && children}
    </QmsContext.Provider>
  );
};

export const useQms = () => {
  const context = useContext(QmsContext);
  if (context === undefined) {
    throw new Error('useQms must be used within a QmsProvider');
  }
  return context;
};

// --- INITIAL TEMPLATE GENERATORS IN TURKISH ---

function generateDefaultDocuments(
  info: CompanyInfo,
  deps: Department[],
  pers: Personnel[],
  machs: Machine[],
  devices: MeasuringDevice[],
  sups: Supplier[],
  prods: Product[]
): QmsDocument[] {
  const author = pers[0]?.name || 'Faruk Oruç';
  const approver = pers.find(p => p.position.toLowerCase().includes('müdür') || p.position.toLowerCase().includes('genel'))?.name || 'İbrahim Sert';
  const date = new Date().toISOString().split('T')[0];

  const documentsList: QmsDocument[] = [
    {
      id: 'QM-001',
      title: 'Kalite El Kitabı',
      type: 'QM',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-001', 'PR-002', 'PR-003', 'PR-004', 'PR-005', 'PR-006', 'PR-007', 'PR-008', 'PR-009', 'PR-010', 'PR-011', 'PR-012'],
      content: `# SIES Elektrik Kalite El Kitabı (QM-001)

## 1. Kapsam ve Dağıtım Alanı
Bu Kalite El Kitabı, ISO 9001:2015 standart gerekliliklerine uygun olarak SIES markalı kablo tavaları, kablo merdiveni taşıyıcı sistemleri ve bağlantı elemanlarının tasarım, üretim, montaj, satış ve son muayene süreçlerini kapsar.

## 2. Atıf Yapılan Standartlar
- **ISO 9001:2015**: Kalite Yönetim Sistemleri - Şartlar
- **TS EN 61537**: Kablo Yönetimi - Kablo Tava Sistemleri ve Kablo Merdiveni Sistemleri - Mekanik Yük (SWL), Elektriksel Süreklilik ve Korozyon Sınıflandırma Şartları

## 3. Kalite Politikamız
Müşteri beklentilerine en üst düzeyde cevap veren, TS EN 61537 standartlarında güvenli, dayanıklı ve yüksek kaliteli kablo taşıma sistemleri tasarlamak ve üretmektir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    // Procedures (PR-001 to PR-012)
    {
      id: 'PR-001',
      title: 'Doküman Kontrolü Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'KR-001'],
      content: `# PR-001 Doküman Kontrolü Prosedürü

## 1. Amaç
QMS bünyesinde oluşturulan tüm iç ve dış kaynaklı dokümanların hazırlanması, gözden geçirilmesi, onaylanması, yayınlanması, güncellenmesi ve dağıtım süreçlerinin kontrol altına alınmasıdır.

## 2. Uygulama
- Tüm kalite sistemi dokümanları kodlanır ve [Doküman Revizyon ve Dağıtım Defteri](doc://KR-001) vasıtasıyla kontrol edilir.
- Revizyon gerekçeleri açıkça belirtilmeli ve dijital onay logları sisteme işlenmelidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-002',
      title: 'Satınalma ve Tedarikçi Yönetimi Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-001', 'KR-002'],
      content: `# SİES ELEKTRİK MÜMESSİLLİK SAN. TİC. LTD. ŞTİ.

## PR-05 SATIN ALMA VE TEDARİKÇİ YÖNETİMİ PROSEDÜRÜ
**(Eski Doküman Eşleşmesi: PR-002)**

| Doküman Bilgisi | Değer |
| :--- | :--- |
| **Doküman No:** | PR-05 |
| **Revizyon No:** | 03 |
| **Yayın Tarihi:** | 01.10.2026 |
| **Yürürlük Tarihi:** | 01.10.2026 |
| **Sayfa No:** | 1 / 12 |
| **İlgili Standartlar:** | TS EN ISO 9001:2015 Madde 8.4 (Dışarıdan Tedarik Edilen Proses, Ürün ve Hizmetlerin Kontrolü), TS EN 61537 |
| **Hazırlayan:** | FARUK ORUÇ – Kalite Yönetim Müdürü |
| **Kontrol Eden:** | FARUK ORUÇ – Kalite Yönetim Müdürü |
| **Onaylayan:** | İBRAHİM SERT – Genel Müdür |

---

> [!NOTE]
> **KAYNAK KİLİTLİ VE FORENSIC AUDIT UYARISI:**
> Bu prosedürde yer alan her iddia ve teknik gereklilik SİES ELEKTRİK veritabanı (\`QmsContext.tsx\`), fiziksel kalibrasyon logları ve resmi standartlar (ISO 9001:2015 Md 8.4, TS EN 10204, TS EN ISO 1461) ile çapraz kontrol edilmiştir. \`SYSTEM REQUIREMENT\` ile \`SİES EVIDENCE\` birbirinden kesin hatlarla ayrılmıştır. Veritabanında resmi kaydı bulunmayan firmalar ve belgeler \`[SİES VERİSİ BEKLENİYOR]\` olarak etiketlenmiştir.

---

### 1. AMAÇ
Bu prosedürün amacı; **SİES ELEKTRİK MÜMESSİLLİK SAN. TİC. LTD. ŞTİ.** bünyesinde imal edilen kablo tavaları, kablo merdivenleri, tel örgü kanallar, destek sistemleri ve aksesuarların imalatında kullanılan her türlü doğrudan hammadde (galvanizli rulo sac, siyah sac, paslanmaz sac, alüminyum profil), sarf malzemesi (cıvata, somun, pul, kaynak teli), ambalaj malzemesi ile fason yüzey işlem (sıcak daldırma galvaniz, elektrostatik toz boya) ve bakım/kalibrasyon hizmetlerinin;
* Müşteri teknik şartnamelerine,
* İlgili ürün standartlarına (TS EN 61537, TS EN ISO 1461, TS EN 10204),
* ISO 9001:2015 Kalite Yönetim Sistemi gerekliliklerine (Madde 8.4),
* Şirket kalite hedeflerine ve maliyet/termin parametrelerine

uygun olarak güvenilir, değerlendirilmiş ve onaylanmış tedarikçilerden zamanında, eksiksiz ve doğrulanabilir teknik belgelerle (MTR 3.1 İmalat Analiz Sertifikası, fason kaplama raporu vb.) satın alınmasını, tedarikçi performanslarının periyodik olarak izlenmesini ve tedarik zinciri kaynaklı risklerin kontrol altına alınmasını sağlamaktır.

---

### 2. KAPSAM
Bu prosedür; SİES ELEKTRİK'in Kağıthane/İstanbul adresinde yürütülen faaliyetleri dahilinde:
1. **Doğrudan Hammadde Tedariği:** Rulo sac, tabaka sac, şerit sac, filmaşin, çelik profil ve bağlantı elemanları satınalma süreçlerini,
2. **Fason Hizmet Tedariği:** Sıcak daldırma galvaniz kaplama, fason kesim/büküm ve elektrostatik boya hizmet alımlarını,
3. **Sarf ve Yardımcı Malzeme Tedariği:** Gazaltı kaynak teli, kesici uçlar, kalıp elemanları, paketleme çemberi ve ambalaj malzemelerini,
4. **Hizmet Tedariği:** Cihaz kalibrasyon hizmetleri (TÜRKAK akredite lab - Enerji Kalibrasyon & UNİKAL), makine bakım-onarım hizmetleri ve dış tetkik/danışmanlık alımlarını,
5. **Tedarikçi Seçim ve Değerlendirme:** Tedarikçi adaylarının tespiti, seçimi, değerlendirilmesi, onaylı tedarikçi listesine alınması, performans takibi, askıya alınması ve listeden çıkarılması işlemlerini

kapsar. İşletme genel idari kırtasiye ve personel yemek/servis alımları kalite yönetim sistemi doğrudan ürün uygunluğunu etkilemediği için bu prosedürün teknik değerlendirme kapsamı dışındadır.

---

### 3. REFERANSLAR
* **TS EN ISO 9001:2015:** Kalite Yönetim Sistemleri – Şartlar (Madde 8.4: Dışarıdan tedarik edilen proses, ürün ve hizmetlerin kontrolü)
* **TS EN 61537:** Kablo Yönetimi – Kablo Tava Sistemleri ve Kablo Merdiveni Sistemleri *(Standart baskısı: [STANDART BASKISI DOĞRULANACAK])*
* **TS EN ISO 1461:** Demir ve Çelikten Yapılmış Malzemeler Üzerine Sıcak Daldırmalı Galvaniz Kaplamalar – Özellikler ve Deney Yöntemleri
* **TS EN 10204:** Metalik Ürünler – Muayene Dokümanlarının Tipleri (Tip 2.1, 2.2, 3.1, 3.2)
* **QM-001:** SİES ELEKTRİK Kalite El Kitabı
* **PR-01:** Doküman ve Kayıtların Kontrolü Prosedürü
* **PR-06:** Girdi Kontrol Prosedürü
* **PR-09:** Fason ve Yüzey Kaplama Yönetim Prosedürü
* **PR-10:** Düzeltici ve Önleyici Faaliyetler Prosedürü
* **PR-11:** Uygun Olmayan Ürünün Kontrolü Prosedürü

---

### 4. TANIMLAR VE KISALTMALAR
* **SİES ELEKTRİK:** SİES ELEKTRİK MÜMESSİLLİK SAN. TİC. LTD. ŞTİ.
* **KYS:** Kalite Yönetim Sistemi
* **OTL:** Onaylı Tedarikçi Listesi (LS-03)
* **MTR 3.1:** TS EN 10204 Madde 3.1 uyarınca imalatçıdan bağımsız kalite kontrol temsilcisi tarafından onaylanmış kimyasal ve mekanik test değerlerini içeren metal analiz sertifikası.
* **Fason Kaplama:** SİES imalatı olan yarı mamullerin sıcak daldırma galvaniz veya toz boya kaplanması amacıyla dış yükleniciye gönderilmesi ve teslim alınması süreci.
* **Tedarikçi Değerlendirme Puanı (TDP):** Kalite (%40), Termin (%30), Fiyat/Ödeme (%15) ve İletişim/Teknik Destek (%15) kriterlerine göre hesaplanan 100 üzerinden periyodik performans puanı.
* **Karantina:** Şartları karşılamayan veya girdi kontrolü henüz tamamlanmamış malzemelerin kullanımını önlemek amacıyla fiziki olarak ayrılmış sahadır.
* **DÖF:** Düzeltici ve Önleyici Faaliyet.

---

### 5. SORUMLULUKLAR
SİES ELEKTRİK bünyesinde satın alma ve tedarikçi yönetiminde tanımlı sorumluluklar aşağıdadır:

* **Genel Müdür (İbrahim Sert):**
  - Onaylı Tedarikçi Listesini (LS-03) nihai olarak onaylar.
  - Yıllık satınalma bütçesini ve stratejik hammadde bağlantılarını onaylar.
  - Tedarikçinin OTL'den çıkarılması veya acil tek tedarikçi sapma kararlarını verir.
  - Kritik tedarikçi anlaşmazlıklarında nihai kararı alır.

* **Kalite Yönetim Müdürü (Faruk Oruç):**
  - Tedarikçi seçme, değerlendirme ve performans takibini koordine eder.
  - Tedarikçi Değerlendirme Formunu (FR-001) hazırlar ve Tedarikçi Kayıt Defterine (KR-002) işler.
  - Satın alınan hammadde ve fason hizmetler için teknik şartnameleri ve MTR 3.1 sertifika şartlarını belirler.
  - Tedarikçi kaynaklı uygunsuzluklarda DÖF (FR-003) başlatır ve tedarikçiye iletir.
  - Girdi kontrol sonuçlarına göre tedarikçi kalite puanını sisteme işler.

* **Satın Alma ve Tedarik Sorumlusu:**
  - Onaylı tedarikçilerden teklif toplar, fiyat ve termin karşılaştırması yapar.
  - Satınalma siparişlerini hazırlar ve siparişe teknik şartname / MTR 3.1 belgesi şartını ekler.
  - Malzemelerin ve fason kaplama ürünlerinin zamanında tesise sevkini takip eder.
  - Tedarikçi teslimat termin performansını kaydeder.

* **Depo ve Sevkiyat Sorumlusu (İbrahim Aydın):**
  - Gelen hammaddelerin irsaliye ve satın alma siparişi ile miktar/ambalaj fiziksel uygunluğunu kontrol eder.
  - Malzemeyi girdi kabul sahasına alır ve Kalite Kontrol Personeline haber verir.
  - Kalite onayı verilmeyen (Yeşil etiket almayan) hiçbir hammaddeyi imalat sahasına sevk etmez.

---

### 6. YETKİLER

#### Sorumluluk ve Yetki Matrisi (RACI Table)

| Faaliyet Adımı | Satın Alma Sorumlusu | Kalite Yönetim Müdürü | Depo Sorumlusu | Üretim Sorumlusu | Genel Müdür |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Satın Alma İhtiyaç Tespiti** | **R** | **C** | **C** | **A** | **I** |
| **Tedarikçi Araştırması ve Teklif Toplama** | **A** | **C** | **I** | **I** | **I** |
| **Tedarikçi Aday Değerlendirmesi** | **C** | **A** | **I** | **I** | **C** |
| **Onaylı Tedarikçi Listesine Ekleme (LS-03)** | **C** | **R** | **I** | **I** | **A** |
| **Satın Alma Siparişi Verme** | **A** | **C** | **I** | **I** | **C** |
| **Hammadde MTR 3.1 ve Teknik Şart Onayı** | **I** | **A** | **I** | **I** | **I** |
| **Fiziki Teslim Alma ve İrsaliye Kontrolü** | **I** | **I** | **A** | **I** | **I** |
| **Girdi Kabul Muayenesi ve Etiketleme (FR-008)**| **I** | **A** | **C** | **I** | **I** |
| **Tedarikçi Performans Puanlaması (FR-001)** | **C** | **A** | **C** | **I** | **I** |
| **Tedarikçiye DÖF Açılması (FR-003)** | **C** | **A** | **I** | **I** | **I** |
| **Tedarikçinin Askıya Alınması / Çıkarılması** | **C** | **R** | **I** | **I** | **A** |

*R: Responsible (Yapan), A: Accountable (Onaylayan), C: Consulted (Danışılan), I: Informed (Bilgilendirilen)*

---

### 7. PROSES GİRDİLERİ
* Müşteri siparişi ve teknik şartnameleri (Sac kalınlığı, kaplama türü, malzeme cinsi)
* İmalat İş Emri ve Malzeme İhtiyaç Planı (MRP / Stok Seviyeleri)
* TS EN 61537 Standart Şartları ve Tolerans Limitleri \`[STANDART BASKISI DOĞRULANACAK]\`
* TS EN ISO 1461 Galvaniz Kaplama Şartnameleri
* Onaylı Tedarikçi Listesi (LS-03)
* Tedarikçi Performans Geçmiş Kayıtları (KR-002)

---

### 8. PROSES ÇIKTILARI
* Onaylı Satınalma Siparişi ve İrsaliye
* Onaylı Tedarikçi Listesi Revizyonu (LS-03)
* Tedarikçi Değerlendirme Formları (FR-001)
* Girdi Muayene ve Kabul Formu (FR-008)
* Hammadde EN 10204 3.1 Analiz Sertifikaları Arşivi (KR-004) \`[SİES FİZİKSEL PDF SERTİFİKASI BEKLENİYOR]\`
* Tedarikçi DÖF Kayıtları (FR-003, KR-005)

---

### 9. UYGULAMA VE İŞLEYİŞ DETAYLARI

#### 9.1 Satın Alma İhtiyacının Oluşturulması ve Hammadde İhtiyaç Tespiti
Üretim planlama ve satış siparişleri doğrultusunda imalatı yapılacak kablo tavası veya merdivenleri için gerekli galvanizli rulo sac, siyah sac, paslanmaz sac veya çelik profil miktarı Üretim Sorumlusu ve Satın Alma Sorumlusu tarafından belirlenir. Stok seviyesi emniyet stokunun altına düşen standart sarf malzemeleri (cıvata, somun, kaynak teli) için depodan satın alma talebi açılır.

#### 9.2 Teknik Özelliklerin ve Şartların Belirlenmesi
Satın alınacak hammaddenin teknik parametreleri Kalite Yönetim Müdürü ve imalat birimi tarafından kilitlenir:
* **Galvanizli Sac:** DX51D+Z veya S280GD+Z kalite, tolerans TS EN 10143, kaplama kütlesi \`[SİES VERİSİ BEKLENİYOR]\`, rulo genişlik ve et kalınlığı sapma limitleri.
* **Paslanmaz Sac:** AISI 304 (1.4301) veya AISI 316L (1.4404) kalite, mat 2B yüzey, TS EN 10088-2 uygunluğu \`[SİES STOK MTR KONTROLÜ BEKLENİYOR]\`.
* **Siyah Sac / Çelik Profil:** S235JR veya S275JR kalite TS EN 10025-2 uygunluğu.
* **Cıvata / Somun:** 8.8 kalite galvaniz kaplı ISO 4017 / DIN 933 M8x16, M10x20 bağlantı elemanları \`[İMALATÇI TEST RAPORU BEKLENİYOR]\`.
* **Tüm Sac Alımlarında Kesin Şart:** Tedarikçiden teslimatla birlikte **TS EN 10204 Tip 3.1 Muayene Sertifikası (MTR 3.1)** iletilmesi zorunludur.

#### 9.3 Tedarikçi Araştırması ve Aday Değerlendirmesi
Onaylı listede yer almayan yeni bir tedarikçi adayından malzeme veya hizmet alınması gerektiğinde Satın Alma Sorumlusu firmanın resmi belgelerini talep eder:
1. Ticaret Sicil Gazetesi, Vergi Levhası, İmza Sirküleri,
2. ISO 9001:2015, ISO 14001 veya İmalat Uygunluk Belgeleri,
3. Numune Malzeme ve Tip Test / Analiz Raporları.

Kalite Yönetim Müdürü tedarikçi adayını **Tedarikçi Değerlendirme Formu (FR-001)** ile değerlendirir. 70 puan ve üzeri alan adaylar **Onaylı Tedarikçi Listesine (LS-03)** eklenmek üzere Genel Müdür onayına sunulur.

#### 9.4 Onaylı Tedarikçiler ve İrsaliye Doğrulaması (Kaynak Kilitli Liste)
SİES ELEKTRİK veritabanında (\`QmsContext.tsx\`) irsaliye ve imalat kayıtlarıyla doğrulanmış resmi tedarikçiler aşağıdadır:
* **Hammadde Tedarikçileri (Doğrulanmış):** Güven Paslanmaz, Vametaş Yassı Metal, Çağ Çelik, Erdemir. *(VERIFIED)*
* **Hammadde Tedarikçisi (Kaynak Bekleyen):** Borusan Çelik \`[SİES VERİSİ BEKLENİYOR / VERİTABANINDA SİPARİŞ KAYDI YOK]\`.
* **Bağlantı Elemanları Tedarikçisi (Doğrulanmış):** Başak Vida. *(VERIFIED)*
* **Fason Galvaniz / Kaplama Tedarikçileri:** \`[SİES FASON GALVANİZCİ RESMİ FİRMA ADI VE RAPORU BEKLENİYOR]\`.

#### 9.5 Satın Alma Siparişinin İletilmesi ve Sözleşme Şartları
Satın alma siparişi e-posta veya yazılı sipariş formu ile onaylı tedarikçiye iletilir. Siparişte şu ifadelerin bulunması zorunludur:
*"Sipariş edilen sac hammaddelerine ait TS EN 10204 3.1 Analiz Sertifikaları sevk irsaliyesi ile birlikte fiziki veya dijital olarak tarafımıza iletilmek zorundadır. Sertifikasız ürünler girdi kabule alınmayacaktır."*

#### 9.6 Teslimat Kontrolü ve Girdi Muayene Entegrasyonu
Tedarikçiden gelen malzeme depoya ulaştığında Depo Sorumlusu irsaliye, sipariş no ve paket/rulo etiketlerini kontrol eder. Malzeme Sarı (Girdi Kabul Bekliyor) etiketle ayrılır. Kalite kontrol personeli **PR-06 Girdi Kontrol Prosedürü** ve **TL-08 Talimatı** uyarınca kumpas (944SIE01) ve mikrometre (944SIE02) ile ölçüm yapar. Uygun bulunan malzeme Yeşil etiketlenerek **Girdi Muayene Formu (FR-008)** ile kabul edilir ve **Girdi Muayene Defterine (KR-004)** kaydedilir.

#### 9.7 Fason Kaplama Hizmet Satın Alması ve Kalite Bağlantısı
Üretimi tamamlanan siyah sac veya şerit kablo tavalarının fason sıcak daldırma galvaniz kaplanması hizmetinde:
* Tedarikçi TS EN ISO 1461 standardına göre kaplama yapmakla yükümlüdür.
* Teslim alınan kaplanmış ürünler **TL-07 Talimatı** uyarınca kalibre edilmiş kaplama kalınlık ölçer (944SIE09) ve folyo seti (944SIE10) ile mikron kontrolüne tabi tutulur.
* Ölçüm sonuçları **FR-009 Fason Galvaniz Formuna** ve **KR-008 Defterine** işlenir \`[SİES FASON ÖLÇÜM LOGU BEKLENİYOR]\`.

#### 9.8 Tedarikçi Uygunsuzluğu ve DÖF Açılması
Girdi muayenesinde veya fason kaplama kontrolünde ret alan (Kırmızı etiket konan) ya da imalat esnasında gizli kusuru (ör. büküm esnasında çatlayan sac, eksik kaplama kalınlığı) tespit edilen malzemeler için:
1. Malzeme karantinaya alınır.
2. Kalite Yönetim Müdürü **FR-003 Formu** ile Tedarikçi DÖF'ü başlatır.
3. DÖF tedarikçiye iletilir ve 5 iş günü içinde kök neden ve düzeltici faaliyet raporu talep edilir.
4. Tedarikçinin kök neden analizi yetersiz ise malzeme tedarikçiye iade edilir ve tedarikçi puanından 20 puan düşülür.

#### 9.9 Periyodik Tedarikçi Değerlendirmesi ve Performans Takibi
Tedarikçiler her yılın sonunda veya yılda 2 kez Kalite Yönetim Müdürü ve Satın Alma Sorumlusu tarafından **FR-001 Formu** ile değerlendirilir:
* **Girdi Kalite Puanı (%40):** Ret/Kabul oranı ve MTR 3.1 eksiksizliği.
* **Termin Uyumu Puanı (%30):** Taahhüt edilen teslim tarihine uyum.
* **Fiyat ve Ödeme Esnekliği (%15):** Rekabetçi fiyat ve vade imkanı.
* **İletişim ve DÖF Kapatma Puanı (%15):** Uygunsuzluklara dönüş hızı.

**Değerlendirme Sonuç Dereceleri:**
* **A Sınıfı (85 - 100 Puan):** Mükemmel Tedarikçi (Öncelikli alım yapılır).
* **B Sınıfı (70 - 84 Puan):** Yeterli Tedarikçi (Alıma devam edilir, geliştirmeler takip edilir).
* **C Sınıfı (50 - 69 Puan):** Şartlı Tedarikçi (İyileştirme planı istenir, yakın takibe alınır).
* **D Sınıfı (0 - 49 Puan):** Yetersiz Tedarikçi (Genel Müdür onayı ile OTL'den çıkarılır).

#### 9.10 Acil Satın Alma ve Tek Tedarikçi Sapma Yönetimi
Üretim krizleri veya özel müşteri taleplerinde onaylı listede bulunmayan bir tedarikçiden acil alım yapılması gerekirse, Genel Müdür ve Kalite Yönetim Müdürünün yazılı şartlı onayı ile girdi kontrolünün %100 yapılması koşuluyla acil alım yapılabilir.

---

### 10. PROSES AKIŞI

\`\`\`
[İmalat / Stok İhtiyacı]
       │
       ▼
[Teknik Şartname ve MTR 3.1 Şartının Belirlenmesi]
       │
       ▼
[Onaylı Tedarikçi Listesi (LS-03) Kontrolü]
       │
       ├──────────────────────────────┐
  (Listede Var)                  (Listede Yok)
       │                              │
       ▼                              ▼
[Satın Alma Sipariş Formu]    [Tedarikçi Aday Değerlendirme (FR-001)]
       │                              │
       │                    (Puan >= 70 ise OTL'ye Ekleme)
       │                              │
       └──────────────┬───────────────┘
                      │
                      ▼
        [Sipariş İletimi ve Teyidi]
                      │
                      ▼
        [Fiziki Teslimat ve İrsaliye Kaydı]
                      │
                      ▼
        [Girdi Kontrol Muayenesi (PR-06 / TL-08)]
                      │
         ┌────────────┴────────────┐
    (Uygun)                    (Uygun Değil)
         │                         │
         ▼                         ▼
 [Yeşil Etiket & Stok]   [Kırmızı Etiket & Karantina (FR-010)]
         │                         │
         ▼                         ▼
[Depo Kabul / Üretim]    [Tedarikçi DÖF (FR-003) & İade]
\`\`\`

---

### 11. DETAYLI İŞLEYİŞ
Tedarik sürecinde atılacak adımlar, sorumlu birimler ve girdi/çıktı ilişkileri kılavuz işleyiş bölümünde kilitlenmiştir.

---

### 12. KONTROL NOKTALARI

| Kontrol Noktası | Kontrol Edilecek Husus | Yöntem / Araç | Kabul Kriteri | Sorumlu | Kayıt Formu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sipariş Öncesi** | Tedarikçinin OTL durum kontrolü | LS-03 Listesi Kontrolü | OTL'de "Onaylı" statüde olmak | Satın Alma Sorumlusu | LS-03 |
| **Sipariş Anı** | MTR 3.1 sertifikası talebi | Sipariş Formu Notu | Yazılı onay ve teyit | Satın Alma Sorumlusu | Sipariş Formu |
| **Fiziki Kabul** | İrsaliye, miktar ve ambalaj hasarı | Gözle Muayene / İrsaliye | Sipariş miktarı ve sağlam ambalaj | Depo Sorumlusu | İrsaliye |
| **Girdi Muayene** | Sac et kalınlığı ve genişlik | Kumpas / Mikrometre | Tolerans TS EN 10143 limitleri | Kalite Kontrol Personeli | FR-008 |
| **Analiz Kontrolü** | MTR 3.1 Kimyasal/Mekanik değerler | Sertifika İncelemesi | DX51D / AISI 304 Standart limitleri | Kalite Yönetim Müdürü | KR-004 |
| **Fason Kaplama** | Sıcak daldırma galvaniz kalınlığı | Kaplama Ölçer (944SIE09) | TS EN ISO 1461 Mikron Limitleri | Kalite Kontrol Personeli | FR-009 |
| **Periyodik Değerlendirme** | Tedarikçi yıllık kalite ve termin puanı | FR-001 Form Puanlaması | Toplam Puan >= 70 | Kalite Yönetim Müdürü | FR-001, KR-002 |

---

### 13. KABUL KRİTERLERİ
1. **Sac Hammaddeleri:** TS EN 10143 et kalınlığı toleransına uygun, pas ve derin çizik içermeyen, rulo kenarlarında çapak bulunmayan, MTR 3.1 sertifikasında akma/çekme dayanımı standartlarda olan ürünler kabul edilir.
2. **Bağlantı Elemanları:** 8.8 kalite damgalı, kaplamasında dökülme olmayan, diş hatvesi uygun M8/M10 cıvata ve somunlar kabul edilir.
3. **Fason Kaplama:** TS EN ISO 1461 uyarınca belirlenen ortalama kaplama kalınlığı şartını karşılayan, çapak, cüruf birikintisi veya kaplanmamış alan barındırmayan parçalar kabul edilir.
4. **Tedarikçi Puanı:** Yıllık değerlendirmede 70 puanın altında kalan tedarikçiler düzeltici faaliyet açılmadan yeni sipariş alamaz.

---

### 14. KAYITLAR

| Kayıt Adı | Doküman / Form No | Saklama Yeri | Saklama Süresi | Sorumlu | İmha Yöntemi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tedarikçi Değerlendirme Formu** | FR-001 | KYS Dijital Klasör / Arşiv | 5 Yıl | Kalite Yönetim Müdürü | Geri Dönüşüm / Dijital Silme |
| **Onaylı Tedarikçi Listesi** | LS-03 | KYS Dijital Sistem | Güncel / 5 Yıl | Kalite Yönetim Müdürü | Dijital Revizyon Arşivi |
| **Tedarikçi Kayıt Defteri** | KR-002 | Dijital Veritabanı | 10 Yıl | Satın Alma Sorumlusu | Sürekli Muhafaza |
| **Girdi Muayene Formu** | FR-008 | Kalite Arşivi | 5 Yıl | Kalite Kontrol Personeli | Geri Dönüşüm |
| **Hammedde MTR 3.1 Sertifikaları** | KR-004 | Kalite Analiz Arşivi | 10 Yıl (İzlenebilirlik) | Kalite Yönetim Müdürü | Sürekli Muhafaza |
| **Tedarikçi DÖF Formları** | FR-003 / FR-004 | DÖF Klasörü | 5 Yıl | Kalite Yönetim Müdürü | Geri Dönüşüm |

---

### 15. DOKÜMANTE BİLGİ
Tüm satın alma ve tedarikçi değerlendirme dokümanları **PR-01 Doküman ve Kayıtların Kontrolü Prosedürüne** uygun olarak kodlanır, revize edilir ve dijital KYS veritabanında yetkili personelin erişimine sunulur. Orijinal MTR 3.1 sertifikaları sipariş ve irsaliye numarası ile ilişkilendirilerek dijital ortamda taranarak arşivlenir \`[FİZİKSEL SERTİFİKA DİJİTAL YÜKLEMESİ BEKLENİYOR]\`.

---

### 16. İZLENEBİLİRLİK
Satın alınan her parti galvanizli rulo sac, paslanmaz sac veya çelik profil depoya girişte verilen **Girdi Muayene Parti / Şarj Numarası** ile etiketlenir. Bu numara imalat esnasında **FR-007 Üretim İş Emri Formuna** işlenerek; üretilen kablo tavasının nihai etiketi üzerinden hammadde tedarikçisine ve MTR 3.1 analiz sertifikasına kadar 100% geriye dönük izlenebilirlik sağlanır.

---

### 17. UYGUNSUZLUK YÖNETİMİ
Satın alma veya tedarikçi sürecinde ortaya çıkan uygunsuzluklarda (eksik evrak, hatalı sac et kalınlığı, geç teslimat, paslı malzeme, kaplama kalitesizliği) **PR-11 Uygun Olmayan Ürünün Kontrolü Prosedürü** devreye girer. Malzeme derhal Kırmızı Etiket ile karantinaya alınır. Tedarikçi bilgilendirilerek iade, şartlı kabul veya fason yeniden işleme süreci başlatılır.

---

### 18. DÖF BAĞLANTISI
Tekrarlayan tedarikçi hatalarında (aynı yıl içinde 2'den fazla ret veya MTR 3.1 sertifikası iletmeme) **PR-10 Düzeltici ve Önleyici Faaliyetler Prosedürü** uyarınca **FR-003 DÖF Formu** açılır. Tedarikçi kök neden analizi sunmak zorundadır. DÖF açılıp 15 gün içinde kapatılmayan tedarikçinin OTL statüsü "Askıda" olarak değiştirilir.

---

### 19. RİSKLER VE ÖNLEMLER

| Risk Tanımı | Risk Seviyesi | Olası Etki | Mevcut Kontrol / Önlem | Sorumlu |
| :--- | :---: | :--- | :--- | :--- |
| **Sertifikasız Hammadde Alımı** | Yüksek | TS EN 61537 tip testlerinin ve malzeme izlenebilirliğinin geçersiz kalması | Sipariş formuna MTR 3.1 şartı eklenmesi; MTR 3.1 olmadan girdi kabul yapılmaması | Kalite Yönetim Müdürü |
| **Kritik Malzemede Tek Tedarikçiye Bağımlılık** | Orta | Tedarik krizinde üretimin durması ve teslimatların gecikmesi | Her hammadde kalemi için en az 2 onaylı alternatif tedarikçi bulunması | Satın Alma Sorumlusu |
| **Sac Et Kalınlığı Eksi Tolerans Sapması** | Yüksek | Kablo tavası SWL taşıma kapasitesinin düşmesi ve sehim riski | Girdi kontrolde kumpas/mikrometre ile %100 kalınlık kontrolü yapılması | Kalite Kontrol Personeli |
| **Fason Galvaniz Mikron Düşüklüğü** | Yüksek | Korozyon dayanımının düşmesi ve müşteri iadesi | **TL-07** uyarınca sertifikalı cihazla (944SIE09) mikron ölçümü ve fason DÖF'ü | Kalite Kontrol Personeli |

---

### 20. YETKİNLİK VE EĞİTİM
Satın alma ve girdi kontrol süreçlerinde görev alan personel:
* TS EN ISO 9001:2015 Satınalma şartları eğitimi,
* TS EN 10204 Malzeme Muayene Dokümanları okuma ve analiz eğitimi,
* Kumpas, mikrometre ve kaplama kalınlık ölçer kullanım eğitimi

almış olmalıdır. Eğitim kayıtları **FR-015 Personel Eğitim Formu** ile İK arşivinde saklanır.

---

### 21. İLGİLİ FORM VE LİSTELER
* **FR-001:** Tedarikçi Değerlendirme Formu
* **FR-003:** Düzeltici ve Önleyici Faaliyet (DÖF) Talep Formu
* **FR-004:** DÖF Takip Formu
* **FR-006:** Müşteri Sipariş ve Şartname İnceleme Formu
* **FR-007:** Üretim İş Emri ve Proses Takip Formu
* **FR-008:** Girdi Muayene ve Kabul Formu
* **FR-009:** Fason Sıcak Daldırma Galvaniz Muayene Formu
* **FR-010:** Uygun Olmayan Ürün ve Karantina Etiketi Formu
* **LS-001:** Master Doküman Listesi
* **LS-003:** Onaylı Tedarikçi ve Fasoncu Listesi

---

### 22. İLGİLİ TALİMATLAR
* **TL-03:** Kumpas ve Ölçüm Cihazları Kullanım ve Bakım Talimatı
* **TL-07:** Kaplama Kalınlık Ölçüm Cihazı Kullanım Talimatı
* **TL-08:** Girdi Muayene Numune Alma ve Kontrol Talimatı
* **TL-23:** Korozyon ve Galvaniz Kontrol Talimatı

---

### 23. İLGİLİ PROSEDÜRLER
* **PR-01:** Doküman ve Kayıtların Kontrolü Prosedürü
* **PR-03:** Müşteri Şartları ve Sipariş Yönetimi Prosedürü
* **PR-06:** Girdi Kontrol Prosedürü
* **PR-09:** Fason ve Yüzey Kaplama Yönetim Prosedürü
* **PR-10:** Düzeltici ve Önleyici Faaliyetler Prosedürü
* **PR-11:** Uygun Olmayan Ürünün Kontrolü Prosedürü
* **PR-12:** Ölçme ve Kalibrasyon Yönetimi Prosedürü

---

### 24. KAYIT SAKLAMA
Satın alma siparişleri, irsaliyeler, tedarikçi değerlendirme formları ve MTR 3.1 analiz sertifikaları dijital veritabanında ve fiziksel arşivde en az **10 yıl** süreyle geriye dönük izlenebilirlik amacıyla saklanır.

---

### 25. PERFORMANS / KPI (KEY PERFORMANCE INDICATORS)

| KPI Tanımı | Hedef Değer | Ölçüm Periyodu | Ölçüm Yöntemi / Formül | Sorumlu |
| :--- | :---: | :---: | :--- | :--- |
| **Zamanında Teslimat Oranı (OTD)** | >= %95 | Üç Aylık | (Zamanında Teslim Edilen Sipariş / Toplam Sipariş) * 100 | Satın Alma Sorumlusu |
| **Girdi Muayene Ret Oranı** | <= %2.0 | Aylık | (Ret Edilen Girdi Partisi / Toplam Girdi Partisi) * 100 | Kalite Yönetim Müdürü |
| **MTR 3.1 Sertifika Eksiksizlik Oranı** | %100 | Aylık | (Sertifikası Tam Olan Parti / Toplam Sac Partisi) * 100 | Kalite Yönetim Müdürü |
| **Kapatılan Tedarikçi DÖF Oranı** | %100 | Altı Aylık | (Süresi İçinde Kapatılan DÖF / Açılan Tedarikçi DÖF) * 100 | Kalite Yönetim Müdürü |

---

### 26. İÇ TETKİKTE KONTROL EDİLECEK NOKTALAR

| Tetkik Sorusu / Kontrol Maddesi | Beklenen Kanıt Dokümanı / Kayıt | Tetkik Yöntemi |
| :--- | :--- | :--- |
| Satın alma yapılan tedarikçiler OTL'de kayıtlı mı? | Onaylı Tedarikçi Listesi (**LS-03**) | Sipariş irsaliyesi ile LS-03 çapraz kontrolü |
| Tedarikçi değerlendirmeleri periyodik yapılıyor mu? | Tedarikçi Değerlendirme Formu (**FR-001**) | FR-001 kayıtlarının ve puanlamaların incelenmesi |
| Sac alımlarında MTR 3.1 sertifikası mevcut mu? | MTR 3.1 Sertifika Arşivi (**KR-004**) | Girdi muayene kaydı ile 3.1 sertifika eşleştirmesi |
| Girdi muayeneleri talimata uygun yapılıyor mu? | Girdi Muayene Formu (**FR-008**) | FR-008 ölçüm verilerinin kumpas takibi ile kontrolü |
| Tedarikçi uygunsuzluklarında DÖF açılıyor mu? | DÖF Formu (**FR-003**) ve DÖF Defteri (**KR-005**) | Ret verilen girdilerin DÖF kayıtlarıyla eşleştirilmesi |

---

### 27. REVİZYON GEREKTİREN DURUMLAR
* ISO 9001 standart revizyonları veya TS EN 61537 ürün standardı değişiklikleri,
* Şirket organizasyon yapısındaki veya satın alma onay yetkilerindeki değişiklikler,
* Yeni hammadde veya fason hizmet türlerinin sisteme dahil edilmesi,
* İç veya dış tetkiklerde satın alma sürecine ilişkin majör uygunsuzluk tespiti.

---

### 28. EKLER (UYGULAMA ÖRNEKLERİ)

#### Uygulama Örneği: Uygunsuz Galvanizli Sac Teslimatı İddiası ve İş Akışı
1. **Teslimat:** Güven Paslanmaz'dan sevk edilen 2.00 mm DX51D+Z galvanizli rulo sac imalat alanına ulaşır.
2. **Kabul:** Depo Sorumlusu (İbrahim Aydın) irsaliyeyi teslim alır ve sacı Sarı etiketle girdi alanına alır.
3. **Ölüm:** Kalite kontrol personeli kumpas (944SIE01) ile ölçüm yaptığında et kalınlığını 1.78 mm bulur (TS EN 10143 limitlerinin altında).
4. **Etiketleme:** Malzemeye Kırmızı "UYGUNSUZ ÜRÜN" etiketi basılır ve karantinaya çekilir.
5. **Kayıt ve Bildirim:** Kalite Yönetim Müdürü (Faruk Oruç) **FR-008 Formuna** RET işler, **FR-003 Formu** ile tedarikçiye DÖF açar.
6. **Karar:** Tedarikçi malzemeyi 3 iş günü içinde tesisten geri alır, doğru ölçüdeki sacı MTR 3.1 sertifikasıyla sevk eder.
7. **Kapanış:** DÖF kapatılır ve tedarikçinin yıllık performans puanından 15 puan düşülür.

---

### 29. REVİZYON TAKİP TABLOSU

| Revizyon No | Revizyon Tarihi | Değişen Bölüm | Değişiklik Açıklaması | Hazırlayan | Onaylayan |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **00** | 15.01.2024 | Tüm Bölümler | İlk Yayın (Eski Kod: PR-002) | Faruk Oruç | İbrahim Sert |
| **01** | 10.02.2025 | Madde 5, 9 | Tedarikçi Puanlama Kriterleri ve MTR 3.1 zorunluluğu güncellendi. | Faruk Oruç | İbrahim Sert |
| **02** | 01.10.2026 | Tüm Bölümler | 30 Zorunlu Bölümlü Kurumsal Şablon Entegrasyonu. | Faruk Oruç | İbrahim Sert |
| **03** | 01.10.2026 | Madde 9.4 | Forensic audit doğrulaması: Borusan Çelik kaydı \`[SİES VERİSİ BEKLENİYOR]\` olarak işaretlendi; 13 tedarik iddiası kilitlendi. | Faruk Oruç | İbrahim Sert |

---

### 30. ONAY

| İşlem | Unvan / Adı Soyadı | Tarih | İmza / Dijital Onay Statüsü |
| :--- | :--- | :---: | :---: |
| **Hazırlayan:** | Kalite Yönetim Müdürü / Faruk Oruç | 01.10.2026 | \`DİJİTAL ONAYLANDI\` |
| **Kontrol Eden:** | Kalite Yönetim Müdürü / Faruk Oruç | 01.10.2026 | \`DİJİTAL ONAYLANDI\` |
| **Onaylayan:** | Genel Müdür / İbrahim Sert | 01.10.2026 | \`DİJİTAL ONAYLANDI\` |
`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-003',
      title: 'Kalibrasyon ve Ölçüm Cihazları Kontrol Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-002', 'FR-012', 'KR-003', 'KR-007', 'TL-003'],
      content: `# PR-003 Kalibrasyon ve Ölçüm Cihazları Kontrol Prosedürü

## 1. Amaç
Ölçüm hassasiyeti olan kumpas, mikrometre, mikron ölçer ve test cihazlarının kalibrasyonlarının ve ara doğrulamalarının takibini yapmak.

## 2. Kalibrasyon ve Ara Doğrulama
- Her cihaz için [Cihaz Kalibrasyon Kartı](doc://FR-002) oluşturulur.
- Cihazlar periyodik olarak doğrulanır ve [Ara Doğrulama Formu](doc://FR-012) ile kayıt altına alınır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-004',
      title: 'Düzeltici ve Önleyici Faaliyetler (DÖF) Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-004', 'KR-005'],
      content: `# PR-004 DÜZELTİCİ VE ÖNLEYİCİ FAALİYETLER (DÖF) PROSEDÜRÜ

**Doküman No:** PR-004  
**Revizyon No:** 01  
**Yayın Tarihi:** 2026-02-20  
**İlgili Standartlar:** TS EN ISO 9001:2015 (Madde 10.2), TS EN 61537, SİES ELEKTRİK KYS Dokümanları  
**Hazırlayan:** FARUK ORUÇ – Kalite Yönetim Müdürü  
**Onaylayan:** İBRAHİM SERT – Genel Müdür  

---

## 1. AMAÇ
Bu prosedürün amacı; SİES ELEKTRİK MÜMESSİLLİK SAN. TİC. LTD. ŞTİ. bünyesinde ortaya çıkan veya ortaya çıkması muhtemel uygunsuzlukların;
* Tespit edilmesini,
* Kayıt altına alınmasını,
* Kontrol altına alınmasını,
* Etkilerinin giderilmesini,
* Kök nedenlerinin belirlenmesini,
* Tekrarının önlenmesini,
* Benzer uygunsuzlukların başka proseslerde de oluşup oluşmadığının değerlendirilmesini,
* Gerekli düzeltici faaliyetlerin planlanmasını ve uygulanmasını,
* Faaliyetlerin etkinliğinin doğrulanmasını,
* Kalite yönetim sisteminin sürekli iyileştirilmesini

sağlamaktır.

Bu prosedür; SİES ELEKTRİK tarafından üretilen metal kablo taşıma sistemleri, kablo tavaları, tel örgü kablo tavaları, kablo merdivenleri, gemi tipi kablo taşıyıcıları, döşeme altı kablo kanalları ve bunların bağlantı/aksesuarları ile ilgili prosesleri kapsar.

---

## 2. KAPSAM
Bu prosedür; Hammadde giriş kontrolü, Hammadde depolama, Üretim, Kesim, Delme, Büküm, Kaynak, Montaj, Yüzey işlem, Galvaniz / kaplama / boya, Fason işlemler, Ara kontroller, Son kontrol, Elektriksel süreklilik kontrolü, Ölçüm ve testler, Kalibrasyon, Ürünlerin sevki, Müşteri şikâyetleri, Tedarikçi uygunsuzlukları, İç tetkikler, Dış tetkikler, TS EN 61537 kapsamında yapılan deney ve kontroller, Kalite yönetim sistemi uygunsuzlukları ile ilgili DÖF faaliyetlerini kapsar.

---

## 3. TANIMLAR
### 3.1 Uygunsuzluk
Bir ürünün, prosesin, hizmetin veya kalite yönetim sistemi faaliyetinin belirlenmiş şartları karşılamaması durumudur.
### 3.2 Düzeltme
Tespit edilen uygunsuzluğu ortadan kaldırmak amacıyla yapılan anlık işlemdir. *(Örn: Yanlış ölçüde üretilmiş bir parçanın yeniden kesilmesi)*
### 3.3 Düzeltici Faaliyet
Uygunsuzluğun temel nedenini ortadan kaldırarak uygunsuzluğun tekrar oluşmasını önlemek amacıyla gerçekleştirilen faaliyettir. *(Örn: Kesim ölçüsü hatasında teknik resim revizyon kontrol prosedürünün değiştirilmesi)*
### 3.4 Önleyici Faaliyet / Potansiyel Uygunsuzluk
Potansiyel bir uygunsuzluğun henüz gerçekleşmeden önce belirlenmesi ve oluşmasını önlemek amacıyla alınan faaliyettir.
### 3.5 Kök Neden
Uygunsuzluğun ortaya çıkmasına neden olan ve ortadan kaldırıldığında aynı veya benzer uygunsuzluğun tekrar oluşma ihtimalini azaltan temel nedendir.
### 3.6 DÖF
Düzeltici ve Önleyici Faaliyetlerin genel adıdır.

---

## 4. SORUMLULUKLAR
* **Genel Müdür (İbrahim Sert):** DÖF sisteminin uygulanması için kaynak sağlar. Kritik uygunsuzluklarda nihai kararları verir, üretimin veya sevkiyatın durdurulmasını onaylar. YGG toplantılarında sonuçları değerlendirir.
* **Kalite Yönetim Müdürü (Faruk Oruç):** DÖF sisteminin uygulanmasından sorumludur. [DÖF Talep ve Takip Formu](doc://FR-004) kayıtlarını oluşturur, kök neden analizlerini koordine eder, [DÖF Takip Defteri](doc://KR-005) üzerinden takibini yapar, etkinliği doğrular ve kapatır.
* **Üretim Sorumlusu:** Üretim kaynaklı uygunsuzlukları bildirir, uygunsuz ürünün ayrılmasını ve düzeltici üretim faaliyetlerini uygular.
* **Kalite Kontrol Personeli:** Uygunsuzluğu tespit eder, ürünü etiketleyip karantinaya alır, düzeltme sonrası ürünü tekrar kontrol eder.
* **Satın Alma / Tedarik Sorumlusu:** Tedarikçi kaynaklı uygunsuzluklarda tedarikçiden DÖF talep eder.
* **Tüm Çalışanlar:** Tespit ettikleri uygunsuzluk veya riskleri bildirmekle yükümlüdür.

---

## 5. UYGUNSUZLUK KAYNAKLARI
DÖF şu 20 ana kaynaktan başlatılabilir: Hammadde giriş kontrolü, Üretim içi kontrol, Son kontrol, Laboratuvar/deney sonuçları, TS EN 61537 deney sonuçları, Ölçüm ve test sonuçları, Kalibrasyon sonuçları, Müşteri şikâyeti ([FR-016](doc://FR-016)), Müşteri iadesi, Sevkiyat hatası, Tedarikçi uygunsuzluğu, İç tetkik, Dış tetkik, Belgelendirme kuruluşu bulguları, YGG, Proses performans sonuçları, Risk değerlendirmeleri, Çalışan bildirimi, Tekrarlayan imalat hataları, Potansiyel uygunsuzluklar.

---

## 6. DÖF BAŞLATILMASI VE SINIFLANDIRMA
* **A – Kritik Uygunsuzluk:** Ürün güvenliği, TS EN 61537 uygunluğu (SWL sehim L/100, elektriksel süreklilik < 50 mΩ), yanlış malzeme kullanımı gibi durumlar. Ürün derhal kontrol altına alınır ve sevkiyat durdurulur.
* **B – Önemli Uygunsuzluk:** Büküm ölçü sapması, kaplama mikron hatası, etiketleme eksikliği.
* **C – Minör Uygunsuzluk:** Sistem veya ürün uygunluğunu doğrudan kritik etkilemeyen sapmalar.

---

## 7. UYGUNSUZ ÜRÜNÜN KONTROLÜ
Uygunsuz ürün; [Uygun Olmayan Ürün ve Karantina Etiketi Formu](doc://FR-017) ile kırmızı/sarı etiketlenir, karantina alanına alınır. Yeniden işleme, tamir, hurda veya müşteri onayı ile şartlı kabul kararı uygulanır.

---

## 8. DÜZELTME FAALİYETİ
Uygunsuzluk tespit edildiğinde anlık düzeltme yapılır (Yeniden kesim, büküm düzeltme, kaplama tazeleme, etiket değişimi vb.). Düzeltme yapılması tek başına DÖF'ün kapatılması anlamına gelmez.

---

## 9. KÖK NEDEN ANALİZİ
DÖF açılan konularda 5 Neden Analizi, Balık Kılçığı (Ishikawa), 5M1E veya Pareto analizi kullanılır. Yalnızca "operatör hatası" denmesi kabul edilmez; sistemsel kök neden tespit edilir.

---

## 10. BENZER UYGUNSUZLUKLARIN ARAŞTIRILMASI
Bir uygunsuzlukta aynı sipariş, aynı parti, aynı makine, aynı vardiya ve aynı ürün ailesindeki diğer ürünler de kontrol edilir.

---

## 11. DÜZELTİCİ FAALİYET PLANLAMASI
DÖF kaydında DÖF No (Örn: DÖF-2026-001), Kaynak, Tanım, Etki, Düzeltme, Kök Neden, Aksiyon, Sorumlu, Termin ve Doküman Revizyon ihtiyaçları belirtilir.

---

## 12. DÜZELTİCİ FAALİYET ÖRNEKLERİ
1. **Ölçü Uygunsuzluğu:** Güncel olmayan teknik resim kullanımı kök nedeni -> Üretim alanındaki resimlerin revize edilmesi ve eski nüshaların toplatılması.
2. **Elektriksel Süreklilik Uygunsuzluğu:** Bağlantı ek noktasında direncin > 50 mΩ çıkması -> Ek parçası yüzey temizleme talimatının ([TL-009](doc://TL-009)) revize edilmesi.
3. **Yüzey Kaplama Uygunsuzluğu:** Fason galvanizde kaplama kalınlığının eksik kalması -> Tedarikçiye teknik şartname iletilmesi ve [Fason Giriş Kontrol Formu](doc://FR-014) ile kontrolü.

---

## 13. ÖNLEYİCİ FAALİYET / POTANSİYEL UYGUNSUZLUK
Yeni ürün, yeni makine, yeni hammadde veya TS EN 61537 yeniliklerinde potansiyel riskler değerlendirilerek henüz hata oluşmadan önleyici faaliyet başlatılır.

---

## 14. FAALİYETLERİN ETKİNLİĞİNİN DOĞRULANMASI
Faaliyetin uygulanmasından sonra sonraki 3 üretim partisinde veya belirlenen periyotta etkinliği kontrol edilir. Tekrarlamıyorsa DÖF etkin kabul edilir.

---

## 15. DÖF KAPATMA KRİTERLERİ & 16. DÖF'ÜN KAPATILMASI
10 maddelik kriter kontrolü tamamlandıktan sonra **Kalite Yönetim Müdürü (Faruk Oruç)** onayı ile DÖF kapatılır. Kapanış Kararı: Etkin / Kısmen Etkin / Etkin Değil.

---

## 17. DÖF NUMARALANDIRMA
DÖF kayıtları her yıl 001'den başlayarak **DÖF-2026-001**, DÖF-2026-002 şeklinde numaralandırılır.

---

## 18. DÖF KAYITLARININ SAKLANMASI & 19. DÖF PERFORMANSININ İZLENMESİ
Fotoğraf, ölçüm raporu, deney raporu vb. kanıtlar [DÖF Takip Defteri](doc://KR-005) bünyesinde muhafaza edilir. Kapanış süreleri ve etkinlik oranları YGG toplantılarında değerlendirilir.

---

## 20. TS EN 61537 İLE İLİŞKİLİ DÖF KAYNAKLARI
Kablo tavası/merdiveni boyutları, SWL mekanik sehim, elektriksel süreklilik, topraklama, korozyon dayanımı ve ürün etiketleme konularındaki tüm TS EN 61537 uygunsuzlukları doğrudan DÖF sistemine tabidir.

---

## 21. DÖF SÜREÇ AKIŞI
**Tepsi / İmalat / Test Uygunsuzluk Tespiti** -> **Karantinaya Alma** -> **Düzeltme** -> **5 Neden Kök Neden Analizi** -> **Aksiyon & Sorumlu** -> **Etkinlik Doğrulama** -> **Kalite Müdürü Kapatma Onayı**.

---

## 22. İLGİLİ FORMLAR VE DOKÜMANLAR
* [FR-004 | DÖF Talep ve Takip Formu](doc://FR-004)
* [KR-005 | DÖF Takip Defteri](doc://KR-005)
* [FR-017 | Uygun Olmayan Ürün ve Karantina Etiketi Formu](doc://FR-017)
* [FR-016 | Müşteri Şikayet Kayıt ve Takip Formu](doc://FR-016)
* [FR-008 | TS EN 61537 SWL Yük Test Formu](doc://FR-008)
* [FR-011 | TS EN 61537 Elektriksel Süreklilik Muayene Formu](doc://FR-011)`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-005',
      title: 'İç Tetkik Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-005', 'KR-005'],
      content: `# PR-005 İç Tetkik Prosedürü

## 1. Amaç
Kalite yönetim sisteminin etkinliğini bağımsız ve planlı iç tetkiklerle doğrulamak.

## 2. Tetkik Süreci
- Yılda en az bir kez iç tetkik düzenlenir.
- Tetkikçiler [İç Tetkik Soru Listesi](doc://FR-005) hazırlayarak saha kontrolleri gerçekleştirir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-006',
      title: 'Satış, Fiyat Teklifi ve Sipariş Yönetimi Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-013'],
      content: `# PR-006 Satış, Fiyat Teklifi ve Sipariş Yönetimi Prosedürü

## 1. Amaç
Müşteri taleplerinin alınması, fiyat tekliflerinin hazırlanması ve teknik olarak siparişlerin üretime aktarılması adımlarını tanımlar.

## 2. Sipariş Onay Süreci
- Teklifler [Fiyat Teklif Hazırlama ve Fizibilite Formu](doc://FR-013) ile hazırlanır.
- Uygunluk fizibilite analizi onaylandıktan sonra teklifler siparişe dönüştürülür.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-007',
      title: 'Üretim, İzlenebilirlik ve Proses Kontrol Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-009', 'TL-008', 'KR-006'],
      content: `# PR-007 Üretim, İzlenebilirlik ve Proses Kontrol Prosedürü

## 1. Amaç
Rollforming büküm, kesme ve delme makinelerinde yürütülen imalat süreçlerinin izlenebilirlik kuralları altında proses kontrolünü tanımlar.

## 2. Üretim Akışı
- İş emirleri doğrultusunda operatör [Rollforming Büküm Proses Talimatı](doc://TL-008) uyarınca ayarları yapar.
- Günlük imalat verileri [Günlük Proses ve Ara Kontrol Formu](doc://FR-009) ile toplanır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-008',
      title: 'Muayene, Girdi Kabul ve Son Kontrol Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-010', 'FR-015', 'FR-017', 'TL-006', 'TL-007', 'KR-004', 'KR-006'],
      content: `# PR-008 Muayene, Girdi Kabul ve Son Kontrol Prosedürü

## 1. Amaç ve Kapsam
SIES fabrikasına gelen rulo sac hammaddelerinin giriş muayenelerinden başlayarak, imalat prosesi ve sevkiyat öncesi ürün doğrulama muayene faaliyetlerini kapsar.

## 2. Hammadde Kabul ve Girdi Muayene Akışı (Kabul / Ret / Şartlı Kabul)
Fabrikaya ulaşan tüm hammaddeler (rulo sac, bağlantı parçaları, cıvata/somun vb.) girdi kontrol sahasına alınır ve **Girdi Kontrol ve Giriş Muayene Talimatı (TL-006)** doğrultusunda muayene edilir:
- **Boyut ve Kalınlık Kontrolü:** Kumpas ve mikrometre ile sac kalınlığı ölçülür.
- **Kaplama Kontrolü:** Mikron ölçer ile çinko kaplama kalınlığı ölçülür.

### 2.1 Muayene Kararları ve Etiketleme:
1. **KABUL (Uygun):** Hammadde tüm kriterleri karşılıyorsa **YEŞİL ETİKET** yapıştırılır, [Giriş Kalite Kontrol Formu](doc://FR-015) doldurulur, [Girdi Kabul Defteri'ne](doc://KR-004) 'Kabul' olarak kaydedilir ve hammadde deposuna alınır.
2. **RET (Uygunsuz):** Hammadde kalınlık veya kaplama kriterlerini karşılamıyorsa **KIRMIZI ETİKET** yapıştırılır, ürün karantina sahasına alınır. [Uygun Olmayan Ürün Formu](doc://FR-017) düzenlenir ve [DÖF Prosedürü](doc://PR-004) kapsamında tedarikçiye hata bildirilir.
3. **ŞARTLI KABUL:** Tolerans limitleri dışında ancak kullanıma engel teşkil etmeyen (TS EN 61537 defleksiyon güvenliğini bozmayan) durumlarda, Kalite Temsilcisi ve Fabrika Müdürü onayı ile **SARI ETİKET** yapıştırılarak 'Şartlı Kabul' olarak üretimde kullanılabilir.

## 3. Üretim ve Son Kontrol Muayenesi
- Mamul ürünler sevk edilmeden önce [Son Kontrol Formu](doc://FR-010) ile nihai boyutsal ve kaplama muayenesinden geçirilir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-009',
      title: 'Fason Kaplama ve Dış Kaynaklı Prosesler Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-014', 'KR-008'],
      content: `# PR-009 Fason Kaplama ve Dış Kaynaklı Prosesler Prosedürü

## 1. Amaç
Sıcak daldırma galvaniz kaplama veya fason boya işlemlerine gönderilen ürünlerin fason tedarikçideki kalite güvencesini yönetmek.

## 2. Kalite Kontrol
- Fason kaplama sonrası gelen ürünler [Fason Kaplama Kalınlığı ve Giriş Kontrol Formu](doc://FR-014) ile kaplama mikron kalınlığı testlerine tabi tutulur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-010',
      title: 'Uygun Olmayan Ürünün ve Hatalı Girdilerin Kontrolü Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-017', 'KR-005'],
      content: `# PR-010 Uygun Olmayan Ürünün ve Hatalı Girdilerin Kontrolü Prosedürü

## 1. Amaç
Kalite kontrollerde uygunsuz bulunan girdilerin ve hatalı mamullerin yanlışlıkla sevk edilmesini veya kullanılmasını engellemek amacıyla etiketlenmesi ve karantinaya alınması sürecini yönetmektir.

## 2. Uygulama
- Uygunsuz hammadde veya mamul [Uygun Olmayan Ürün ve Karantina Etiketi](doc://FR-017) ile etiketlenerek kırmızı karantina çizgisi içine çekilir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-011',
      title: 'Müşteri Geri Bildirimleri ve Şikayet Yönetimi Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-016', 'KR-009'],
      content: `# PR-011 Müşteri Geri Bildirimleri ve Şikayet Yönetimi Prosedürü

## 1. Amaç
Müşteri şikayetlerinin kaydedilmesi, kök nedenlerinin analizi ve müşteri memnuniyetinin artırılmasını sağlamak.

## 2. Aksiyon Planı
- Müşteriden gelen şikayetler [Şikayet Kayıt Formu](doc://FR-016) ile sisteme girilir ve derhal aksiyon alınır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-012',
      title: 'TS EN 61537 Ürün Test ve Doğrulama Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-008', 'FR-011', 'TL-001', 'TL-009'],
      content: `# PR-012 TS EN 61537 Ürün Test ve Doğrulama Prosedürü

## 1. Amaç
Kablo kanalı taşıma sistemlerinin mekanik dayanım (SWL) ve elektriksel süreklilik özelliklerinin test edilmesini tanımlar.

## 2. Testler
- Mekanik dayanım [TS EN 61537 Mekanik Yük (SWL) Test Formu](doc://FR-008) ile doğrulanır.
- Süreklilik testi [Elektriksel Süreklilik Muayene Formu](doc://FR-011) ile kayıt altına alınır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-013',
      title: 'Kurumsal Risk ve Fırsat Değerlendirme Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-007'],
      content: `# PR-013 Kurumsal Risk ve Fırsat Değerlendirme Prosedürü

## 1. Amaç ve Kapsam
SIES ELEKTRİK süreçlerinde (Tedarik, Üretim, Kalite, İSG, Müşteri İlişkileri) oluşabilecek risklerin önceden tespit edilerek derecelendirilmesi ve fırsatların değerlendirilmesi yöntemini belirler.

## 2. Risk Değerlendirme Yöntemi (L Matrisi)
- Risk Puanı = Olasılık (1-5) x Şiddet (1-5)
- Risk Puanı >= 12 olan konular için acil önleyici aksiyon planlanır ve [Risk Analiz ve Değerlendirme Matrisi](doc://FR-007) güncellenir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-014',
      title: 'Yönetimin Gözden Geçirmesi (YGG) Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-019', 'PL-001'],
      content: `# PR-014 Yönetimin Gözden Geçirmesi (YGG) Prosedürü

## 1. Amaç
Kalite Yönetim Sisteminin uygunluğunu, yeterliliğini ve etkinliğini sürekli kılmak amacıyla yılda en az bir kez üst yönetim katılımıyla gözden geçirme toplantısı yapılması sürecini tanımlar.

## 2. YGG Girdileri ve Çıktıları
- **Girdiler:** İç tetkik sonuçları, müşteri geri bildirimleri, proses performansları, DÖF durumları, risk matrisi.
- **Çıktılar:** [YGG Toplantı Tutanağı](doc://FR-019) ile kayıt altına alınır ve yeni dönem kalite hedefleri [Yıllık Kalite Hedefleri Planı](doc://PL-001) içerisine aktarılır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PR-015',
      title: 'İnsan Kaynakları, Eğitim ve Yetkinlik Yönetimi Prosedürü',
      type: 'PR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'FR-006', 'PL-004', 'KR-010'],
      content: `# PR-015 İnsan Kaynakları, Eğitim ve Yetkinlik Yönetimi Prosedürü

## 1. Amaç
SIES ELEKTRİK bünyesinde çalışan personelin görev yetkinliklerinin belirlenmesi, eğitim ihtiyaçlarının tespiti ve yıllık eğitim planına göre kişisel gelişimlerinin takibini kapsar.

## 2. Eğitim Süreci
- Yıl başında [Yıllık Personel Eğitim Planı](doc://PL-004) hazırlanır.
- Gerçekleştirilen eğitimler [Personel Eğitim Katılım Formu](doc://FR-006) ile kayıt altına alınır ve [Personel Eğitim Takip Defteri'ne](doc://KR-010) işlenir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },

    // Plans (PL-001 to PL-006)
    {
      id: 'PL-001',
      title: 'Yıllık Kalite Hedefleri ve Proses İyileştirme Planı',
      type: 'PL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'PR-014', 'FR-019'],
      content: `# PL-001 Yıllık Kalite Hedefleri ve Proses İyileştirme Planı

## 1. Amaç
SIES ELEKTRİK üst yönetimi tarafından belirlenen yıllık stratejik kalite hedeflerinin, proses bazında sorumluları, ölçüm parametreleri ve takip periyotlarını tanımlar.

## 2. 2026 Yılı Kalite Hedefleri
| No | Proses | Kalite Hedefi | Hedef Değer | Takip Periyodu | Sorumlu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| H-01 | Üretim | Hurdada Düşüş Oranı | < %1.2 | Aylık | Fabrika Müdürü |
| H-02 | Kalite | Müşteri Şikayet Sayısı | Max 2 Adet/Yıl | Üç Aylık | Kalite Temsilcisi |
| H-03 | Satınalma | Zamanında Girdi Teslimatı | > %95 | Üç Aylık | Satınalma Müdürü |
| H-04 | Ar-Ge / Test | TS EN 61537 SWL Yük Test Başarısı | %100 | Altı Aylık | Kalite Uzmanı |`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PL-002',
      title: 'Yıllık Cihaz ve Ekipman Kalibrasyon Planı',
      type: 'PL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-003', 'FR-002', 'KR-003', 'TL-003'],
      content: `# PL-002 Yıllık Cihaz ve Ekipman Kalibrasyon Planı

## 1. Amaç
SIES ELEKTRİK kalıphane, imalat ve kalite kontrol bünyesindeki kumpas, mikrometre, kaplama mikron ölçer ve test cihazlarının TÜRKAK akredite kalibrasyon tarihlerinin yıllık planlanmasıdır.

## 2. Kalibrasyon Takvimi
- Tüm ölçüm cihazları [Cihaz Kalibrasyon Takip Defteri](doc://KR-003) ile takip edilir.
- Periyodu yaklaşan cihazlar için akredite laboratuvardan randevu alınarak dış kalibrasyon yaptırılır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PL-003',
      title: 'Yıllık İç Tetkik Planı',
      type: 'PL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-005', 'FR-005'],
      content: `# PL-003 Yıllık İç Tetkik Planı

## 1. Amaç
ISO 9001:2015 ve TS EN 61537 yönetim sisteminin tüm birimlerde bağımsız denetçiler tarafından denetlenmesi takvimidir.

## 2. Denetim Periyotları
- **Haziran:** Yönetim, Kalite, Satınalma, Satış Departmanları Tetkiki.
- **Aralık:** Üretim, Bakım, Depo ve Sevkiyat Departmanları Tetkiki.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PL-004',
      title: 'Yıllık Personel Eğitim Planı',
      type: 'PL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-015', 'FR-006', 'KR-010'],
      content: `# PL-004 Yıllık Personel Eğitim Planı

## 1. Amaç
Çalışanların teknik yetkinliklerini ve kalite bilincini artırmak amacıyla düzenlenen yıllık iç ve dış eğitim programıdır.

## 2. Eğitim Konuları
- **Q1:** TS EN 61537 Standart Gereksinimleri ve Mekanik Yük Sınıfları (Tüm Üretim Personeli).
- **Q2:** Ölçüm Aletleri Kullanımı, Kumpas ve Mikron Ölçer Okuma (Kalite Operatörleri).
- **Q3:** ISO 9001:2015 Kalite Bilinci ve Karantina Etiketleme Kuralları (Tüm Çalışanlar).
- **Q4:** İSG ve İş Güvenliği Standartları (Fabrika Geneli).`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PL-005',
      title: 'Yıllık Önleyici Makine ve Hat Bakım Planı',
      type: 'PL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-007', 'FR-003', 'TL-004'],
      content: `# PL-005 Yıllık Önleyici Makine ve Hat Bakım Planı

## 1. Amaç
Rollforming profil çekme makineleri, presler ve perfore delme hattında arıza süresini minimuma indirmek amacıyla yürütülen planlı bakımlardır.

## 2. Bakım Rutinleri
- **Haftalık:** Makaraların greslenmesi, hidrolik yağ seviyesi kontrolü.
- **Aylık:** Büküm kalıp aşınma kontrolü, bıçak bileleme, emniyet sensörü testi.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'PL-006',
      title: 'TS EN 61537 Fabrika Üretim Kontrolü (FÜK) ve Tip Deneyi Kalite Planı',
      type: 'PL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012', 'FR-008', 'FR-011', 'FR-018', 'TL-001', 'TL-009'],
      content: `# PL-006 TS EN 61537 Fabrika Üretim Kontrolü (FÜK) ve Tip Deneyi Kalite Planı

## 1. Amaç
SİES ELEKTRİK markalı kablo tavaları ve merdivenlerinin TS EN 61537 standart şartlarına uygunluğunun sürekli doğrulanmasını garanti eden fabrika denetim ve tip testi planıdır.

## 2. Kontrol Matrisi
- **Tip Testleri (Periyodik 2 Yıl):** Mekanik Güvenli Çalışma Yükü (SWL) L/100 sehim testi, Tuz pürskürtme korozyon direnci, Darbe direnci.
- **Rutin Kontroller (Her İmalat Partisi):** Sac kalınlığı, profil boyutları, çapak kontrolü, galvaniz mikron kalınlığı ve ek parça elektriksel sürekliliği.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },

    // Instructions (TL-001 to TL-011)
    {
      id: 'TL-001',
      title: 'Kablo Kanalı Mekanik Test Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012', 'FR-008'],
      content: `# TL-001 Kablo Kanalı Mekanik Test Talimatı

Kablo tavalarının TS EN 61537 standart Madde 10.4 kapsamında sehim sehpası üzerinde test yükleri altında L/100 sehim sınırını aşmayacak şekilde mekanik yük dayanım testlerinin yapılması adımlarını tanımlar.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-002',
      title: 'Korozyon Direnci Test Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012'],
      content: `# TL-002 Korozyon Direnci Test Talimatı

Tuz püskürtme (salt spray) test cihazının hazırlanması ve çinko kaplamalı metal numunelerin korozyon sınıflarına göre kabin içinde bekletilerek test edilmesi talimatıdır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-003',
      title: 'Ölçüm Cihazı Kalibrasyon Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-003', 'FR-012'],
      content: `# TL-003 Ölçüm Cihazı Kalibrasyon Talimatı

Kumpaslar, mikrometreler ve mikron ölçer kaplama kalınlığı cihazlarının standart mastarlar kullanılarak sıfırlanması ve ara doğrulamalarının gerçekleştirilmesini tarif eder.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-004',
      title: 'Makine Önleyici Bakım Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-007', 'FR-003'],
      content: `# TL-004 Makine Önleyici Bakım Talimatı

Profil çekme (rollforming) makineleri ve eksantrik preslerin günlük, haftalık ve periyodik yağlama, mekanik aşınma ve emniyet kilidi kontrollerini tanımlar.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-005',
      title: 'Ürün Son Kontrol Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'FR-010'],
      content: `# TL-005 Ürün Son Kontrol Talimatı

İmalatı tamamlanan kablo kanalı partilerinin sevkiyat öncesi nihai görsel, boyutsal, çapak durumu ve galvaniz mikron kalınlık kontrollerinin gerçekleştirilmesini tanımlar.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-006',
      title: 'Girdi Kontrol ve Giriş Muayene Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'FR-015', 'FR-017'],
      content: `# TL-006 Girdi Kontrol ve Giriş Muayene Talimatı

## 1. Muayene Yöntemi
SIES fabrikasına kabul edilecek olan rulo saclar, profiller ve cıvata-somun paketleri girdi kontrol alanında bekletilir.
- **Kumpas ve Mikrometre ile Kalınlık Ölçümü:** Sac et kalınlığı ölçülür. Tolerans limitleri kontrol edilir.
- **Mikron Ölçer ile Kaplama Kontrolü:** Pregalvaniz saclarda kaplama kalınlığı mikron cihazıyla ölçülür.

## 2. Etiketleme ve Sınıflandırma
- **Kabul:** Tüm şartlar uygunsa **YEŞİL ETİKET** basılır ve [Giriş Kalite Kontrol Formu](doc://FR-015) doldurulur.
- **Ret:** Kalınlık veya kaplama standardı kurtarmıyorsa sac rulolarına **KIRMIZI ETİKET** yapıştırılarak karantinaya alınır.
- **Şartlı Kabul:** Kalite ve Fabrika Müdürü ortak kararı ile sadece uygun tolerans aralığındaki sapmalar için **SARI ETİKET** yapıştırılarak onaylanır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-007',
      title: 'Kaplama Kalınlığı Ölçüm Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'PR-009', 'FR-014'],
      content: `# TL-007 Kaplama Kalınlığı Ölçüm Talimatı

Manyetik kaplama kalınlığı ölçüm (mikron) cihazının standart kalibrasyon folyoları ile sıfırlanması ve çinko kaplamalı saç yüzeylerinden homojen olarak en az 5 noktadan ölçüm alınması adımlarıdır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-008',
      title: 'Rollforming Büküm Proses Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-007', 'FR-009'],
      content: `# TL-008 Rollforming Büküm Proses Talimatı

Rollforming sac şekillendirme hatlarında makaraların konum ayarları, büküm açısı doğrulamaları ve delme kalıp eksen kaçıklığı ayarlarını tarif eder.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-009',
      title: 'Topraklama ve Elektriksel Süreklilik Deney Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012', 'FR-011'],
      content: `# TL-009 Topraklama ve Elektriksel Süreklilik Deney Talimatı

TS EN 61537 Madde 11.1 uyarınca kablo kanalı ek eklemelerindeki elektriksel sürekliliğin (direnç limitinin < 50 mΩ) mikro-ohm metre cihazıyla ölçülmesini ve kayıt altına alınmasını tanımlar.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-010',
      title: 'TDF (Enine Sapma) Hesaplama Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012'],
      content: `# TL-010 TDF (Enine Sapma) Hesaplama Talimatı

Asimetrik kablo yüklemesi altında kablo kanalının yan duvarlarında ve taban yapısında oluşabilecek enine sehimlerin ve burulma gerilmelerinin hesaplanması talimatıdır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-011',
      title: 'UDL (Düzgün Yayılı Yük) Hesaplama Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012'],
      content: `# TL-011 UDL (Düzgün Yayılı Yük) Hesaplama Talimatı

Kablo tava ve merdivenlerinin düzgün yayılı yük taşıma kapasitelerinin (UDL) mukavemet ve moment denklemleri vasıtasıyla hesaplanması yöntemini açıklar.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-012',
      title: 'Kablo Merdiveni Kaynak ve Birleştirme Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-007', 'FR-009'],
      content: `# TL-012 Kablo Merdiveni Kaynak ve Birleştirme Talimatı

## 1. Uygulama Adımları
Kablo merdivenlerinde yan profiller ile basamak (rung) profillerinin perçin veya MIG/MAG robot kaynak birleştirmeleri esnasında kaynak akımı, gaz karışımı ve birleşim dayanım kontrollerinin yapılması adımlarını tanımlar.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'TL-013',
      title: 'Karantina Sahası Yönetimi ve Renkli Etiket Yapıştırma Talimatı',
      type: 'TL',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'PR-010', 'FR-015', 'FR-017'],
      content: `# TL-013 Karantina Sahası Yönetimi ve Renkli Etiket Yapıştırma Talimatı

## 1. Amaç
Hammadde giriş muayene, proses veya son kontrol aşamalarında uygunsuz veya şartlı kabul kararı verilen ürünlerin fiziksel olarak karışmasını önlemek amacıyla etiketlenmesi ve yönetimidir.

## 2. Etiket Standartları ve Kuralları
- **YEŞİL ETİKET (KABUL):** Tüm boyutsal ve kaplama şartlarını tam karşılayan girdiler ve ürünler üzerine yapıştırılır. Depoya sevk edilir.
- **KIRMIZI ETİKET (RET / KARANTİNA):** Tolerans dışı, hatalı veya hasarlı girdiler/ürünler üzerine yapıştırılır. Ürün derhal Kırmızı Karantina Sahası çizgisi içine çekilir. [Uygun Olmayan Ürün Formu](doc://FR-017) düzenlenir.
- **SARI ETİKET (ŞARTLI KABUL):** Fonksiyona ve TS EN 61537 defleksiyon güvenliğine zarar vermeyen minimal tolerans sapmalarında Kalite Temsilcisi ve Fabrika Müdürü ortak onayı ile yapıştırılır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },

    // Lists (LS-001 to LS-006)
    {
      id: 'LS-001',
      title: 'Güncel Doküman Ana Listesi',
      type: 'LS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'PR-001', 'KR-001'],
      content: `# LS-001 Güncel Doküman Ana Listesi

SIES ELEKTRİK Kalite Yönetim Sistemi bünyesinde yürürlükte bulunan tüm Kalite El Kitabı, Prosedürler, Planlar, Talimatlar, Formlar, Listeler ve Kayıt Defterlerinin kod, başlık, revizyon numarası ve yayın tarihlerini gösteren master doküman listesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'LS-002',
      title: 'Dış Kaynaklı Dokümanlar ve Standartlar Listesi',
      type: 'LS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'PR-001'],
      content: `# LS-002 Dış Kaynaklı Dokümanlar ve Standartlar Listesi

| Standart Kodu | Standart Adı | Güncel Versiyon | Takip Sorumlusu |
| :--- | :--- | :--- | :--- |
| **TS EN 61537** | Kablo Yönetimi - Kablo Tava ve Merdiven Sistemleri | 2007 (TS EN 61537:2007) | Kalite Temsilcisi |
| **TS EN ISO 9001** | Kalite Yönetim Sistemleri - Şartlar | 2015 | Kalite Temsilcisi |
| **TS EN ISO 1461** | Demir ve Çelikten İmal Edilmiş Malzemeler Üzerine Sıcak Daldırma Galvaniz Kaplamalar | 2022 | Kalite Uzmanı |
| **TS EN 10346** | Yassı Çelik Ürünler - Sürekli Sıcak Daldırma Kaplanmış Saclar | 2015 | Girdi Muayene Sorumlusu |
| **TS EN ISO 14713** | Çinko Kaplamaların Korozyondan Korunması Rehberi | 2019 | Kalite Uzmanı |`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'LS-003',
      title: 'Onaylı Tedarikçiler ve Fason Kaplama Firmaları Listesi',
      type: 'LS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-002', 'PR-009', 'FR-001', 'KR-002'],
      content: `# LS-003 Onaylı Tedarikçiler ve Fason Kaplama Firmaları Listesi

SIES ELEKTRİK hammadde rulo sac, profil, cıvata-somun ve fason sıcak daldırma galvaniz kaplama hizmeti alınan onaylı tedarikçi firmalar ve yıllık değerlendirme skorları çizelgesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'LS-004',
      title: 'Üretim Makineleri, Kalıp ve Hat Envanter Listesi',
      type: 'LS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-007', 'PL-005', 'FR-003'],
      content: `# LS-004 Üretim Makineleri, Kalıp ve Hat Envanter Listesi

Fabrikadaki rollforming profil çekme hatları, eksantrik presler, perfore punch delme kalıpları, giyotin makaslar ve kaynak robotlarının model, imalat yılı ve seri numarası listesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'LS-005',
      title: 'Ölçüm Cihazları ve Kalibrasyon Listesi',
      type: 'LS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-003', 'PL-002', 'FR-002', 'KR-003'],
      content: `# LS-005 Ölçüm Cihazları ve Kalibrasyon Listesi

SIES ELEKTRİK bünyesinde aktif olarak kullanılan tüm kumpaslar, mikrometreler, kaplama mikron ölçer cihazları, terazi ve kantarlar ile TS EN 61537 sehim test sehpası cihazlarının izlenebilirlik takip envanteridir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'LS-006',
      title: 'Kablo Tava ve Merdiveni Standart Ölçü ve Tolerans Tablosu Listesi',
      type: 'LS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-007', 'PR-008', 'TL-006', 'TL-008'],
      content: `# LS-006 Kablo Tava ve Merdiveni Standart Ölçü ve Tolerans Tablosu Listesi

| Standart Genişlik (mm) | Standart Kenar Yüksekliği (mm) | Nominal Sac Kalınlığı (mm) | İzin Verilen Sac Kalınlık Toleransı | TS EN 61537 Genişlik Toleransı |
| :--- | :--- | :--- | :--- | :--- |
| 50 mm - 100 mm | 40 mm / 50 mm / 60 mm | 1.00 mm - 1.20 mm | ± 0.08 mm | ± 1.5 mm |
| 150 mm - 300 mm | 50 mm / 60 mm / 100 mm | 1.20 mm - 1.50 mm | ± 0.10 mm | ± 2.0 mm |
| 400 mm - 600 mm | 60 mm / 100 mm / 150 mm | 1.50 mm - 2.00 mm | ± 0.12 mm | ± 2.5 mm |`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },

    // Forms (FR-001 to FR-017)
    {
      id: 'FR-001',
      title: 'Tedarikçi Değerlendirme Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-002', 'KR-002'],
      content: `# FR-001 Tedarikçi Değerlendirme Formu

Tedarikçilerin kalite standartları, termin uyumu, fiyat uygunluğu ve sevk hassasiyeti yönünden puanlama tablosudur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-002',
      title: 'Ölçüm Cihazı Kalibrasyon Kartı',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-003', 'KR-003'],
      content: `# FR-002 Ölçüm Cihazı Kalibrasyon Kartı

Cihaz ID'si, kalibrasyon periyodu, kalibrasyon yapan kuruluş ve bir sonraki kalibrasyon tarihi bilgilerini içeren takip kartıdır.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-003',
      title: 'Periyodik Makine Bakım Kartı',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['TL-004'],
      content: `# FR-003 Periyodik Makine Bakım Kartı

Makinelerin haftalık, aylık ve yıllık mekanik, elektrik ve hidrolik bakım kontrol noktalarının işaretleme listesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-004',
      title: 'DÖF Talep ve Takip Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-004', 'KR-005'],
      content: `# FR-004 DÖF Talep ve Takip Formu

- Hata / Uygunsuzluk Açıklaması:
- Kök Neden Analizi (5 Neden Yöntemi):
- Düzeltici Aksiyonlar & Terminler:
- Doğrulama ve Kapatma Tarihi:`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-005',
      title: 'İç Tetkik Soru Listesi',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-005'],
      content: `# FR-005 İç Tetkik Soru Listesi

İç tetkik esnasında ilgili departman sorumlularına yöneltilecek ISO 9001 standardı uygunluk soruları listesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-006',
      title: 'Personel Eğitim Katılım Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['KR-010'],
      content: `# FR-006 Personel Eğitim Katılım Formu

Eğitim başlığı, eğitim süresi, eğitmen bilgisi ve eğitime katılan personelin imza listesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-007',
      title: 'Risk Analiz ve Değerlendirme Matrisi',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001'],
      content: `# FR-007 Risk Analiz ve Değerlendirme Matrisi

Departman süreçlerinde tespit edilen risklerin olasılık ve şiddet puanlarına göre L matrisi ile değerlendirilmesi formudur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-008',
      title: 'TS EN 61537 Mekanik Yük (SWL) Test Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012', 'TL-001'],
      content: `# FR-008 TS EN 61537 Mekanik Yük (SWL) Test Formu

Kablo kanalının tipi, kalınlığı, test açıklığı (destekler arası mesafe), yükleme miktarı ve ölçülen sehim (L/100 limit kontrolü) test raporudur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-009',
      title: 'Günlük Proses ve Ara Kontrol Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-007', 'TL-008', 'KR-006'],
      content: `# FR-009 Günlük Proses ve Ara Kontrol Formu

Üretim hattında saatlik periyotlarla yapılan sac kalınlığı, profil dış genişliği, büküm kalitesi ve boyutsal uygunluk kontrollerinin kayıt çizelgesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-010',
      title: 'Üretim Son Kontrol ve Sevk Onay Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'TL-005', 'KR-006'],
      content: `# FR-010 Üretim Son Kontrol ve Sevk Onay Formu

Mamul depo teslimatı ve sevkiyat öncesi, irsaliye bazında seçilen kablo kanalı paketlerinin nihai kaplama, etiket, miktar ve boyut kontrolleridir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-011',
      title: 'TS EN 61537 Elektriksel Süreklilik Muayene Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012', 'TL-009'],
      content: `# FR-011 TS EN 61537 Elektriksel Süreklilik Muayene Formu

Kablo tavası ek noktalarında mikro-ohm metre ile yapılan elektriksel direnç ölçümleri ve 50 mΩ limit uygunluk değerlendirme raporudur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-012',
      title: 'Kalibrasyon Ara Doğrulama ve Fonksiyon Kontrol Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-003', 'TL-003', 'KR-007'],
      content: `# FR-012 Kalibrasyon Ara Doğrulama ve Fonksiyon Kontrol Formu

Kumpas, kaplama mikron ölçer ve test cihazlarının mastar blokları ile yapılan ara fonksiyon kontrollerinin ve sapma miktarlarının izlendiği formdur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-013',
      title: 'Fiyat Teklif Hazırlama ve Fizibilite Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-006'],
      content: `# FR-013 Fiyat Teklif Hazırlama ve Fizibilite Formu

Müşteri özel talepleri için imalat fizibilitesi, standart büküm limitleri ve TS EN 61537 mukavemet kriterleri göz önünde bulundurularak hazırlanan fizibilite onay formudur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-014',
      title: 'Fason Kaplama Kalınlığı ve Giriş Kontrol Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-009', 'KR-008'],
      content: `# FR-014 Fason Kaplama Kalınlığı ve Giriş Kontrol Formu

Fason galvanizciden gelen kablo tavalarının mikron kaplama kalınlıklarının (Pregalvaniz min 12 µm, Sıcak Daldırma min 45 µm) ölçüm kontrol formudur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-015',
      title: 'Giriş Kalite Kontrol (Girdi Muayene) Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'TL-006', 'KR-004'],
      content: `# FR-015 Giriş Kalite Kontrol (Girdi Muayene) Formu

- Tedarikçi Adı ve İrsaliye No:
- Girdi Tipi (Sac rulo/Cıvata-Somun/Profil):
- Ebat ve Kalınlık Ölçümleri (Kumpas/Mikrometre):
- Kaplama Kalınlığı (µm - Mikron Ölçer):
- Muayene Sonucu (KABUL / RET / ŞARTLI KABUL):
- Açıklama & Karar Yetkilisi:`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-016',
      title: 'Müşteri Şikayet Kayıt ve Takip Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-011', 'KR-009'],
      content: `# FR-016 Müşteri Şikayet Kayıt ve Takip Formu

Müşterinin şikayet detayları, sevk irsaliyesi numarası, hatalı ürün fotoğraf referansı ve başlatılan DÖF numarası takip formudur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-017',
      title: 'Uygun Olmayan Ürün ve Karantina Etiketi Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'PR-010', 'FR-015', 'KR-005'],
      content: `# FR-017 Uygun Olmayan Ürün ve Karantina Etiketi Formu

- Uygunsuzluğun Tespit Edildiği İstasyon (Giriş Muayene/Proses/Son Kontrol):
- Hata Tanımı ve Hatalı Miktar:
- Karantina Etiket Seri No (Kırmızı/Sarı):
- Uygulanan Aksiyon (Hurda/Tedarikçiye İade/Yeniden İşleme/Şartlı Kabul):`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-018',
      title: 'TS EN 61537 Tip Deneyi Doğrulama Rapor Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-012', 'PL-006', 'FR-008', 'FR-011', 'TL-001', 'TL-009'],
      content: `# FR-018 TS EN 61537 Tip Deneyi Doğrulama Rapor Formu

## 1. Deney Özeti
- **Ürün Tipi / Kodu:** Kablo Tava / Merdiven Sistemleri
- **Uygulanan Standart:** TS EN 61537 Madde 10 (Mekanik Yük SWL), Madde 11 (Elektriksel Süreklilik), Madde 13 (Korozyon Direnci)
- **Destekler Arası Açıklık (L):** 1.50 m / 2.00 m / 3.00 m
- **Ölçülen Maksimum Sehim (mm):** (L/100 Sınırı = 15.0 mm / 20.0 mm)
- **Elektriksel Direnç (mΩ):** (Limit < 50 mΩ)
- **Sonuç Kararı:** GEÇTİ / KALDI`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'FR-019',
      title: 'Yönetimin Gözden Geçirmesi (YGG) Toplantı Tutanağı Formu',
      type: 'FR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-014', 'PL-001'],
      content: `# FR-019 Yönetimin Gözden Geçirmesi (YGG) Toplantı Tutanağı Formu

## 1. Toplantı Detayları
- **Toplantı Tarihi ve Yeri:** 
- **Katılımcılar:** Genel Müdür, Fabrika Müdürü, Kalite Temsilcisi, Satınalma Müdürü, Satış Sorumlusu
- **Gözden Geçirilen Konular:** Yıllık kalite hedefleri, iç tetkik bulguları, müşteri şikayetleri, tedarikçi performansları, risk analizi güncellemeleri.
- **Kararlaştırılan Aksiyonlar ve Sorumlular:**`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },

    // Registers (KR-001 to KR-010)
    {
      id: 'KR-001',
      title: 'Doküman Revizyon ve Dağıtım Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-001'],
      content: `# KR-001 Doküman Revizyon ve Dağıtım Defteri

| Doküman Kodu | Doküman Adı | Yayın Tarihi | Revizyon No | Revizyon Tarihi | Revizyon Gerekçesi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| QM-001 | Kalite El Kitabı | 20.02.2026 | 01 | 20.02.2026 | Tam entegre dijital sisteme geçiş |`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-002',
      title: 'Tedarikçi Değerlendirme Listesi',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-002', 'FR-001'],
      content: `# KR-002 Tedarikçi Değerlendirme Listesi

SIES onaylı tedarikçiler listesi ve yıllık performans puan tablosudur.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-003',
      title: 'Cihaz Kalibrasyon Takip Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-003', 'FR-002'],
      content: `# KR-003 Cihaz Kalibrasyon Takip Defteri

Tüm fabrikadaki kumpas, mikron ölçer ve test cihazlarının kalibrasyon tarih ve plan takip matrisidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-004',
      title: 'Girdi Kabul ve Giriş Kalite Kontrol Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'FR-015'],
      content: `# KR-004 Girdi Kabul ve Giriş Kalite Kontrol Defteri

| Tarih | Tedarikçi | Malzeme Tipi | İrsaliye No | Ölçülen Kalınlık | Kaplama (µm) | Kabul/Ret Kararı | Açıklama |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 12.01.2026 | Erdemir Sac | Rulo Sac (1.5mm) | SE1202601 | 1.48 mm | 14 µm | KABUL | Depoya sevk |
| 15.01.2026 | Başak Vida | Cıvata M8 | BS99823 | - | - | KABUL | Depoya sevk |
| 18.01.2026 | Borusan Çelik | Sac Rulo (2.0mm) | BR33029 | 1.82 mm | 8 µm | RET | Karantina / İade |`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-005',
      title: 'Düzeltici Önleyici Faaliyetler (DÖF) Takip Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-004', 'FR-004'],
      content: `# KR-005 Düzeltici Önleyici Faaliyetler (DÖF) Takip Defteri

Açılan tüm düzeltici ve önleyici faaliyet taleplerinin termin ve kapatma durumlarının takip çizelgesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-006',
      title: 'Üretim Proses Kontrol ve Son Kontrol Kayıt Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-007', 'PR-008', 'FR-009', 'FR-010'],
      content: `# KR-006 Üretim Proses Kontrol ve Son Kontrol Kayıt Defteri

Rollforming hatlarından çıkan ve sevkiyatı onaylanan son kontrol kayıtlarının genel listesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-007',
      title: 'Cihaz Ara Doğrulama Kayıt Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-003', 'FR-012'],
      content: `# KR-007 Cihaz Ara Doğrulama Kayıt Defteri

Ölçüm ekipmanlarının mastarlar ile yapılan haftalık ve aylık ara doğrulamalarının sapma kayıt listesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-008',
      title: 'Fason Kaplama Kontrol Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-009', 'FR-014'],
      content: `# KR-008 Fason Kaplama Kontrol Defteri

Fason sıcak daldırma galvaniz kaplamaya sevk edilen ve gelen kablo kanalı mikron ölçüm log listesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-009',
      title: 'Müşteri Şikayetleri ve Geri Bildirim Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-011', 'FR-016'],
      content: `# KR-009 Müşteri Şikayetleri ve Geri Bildirim Defteri

Müşterilerden gelen tüm teknik, boyutsal, sevkiyat veya kaplama kaynaklı şikayetlerin kapatılma sürelerini gösteren log çizelgesidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'KR-010',
      title: 'Personel Eğitim Takip Defteri',
      type: 'KR',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['FR-006'],
      content: `# KR-010 Personel Eğitim Takip Defteri

SIES elektrik bünyesindeki tüm mavi ve beyaz yakalı personelin kalite, İSG ve TS EN 61537 standart eğitim kayıt özetidir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },

    // Supporting Documents (DS-001 to DS-003)
    {
      id: 'DS-001',
      title: 'TS EN 61537 Kablo Taşıyıcı Sistemleri Standart Özet ve Muayene Kılavuzu',
      type: 'DS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['QM-001', 'PR-012', 'PL-006', 'FR-008', 'FR-011', 'TL-001', 'TL-009'],
      content: `# DS-001 TS EN 61537 Kablo Taşıyıcı Sistemleri Standart Özet ve Muayene Kılavuzu

## 1. Standart Kapsamı ve Genel Tanımlar
TS EN 61537 standardı, elektrik iletim ve haberleşme tesisatlarında kullanılan metalik kablo tava, kablo merdiveni ve bağlantı elemanlarının güvenlik, mekanik ve korozyon kriterlerini belirler.

## 2. Temel Deney Şartları
- **Madde 10.4 - Mekanik Yük (SWL) Deneyi:** Destek açıklığı L üzerinde uygulanan güvenli çalışma yükü altında maks sehim **L/100** değerini geçemez. Kalıcı şekil değiştirme % 10'u aşamaz.
- **Madde 11.1 - Elektriksel Süreklilik Deneyi:** Kablo tavalarının birbirine bağlantı ek noktalarında geçiş direnci **50 mΩ (0.05 Ohm)** değerinden küçük olmalıdır.
- **Madde 13 - Korozyon Direnci Sınıfları:** SİES pregalvaniz ürünler Sınıf 3-4, Sıcak Daldırma Galvaniz ürünler Sınıf 5-8 korozyon dayanım grubuna girer.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'DS-002',
      title: 'TS EN ISO 1461 ve Pregalvaniz Çinko Kaplama Kalınlık Standart Rehberi',
      type: 'DS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'PR-009', 'TL-007', 'FR-014'],
      content: `# DS-002 TS EN ISO 1461 ve Pregalvaniz Çinko Kaplama Kalınlık Standart Rehberi

## 1. Çinko Kaplama Kalınlık Limitleri
| Malzeme Tipi | Malzeme Et Kalınlığı (t) | Minimum Ortalama Kaplama Kalınlığı (µm - Mikron) | Minimum Yerel Kaplama Kalınlığı (µm) |
| :--- | :--- | :--- | :--- |
| **Pregalvaniz Sac (TS EN 10346 - Z275)** | t >= 1.0 mm | **18 - 20 µm** (Z275 iki yüzey toplamı) | 12 µm |
| **Sıcak Daldırma Galvaniz (TS EN ISO 1461)** | t < 1.5 mm | **45 µm** | 35 µm |
| **Sıcak Daldırma Galvaniz (TS EN ISO 1461)** | 1.5 mm <= t < 3.0 mm | **55 µm** | 45 µm |
| **Sıcak Daldırma Galvaniz (TS EN ISO 1461)** | t >= 3.0 mm | **70 µm** | 55 µm |`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    },
    {
      id: 'DS-003',
      title: 'TS EN 10346 Yapısal Sac ve Malzeme Spesifikasyon Şartnamesi',
      type: 'DS',
      revision: 1,
      revisionDate: date,
      preparedBy: author,
      approvedBy: approver,
      status: 'Onaylı',
      relatedDocs: ['PR-008', 'TL-006', 'LS-006'],
      content: `# DS-003 TS EN 10346 Yapısal Sac ve Malzeme Spesifikasyon Şartnamesi

## 1. Hammadde Sac Özellikleri
SIES imalatında kullanılan sürekli sıcak daldırma kaplanmış yassı çelik saclar TS EN 10346 kalitesinde tedarik edilir.
- **Malzeme Kalitesi:** DX51D+Z veya S250GD+Z yapısal çelik.
- **Yüzey Görünümü:** Normal pullu (N) veya minimize edilmiş pullu (M), pas lekesiz ve pürüzsüz.
- **Girdi Muayene Kriteri:** Sac kalınlığı kumpas/mikrometre ile kontrol edilir, çinko yapışma testi büküm alanında gözlemlenir.`,
      history: [{ revision: 1, date, description: 'İlk yayın', author }]
    }
  ];

  return documentsList.map(d => ({
    ...d,
    controlledBy: "Faruk Oruç (Kalite Temsilcisi)",
    formNumber: d.type === 'FR' ? d.id : undefined,
    history: d.history.map(h => ({
      ...h,
      description: "Kağıt tabanlı kalite yönetim sisteminden tam entegre dijital kalite yönetim sistemine geçiş kapsamında doküman revize edilmiştir."
    }))
  }));
}
function generateDefaultRisks(processes: Process[]): RiskOpportunity[] {
  const processNames = processes.map(p => p.name);
  if (processNames.length === 0) {
    processNames.push('Genel Yönetim', 'Üretim', 'Satınalma');
  }

  return [
    {
      id: 'R-01',
      type: 'Risk',
      description: 'Hammadde tedarikinde gecikme yaşanması ve üretimin durması',
      source: processNames.find(p => p.toLowerCase().includes('satın')) || processNames[0],
      probability: 3,
      severity: 4,
      score: 12,
      mitigationAction: 'Alternatif onaylı tedarikçiler belirlenecek ve kritik stok seviyeleri yükseltilecek.',
      owner: 'Satınalma Müdürü',
      status: 'Açık'
    },
    {
      id: 'R-02',
      type: 'Risk',
      description: 'Ölçüm cihazlarının kalibrasyon sürelerinin geçmesi sebebiyle hatalı test raporları düzenlenmesi',
      source: processNames.find(p => p.toLowerCase().includes('kalite')) || processNames[0],
      probability: 2,
      severity: 5,
      score: 10,
      mitigationAction: 'Cihaz kalibrasyon takip yazılımına otomatik e-posta bildirimleri entegre edilecek.',
      owner: 'Kalite Temsilcisi',
      status: 'Açık'
    },
    {
      id: 'R-03',
      type: 'Risk',
      description: 'Kablo kanalı büküm makinesinde arıza oluşması',
      source: processNames.find(p => p.toLowerCase().includes('üretim')) || processNames[0],
      probability: 3,
      severity: 3,
      score: 9,
      mitigationAction: 'Kritik yedek parçalar stokta tutulacak, önleyici periyodik bakımlar aksatılmayacak.',
      owner: 'Bakım Sorumlusu',
      status: 'Açık'
    },
    {
      id: 'F-01',
      type: 'Fırsat',
      description: 'TS EN 61537 sertifikalı ürünlerin ihracat pazarlarında tanıtılması',
      source: 'Satış / Pazarlama',
      probability: 4,
      severity: 4,
      score: 16,
      mitigationAction: 'Uluslararası fuarlara katılım sağlanacak, akredite test raporları katalogda sunulacak.',
      owner: 'Genel Müdür',
      status: 'Açık'
    }
  ];
}

function generateDefaultAudits(pers: Personnel[]): Audit[] {
  const auditor = pers[0]?.name || 'İç Tetkikçi';
  const auditee = pers.find(p => p.position.toLowerCase().includes('sorumlu') || p.position.toLowerCase().includes('müdür'))?.name || 'Departman Sorumlusu';
  
  return [
    {
      id: 'IA-001',
      title: '2026 1. Dönem İç Tetkik',
      planDate: '2026-06-15',
      actualDate: '2026-06-16',
      auditors: [auditor],
      auditees: [auditee],
      checklist: [
        { question: 'Kalite politikası çalışanlarca biliniyor mu? (Standart Md. 5.2)', result: 'Uygun', note: 'Rastgele 3 çalışana soruldu, politikanın farkında oldukları görüldü.' },
        { question: 'Dokümanlar revizyon takip sistemine uygun mu? (Standart Md. 7.5)', result: 'Uygun', note: 'Seçilen 5 prosedür kontrol edildi, güncel revizyonlar kullanılıyor.' },
        { question: 'Ölçüm cihazlarının kalibrasyon etiketleri güncel mi? (Standart Md. 7.1.5)', result: 'Uygunsuz', note: 'Üretimdeki Kumpas-01 cihazının kalibrasyon tarihi 3 gün geçmiş durumda.', capaId: 'DF-001' }
      ],
      status: 'Tamamlandı',
      findingsReport: 'İç tetkik tamamlanmıştır. 1 adet uygunsuzluk tespit edilmiş olup, düzeltici faaliyet başlatılmıştır.'
    }
  ];
}
function generateDefaultCapas(pers: Personnel[]): CAPA[] {
  const author = pers[0]?.name || 'Faruk Oruç';
  return [
    {
      id: 'DF-001',
      title: 'Ölçüm Cihazı (Kumpas-01) Kalibrasyon Gecikmesi',
      sourceType: 'Denetim',
      sourceId: 'IA-001',
      detectedDate: '2026-06-16',
      description: '16.06.2026 tarihli 1. Dönem İç Tetkik sırasında, üretim sahasında kullanılan Kumpas-01 cihazının kalibrasyon etiket tarihinin 3 gün geçmiş olduğu tespit edilmiştir.',
      immediateAction: 'Kumpas-01 cihazı derhal üretim hattından geri çekilerek karantinaya alınmış ve üzerine "KALİBRASYONU GEÇMİŞTİR - KULLANILAMAZ" kırmızı etiketi yapıştırılmıştır. Yerine kalibrasyonu güncel olan yedek Kumpas-02 verilmiştir.',
      rootCauseAnalysis: '1. Neden: Kalibrasyon planındaki tarihin takibi gözden kaçtı. 2. Neden: Cihaz sorumlusu operatörün vardiya değişiminde etiket kontrolü yapma alışkanlığı yoktu. 3. Neden: Ara doğrulama takip çizelgesine cihazın kalibrasyon bitiş tarihi sütunu eklenmemişti.',
      preventiveAction: 'Tüm ölçüm cihazlarının kalibrasyon bitiş tarihleri ara doğrulama takip formlarına (FR-012) sütun olarak eklenecek ve haftalık ara doğrulamalarda bu tarihlerin kontrol edilmesi zorunlu kılınacaktır.',
      assignedTo: author,
      targetDate: '2026-06-25',
      status: 'Kapalı',
      verificationDate: '2026-06-20',
      verificationResult: 'Kumpas-01 akredite kalibrasyon kuruluşuna gönderilerek kalibrasyonu yenilenmiş (Sertifika No: CAL-2026-889) ve yeni yeşil kalibrasyon etiketi yapıştırılmıştır. DÖF başarıyla doğrulanarak kapatılmıştır.'
    }
  ];
}

function generateDefaultTrainings(pers: Personnel[]): TrainingRecord[] {
  const trainer = 'KYS Baş Denetçisi Ahmet Yılmaz';
  const attendees = pers.slice(0, 5).map(p => p.id);
  
  return [
    {
      id: 'EG-001',
      trainingName: 'ISO 9001:2015 Kalite Yönetim Sistemi Temel Eğitimi',
      trainer,
      date: '2026-03-10',
      durationHours: 8,
      attendees,
      feedbackScore: 92
    },
    {
      id: 'EG-002',
      trainingName: 'TS EN 61537 Standardı Kablo Kanalları Mukavemet ve Güvenli Çalışma Yükü Test Eğitimi',
      trainer: 'Test Laboratuvarı Şefi',
      date: '2026-04-18',
      durationHours: 4,
      attendees: pers.slice(0, 3).map(p => p.id),
      feedbackScore: 95
    }
  ];
}

function generateDefaultProductionRuns(pers: Personnel[], prods: Product[]): ProductionRun[] {
  const date = '2024-05-25';
  const operator = pers[0]?.name || 'Faruk Oruç';
  return [
    {
      id: 'PRD-2024-001',
      productionOrderNo: 'EMR-2024-042',
      date,
      productCode: 'SU 10/P',
      quantity: 50,
      operator,
      pdfFile: 'Uretim_Formu_SU10P.pdf',
      firstCheckStatus: 'Uygun',
      firstCheckWidthMm: 100,
      firstCheckHeightMm: 40,
      firstCheckThicknessMm: 0.80,
      firstCheckInspector: 'Faruk Oruç',
      firstCheckDate: date,
      inProcessChecks: [
        { timestamp: '09:30', sampleNo: 1, measuredWidthMm: 100.1, measuredThicknessMm: 0.80, visualStatus: 'Uygun', inspector: 'Faruk Oruç' },
        { timestamp: '11:00', sampleNo: 2, measuredWidthMm: 100.0, measuredThicknessMm: 0.81, visualStatus: 'Uygun', inspector: 'Faruk Oruç' },
        { timestamp: '14:00', sampleNo: 3, measuredWidthMm: 100.2, measuredThicknessMm: 0.79, visualStatus: 'Uygun', inspector: 'Faruk Oruç' }
      ],
      finalInspectionDispatchNo: 'SE12024000000058',
      status: 'Tamamlandı'
    },
    {
      id: 'PRD-2024-002',
      productionOrderNo: 'EMR-2024-043',
      date: '2024-05-28',
      productCode: 'SU 20',
      quantity: 120,
      operator,
      pdfFile: 'Uretim_Formu_SU20.pdf',
      firstCheckStatus: 'Uygun',
      firstCheckWidthMm: 200,
      firstCheckHeightMm: 40,
      firstCheckThicknessMm: 0.90,
      firstCheckInspector: 'Faruk Oruç',
      firstCheckDate: '2024-05-28',
      inProcessChecks: [
        { timestamp: '08:30', sampleNo: 1, measuredWidthMm: 200.0, measuredThicknessMm: 0.90, visualStatus: 'Uygun', inspector: 'Faruk Oruç' },
        { timestamp: '10:30', sampleNo: 2, measuredWidthMm: 200.2, measuredThicknessMm: 0.89, visualStatus: 'Uygun', inspector: 'Faruk Oruç' },
        { timestamp: '13:30', sampleNo: 3, measuredWidthMm: 199.9, measuredThicknessMm: 0.91, visualStatus: 'Uygun', inspector: 'Faruk Oruç' }
      ],
      finalInspectionDispatchNo: 'SE12024000000059',
      status: 'Tamamlandı'
    }
  ];
}

function generateDefaultQuotes(prods: Product[]): Quote[] {
  return [
    {
      id: 'TKF-2024-001',
      customerName: 'ANUŞ ELEKTRİK KEREM ANUŞ',
      date: '2024-05-24',
      items: [
        { productCode: 'SU 10/P', quantity: 5, price: 420 },
        { productCode: 'BB 8X15', quantity: 100, price: 12 },
        { productCode: 'MBF', quantity: 100, price: 8 }
      ],
      totalAmount: 4100,
      status: 'Onaylandı'
    },
    {
      id: 'TKF-2024-002',
      customerName: 'TİNAZ ELEKTRONİK TİC.LTD.ŞTİ.',
      date: '2024-05-26',
      items: [
        { productCode: 'SU 20', quantity: 24, price: 580 },
        { productCode: 'S2', quantity: 30, price: 45 }
      ],
      totalAmount: 15270,
      status: 'Onaylandı'
    },
    {
      id: 'TKF-2024-003',
      customerName: 'ÖZDEMİR ELEKTRİK A.Ş.',
      date: '2024-06-28',
      items: [
        { productCode: 'SU 10/P', quantity: 80, price: 410 }
      ],
      totalAmount: 32800,
      status: 'Teklif Hazırlandı'
    }
  ];
}

export function generateNextOrderNumber(existingOrders: Order[] = []): string {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `SIES${currentYear}`;
  
  let storedSeq = 0;
  if (typeof window !== 'undefined') {
    const rawSeq = localStorage.getItem(`qms_order_seq_${currentYear}`);
    if (rawSeq) storedSeq = parseInt(rawSeq, 10) || 0;
  }

  let maxFound = 0;
  
  const scanStr = (str?: string) => {
    if (!str) return;
    const clean = str.toUpperCase().trim();
    if (clean.includes(yearPrefix)) {
      const match = clean.match(new RegExp(`${yearPrefix}(\\d{4})`));
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxFound) {
          maxFound = num;
        }
      }
    }
  };

  (existingOrders || []).forEach(o => {
    if (o) {
      scanStr(o.id);
      scanStr(o.customerOrderNo);
    }
  });

  if (typeof window !== 'undefined') {
    try {
      const delOrders: string[] = JSON.parse(localStorage.getItem('qms_deleted_orders') || '[]');
      delOrders.forEach(scanStr);
    } catch (e) {}
  }

  const nextSeq = Math.max(storedSeq, maxFound) + 1;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`qms_order_seq_${currentYear}`, String(nextSeq));
    } catch (e) {}
  }

  return `${yearPrefix}${String(nextSeq).padStart(4, '0')}`;
}

function generateDefaultOrders(prods: Product[]): Order[] {
  return [
    {
      id: 'DENEME-001',
      customerOrderNo: 'DENEME-001',
      quoteId: 'TKF-2026-000',
      customerName: '0 FARUK ORUÇ DENEME SİPARİŞİ',
      date: '2026-10-07',
      deliveryDate: '2026-10-15',
      coatingTypes: ['DALDIRMA GALVANİZ (DG)'],
      items: [
        { productCode: 'S57243', description: 'KABLO MERDİVEN SİMETRİK DALDIRMA GALVANİZ DELİKLİ 150 MM X 40 MM X 5 MM SG15MSD', quantity: 100, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S70372', description: 'PROFİL KÖŞEBENT DALDIRMA GALVANİZ 4 X 40 X 40 X L:2000 (DELİKLİ)', quantity: 200, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'Deneme siparişi',
      dispatches: []
    },
    {
      id: 'TEST-2026-01',
      customerOrderNo: 'TEST-2026-01',
      quoteId: 'TKF-2026-000',
      customerName: 'TEST ŞİRKETİ A.Ş.',
      date: '2026-10-06',
      deliveryDate: '2026-10-12',
      coatingTypes: ['ELEKTRO GALVANİZ (EG)'],
      items: [
        { productCode: 'SU 20', description: 'UNIVERSAL KABLO KANALI 200X40X0.90 MM', quantity: 150, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'Test siparişi 1',
      dispatches: []
    },
    {
      id: 'TEST-2026-02',
      customerOrderNo: 'TEST-2026-02',
      quoteId: 'TKF-2026-000',
      customerName: 'SIES TEST MÜŞTERİSİ',
      date: '2026-10-05',
      deliveryDate: '2026-10-10',
      coatingTypes: ['PASLANMAZ (INOX)'],
      items: [
        { productCode: 'SU 10/P', description: '304 K. PASLANMAZ KABLO KANALI 100X40X0.80 MM', quantity: 100, shippedQuantity: 50, status: 'Bekliyor' }
      ],
      status: 'KISMİ SEVK EDİLDİ',
      notes: '50 MT sevk edildi',
      dispatches: [
        { dispatchNoteNo: 'SEVK-2026-001', date: '2026-10-06', items: [{ productCode: 'SU 10/P', quantity: 50 }] }
      ]
    },
    {
      id: 'SIES20260007',
      customerOrderNo: 'SIES20260007',
      quoteId: 'TKF-2026-007',
      customerName: 'SİRENA MARİN',
      date: '2026-10-07',
      deliveryDate: '2026-10-09',
      coatingTypes: ['ALÜMİNYUM'],
      externalCloudLink: YANDEX_DISK_URL,
      items: [
        { productCode: 'Y03001157', description: 'ALÜMİNYUM KABLO KANALI, 250X25X2, DELİKLİ, ELEKTROSTATİK BOYALI, RENK: RAL9001', quantity: 22, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'Y03001158', description: 'ALÜMİNYUM KABLO KANALI, 150X25X2, DELİKLİ, ELEKTROSTATİK BOYALI, RENK: RAL9001', quantity: 4, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'Y03003203', description: 'ALÜMİNYUM KABLO KANALI, 350X25X2, DELİKLİ, ELEKTROSTATİK BOYALI, RENK: RAL9001', quantity: 2, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'SİRENA MARİN siparişi - Alüminyum kaplama',
      dispatches: []
    },
    {
      id: 'SIES20260006',
      customerOrderNo: 'SIES20260006',
      quoteId: 'TKF-2026-006',
      customerName: 'SİRENA MARİN',
      date: '2026-10-07',
      deliveryDate: '2026-10-09',
      coatingTypes: ['ALÜMİNYUM'],
      externalCloudLink: YANDEX_DISK_URL,
      items: [
        { productCode: 'Y03001157', description: 'ALÜMİNYUM KABLO KANALI, 250X25X2', quantity: 10, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'SİRENA MARİN siparişi',
      dispatches: []
    },
    {
      id: 'SIES20260005',
      customerOrderNo: 'SIES20260005',
      quoteId: 'TKF-2026-005',
      customerName: 'MORE ELEKTRONİK',
      date: '2026-10-06',
      externalCloudLink: YANDEX_DISK_URL,
      items: [
        { productCode: 'SU 20', description: 'UNIVERSAL KABLO KANALI 200X40X0.90 MM', quantity: 18, shippedQuantity: 0, status: 'Üretimde' }
      ],
      status: 'ÜRETİMDE',
      notes: 'Elektronik klemens imalatı',
      dispatches: []
    },
    {
      id: 'SIES20260004',
      customerOrderNo: 'SIES20260004',
      quoteId: 'TKF-2026-004',
      customerName: 'TERSAN TERSANECİLİK A.Ş.',
      date: '2026-10-05',
      externalCloudLink: YANDEX_DISK_URL,
      items: [
        { productCode: 'SU 10/P', description: '304 K. PASLANMAZ KABLO KANALI 100X40X0.80 MM', quantity: 10, shippedQuantity: 0, status: 'Üretimde' },
        { productCode: 'BB 8X15', description: 'CİVATA VİDA ELEMANI', quantity: 100, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'ÜRETİMDE',
      notes: 'Tersan gemi imalat siparişi',
      dispatches: []
    },
    {
      id: 'SIES20260003',
      customerOrderNo: 'SIES20260003',
      quoteId: 'TKF-2026-003',
      customerName: 'TERSAN TERSANECİLİK A.Ş.',
      date: '2026-10-04',
      externalCloudLink: YANDEX_DISK_URL,
      items: [
        { productCode: 'SKK KAPAK', description: 'KABLO KANALI KAPAGI', quantity: 50, shippedQuantity: 0, status: 'Üretimde' }
      ],
      status: 'ÜRETİMDE',
      notes: 'Gemi güverte siparişi',
      dispatches: []
    },
    {
      id: 'SIES20260002',
      customerOrderNo: 'SIES20260002',
      quoteId: 'TKF-2026-002',
      customerName: 'TERSAN TERSANECİLİK A.Ş.',
      date: '2026-10-03',
      externalCloudLink: YANDEX_DISK_URL,
      items: [
        { productCode: 'MBF', description: 'BİRLEŞTİRME ELEMANI', quantity: 200, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'Tersan standart sipariş',
      dispatches: []
    },
    {
      id: 'SIES20260001',
      customerOrderNo: 'SIES20260001',
      quoteId: 'TKF-2026-001',
      customerName: 'TERSAN TERSANECİLİK A.Ş.',
      date: '2026-10-02',
      externalCloudLink: YANDEX_DISK_URL,
      items: [
        { productCode: 'S2', description: 'BİRLEŞTİRME PARÇASI', quantity: 30, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'Tersan birleştirme parçaları',
      dispatches: []
    },
    {
      id: 'SIES20260008',
      customerOrderNo: '405844',
      quoteId: 'TKF-2026-008',
      customerName: 'TERSAN TERSANECİLİK A.Ş.',
      date: '2026-09-10',
      deliveryDate: '2026-09-08',
      coatingTypes: ['KARIŞIK'],
      projectNo: 'NB1137',
      items: [
        { productCode: 'S57243', description: 'KABLO MERDİVEN SİMETRİK DALDIRMA GALVANİZ DELİKLİ 150 MM X 40 MM X 5 MM SG15MSD', quantity: 100, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S70372', description: 'PROFİL KÖŞEBENT DALDIRMA GALVANİZ 4 X 40 X 40 X L:2000 (DELİKLİ)', quantity: 200, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S99384', description: 'KABLO MERDİVENİ DALDIRMA GALVANİZ GEMİ TİPİ DELİKLİ SİMETRİK (Z KESİT) (E,200 X 40 X 5 MM) SG 20 MSD', quantity: 200, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S825197', description: 'PROFİL LAMA DALDIRMA GALVANİZ 5 X 40 X L:3000 (DELİKLİ) SDL-1', quantity: 200, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S837261', description: 'PROFİL KÖŞEBENT PASLANMAZ 304 L 4 X 40 X 40 (DELİKLİ)', quantity: 60, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S792912', description: 'PROFİL DALDIRMA GALVANİZ LB: 400 LS:200 Q:10 4 MM KALINLIK KANAL 30..SAĞ (DELİKLİ LASKİ KÖŞE PROFİL)', quantity: 150, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S792913', description: 'PROFİL DALDIRMA GALVANİZ LB: 400 LS:200 Q:10 4 MM KALINLIK KANAL 30..SOL (DELİKLİ LASKİ KÖŞE PROFİL)', quantity: 150, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S812262', description: 'PROFİL DALDIRMA GALVANİZ LB: 600 LS:200 Q:10 4 MM KALINLIK KANAL 30..SOL (UZUN DELİKLİ LASKİ KÖŞE PROFİL)', quantity: 100, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'S812263', description: 'PROFİL DALDIRMA GALVANİZ LB: 600 LS:200 Q:10 4 MM KALINLIK KANAL 30..SAĞ (UZUN DELİKLİ LASKİ KÖŞE PROFİL)', quantity: 100, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'TERSAN TERSANECİLİK A.Ş. 405844 MÜŞTERİ SİP NO',
      createdBy: 'Faruk - Depo Bekliyor',
      createdDate: '2026-09-10',
      dispatches: []
    },
    {
      id: 'SIES20260009',
      customerOrderNo: '406961',
      quoteId: 'TKF-2026-009',
      customerName: 'TERSAN TERSANECİLİK A.Ş.',
      date: '2026-09-26',
      deliveryDate: '2026-10-08',
      coatingTypes: ['ASTAR BOYALI'],
      projectNo: 'NB1099C',
      items: [
        { productCode: 'S792063', description: 'KABLO MENHOL ÇELİK BOYALI İÇTEN İÇE ÖLÇÜ 200 X 120 X 100 MM', quantity: 9, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'TERSAN TERSANECİLİK A.Ş. 406961 MÜŞTERİ SİP NO',
      createdBy: 'Faruk - Depo Bekliyor',
      createdDate: '2026-09-26',
      dispatches: []
    },
    {
      id: 'SIES20260010',
      customerOrderNo: 'TEKL',
      quoteId: 'TKF-2026-010',
      customerName: 'SSASA',
      date: '2026-10-08',
      deliveryDate: '2026-10-09',
      coatingTypes: ['SICAK DALDIRMA GALVANİZ (HDG)'],
      projectNo: 'NOT',
      items: [
        { productCode: 'STÖ 05', description: 'STÖ 05 A:50MM, H:50MM, E:4.0MM(50AD* TEL ÖRGÜ KABLO KANALI L=2500MM', quantity: 2.5, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'STÖ 10', description: 'STÖ 10 A:100MM, H:50MM, E:4.0MM(50AD* HAZIRLAYAN ONAYLAYAN FARUK ORUÇ İBRAHİM SERT © SİES ELEKTRİK MÜHENDİSLİK SAN. VE TİC. LTD. ŞTİ. - TS EN 61537 UYGUN ÜRETİM FORMU', quantity: 2.5, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'STÖ-15-C', description: 'STÖ-15-C A:150MM, H:100MM, E:4.0MM(200AD* TEL ÖRGÜ KABLO KANALI L=2500MM', quantity: 2.5, shippedQuantity: 0, status: 'Bekliyor' },
        { productCode: 'STÖ-20', description: 'STÖ-20 A:100MM, H:50MM, E:4.0MM(200AD* TEL ÖRGÜ KABLO KANALI L=2500MM', quantity: 2.5, shippedQuantity: 0, status: 'Bekliyor' }
      ],
      status: 'YENİ SİPARİŞ',
      notes: 'SSASA deneme siparişi',
      createdBy: 'Faruk - Depo Bekliyor',
      createdDate: '2026-10-08',
      dispatches: []
    }
  ];
}
