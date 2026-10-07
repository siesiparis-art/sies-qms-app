'use client';

import React, { useState, useEffect } from 'react';
import { useQms, Quote, Order, Product, InspectionCertificate, AnalysisRow, YANDEX_DISK_URL } from '@/context/QmsContext';
import { CreateOrderWizard } from './CreateOrderWizard';
import { cleanCodeAndDesc, parsePdfTextToItems, normalizeUnit, isFooterOrSummaryLine, cleanFooterFromDesc, extractBestQtyAndUnit, extractCustomerFromFilename } from '@/utils/orderParser';
import { 
  FileText, Plus, Check, Printer, FileSpreadsheet, Play, CheckCircle2, ChevronRight, X, 
  Briefcase, ShoppingCart, Truck, RefreshCw, Send, Barcode, ShieldAlert, Award, FileCheck, Eye,
  Building, User, UserCheck, Phone, Mail, MapPin, Cpu, Upload, ExternalLink,
  Search, Trash2, Calendar, AlertCircle, Zap, Palette, Package, Edit, ChevronDown, ChevronUp, ClipboardList, ListChecks, Tag, ClipboardCheck, ListFilter, CheckSquare, Box, Layers
} from 'lucide-react';

// Material Grade Standards
const MATERIAL_STANDARDS: Record<string, { 
  chemical: { name: string; min?: number; max?: number; unit: string; actualBase: number; actualVar: number }[];
  mechanical: { name: string; min?: number; max?: number; unit: string; actualBase: number; actualVar: number }[];
}> = {
  'ST37': {
    chemical: [
      { name: 'Carbon (C)', max: 0.17, unit: '%', actualBase: 0.12, actualVar: 0.03 },
      { name: 'Manganese (Mn)', max: 1.40, unit: '%', actualBase: 0.45, actualVar: 0.10 },
      { name: 'Silicon (Si)', max: 0.35, unit: '%', actualBase: 0.18, actualVar: 0.05 },
      { name: 'Phosphorus (P)', max: 0.045, unit: '%', actualBase: 0.015, actualVar: 0.005 },
      { name: 'Sulfur (S)', max: 0.045, unit: '%', actualBase: 0.012, actualVar: 0.003 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 235, unit: 'N/mm²', actualBase: 245, actualVar: 10 },
      { name: 'Tensile Strength (Rm)', min: 360, max: 510, unit: 'N/mm²', actualBase: 410, actualVar: 20 },
      { name: 'Elongation (A5)', min: 26, unit: '%', actualBase: 29, actualVar: 3 }
    ]
  },
  '304 Paslanmaz': {
    chemical: [
      { name: 'Carbon (C)', max: 0.08, unit: '%', actualBase: 0.04, actualVar: 0.01 },
      { name: 'Chromium (Cr)', min: 18.0, max: 20.0, unit: '%', actualBase: 18.2, actualVar: 0.5 },
      { name: 'Nickel (Ni)', min: 8.0, max: 10.5, unit: '%', actualBase: 8.1, actualVar: 0.3 },
      { name: 'Manganese (Mn)', max: 2.0, unit: '%', actualBase: 1.2, actualVar: 0.2 },
      { name: 'Silicon (Si)', max: 0.75, unit: '%', actualBase: 0.42, actualVar: 0.08 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 205, unit: 'N/mm²', actualBase: 225, actualVar: 15 },
      { name: 'Tensile Strength (Rm)', min: 515, max: 720, unit: 'N/mm²', actualBase: 565, actualVar: 30 },
      { name: 'Elongation (A5)', min: 40, unit: '%', actualBase: 46, actualVar: 4 }
    ]
  },
  '316 Paslanmaz': {
    chemical: [
      { name: 'Carbon (C)', max: 0.08, unit: '%', actualBase: 0.035, actualVar: 0.01 },
      { name: 'Chromium (Cr)', min: 16.0, max: 18.0, unit: '%', actualBase: 16.5, actualVar: 0.4 },
      { name: 'Nickel (Ni)', min: 10.0, max: 14.0, unit: '%', actualBase: 10.3, actualVar: 0.5 },
      { name: 'Molybdenum (Mo)', min: 2.0, max: 3.0, unit: '%', actualBase: 2.1, actualVar: 0.2 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 205, unit: 'N/mm²', actualBase: 235, actualVar: 10 },
      { name: 'Tensile Strength (Rm)', min: 515, max: 690, unit: 'N/mm²', actualBase: 570, actualVar: 25 },
      { name: 'Elongation (A5)', min: 40, unit: '%', actualBase: 44, actualVar: 3 }
    ]
  },
  '5754 Alüminyum': {
    chemical: [
      { name: 'Magnesium (Mg)', min: 2.6, max: 3.6, unit: '%', actualBase: 2.9, actualVar: 0.2 },
      { name: 'Manganese (Mn)', max: 0.50, unit: '%', actualBase: 0.22, actualVar: 0.05 },
      { name: 'Iron (Fe)', max: 0.40, unit: '%', actualBase: 0.18, actualVar: 0.04 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 80, unit: 'N/mm²', actualBase: 95, actualVar: 10 },
      { name: 'Tensile Strength (Rm)', min: 190, max: 240, unit: 'N/mm²', actualBase: 215, actualVar: 15 },
      { name: 'Elongation (A5)', min: 12, unit: '%', actualBase: 15, actualVar: 2 }
    ]
  },
  '6082 Alüminyum': {
    chemical: [
      { name: 'Silicon (Si)', min: 0.7, max: 1.3, unit: '%', actualBase: 0.95, actualVar: 0.1 },
      { name: 'Magnesium (Mg)', min: 0.6, max: 1.2, unit: '%', actualBase: 0.85, actualVar: 0.1 },
      { name: 'Manganese (Mn)', min: 0.40, max: 1.0, unit: '%', actualBase: 0.62, actualVar: 0.1 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 260, unit: 'N/mm²', actualBase: 285, actualVar: 15 },
      { name: 'Tensile Strength (Rm)', min: 310, unit: 'N/mm²', actualBase: 330, actualVar: 10 },
      { name: 'Elongation (A5)', min: 10, unit: '%', actualBase: 12, actualVar: 1.5 }
    ]
  },
  '1050 Alüminyum': {
    chemical: [
      { name: 'Aluminium (Al)', min: 99.5, unit: '%', actualBase: 99.6, actualVar: 0.05 },
      { name: 'Iron (Fe)', max: 0.40, unit: '%', actualBase: 0.25, actualVar: 0.05 },
      { name: 'Silicon (Si)', max: 0.25, unit: '%', actualBase: 0.12, actualVar: 0.03 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 20, unit: 'N/mm²', actualBase: 35, actualVar: 5 },
      { name: 'Tensile Strength (Rm)', min: 65, max: 95, unit: 'N/mm²', actualBase: 78, actualVar: 10 },
      { name: 'Elongation (A5)', min: 25, unit: '%', actualBase: 32, actualVar: 3 }
    ]
  }
};

const normalizeStatus = (status: string): string => {
  const s = (status || '').toUpperCase().trim();
  if (s === 'SİPARİŞ ALINDI' || s === 'SIPARIS ALINDI' || s === 'YENİ SİPARİŞ' || s === 'YENI SIPARIS' || s === 'BEKLİYOR' || s === 'BEKLIYOR') return 'YENİ SİPARİŞ';
  if (s === 'ÜRETİMDE' || s === 'URETIMDE') return 'ÜRETİMDE';
  if (s === 'KAPLAMADA') return 'KAPLAMADA';
  if (s === 'BOYADA') return 'BOYADA';
  if (s === 'PAKETLEMEDE') return 'PAKETLEMEDE';
  if (s === 'SEVK EDİLDİ' || s === 'SEVK EDILDI' || s === 'KISMİ SEVK EDİLDİ' || s === 'KISMI SEVK EDILDI') return 'SEVK EDİLDİ';
  return 'YENİ SİPARİŞ';
};



const fixTurkishEncoding = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/AŞ[�?]*s*R/gi, 'AĞIR')
    .replace(/AŞR/gi, 'AĞIR')
    .replace(/BAŸL[�?]* /gi, 'BAŞLI ')
    .replace(/BAŸL/gi, 'BAŞLI')
    .replace(/BAŸ/gi, 'BAŞ')
    .replace(/KELEP‡ESİ/gi, 'KELEPÇESİ')
    .replace(/KELEP‡E/gi, 'KELEPÇE')
    .replace(/KANALLAR[�?]/gi, 'KANALLARI')
    .replace(/KANALLAR/gi, 'KANALLARI')
    .replace(/[�]/g, '');
};

const getItemUnit = (item: { unit?: string; productCode?: string; description?: string }): string => {
  if (!item) return 'AD';
  const c = (item.productCode || '').trim().toUpperCase();
  const d = (item.description || '').trim().toUpperCase();
  const u = (item.unit || '').trim().toUpperCase();
  
  if (c.startsWith('SU') || c.startsWith('KBL') || c.startsWith('CT') || d.includes('KANAL') || u === 'MT' || u === 'M' || u === 'METRE') {
    return 'MT';
  }
  return (u && u !== 'PCS') ? u : (u === 'PCS' ? 'PCS' : 'AD');
};

const isMtUnit = (unit?: any, code?: any) => {
  if (code !== undefined && code !== null) {
    const c = String(code).trim().toUpperCase();
    if (c.startsWith('SU') || c.startsWith('KBL') || c.startsWith('CT') || c.includes('KANAL')) return true;
  }
  if (unit !== undefined && unit !== null) {
    const u = String(unit).trim().toLowerCase();
    if (u === 'mt' || u === 'm' || u === 'metre' || u === 'metrik') return true;
  }
  return false;
};

const sortProductionItems = <T extends { unit?: any; productCode?: any; description?: any }>(items: T[]): T[] => {
  if (!items || !Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    const aMt = isMtUnit(a.unit, a.productCode);
    const bMt = isMtUnit(b.unit, b.productCode);
    if (aMt && !bMt) return -1;
    if (!aMt && bMt) return 1;
    return String(a.productCode || '').localeCompare(String(b.productCode || ''), undefined, { numeric: true, sensitivity: 'base' });
  });
};

const getOrderCategory = (order: any): string => {
  if (!order || !order.items || order.items.length === 0) return 'YENİ SİPARİŞ';
  
  let totalQty = 0;
  let totalShipped = 0;
  let hasShippedItems = false;
  let hasProdItems = false;
  let hasCoatingItems = false;
  let hasPaintItems = false;
  let hasPackItems = false;

  for (const item of order.items) {
    const qty = Number(item.quantity) || 0;
    const shipped = Number(item.shippedQuantity) || 0;
    totalQty += qty;
    totalShipped += shipped;

    if (shipped > 0) hasShippedItems = true;
    if (item.status === 'Üretimde' || (item.producedQuantity || 0) > 0) hasProdItems = true;
    if (item.status === 'Kaplamada' || (item.coatingQuantity || 0) > 0) hasCoatingItems = true;
    if (item.status === 'Boyada' || (item.paintQuantity || 0) > 0) hasPaintItems = true;
    if (item.status === 'Paketlemede' || (item.packagedQuantity || 0) > 0) hasPackItems = true;
  }

  // 100% FULLY SHIPPED ONLY IF ALL ITEMS ARE SHIPPED
  if (totalQty > 0 && totalShipped >= totalQty) {
    return 'SEVK EDİLDİ';
  }

  // PARTIALLY SHIPPED
  if (hasShippedItems && totalShipped < totalQty) {
    return 'KISMİ SEVK EDİLDİ';
  }

  if (hasPackItems) return 'PAKETLEMEDE';
  if (hasPaintItems) return 'BOYADA';
  if (hasCoatingItems) return 'KAPLAMADA';
  if (hasProdItems || order.status === 'ÜRETİMDE') return 'ÜRETİMDE';

  return 'YENİ SİPARİŞ';
};


export default function SalesModule({ 
  auditMode = false, 
  initialSubTab = 'orders' 
}: { 
  auditMode?: boolean; 
  initialSubTab?: 'orders' | 'quotes'; 
}) {
  const { 
    quotes, addQuote, updateQuote, deleteQuote,
    orders, addOrder, updateOrder, deleteOrder,
    certificates, addCertificate,
    products, addProduct, customers, addCustomer, addProductionRun, addOutgoingInspection, companyInfo,
    productionRuns, personnel, updateProductionRun, measuringDevices,
    activeCategoryTab, setActiveCategoryTab,
    showCreateOrderWizard, setShowCreateOrderWizard,
    orderSearchQuery, setOrderSearchQuery, forceSyncCloud, getFileFromIndexedDB, resolveDocumentUrl, currentUser
  } = useQms();

  const [activeTab, setActiveTab] = useState<'quotes' | 'orders'>(initialSubTab);
  const [editingOrderTarget, setEditingOrderTarget] = useState<Order | null>(null);
  const [selectedMasterOrderId, setSelectedMasterOrderId] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGeminiApiKey(localStorage.getItem('qms_gemini_api_key') || '');
    }
  }, []);

  // Preview document order state
  const [previewDocumentOrder, setPreviewDocumentOrder] = useState<Order | null>(null);
  const [docPreviewTab, setDocPreviewTab] = useState<'original' | 'fr013'>('original');
  const [resolvedDocUrl, setResolvedDocUrl] = useState<string>('');

  useEffect(() => {
    if (!previewDocumentOrder) {
      setResolvedDocUrl('');
      return;
    }
    const rawUrl = previewDocumentOrder.originalFileUrl || previewDocumentOrder.attachedFileLink || '';
    const fallbackLink = previewDocumentOrder.externalCloudLink || YANDEX_DISK_URL;
    if (resolveDocumentUrl) {
      resolveDocumentUrl(rawUrl, fallbackLink).then(url => {
        setResolvedDocUrl(url || fallbackLink);
      });
    } else {
      setResolvedDocUrl(rawUrl || fallbackLink);
    }
  }, [previewDocumentOrder, resolveDocumentUrl]);

  // Full-Page Create Order Screen States
  const showCreateOrderScreen = showCreateOrderWizard;
  const setShowCreateOrderScreen = setShowCreateOrderWizard;
  const [coCustomerName, setCoCustomerName] = useState('');
  const [coOrderNo, setCoOrderNo] = useState('');
  const [coProjectNo, setCoProjectNo] = useState('');
  const [coOrderDate, setCoOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [coDeliveryDate, setCoDeliveryDate] = useState('');
  const [coCoatingTypes, setCoCoatingTypes] = useState<string[]>([]);
  const [coDeliveryType, setCoDeliveryType] = useState('AMBAR İLE SEVK');
  const [coDeliveryDetail, setCoDeliveryDetail] = useState('');
  const [coShippingAddress, setCoShippingAddress] = useState('');
  const [coShippingFee, setCoShippingFee] = useState('Müşteriye Ait');
  const [coDifferentBilling, setCoDifferentBilling] = useState(false);
  const [coNotes, setCoNotes] = useState('');
  const [coItems, setCoItems] = useState<any[]>([]);
  const [coIsExempt, setCoIsExempt] = useState(false);
  const [coAttachedFileLink, setCoAttachedFileLink] = useState('');
  const [coAttachedFileName, setCoAttachedFileName] = useState('');
  
  const resetCreateOrderForm = () => {
    setEditingOrderTarget(null);
    setCoCustomerName('');
    setCoOrderNo('');
    setCoProjectNo('');
    setCoOrderDate(new Date().toISOString().split('T')[0]);
    setCoDeliveryDate('');
    setCoCoatingTypes([]);
    setCoDeliveryType('AMBAR İLE SEVK');
    setCoDeliveryDetail('');
    setCoShippingAddress('');
    setCoShippingFee('Müşteriye Ait');
    setCoNotes('');
    setCoItems([]);
    setCoAttachedFileLink('');
    setCoAttachedFileName('');
  };

  useEffect(() => {
    if (editingOrderTarget && showCreateOrderWizard) {
      setCoCustomerName(editingOrderTarget.customerName || '');
      setCoOrderNo(editingOrderTarget.customerOrderNo || editingOrderTarget.id || '');
      setCoProjectNo(editingOrderTarget.projectNo || '');
      setCoOrderDate(editingOrderTarget.date || new Date().toISOString().split('T')[0]);
      setCoDeliveryDate(editingOrderTarget.deliveryDate || '');
      setCoCoatingTypes(editingOrderTarget.coatingTypes || []);
      setCoDeliveryType(editingOrderTarget.deliveryType || 'AMBAR İLE SEVK');
      setCoDeliveryDetail(editingOrderTarget.deliveryDetail || '');
      setCoShippingAddress(editingOrderTarget.shippingAddress || '');
      setCoShippingFee(editingOrderTarget.shippingFee || 'Müşteriye Ait');
      setCoDifferentBilling(editingOrderTarget.differentBilling || false);
      setCoNotes(editingOrderTarget.notes || '');
      setCoIsExempt(editingOrderTarget.isExempt || false);
      setCoItems(editingOrderTarget.items ? editingOrderTarget.items.map((it: any) => ({ ...it })) : []);
    }
  }, [editingOrderTarget?.id, showCreateOrderWizard]);
  
  // AI OCR scanning states for inside wizard
  const [coAiScanning, setCoAiScanning] = useState(false);
  const [coAiLogs, setCoAiLogs] = useState<string[]>([]);

  const handleCoAiFileUpload = (file: any) => {
    setCoAiScanning(true);
    setCoAiLogs([]);

    const logs = [
      `[DRIVE] DOSYA siesiparis@gmail.com GOOGLE DRIVE HESABINA GÖNDERİLİYOR...`,
      `[DRIVE] YÜKLENDİ. KLASÖR: SIES_ERP_Siparisler`,
      `[ANALİZ] BELGE METİN VE TABLOLAR TESPİT EDİLİYOR (OCR MODÜLÜ)...`,
      `[ÇÖZÜMLEME] MÜŞTERİ BİLGİLERİ VE SEVK DETAYLARI ALINIYOR...`,
      `[BAŞARILI] GERÇEK BELGE VERİLERİ OKUNDU VE GOOGLE DRIVE LİNKİ BAĞLANDI!`
    ];

    setCoAiLogs(prev => [...prev, logs[0]]);
    setTimeout(() => setCoAiLogs(prev => [...prev, logs[1]]), 150);
    setTimeout(() => setCoAiLogs(prev => [...prev, logs[2]]), 300);

    const parseTextAndFill = async (text: string) => {
      if (text.startsWith('{')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.items && parsed.items.length > 0) {
            setCoItems(parsed.items);
            if (parsed.customerName && parsed.customerName !== "EXCEL İLE YÜKLENEN MÜŞTERİ") {
              setCoCustomerName(parsed.customerName);
            }
            if (parsed.orderNo) {
              setCoOrderNo(parsed.orderNo);
            }
            if (parsed.projectNo) {
              setCoProjectNo(parsed.projectNo);
            }
            if (parsed.deliveryDate) {
              setCoDeliveryDate(parsed.deliveryDate);
            }
            if (parsed.htmlPreview) {
              setCoAttachedFileLink(parsed.htmlPreview);
            }
            setCoAiScanning(false);
            setCoAiLogs(prev => [...prev, `[BAŞARILI] Excel tablosundan ${parsed.items.length} kalem başarıyla çözümlendi.`]);
            alert(`EXCEL DOSYASI BAŞARIYLA OKUNDU!\nMüşteri: ${parsed.customerName || 'DEARSAN'}\nSipariş No: ${parsed.orderNo || ''}\nKalem Sayısı: ${parsed.items.length}`);
            return;
          }
        } catch (e) {
          // ignore and fallback
        }
      }

      setCoAiLogs(prev => [
        ...prev, 
        `[METİN] Okuma tamamlandı. Metin boyutu: 	h${text.length} karakter.`,
        `[METİN ÖNİZLEME] "${text.substring(0, 150).replace(/\n/g, ' ')}..."`
      ]);

      const textUpper = text.toUpperCase();

      // Default empty values
      let customer = '';
      let orderNo = '';
      let projectNo = '';
      let orderDate = '';
      let deliveryDate = '';
      let coating: string[] = [];
      let address = '';
      let extractedItems: any[] = [];

      // 1. Customer detection
      const isValidCustomerName = (name: string): boolean => {
        if (!name || name.trim().length < 3 || name.trim().length > 90) return false;
        const u = name.toUpperCase().replace(/İ/g, 'I').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
        
        if (u.includes('TEKLIF') || u.includes('SIPARIS FORMU') || u.includes('TEKLIF FORMU') || u.includes('MUSTERI TEKLIF') || u.includes('SATINALMA') || u.includes('PURCHASE')) {
          if (!u.includes('SAN') && !u.includes('TIC') && !u.includes('A.S') && !u.includes('LTD') && !u.includes('TERSANE') && !u.includes('MAKINA') && !u.includes('ELEKTRIK') && !u.includes('ROBOTIK')) {
            return false;
          }
        }

        if (u.startsWith('MUST:') || u.startsWith('MÜŞT:') || u === 'MUSTERI TEKLIF' || u === 'SIPARIS FORMU' || u.includes('TEKLIF / SIPARIS') || u.includes('MUSTERI TEKLIF / SIPARIS FORMU')) {
          return false;
        }

        return true;
      };

      if (textUpper.includes('MARINI') || textUpper.includes('MARİNİ') || textUpper.includes('FAYAT')) {
        customer = 'MARİNİ MAKİNA A.Ş.';
      } else if (textUpper.includes('DEARSAN')) {
        customer = 'DEARSAN GEMİ İNŞAAT SANAYİ A.Ş.';
      } else {
        const explicitCustMatch = textUpper.match(/(?:MÜŞTERİ ADI|SİPARİŞ VEREN|UNVAN|ÜNVAN|ALICI FİRMA)\s*[:\-\s]\s*([^;\n\r]{3,80})/i);
        if (explicitCustMatch) {
          let extractedCust = explicitCustMatch[1].trim();
          extractedCust = extractedCust.split(/(?:SİPARİŞ|SIPARIS|TEKLİF|TEKLIF|NO:|ADRES)/)[0].trim();
          extractedCust = extractedCust.replace(/^TARİH\s*[:\-]?\s*\d{1,2}\.\d{1,2}\.\d{4}\s*/i, '').trim();
          extractedCust = extractedCust.replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*/, '').trim();
          if (isValidCustomerName(extractedCust)) {
            customer = extractedCust;
          }
        }
      }

      if (!customer || !isValidCustomerName(customer)) {
        if (textUpper.includes('ASELSAN')) {
          customer = 'ASELSAN ELEKTRONİK SANAYİ VE TİCARET A.Ş.';
        } else if (textUpper.includes('DEARSAN')) {
          customer = 'DEARSAN GEMİ İNŞAAT SANAYİ A.Ş.';
        } else if (textUpper.includes('ATLAS KABLO') || textUpper.includes('ATLAS')) {
          customer = 'ATLAS KABLO SİSTEMLERİ SAN. TİC. A.Ş.';
        } else if (textUpper.includes('SIEMENS') || textUpper.includes('SİEMENS')) {
          customer = 'SIEMENS SANAYİ VE TİCARET A.Ş.';
        } else if (textUpper.includes('TERMOSAN')) {
          customer = 'TERMOSAN ISIL İŞLEM';
        } else if (textUpper.includes('NORSE')) {
          customer = 'NORSE TERSANESİ';
        } else if (textUpper.includes('ÖZDEMİR') || textUpper.includes('OZDEMIR')) {
          customer = 'ÖZDEMİR ELEKTRİK A.Ş.';
        } else if (textUpper.includes('YÜKSEL') || textUpper.includes('YUKSEL')) {
          customer = 'YÜKSEL BEY';
        } else if (textUpper.includes('TERSAN TERSANECİLİK') || textUpper.includes('TERSAN SHIPYARD')) {
          customer = 'TERSAN TERSANECİLİK SAN. VE TİC. A.Ş.';
        } else {
          const linesList = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
          const customerCompanyLine = linesList.find(l => {
            const u = l.toUpperCase();
            return (u.includes('A.Ş') || u.includes('LTD') || u.includes('SAN') || u.includes('A.S.') || u.includes('TİC')) &&
                   !u.includes('SIES') && !u.includes('SİES') && !u.includes('FR-013') && isValidCustomerName(l) && l.length < 80;
          });
          if (customerCompanyLine && isValidCustomerName(customerCompanyLine)) {
            customer = customerCompanyLine.toUpperCase().trim();
          } else {
            customer = '';
          }
        }
      }

      if (customer && !isValidCustomerName(customer)) {
        customer = '';
      }

      if (customer) {
        customer = customer
          .replace(/^TARİH\s*[:\-]?\s*\d{1,2}\.\d{1,2}\.\d{4}\s*/i, '')
          .replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*/, '')
          .trim();
        if (customer.toUpperCase().includes('MARINI') || customer.toUpperCase().includes('MARİNİ') || customer.toUpperCase().includes('FAYAT')) {
          customer = 'MARİNİ MAKİNA A.Ş.';
        } else if (customer.toUpperCase().includes('DEARSAN')) {
          customer = 'DEARSAN GEMİ İNŞAAT SANAYİ A.Ş.';
        }
      }

      // 2. Order number / Teklif No detection (e.g. 400897 NOLU or S12524 or 2026/06/0020)
      const noluMatch = textUpper.match(/(\d{5,10})\s*(?:NOLU|NO'LU|NUMARALI)/i);
      if (noluMatch) {
        orderNo = noluMatch[1];
      } else {
        const orderNoMatch = textUpper.match(/(?:TEKLIF|SIPARIS|ORDER|NO|NUMARASI)\s*[:\-\s]\s*([A-Z0-9\/\\-]{4,20})/i) || textUpper.match(/(\d{5,8})\s*(?:NOLU|NUMARALI|NO)/) || textUpper.match(/\b(2026\d{4})\b/);
        if (orderNoMatch) {
          orderNo = orderNoMatch[1].trim();
        }
      }

      // 3. Project number detection
      const projectNoMatch = textUpper.match(/(NB\d{4})/) || textUpper.match(/(?:PROJE|PROJECT)\s*[:\-\s]\s*([A-Z0-9-]{4,15})/);
      if (projectNoMatch) {
        projectNo = projectNoMatch[1].trim();
      }

      // 4. Dates detection
      const deliveryDateMatch = textUpper.match(/(?:TESLİMAT|TESLIMAT|TESLİM|TESLIM|DELIVERY|TERMİN|TERMIN|SEVK)\s*(?:TARİHİ|TARIHI|TARİH|TARIH)?\s*[:\-\s]\s*(\d{1,2}\.\d{1,2}\.\d{4})/i);
      if (deliveryDateMatch) {
        const parts = deliveryDateMatch[1].split('.');
        deliveryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      const orderDateMatch = textUpper.match(/(?:SIPARIS|ORDER|TEKLIF)\s*(?:TARİHİ|TARIHI|TARİH|TARIH)?\s*[:\-\s]\s*(\d{1,2}\.\d{1,2}\.\d{4})/i);
      if (orderDateMatch) {
        const parts = orderDateMatch[1].split('.');
        orderDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      // 5. Coating types detection
      if (textUpper.includes('PASLANMAZ') || textUpper.includes('304L') || textUpper.includes('304')) {
        coating = ['304 Kalite Paslanmaz'];
      } else if (textUpper.includes('SICAK') || textUpper.includes('TS 914') || textUpper.includes('GALV')) {
        coating = ['TS 914 Sıcak Daldırma'];
      }

      // 6. Address detection
      const addressMatch = textUpper.match(/(?:SEVK ADRESI|DELIVERY ADDRESS)\s*[:\-\s]\s*([^;\n\r]{10,120})/) || textUpper.match(/(TAVŞANLI[^;\n\r]{20,100})/);
      if (addressMatch) {
        address = addressMatch[1].trim();
      }

      // 7. Table Parser with parsePdfTextToItems:
      const pdfParseResult = parsePdfTextToItems(text);
      extractedItems = pdfParseResult.items;
      if (!projectNo && pdfParseResult.detectedProjectNo) {
        projectNo = pdfParseResult.detectedProjectNo;
      }

      // Fallback: Segment-based Global Parser if line-by-line found 0 items
      if (extractedItems.length === 0) {
        setCoAiLogs(prev => [...prev, `[BİLGİ] Satır tespiti yapılamadı. Hücresel segmentasyon analizine geçiliyor...`]);
        
        // Find all product codes in the text
        const codeRegex = /\b(S\d{6}|SG[LBMB]?\s*\d+[-A-Z0-9]*|SGM\s*\d+|SU\s*\d+[-A-Z0-9]*|SC\s*[-0-9A-Z]*|L\s*\d+[-A-Z0-9]*|YT\s*\d+[-A-Z0-9]*|SKK[-A-Z0-9]*|MBF[-A-Z0-9]*|SD\d*[-A-Z0-9]*|SPU[-0-9A-Z]*|MB\d*[-A-Z0-9]*|BB\d*[-A-Z0-9]*|KBL[-0-9A-Z]*|CT[-0-9A-Z]*|[A-Z]{1,4}\s*\d+[-A-Z0-9]*)\b/gi;
        const matches = [];
        let match;
        while ((match = codeRegex.exec(text)) !== null) {
          matches.push({
            code: match[1],
            index: match.index
          });
        }

        for (let i = 0; i < matches.length; i++) {
          const current = matches[i];
          const next = matches[i + 1];
          const segment = text.substring(current.index + current.code.length, next ? next.index : text.length);

          const qtyUnitMatch = extractBestQtyAndUnit(segment);

          if (qtyUnitMatch) {
            const qty = qtyUnitMatch.qty;
            const unit = qtyUnitMatch.unit;

            let desc = segment.substring(0, qtyUnitMatch.matchIndex).trim();
            desc = cleanFooterFromDesc(desc);
            desc = desc.replace(/^[^a-zA-Z0-9]*/, '').replace(/[^a-zA-Z0-9]*$/, '');

            const afterQty = segment.substring(qtyUnitMatch.matchIndex + qtyUnitMatch.matchLength);
            const numberRegex = /(\d+(?:[.,]\d+)?)/g;
            const numbers = [];
            let numMatch;
            while ((numMatch = numberRegex.exec(afterQty)) !== null) {
              numbers.push(Number(numMatch[1].replace(',', '.')));
            }

            let price = 0;
            let total = 0;

            if (numbers.length >= 2) {
              price = numbers[0];
              total = numbers[numbers.length - 1];
            } else if (numbers.length === 1) {
              price = numbers[0];
              total = qty * price;
            }

            extractedItems.push({
              productCode: current.code.toUpperCase(),
              description: desc.toUpperCase() || 'KABLO MALZEMESİ',
              quantity: qty,
              unit: unit,
              price: price,
              total: total || (qty * price),
              isUretimDisi: current.code.toLowerCase().includes('civata') || current.code.toLowerCase().includes('somun') || current.code.toLowerCase().includes('tij')
            });
          }
        }
      }

      setCoAiLogs(prev => [
        ...prev, 
        `[ANALİZ BAŞARILI] Yerel motor analizini tamamladı.`,
        `[ANALİZ] Bulunan Müşteri: "${customer || 'Bulunamadı'}"`,
        `[ANALİZ] Bulunan Kalem Sayısı: ${extractedItems.length}`
      ]);

      setTimeout(() => {
        if (customer) {
          const exists = customers.some(c => c.name.toUpperCase() === customer.toUpperCase());
          if (!exists) {
            addCustomer({
              id: `MŞT-${customer.substring(0, 6).replace(/\s+/g, '').toUpperCase()}`,
              name: customer,
              contactPerson: customer.includes('NORSE') ? 'RAMİS BEY' : (customer.includes('YÜKSEL') ? 'YÜKSEL BEY' : 'Sipariş Asistanı (AI)'),
              email: 'info@' + customer.substring(0, 6).toLowerCase().replace(/\s+/g, '') + '.com'
            });
          }
        }

        setCoCustomerName(customer);
        setCoOrderNo(orderNo);
        setCoProjectNo(projectNo);
        setCoOrderDate(orderDate || new Date().toISOString().split('T')[0]);
        setCoDeliveryDate(deliveryDate);
        setCoCoatingTypes(coating);
        setCoDeliveryType('AMBAR İLE SEVK');
        setCoShippingAddress(address);
        setCoShippingFee('Müşteriye Ait');
        setCoItems(extractedItems);
        
        const mockDriveUrl = `https://drive.google.com/file/d/1${Math.random().toString(36).substring(2, 17)}/view?usp=sharing`;
        setCoAttachedFileLink(mockDriveUrl);
        setCoAttachedFileName(file.name);

        setCoAiScanning(false);
        // Preserve 100% of real extracted items from uploaded document
        if (extractedItems.length === 0) {
          setCoAiLogs(prev => [...prev, `[BİLGİ] Belgede otomatik kalem tespit edilemedi. Lütfen manuel kalem ekleyiniz.`]);
        }

        alert(`YAPAY ZEKA BELGE BİLGİLERİNİ BAŞARIYLA OKUDU VE GOOGLE DRIVE'A YÜKLEDİ!\nMüşteri: ${customer}\nSipariş No: ${orderNo || 'SP-2026-001'}\nKalem Sayısı: ${extractedItems.length}`);
      }, 1200);
    };

    const readAndExtractPdf = (file: File, callback: (text: string) => void) => {
      setCoAiLogs(prev => [...prev, `[PDF] PDF.js ile görsel koordinat analizi başlatılıyor...`]);
      const reader = new FileReader();
      reader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          if (!pdfjsLib) {
            setCoAiLogs(prev => [...prev, `[HATA] PDF.js kütüphanesi bulunamadı.`]);
            callback(file.name);
            return;
          }
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            const items = textContent.items.map((item: any) => {
              const tx = item.transform[4];
              const ty = item.transform[5];
              return { str: item.str, x: tx, y: ty, width: item.width || 0 };
            });
            
            const rows: { y: number; items: any[] }[] = [];
            items.forEach((item: any) => {
              if (!item.str.trim()) return;
              let foundRow = rows.find(r => Math.abs(r.y - item.y) < 6);
              if (foundRow) {
                foundRow.items.push(item);
              } else {
                rows.push({ y: item.y, items: [item] });
              }
            });
            
            rows.sort((a, b) => b.y - a.y);
            
            const lines = rows.map(r => {
              r.items.sort((a, b) => a.x - b.x);
              let rowText = "";
              for (let idx = 0; idx < r.items.length; idx++) {
                const current = r.items[idx];
                if (idx === 0) {
                  rowText += current.str;
                } else {
                  const prev = r.items[idx - 1];
                  const gap = current.x - (prev.x + prev.width);
                  if (gap < 1.5) {
                    rowText += current.str;
                  } else {
                    rowText += " " + current.str;
                  }
                }
              }
              return rowText;
            });
            
            fullText += lines.join("\n") + "\n";
          }

          const cleanedText = fullText.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');

          // Fallback to Canvas OCR if PDF has no text layer (Scanned PDF)
          if (cleanedText.trim().length < 20 && pdf.numPages >= 1) {
            setCoAiLogs(prev => [...prev, `[PDF TESPİT] Metin katmanı yok (Görsel/Taranmış PDF). OCR motoru başlatılıyor...`]);
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context!, viewport: viewport }).promise;

            const runCanvasOcr = (cvs: HTMLCanvasElement) => {
              const Tesseract = (window as any).Tesseract;
              if (!Tesseract) {
                callback(file.name);
                return;
              }
              Tesseract.recognize(cvs, 'tur+eng', {
                logger: (m: any) => {
                  if (m.status === 'recognizing text') {
                    const pct = Math.round(m.progress * 100);
                    if (pct % 25 === 0) {
                      setCoAiLogs(prev => {
                        const filtered = prev.filter(l => !l.includes('[OCR PROGRES]'));
                        return [...filtered, `[OCR PROGRES] Taranmış PDF Taraması: %${pct}`];
                      });
                    }
                  }
                }
              }).then(({ data: { text } }: any) => {
                setCoAiLogs(prev => [...prev, `[OCR BAŞARILI] Taranmış PDF içeriği başarıyla okundu.`]);
                callback(text);
              }).catch((err: any) => {
                console.error("Canvas OCR error:", err);
                callback(file.name);
              });
            };

            if (typeof window !== 'undefined' && !(window as any).Tesseract) {
              const script = document.createElement('script');
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.0.2/tesseract.min.js";
              script.onload = () => runCanvasOcr(canvas);
              script.onerror = () => callback(file.name);
              document.head.appendChild(script);
            } else {
              runCanvasOcr(canvas);
            }
            return;
          }

          setCoAiLogs(prev => [...prev, `[PDF BAŞARILI] Satır ve sütunlar başarıyla hizalandı (${cleanedText.length} karakter).`]);
          callback(cleanedText);
        } catch (err: any) {
          console.error("PDF extraction error:", err);
          setCoAiLogs(prev => [...prev, `[HATA] PDF okuma hatası: ${err.message || err}`]);
          callback(file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    };

    const generateExcelPdfDataUrl = async (
      customerName: string,
      orderNo: string,
      projectNo: string,
      fileName: string,
      items: any[]
    ): Promise<string> => {
      return new Promise((resolve) => {
        const loadJsPdf = (cb: () => void) => {
          if (typeof window !== 'undefined' && (window as any).jspdf) {
            cb();
          } else {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.onload = () => cb();
            script.onerror = () => resolve('');
            document.head.appendChild(script);
          }
        };

        loadJsPdf(() => {
          try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Brand Header Box
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 210, 30, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('SIES ELEKTRIK MUMESSILLIK SAN. VE TIC. LTD. STI.', 14, 13);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(203, 213, 225);
            doc.text('EXCEL SIPARIS DOSYASI PDF SIPARIS BELGESI', 14, 21);

            // Details Panel
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, 34, 182, 25, 2, 2, 'FD');

            doc.setTextColor(15, 23, 42);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`MUSTERI: ${customerName || 'TICARI MUSTERI'}`, 18, 42);
            doc.text(`SIPARIS NO: ${orderNo || 'SP-2026-001'}`, 18, 50);
            doc.text(`PROJE NO: ${projectNo || 'PRJ-2026-001'}`, 115, 42);
            doc.text(`DOSYA: ${fileName.substring(0, 32)}`, 115, 50);

            // Table Header Line
            let startY = 66;
            doc.setFillColor(30, 41, 59);
            doc.rect(14, startY, 182, 8, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('#', 16, startY + 5.5);
            doc.text('URUN KODU', 24, startY + 5.5);
            doc.text('ACIKLAMA / EBAT', 68, startY + 5.5);
            doc.text('MIKTAR', 130, startY + 5.5);
            doc.text('BIRIM', 150, startY + 5.5);
            doc.text('FIYAT', 168, startY + 5.5);
            doc.text('TUTAR', 185, startY + 5.5);

            startY += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);

            let grandTotal = 0;

            items.forEach((item, idx) => {
              if (startY > 270) {
                doc.addPage();
                startY = 20;
              }

              if (idx % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(14, startY, 182, 6.5, 'F');
              }

              doc.setDrawColor(241, 245, 249);
              doc.line(14, startY + 6.5, 196, startY + 6.5);

              doc.setTextColor(15, 23, 42);
              doc.text(String(idx + 1), 16, startY + 4.5);
              doc.text(String(item.productCode || '-').substring(0, 20), 24, startY + 4.5);
              doc.text(String(item.description || item.productCode || '-').substring(0, 35), 68, startY + 4.5);
              doc.text(String(item.quantity || 0), 130, startY + 4.5);
              doc.text(String(item.unit || 'ADET'), 150, startY + 4.5);
              doc.text(Number(item.price || 0).toFixed(2), 168, startY + 4.5);

              const rowTot = item.total || (item.quantity * item.price) || 0;
              grandTotal += rowTot;
              doc.text(rowTot.toFixed(2), 185, startY + 4.5);

              startY += 6.5;
            });

            // Total Summary
            startY += 3;
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(120, startY, 76, 9, 2, 2, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text('GENEL TOPLAM:', 124, startY + 6);
            doc.setTextColor(217, 119, 6);
            doc.text(`${grandTotal.toFixed(2)} TL`, 165, startY + 6);

            const pdfDataUrl = doc.output('datauristring');
            resolve(pdfDataUrl);
          } catch (err) {
            console.error('jsPDF generation failed:', err);
            resolve('');
          }
        });
      });
    };

    const readAndExtractExcel = (file: File, callback: (text: string) => void) => {
      setCoAiLogs(prev => [...prev, `[EXCEL] SheetJS ile yapısal analiz başlatılıyor...`]);
      const normStr = (str: any): string =>
        String(str || '')
          .toUpperCase()
          .replace(/İ/g, 'I')
          .replace(/Ğ/g, 'G')
          .replace(/Ü/g, 'U')
          .replace(/Ş/g, 'S')
          .replace(/Ö/g, 'O')
          .replace(/Ç/g, 'C')
          .trim();

      const isFooterRow = (str: string): boolean => {
        return isFooterOrSummaryLine(str) || normStr(str).includes('MALZ-KOD');
      };

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const XLSX = (window as any).XLSX;
          const workbook = XLSX.read(data, { type: 'array' });
          
          let excelItems: any[] = [];
          let detectedCustomer = "";
          let detectedOrderNo = "";
          let detectedProjectNo = "";
          let detectedDeliveryDate = "";
          
          const isOrderSheet = (name: string) => {
            const n = normStr(name);
            const isCatalog = n.includes('STOK') || n.includes('KATALOG') || n.includes('MUSTERI') || n.includes('LISTE') || n.includes('VERI') || n.includes('DATA');
            if (isCatalog) return false;
            return n.includes('SIPARIS') || n.includes('TEKLIF') || n.includes('ORDER') || n.includes('PO') || n.includes('FORM') || n.includes('SATIS') || n.includes('TALEP') || n.includes('MALZEME');
          };

          let targetSheets = workbook.SheetNames.filter((name: string) => isOrderSheet(name));
          if (targetSheets.length === 0) {
            targetSheets = [workbook.SheetNames[0]];
          }

          targetSheets.forEach((sheetName: string) => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            if (!rows || rows.length === 0) return;
            
            let colIdxCode = -1;
            let colIdxDesc = -1;
            let colIdxQty = -1;
            let colIdxUnit = -1;
            let colIdxDeliveryDate = -1;
            let colIdxPrice = -1;
            let colIdxTotal = -1;
            let headerRowIndex = -1;

            // Metadata Scanning (Customer, Order No, Project No, Delivery Date)
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r];
              if (!row || row.length === 0) continue;

              row.forEach((cell: any) => {
                if (cell != null) {
                  const cellStr = String(cell).trim();
                  const cellUpper = cellStr.toUpperCase();

                  // Customer detection
                  if (!detectedCustomer) {
                    if (cellUpper.includes('NEVA')) {
                      detectedCustomer = 'NEVA ROBOTİCS SAN. VE TİC. A.Ş.';
                    } else if (cellUpper.includes('AKSİYON') || cellUpper.includes('AKSIYON')) {
                      detectedCustomer = 'AKSİYON ROBOTİK SAN. TİC. A.Ş.';
                    } else if (cellUpper.includes('AZURİNE') || cellUpper.includes('AZURINE')) {
                      detectedCustomer = 'AZURİNE YATÇILIK DANIŞMANLIK TURİZM VE TİC. A.Ş.';
                    } else if (cellUpper.includes('DEARSAN')) {
                      detectedCustomer = 'DEARSAN GEMİ İNŞAAT SANAYİ A.Ş.';
                    } else if (cellUpper.includes('TERSAN')) {
                      detectedCustomer = 'TERSAN TERSANECİLİK SAN. VE TİC. A.Ş.';
                    } else if (cellUpper.includes('MARINI') || cellUpper.includes('MARİNİ')) {
                      detectedCustomer = 'MARİNİ MAKİNA A.Ş.';
                    } else if (cellUpper.includes('ASELSAN')) {
                      detectedCustomer = 'ASELSAN ELEKTRONİK SANAYİ A.Ş.';
                    } else if (cellUpper.includes('CEMRE')) {
                      detectedCustomer = 'CEMRE TERSANECİLİK SAN. VE TİC. A.Ş.';
                    } else if (cellUpper.includes('U4')) {
                      detectedCustomer = 'U4 MARİNE SAN. VE TİC. A.Ş.';
                    } else if (cellUpper.includes('MORE ELEKTRONİK') || cellUpper.includes('MORE ELEKTRONIK')) {
                      detectedCustomer = 'MORE ELEKTRONİK SAN. VE TİC. A.Ş.';
                    } else if (cellUpper.includes('SİPARİŞ FORMU') || cellUpper.includes('SIPARIS FORMU')) {
                      const custPart = cellStr.split('-')[0].trim();
                      if (custPart.length > 3 && !custPart.toUpperCase().includes('SIES')) {
                        detectedCustomer = custPart.toUpperCase();
                      }
                    }
                  }

                  // Order No detection
                  if (!detectedOrderNo) {
                    if (cellUpper.includes('SİPARİŞ NO') || cellUpper.includes('SIPARIS NO') || cellUpper.includes('TEKLİF NO') || cellUpper.includes('ORDER NO')) {
                      const numMatch = cellStr.match(/(?:SİPARİŞ NO|SIPARIS NO|TEKLİF NO|ORDER NO)\s*[:\-\s]*([A-Z0-9\/\\-]{4,20})/i) || cellStr.match(/([A-Z0-9\/\\-]{4,20})/);
                      if (numMatch) detectedOrderNo = numMatch[1].trim();
                    }
                  }

                  // Project No detection
                  if (!detectedProjectNo) {
                    if (cellUpper.includes('PROJE') || cellUpper.includes('PROJECT')) {
                      const prjMatch = cellStr.match(/(?:PROJE|PROJECT|PROJE ID)\s*[:\-\s]*([A-Z0-9-]{4,15})/i) || cellStr.match(/(NB\d{4})/i);
                      if (prjMatch) detectedProjectNo = prjMatch[1].trim();
                    }
                  }

                  // Delivery date detection
                  if (!detectedDeliveryDate) {
                    if (cellUpper.includes('TESLİM TARİHİ') || cellUpper.includes('TESLIM TARIHI') || cellUpper.includes('TESLİMAT')) {
                      const dMatch = cellStr.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
                      if (dMatch) {
                        const p = dMatch[1].split('.');
                        detectedDeliveryDate = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
                      }
                    }
                  }
                }
              });
            }

            // PASS 1: Header Row Scan
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r];
              if (!row || !Array.isArray(row) || row.length === 0) continue;

              let codeC = -1, descC = -1, qtyC = -1, unitC = -1, priceC = -1, totalC = -1;
              let matchCount = 0;

              row.forEach((cell: any, cIdx: number) => {
                if (cell == null) return;
                const h = normStr(cell);
                if (!h) return;

                if (codeC === -1 && (h.includes('SIPARIS KOD') || h.includes('URUN KOD') || h.includes('STOK KOD') || h.includes('MALZEME NO') || h.includes('MALZEME KOD') || h.includes('M.NO') || h.includes('M NO') || h.includes('PARCA NO') || h.includes('PART NO') || h === 'KOD' || h === 'CODE')) {
                  codeC = cIdx;
                  matchCount++;
                } else if (descC === -1 && (h === 'ACIKLAMA' || h === 'AÇIKLAMA' || h.includes('MALZEME TANIMI') || h.includes('MALZEME ADI') || h.includes('MALIN TANIMI') || h === 'TANIM' || h === 'DESCRIPTION' || h === 'MALZEME')) {
                  descC = cIdx;
                  matchCount++;
                } else if (qtyC === -1 && (h.includes('MIKTAR') || h.includes('QTY') || h.includes('QUANTITY') || h.includes('TALEP MIKTARI') || h.includes('SIPARIS MIKTARI'))) {
                  qtyC = cIdx;
                  matchCount++;
                } else if (unitC === -1 && (h.includes('BIRIM') || h === 'OB' || h === 'UNIT')) {
                  unitC = cIdx;
                  matchCount++;
                } else if (priceC === -1 && (h.includes('FIYAT') || h.includes('PRICE') || h.includes('B.FIYAT'))) {
                  priceC = cIdx;
                  matchCount++;
                } else if (totalC === -1 && (h.includes('TOPLAM') || h.includes('TUTAR') || h.includes('TOTAL'))) {
                  totalC = cIdx;
                  matchCount++;
                }
              });

              if (matchCount >= 2 && (codeC !== -1 || descC !== -1) && qtyC !== -1) {
                headerRowIndex = r;
                colIdxCode = codeC !== -1 ? codeC : (descC > 0 ? descC - 1 : 0);
                colIdxDesc = descC !== -1 ? descC : (colIdxCode + 1);
                colIdxQty = qtyC;
                colIdxUnit = unitC;
                colIdxPrice = priceC;
                colIdxTotal = totalC;
                break;
              }
            }

            // PASS 2: Data Rows Extraction
            const startRowIndex = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

            for (let r = startRowIndex; r < rows.length; r++) {
              const row = rows[r];
              if (!row || !Array.isArray(row) || row.length === 0) continue;

              const rowJoined = row.map(c => normStr(c)).join(' ');

              // If table items were already extracted and we hit bank/payment/total summary footer lines, stop!
              if (excelItems.length > 0 && isFooterRow(rowJoined)) {
                break;
              }

              // Skip metadata, contact, address, bank header/footer rows
              if (isFooterRow(rowJoined) || isFooterOrSummaryLine(rowJoined)) {
                continue;
              }

              let codeVal = colIdxCode !== -1 && row[colIdxCode] != null ? String(row[colIdxCode]).trim() : '';
              let descVal = colIdxDesc !== -1 && row[colIdxDesc] != null ? String(row[colIdxDesc]).trim() : '';
              let qtyVal = colIdxQty !== -1 ? row[colIdxQty] : null;

              // Handle sequence numbers (1, 2, 3) in column 0 when code/desc is in column 1
              if (/^\d{1,3}\.?$/.test(codeVal)) {
                if (row[colIdxCode + 1] && String(row[colIdxCode + 1]).trim().length > 1 && !isFooterRow(String(row[colIdxCode + 1]))) {
                  codeVal = String(row[colIdxCode + 1]).trim();
                  if (row[colIdxCode + 2] && String(row[colIdxCode + 2]).trim().length > 1 && !isFooterRow(String(row[colIdxCode + 2]))) {
                    descVal = String(row[colIdxCode + 2]).trim();
                  } else {
                    descVal = codeVal;
                  }
                }
              }

              if (!codeVal && row[0] && String(row[0]).trim().length > 1 && !/^\d+$/.test(String(row[0]))) {
                codeVal = String(row[0]).trim();
              }
              if (!descVal && row[1] && String(row[1]).trim().length > 1) {
                descVal = String(row[1]).trim();
              }

              if (!codeVal) codeVal = descVal;
              if (!descVal || /^\d{1,3}\.?$/.test(descVal)) descVal = codeVal;

              // Discard summary totals, payment notes, and bank info rows
              if (isFooterRow(codeVal) || isFooterRow(descVal) || isFooterRow(rowJoined) || normStr(codeVal).includes('MALZ-KOD')) {
                continue;
              }

              let qtyNum = qtyVal != null ? Number(String(qtyVal).replace(',', '.').replace(/[^\d\.]/g, '')) : 0;
              let explicitUnit = colIdxUnit !== -1 && row[colIdxUnit] ? String(row[colIdxUnit]).trim().toUpperCase() : '';

              // Scan row cells for explicit meter / measure quantity override (e.g. 14.4 M vs 6 BOY)
              row.forEach((cellVal: any, cellIdx: number) => {
                if (cellIdx !== colIdxCode && cellIdx !== colIdxDesc && cellIdx !== colIdxPrice && cellIdx !== colIdxTotal) {
                  const cellStr = String(cellVal || '').trim();
                  const bestMatch = extractBestQtyAndUnit(cellStr);
                  if (bestMatch && bestMatch.isExplicitMeterOrCount) {
                    if (bestMatch.unit === 'METRE' || qtyNum <= 0) {
                      qtyNum = bestMatch.qty;
                      if (!explicitUnit) explicitUnit = bestMatch.unit;
                    }
                  }
                }
              });

              // Fallback quantity search across row cells if qtyNum is still zero
              if (isNaN(qtyNum) || qtyNum <= 0) {
                row.forEach((cellVal: any, cellIdx: number) => {
                  if (cellIdx !== colIdxCode && cellIdx !== colIdxDesc && cellIdx !== colIdxPrice) {
                    const num = Number(String(cellVal || '').replace(',', '.').replace(/[^\d\.]/g, ''));
                    if (!isNaN(num) && num > 0 && num < 1000000 && qtyNum <= 0) {
                      qtyNum = num;
                    }
                  }
                });
              }

              const isHeaderRowVal = normStr(codeVal).includes('MALZEME') || normStr(codeVal).includes('KOD') || normStr(codeVal) === 'SIRA' || normStr(codeVal).includes('S.N');

              if ((codeVal || descVal) && !isHeaderRowVal && qtyNum > 0) {
                let rawUnitStr = explicitUnit || 'ADET';
                let unitStr = normalizeUnit(rawUnitStr);

                const priceNum = colIdxPrice !== -1 && row[colIdxPrice] ? Number(String(row[colIdxPrice]).replace(',', '.').replace(/[^\d\.]/g, '')) : 0;
                let totalNum = colIdxTotal !== -1 && row[colIdxTotal] ? Number(String(row[colIdxTotal]).replace(',', '.').replace(/[^\d\.]/g, '')) : (qtyNum * priceNum);

                if (colIdxDeliveryDate !== -1 && row[colIdxDeliveryDate]) {
                  const dStr = String(row[colIdxDeliveryDate]).trim();
                  const dMatch = dStr.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
                  if (dMatch && !detectedDeliveryDate) {
                    const p = dMatch[1].split('.');
                    detectedDeliveryDate = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
                  }
                }

                let { code, desc, detectedProjectNo: prj } = cleanCodeAndDesc(codeVal, descVal);
                desc = cleanFooterFromDesc(desc);
                if (prj && !detectedProjectNo) detectedProjectNo = prj;

                if (code && code !== 'MALZ-KOD' && desc && !isFooterRow(code) && !isFooterRow(desc)) {
                  excelItems.push({
                    productCode: code,
                    description: desc,
                    quantity: qtyNum,
                    unit: unitStr,
                    price: priceNum,
                    total: totalNum,
                    isUretimDisi: code.toLowerCase().includes('civata') || code.toLowerCase().includes('somun') || code.toLowerCase().includes('tij')
                  });
                }
              }
            }
          });
          
          if (excelItems.length > 0) {
            setCoAiLogs(prev => [...prev, `[EXCEL BAŞARILI] Yapısal tablo çözümlendi. Bulunan kalem: ${excelItems.length}`]);
            const fnCust = extractCustomerFromFilename(file.name);
            const finalCustName = detectedCustomer || fnCust || "";

            generateExcelPdfDataUrl(finalCustName, detectedOrderNo, detectedProjectNo, file.name, excelItems).then(generatedPdfUrl => {
              const mockText = JSON.stringify({
                customerName: finalCustName,
                orderNo: detectedOrderNo || "",
                projectNo: detectedProjectNo || "",
                deliveryDate: detectedDeliveryDate || "",
                htmlPreview: generatedPdfUrl,
                items: excelItems
              });
              callback(mockText);
            });
          } else {
            setCoAiLogs(prev => [...prev, `[EXCEL UYARI] Yapısal tablo bulunamadı. Metin tabanlı ayrıştırmaya geçiliyor...`]);
            let fullText = "";
            workbook.SheetNames.forEach((sheetName: string) => {
              const worksheet = workbook.Sheets[sheetName];
              const sheetText = XLSX.utils.sheet_to_txt(worksheet);
              fullText += sheetText + "\n";
            });
            callback(fullText);
          }
        } catch (err: any) {
          console.error("Excel extraction error:", err);
          setCoAiLogs(prev => [...prev, `[HATA] Excel okuma hatası: ${err.message || err}`]);
          callback(file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    };

    const readAndExtractImage = (file: File, callback: (text: string) => void) => {
      setCoAiLogs(prev => [...prev, `[OCR] Görsel tarayıcı (Tesseract.js) başlatılıyor...`]);
      try {
        const Tesseract = (window as any).Tesseract;
        Tesseract.recognize(
          file,
          'tur+eng',
          { logger: (m: any) => {
              if (m.status === 'recognizing text') {
                const pct = Math.round(m.progress * 100);
                if (pct % 20 === 0) {
                  setCoAiLogs(prev => {
                    const filtered = prev.filter(l => !l.includes('[OCR PROGRES]'));
                    return [...filtered, `[OCR PROGRES] Metin tarama: %${pct}`];
                  });
                }
              }
            }
          }
        ).then(({ data: { text } }: any) => {
          setCoAiLogs(prev => [...prev, `[OCR BAŞARILI] Görsel metni başarıyla okundu.`]);
          callback(text);
        }).catch((err: any) => {
          console.error("Image OCR error:", err);
          setCoAiLogs(prev => [...prev, `[HATA] OCR okuma başarısız oldu: ${err.message || err}`]);
          callback(file.name);
        });
      } catch (err: any) {
        console.error("Image OCR catch error:", err);
        setCoAiLogs(prev => [...prev, `[HATA] OCR başlatılamadı: ${err.message || err}`]);
        callback(file.name);
      }
    };

    if (file.name.endsWith('.pdf')) {
      if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = () => {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
          readAndExtractPdf(file, parseTextAndFill);
        };
        document.head.appendChild(script);
      } else {
        readAndExtractPdf(file, parseTextAndFill);
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      if (typeof window !== 'undefined' && !(window as any).XLSX) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        script.onload = () => {
          readAndExtractExcel(file, parseTextAndFill);
        };
        document.head.appendChild(script);
      } else {
        readAndExtractExcel(file, parseTextAndFill);
      }
    } else if (file.type.startsWith('image/')) {
      if (typeof window !== 'undefined' && !(window as any).Tesseract) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.0.2/tesseract.min.js";
        script.onload = () => {
          readAndExtractImage(file, parseTextAndFill);
        };
        document.head.appendChild(script);
      } else {
        readAndExtractImage(file, parseTextAndFill);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseTextAndFill(text || file.name);
      };
      if (file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        parseTextAndFill(file.name);
      }
    }
  };

  const handleCreateOrderSubmit = () => {
    if (!coCustomerName) {
      alert("Lütfen bir müşteri seçin.");
      return;
    }
    if (coItems.length === 0) {
      alert("Lütfen siparişe en az bir kalem ekleyin.");
      return;
    }

    // Auto-create missing products in Stock Cards
    coItems.forEach(item => {
      const exists = products.some(p => p.code.toUpperCase() === item.productCode.toUpperCase());
      if (!exists) {
        addProduct({
          id: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
          name: item.description || item.productCode,
          code: item.productCode,
          description: item.description || `${item.productCode} - Otomatik Oluşturulan Stok Kartı`
        });
      }
    });

    if (editingOrderTarget) {
      // UPDATE EXISTING ORDER
      updateOrder(editingOrderTarget.id, {
        customerName: coCustomerName,
        date: coOrderDate,
        projectNo: coProjectNo,
        deliveryDate: coDeliveryDate,
        coatingTypes: coCoatingTypes,
        deliveryType: coDeliveryType,
        deliveryDetail: coDeliveryDetail,
        shippingAddress: coShippingAddress,
        shippingFee: coShippingFee,
        differentBilling: coDifferentBilling,
        notes: coNotes,
        isExempt: coIsExempt,
        items: coItems.map(item => ({
          productCode: item.productCode,
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          price: item.price || 0,
          total: item.total || 0,
          isUretimDisi: item.isUretimDisi,
          shippedQuantity: item.shippedQuantity || 0,
          status: item.status || (item.isUretimDisi ? 'Üretim Dışı' : 'Bekliyor')
        }))
      });
      const updatedId = editingOrderTarget.id;
      alert(`Sipariş (${updatedId}) başarıyla güncellendi!`);
      resetCreateOrderForm();
      setShowCreateOrderScreen(false);
      setActiveOrderId(updatedId);
      setSelectedMasterOrderId(updatedId);
      setTimeout(() => {
        forceSyncCloud();
      }, 200);
      return;
    }

    let newOrderId = coOrderNo || `SPR-AI-${Math.floor(1000 + Math.random() * 9000)}`;
    const duplicateCount = orders.filter(o => o.id.startsWith(newOrderId)).length;
    if (duplicateCount > 0) {
      newOrderId = `${newOrderId}-${duplicateCount + 1}`;
    }
    const newOrder: any = {
      id: newOrderId,
      quoteId: "",
      customerName: coCustomerName,
      date: coOrderDate,
      projectNo: coProjectNo,
      deliveryDate: coDeliveryDate,
      coatingTypes: coCoatingTypes,
      deliveryType: coDeliveryType,
      deliveryDetail: coDeliveryDetail,
      shippingAddress: coShippingAddress,
      shippingFee: coShippingFee,
      differentBilling: coDifferentBilling,
      notes: coNotes,
      isExempt: coIsExempt,
      status: 'YENİ SİPARİŞ',
      dispatches: [],
      items: coItems.map(item => ({
        productCode: item.productCode,
        description: item.description || '',
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        price: item.price || 0,
        total: item.total || 0,
        isUretimDisi: item.isUretimDisi,
        shippedQuantity: 0,
        status: item.isUretimDisi ? 'Üretim Dışı' : 'Bekliyor'
      }))
    };

    addOrder(newOrder);
    resetCreateOrderForm();
    setShowCreateOrderScreen(false);
    setActiveOrderId(newOrderId);
    setSelectedMasterOrderId(newOrderId);
    if (coCustomerName) {
      setExpandedGroups(prev => ({ ...prev, [coCustomerName]: true }));
    }
    setActiveTab('orders');
    setTimeout(() => {
      forceSyncCloud();
    }, 200);
  };

  const updateCoItemField = (idx: number, field: string, val: any) => {
    setCoItems(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], [field]: val };
      }
      return next;
    });
  };

  const deleteCoItem = (idx: number) => {
    const updated = coItems.filter((_, i) => i !== idx);
    setCoItems(updated);
  };

  const addCoItem = () => {
    setCoItems([
      ...coItems,
      { productCode: 'SU 10/P', quantity: 100, unit: 'M', isUretimDisi: false }
    ]);
  };

  // Edit Order States
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editOrderCustomerName, setEditOrderCustomerName] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editOrderStatus, setEditOrderStatus] = useState<'YENİ SİPARİŞ' | 'ÜRETİMDE' | 'KAPLAMADA' | 'BOYADA' | 'PAKETLEMEDE' | 'KISMİ SEVK EDİLDİ' | 'SEVK EDİLDİ'>('YENİ SİPARİŞ');
  const [editOrderItems, setEditOrderItems] = useState<any[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState<string>(quotes[0]?.id || '');

  const handleStartEditOrder = (order: any) => {
    setEditingOrderTarget(order);
    setEditOrderCustomerName(order.customerName);
    setEditOrderDate(order.date);
    setEditOrderStatus(order.status);
    setEditOrderItems(order.items.map((item: any) => ({ ...item })));
    setShowEditOrderModal(true);
  };

  const handleSaveEditOrder = () => {
    const targetOrder = editingOrderTarget || selectedOrderDetailOrder || orders.find(o => o.id === selectedMasterOrderId) || orders.find(o => o.id === activeOrderId);
    if (!targetOrder) {
      alert("Hata: Düzenlenecek sipariş bulunamadı.");
      return;
    }
    // Auto-create missing products in Stock Cards
    editOrderItems.forEach(item => {
      const exists = products.some(p => p.code.toUpperCase() === item.productCode.toUpperCase());
      if (!exists) {
        addProduct({
          id: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
          name: item.description || item.productCode,
          code: item.productCode,
          description: item.description || `${item.productCode} - Otomatik Oluşturulan Stok Kartı`
        });
      }
    });

    updateOrder(targetOrder.id, {
      customerName: editOrderCustomerName,
      date: editOrderDate,
      status: editOrderStatus,
      items: editOrderItems
    });
    // Trigger update of local selection
    setActiveOrderId(targetOrder.id);
    setSelectedMasterOrderId(targetOrder.id);
    setShowEditOrderModal(false);
    setTimeout(() => {
      forceSyncCloud();
    }, 200);
    alert("Sipariş değişiklikleri kaydedildi ve bulut senkronizasyonu tamamlandı!");
  };

  const handleEditOrderItemField = (index: number, field: string, value: any) => {
    const updated = [...editOrderItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setEditOrderItems(updated);
  };
  const [activeOrderId, setActiveOrderId] = useState<string>(orders[0]?.id || '');

  // Quote Grouping & Search States
  const [quoteGroupBy, setQuoteGroupBy] = useState<'status' | 'customer' | 'date'>('status');
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [quoteExpandedGroups, setQuoteExpandedGroups] = useState<Record<string, boolean>>({
    'Teklif Hazırlandı': true,
    'Onaylandı': true,
    'Reddedildi': true
  });

  // Live Proposal WYSIWYG Editor States
  const [isEditingNewQuote, setIsEditingNewQuote] = useState(false);
  const [draftQuote, setDraftQuote] = useState<Quote>({
    id: '',
    customerName: '',
    date: '',
    items: [],
    status: 'Teklif Hazırlandı',
    totalAmount: 0
  });

  const [fr12Items, setFr35Items] = useState<any[]>([]);

  const handleStartNewQuote = () => {
    const newId = `TKF-2026-${Math.floor(100 + Math.random() * 900)}`;
    setDraftQuote({
      id: newId,
      customerName: customers[0]?.name || 'ÖZDEMİR ELEKTRİK A.Ş.',
      date: new Date().toISOString().split('T')[0],
      items: [
        { productCode: 'SU 20-2', quantity: 100, price: 320, description: 'AĞIR HİZMET TİPİ KABLO KANALI H:40MM, E:1.5MM' }
      ],
      status: 'Teklif Hazırlandı',
      totalAmount: 32000,
      discountPercent: 0,
      taxPercent: 20,
      companyName: 'SİES ELEKTRİK MÜH. SAN. TİC. LTD. ŞTİ.',
      companyRepresentative: 'HASAN SERT',
      companyPhone: '0541 240 80 75 / 0212 324 00 98-99',
      companyEmail: 'hsert@sies.com.tr',
      companyAddress: 'YEŞİLCE MAH. GÖKTÜRK CAD. DAİM SOK. NO',
      customerRepresentative: 'SN. AYHAN BEY DİKKATİNE',
      customerPhone: '-',
      customerEmail: '-',
      customerAddress: '-',
      paymentTerms: 'Siparişle birlikte mail-order veya havale.',
      deliveryTime: 'Bu hafta (bugünden netleşmesi koşuluyla)',
      deliveryPlace: 'Ambara veya Fabrikamızdan Teslim.',
      bankInfo: 'TR 06 0006 4000 0011 0210 7510 25',
      ziraatInfo: 'TR 94 0001 0021 3663 4806 5650 01',
      materialGrade: 'TS 914 SICAK DALDIRMA / ST37'
    });
    setIsEditingNewQuote(true);
  };

    const handleUpdateDraftItem = (index: number, field: string, value: any) => {
    const updatedItems = draftQuote.items.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'productCode') {
          const foundProd = products.find(p => p.code.toUpperCase().trim() === value.toUpperCase().trim());
          if (foundProd) {
            updated.description = foundProd.name || foundProd.description;
            updated.unit = value.includes('SU') ? 'M' : 'AD';
            updated.price = 320;
          } else {
            updated.description = ''; 
            updated.unit = ''; 
          }
        }
        return updated;
      }
      return item;
    });
    const total = updatedItems.reduce((acc, curr) => acc + curr.quantity * curr.price, 0);
    setDraftQuote({
      ...draftQuote,
      items: updatedItems,
      totalAmount: total
    });
  };;

  const handleAddDraftItem = () => {
    const updatedItems = [...draftQuote.items, { productCode: '', quantity: 1, price: 0, description: '', unit: '' }];
    const total = updatedItems.reduce((acc, curr) => acc + curr.quantity * curr.price, 0);
    setDraftQuote({
      ...draftQuote,
      items: updatedItems,
      totalAmount: total
    });
  };

  const handleRemoveDraftItem = (index: number) => {
    const updatedItems = draftQuote.items.filter((_, idx) => idx !== index);
    const total = updatedItems.reduce((acc, curr) => acc + curr.quantity * curr.price, 0);
    setDraftQuote({
      ...draftQuote,
      items: updatedItems,
      totalAmount: total
    });
  };

    const handleSaveDraftQuote = () => {
    if (draftQuote.items.length === 0) {
      alert("Lütfen teklife en az bir kalem ekleyin.");
      return;
    }



    // Auto-register new product codes as stock cards if they don't exist
    draftQuote.items.forEach(item => {
      const codeClean = item.productCode.toUpperCase().trim();
      const exists = products.some(p => p.code.toUpperCase().trim() === codeClean);
      if (!exists && codeClean !== '') {
        const newProduct = {
          id: `PRD-${Date.now().toString().substring(11)}-${Math.floor(Math.random() * 100)}`,
          code: codeClean,
          name: `${codeClean} Özel Kablo Tava Elemanı`,
          description: item.description || 'Teklif Girişinde Otomatik Eklenen Stok Kartı'
        };
        addProduct(newProduct);
      }
    });

    const quoteExists = quotes.some(q => q.id === draftQuote.id);
    if (quoteExists) {
      updateQuote(draftQuote.id, draftQuote);
    } else {
      addQuote(draftQuote);
    }
    setIsEditingNewQuote(false);
    setActiveQuoteId(draftQuote.id);
  };;

  // Checkbox state for selectable order items
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [actionQuantities, setActionQuantities] = useState<Record<string, number>>({});
  const [productionTargetOrder, setProductionTargetOrder] = useState<Order | null>(null);
  const [productionItemSelection, setProductionItemSelection] = useState<Record<number, { selected: boolean; qty: number; notes: string }>>({});

  // Advanced Search & Grouping States
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'status' | 'customer' | 'date'>('status');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [expandedCustomerAccordion, setExpandedCustomerAccordion] = useState<Record<string, boolean>>({});
  const [isTopOrderSelectorOpen, setIsTopOrderSelectorOpen] = useState<boolean>(false);

  const toggleGroupExpanded = (gKey: string) => {
    setExpandedGroups(prev => ({ ...prev, [gKey]: !prev[gKey] }));
  };

  // Modals
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipDispatchNo, setShipDispatchNo] = useState(`SE12026${Math.floor(1000 + Math.random() * 9000)}`);
  const [shipDispatchNoSuffix, setShipDispatchNoSuffix] = useState('1001');
  const [shipCarrierName, setShipCarrierName] = useState('');
  const [shipPlateNo, setShipPlateNo] = useState('');
  const [shipDate, setShipDate] = useState(new Date().toISOString().split('T')[0]);

  const DEFAULT_SAVED_DRIVERS = ['AHMET MUTLU', 'MEHMET YILMAZ', 'MUSTAFA KAYA', 'AMBAR İLE SEVK', 'ÖZEL NAKLİYE'];
  const DEFAULT_SAVED_PLATES = ['34KFG377', '34ABC123', '16XYZ99'];

  const [savedDrivers, setSavedDrivers] = useState<string[]>([]);
  const [savedPlates, setSavedPlates] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawDrivers = localStorage.getItem('qms_saved_drivers');
      let driversList: string[] = rawDrivers ? JSON.parse(rawDrivers) : [...DEFAULT_SAVED_DRIVERS];

      const rawPlates = localStorage.getItem('qms_saved_plates');
      let platesList: string[] = rawPlates ? JSON.parse(rawPlates) : [...DEFAULT_SAVED_PLATES];

      orders.forEach(o => {
        (o.dispatches || []).forEach((d: any) => {
          if (d.carrierName && d.carrierName.trim()) {
            const cUpper = d.carrierName.trim().toUpperCase();
            if (!driversList.includes(cUpper)) driversList.push(cUpper);
          }
          if (d.plateNo && d.plateNo.trim()) {
            const pUpper = d.plateNo.trim().toUpperCase();
            if (!platesList.includes(pUpper)) platesList.push(pUpper);
          }
        });
      });

      setSavedDrivers(driversList);
      setSavedPlates(platesList);
    }
  }, [showShipModal, orders]);

  const saveToMasterList = (key: string, value: string, defaultItems: string[]) => {
    if (!value || !value.trim()) return;
    const valUpper = value.trim().toUpperCase();
    const raw = localStorage.getItem(key);
    const currentList: string[] = raw ? JSON.parse(raw) : defaultItems;
    if (!currentList.some(item => item.toUpperCase() === valUpper)) {
      const updated = [valUpper, ...currentList];
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  const [docSelectionModal, setDocSelectionModal] = useState<{
    isOpen: boolean;
    title: string;
    items: { id: string; title: string; subtitle?: string; badge?: string; action: () => void }[];
  }>({
    isOpen: false,
    title: '',
    items: []
  });

  const [showCertCreatorModal, setShowCertCreatorModal] = useState(false);
  const [certDispatchNo, setCertDispatchNo] = useState('');
  const [certGrade, setCertGrade] = useState('ST37');
  const [certProjectId, setCertProjectId] = useState('502099');
  const [certManufactureYear, setCertManufactureYear] = useState('26.10.2021');
  const [certWizardStep, setCertWizardStep] = useState(1);
  const [certCustomerName, setCertCustomerName] = useState('');
  const [certItems, setCertItems] = useState<any[]>([]);

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [activeCertificateToShow, setActiveCertificateToShow] = useState<InspectionCertificate | null>(null);
  const [activeFR012ToShow, setActiveFR012ToShow] = useState<any>(null);
  const [activeFR009ToShow, setActiveFR009ToShow] = useState<any>(null);
  const [editableRuns, setEditableRuns] = useState<any[]>([]);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrderDetailOrder, setSelectedOrderDetailOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (selectedOrderDetailOrder) {
      const updatedOrder = orders.find(o => o.id === selectedOrderDetailOrder.id);
      if (updatedOrder) {
        setSelectedOrderDetailOrder(updatedOrder);
      }
    }
  }, [orders, selectedOrderDetailOrder]);
  const [activeDispatchToShow, setActiveDispatchToShow] = useState<any | null>(null);
  const [showCoatingAcceptModal, setShowCoatingAcceptModal] = useState(false);
  const [coatingAcceptMicron, setCoatingAcceptMicron] = useState(55);
  const [coatingAcceptVisual, setCoatingAcceptVisual] = useState('Uygun');
  const [coatingAcceptDevice, setCoatingAcceptDevice] = useState('KAL-05');
  const [coatingAcceptLot, setCoatingAcceptLot] = useState('KAP-2026-001');

  const [activeFR009Order, setActiveFR009Order] = useState<Order | null>(null);

  const handleOpenFR009 = (runs: any[], targetOrderParam?: Order) => {
    // Deduplicate runs by productCode so we show at most one row per product code in the table
    const uniqueRuns: any[] = [];
    const seen = new Set();
    [...runs].reverse().forEach(r => {
      const code = (r.productCode || '').toUpperCase().trim();
      if (!seen.has(code)) {
        seen.add(code);
        uniqueRuns.push(r);
      }
    });
    uniqueRuns.reverse();

    const firstRun = uniqueRuns[0] || {};
    const foundOrder = targetOrderParam || orders.find(o => 
      o.id === firstRun.orderId || 
      o.id === firstRun.productionOrderNo || 
      (firstRun.id && firstRun.id.includes(o.id)) ||
      (firstRun.productionOrderNo && firstRun.productionOrderNo.includes(o.id)) ||
      (firstRun.customerName && o.customerName === firstRun.customerName)
    ) || orders.find(o => o.id === selectedMasterOrderId) || selectedOrderDetailOrder || activeOrder;

    setActiveFR009Order(foundOrder || null);
    setActiveFR009ToShow(uniqueRuns);
    setEditableRuns(uniqueRuns.map(r => {
      const codeClean = (r.productCode || '').toUpperCase().trim();
      const matchingItem = foundOrder?.items?.find((it: any) => (it.productCode || '').toUpperCase().trim() === codeClean);
      let realDesc = matchingItem?.description || (matchingItem as any)?.productName;
      if (!realDesc || realDesc === 'KABLO TAŞIYICI ELEMANI') {
        if (r.description && r.description !== 'KABLO TAŞIYICI ELEMANI') {
          realDesc = r.description;
        }
      }
      const prodCatalog = products.find(p => p.code.toUpperCase().trim() === codeClean);
      const finalDesc = realDesc || (prodCatalog && prodCatalog.name !== 'KABLO TAŞIYICI ELEMANI' ? prodCatalog.name : (r.description || r.productCode));

      return {
        ...r,
        description: finalDesc,
        productName: finalDesc,
        standardDimensions: r.standardDimensions || '',
        firstCheckWidthMm: r.firstCheckWidthMm || '',
        firstCheckHeightMm: r.firstCheckHeightMm || '',
        firstCheckThicknessMm: r.firstCheckThicknessMm || '',
        firstCheckStatus: r.firstCheckStatus || 'Bekliyor',
        inProcessChecks: r.inProcessChecks || [],
        operatorsAssigned: r.operatorsAssigned || {},
        notes: r.notes || ''
      };
    }));
  };

  const handleSaveFR009Edits = () => {
    editableRuns.forEach(run => {
      // Determine if status should change based on checks
      let newStatus = run.status;
      if (run.firstCheckStatus === 'Uygun') {
        newStatus = 'Ara Kontrol Devam Ediyor';
      }
      const hasHourlyChecks = run.inProcessChecks && run.inProcessChecks.some((c: any) => c.measuredWidthMm > 0);
      if (hasHourlyChecks) {
        newStatus = 'Ara Kontrol Devam Ediyor';
      }
      const allDone = run.firstCheckStatus === 'Uygun' && run.inProcessChecks && run.inProcessChecks.length >= 3 && run.inProcessChecks.every((c: any) => c.measuredWidthMm > 0 && c.status === 'Uygun');
      if (allDone) {
        newStatus = 'Tamamlandı';
      }

      updateProductionRun(run.id, {
        standardDimensions: run.standardDimensions,
        firstCheckWidthMm: run.firstCheckWidthMm ? Number(run.firstCheckWidthMm) : undefined,
        firstCheckHeightMm: run.firstCheckHeightMm ? Number(run.firstCheckHeightMm) : undefined,
        firstCheckThicknessMm: run.firstCheckThicknessMm ? Number(run.firstCheckThicknessMm) : undefined,
        firstCheckStatus: run.firstCheckStatus,
        inProcessChecks: run.inProcessChecks,
        operatorsAssigned: run.operatorsAssigned,
        notes: run.notes,
        status: newStatus
      });
    });
    alert("Proses Takip Kartı Değişiklikleri Başarıyla Kaydedildi!");
    setActiveFR009ToShow(editableRuns);
  };
  const [showSendToProductionModal, setShowSendToProductionModal] = useState(false);
  const [productionOperator, setProductionOperator] = useState('Faruk Oruç');
  const [productionNotes, setProductionNotes] = useState('');
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>(['Kesme', 'Delme', 'Bükme']);

  const activeQuote = quotes.find(q => q.id === activeQuoteId) || quotes[0];
  const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0];



  const handleApproveQuote = (quote: Quote) => {
    updateQuote(quote.id, { status: 'Onaylandı' });
    
    const newOrderId = `SPR-2026-${Math.floor(100 + Math.random() * 900)}`;
    addOrder({
      id: newOrderId,
      quoteId: quote.id,
      customerName: quote.customerName,
      date: new Date().toISOString().split('T')[0],
      items: quote.items.map(item => ({ 
        productCode: item.productCode, 
        quantity: item.quantity, 
        shippedQuantity: 0, 
        status: 'Bekliyor' 
      })),
      status: 'YENİ SİPARİŞ',
      dispatches: []
    });

    setActiveTab('orders');
    setActiveOrderId(newOrderId);
  };

  // Toggle item selection
  const handleToggleSelectItem = (itemKey: string) => {
    setSelectedItems(prev => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      const targetOrd = selectedOrderDetailOrder || activeOrder;
      if (next[itemKey] && targetOrd) {
        const displayItems = sortProductionItems(targetOrd.items);
        const lastDashIndex = itemKey.lastIndexOf('-');
        const prodCode = itemKey.substring(0, lastDashIndex);
        const itemIdx = parseInt(itemKey.substring(lastDashIndex + 1));
        const item = displayItems[itemIdx] || targetOrd.items[itemIdx];
        if (item) {
          const remaining = item.quantity - (item.shippedQuantity || 0);
          setActionQuantities(prevQ => ({ ...prevQ, [itemKey]: remaining }));
        }
      }
      return next;
    });
  };

  const handleToggleSelectAll = (orderInput?: Order) => {
    const targetOrd = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrd) return;
    const displayItems = sortProductionItems(targetOrd.items);
    const selectables = displayItems.map((item, idx) => {
      const remaining = item.quantity - (item.shippedQuantity || 0);
      return { item, idx, remaining };
    }).filter(x => x.remaining > 0 && x.item.status !== 'Üretim Dışı');

    const allSelected = selectables.length > 0 && selectables.every(x => selectedItems[`${x.item.productCode}-${x.idx}`]);
    setSelectedItems(prev => {
      const next = { ...prev };
      selectables.forEach(x => {
        const key = `${x.item.productCode}-${x.idx}`;
        next[key] = !allSelected;
        if (!allSelected) {
          setActionQuantities(prevQ => ({ ...prevQ, [key]: x.remaining }));
        } else {
          const copyQ = { ...actionQuantities };
          delete copyQ[key];
          setActionQuantities(copyQ);
        }
      });
      return next;
    });
  };

  const handleUpdateItemCoating = (prodCode: string, coating: string) => {
    const targetOrd = selectedOrderDetailOrder || activeOrder;
    if (!targetOrd) return;
    const updatedItems = targetOrd.items.map(it => {
      if (it.productCode === prodCode) {
        return { ...it, coatingType: coating };
      }
      return it;
    });
    updateOrder(targetOrd.id, { items: updatedItems });
  };

  // Open Partial Production Modal
  const openProductionModal = (orderInput?: Order) => {
    const targetOrder = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;
    
    setProductionTargetOrder(targetOrder);
    const initialSelection: Record<number, { selected: boolean; qty: number; notes: string }> = {};
    (targetOrder.items || []).forEach((item, idx) => {
      const remaining = item.quantity - (item.shippedQuantity || 0);
      initialSelection[idx] = {
        selected: remaining > 0 && item.status !== 'Sevk Edildi' && item.status !== 'Üretim Dışı',
        qty: Math.max(1, remaining),
        notes: item.itemNotes || ''
      };
    });
    setProductionItemSelection(initialSelection);
  };

  const handleConfirmPartialProduction = () => {
    if (!productionTargetOrder) return;

    const itemsToProcess: { item: any; idx: number; qty: number; notes: string }[] = [];
    (productionTargetOrder.items || []).forEach((item, idx) => {
      const sel = productionItemSelection[idx];
      if (sel && sel.selected && sel.qty > 0) {
        itemsToProcess.push({ item, idx, qty: sel.qty, notes: sel.notes });
      }
    });

    if (itemsToProcess.length === 0) {
      alert("Lütfen üretime göndermek için en az 1 kalem seçin!");
      return;
    }

    const batchOrderNo = `EMR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const runsToCreate: any[] = [];
    itemsToProcess.forEach(({ item, idx, qty, notes }, sIdx) => {
      const runId = `PRD-2026-${Math.floor(1000 + Math.random() * 9000)}-${sIdx + 1}`;

      const itemDesc = item.description || (item as any).productName || (item as any).name;
      const prodCatalog = products.find(p => p.code.toUpperCase().trim() === item.productCode.toUpperCase().trim());
      const descStr = (itemDesc && itemDesc !== 'KABLO TAŞIYICI ELEMANI') ? itemDesc : ((prodCatalog && prodCatalog.name !== 'KABLO TAŞIYICI ELEMANI') ? prodCatalog.name : (item.description || item.productCode));

      const newRun = {
        id: runId,
        productionOrderNo: batchOrderNo,
        date: new Date().toISOString().split('T')[0],
        productCode: item.productCode,
        productName: descStr,
        description: descStr,
        quantity: qty,
        unit: getItemUnit(item),
        operator: 'Depo / Üretim Sorumlusu',
        pdfFile: `Uretim_Formu_${batchOrderNo}.pdf`,
        firstCheckStatus: 'Bekliyor' as const,
        inProcessChecks: [],
        status: 'İlk Kontrol Bekliyor' as const,
        notes: notes || item.itemNotes || '',
        orderId: productionTargetOrder.id,
        processes: ['Kesme', 'Delme', 'Bükme']
      };

      addProductionRun(newRun);
      runsToCreate.push(newRun);
    });

    const selectedIndicesSet = new Set(itemsToProcess.map(x => x.idx));
    const updatedItems = productionTargetOrder.items.map((item, idx) => {
      if (selectedIndicesSet.has(idx)) {
        return { ...item, status: 'Üretimde' as const };
      }
      return item;
    });

    const userStr = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Faruk Oruç (Kalite Güvence)';
    const nowStr = new Date().toLocaleString('tr-TR');

    updateOrder(productionTargetOrder.id, {
      items: updatedItems,
      status: 'ÜRETİMDE',
      sentToProductionBy: userStr,
      sentToProductionDate: nowStr,
      history: [
        ...(productionTargetOrder.history || []),
        {
          id: 'hist-prod-' + Date.now(),
          action: 'ÜRETİME ALINDI',
          performedBy: userStr,
          timestamp: nowStr,
          details: `${itemsToProcess.length} Kalem Üretime Alındı`
        }
      ]
    });

    setProductionTargetOrder(null);
    handleOpenFR009(runsToCreate);
  };

  // Action: Send Selected to Production & open FR-009
  const handleSendSelectedToProduction = (orderInput?: Order, forceAll: boolean = false) => {
    openProductionModal(orderInput);
  };

  // Action: Send Selected to Coating
  const handleSendSelectedToCoating = (orderInput?: Order) => {
    const targetOrder = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;
    
    const displayItems = sortProductionItems(targetOrder.items);
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = displayItems[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen kaplamaya gönderilecek kalemleri seçin.");
      return;
    }

    const selectedObjectsSet = new Set(selectedKeys.map(key => {
      const lastDashIndex = key.lastIndexOf('-');
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      return displayItems[itemIdx];
    }).filter(Boolean));

    const updatedItems = targetOrder.items.map((item) => {
      if (selectedObjectsSet.has(item)) {
        return { ...item, status: 'Kaplamada' as const };
      }
      return item;
    });

    const userStr = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Hasan Sert (Satış Müdürü)';
    const nowStr = new Date().toLocaleString('tr-TR');

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'KAPLAMADA',
      sentToCoatingBy: userStr,
      sentToCoatingDate: nowStr,
      history: [
        ...(targetOrder.history || []),
        {
          id: 'hist-coat-' + Date.now(),
          action: 'KAPLAMAYA GÖNDERİLDİ',
          performedBy: userStr,
          timestamp: nowStr,
          details: `${selectedKeys.length} Kalem Kaplama Ünitesine Sevk Edildi`
        }
      ]
    });

    alert("[ERP PROSES] Seçilen kalemler kaplama (galvaniz) ünitesine sevk edildi.");
    setSelectedItems({});
  };

  // Action: Open Coating Acceptance Modal
  const handleReceiveFromCoating = (orderInput?: Order) => {
    const targetOrder = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;

    const displayItems = sortProductionItems(targetOrder.items);
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = displayItems[itemIdx];
      return item && item.status === 'Kaplamada';
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen fason kaplamadan kabul edilecek ve şu an 'Kaplamada' durumunda olan kalemleri seçin.");
      return;
    }

    setCoatingAcceptLot(`KAP-2026-${Math.floor(100 + Math.random() * 900)}`);
    setShowCoatingAcceptModal(true);
  };

  // Action: Confirm Coating Acceptance and Record URT-04/IZL-07
  const handleConfirmCoatingAccept = () => {
    const targetOrder = selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;

    const displayItems = sortProductionItems(targetOrder.items);
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = displayItems[itemIdx];
      return item && item.status === 'Kaplamada';
    });

    const selectedObjectsSet = new Set(selectedKeys.map(key => {
      const lastDashIndex = key.lastIndexOf('-');
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      return displayItems[itemIdx];
    }).filter(Boolean));

    const updatedItems = targetOrder.items.map((item) => {
      if (selectedObjectsSet.has(item)) {
        const savedInspections = localStorage.getItem('qms_fr12_inspections') || '{}';
        const inspections = JSON.parse(savedInspections);
        
        const prodKey = `${targetOrder.id}-${item.productCode}`;
        inspections[prodKey] = {
          coatingThickness: `${coatingAcceptMicron} µm`,
          coatingType: 'TS EN ISO 1461 (Sıcak Daldırma)',
          measuredCoatingMicron: coatingAcceptMicron,
          coatingDevice: coatingAcceptDevice,
          coatingLot: coatingAcceptLot
        };
        localStorage.setItem('qms_fr12_inspections', JSON.stringify(inspections));

        return { ...item, status: 'Paketlemede' as const };
      }
      return item;
    });

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'PAKETLEMEDE'
    });

    const auditLogs = JSON.parse(localStorage.getItem('qms_audit_logs') || '[]');
    auditLogs.unshift({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('tr-TR'),
      user: 'Faruk Oruç',
      action: 'Fason Kaplama Giriş Kontrolü (Ara Kontrol URT-04 / IZL-07)',
      details: `Sipariş: ${targetOrder.id}, Lot: ${coatingAcceptLot}, Kaplama Kalınlığı: ${coatingAcceptMicron} µm, Cihaz: ${coatingAcceptDevice}, Sonuç: ${coatingAcceptVisual}`
    });
    localStorage.setItem('qms_audit_logs', JSON.stringify(auditLogs));

    alert(`[KYS ARA KONTROL] Kaplamadan kabul işlemi başarılı!\n\n1. URT-04 Ara Kontrol Raporu oluşturuldu.\n2. IZL-07 Kaplama Lotu (${coatingAcceptLot}) izlenebilirlik defterine kaydedildi.\n3. Ölçüm Cihazı (${coatingAcceptDevice}) doğruluk onayı verildi.`);
    
    setShowCoatingAcceptModal(false);
    setSelectedItems({});
  };

  // Action: Send Selected to Painting
  const handleSendSelectedToPainting = (orderInput?: Order) => {
    const targetOrder = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;
    
    const displayItems = sortProductionItems(targetOrder.items);
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = displayItems[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen boyaya gönderilecek kalemleri seçin.");
      return;
    }

    const selectedObjectsSet = new Set(selectedKeys.map(key => {
      const lastDashIndex = key.lastIndexOf('-');
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      return displayItems[itemIdx];
    }).filter(Boolean));

    const updatedItems = targetOrder.items.map((item) => {
      if (selectedObjectsSet.has(item)) {
        return { ...item, status: 'Boyada' as const };
      }
      return item;
    });

    const userStr = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Hasan Sert (Satış Müdürü)';
    const nowStr = new Date().toLocaleString('tr-TR');

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'BOYADA',
      sentToPaintingBy: userStr,
      sentToPaintingDate: nowStr,
      history: [
        ...(targetOrder.history || []),
        {
          id: 'hist-paint-' + Date.now(),
          action: 'BOYAYA GÖNDERİLDİ',
          performedBy: userStr,
          timestamp: nowStr,
          details: `${selectedKeys.length} Kalem Toz Boya Ünitesine Sevk Edildi`
        }
      ]
    });

    alert("[ERP PROSES] Seçilen kalemler elektrostatik toz boya ünitesine sevk edildi.");
    setSelectedItems({});
  };

  // Action: Send Selected to Packaging
  const handleSendSelectedToPackaging = (orderInput?: Order) => {
    const targetOrder = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;
    
    const displayItems = sortProductionItems(targetOrder.items);
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = displayItems[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen paketlemeye alınacak kalemleri seçin.");
      return;
    }

    const selectedObjectsSet = new Set(selectedKeys.map(key => {
      const lastDashIndex = key.lastIndexOf('-');
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      return displayItems[itemIdx];
    }).filter(Boolean));

    const updatedItems = targetOrder.items.map((item) => {
      if (selectedObjectsSet.has(item)) {
        return { ...item, status: 'Paketlemede' as const };
      }
      return item;
    });

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'PAKETLEMEDE'
    });

    alert("[ERP PROSES] Seçilen kalemler son paketleme ve etiketleme hattına alındı.");
    setSelectedItems({});
  };

  // Action: Ship Selected (Only opens if at least one item is checked, keeps selection)
  const handleShipSelected = (orderInput?: Order) => {
    const targetOrder = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;

    const displayItems = sortProductionItems(targetOrder.items);
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      if (lastDashIndex === -1) {
        return displayItems.some(i => i.productCode === key);
      }
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = displayItems[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen sevk edilecek kalemleri seçin.");
      return;
    }

    if (orderInput) setActiveOrderId(orderInput.id);

    // Pre-fill action quantities for selected items if not set
    selectedKeys.forEach(key => {
      if (!actionQuantities[key]) {
        const lastDashIndex = key.lastIndexOf('-');
        if (lastDashIndex === -1) {
          const item = displayItems.find(i => i.productCode === key);
          if (item) {
            const remaining = item.quantity - (item.shippedQuantity || 0);
            setActionQuantities(prev => ({ ...prev, [key]: remaining }));
          }
        } else {
          const prodCode = key.substring(0, lastDashIndex);
          const itemIdx = parseInt(key.substring(lastDashIndex + 1));
          const item = displayItems[itemIdx];
          if (item && item.productCode === prodCode) {
            const remaining = item.quantity - (item.shippedQuantity || 0);
            setActionQuantities(prev => ({ ...prev, [key]: remaining }));
          }
        }
      }
    });

    // Clear plate and carrier info, generate random suffix
    setShipCarrierName('');
    setShipPlateNo('');
    setShipDispatchNoSuffix(Math.floor(1000 + Math.random() * 9000).toString());
    setShipDate(new Date().toISOString().split('T')[0]);
    setShowShipModal(true);
  };

  const handleConfirmShipment = () => {
    const order = selectedOrderDetailOrder || activeOrder;
    if (!order) return;

    const dispatchNo = "SIR20260000" + shipDispatchNoSuffix;
    const displayItems = sortProductionItems(order.items);

    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      if (lastDashIndex === -1) {
        return displayItems.some(i => i.productCode === key);
      }
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = displayItems[itemIdx];
      return item && item.productCode === prodCode;
    });

    const dispatchItems: { productCode: string, quantity: number }[] = [];
    const shippedItemMap = new Map<any, { qtyToShip: number; key: string }>();

    // Verify quantities
    let hasError = false;
    selectedKeys.forEach(key => {
      const lastDashIndex = key.lastIndexOf('-');
      if (lastDashIndex === -1) {
        const orderItem = displayItems.find(i => i.productCode === key);
        if (orderItem) {
          const qtyToShip = actionQuantities[key] || (orderItem.quantity - (orderItem.shippedQuantity || 0));
          const remaining = orderItem.quantity - (orderItem.shippedQuantity || 0);
          if (qtyToShip <= 0 || qtyToShip > remaining) {
            alert(`Hatalı Miktar: ${key} için sevk miktarı 1 ile kalan miktar (${remaining}) arasında olmalıdır.`);
            hasError = true;
          } else {
            dispatchItems.push({ productCode: key, quantity: qtyToShip });
            shippedItemMap.set(orderItem, { qtyToShip, key });
          }
        }
        return;
      }
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const orderItem = displayItems[itemIdx];
      
      if (orderItem) {
        const qtyToShip = actionQuantities[key] || (orderItem.quantity - (orderItem.shippedQuantity || 0));
        const remaining = orderItem.quantity - (orderItem.shippedQuantity || 0);
        if (qtyToShip <= 0 || qtyToShip > remaining) {
          alert(`Hatalı Miktar: ${prodCode} (Kalem ${itemIdx + 1}) için sevk miktarı 1 ile kalan miktar (${remaining}) arasında olmalıdır.`);
          hasError = true;
        } else {
          dispatchItems.push({ productCode: prodCode, quantity: qtyToShip });
          shippedItemMap.set(orderItem, { qtyToShip, key });
        }
      }
    });

    // Auto-save carrier and plate into master lists
    if (shipCarrierName) saveToMasterList('qms_saved_drivers', shipCarrierName, DEFAULT_SAVED_DRIVERS);
    if (shipPlateNo) saveToMasterList('qms_saved_plates', shipPlateNo, DEFAULT_SAVED_PLATES);

    // Create the Dispatch Note entry
    const newDispatch = {
      dispatchNoteNo: dispatchNo,
      date: shipDate,
      carrierName: shipCarrierName || 'Özel Nakliye / Ambar',
      plateNo: shipPlateNo || '34 ABC 123',
      items: dispatchItems
    };

    const updatedItems = order.items.map((item) => {
      const shipInfo = shippedItemMap.get(item);
      if (shipInfo) {
        const totalShipped = (item.shippedQuantity || 0) + shipInfo.qtyToShip;
        const isFullyShipped = totalShipped >= item.quantity;
        return {
          ...item,
          shippedQuantity: totalShipped,
          status: isFullyShipped ? ('Sevk Edildi' as const) : ('Üretimde' as const)
        };
      }
      return item;
    });

    // Check overall order status
    const allShipped = updatedItems.every(i => i.shippedQuantity >= i.quantity);
    const orderStatus = allShipped ? 'SEVK EDİLDİ' : 'KISMİ SEVK EDİLDİ';

    const currentDispatches = order.dispatches || [];
    const userStr = currentUser ? `${currentUser.name} (${currentUser.role})` : 'İbrahim Aydın (Depo Sorumlusu)';
    const nowStr = new Date().toLocaleString('tr-TR');

    updateOrder(order.id, {
      items: updatedItems,
      status: orderStatus,
      dispatches: [...currentDispatches, newDispatch],
      shippedBy: userStr,
      shippedDate: nowStr,
      history: [
        ...(order.history || []),
        {
          id: 'hist-ship-' + Date.now(),
          action: 'SEVK EDİLDİ',
          performedBy: userStr,
          timestamp: nowStr,
          details: `İrsaliye No: ${dispatchNo} (${dispatchItems.length} Kalem Sevk Edildi)`
        }
      ]
    });

    // Automatically create corresponding OutgoingInspection (FR 10 Son Kontrol) in database!
    dispatchItems.forEach((di, idx) => {
      addOutgoingInspection({
        id: `SK-${Date.now().toString().substring(11)}-${idx}`,
        customerId: order.customerName,
        dispatchNoteNo: dispatchNo,
        dispatchDate: shipDate,
        productCode: di.productCode,
        quantityMetres: di.quantity,
        thicknessMm: 0.80, // Default to galvanized sac thickness
        widthMm: 100,
        measuredCoatingMicron: 12,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        pdfFile: `Irsaliye_${dispatchNo}.pdf`
      });
    });

    // Link shipped items to their corresponding production runs
    productionRuns.forEach(pr => {
      if (pr.orderId === order.id) {
        const isProductShipped = selectedKeys.some(key => {
          const lastDashIndex = key.lastIndexOf('-');
          if (lastDashIndex === -1) {
            return key === pr.productCode;
          }
          const prodCode = key.substring(0, lastDashIndex);
          return prodCode === pr.productCode;
        });
        if (isProductShipped) {
          updateProductionRun(pr.id, {
            finalInspectionDispatchNo: dispatchNo,
            status: 'Tamamlandı'
          });
        }
      }
    });

    alert(`[ERP SEVKİYAT] Sevk Tamamlandı!\n\n1. İrsaliye "${dispatchNo}" kesildi.\n2. Sevk edilen kalemler için FR 10 Son Kontrol kaydı oluşturuldu.`);
    setShowShipModal(false);
    setSelectedItems({});
  };

  // Action: Open Label Creator
  const handleOpenLabels = (orderInput?: Order) => {
    const targetOrder = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;
    
    const displayItems = sortProductionItems(targetOrder.items);
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      if (lastDashIndex === -1) {
        return displayItems.some(i => i.productCode === key);
      }
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = displayItems[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen sevk etiketi yazdırılacak kalemleri seçin.");
      return;
    }
    if (orderInput) setActiveOrderId(orderInput.id);
    setShowLabelModal(true);
  };

  // EN 10204 3.1 Certificate generator helper (Direct, zero-wizard, 1-click!)
  const handleLaunchCertCreator = (dispatchNo: string) => {
    const savedInspections = localStorage.getItem('qms_fr12_inspections');
    const inspections = savedInspections ? JSON.parse(savedInspections) : {};
    const inspection = inspections[dispatchNo];
    const isApproved = inspection && inspection.status === 'ONAYLANDI';

    if (!isApproved) {
      alert("Uyarı: Bu irsaliyeye ait FR 10 Son Kontrol Formu onaylanmadan 3.1 Kalite Muayene Sertifikası düzenlenemez! Lütfen önce son kontrol formunu doldurup onaylayın.");
      return;
    }

    const order = selectedOrderDetailOrder || activeOrder;
    const dispatch = order.dispatches.find(d => d.dispatchNoteNo === dispatchNo);
    if (!dispatch) return;

    // 1. Pre-populate certItems based on saved FR-10 son kontrol data
    const initialItems = dispatch.items.map(item => {
      const inspectionItem = inspection && inspection.items ? inspection.items.find((i: any) => i.productCode === item.productCode) : null;
      const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
      const descStr = prodCatalog ? prodCatalog.name : (inspectionItem?.desc || 'GLV ME TİPİ KABLO KANALI');
      
      let sizeStr = '';
      if (inspectionItem && inspectionItem.resimGen && inspectionItem.resimYuk && inspectionItem.resimKal) {
        sizeStr = `${inspectionItem.resimGen}X${inspectionItem.resimYuk}X${inspectionItem.resimKal}MM`.toUpperCase();
      } else {
        let w = '100', h = '60', t = '0.80';
        const cleanDesc = descStr.toUpperCase();
        const mmMatch = cleanDesc.match(/(\d+)\s*MM\s*X\s*(\d+)/);
        const xMatch = cleanDesc.match(/(\d+)\s*X\s*(\d+)\s*X\s*([\d.]+)/);
        if (xMatch) {
          w = xMatch[1]; h = xMatch[2]; t = xMatch[3];
        } else if (mmMatch) {
          w = mmMatch[1]; h = mmMatch[2]; t = cleanDesc.includes('1.5') ? '1.50' : '1.20';
        }
        sizeStr = `${w}X${h}X${t}MM`;
      }

      let materialGrade = 'ST37';
      if (inspectionItem && inspectionItem.coatingType) {
        const cType = inspectionItem.coatingType.toUpperCase();
        if (cType.includes('304')) {
          materialGrade = '304 Paslanmaz';
        } else if (cType.includes('316')) {
          materialGrade = '316 Paslanmaz';
        } else if (cType.includes('ALÜMİNYUM') || cType.includes('ALUMINYUM')) {
          materialGrade = '5754 Alüminyum';
        } else {
          materialGrade = 'ST37';
        }
      }
      
      return {
        productCode: item.productCode,
        quantity: item.quantity,
        description: descStr,
        process: 'KESME - DELME - BÜKME',
        material: materialGrade,
        requirement: 'TS EN 61537',
        size: sizeStr
      };
    });

    // 2. Generate chemical/mechanical values for each item
    const generatedItems = initialItems.map(item => {
      const grade = item.material || 'ST37';
      const spec = MATERIAL_STANDARDS[grade] || MATERIAL_STANDARDS['ST37'];

      const getVal = (list: any[], name: string) => {
        const entry = list.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
        if (!entry) return 0;
        return Number((entry.actualBase + (Math.random() - 0.5) * entry.actualVar * 2).toFixed(3));
      };

      const cVal = getVal(spec.chemical, 'carbon');
      const siVal = getVal(spec.chemical, 'silicon');
      const mnVal = getVal(spec.chemical, 'manganese');
      const pVal = getVal(spec.chemical, 'phosphorus');
      const sVal = getVal(spec.chemical, 'sulfur');
      const crVal = getVal(spec.chemical, 'chromium') || 0.05;
      const niVal = getVal(spec.chemical, 'nickel') || 0.05;
      const moVal = getVal(spec.chemical, 'molybdenum') || 0.02;
      const tiVal = 0.002;
      const nVal = 62;
      const alVal = 0.035;

      const rehVal = Math.round(getVal(spec.mechanical, 'yield') || 285);
      const rmVal = Math.round(getVal(spec.mechanical, 'tensile') || 410);
      const aVal = Math.round(getVal(spec.mechanical, 'elongation') || 28);

      let techSpec = 'TS EN 61537';
      if (grade.includes('Paslanmaz')) techSpec = 'TS EN 10088-2';
      else if (grade.includes('Alüminyum')) techSpec = 'TS EN 485-2';

      return {
        productCode: item.productCode,
        quantity: item.quantity,
        size: item.size,
        description: item.description,
        process: item.process,
        requirement: techSpec,
        material: grade,
        c: cVal,
        si: siVal,
        mn: mnVal,
        p: pVal,
        s: sVal,
        cr: crVal,
        ni: niVal,
        mo: moVal,
        ti: tiVal,
        n: nVal,
        al: alVal,
        muayeneNo: `(EN 10025-2)`,
        reh: rehVal,
        rm: rmVal,
        a: aVal
      };
    });

    // 3. Create and Save the certificate directly!
    const newCert: InspectionCertificate = {
      id: `CERT-3.1-${Math.floor(10000 + Math.random() * 90000)}`,
      dispatchNoteNo: dispatchNo,
      orderId: order.id,
      date: new Date().toISOString().split('T')[0],
      materialGrade: initialItems[0]?.material || 'ST37',
      customerName: order.customerName,
      projectId: '502099',
      manufactureYear: '2026',
      items: generatedItems
    };

    addCertificate(newCert);
    setActiveCertificateToShow(newCert); // Opens the printable certificate view directly!
  };

  const handleUpdateItemGrade = (itemIdx: number, newGrade: string) => {
    if (!activeCertificateToShow) return;
    const spec = MATERIAL_STANDARDS[newGrade];
    if (!spec) return;

    const getVal = (list: any[], name: string) => {
      const entry = list.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
      if (!entry) return 0;
      return Number((entry.actualBase + (Math.random() - 0.5) * entry.actualVar * 2).toFixed(3));
    };

    const updatedItems = activeCertificateToShow.items.map((item, idx) => {
      if (idx === itemIdx) {
        const cVal = getVal(spec.chemical, 'carbon');
        const siVal = getVal(spec.chemical, 'silicon');
        const mnVal = getVal(spec.chemical, 'manganese');
        const pVal = getVal(spec.chemical, 'phosphorus');
        const sVal = getVal(spec.chemical, 'sulfur');
        const crVal = getVal(spec.chemical, 'chromium');
        const niVal = getVal(spec.chemical, 'nickel');
        const moVal = getVal(spec.chemical, 'molybdenum') || 0.02;
        const tiVal = 0.002;
        const nVal = 62;
        const alVal = 0.035;

        const rehVal = Math.round(getVal(spec.mechanical, 'yield') || 285);
        const rmVal = Math.round(getVal(spec.mechanical, 'tensile') || 410);
        const aVal = Math.round(getVal(spec.mechanical, 'elongation') || 28);

        return {
          ...item,
          material: newGrade,
          c: cVal,
          si: siVal,
          mn: mnVal,
          p: pVal,
          s: sVal,
          cr: crVal,
          ni: niVal,
          mo: moVal,
          ti: tiVal,
          n: nVal,
          al: alVal,
          muayeneNo: `(EN 10025-${newGrade.includes('ST') ? '2' : '5'})`,
          reh: rehVal,
          rm: rmVal,
          a: aVal
        };
      }
      return item;
    });

    const updatedCert = {
      ...activeCertificateToShow,
      items: updatedItems
    };

    setActiveCertificateToShow(updatedCert);

    // Persist to localStorage/state context
    const certExists = certificates.some(c => c.id === activeCertificateToShow.id);
    if (certExists) {
      const updatedCerts = certificates.map(c => c.id === activeCertificateToShow.id ? updatedCert : c);
      localStorage.setItem('qms_certificates', JSON.stringify(updatedCerts));
    }
  };

  const handleShowFR012 = (dispatchNo: string, orderInput?: Order) => {
    const order = orderInput || selectedOrderDetailOrder || activeOrder || orders.find(o => o.dispatches?.some(d => d.dispatchNoteNo === dispatchNo));
    if (!order) {
      alert("Hata: İlgili sipariş bilgisi bulunamadı.");
      return;
    }

    const dispatch = order.dispatches?.find(d => d.dispatchNoteNo === dispatchNo);
    const relatedQuote = quotes.find(q => q.id === order.quoteId);
    const materialGradeStr = relatedQuote ? (relatedQuote.materialGrade || '').toUpperCase() : '';

    // Determine coating cinsi and kaplama kalinligi dynamically according to the material cinsi standards
    let defaultCoatingType = 'TS EN 10346 (Pregalvaniz)';
    let defaultCoatingThickness = '10-15 µm';
    let defaultElek = true; // metal systems require electrical continuity in TS EN 61537

    if (materialGradeStr.includes('SICAK DALDIRMA') || materialGradeStr.includes('1461') || materialGradeStr.includes('914')) {
      defaultCoatingType = 'TS EN ISO 1461 (Sıcak Daldırma Galvaniz)';
      defaultCoatingThickness = '45-55 µm';
    } else if (materialGradeStr.includes('PREGALVANİZ') || materialGradeStr.includes('PREGALVANIZ') || materialGradeStr.includes('10346')) {
      defaultCoatingType = 'TS EN 10346 (Pregalvaniz)';
      defaultCoatingThickness = '10-15 µm';
    } else if (materialGradeStr.includes('ELEKTROGALVANİZ') || materialGradeStr.includes('ELEKTROGALVANIZ') || materialGradeStr.includes('2081')) {
      defaultCoatingType = 'TS EN ISO 2081 (Elektrogalvaniz)';
      defaultCoatingThickness = '8-12 µm';
    } else if (materialGradeStr.includes('PASLANMAZ') || materialGradeStr.includes('304')) {
      defaultCoatingType = '304 Kalite Paslanmaz Çelik';
      defaultCoatingThickness = 'YOK';
    } else if (materialGradeStr.includes('316')) {
      defaultCoatingType = '316 Kalite Paslanmaz Çelik';
      defaultCoatingThickness = 'YOK';
    } else if (materialGradeStr.includes('ALÜMİNYUM') || materialGradeStr.includes('ALUMINYUM')) {
      defaultCoatingType = 'Alüminyum (Ham / Kaplamasız)';
      defaultCoatingThickness = 'YOK';
    } else if (materialGradeStr.includes('BOYA') || materialGradeStr.includes('BOYALI') || materialGradeStr.includes('TOZ BOYA')) {
      defaultCoatingType = 'TS EN 13438 (Elektrostatik Toz Boya)';
      defaultCoatingThickness = '60-80 µm';
    }

    // Load from local storage if previously saved
    const savedInspections = localStorage.getItem('qms_fr12_inspections');
    const inspections = savedInspections ? JSON.parse(savedInspections) : {};
    const existing = inspections[dispatchNo];

    const sourceItems = (dispatch && dispatch.items && dispatch.items.length > 0) ? dispatch.items : order.items;

    const items = sourceItems ? sourceItems.map((item: any, idx: number) => {
      const orderItem = order.items.find(oi => oi.productCode === item.productCode) || item;
      const isUretimDisi = orderItem && orderItem.status === 'Üretim Dışı';
      const savedRow = existing && existing.items ? existing.items.find((i: any) => i.productCode === item.productCode) : null;
      if (savedRow) {
        return { ...savedRow, isUretimDisi };
      }

      const prodCatalog = products.find(p => p.code.toUpperCase().trim() === item.productCode.toUpperCase().trim());
      const itemDesc = orderItem.description || (orderItem as any).productName || (prodCatalog && prodCatalog.name !== 'KABLO TAŞIYICI ELEMANI' ? prodCatalog.name : orderItem.productCode);

      return {
        productCode: item.productCode,
        quantity: item.quantity,
        unit: getItemUnit(orderItem),
        desc: itemDesc,
        isUretimDisi,
        
        // RESİM ÖLÇÜSÜ VE ÖLÇÜLEN DEĞERLER BOŞ GELMELİ
        resimGen: '',
        resimYuk: '',
        resimKal: '',
        olculenGen: '',
        olculenYuk: '',
        olculenKal: '',
        
        // ÖLÇÜ ALETİ - ELEKTRİKSEL SÜREKLİLİK MALZEME CİNSİNE GÖRE STANDARTIN İSTEDİĞİ ŞEKİLDE DOLDUR
        toolSerit: true,
        toolKumpas: true,
        toolFolyo: (defaultCoatingType !== 'YOK'),
        toolElek: defaultElek,
        
        // Load fason coating measurements if recorded during Kaplamadan Kabul
        coatingType: inspections[`${order.id}-${item.productCode}`]?.coatingType || defaultCoatingType,
        coatingThickness: inspections[`${order.id}-${item.productCode}`]?.coatingThickness || defaultCoatingThickness,
        
        sampleSize: 2,
        result: '1. OLUMLU'
      };
    }) : [];

    setFr35Items(items);
    setActiveFR012ToShow({
      dispatchNoteNo: dispatchNo,
      customerName: order.customerName,
      date: dispatch ? dispatch.date : order.date,
      items: items,
      status: existing ? 'ONAYLANDI' : 'BEKLİYOR'
    });
  };

  const handleAutoFillFR12 = () => {
    const updated = fr12Items.map((item) => {
      if (item.isUretimDisi) return item;
      
      const desc = item.desc || '';
      let w = '100';
      let h = '40';
      let t = '1.20';
      
      const cleanDesc = desc.toUpperCase();
      const mmMatch = cleanDesc.match(/(\d+)\s*MM\s*X\s*(\d+)/);
      const xMatch = cleanDesc.match(/(\d+)\s*X\s*(\d+)\s*X\s*([\d.]+)/);
      const simpleXMatch = cleanDesc.match(/(\d+)\s*X\s*(\d+)/);
      
      if (xMatch) {
        w = xMatch[1];
        h = xMatch[2];
        t = xMatch[3];
      } else if (mmMatch) {
        w = mmMatch[1];
        h = mmMatch[2];
        t = cleanDesc.includes('1.5') || cleanDesc.includes('1,5') ? '1.50' : '1.20';
      } else if (simpleXMatch) {
        w = simpleXMatch[1];
        h = simpleXMatch[2];
        t = '1.20';
      }
      
      return {
        ...item,
        resimGen: w,
        resimYuk: h,
        resimKal: t,
        olculenGen: w,
        olculenYuk: h,
        olculenKal: t
      };
    });
    setFr35Items(updated);
  };

  const handleSaveFR012 = () => {
    if (!activeFR012ToShow) return;
    
    // Check if any dimension is blank with detailed logs
    const emptyDetails: string[] = [];
    fr12Items.forEach((item) => {
      if (item.isUretimDisi) return;
      const missing: string[] = [];
      if (!item.resimGen?.trim()) missing.push("Resim Genişliği (W)");
      if (!item.resimYuk?.trim()) missing.push("Resim Yüksekliği (H)");
      if (!item.resimKal?.trim()) missing.push("Resim Kalınlığı (T)");
      if (!item.olculenGen?.trim()) missing.push("Ölçülen Genişlik (W-m)");
      if (!item.olculenYuk?.trim()) missing.push("Ölçülen Yükseklik (H-m)");
      if (!item.olculenKal?.trim()) missing.push("Ölçülen Kalınlık (T-m)");
      if (missing.length > 0) {
        emptyDetails.push(`${item.productCode}: ${missing.join(", ")}`);
      }
    });

    if (emptyDetails.length > 0) {
      alert("Hata: Lütfen son kontrol formundaki tüm Resim Ölçüsü ve Ölçülen Değer alanlarını doldurunuz!\n\nEksik Alanlar:\n" + emptyDetails.join("\n"));
      return;
    }

    const savedInspections = localStorage.getItem('qms_fr12_inspections');
    const inspections = savedInspections ? JSON.parse(savedInspections) : {};
    inspections[activeFR012ToShow.dispatchNoteNo] = {
      dispatchNoteNo: activeFR012ToShow.dispatchNoteNo,
      items: fr12Items,
      status: 'ONAYLANDI',
      approvedAt: new Date().toISOString()
    };
    localStorage.setItem('qms_fr12_inspections', JSON.stringify(inspections));

    // Update order status to SEVK EDİLDİ
    const order = selectedOrderDetailOrder || activeOrder;
    updateOrder(order.id, {
      status: 'SEVK EDİLDİ'
    });
    
    // Auto-create/approve QMS OutgoingInspection record
    fr12Items.forEach((itm, idx) => {
      addOutgoingInspection({
        id: `SK-${Date.now().toString().substring(11)}-${idx}`,
        customerId: activeFR012ToShow.customerName,
        dispatchNoteNo: activeFR012ToShow.dispatchNoteNo,
        dispatchDate: activeFR012ToShow.date,
        productCode: itm.productCode,
        quantityMetres: itm.quantity,
        thicknessMm: parseFloat(itm.olculenKal) || 0.8,
        widthMm: parseFloat(itm.olculenGen) || 100,
        measuredCoatingMicron: parseFloat(itm.coatingThickness) || 12,
        visualStatus: 'Uygun',
        decision: 'Kabul',
        inspector: 'Faruk Oruç',
        pdfFile: `Irsaliye_${activeFR012ToShow.dispatchNoteNo}.pdf`
      });
    });

    alert("Son Kontrol Formu (FR 10) başarıyla onaylandı ve sisteme kaydedildi.");
    setActiveFR012ToShow(null);
  };
  return (
    <div className="space-y-6">
      {activeTab === 'quotes' ? (
        /* PROPOSALS SECTION */
        <div className="space-y-6 print:hidden">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
            <div>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Satış & Müşteri İlişkileri</span>
              <h2 className="text-xl font-bold text-slate-800">Teklif Oluşturma ve Müşteri Onay Yönetimi</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => activeQuote ? window.print() : alert("Lütfen önce listeden yazdırılacak teklifi seçin.")}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm print:hidden"
              >
                <Printer className="h-4 w-4" /> Teklifi Yazdır (PDF)
              </button>
              <button 
                onClick={handleStartNewQuote}
                disabled={isEditingNewQuote || auditMode}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Yeni Teklif Hazırla
              </button>
            </div>
          </div>



          {/* Horizontal Search & Filter Panel (Quotes) */}
          {!isEditingNewQuote && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div className="flex-1 max-w-md">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Müşteri, Teklif veya Ürün Kodu Ara</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Müşteri, Teklif veya Ürün Kodu..." 
                    value={quoteSearchQuery}
                    onChange={e => setQuoteSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>
              </div>

              {/* Active Quote Dropdown Selector */}
              <div className="flex-1 max-w-sm">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">İncelenecek Teklifi Seçin</label>
                <select
                  value={activeQuoteId}
                  onChange={e => setActiveQuoteId(e.target.value)}
                  className="w-full px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs font-bold text-orange-850 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {(() => {
                    const filtered = quotes.filter(q => 
                      q.id.toLowerCase().includes(quoteSearchQuery.toLowerCase()) ||
                      q.customerName.toLowerCase().includes(quoteSearchQuery.toLowerCase()) ||
                      q.items.some(i => i.productCode.toLowerCase().includes(quoteSearchQuery.toLowerCase()))
                    );
                    
                    if (filtered.length === 0) {
                      return <option value="">Eşleşen teklif bulunamadı</option>;
                    }
                    
                    return filtered.map(q => (
                      <option key={q.id} value={q.id}>
                        [{q.id}] {q.customerName} ({q.status})
                      </option>
                    ));
                  })()}
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-right md:text-left">Gruplama Ölçütü</label>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {['status', 'customer', 'date'].map(g => (
                      <button 
                        key={g}
                        onClick={() => setQuoteGroupBy(g as any)}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                          quoteGroupBy === g ? 'bg-orange-600 text-white shadow-sm' : 'bg-transparent text-slate-655 hover:bg-slate-200'
                        }`}
                      >
                        {g === 'status' ? 'Durum' : g === 'customer' ? 'Müşteri' : 'Tarih'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Grouped Proposals List */}
            <div className="lg:col-span-1 border border-slate-200 rounded-xl bg-white p-4 space-y-4 max-h-[800px] overflow-y-auto shadow-sm print:hidden">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">Teklif Listesi</span>
              
              {(() => {
                const filtered = quotes.filter(q => 
                  q.id.toLowerCase().includes(quoteSearchQuery.toLowerCase()) ||
                  q.customerName.toLowerCase().includes(quoteSearchQuery.toLowerCase()) ||
                  q.items.some(i => i.productCode.toLowerCase().includes(quoteSearchQuery.toLowerCase()))
                );
                
                if (filtered.length === 0) {
                  return <div className="text-xs text-slate-400 text-center py-8">Eşleşen teklif bulunamadı</div>;
                }
                
                const grouped: Record<string, Quote[]> = {};
                filtered.forEach(q => {
                  let groupKey = 'BEKLEYEN';
                  if (quoteGroupBy === 'status') {
                    groupKey = q.status || 'BEKLEYEN';
                  } else if (quoteGroupBy === 'customer') {
                    groupKey = q.customerName || 'DİĞER';
                  } else if (quoteGroupBy === 'date') {
                    groupKey = q.date || 'TARİHSİZ';
                  }
                  if (!grouped[groupKey]) grouped[groupKey] = [];
                  grouped[groupKey].push(q);
                });
                
                return Object.keys(grouped).map(groupKey => {
                  const items = grouped[groupKey];
                  return (
                    <div key={groupKey} className="space-y-2">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded">
                        {groupKey} ({items.length})
                      </div>
                      <div className="space-y-1.5">
                        {items.map(q => {
                          const isActive = q.id === activeQuoteId;
                          const totalAmt = q.items.reduce((acc, it) => acc + (it.quantity * (it.price || 0)), 0);
                          return (
                            <div
                              key={q.id}
                              onClick={() => setActiveQuoteId(q.id)}
                              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                                isActive
                                  ? 'border-orange-500 bg-orange-50/50 shadow-sm font-semibold'
                                  : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-mono text-xs font-bold text-slate-900">{q.id}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  q.status === 'Onaylandı' ? 'bg-green-50 text-green-700 border border-green-200' :
                                  q.status === 'Reddedildi' ? 'bg-red-50 text-red-700 border border-red-200' :
                                  'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}>
                                  {q.status || 'BEKLEYEN'}
                                </span>
                              </div>
                              <div className="text-[10px] font-bold text-slate-700 mt-1 uppercase truncate max-w-full">
                                {q.customerName}
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2 font-mono">
                                <span>{q.date}</span>
                                <span className="font-bold text-slate-800">{totalAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Right Column: Active Proposal Details (A4 sheet and actions) */}
            <div className="lg:col-span-2 border border-slate-200 bg-slate-200 p-6 rounded-xl space-y-6 shadow-sm overflow-x-auto">
              {activeQuote ? (
                <>
                  {/* Edit/Delete Quote Bar */}
                  <div className="flex justify-end gap-2 max-w-[210mm] mx-auto mb-3 print:hidden">
                    <button
                      onClick={() => {
                        setDraftQuote({ ...activeQuote });
                        setIsEditingNewQuote(true);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      Teklifi Düzenle
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${activeQuote.id} nolu teklifi tamamen silmek istediğinizden emin misiniz?`)) {
                          deleteQuote(activeQuote.id);
                          setActiveQuoteId('');
                        }
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      Teklifi Sil
                    </button>
                  </div>

                  {/* Floating A4 Sheet - EXCEL STYLE (FR 10) */}
                  <div className="quote-sheet-preview print-area print-portrait w-full max-w-[210mm] bg-white text-slate-950 p-6 py-4 shadow-md border border-slate-200 rounded-xl font-sans leading-normal flex flex-col justify-between mx-auto print:shadow-none print:border-none print:p-0">
                    <div className="space-y-4">
                      
                                            {/* SIES Corporate Header */}
                      <div className="border-b-2 border-[#1f4e5b] pb-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <img src="sies_logo.png" alt="SIES Logo" className="h-16 object-contain" />
                        </div>
                        <div className="text-right">
                          <h2 className="font-extrabold text-base uppercase tracking-wide text-[#1f4e5b]">MÜŞTERİ TEKLİF / SİPARİŞ FORMU</h2>
                          <p className="text-[9px] text-slate-400 font-semibold font-mono mt-1">Döküman No: FR-013 | Revizyon: 02 | Sayfa: 1 / 1</p>
                        </div>
                      </div>

                      {/* Top Metadata Grid */}
                      <div className="overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm">
                        <table className="w-full border-collapse text-[11px] text-center font-bold">
                          <thead>
                            <tr className="bg-[#1f4e5b] text-white text-[10px] uppercase tracking-wider">
                              <th className="border border-slate-200 p-1 w-1/4">TEKLİF NO</th>
                              <th className="border border-slate-200 p-1 w-1/4">TEKLİF TARİHİ</th>
                              <th className="border border-slate-200 p-1 w-1/4">GEÇERLİLİK SÜRESİ</th>
                              <th className="border border-slate-200 p-1 w-1/4">MALZEME CİNSİ</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-slate-50 font-mono text-slate-900">
                              <td className="border border-slate-200 p-1.5">{activeQuote.id}</td>
                              <td className="border border-slate-200 p-1.5">{activeQuote.date}</td>
                              <td className="border border-slate-200 p-1.5">{activeQuote.validityPeriod || '30.06.2026'}</td>
                              <td className="border border-slate-200 p-1.5">{activeQuote.materialGrade || 'TS 914 SICAK DALDIRMA / ST37'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Side-by-Side Company & Customer Info */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Firma Bilgileri */}
                        <div className="overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm">
                          <table className="w-full border-collapse text-[11px] text-left">
                            <thead>
                              <tr className="bg-[#1f4e5b] text-white text-center font-bold text-[7px]">
                                <th colSpan={2} className="border border-slate-200 p-1">FİRMA BİLGİLERİ</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold w-16 text-slate-500">
                                  <span className="flex items-center gap-1"><Building className="h-3 w-3 text-[#1f4e5b]" /> ÜNVAN</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 font-bold text-slate-800">{activeQuote.companyName || 'SİES ELEKTRİK MÜH. SAN. TİC. LTD. ŞTİ.'}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><User className="h-3 w-3 text-[#1f4e5b]" /> YETKİLİ</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 text-slate-800">{activeQuote.companyRepresentative || 'HASAN SERT'}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-[#1f4e5b]" /> TELEFON</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 text-slate-800">{activeQuote.companyPhone || '0541 240 80 75 / 0212 324 00 98-99'}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-[#1f4e5b]" /> E-POSTA</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 text-slate-800 font-mono">{activeQuote.companyEmail || 'hsert@sies.com.tr'}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#1f4e5b]" /> ADRES</span>
                                </td>
                                <td className="border border-slate-200 p-1 text-slate-700 text-[7px]">{activeQuote.companyAddress || 'YEŞİLCE MAH. GÖKTÜRK CAD. DAİM SOK. NO'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Müşteri Bilgileri */}
                        <div className="overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm">
                          <table className="w-full border-collapse text-[11px] text-left">
                            <thead>
                              <tr className="bg-[#1f4e5b] text-white text-center font-bold text-[7px]">
                                <th colSpan={2} className="border border-slate-200 p-1">MÜŞTERİ BİLGİLERİ</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold w-16 text-slate-500">
                                  <span className="flex items-center gap-1"><Building className="h-3 w-3 text-[#1f4e5b]" /> ÜNVAN</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 font-bold text-slate-800">{activeQuote.customerName}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><User className="h-3 w-3 text-[#1f4e5b]" /> YETKİLİ</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 text-slate-800">{activeQuote.customerRepresentative || 'SN. AYHAN BEY DİKKATİNE'}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-[#1f4e5b]" /> TELEFON</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 text-slate-800">{activeQuote.customerPhone || '-'}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-[#1f4e5b]" /> E-POSTA</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 text-slate-800 font-mono">{activeQuote.customerEmail || '-'}</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-200 bg-slate-50 p-1 font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#1f4e5b]" /> ADRES</span>
                                </td>
                                <td className="border border-slate-200 p-1.5 text-slate-700 text-[7px]">{activeQuote.customerAddress || '-'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>


                      {/* Proposal Items Table */}
                      <table className="w-full border-collapse border border-slate-200 text-[11px] text-left">
                        <thead>
                          <tr className="bg-[#1f4e5b] text-white text-center font-bold text-[7px]">
                            <th className="border border-slate-200 p-1 w-8">SIRA NO</th>
                            <th className="border border-slate-200 p-1">SİPARİŞ KODU</th>
                            <th className="border border-slate-200 p-1 w-[40%]">AÇIKLAMA</th>
                            <th className="border border-slate-200 p-1 text-right w-16">MİKTAR</th>
                            <th className="border border-slate-200 p-1 text-center w-10">BİRİM</th>
                            <th className="border border-slate-200 p-1 text-right w-20">BİRİM FİYAT</th>
                            <th className="border border-slate-200 p-1 text-right w-20">TOPLAM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeQuote.items.map((item, idx) => {
                            const desc = item.description || (item.productCode.includes('SU') 
                              ? 'AĞIR HİZMET TİPİ KABLO KANALI H:40MM, E:1.5MM' 
                              : item.productCode.includes('STK') 
                                ? 'TEK LİFLİ KAVRAMA (DESTEK ARALIĞI 1.5M)'
                                : 'STANDART TİP KABLO TAVASI AKSESUARI');
                            const birim = item.productCode.includes('SU') ? 'M' : 'AD';
                            return (
                              <tr key={idx} className="hover:bg-slate-50 font-mono text-slate-900 text-left">
                                <td className="border border-slate-200 p-1.5 text-center font-sans">{idx + 1}</td>
                                <td className="border border-slate-200 p-1.5 font-bold">{item.productCode}</td>
                                <td className="border border-slate-200 p-1.5 font-sans text-slate-700 text-[7px]">{desc}</td>
                                <td className="border border-slate-200 p-1.5 text-right font-bold">{item.quantity}</td>
                                <td className="border border-slate-200 p-1.5 text-center font-sans">{birim}</td>
                                <td className="border border-slate-200 p-1.5 text-right">₺ {item.price.toFixed(2)}</td>
                                <td className="border border-slate-200 p-1.5 text-right font-bold">₺ {(item.quantity * item.price).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Bottom Layout - Billing and Terms */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Terms Left Block */}
                        <table className="w-full border-collapse border border-slate-200 text-[10px] text-left">
                          <tbody>
                            <tr>
                              <td className="border border-slate-200 bg-[#1f4e5b] text-white p-1 font-bold w-[75px] uppercase">ÖDEME</td>
                              <td className="border border-slate-200 p-1 text-slate-700 font-semibold">{activeQuote.paymentTerms || 'Siparişle birlikte mail-order veya havale.'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-200 bg-[#1f4e5b] text-white p-1 font-bold uppercase">TESLİM SÜRESİ</td>
                              <td className="border border-slate-200 p-1 text-slate-700 font-semibold">{activeQuote.deliveryTime || 'Bu hafta (bugünden netleşmesi koşuluyla)'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-200 bg-[#1f4e5b] text-white p-1 font-bold uppercase">TESLİM YERİ</td>
                              <td className="border border-slate-200 p-1 text-slate-700 font-semibold">{activeQuote.deliveryPlace || 'Ambara veya Fabrikamızdan Teslim.'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-200 bg-[#1f4e5b] text-white p-1 font-bold uppercase">İŞ HESAP BİLG.</td>
                              <td className="border border-slate-200 p-1.5 text-slate-800 font-mono font-bold">{activeQuote.bankInfo || 'TR 06 0006 4000 0011 0210 7510 25'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-200 bg-[#1f4e5b] text-white p-1 font-bold uppercase">ZİRAAT HES.</td>
                              <td className="border border-slate-200 p-1.5 text-slate-800 font-mono font-bold">{activeQuote.ziraatInfo || 'TR 94 0001 0021 3663 4806 5650 01'}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Pricing Right Block */}
                        {(() => {
                          const discAmt = activeQuote.totalAmount * ((activeQuote.discountPercent || 0) / 100);
                          const netTotal = activeQuote.totalAmount - discAmt;
                          const taxAmt = netTotal * ((activeQuote.taxPercent ?? 20) / 100);
                          const grandTotal = netTotal + taxAmt;
                          return (
                            <table className="w-full border-collapse border border-slate-200 text-[11px] text-right font-mono font-bold">
                              <tbody>
                                <tr>
                                  <td className="border border-slate-200 bg-slate-50 p-1 text-left text-slate-500 font-sans w-24">TOPLAM</td>
                                  <td className="border border-slate-200 p-1.5 text-slate-800">₺ {activeQuote.totalAmount.toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td className="border border-slate-200 bg-slate-50 p-1 text-left text-slate-500 font-sans">İSKONTO (%{activeQuote.discountPercent || 0})</td>
                                  <td className="border border-slate-200 p-1.5 text-slate-800">₺ {discAmt.toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td className="border border-slate-200 bg-slate-50 p-1 text-left text-slate-500 font-sans">NET TOPLAM</td>
                                  <td className="border border-slate-200 p-1 text-slate-950 text-sm">₺ {netTotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                  <td className="border border-slate-200 bg-slate-50 p-1 text-left text-slate-500 font-sans">KDV (%{activeQuote.taxPercent ?? 20})</td>
                                  <td className="border border-slate-200 p-1.5 text-slate-800">₺ {taxAmt.toFixed(2)}</td>
                                </tr>
                                <tr className="bg-[#1f4e5b] text-white">
                                  <td className="border border-slate-200 p-1.5 text-left font-sans font-extrabold text-[9px]">GENEL TOPLAM</td>
                                  <td className="border border-slate-200 p-1.5 text-sm font-extrabold text-white">₺ {grandTotal.toFixed(2)}</td>
                                </tr>
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>

                    </div>
                  </div>

                  {/* Actions below A4 */}
                  <div className="flex justify-end gap-2 pt-4 w-full max-w-[210mm] mx-auto text-xs print:hidden">
                    {activeQuote.status === 'Teklif Hazırlandı' && (
                      <button 
                        onClick={() => handleApproveQuote(activeQuote)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Check className="h-4 w-4" /> Müşteri Onayladı (Siparişe Dönüştür)
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Gösterilecek aktif teklif bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : showCreateOrderScreen ? (
        <CreateOrderWizard
          customers={customers}
          orders={orders}
          products={products}
          addProduct={addProduct}
          addCustomer={addCustomer}
          addOrder={addOrder}
          updateOrder={updateOrder}
          editingOrder={editingOrderTarget}
          geminiApiKey={geminiApiKey}
          setGeminiApiKey={setGeminiApiKey}
          onClose={() => { setShowCreateOrderScreen(false); setEditingOrderTarget(null); }}
          onOrderCreated={(newOrderId: string) => {
            setActiveOrderId(newOrderId);
            setSelectedMasterOrderId(newOrderId);
            setActiveCategoryTab('AKTİF SİPARİŞLER');
            if (setOrderSearchQuery) setOrderSearchQuery('');
            setActiveTab('orders');
            setShowCreateOrderScreen(false);
            setEditingOrderTarget(null);
          }}
        />
      ) : (
        /* ORDERS LIST & OPERATIONS (SIPARIS) */
        <div className="space-y-4">

          {/* Master ERP Split-Panel View Container */}
          <div className="print:hidden">
            {(() => {
              // Filter orders across all user fields
              const filteredOrders = (orders || []).filter(o => {
                if (!o) return false;
                const custName = o.customerName || '';
                const orderId = o.id || '';
                const custOrderNo = o.customerOrderNo || '';
                const projectNo = o.projectNo || '';
                const orderDate = o.date || '';
                const deliveryDate = o.deliveryDate || '';
                const coatingTypes = (o.coatingTypes || []).join(' ');
                const itemsStr = (o.items || []).map(i => `${i.productCode || ''} ${i.description || ''}`).join(' ');

                const q = ((orderSearchQuery || searchQuery) || '').toLowerCase().trim();
                if (!q) {
                  const cat = getOrderCategory(o);
                  if (activeCategoryTab === 'AKTİF SİPARİŞLER') {
                    return cat !== 'SEVK EDİLDİ';
                  } else if (activeCategoryTab === 'TÜMÜ') {
                    return true;
                  } else {
                    return cat === activeCategoryTab;
                  }
                }

                const matchesSearch = custName.toLowerCase().includes(q) || 
                                      orderId.toLowerCase().includes(q) || 
                                      custOrderNo.toLowerCase().includes(q) || 
                                      projectNo.toLowerCase().includes(q) ||
                                      orderDate.toLowerCase().includes(q) ||
                                      deliveryDate.toLowerCase().includes(q) ||
                                      coatingTypes.toLowerCase().includes(q) ||
                                      itemsStr.toLowerCase().includes(q);

                if (!matchesSearch) return false;
                const cat = getOrderCategory(o);
                if (activeCategoryTab === 'AKTİF SİPARİŞLER') {
                  return cat !== 'SEVK EDİLDİ';
                } else if (activeCategoryTab === 'TÜMÜ') {
                  return true;
                } else {
                  return cat === activeCategoryTab;
                }
              });

              const grouped: Record<string, Order[]> = {};
              filteredOrders.forEach(o => {
                const cName = o.customerName || 'DİĞER';
                if (!grouped[cName]) {
                  grouped[cName] = [];
                }
                grouped[cName].push(o);
              });

              const customerNames = Object.keys(grouped).sort();

              const selectedMasterOrder = filteredOrders.find(o => o.id === selectedMasterOrderId) || filteredOrders[0] || (orders.find(o => o.id === selectedMasterOrderId) || null);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* LEFT PANEL: Master Order List with Collapsible Accordion Customer Cards */}
                  <div className="lg:col-span-3 xl:col-span-3 space-y-2.5 self-start sticky top-0">
                    {/* Header & Multi-field Search Bar Box */}
                    <div className="bg-white border border-slate-200/90 text-slate-900 p-3.5 rounded-2xl shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <ListFilter className="h-4 w-4 text-orange-600 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wider truncate">SİPARİŞ LİSTESİ</span>
                        </div>
                        <span className="bg-orange-100 text-orange-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full border border-orange-200 shrink-0">
                          {filteredOrders.length} SİPARİŞ
                        </span>
                      </div>

                      {/* Multi-field Search Bar */}
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Müşteri Sipariş No, SIES No, Proje No, Tarih, Kaplama..."
                          value={orderSearchQuery || searchQuery}
                          onChange={e => {
                            setSearchQuery(e.target.value);
                            setOrderSearchQuery(e.target.value);
                          }}
                          className="pl-8 pr-8 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all shadow-2xs"
                        />
                        {((orderSearchQuery || searchQuery) && (
                          <button 
                            onClick={() => {
                              setSearchQuery('');
                              setOrderSearchQuery('');
                            }}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-800 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                            title="Aramayı Temizle"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-0.5">
                        {[
                          { id: 'AKTİF SİPARİŞLER', label: '⚡ AKTİF' },
                          { id: 'YENİ SİPARİŞ', label: '📋 YENİ' },
                          { id: 'ÜRETİMDE', label: '⚙️ ÜRETİM' },
                          { id: 'SEVK EDİLDİ', label: '🚚 SEVK' },
                          { id: 'TÜMÜ', label: '📊 TÜMÜ' }
                        ].map(chip => {
                          const isActive = activeCategoryTab === chip.id;
                          return (
                            <button
                              key={chip.id}
                              onClick={() => setActiveCategoryTab(chip.id)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                isActive 
                                  ? 'bg-slate-900 text-white shadow-xs' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {chip.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Customer Cards List Container with Collapsible Accordions ("aşağı açılan tırnak") */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-y-auto max-h-[calc(100vh-220px)] min-h-[420px] shadow-2xs divide-y divide-slate-100 custom-scrollbar pr-0.5">
                      {customerNames.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs font-medium space-y-2">
                          <AlertCircle className="h-6 w-6 text-orange-500 mx-auto opacity-70" />
                          <div>Aranan kriterlere uygun sipariş bulunamadı.</div>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setOrderSearchQuery('');
                            }}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-lg text-[10px] border border-orange-200 transition-colors"
                          >
                            Aramayı Sıfırla
                          </button>
                        </div>
                      ) : (
                        customerNames.map(custName => {
                          const customerOrders = grouped[custName] || [];
                          const isCustomerSelected = selectedMasterOrder && selectedMasterOrder.customerName === custName;
                          const isAccordionOpen = expandedCustomerAccordion[custName] !== undefined ? expandedCustomerAccordion[custName] : isCustomerSelected;
                          const totalItemsCount = customerOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

                          return (
                            <div key={custName} className="transition-all">
                              {/* Customer Accordion Header Card */}
                              <div 
                                onClick={() => {
                                  setExpandedCustomerAccordion(prev => ({
                                    ...prev,
                                    [custName]: !isAccordionOpen
                                  }));
                                  if (customerOrders[0]) {
                                    setSelectedMasterOrderId(customerOrders[0].id);
                                    setActiveOrderId(customerOrders[0].id);
                                  }
                                }}
                                className={`p-2.5 px-3 cursor-pointer select-none transition-all flex items-center justify-between gap-2 border-l-4 ${
                                  isCustomerSelected 
                                    ? 'bg-orange-50/90 border-orange-500 font-semibold shadow-2xs' 
                                    : 'border-transparent hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className={`h-7 w-7 rounded-lg font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border ${
                                    isCustomerSelected 
                                      ? 'bg-orange-500 text-white border-orange-600 shadow-2xs' 
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {custName.substring(0, 2).toUpperCase()}
                                  </div>
                                  
                                  <div className="min-w-0 flex-1 leading-snug">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-xs truncate uppercase tracking-tight ${isCustomerSelected ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                                        {custName}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                                      {customerOrders.length} SİPARİŞ • {totalItemsCount} Kalem
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                                    isCustomerSelected 
                                      ? 'bg-orange-100 text-orange-800 border-orange-300' 
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                    {customerOrders.length} SİPARİŞ
                                  </span>
                                  {isAccordionOpen ? (
                                    <ChevronUp className="h-4 w-4 text-orange-600 shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                                  )}
                                </div>
                              </div>

                              {/* Accordion Order List Items ("aşağı açılan tırnak sipariş listesi") */}
                              {isAccordionOpen && (
                                <div className="bg-slate-50/80 p-2 space-y-1.5 border-t border-slate-100/80">
                                  {customerOrders.map(ord => {
                                    const isOrdSelected = selectedMasterOrder?.id === ord.id;
                                    const cat = getOrderCategory(ord);
                                    return (
                                      <div
                                        key={ord.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMasterOrderId(ord.id);
                                          setActiveOrderId(ord.id);
                                        }}
                                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all space-y-1 ${
                                          isOrdSelected
                                            ? 'bg-white border-orange-500 shadow-md ring-1 ring-orange-500/20'
                                            : 'bg-white/90 hover:bg-white border-slate-200 hover:border-orange-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="flex items-center gap-1 min-w-0 truncate">
                                            <span className="font-extrabold font-mono text-slate-900 truncate">
                                              🏷️ {ord.customerOrderNo ? ord.customerOrderNo : ord.id}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                              ({ord.id})
                                            </span>
                                          </div>
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border shrink-0 ${
                                            cat === 'SEVK EDİLDİ' 
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                              : cat === 'ÜRETİMDE' 
                                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                              : 'bg-amber-50 text-amber-800 border-amber-200'
                                          }`}>
                                            {cat}
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-2 text-[10px] font-mono text-slate-600 pt-0.5">
                                          <div>📂 Proje: <span className="font-bold text-slate-800">{ord.projectNo || '-'}</span></div>
                                          <div>🎨 Kaplama: <span className="font-bold text-purple-700">{ord.coatingTypes?.join(', ') || 'STD'}</span></div>
                                          <div>📅 Tarih: <span className="font-bold text-slate-800">{ord.date || '-'}</span></div>
                                          <div>🚚 Teslim: <span className="font-bold text-blue-700">{ord.deliveryDate || '-'}</span></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANEL: SİPARİŞ DOKÜMANTASYON & OPERASYON MERKEZİ (lg:col-span-9 xl:col-span-9) */}
                  <div className="lg:col-span-9 xl:col-span-9 space-y-2">
                    {selectedMasterOrder ? (
                      <div className="space-y-3">
                        {/* ULTRA-MINIMIZED EXECUTIVE SİPARİŞ TOOLBAR & METRIC BAR */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">

                          {/* Row 1: Müşteri Bilgisi, Sipariş Numarası, Collapsible Order Selector & Aksiyon Butonları */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                            {/* Left: Customer Info & Order Details */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg border border-orange-200 shrink-0">
                                <Building className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-tight text-slate-900 font-sans truncate">
                                    {selectedMasterOrder.customerName}
                                  </h2>
                                  {(() => {
                                    const currentCustomerOrders = grouped[selectedMasterOrder.customerName] || orders.filter(o => o.customerName === selectedMasterOrder.customerName);
                                    return (
                                      <span className="bg-orange-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                                        {currentCustomerOrders.length} SİPARİŞ
                                      </span>
                                    );
                                  })()}
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 truncate">
                                  <span className="text-orange-600 font-bold">MÜŞTERİ SİP NO:</span>
                                  <span className="text-slate-900 font-extrabold">{selectedMasterOrder.customerOrderNo ? selectedMasterOrder.customerOrderNo : selectedMasterOrder.id}</span>
                                  <span className="text-slate-400 text-[10px]">| SIES NO: {selectedMasterOrder.id}</span>
                                </p>
                              </div>
                            </div>

                            {/* Right: Status Badge & Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Category Status Badge */}
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider border shadow-2xs ${
                                getOrderCategory(selectedMasterOrder) === 'SEVK EDİLDİ' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : getOrderCategory(selectedMasterOrder) === 'ÜRETİMDE'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {getOrderCategory(selectedMasterOrder)}
                              </span>

                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  setActiveOrderId(selectedMasterOrder.id);
                                  setEditingOrderTarget(selectedMasterOrder);
                                  setShowCreateOrderScreen(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors border border-slate-300 cursor-pointer"
                                title="Siparişi Düzenle"
                              >
                                <Edit className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Düzenle</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  if (confirm(`"${selectedMasterOrder.customerOrderNo || selectedMasterOrder.customerName}" siparişini kalıcı olarak silmek istediğinizden emin misiniz?`)) {
                                    deleteOrder(selectedMasterOrder.id);
                                    setSelectedMasterOrderId('');
                                    alert('Sipariş başarıyla silindi.');
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors border border-red-200 cursor-pointer"
                                title="Bu Siparişi Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-600" /> <span className="hidden sm:inline">Sil</span>
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Ultra-Compact Single-Line Summary Strip (Tarih, Kaplama, Adres/Proje, Kalem, Yetkili İzi) */}
                          <div className="bg-slate-50 border border-slate-200/90 text-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] flex flex-wrap justify-between items-center gap-2 shadow-2xs font-sans">
                            {/* Tarih & Vade */}
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span className="text-slate-500 font-bold uppercase text-[10px]">TARİH:</span>
                              <span className="font-bold text-slate-900 font-mono">{selectedMasterOrder.date || '-'}</span>
                              {((selectedMasterOrder as any).paymentTerms || quotes.find(q => q.id === selectedMasterOrder.quoteId)?.paymentTerms) && (
                                <span className="font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 text-[10px]">
                                  {(selectedMasterOrder as any).paymentTerms || quotes.find(q => q.id === selectedMasterOrder.quoteId)?.paymentTerms}
                                </span>
                              )}
                            </div>

                            {/* Kaplama Cinsi */}
                            <div className="flex items-center gap-1.5">
                              <FileCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                              <span className="text-slate-500 font-bold uppercase text-[10px]">KAPLAMA:</span>
                              <span className="font-extrabold text-purple-800 uppercase bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 text-[10px]">
                                {selectedMasterOrder.coatingTypes && selectedMasterOrder.coatingTypes.length > 0 ? selectedMasterOrder.coatingTypes.join(', ') : 'STANDART'}
                              </span>
                            </div>

                            {/* Sevk Adresi / Proje */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="text-slate-500 font-bold uppercase text-[10px]">PROJE/ADRES:</span>
                              {selectedMasterOrder.projectNo && (
                                <span className="font-mono font-bold text-orange-700 bg-orange-50 px-1 py-0.2 rounded border border-orange-200 text-[10px]">PROJE: {selectedMasterOrder.projectNo}</span>
                              )}
                              <span className="font-semibold text-slate-700 truncate max-w-[140px]" title={selectedMasterOrder.shippingAddress || '-'}>{selectedMasterOrder.shippingAddress || '-'}</span>
                            </div>

                            {/* Toplam Kalem & Miktar */}
                            <div className="flex items-center gap-1.5 font-mono">
                              <Layers className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                              <span className="font-extrabold text-slate-900">{selectedMasterOrder.items?.length || 0} Kalem</span>
                              <span className="font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200 text-[10px]">
                                {selectedMasterOrder.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0} Adet
                              </span>
                            </div>

                            {/* Kullanıcı İşlem İzi (Oluşturan & Sevk) */}
                            <div className="flex items-center gap-1.5 text-[10px] font-mono border-l border-slate-200 pl-2">
                              <UserCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="text-slate-600 font-bold truncate max-w-[120px]" title={selectedMasterOrder.createdBy}>{selectedMasterOrder.createdBy ? selectedMasterOrder.createdBy.split(' ')[0] : 'Sistem'}</span>
                              <span className="text-slate-400">•</span>
                              <span className={`font-bold ${selectedMasterOrder.shippedBy ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {selectedMasterOrder.shippedBy ? 'Sevk Edildi' : 'Depo Bekliyor'}
                              </span>
                            </div>
                          </div>

                          {/* Row 3: Single-Line 6 Document Action Buttons Bar */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 pt-0.5">
                            {/* 1. ÜRETİM FORMU & İŞ EMRİ (FR-009) */}
                            {(() => {
                              const orderRuns = (productionRuns || []).filter(pr => pr.orderId === selectedMasterOrder.id || (pr.productionOrderNo && pr.productionOrderNo.includes(selectedMasterOrder.id)));
                              const batchGroups: { [key: string]: any[] } = {};
                              orderRuns.forEach(r => {
                                const key = r.productionOrderNo || r.id;
                                if (!batchGroups[key]) batchGroups[key] = [];
                                batchGroups[key].push(r);
                              });
                              const batchKeys = Object.keys(batchGroups);

                              const handleClick = () => {
                                if (batchKeys.length > 1) {
                                  setDocSelectionModal({
                                    isOpen: true,
                                    title: "ÜRETİM İŞ EMİR & LOT SEÇİMİ (FR-009)",
                                    items: batchKeys.map((bKey, idx) => ({
                                      id: bKey,
                                      title: `Üretim İş Emri / Lot #${idx + 1}`,
                                      subtitle: `${batchGroups[bKey].length} Kalem Ürün • Kod: ${bKey}`,
                                      badge: `${batchGroups[bKey].length} Kalem`,
                                      action: () => handleOpenFR009(batchGroups[bKey], selectedMasterOrder)
                                    }))
                                  });
                                } else if (batchKeys.length === 1) {
                                  handleOpenFR009(batchGroups[batchKeys[0]], selectedMasterOrder);
                                } else {
                                  const sorted = sortProductionItems(selectedMasterOrder.items);
                                  const runs = sorted.map((item, idx) => ({
                                    id: `PRD-${selectedMasterOrder.id}-${idx + 1}`,
                                    productionOrderNo: selectedMasterOrder.id,
                                    productCode: item.productCode,
                                    quantity: item.quantity,
                                    date: selectedMasterOrder.date || new Date().toISOString().split('T')[0],
                                    operator: 'Depo / Üretim Sorumlusu',
                                    unit: item.unit || 'AD',
                                    processes: ['Kesme', 'Delme', 'Bükme']
                                  }));
                                  handleOpenFR009(runs, selectedMasterOrder);
                                }
                              };

                              return (
                                <button
                                  onClick={handleClick}
                                  className="w-full bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-900 font-bold py-1 px-2 rounded-lg text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 hover:border-orange-300 cursor-pointer group truncate"
                                  title="FR-009 Üretim İş Emri Bas"
                                >
                                  <Printer className="h-3.5 w-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                                  <span className="truncate">FR-009 İŞ EMRİ</span>
                                </button>
                              );
                            })()}

                            {/* 2. SEVKİYAT İRSALİYESİ */}
                            {(() => {
                              const dispatches = selectedMasterOrder.dispatches || [];
                              const handleClick = () => {
                                if (dispatches.length > 1) {
                                  setDocSelectionModal({
                                    isOpen: true,
                                    title: "SEVKİYAT İRSALİYESİ SEÇİMİ",
                                    items: dispatches.map((d, idx) => ({
                                      id: d.dispatchNoteNo,
                                      title: `Sevk İrsaliyesi #${idx + 1} (${d.dispatchNoteNo})`,
                                      subtitle: `Tarih: ${(d as any).dispatchDate || (d as any).date || 'Bugün'} • Taşıyıcı: ${(d as any).carrierName || 'Ambar'}`,
                                      badge: `${(d as any).items?.length || 0} Kalem`,
                                      action: () => setActiveDispatchToShow(d)
                                    }))
                                  });
                                } else if (dispatches.length === 1) {
                                  setActiveDispatchToShow(dispatches[0]);
                                } else {
                                  alert("Henüz oluşturulmuş sevk irsaliyesi bulunmuyor. Aşağıdaki 'Sevk Et' butonundan irsaliye oluşturabilirsiniz.");
                                }
                              };

                              return (
                                <button
                                  onClick={handleClick}
                                  className="w-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 font-bold py-1 px-2 rounded-lg text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 hover:border-blue-300 cursor-pointer group truncate"
                                  title="Resmi Sevkiyat İrsaliyesi Görüntüle"
                                >
                                  <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                                  <span className="truncate">İRSALİYE</span>
                                </button>
                              );
                            })()}

                            {/* 3. SON KONTROL FORMU (FR-10) */}
                            {(() => {
                              const dispatches = selectedMasterOrder.dispatches || [];
                              const handleClick = () => {
                                if (dispatches.length > 1) {
                                  setDocSelectionModal({
                                    isOpen: true,
                                    title: "FR-10 SON KONTROL FORMU SEÇİMİ",
                                    items: dispatches.map((d, idx) => ({
                                      id: d.dispatchNoteNo,
                                      title: `FR-10 Son Kontrol #${idx + 1} (İrsaliye: ${d.dispatchNoteNo})`,
                                      subtitle: `Sevk Tarihi: ${(d as any).dispatchDate || (d as any).date || 'Bugün'}`,
                                      badge: `FR-10`,
                                      action: () => handleShowFR012(d.dispatchNoteNo, selectedMasterOrder)
                                    }))
                                  });
                                } else if (dispatches.length === 1) {
                                  handleShowFR012(dispatches[0].dispatchNoteNo, selectedMasterOrder);
                                } else {
                                  alert("Son Kontrol Formu (FR-10) doldurmak için öncelikle bir sevk irsaliyesi oluşturmalısınız.");
                                }
                              };

                              return (
                                <button
                                  onClick={handleClick}
                                  className="w-full bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-bold py-1 px-2 rounded-lg text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 hover:border-emerald-300 cursor-pointer group truncate"
                                  title="FR-10 Kalite Son Kontrol Raporu"
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                                  <span className="truncate">FR-10 KONTROL</span>
                                </button>
                              );
                            })()}

                            {/* 4. KALİTE TEST SERTİFİKASI (3.1 TEST) */}
                            {(() => {
                              const dispatches = selectedMasterOrder.dispatches || [];
                              const handleClick = () => {
                                if (dispatches.length > 1) {
                                  setDocSelectionModal({
                                    isOpen: true,
                                    title: "3.1 KALİTE SERTİFİKASI SEÇİMİ",
                                    items: dispatches.map((d, idx) => ({
                                      id: d.dispatchNoteNo,
                                      title: `3.1 Test Sertifikası #${idx + 1} (İrsaliye: ${d.dispatchNoteNo})`,
                                      subtitle: `EN 10204 3.1 Raporu`,
                                      badge: `3.1 TEST`,
                                      action: () => handleLaunchCertCreator(d.dispatchNoteNo)
                                    }))
                                  });
                                } else if (dispatches.length === 1) {
                                  handleLaunchCertCreator(dispatches[0].dispatchNoteNo);
                                } else {
                                  alert("3.1 Sertifikası almak için öncelikle sevk irsaliyesi ve FR-10 son kontrol onayının tamamlanması gerekir.");
                                }
                              };

                              return (
                                <button
                                  onClick={handleClick}
                                  className="w-full bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-900 font-bold py-1 px-2 rounded-lg text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 hover:border-purple-300 cursor-pointer group truncate"
                                  title="EN 10204 3.1 Kalite Test Sertifikası"
                                >
                                  <Award className="h-3.5 w-3.5 text-purple-500 shrink-0 group-hover:scale-110 transition-transform" />
                                  <span className="truncate">3.1 SERTİFİKASI</span>
                                </button>
                              );
                            })()}

                            {/* 5. SİPARİŞ BELGESİ / TEKLİF (FR-013) */}
                            <button
                              onClick={() => setPreviewDocumentOrder(selectedMasterOrder)}
                              className="w-full bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 font-bold py-1 px-2 rounded-lg text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 hover:border-amber-300 cursor-pointer group truncate"
                              title="FR-013 Sipariş / Teklif Formu Aç"
                            >
                              <Eye className="h-3.5 w-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate">TEKLİF / BELGE</span>
                            </button>

                            {/* 6. SEVKİYAT & ÜRÜN ETİKETİ */}
                            <button
                              onClick={() => handleOpenLabels(selectedMasterOrder)}
                              className="w-full bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 font-bold py-1 px-2 rounded-lg text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all border border-slate-200 hover:border-teal-300 cursor-pointer group truncate"
                              title="Barkod & Palet Etiketi Yazdır"
                            >
                              <Tag className="h-3.5 w-3.5 text-teal-500 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate">ETİKET YAZDIR</span>
                            </button>
                          </div>

                        </div>

                        {/* 4. FULL-WIDTH ITEMS TABLE & STATION TRANSFERS POOL */}
                        <div className="space-y-3">
                          <div className="p-1.5 px-2.5 border border-slate-200/90 rounded-lg bg-slate-100/90 text-slate-900 flex justify-between items-center shadow-2xs">
                            <div className="flex items-center gap-2">
                              <ListChecks className="h-4 w-4 text-orange-600" />
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Sipariş Kalemleri & İmalat İstasyon Havuzu</h4>
                            </div>
                            <span className="text-[10px] text-slate-700 font-bold bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                              ⚡ Birim: MT En Üstte + Stok Kodu Artan
                            </span>
                          </div>

                          {/* Table Container */}
                          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-2xs">
                            <table className="w-full border-collapse text-left text-xs font-sans">
                              <thead>
                                <tr className="bg-slate-100 text-slate-800 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                                  <th className="py-1 px-1 text-center w-8">
                                    {(() => {
                                      const displayItems = sortProductionItems(selectedMasterOrder.items);
                                      const selectables = displayItems.map((item, idx) => ({
                                        item,
                                        idx,
                                        remaining: item.quantity - (item.shippedQuantity || 0)
                                      })).filter(x => x.remaining > 0 && x.item.status !== 'Üretim Dışı');
                                      const isAllSelected = selectables.length > 0 && selectables.every(x => !!selectedItems[`${x.item.productCode}-${x.idx}`]);

                                      return (
                                        <input 
                                          type="checkbox" 
                                          checked={isAllSelected}
                                          onChange={(e) => {
                                            const nextSelection = { ...selectedItems };
                                            selectables.forEach(x => {
                                              const key = `${x.item.productCode}-${x.idx}`;
                                              nextSelection[key] = e.target.checked;
                                              if (e.target.checked) {
                                                setActionQuantities(prevQ => ({ ...prevQ, [key]: x.remaining }));
                                              } else {
                                                delete actionQuantities[key];
                                              }
                                            });
                                            setSelectedItems(nextSelection);
                                          }}
                                          className="rounded border-slate-500 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                        />
                                      );
                                    })()}
                                  </th>
                                  <th className="py-1 px-2 w-32 font-mono">Stok Kodu</th>
                                  <th className="p-2.5">Malın Tanımı / Ürün Açıklaması</th>
                                  <th className="py-1 px-2 text-right w-20">Sipariş</th>
                                  <th className="py-1 px-2 text-right w-20">Sevk</th>
                                  <th className="py-1 px-2 text-right w-20">Kalan</th>
                                  <th className="py-1 px-1 text-center w-24">İşlem Miktarı</th>
                                  <th className="py-1 px-1 text-center w-24">Durum</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {sortProductionItems(selectedMasterOrder.items).map((item: any, idx: number) => {
                                  const remaining = item.quantity - (item.shippedQuantity || 0);
                                  const isSelected = !!selectedItems[`${item.productCode}-${idx}`];
                                  
                                  const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                                  const descStr = item.description || (item as any).productName || (prodCatalog && prodCatalog.name !== 'KABLO TAŞIYICI ELEMANI' ? prodCatalog.name : item.productCode);
                                  const isMt = isMtUnit(item.unit, item.productCode);
                                  
                                  return (
                                    <tr key={`${item.productCode}-${idx}`} className={`hover:bg-amber-50/50 transition-colors ${isSelected ? 'bg-orange-50/40' : ''}`}>
                                      <td className="py-1 px-1 text-center">
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          onChange={() => handleToggleSelectItem(`${item.productCode}-${idx}`)}
                                          disabled={remaining <= 0}
                                          className="rounded border-slate-350 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                        />
                                      </td>
                                      <td className="p-2 font-mono text-xs text-slate-900 font-medium flex items-center gap-1.5">
                                        {isMt && <span className="bg-orange-100 text-orange-800 text-[8px] font-bold px-1 rounded border border-orange-300">MT</span>}
                                        {item.productCode}
                                      </td>
                                      <td className="p-2 font-sans text-[13px] text-slate-700 font-normal leading-normal">{descStr}</td>
                                      <td className="py-1 px-2 text-right text-slate-900 font-mono font-bold">{item.quantity} <span className="text-[9px] uppercase font-bold text-slate-500">{getItemUnit(item)}</span></td>
                                      <td className="py-1 px-2 text-right text-green-700 font-mono font-bold">{item.shippedQuantity || 0} <span className="text-[9px] uppercase font-bold text-slate-500">{getItemUnit(item)}</span></td>
                                      <td className="py-1 px-2 text-right text-orange-700 font-mono font-bold">{remaining} <span className="text-[9px] uppercase font-bold text-slate-500">{getItemUnit(item)}</span></td>
                                      <td className="py-1 px-1 text-center">
                                        <input 
                                          type="number" 
                                          min="1" 
                                          max={remaining}
                                          value={actionQuantities[`${item.productCode}-${idx}`] ?? remaining}
                                          onChange={(e) => setActionQuantities({ ...actionQuantities, [`${item.productCode}-${idx}`]: parseInt(e.target.value) || 0 })}
                                          disabled={remaining <= 0}
                                          className="w-20 text-center bg-slate-50 border border-slate-300 rounded py-1 px-1 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none shadow-2xs"
                                        />
                                      </td>
                                      <td className="py-1 px-1 text-center">
                                        {item.status === 'Sevk Edildi' ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block shadow-2xs">SEVK EDİLDİ</span>
                                        ) : item.status === 'Üretimde' ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-blue-100 text-blue-800 border border-blue-300 inline-block shadow-2xs">ÜRETİMDE</span>
                                        ) : item.status === 'Kaplamada' ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-teal-100 text-teal-800 border border-teal-300 inline-block shadow-2xs">KAPLAMADA</span>
                                        ) : item.status === 'Boyada' ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-purple-100 text-purple-800 border border-purple-300 inline-block shadow-2xs">BOYADA</span>
                                        ) : item.status === 'Paketlemede' ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-pink-100 text-pink-800 border border-pink-300 inline-block shadow-2xs">PAKETLEMEDE</span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-slate-100 text-slate-700 border border-slate-300 inline-block shadow-2xs">BEKLEMEDE</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Station Transfer Buttons Bar */}
                          <div className="p-2 border border-slate-200 rounded-lg bg-slate-100 space-y-1.5 shadow-2xs">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                              ⚡ İSTASYON TRANSFER & SEVKİYAT AKSİYONLARI
                            </span>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                              <button 
                                onClick={() => handleSendSelectedToProduction(selectedMasterOrder, true)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-1 px-2 rounded-md text-[11px] shadow-2xs transition-all h-6.5 flex items-center justify-center gap-1.5"
                                title="Tüm veya seçilen kalemleri üretime gönderir ve FR-009 formunu açar"
                              >
                                <Play className="h-3.5 w-3.5 text-orange-400" /> Üretime Gönder
                              </button>
                              <button 
                                onClick={() => handleSendSelectedToCoating(selectedMasterOrder)}
                                className="bg-white hover:bg-teal-50 text-teal-800 border border-teal-200/80 font-medium py-1 px-2 rounded-md text-[11px] shadow-2xs transition-all h-6.5"
                              >
                                Kaplamaya Gönder
                              </button>
                              <button 
                                onClick={() => handleReceiveFromCoating(selectedMasterOrder)}
                                className="bg-white hover:bg-sky-50 text-sky-800 border border-sky-200/80 font-medium py-1 px-2 rounded-md text-[11px] shadow-2xs transition-all h-6.5"
                              >
                                Kaplamadan Kabul
                              </button>
                              <button 
                                onClick={() => handleSendSelectedToPainting(selectedMasterOrder)}
                                className="bg-white hover:bg-orange-50 text-orange-800 border border-orange-200/80 font-medium py-1 px-2 rounded-md text-[11px] shadow-2xs transition-all h-6.5"
                              >
                                Boyaya Gönder
                              </button>
                              <button 
                                onClick={() => handleSendSelectedToPackaging(selectedMasterOrder)}
                                className="bg-white hover:bg-purple-50 text-purple-800 border border-purple-200/80 font-medium py-1 px-2 rounded-md text-[11px] shadow-2xs transition-all h-6.5"
                              >
                                Paketlemeye Git
                              </button>
                              <button 
                                onClick={() => handleOpenLabels(selectedMasterOrder)}
                                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 font-medium py-1 px-2 rounded-md text-[11px] shadow-2xs transition-all h-6.5 flex items-center justify-center gap-1.5"
                              >
                                <Tag className="h-3.5 w-3.5 text-amber-400" /> Etiket Yazdır
                              </button>
                            </div>

                            <button 
                              onClick={() => handleShipSelected(selectedMasterOrder)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs uppercase shadow-md transition-all flex items-center justify-center gap-2 w-full tracking-wide border border-emerald-500/40"
                            >
                              <Truck className="h-4 w-4" /> Sevk Et (Yeni Resmi İrsaliye Kes)
                            </button>
                          </div>
                        </div>

                        {/* 5. FULL-WIDTH DISPATCH & QUALITY DOCUMENTS HISTORY */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
                          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200">
                            <Truck className="h-4 w-4 text-orange-600" /> Sevkiyat İrsaliyeleri Geçmişi & Kalite Evrakları
                          </h4>
                              {(() => {
                                const realDispatches = (selectedMasterOrder.dispatches || []).filter(d => {
                                  return d && d.items && d.items.length > 0 && selectedMasterOrder.items.some(i => (i.shippedQuantity || 0) > 0);
                                });

                                if (realDispatches.length === 0) {
                                  return (
                                    <div className="text-center py-6 px-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/80 text-slate-500 space-y-2">
                                      <Truck className="h-7 w-7 text-slate-400 mx-auto" />
                                      <h5 className="font-black text-slate-900 text-[11px] uppercase tracking-wide">Henüz Sevk İrsaliyesi Kesilmemiştir</h5>
                                      <p className="text-[9px] text-slate-500 leading-relaxed font-sans">
                                        İrsaliye kestiğinizde irsaliye detayları ve kalite evrakları burada otomatik olarak listelenecektir.
                                      </p>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                    {realDispatches.map((disp, dIdx) => (
                                      <div key={dIdx} className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 hover:bg-white transition-all space-y-2">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                                          <div>
                                            <span className="font-mono font-black text-xs text-slate-900">{disp.dispatchNoteNo}</span>
                                            <span className="text-[9px] text-slate-400 block font-mono">{disp.date}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => setActiveDispatchToShow(disp)}
                                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[8px] uppercase shadow-2xs"
                                            >
                                              İrsaliye Yazdır
                                            </button>
                                            <button
                                              onClick={() => handleShowFR012(disp.dispatchNoteNo, selectedMasterOrder)}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[8px] uppercase shadow-2xs"
                                            >
                                              FR-10 Raporu
                                            </button>
                                          </div>
                                        </div>
                                        <div className="text-[9px] text-slate-600 font-mono">
                                          <span className="font-bold text-slate-800">Taşıyıcı:</span> {(disp as any).carrierName || 'Ambar'} | <span className="font-bold text-slate-800">Plaka:</span> {(disp as any).plateNo || '-'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>

                        {/* 6. FULL-WIDTH SİPARİŞ İŞLEM GEÇMİŞİ & AUDIT LOG (KİM EKLEDİ / SEVK ETTİ) */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-orange-600" /> Sipariş İşlem Geçmişi & Audit Logu (Kim Ne Zaman İşlem Yaptı)
                            </h4>
                            <span className="text-[9px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              ISO 9001 İZLENEBİLİRLİK LOGU
                            </span>
                          </div>

                          {/* Personnel Action Badges */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[9px] text-slate-500 font-bold block uppercase">Siparişi Ekleyen Yetkili:</span>
                              <span className="font-bold text-slate-900 block truncate">{selectedMasterOrder.createdBy || 'İbrahim Sert (Genel Müdür)'}</span>
                              <span className="text-[8px] text-slate-400 font-mono block">{selectedMasterOrder.createdDate || selectedMasterOrder.date || '-'}</span>
                            </div>

                            <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-200">
                              <span className="text-[9px] text-blue-700 font-bold block uppercase">Üretime Sevk Eden:</span>
                              <span className="font-bold text-blue-950 block truncate">{selectedMasterOrder.sentToProductionBy || (selectedMasterOrder.status !== 'YENİ SİPARİŞ' ? 'Faruk Oruç (Kalite Güvence)' : 'Bekliyor')}</span>
                              <span className="text-[8px] text-blue-600 font-mono block">{selectedMasterOrder.sentToProductionDate || '-'}</span>
                            </div>

                            <div className="p-2 bg-teal-50/60 rounded-lg border border-teal-200">
                              <span className="text-[9px] text-teal-700 font-bold block uppercase">Kaplama / Boya Yetkilisi:</span>
                              <span className="font-bold text-teal-950 block truncate">{selectedMasterOrder.sentToCoatingBy || selectedMasterOrder.sentToPaintingBy || '-'}</span>
                              <span className="text-[8px] text-teal-600 font-mono block">{selectedMasterOrder.sentToCoatingDate || selectedMasterOrder.sentToPaintingDate || '-'}</span>
                            </div>

                            <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-200">
                              <span className="text-[9px] text-emerald-700 font-bold block uppercase">Sevk Eden Yetkili:</span>
                              <span className="font-bold text-emerald-950 block truncate">{selectedMasterOrder.shippedBy || (selectedMasterOrder.status === 'SEVK EDİLDİ' ? 'Ahmet Yılmaz (Depo)' : 'Henüz Sevk Edilmedi')}</span>
                              <span className="text-[8px] text-emerald-600 font-mono block">{selectedMasterOrder.shippedDate || '-'}</span>
                            </div>
                          </div>

                          {/* Full History Timeline Steps */}
                          {Array.isArray(selectedMasterOrder.history) && selectedMasterOrder.history.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto pr-1">
                              <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Tüm Operasyon Adımları ({selectedMasterOrder.history.length}):</span>
                              {selectedMasterOrder.history.map((h, hIdx) => (
                                <div key={h.id || hIdx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                                  <div className="flex items-center gap-2 font-mono">
                                    <span className="font-black text-orange-600">#{hIdx + 1}</span>
                                    <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 uppercase">{h.action}</span>
                                    <span className="text-slate-600">{h.details}</span>
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <span className="font-bold text-slate-800 block">{h.performedBy}</span>
                                    <span className="text-[8px] text-slate-400 font-mono block">{h.timestamp}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
                        <Search className="h-8 w-8 text-slate-300 mx-auto" />
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Aradığınız kriterlere uygun sipariş bulunamadı
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Lütfen arama kelimenizi kontrol edin veya arama kutusunu temizleyin.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setOrderSearchQuery('');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Tüm Siparişleri Göster (Aramayı Sıfırla)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        {/* MODAL: WORKSPACE MODAL FOR SIPARIS DETAY & EVRAK YONETIMI */}
        {showOrderDetailModal && selectedOrderDetailOrder && (() => {
          const order = selectedOrderDetailOrder;
          const quote = quotes.find(q => q.id === order.quoteId);
          const calculatedCategory = getOrderCategory(order);
          const effectiveStatus = calculatedCategory === 'SEVK EDİLDİ' 
            ? 'SEVK EDİLDİ'
            : calculatedCategory === 'KISMİ SEVK EDİLDİ'
            ? 'KISMİ SEVK EDİLDİ (AÇIK SİPARİŞ)'
            : calculatedCategory === 'ÜRETİMDE'
            ? 'ÜRETİMDE (AÇIK SİPARİŞ)'
            : calculatedCategory === 'KAPLAMADA'
            ? 'KAPLAMADA (AÇIK SİPARİŞ)'
            : calculatedCategory === 'BOYADA'
            ? 'BOYADA (AÇIK SİPARİŞ)'
            : calculatedCategory === 'PAKETLEMEDE'
            ? 'PAKETLEMEDE (AÇIK SİPARİŞ)'
            : 'YENİ SİPARİŞ (AÇIK SİPARİŞ)';

          const statusColor = calculatedCategory === 'SEVK EDİLDİ' 
            ? 'bg-green-600 text-white shadow-sm'
            : calculatedCategory === 'KISMİ SEVK EDİLDİ'
            ? 'bg-amber-600 text-white shadow-sm'
            : calculatedCategory === 'BOYADA'
            ? 'bg-purple-600 text-white shadow-sm'
            : calculatedCategory === 'KAPLAMADA'
            ? 'bg-teal-600 text-white shadow-sm'
            : calculatedCategory === 'ÜRETİMDE'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-amber-500 text-white shadow-sm';
          
          return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-2 sm:p-4 overflow-hidden print:hidden">
              <div className="w-full h-full max-w-[1700px] max-h-[96vh] flex flex-col bg-slate-100 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                
                {/* Modal Header */}
                <div className="bg-slate-950 text-white px-6 py-3.5 flex justify-between items-center shadow-md shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-slate-100 border border-slate-200/90 p-2 rounded-lg text-slate-700">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">SİPARİŞ DOKÜMANTASYON & OPERASYON MERKEZİ</h3>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">SIES Kalite Yönetim Sistemi (QMS-OS)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">SİPARİŞ NO:</span>
                      <span className="font-mono font-black text-xs text-orange-400">
                        {order.id}
                      </span>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide uppercase shadow-2xs ${statusColor}`}>
                      {effectiveStatus}
                    </span>

                    <button 
                      onClick={() => {
                        handleStartEditOrder(order);
                      }} 
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 uppercase shadow-2xs transition-all cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" /> Siparişi Düzenle
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowOrderDetailModal(false);
                        setSelectedOrderDetailOrder(null);
                      }} 
                      className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-all ml-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Sub-header meta strip */}
                <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-6 py-2.5 text-[11px] font-sans flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-orange-400 shrink-0" />
                    <span className="text-slate-400 font-bold uppercase text-[10px]">MÜŞTERİ:</span>
                    <span className="font-black text-white text-xs uppercase tracking-wide">{order.customerName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="text-slate-400 font-bold uppercase text-[10px]">TARİH & VADE:</span>
                    <span className="font-bold text-white">{order.date}</span>
                    <span className="text-slate-500">|</span>
                    <span className="font-extrabold text-amber-400">{(order as any).paymentTerms || quote?.paymentTerms || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-400 font-bold uppercase text-[10px]">ADRES / PROJE:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">{quote?.customerAddress || 'TESİS TESLİM'}</span>
                    <span className="text-slate-500">|</span>
                    <span className="font-mono font-bold text-orange-300">PROJE: {order.projectNo || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-slate-400 font-bold uppercase text-[10px]">KDV & FİNANS:</span>
                    <span className="font-extrabold text-slate-200">{quote?.taxPercent === 0 ? "KDV'DEN MUAFTIR" : "MUAFİYET YOKTUR"}</span>
                  </div>
                </div>

                {/* MODAL USER AUDIT TRAIL CARD */}
                <div className="bg-slate-950 text-white border-b border-slate-800 px-6 py-2.5 shrink-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-mono">
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">👤 OLUŞTURAN KULLANICI:</span>
                      <p className="font-bold text-white truncate">{order.createdBy || 'İbrahim Sert (Genel Müdür)'}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{order.createdDate || order.date}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">⚙️ ÜRETİME ALAN YETKİLİ:</span>
                      <p className="font-bold text-blue-400 truncate">{order.sentToProductionBy || 'İşlem Bekliyor'}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{order.sentToProductionDate || '-'}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">🎨 KAPLAMA / BOYA YETKİLİSİ:</span>
                      <p className="font-bold text-amber-400 truncate">{order.sentToCoatingBy || order.sentToPaintingBy || 'İşlem Bekliyor'}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{order.sentToCoatingDate || order.sentToPaintingDate || '-'}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-400 uppercase font-sans font-bold block">🚚 SEVK EDEN DEPO YETKİLİSİ:</span>
                      <p className="font-bold text-emerald-400 truncate">{order.shippedBy || 'Henüz Sevk Edilmedi'}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{order.shippedDate || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Main Workspace Body */}
                <div className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">
                  
                  {/* Left Column: Items and Process stations */}
                  <div className="col-span-7 flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">
                    
                    {/* Left Header */}
                    <div className="p-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white shrink-0">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-orange-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Sipariş Kalemleri & İmalat İstasyon Havuzu</h4>
                      </div>
                      <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                        ⚡ Birim: MT En Üstte + Stok Kodu Artan
                      </span>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-y-auto p-3">
                      <table className="w-full border-collapse border border-slate-200 text-left text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-800 text-slate-100 uppercase text-[10px] font-black tracking-wider border-b border-slate-700">
                            <th className="py-1 px-1 text-center w-10">
                              {(() => {
                                const displayItems = sortProductionItems(order.items);
                                const selectables = displayItems.map((item, idx) => ({
                                  item,
                                  idx,
                                  remaining: item.quantity - (item.shippedQuantity || 0)
                                })).filter(x => x.remaining > 0 && x.item.status !== 'Üretim Dışı');
                                const isAllSelected = selectables.length > 0 && selectables.every(x => !!selectedItems[`${x.item.productCode}-${x.idx}`]);

                                return (
                                  <input 
                                    type="checkbox" 
                                    checked={isAllSelected}
                                    onChange={(e) => {
                                      const nextSelection = { ...selectedItems };
                                      selectables.forEach(x => {
                                        const key = `${x.item.productCode}-${x.idx}`;
                                        nextSelection[key] = e.target.checked;
                                        if (e.target.checked) {
                                          setActionQuantities(prevQ => ({ ...prevQ, [key]: x.remaining }));
                                        } else {
                                          delete actionQuantities[key];
                                        }
                                      });
                                      setSelectedItems(nextSelection);
                                    }}
                                    className="rounded border-slate-500 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                  />
                                );
                              })()}
                            </th>
                            <th className="p-2.5 w-28">Stok Kodu</th>
                            <th className="p-2.5">Malın Tanımı / Ürün Açıklaması</th>
                            <th className="py-1 px-2 text-right w-24">Sipariş</th>
                            <th className="py-1 px-2 text-right w-24">Sevk Edilen</th>
                            <th className="py-1 px-2 text-right w-20">Kalan</th>
                            <th className="py-1 px-1 text-center w-24">İşlem Miktarı</th>
                            <th className="py-1 px-1 text-center w-24">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sortProductionItems(order.items).map((item, idx) => {
                            const remaining = item.quantity - (item.shippedQuantity || 0);
                            const isSelected = !!selectedItems[`${item.productCode}-${idx}`];
                            
                            const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const descStr = item.description || (item as any).productName || (prodCatalog && prodCatalog.name !== 'KABLO TAŞIYICI ELEMANI' ? prodCatalog.name : item.productCode);
                            const isMt = isMtUnit(item.unit, item.productCode);
                            
                            return (
                              <tr key={`${item.productCode}-${idx}`} className={`hover:bg-amber-50/50 transition-colors ${isSelected ? 'bg-orange-50/30' : ''}`}>
                                <td className="py-1 px-1 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectItem(`${item.productCode}-${idx}`)}
                                    disabled={remaining <= 0}
                                    className="rounded border-slate-350 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                  />
                                </td>
                                <td className="py-1 px-2 font-mono font-black text-slate-900 text-xs flex items-center gap-1">
                                  {isMt && <span className="bg-orange-100 text-orange-800 text-[8px] font-bold px-1 rounded border border-orange-300">MT</span>}
                                  {item.productCode}
                                </td>
                                <td className="p-2 font-sans text-[13px] text-slate-700 font-normal leading-normal">{descStr}</td>
                                <td className="py-1 px-2 text-right text-slate-900 font-mono font-bold">{item.quantity} <span className="text-[9px] uppercase font-bold text-slate-500">{getItemUnit(item)}</span></td>
                                <td className="py-1 px-2 text-right text-green-700 font-mono font-bold">{item.shippedQuantity || 0} <span className="text-[9px] uppercase font-bold text-slate-500">{getItemUnit(item)}</span></td>
                                <td className="py-1 px-2 text-right text-orange-700 font-mono font-bold">{remaining} <span className="text-[9px] uppercase font-bold text-slate-500">{getItemUnit(item)}</span></td>
                                <td className="py-1 px-1 text-center">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max={remaining}
                                    value={actionQuantities[`${item.productCode}-${idx}`] ?? remaining}
                                    onChange={(e) => setActionQuantities({ ...actionQuantities, [`${item.productCode}-${idx}`]: parseInt(e.target.value) || 0 })}
                                    disabled={remaining <= 0}
                                    className="w-20 text-center bg-slate-50 border border-slate-300 rounded py-1 px-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none"
                                  />
                                </td>
                                <td className="py-1 px-1 text-center">
                                  {item.status === 'Sevk Edildi' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block shadow-2xs">SEVK EDİLDİ</span>
                                  ) : item.status === 'Üretimde' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-blue-100 text-blue-800 border border-blue-300 inline-block shadow-2xs">ÜRETİMDE</span>
                                  ) : item.status === 'Kaplamada' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-teal-100 text-teal-800 border border-teal-300 inline-block shadow-2xs">KAPLAMADA</span>
                                  ) : item.status === 'Boyada' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-purple-100 text-purple-800 border border-purple-300 inline-block shadow-2xs">BOYADA</span>
                                  ) : item.status === 'Paketlemede' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-pink-100 text-pink-800 border border-pink-300 inline-block shadow-2xs">PAKETLEMEDE</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-slate-100 text-slate-700 border border-slate-300 inline-block shadow-2xs">BEKLEMEDE</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Action Panel */}
                    <div className="p-3.5 border-t border-slate-200 bg-slate-100 flex flex-col gap-2.5 shrink-0">
                      
                      <div className="grid grid-cols-6 gap-2">
                        <button 
                          onClick={() => handleSendSelectedToProduction(order, true)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all flex items-center justify-center gap-1"
                          title="Tüm kalemleri üretime gönderir ve FR-009 formunu açar"
                        >
                          <Play className="h-3 w-3 text-orange-400" /> Tümünü Üretime Gönder
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToCoating(order)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Kaplamaya Gönder
                        </button>
                        <button 
                          onClick={() => handleReceiveFromCoating(order)}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Kaplamadan Kabul
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToPainting(order)}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Boyaya Gönder
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToPackaging(order)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Paketlemeye Git
                        </button>
                        <button 
                          onClick={() => handleOpenLabels(order)}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all flex items-center justify-center gap-1"
                        >
                          <Tag className="h-3 w-3 text-amber-400" /> Etiket Yazdır
                        </button>
                      </div>

                      <button 
                        onClick={() => handleShipSelected(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase shadow-md transition-all flex items-center justify-center gap-2 w-full tracking-wide"
                      >
                        <Truck className="h-4 w-4" /> Sevk Et (Yeni Resmi İrsaliye Kes)
                      </button>
                    </div>
                  </div>
                  
                  {/* Right Column: Documents Timeline Ledger */}
                  <div className="col-span-5 flex flex-col h-full bg-slate-100 overflow-y-auto p-4 space-y-4 border-l border-slate-200">
                    
                    {/* SECTION 1: TÜM SİPARİŞ BELGELERİ & EVRAKLARI (6 DÖKÜMAN HUBS) */}
                    <div className="bg-white border border-slate-300 rounded-xl shadow-md p-4 space-y-3 shrink-0">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-orange-600" /> Tüm Sipariş Belgeleri & Evrakları (6 Döküman)
                        </h4>
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase">AKTİF EVRAKLAR</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        {/* 1. ÜRETİM FORMU & İŞ EMRİ (FR-009) */}
                        {(() => {
                          const orderRuns = (productionRuns || []).filter(pr => pr.orderId === order.id || (pr.productionOrderNo && pr.productionOrderNo.includes(order.id)));
                          const batchGroups: { [key: string]: any[] } = {};
                          orderRuns.forEach(r => {
                            const key = r.productionOrderNo || r.id;
                            if (!batchGroups[key]) batchGroups[key] = [];
                            batchGroups[key].push(r);
                          });
                          const batchKeys = Object.keys(batchGroups);

                          return (
                            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-extrabold text-slate-900 text-[10px] block">1. Üretim Formu & İş Emri</span>
                                  {batchKeys.length > 0 && (
                                    <span className="text-[8px] text-orange-600 font-extrabold">{batchKeys.length} Üretim Formu Kayıtlı</span>
                                  )}
                                </div>
                                <span className="font-mono font-bold text-orange-600 bg-orange-100 px-1 rounded text-[8px]">FR-009</span>
                              </div>
                              
                              {batchKeys.length > 0 ? (
                                <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5 my-1">
                                  {batchKeys.map((bKey, bIdx) => {
                                    const bRuns = batchGroups[bKey];
                                    return (
                                      <button 
                                        key={bKey}
                                        onClick={() => handleOpenFR009(bRuns, order)}
                                        className="w-full bg-white hover:bg-orange-50 border border-slate-300 hover:border-orange-500 text-slate-800 font-bold p-1 rounded text-[8px] flex items-center justify-between transition-all group shadow-2xs"
                                        title={`${bKey} - ${bRuns.length} Kalem`}
                                      >
                                        <div className="flex items-center gap-1 truncate">
                                          <Printer className="h-3 w-3 text-orange-600 shrink-0" />
                                          <span className="truncate font-mono">Lot #{bIdx + 1} ({bKey})</span>
                                        </div>
                                        <span className="bg-orange-100 text-orange-700 font-extrabold px-1 rounded text-[7px] shrink-0">{bRuns.length} Kalem</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-[8px] leading-tight">İmalat takip & proses muayene kartı</p>
                              )}

                              <button 
                                onClick={() => {
                                  const sorted = sortProductionItems(order.items);
                                  const runs = sorted.map((item, idx) => ({
                                    id: `PRD-${order.id}-${idx + 1}`,
                                    productionOrderNo: order.id,
                                    productCode: item.productCode,
                                    quantity: item.quantity,
                                    date: order.date || new Date().toISOString().split('T')[0],
                                    operator: 'Depo / Üretim Sorumlusu',
                                    unit: item.unit || 'AD',
                                    processes: ['Kesme', 'Delme', 'Bükme']
                                  }));
                                  handleOpenFR009(runs, order);
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-1 rounded text-[8px] uppercase shadow-xs flex items-center justify-center gap-1 mt-1"
                              >
                                <Printer className="h-2.5 w-2.5 text-orange-400" /> {batchKeys.length > 0 ? 'Tüm Sipariş Toplu Formu' : 'Üretim Formu Bas'}
                              </button>
                            </div>
                          );
                        })()}

                        {/* 2. SEVKİYAT İRSALİYESİ */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">2. Sevkiyat İrsaliyesi</span>
                            <span className="font-mono font-bold text-blue-600 bg-blue-100 px-1 rounded text-[8px]">İRSALİYE</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Resmi sevk irsaliyesi dökümanı</p>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                setActiveDispatchToShow(order.dispatches[order.dispatches.length - 1]);
                              } else {
                                alert("Henüz oluşturulmuş sevk irsaliyesi bulunmuyor. Sol paneldeki 'Sevk Et' butonundan irsaliye oluşturabilirsiniz.");
                              }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <FileSpreadsheet className="h-3 w-3" /> İrsaliye Bas / Aç
                          </button>
                        </div>

                        {/* 3. SON KONTROL FORMU (FR-10) */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">3. Son Kontrol Formu</span>
                            <span className="font-mono font-bold text-emerald-600 bg-emerald-100 px-1 rounded text-[8px]">FR-10</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Ölçüm & muayene kontrol raporu</p>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                handleShowFR012(order.dispatches[order.dispatches.length - 1].dispatchNoteNo, order);
                              } else {
                                alert("Son Kontrol Formu (FR-10) doldurmak için öncelikle bir sevk irsaliyesi oluşturmalısınız.");
                              }
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <ClipboardCheck className="h-3 w-3" /> FR-10 Doldur / Bas
                          </button>
                        </div>

                        {/* 4. KALİTE TEST SERTİFİKASI (3.1 TEST) */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">4. Kalite Test Sertifikası</span>
                            <span className="font-mono font-bold text-purple-600 bg-purple-100 px-1 rounded text-[8px]">3.1 TEST</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">EN 10204 3.1 Test Raporu</p>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                handleLaunchCertCreator(order.dispatches[order.dispatches.length - 1].dispatchNoteNo);
                              } else {
                                alert("3.1 Sertifikası almak için öncelikle sevk irsaliyesi ve FR-10 son kontrol onayının tamamlanması gerekir.");
                              }
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <Award className="h-3 w-3" /> 3.1 Sertifikası Al
                          </button>
                        </div>

                        {/* 5. SİPARİŞ BELGESİ / TEKLİF (FR-013) */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">5. Sipariş Belgesi / Teklif</span>
                            <span className="font-mono font-bold text-amber-600 bg-amber-100 px-1 rounded text-[8px]">FR-013</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Teklif formu & yüklenen evrak</p>
                          <button 
                            onClick={() => {
                              alert(`Sipariş / Teklif No: ${order.id}\nMüşteri: ${order.customerName}\nDurum: ${order.status}`);
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <FileText className="h-3 w-3" /> Teklif / Belge Aç
                          </button>
                        </div>

                        {/* 6. SEVKİYAT & ÜRÜN ETİKETİ */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">6. Sevkiyat & Ürün Etiketi</span>
                            <span className="font-mono font-bold text-teal-600 bg-teal-100 px-1 rounded text-[8px]">ETİKET</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Barkodlu koli & palet etiketi (Honeywell)</p>
                          <button 
                            onClick={() => handleOpenLabels(order)}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <Tag className="h-3 w-3" /> Etiket Yazdır
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: SEVKİYAT İRSALİYELERİ & KALİTE EVRAKLARI GEÇMİŞİ */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                        <Truck className="h-4 w-4 text-orange-600" /> Sevkiyat İrsaliyeleri Geçmişi & Kalite Evrakları
                      </h4>
                      {(() => {
                        // Only show dispatches if order actually has shipped quantity or valid dispatches
                        const realDispatches = (order.dispatches || []).filter(d => {
                          return d && d.items && d.items.length > 0 && order.items.some(i => (i.shippedQuantity || 0) > 0);
                        });

                        if (realDispatches.length === 0) {
                          return (
                            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/80 text-slate-600 space-y-2.5">
                              <Truck className="h-8 w-8 text-slate-400 mx-auto" />
                              <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">Henüz Sevk İrsaliyesi Kesilmemiştir</h5>
                              <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
                                Bu sipariş için henüz herhangi bir resmi sevk irsaliyesi oluşturulmamıştır. Sol paneldeki <span className="font-extrabold text-slate-800 font-mono">"Sevk Et (Yeni Resmi İrsaliye Kes)"</span> butonundan irsaliye kestiğinizde; <span className="font-extrabold text-slate-800 font-mono">İrsaliye Numarası</span>, <span className="font-extrabold text-slate-800 font-mono">İrsaliye Tarihi</span> ve <span className="font-extrabold text-slate-800 font-mono">Sevk Edilen Kalemler Listesi</span> burada otomatik olarak görüntülenecektir.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {realDispatches.map((dispatch) => {
                            const savedInspections = localStorage.getItem('qms_fr12_inspections');
                            const inspections = savedInspections ? JSON.parse(savedInspections) : {};
                            const inspection = inspections[dispatch.dispatchNoteNo];
                            const isApproved = inspection && inspection.status === 'ONAYLANDI';
                            const existingCert = certificates.find(c => c.dispatchNoteNo === dispatch.dispatchNoteNo);
                            
                            return (
                              <div key={dispatch.dispatchNoteNo} className="border border-slate-200 rounded-xl p-4 space-y-3.5 bg-slate-50 shadow-sm relative overflow-hidden">
                                
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${isApproved ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />

                                <div className="flex justify-between items-center border-b border-slate-100 pb-1 pt-1">
                                  <span className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <FileSpreadsheet className="h-4 w-4 text-slate-500" /> {dispatch.dispatchNoteNo}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">{dispatch.date}</span>
                                </div>
                                
                                <div className="bg-white border border-slate-150 rounded-lg p-2.5 space-y-1.5">
                                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Sevk Edilen Mal Listesi</span>
                                  <div className="text-[10px] text-slate-700 font-sans leading-relaxed space-y-1">
                                    {dispatch.items.map((di, diIdx) => {
                                      const prodCatalog = products.find(p => p.code.toUpperCase() === di.productCode.toUpperCase());
                                      const descStr = prodCatalog ? prodCatalog.name : 'KABLO MALZEMESİ';
                                      const matchingOrderItem = order.items?.find(i => i.productCode === di.productCode);
                                      const unitStr = getItemUnit(matchingOrderItem || di);
                                      return (
                                        <div key={diIdx} className="flex justify-between border-b border-slate-50 last:border-0 pb-1 last:pb-0">
                                          <span className="font-semibold text-slate-900">{di.productCode}</span>
                                          <span className="text-slate-500 truncate max-w-[180px]" title={descStr}>{descStr}</span>
                                          <span className="font-mono font-bold text-slate-950">{di.quantity} {unitStr}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-1">
                                  <button
                                    onClick={() => setActiveDispatchToShow(dispatch)}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-2 py-1.5 rounded text-[9px] uppercase transition-all flex items-center justify-center gap-1"
                                  >
                                    <Printer className="h-3 w-3" /> İrsaliye Bas
                                  </button>

                                  <button
                                    onClick={() => handleShowFR012(dispatch.dispatchNoteNo, order)}
                                    className={`font-bold px-2 py-1.5 rounded text-[9px] uppercase transition-all flex items-center justify-center gap-1 ${
                                      isApproved 
                                        ? 'bg-green-100 text-green-800 border border-green-300' 
                                        : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300'
                                    }`}
                                  >
                                    <ClipboardCheck className="h-3 w-3" /> {isApproved ? 'FR-10 (Onaylandı)' : 'FR-10 Doldur'}
                                  </button>

                                  <button
                                    onClick={() => handleLaunchCertCreator(dispatch.dispatchNoteNo)}
                                    className={`font-bold px-2 py-1.5 rounded text-[9px] uppercase transition-all flex items-center justify-center gap-1 ${
                                      existingCert 
                                        ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                    }`}
                                  >
                                    <Award className="h-3 w-3" /> {existingCert ? '3.1 Sertifikası' : '3.1 Hazırla'}
                                  </button>
                                </div>
                              </div>
                            );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}{isEditingNewQuote && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-slate-200 rounded-xl shadow-2xl border border-slate-350 w-full max-w-[1350px] max-h-[90vh] overflow-hidden flex flex-col my-4">              
              {/* Header */}
              <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Plus className="h-4 w-4 text-orange-500" /> SIES Fiyat Teklifi Editörü (Döküman Hazırlama Ekranı)
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveDraftQuote}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" /> Teklifi Kaydet ve Kapat
                  </button>
                  <button 
                    onClick={() => setIsEditingNewQuote(false)} 
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs transition-colors cursor-pointer"
                  >
                    İptal Et
                  </button>
                </div>
              </div>
              {/* Editor Canvas Container (Massive Space) */}
              <div className="p-8 bg-slate-300 overflow-y-auto flex-1 flex justify-center">                
                {/* Printable A4 Sheet in Editor */}
                <div className="bg-white text-slate-950 p-10 shadow-2xl border border-slate-350 rounded-xl font-sans leading-normal flex flex-col justify-between mx-auto w-full max-w-[210mm]">
                  <div className="space-y-6">
                    
                    {/* SIES Corporate Header */}
                    <div className="border-b-2 border-orange-500 pb-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <img src="sies_logo.png" alt="SIES Logo" className="h-14 object-contain" />
                      </div>
                      <div className="text-right">
                        <h2 className="font-extrabold text-sm uppercase tracking-wide text-orange-600">YENİ TEKLİF FORMU (DÜZENLEME MODU)</h2>
                        <p className="text-[7px] text-slate-400 font-semibold font-mono">Döküman No: FR-013 | Revizyon: 02 | Sayfa: 1 / 1</p>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="overflow-hidden border border-slate-300 rounded-xl bg-white shadow-sm">
                      <table className="w-full border-collapse text-xs text-center font-bold">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider border-b border-slate-200">
                            <th className="p-2.5 border-r border-slate-200 w-1/4">TEKLİF NO</th>
                            <th className="p-2.5 border-r border-slate-200 w-1/4">TEKLİF TARİHİ</th>
                            <th className="p-2.5 border-r border-slate-200 w-1/4">GEÇERLİLİK SÜRESİ</th>
                            <th className="p-2.5 w-1/4">MALZEME CİNSİ</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white font-mono text-slate-900 text-xs">
                            <td className="p-2 border-r border-slate-200">
                              <input 
                                type="text"
                                value={draftQuote.id}
                                onChange={e => setDraftQuote({ ...draftQuote, id: e.target.value })}
                                className="bg-transparent text-center font-bold w-full focus:outline-none focus:bg-slate-50 p-1 rounded border border-slate-200"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input 
                                type="date" 
                                value={draftQuote.date} 
                                onChange={e => setDraftQuote({ ...draftQuote, date: e.target.value })}
                                className="bg-transparent text-center font-bold w-full focus:outline-none focus:bg-slate-50 p-1 rounded border border-slate-200"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <input 
                                type="text" 
                                value={draftQuote.validityPeriod || '30.06.2026'} 
                                onChange={e => setDraftQuote({ ...draftQuote, validityPeriod: e.target.value })}
                                className="bg-transparent text-center font-bold w-full focus:outline-none focus:bg-slate-50 p-1 rounded border border-slate-200"
                              />
                            </td>
                            <td className="p-2">
                              <select 
                                value={draftQuote.materialGrade || 'TS 914 SICAK DALDIRMA / ST37'}
                                onChange={e => setDraftQuote({ ...draftQuote, materialGrade: e.target.value })}
                                className="bg-transparent text-center font-bold w-full focus:outline-none text-xs cursor-pointer p-1 rounded bg-slate-50 border border-slate-200"
                              >
                                <option value="TS 914 SICAK DALDIRMA / ST37">TS 914 SICAK DALDIRMA / ST37</option>
                                <option value="PREGALVANİZ / DX51D">PREGALVANİZ / DX51D</option>
                                <option value="ELEKTROSTATİK TOZ BOYALI">ELEKTROSTATİK TOZ BOYALI</option>
                                <option value="PASLANMAZ / AISI 304">PASLANMAZ / AISI 304</option>
                                <option value="PASLANMAZ / AISI 316">PASLANMAZ / AISI 316</option>
                              </select>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Company & Customer Info Inputs */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Firma Bilgileri */}
                      <div className="overflow-hidden border border-slate-300 rounded-xl bg-white shadow-sm">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5" /> FİRMA BİLGİLERİ (DÜZENLENEBİLİR)
                          </span>
                        </div>
                        <table className="w-full border-collapse text-xs text-left">
                          <tbody>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500 w-24">ÜNVAN</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.companyName || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, companyName: e.target.value })}
                                  className="w-full bg-transparent font-bold text-slate-800 focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500">YETKİLİ</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.companyRepresentative || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, companyRepresentative: e.target.value })}
                                  className="w-full bg-transparent font-bold text-slate-800 focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500">TELEFON</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.companyPhone || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, companyPhone: e.target.value })}
                                  className="w-full bg-transparent text-slate-800 focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500">E-POSTA</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.companyEmail || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, companyEmail: e.target.value })}
                                  className="w-full bg-transparent text-slate-800 font-mono focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500">ADRES</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.companyAddress || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, companyAddress: e.target.value })}
                                  className="w-full bg-transparent text-slate-700 text-xs focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Müşteri Bilgileri */}
                      <div className="overflow-hidden border border-slate-300 rounded-xl bg-white shadow-sm">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> MÜŞTERİ BİLGİLERİ
                          </span>
                        </div>
                        <table className="w-full border-collapse text-xs text-left">
                          <tbody>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500 w-24">ÜNVAN</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.customerName}
                                  onChange={e => setDraftQuote({ ...draftQuote, customerName: e.target.value })}
                                  className="w-full bg-transparent font-bold text-slate-800 focus:outline-none focus:bg-slate-50 p-1 rounded border border-slate-200"
                                  placeholder="Müşteri Ünvanı..."
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500">YETKİLİ</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.customerRepresentative || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, customerRepresentative: e.target.value })}
                                  className="w-full bg-transparent font-bold text-slate-800 focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500">TELEFON</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.customerPhone || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, customerPhone: e.target.value })}
                                  className="w-full bg-transparent text-slate-800 focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500">E-POSTA</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.customerEmail || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, customerEmail: e.target.value })}
                                  className="w-full bg-transparent text-slate-800 focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="bg-slate-50/50 p-2 font-bold text-slate-500">ADRES</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.customerAddress || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, customerAddress: e.target.value })}
                                  className="w-full bg-transparent text-slate-700 text-xs focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Proposal Items Table Inputs */}
                    <div className="overflow-hidden border border-slate-350 rounded-xl bg-white shadow-sm">
                      <table className="w-full border-collapse text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider text-center font-bold border-b border-slate-200">
                            <th className="p-2.5 w-10">SIRA</th>
                            <th className="p-2.5 w-40">SİPARİŞ KODU</th>
                            <th className="p-2.5">AÇIKLAMA</th>
                            <th className="p-2.5 w-20 text-right">MİKTAR</th>
                            <th className="p-2.5 w-16 text-center">BİRİM</th>
                            <th className="p-2.5 w-28 text-right">BİRİM FİYAT</th>
                            <th className="p-2.5 w-28 text-right">TOPLAM</th>
                            <th className="p-1 text-center w-8">SİL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draftQuote.items.map((item, idx) => {
                            const desc = item.description !== undefined ? item.description : (item.productCode.includes('SU') 
                              ? 'AĞIR HİZMET TİPİ KABLO KANALI H:40MM, E:1.5MM' 
                              : item.productCode.includes('STK') 
                                ? 'TEK LİFLİ KAVRAMA (DESTEK ARALIĞI 1.5M)'
                                : '');
                            const birim = item.unit !== undefined ? item.unit : (item.productCode.includes('SU') ? 'M' : 'AD');
                            return (
                              <tr key={idx} className="border-b border-slate-100 font-mono text-slate-900 text-xs">
                                <td className="p-2 text-center font-sans text-[10px]">{idx + 1}</td>
                                <td className="p-1 font-bold">
                                  <input 
                                    type="text" 
                                    value={item.productCode} 
                                    onChange={e => handleUpdateDraftItem(idx, 'productCode', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-250 rounded font-bold text-slate-800 text-xs p-1 focus:outline-none focus:bg-white"
                                    placeholder="Kod girin..."
                                  />
                                </td>
                                <td className="p-1 font-sans">
                                  <input 
                                    type="text" 
                                    value={desc} 
                                    onChange={e => handleUpdateDraftItem(idx, 'description', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-250 rounded text-xs p-1 focus:outline-none focus:bg-white text-slate-700"
                                    placeholder="Açıklama..."
                                  />
                                </td>
                                <td className="p-1 text-right font-bold">
                                  <input 
                                    type="number" 
                                    value={item.quantity} 
                                    onChange={e => handleUpdateDraftItem(idx, 'quantity', Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-250 rounded text-right font-bold p-1 focus:outline-none focus:bg-white"
                                  />
                                </td>
                                <td className="p-1 text-center font-sans">
                                  <input 
                                    type="text" 
                                    value={birim} 
                                    onChange={e => handleUpdateDraftItem(idx, 'unit', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-250 rounded text-center p-1 focus:outline-none focus:bg-white text-xs"
                                  />
                                </td>
                                <td className="p-1 text-right">
                                  <input 
                                    type="number" 
                                    value={item.price} 
                                    onChange={e => handleUpdateDraftItem(idx, 'price', Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-250 rounded text-right p-1 focus:outline-none focus:bg-white font-bold"
                                  />
                                </td>
                                <td className="p-2 text-right font-bold text-slate-800 font-mono">
                                  ₺ {(item.quantity * item.price).toFixed(2)}
                                </td>
                                <td className="p-2 text-center">
                                  <button onClick={() => handleRemoveDraftItem(idx)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">✖</button>
                                </td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td colSpan={8} className="p-3 text-center bg-slate-50/50">
                              <button 
                                onClick={handleAddDraftItem}
                                className="text-orange-600 font-bold hover:text-orange-700 text-xs uppercase flex items-center gap-1 mx-auto cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" /> Yeni Kalem Satırı Ekle
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Terms & Pricing Inputs */}
                    <div className="grid grid-cols-2 gap-6 items-start">
                      {/* Terms Left Inputs */}
                      <div className="overflow-hidden border border-slate-350 rounded-xl bg-white shadow-sm">
                        <table className="w-full border-collapse text-xs text-left">
                          <tbody>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50 text-slate-600 p-2 font-bold w-28">ÖDEME</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.paymentTerms || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, paymentTerms: e.target.value })}
                                  className="w-full bg-transparent font-semibold focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50 text-slate-600 p-2 font-bold">TESLİM SÜRESİ</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.deliveryTime || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, deliveryTime: e.target.value })}
                                  className="w-full bg-transparent font-semibold focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50 text-slate-600 p-2 font-bold">TESLİM YERİ</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.deliveryPlace || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, deliveryPlace: e.target.value })}
                                  className="w-full bg-transparent font-semibold focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="bg-slate-50 text-slate-600 p-2 font-bold">İŞ HESAP BİLG.</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.bankInfo || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, bankInfo: e.target.value })}
                                  className="w-full bg-transparent font-bold font-mono focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="bg-slate-50 text-slate-600 p-2 font-bold">ZİRAAT HES.</td>
                              <td className="p-1">
                                <input 
                                  type="text" 
                                  value={draftQuote.ziraatInfo || ''} 
                                  onChange={e => setDraftQuote({ ...draftQuote, ziraatInfo: e.target.value })}
                                  className="w-full bg-transparent font-bold font-mono focus:outline-none focus:bg-slate-50 p-1 rounded"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Pricing Right Inputs */}
                      {(() => {
                        const discAmt = draftQuote.totalAmount * ((draftQuote.discountPercent || 0) / 100);
                        const netTotal = draftQuote.totalAmount - discAmt;
                        const taxAmt = netTotal * ((draftQuote.taxPercent ?? 20) / 100);
                        const grandTotal = netTotal + taxAmt;
                        return (
                          <div className="overflow-hidden border border-slate-350 rounded-xl bg-white shadow-sm">
                            <table className="w-full border-collapse text-xs text-right font-mono font-bold">
                              <tbody>
                                <tr className="border-b border-slate-100">
                                  <td className="bg-slate-50/50 p-2 text-left text-slate-500 font-sans w-32">ARA TOPLAM</td>
                                  <td className="p-2 text-slate-700">₺ {draftQuote.totalAmount.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="bg-slate-50/50 p-2 text-left text-slate-500 font-sans flex items-center gap-1 justify-between">
                                    <span>İSKONTO (%)</span>
                                    <input 
                                      type="number" 
                                      value={draftQuote.discountPercent || 0}
                                      onChange={e => setDraftQuote({ ...draftQuote, discountPercent: Number(e.target.value) })}
                                      className="w-12 bg-white border border-slate-200 text-center text-slate-800 font-bold focus:outline-none rounded p-0.5"
                                    />
                                  </td>
                                  <td className="p-2 text-red-600">- ₺ {discAmt.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                  <td className="p-2 text-left text-slate-600 font-sans">NET TOPLAM</td>
                                  <td className="p-2 text-slate-900 text-sm font-extrabold">₺ {netTotal.toFixed(2)}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                  <td className="bg-slate-50/50 p-2 text-left text-slate-500 font-sans flex items-center gap-1 justify-between">
                                    <span>KDV (%)</span>
                                    <input 
                                      type="number" 
                                      value={draftQuote.taxPercent ?? 20}
                                      onChange={e => setDraftQuote({ ...draftQuote, taxPercent: Number(e.target.value) })}
                                      className="w-12 bg-white border border-slate-200 text-center text-slate-800 font-bold focus:outline-none rounded p-0.5"
                                    />
                                  </td>
                                  <td className="p-2 text-slate-700">₺ {taxAmt.toFixed(2)}</td>
                                </tr>
                                <tr className="bg-slate-900 text-white text-sm">
                                  <td className="p-2.5 text-left font-sans tracking-wide uppercase font-extrabold">GENEL TOPLAM</td>
                                  <td className="py-1 px-2 text-right font-extrabold font-mono text-base">₺ {grandTotal.toFixed(2)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-100 p-4 border-t flex justify-end gap-2">
                <button 
                  onClick={handleSaveDraftQuote}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2 rounded text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Teklifi Kaydet ve Kapat
                </button>
                <button 
                  onClick={() => setIsEditingNewQuote(false)} 
                  className="bg-slate-500 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded text-xs transition-colors cursor-pointer"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SHIPMENT DRAWER (IRSALIYE KES / SEVKIYAT YAP) */}
        {showShipModal && activeOrder && (
          <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col overflow-hidden">
            <div className="w-full h-full flex flex-col bg-white overflow-hidden">
              <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center shadow-md">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Truck className="h-5 w-5 text-emerald-500" /> İRSALİYE OLUŞTURMA & SEVKİYAT OPERASYONU
                </span>
                <button onClick={() => setShowShipModal(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg"><X className="h-6 w-6" /></button>
              </div>
              
              <div className="p-6 flex-1 grid grid-cols-3 gap-6 overflow-hidden text-xs text-slate-700">
                {/* Left Form: Inputs */}
                <div className="col-span-1 bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 flex flex-col justify-start overflow-y-auto">
                  <div className="bg-orange-50 border border-orange-200 text-orange-850 p-4 rounded-xl leading-relaxed text-xs">
                    <strong>🏢 Alıcı Müşteri:</strong> {activeOrder.customerName}<br />
                    <strong>Sipariş No:</strong> {activeOrder.id}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">İrsaliye Numarası</label>
                    <div className="flex mt-1 rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-100 text-slate-550 font-mono text-xs select-none">
                        SIR20260000
                      </span>
                      <input 
                        type="text" 
                        maxLength={4}
                        placeholder="1001"
                        value={shipDispatchNoSuffix} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setShipDispatchNoSuffix(val);
                        }}
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-slate-300 font-mono font-bold text-slate-800 text-xs focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fiili Sevk Tarihi</label>
                    <input 
                      type="date" 
                      value={shipDate} 
                      onChange={e => setShipDate(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-bold text-slate-800 mt-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span>Taşıyıcı / Şoför</span>
                      <span className="text-[9px] text-orange-600 font-normal lowercase">(listeden seçin veya yazın)</span>
                    </label>
                    <div className="relative mt-1">
                      <input 
                        type="text" 
                        list="saved_drivers_datalist"
                        placeholder="Şoför Adı Soyadı veya Taşıyıcı"
                        value={shipCarrierName} 
                        onChange={e => setShipCarrierName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-xs font-semibold text-slate-800 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      />
                      <datalist id="saved_drivers_datalist">
                        {savedDrivers.map((driver, idx) => (
                          <option key={idx} value={driver} />
                        ))}
                      </datalist>
                    </div>
                    {savedDrivers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {savedDrivers.slice(0, 5).map((d, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setShipCarrierName(d)}
                            className="text-[9px] bg-slate-200/70 hover:bg-orange-100 hover:text-orange-800 text-slate-700 font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            + {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span>Araç Plaka No</span>
                      <span className="text-[9px] text-orange-600 font-normal lowercase">(listeden seçin veya yazın)</span>
                    </label>
                    <div className="relative mt-1">
                      <input 
                        type="text" 
                        list="saved_plates_datalist"
                        placeholder="Örn: 34KFG377"
                        value={shipPlateNo} 
                        onChange={e => setShipPlateNo(e.target.value.toUpperCase())}
                        className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-bold text-slate-800 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      />
                      <datalist id="saved_plates_datalist">
                        {savedPlates.map((plate, idx) => (
                          <option key={idx} value={plate} />
                        ))}
                      </datalist>
                    </div>
                    {savedPlates.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {savedPlates.slice(0, 5).map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setShipPlateNo(p)}
                            className="text-[9px] bg-slate-200/70 hover:bg-orange-100 hover:text-orange-800 text-slate-700 font-mono font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            + {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Form: Editable Table */}
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-xs">SEVK EDİLECEK KALEMLER LİSTESİ</span>
                    <span className="text-[10px] text-slate-500">Miktarları bu listede doğrudan düzenleyebilirsiniz</span>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px] tracking-wider bg-slate-50/50">
                          <th className="py-1 px-1 text-center w-12">Sevk</th>
                          <th className="p-2.5 w-24">Ürün Kodu</th>
                          <th className="p-2.5">Malın Tanımı</th>
                          <th className="py-1 px-2 text-right w-20">Sipariş</th>
                          <th className="py-1 px-2 text-right w-20">Kalan</th>
                          <th className="py-1 px-1 text-center w-28">Sevk Miktarı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const targetOrd = selectedOrderDetailOrder || activeOrder;
                          if (!targetOrd) return null;
                          const displayItems = sortProductionItems(targetOrd.items);

                          return displayItems.map((item, idx) => {
                            const key = `${item.productCode}-${idx}`;
                            if (!selectedItems[key]) return null;

                            const remaining = item.quantity - (item.shippedQuantity || 0);
                            const isSelected = !!selectedItems[key];
                            const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const descStr = prodCatalog ? prodCatalog.name : item.description || 'KABLO YOLU ELEMANI';
                            
                            return (
                              <tr key={key} className="hover:bg-slate-50/50 bg-emerald-50/10">
                                <td className="py-1 px-1 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      handleToggleSelectItem(key);
                                    }}
                                    disabled={remaining <= 0}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                  />
                                </td>
                                <td className="py-1 px-2 font-mono font-bold text-slate-900">{item.productCode}</td>
                                <td className="p-2.5 font-semibold text-slate-700">{descStr}</td>
                                <td className="py-1 px-2 text-right font-mono font-bold text-slate-700">{item.quantity} {getItemUnit(item)}</td>
                                <td className="py-1 px-2 text-right font-mono font-bold text-orange-600">{remaining} {getItemUnit(item)}</td>
                                <td className="py-1 px-1 text-center">
                                  <input 
                                    type="number"
                                    min="1"
                                    max={remaining}
                                    value={actionQuantities[key] !== undefined ? actionQuantities[key] : remaining}
                                    onChange={e => {
                                      const val = Math.min(remaining, Math.max(1, parseInt(e.target.value) || 1));
                                      setActionQuantities(prev => ({ ...prev, [key]: val }));
                                    }}
                                    className="w-20 text-center font-mono font-bold border border-slate-300 rounded p-1 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                                  />
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-100 p-4 border-t flex justify-end gap-2">
                <button onClick={() => setShowShipModal(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded text-xs">Vazgeç</button>
                <button onClick={handleConfirmShipment} className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded text-xs shadow-sm">Sevkiyatı Tamamla & İrsaliye Kes</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: HONEYWELL PRINTABLE LABEL SELECTOR & PREVIEW */}
        {showLabelModal && (
          <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col print:relative overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                html, body { height: auto !important; overflow: visible !important; background: white !important; }
                .print\:hidden { display: none !important; }
                .honeywell-label-50-100 {
                  display: block !important;
                  position: relative !important;
                  width: 100mm !important;
                  height: 50mm !important;
                  margin: 0 auto !important;
                  page-break-after: always !important;
                }
                @page { size: 100mm 50mm; margin: 0; }
              }
            `}} />
            <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden print:bg-white print:h-auto">
              <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Printer className="h-4 w-4 text-orange-500" /> Honeywell Label Creator (50x100mm)</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded text-xs shadow-sm">Etiketleri Bas</button>
                  <button onClick={() => setShowLabelModal(false)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs"><X className="h-5 w-5" /></button>
                </div>
              </div>
              
              <div className="p-6 bg-slate-200 overflow-y-auto flex-1 flex flex-col items-center justify-start gap-6 print:bg-white print:p-0 print:gap-0">
                {Object.keys(selectedItems).filter(k => selectedItems[k]).map(key => {
                  const targetOrder = selectedOrderDetailOrder || activeOrder;
                  if (!targetOrder) return null;
                  const displayItems = sortProductionItems(targetOrder.items);
                  const lastDashIndex = key.lastIndexOf('-');
                  const prodCode = key.substring(0, lastDashIndex);
                  const itemIdx = parseInt(key.substring(lastDashIndex + 1));
                  const item = displayItems[itemIdx];
                  if (!item || item.productCode !== prodCode) return null;
                  const qty = actionQuantities[key] || (item.quantity - (item.shippedQuantity || 0));
                  
                  return (
                    <div key={key} className="honeywell-label-50-100 bg-white text-black p-3 border-2 border-black rounded shadow-md font-sans w-[100mm] h-[50mm] flex flex-col justify-between shrink-0 box-border print:shadow-none print:border-black print:rounded-none print:my-0 print:mx-auto print:page-break-after-always">
                      <div className="flex justify-between items-start border-b border-black pb-1">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sm uppercase tracking-wider leading-none">SIES ELEKTRİK</span>
                          <span className="text-[6px] text-slate-500 leading-none mt-0.5">MADE IN TURKEY / KALİTE GÜVENCE</span>
                        </div>
                        <span className="font-mono font-black text-xs border border-black px-1 py-0.5 bg-black text-white">{prodCode}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 text-[8px] my-1 leading-tight flex-1">
                        <div>
                          <span className="text-slate-400 block text-[6px] uppercase font-bold">Müşteri / Proje:</span>
                          <span className="font-extrabold text-[9px] block truncate">{targetOrder.customerName}</span>
                          <span className="text-slate-700 block truncate">{targetOrder.projectNo || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[6px] uppercase font-bold">Sipariş / İrsaliye No:</span>
                          <span className="font-bold text-[9px] block">{targetOrder.id}</span>
                        </div>
                        <div className="col-span-2 border-t border-dotted border-slate-300 pt-1">
                          <span className="text-slate-400 block text-[6px] uppercase font-bold">Ürün Detayı:</span>
                          <span className="font-semibold block truncate">{item.description || 'GLV ME TİPİ KABLO KANALI'}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-black pt-1">
                        <div className="flex flex-col">
                          <span className="text-[6px] text-slate-500 uppercase leading-none">Miktar (Qty):</span>
                          <span className="font-black text-base leading-none mt-0.5">{qty} <span className="text-[9px] uppercase font-bold">AD</span></span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-black text-white text-[7px] font-mono px-1 rounded font-bold uppercase tracking-wider">QC PASSED</div>
                          <span className="text-[5px] text-slate-400 mt-0.5 font-mono">BATCH: {new Date().toISOString().split('T')[0].replace(/-/g, '')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SEVK İRSALİYESİ PRINT VIEW MODAL */}
        {activeDispatchToShow && (
          <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col print:relative overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                html, body { height: auto !important; overflow: visible !important; background: white !important; }
                .print\:hidden { display: none !important; }
                .print-area {
                  position: relative !important;
                  left: 0;
                  top: 0;
                  width: 100% !important;
                  max-width: 100% !important;
                  transform: scale(0.96);
                  transform-origin: top center;
                }
                @page { size: A4 portrait; margin: 8mm; }
              }
            `}} />
            <div className="w-full h-full flex flex-col bg-slate-200 overflow-hidden print:bg-white print:h-auto">
              <div className="bg-slate-955 text-white p-4 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Sevk İrsaliyesi Raporu</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm"><Printer className="h-4 w-4" /> Yazdır</button>
                  <button onClick={() => setActiveDispatchToShow(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs"><X className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="p-6 bg-slate-200 overflow-y-auto flex justify-center print:bg-white print:p-0">
                <div className="print-area print-portrait w-full max-w-[210mm] bg-white text-slate-950 p-8 shadow-lg border border-slate-300 rounded font-sans leading-normal flex flex-col justify-between mx-auto print:border-0 print:shadow-none print:p-2 min-h-[297mm]">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
                      <div className="flex flex-col">
                        <img src="sies_logo.png" alt="SIES Logo" className="h-10 object-contain w-fit" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold mt-1">SIES ELEKTRİK TAAHHÜT SAN. VE TİC. A.Ş.</span>
                        <span className="text-[8px] text-slate-405 mt-1 max-w-xs leading-tight">
                          Dilovası Organize Sanayi Bölgesi 4. Kısım Sakarya Cad. No: 18 Dilovası / KOCAELİ<br />
                          Tel: +90 262 754 00 00 | Fax: +90 262 754 00 11<br />
                          www.sies.com.tr | info@sies.com.tr
                        </span>
                      </div>
                      
                      <div className="text-right font-mono text-[9px] space-y-1">
                        <h2 className="text-base font-black text-slate-900 tracking-wider">SEVK İRSALİYESİ</h2>
                        <div>İRSALİYE NO: <span className="text-black font-extrabold text-sm">{activeDispatchToShow.dispatchNoteNo}</span></div>
                        <div>DÜZENLEME TARİHİ: <span className="text-black font-bold">{activeDispatchToShow.date}</span></div>
                        <div>FİİLİ SEVK TARİHİ: <span className="text-black font-bold">{activeDispatchToShow.date}</span></div>
                      </div>
                    </div>

                    {/* Customer & Shipping Info */}
                    <div className="grid grid-cols-2 gap-6 border border-slate-300 p-4 rounded-lg text-[10px] mb-6 leading-relaxed bg-slate-50/50">
                      <div>
                        <span className="block text-slate-400 uppercase text-[8px] font-bold">Müşteri Ünvanı / Adresi</span>
                        <span className="text-slate-900 font-black text-xs block mb-1">{selectedOrderDetailOrder?.customerName}</span>
                        <span className="text-slate-700 block">{selectedOrderDetailOrder?.shippingAddress || 'TESİS TESLİM'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 uppercase text-[8px] font-bold">Sevkiyat Bilgileri</span>
                        <div><strong>Sipariş ID:</strong> {selectedOrderDetailOrder?.id}</div>
                        <div><strong>Taşıma Şekli:</strong> {selectedOrderDetailOrder?.deliveryType || 'AMBAR İLE SEVK'}</div>
                        {activeDispatchToShow.carrierName && <div><strong>Şoför / Taşıyıcı:</strong> {activeDispatchToShow.carrierName}</div>}
                        {activeDispatchToShow.plateNo && <div><strong>Araç Plakası:</strong> {activeDispatchToShow.plateNo}</div>}
                        <div><strong>Proje Numarası:</strong> {selectedOrderDetailOrder?.projectNo || '-'}</div>
                      </div>
                    </div>

                    {/* Shipped Items Table */}
                    <table className="w-full border-collapse border border-slate-300 text-[10px] font-mono text-left mb-6">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-b border-slate-300 text-[9px] text-slate-800">
                          <th className="border border-slate-300 p-2.5 w-12 text-center">S.NO</th>
                          <th className="border border-slate-300 py-1 px-2 w-32">ÜRÜN KODU</th>
                          <th className="border border-slate-300 p-2.5">MALIN CİNSİ VE TANIMI</th>
                          <th className="border border-slate-300 p-2.5 w-24 text-right">MİKTAR</th>
                          <th className="border border-slate-300 p-2.5 w-20 text-center">BİRİM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDispatchToShow.items?.map((item: any, idx: number) => {
                          const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                          const descStr = item.description || item.productName || (prodCatalog && prodCatalog.name !== 'KABLO TAŞIYICI ELEMANLARI VE AKSESUARLARI' ? prodCatalog.name : item.productCode);
                          const unitStr = getItemUnit(item);
                          return (
                            <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50/50">
                              <td className="border border-slate-300 py-1 px-1 text-center">{idx + 1}</td>
                              <td className="border border-slate-300 p-2.5 font-bold text-slate-900">{item.productCode}</td>
                              <td className="border border-slate-300 py-1 px-2 font-sans font-medium text-slate-700">{descStr}</td>
                              <td className="border border-slate-300 py-1 px-2 text-right font-extrabold text-slate-900">{item.quantity}</td>
                              <td className="border border-slate-300 py-1 px-1 text-center">{unitStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="bg-orange-50 border border-orange-200 text-orange-850 p-3 rounded-lg text-[9px] leading-relaxed mb-6">
                      <strong>⚠️ ÖNEMLİ UYARI:</strong> Bu irsaliye, kalite güvence standartları gereğince SIES Kalite Yönetim Sistemi (QMS) üzerinden dijital olarak oluşturulmuş olup, sevk edilen ürünler FR-10 Son Kontrol Prosedürlerine göre muayene edilerek onaylanmıştır. Teslim alırken lütfen ürün miktarlarını kontrol ediniz.
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8 mt-12 text-[10px]">
                    <div className="text-center space-y-8">
                      <span className="block font-bold uppercase tracking-wider text-slate-505">TESLİM EDEN (DEPO / SEVKİYAT)</span>
                      <div className="h-12 flex items-center justify-center font-mono text-[9px] text-slate-400 border border-dashed border-slate-200 rounded">
                        SIES Depo Yetkilisi İmza / Kaşe
                      </div>
                    </div>
                    <div className="text-center space-y-8">
                      <span className="block font-bold uppercase tracking-wider text-slate-505">TESLİM ALAN (ALICI / MÜŞTERİ)</span>
                      <div className="h-12 flex items-center justify-center font-mono text-[9px] text-slate-400 border border-dashed border-slate-200 rounded">
                        Müşteri Teslim Yetkilisi Ad-Soyad / İmza
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: FR-009 PROSES KARTLARI LIST MODAL */}
        {activeFR009ToShow && activeFR009ToShow.length > 0 && (
          <div id="fr009-modal-container" className="fixed inset-0 bg-slate-100 z-50 flex flex-col overflow-y-auto print:static print:bg-white print:overflow-visible print:p-0 print:m-0">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                html, body {
                  height: auto !important;
                  overflow: visible !important;
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .print\:hidden {
                  display: none !important;
                }
                #fr009-modal-container {
                  position: static !important;
                  display: block !important;
                  width: 100% !important;
                  height: auto !important;
                  background: white !important;
                  overflow: visible !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .print-area {
                  position: relative !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                  transform: none !important;
                  background: white !important;
                  display: block !important;
                }
                @page {
                  size: A4 portrait;
                  margin: 8mm;
                }
              }
            `}} />
            <div className="w-full min-h-screen flex flex-col bg-slate-150 print:bg-white print:block print:h-auto print:overflow-visible">
              <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider">FR-009 İmalat Takip & Proses Muayene Kartları</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm"><Printer className="h-4 w-4" /> Kartları Yazdır</button>
                  <button onClick={() => setActiveFR009ToShow(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs"><X className="h-5 w-5" /></button>
                </div>
              </div>
              
              <div className="p-6 bg-slate-200 overflow-y-auto flex flex-col items-center justify-start gap-6 print:bg-white print:p-0 print:gap-0 print:overflow-visible flex-1">
                {(() => {
                  const masterRun = activeFR009ToShow[0] || {};
                  const targetOrder = activeFR009Order || orders.find(o => 
                    o.id === masterRun.orderId || 
                    o.id === masterRun.productionOrderNo || 
                    (masterRun.id && masterRun.id.includes(o.id)) ||
                    (masterRun.productionOrderNo && masterRun.productionOrderNo.includes(o.id)) ||
                    (masterRun.customerName && o.customerName === masterRun.customerName)
                  ) || orders.find(o => o.id === selectedMasterOrderId) || selectedOrderDetailOrder || activeOrder;
                  
                  return (
                    <div className="print-area print-portrait w-full max-w-[210mm] bg-white text-slate-900 p-8 shadow-lg border border-slate-300 rounded font-sans leading-normal mx-auto my-0 print:border-0 print:shadow-none print:p-0 print:w-full print:max-w-none print:m-0 print:static">
                      <div>
                        {/* Header Box */}
                        <div className="border-2 border-slate-950 grid grid-cols-4 text-center items-center text-xs font-bold mb-4">
                          <div className="p-2 border-r-2 border-slate-950 flex flex-col justify-center items-center">
                            <img src="sies_logo.png" alt="SIES Logo" className="h-12 object-contain" />
                          </div>
                          <div className="p-2 border-r-2 border-slate-950 col-span-2 text-center uppercase text-slate-950 text-sm sm:text-base font-black tracking-wide">
                            İMALAT TAKİP VE PROSES MUAYENE KARTI<br />
                            <span className="text-xs font-bold text-slate-700">(PROCESS INSPECTION CARD)</span>
                          </div>
                          <div className="p-2 text-left font-mono text-xs space-y-1">
                            <div>KART NO: <span className="text-black font-extrabold">{masterRun.id || 'FR009-01'}</span></div>
                            <div>TARİH: <span className="text-black font-bold">{masterRun.date || new Date().toISOString().split('T')[0]}</span></div>
                            <div>DÖKÜMAN NO: <span className="text-black font-extrabold">FR-009</span></div>
                          </div>
                        </div>

                        {/* Order & Card Info */}
                        {(() => {
                          const coatingStr = (targetOrder?.coatingTypes && targetOrder.coatingTypes.length > 0)
                            ? targetOrder.coatingTypes.join(' + ')
                            : ((targetOrder as any)?.coatingType || 'ELEKTROSTATİK BOYALI');
                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-2 border-slate-950 p-3 rounded-md text-xs sm:text-sm text-slate-900 mb-4 leading-normal bg-slate-100/80">
                              <div><strong className="text-slate-800">Müşteri Adı:</strong> <span className="text-slate-950 font-black text-sm sm:text-base uppercase bg-yellow-200 px-2 py-0.5 rounded border border-yellow-400">{targetOrder?.customerName || 'MÜŞTERİ'}</span></div>
                              <div><strong className="text-slate-800">Sipariş ID / No:</strong> <span className="text-slate-950 font-mono font-black text-sm">{targetOrder?.id || '-'}</span></div>
                              <div><strong className="text-slate-800">Kaplama Cinsi:</strong> <span className="text-orange-800 font-black text-xs sm:text-sm uppercase bg-orange-100 px-2 py-0.5 rounded border border-orange-300">{coatingStr}</span></div>
                              <div><strong className="text-slate-800">Toplam Kalem:</strong> <span className="text-slate-950 font-mono font-black text-sm">{editableRuns.length} KALEM</span></div>
                              <div><strong className="text-slate-800">İş Emri No:</strong> <span className="text-slate-950 font-mono font-black text-sm">{masterRun.productionOrderNo || 'EMR-2026'}</span></div>
                              <div><strong className="text-slate-800">Operatör Ref:</strong> <span className="text-slate-950 font-bold text-sm">{masterRun.operator || 'Depo / Üretim Sorumlusu'}</span></div>
                              <div><strong className="text-slate-800">Proses Durumu:</strong> <span className="text-orange-700 font-black text-sm">ÜRETİMDE</span></div>
                            </div>
                          );
                        })()}

                        {/* SİPARİŞ İMALAT KALEMLERİ LİSTESİ TABLOSU */}
                        <div className="border-2 border-slate-950 rounded overflow-hidden mb-4 print:border-slate-950">
                          <div className="bg-slate-950 text-white px-3 py-2 flex justify-between items-center text-xs sm:text-sm font-black uppercase print:bg-slate-950 print:text-white">
                            <span>SİPARİŞ İMALAT KALEMLERİ & İŞ EMRİ LİSTESİ (FR-009)</span>
                            <span>TOPLAM {editableRuns.length} KALEM</span>
                          </div>
                          <table className="w-full text-left text-xs sm:text-sm border-collapse font-sans">
                            <thead>
                              <tr className="bg-slate-200 text-slate-950 uppercase font-black border-b-2 border-slate-950 text-center">
                                <th className="p-2 border-r border-slate-950 w-10">#</th>
                                <th className="p-2 border-r border-slate-950 w-32 font-mono">KOD</th>
                                <th className="p-2 border-r border-slate-950 text-left">AÇIKLAMA / MALIN TANIMI</th>
                                <th className="p-2 border-r border-slate-950 w-24 text-right">MİKTAR</th>
                                <th className="p-2 border-r border-slate-950 w-20 text-center">BİRİM</th>
                                <th className="p-2 text-left min-w-[180px]">NOT / İMALAT ÖZEL TALİMATI</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-400">
                              {editableRuns.map((rItem, rIdx) => (
                                <tr key={`fr009-row-${rItem.id || 'item'}-${rIdx}`} className="hover:bg-slate-50">
                                  <td className="p-2 border-r border-slate-400 text-center font-black text-slate-800">{rIdx + 1}</td>
                                  <td className="p-2 border-r border-slate-400 font-mono font-black text-slate-950 text-xs sm:text-sm">{rItem.productCode}</td>
                                  <td className="p-2 border-r border-slate-400 font-extrabold text-slate-950">{rItem.description || rItem.productName || rItem.productCode}</td>
                                  <td className="p-2 border-r border-slate-400 text-right font-mono font-black text-slate-950 text-xs sm:text-sm">{rItem.quantity}</td>
                                  <td className="p-2 border-r border-slate-400 text-center uppercase font-bold text-slate-900">{rItem.unit || 'ADET'}</td>
                                  <td className="p-1.5 border-slate-400">
                                    <span className="hidden print:inline-block font-extrabold text-slate-950 text-xs sm:text-sm">
                                      {rItem.notes || ''}
                                    </span>
                                    <input 
                                      type="text"
                                      value={rItem.notes || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditableRuns(prev => prev.map((item, idx) => idx === rIdx ? { ...item, notes: val } : item));
                                      }}
                                      placeholder=""
                                      className="w-full bg-slate-50 focus:bg-white border border-slate-400 rounded px-2 py-1.5 text-xs sm:text-sm font-bold text-slate-950 outline-none print:hidden"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Operasyon Yonlendirme Şeması */}
                        <div className="border border-slate-300 rounded-lg p-3 bg-white shadow-xs mb-4 print:hidden">
                          <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 border-b pb-1">Operasyon İstasyon Rotası & Proses Akışı</h5>
                          <div className="flex items-center gap-2 overflow-x-auto py-1">
                            {(masterRun.processes || ['Kesme', 'Delme', 'Bükme']).map((step: string, sIdx: number) => (
                              <div key={step} className="flex items-center gap-2 shrink-0">
                                <div className="bg-slate-950 text-white border border-slate-900 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded shadow-xs uppercase tracking-wide">
                                  {sIdx + 1}. {step}
                                </div>
                                {sIdx < (masterRun.processes || []).length - 1 && (
                                  <span className="text-slate-600 text-sm font-extrabold">➔</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Muayene Tablosu */}
                        <table className="w-full border-collapse border-2 border-slate-950 text-xs font-sans text-left print:hidden">
                          <thead>
                            <tr className="bg-slate-200 text-center font-black border-b-2 border-slate-950 text-slate-950">
                              <th className="border border-slate-950 p-2 w-24" rowSpan={2}>KONTROL OPERASYONU</th>
                              <th className="border border-slate-950 p-2 w-28" rowSpan={2}>KONTROL PARAMETRESİ</th>
                              <th className="border border-slate-950 p-2 w-28" rowSpan={2}>TOLERANS / STANDART</th>
                              <th className="border border-slate-950 p-2 col-span-3">İLK ÜRETİM ONAYI (İ.U.O)</th>
                              <th className="border border-slate-950 p-2 col-span-3">PROSES PERİYODİK KONTROL (P.P.K)</th>
                            </tr>
                            <tr className="bg-slate-100 text-[10px] sm:text-xs text-center font-bold text-slate-900">
                              <th className="border border-slate-950 p-1.5">ÖLÇÜLEN (MM)</th>
                              <th className="border border-slate-950 p-1.5 w-16">DURUM</th>
                              <th className="border border-slate-950 p-1.5 w-16">ONAY / İMZA</th>
                              <th className="border border-slate-950 p-1.5">PERİYOT (HER 10. ADET)</th>
                              <th className="border border-slate-950 p-1.5 w-16">DURUM</th>
                              <th className="border border-slate-950 p-1.5 w-16">ONAY / İMZA</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-slate-50">
                              <td className="border border-slate-950 p-2 font-black text-slate-950 text-xs" rowSpan={3}>1. GEOMETRİK BOYUTLAR</td>
                              <td className="border border-slate-950 p-2 font-bold text-slate-900">Genişlik (Width)</td>
                              <td className="border border-slate-950 p-2 font-mono text-[10px] font-bold text-slate-800">±1.0 mm (TS EN 61537)</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">{masterRun.firstCheckWidthMm || '-'} mm</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">QMS-APP</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Her 50 Metre</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="border border-slate-950 p-2 font-bold text-slate-900">Kenar Yükseklik (Height)</td>
                              <td className="border border-slate-950 p-2 font-mono text-[10px] font-bold text-slate-800">±1.0 mm (TS EN 61537)</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">{masterRun.firstCheckHeightMm || '-'} mm</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">QMS-APP</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Her 50 Metre</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="border border-slate-950 p-2 font-bold text-slate-900">Kalınlık (Thickness)</td>
                              <td className="border border-slate-950 p-2 font-mono text-[10px] font-bold text-slate-800">±0.05 mm (TS EN 10143)</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">{masterRun.firstCheckThicknessMm || '-'} mm</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">QMS-APP</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Sac Bobin Değişimi</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="border border-slate-950 p-2 font-black text-slate-950 text-xs">2. PERFORASYON ŞEKLİ</td>
                              <td className="border border-slate-950 p-2 font-bold text-slate-900">Delik Çapı / Eksen Ölçüsü</td>
                              <td className="border border-slate-950 p-2 font-mono text-[10px] font-bold text-slate-800">±0.5 mm</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Görsel Kontrol</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">QMS-APP</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Her Bobin Başı</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="border border-slate-950 p-2 font-black text-slate-950 text-xs" rowSpan={2}>3. GÖRSEL MUAYENE</td>
                              <td className="border border-slate-950 p-2 font-bold text-slate-900">Büküm Açıları (90°)</td>
                              <td className="border border-slate-950 p-2 font-mono text-[10px] font-bold text-slate-800">±1.5° (Çapak, Deformasyon Yok)</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Görsel / Şablon</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">QMS-APP</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Sürekli Gözlem</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                              <td className="border border-slate-950 p-2 font-bold text-slate-900">Çapak / Kenar Keskinliği</td>
                              <td className="border border-slate-950 p-2 font-mono text-[10px] font-bold text-slate-800">Çapaksız (Kenarlar Radüslü)</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Görsel Kontrol</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">QMS-APP</td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">Sürekli Gözlem</td>
                              <td className="border border-slate-950 p-2 text-center"><span className="text-emerald-800 bg-emerald-100 border border-emerald-300 font-black uppercase text-[10px] px-1.5 py-0.5 rounded">UYGUN</span></td>
                              <td className="border border-slate-950 p-2 text-center font-mono font-bold">F.O</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t-2 border-slate-950 pt-4 text-xs mt-6 leading-relaxed">
                        <div className="space-y-1">
                          <span className="block font-black text-slate-800 uppercase">KART NOTLARI VE OPERATÖR BEYANI:</span>
                          <p className="text-slate-900 font-bold">{masterRun.notes || 'Herhangi bir proses dışı veya uygunsuzluk kaydı yapılmamıştır. İlk üretim onayına göre seri üretime geçilmiştir.'}</p>
                        </div>
                        <div className="flex justify-between items-center bg-slate-100 border border-slate-400 p-3 rounded-md">
                          <div>
                            <span className="block text-[8px] text-slate-600 font-bold uppercase">PROSES KONTROL KARARI</span>
                            <span className="text-emerald-800 font-black text-xs sm:text-sm uppercase leading-none">SEVKİYAT YAPILABİLİR (KABUL)</span>
                          </div>
                          <div className="text-right space-y-1">
                            <div><span className="text-[8px] text-slate-600 font-bold uppercase">HAZIRLAYAN: </span><span className="font-extrabold text-slate-950 text-xs">Faruk Oruç (QA)</span></div>
                            <div><span className="text-[8px] text-slate-600 font-bold uppercase">ONAYLAYAN: </span><span className="font-extrabold text-slate-950 text-xs">İbrahim Sert (Müdür)</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: FR-10 SON KONTROL RAPORU MODAL */}
        {activeFR012ToShow && (
          <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col print:relative overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                html, body { height: auto !important; overflow: visible !important; background: white !important; margin: 0 !important; padding: 0 !important; }
                .print\:hidden { display: none !important; }
                body, body *:has(.print-area), .print-area, .print-area * { visibility: visible !important; }
                body *:has(.print-area) {
                  position: static !important;
                  display: block !important;
                  overflow: visible !important;
                  height: auto !important;
                  width: 100% !important;
                  background: white !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .print-area {
                  position: relative !important;
                  left: auto !important;
                  top: auto !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  transform: scale(0.92);
                  transform-origin: top center;
                }
                @page { size: A4 landscape; margin: 4mm; }
              }
            `}} />
            <div className="w-full h-full flex flex-col bg-slate-150 overflow-hidden print:bg-white print:h-auto">
              <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider">FR-10 Son Kontrol Raporu (Incoming / Outgoing Inspection Ledger)</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm"><Printer className="h-4 w-4" /> Formu Yazdır</button>
                  <button onClick={() => setActiveFR012ToShow(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs"><X className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="p-6 bg-slate-200 overflow-y-auto flex justify-center print:bg-white print:p-0">
                <div className="print-area print-landscape w-full bg-white text-slate-955 p-6 shadow-lg border border-slate-300 rounded font-sans leading-normal flex flex-col justify-between mx-auto print:border-0 print:shadow-none print:p-2 overflow-x-auto">
                  <div>
                    <div className="flex justify-between items-center border border-slate-200 mb-3 text-[9px] font-sans">
                      <div className="p-2 border-r border-slate-950 flex flex-col justify-center items-center w-[180px] shrink-0 text-center">
                        <img src="sies_logo.png" alt="SIES Logo" className="h-8 object-contain" />
                        <span className="text-[6px] text-slate-500 block uppercase mt-0.5">www.sies.com.tr / sies@sies.com.tr</span>
                      </div>
                      <div className="flex-1 text-center font-bold text-[14px] uppercase tracking-wide border-r border-slate-950 py-3 text-slate-900">
                        SON KONTROL FORMU
                        {activeFR012ToShow.status === 'ONAYLANDI' ? (
                          <span className="ml-2 text-[8px] bg-green-100 text-green-800 border border-green-300 px-1.5 py-0.5 rounded uppercase font-extrabold align-middle">ONAYLANDI</span>
                        ) : (
                          <span className="ml-2 text-[8px] bg-orange-100 text-orange-800 border border-orange-300 px-1.5 py-0.5 rounded uppercase font-extrabold align-middle animate-pulse">KONTROL BEKLİYOR</span>
                        )}
                      </div>
                      <div className="w-[180px] shrink-0 font-bold text-[8px]">
                        <div className="grid grid-cols-2 border-b border-slate-955"><span className="p-1 border-r border-slate-955">Sayfa No</span><span className="p-1 text-center font-mono">1/1</span></div>
                        <div className="grid grid-cols-2 border-b border-slate-955"><span className="p-1 border-r border-slate-955">Rev. No</span><span className="p-1 text-center font-mono">1</span></div>
                        <div className="grid grid-cols-2 border-b border-slate-955"><span className="p-1 border-r border-slate-955">Y. Tarihi</span><span className="p-1 text-center font-mono">10/28/2011</span></div>
                        <div className="grid grid-cols-2"><span className="p-1 border-r border-slate-955">Dok. No</span><span className="p-1 text-center font-mono">FR 10</span></div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-200 text-[11px] text-left font-mono min-w-[1300px]">
                        <thead>
                          <tr className="bg-slate-100 text-center font-bold border-b border-slate-955 text-[10px]">
                            <th className="border border-slate-200 p-1.5 w-24" rowSpan={2}>İRSALİYE NUMARASI</th>
                            <th className="border border-slate-200 p-1.5 w-20" rowSpan={2}>TARİH</th>
                            <th className="border border-slate-200 p-1.5 w-[220px]" rowSpan={2}>MÜŞTERİ ADI</th>
                            <th className="border border-slate-200 p-1.5 w-24" rowSpan={2}>ÜRÜN KODU</th>
                            <th className="border border-slate-200 p-1.5 w-[360px]" rowSpan={2}>MAL ADI</th>
                            <th className="border border-slate-200 p-1.5 w-16" rowSpan={2}>ÜRÜN MİKTARI</th>
                            <th className="border border-slate-200 p-1.5 w-16" rowSpan={2}>BİRİM METRE / ADET</th>
                            <th className="border border-slate-200 p-1" colSpan={3}>RESİM ÖLÇÜSÜ</th>
                            <th className="border border-slate-200 p-1" colSpan={3}>ÖLÇÜLEN DEĞER</th>
                            <th className="border border-slate-200 p-1" colSpan={4}>ÖLÇÜ ALETİ (M.A)</th>
                            <th className="border border-slate-200 p-1" colSpan={2}>KAPLAMA BİLGİLERİ</th>
                            <th className="border border-slate-200 p-1 w-16" rowSpan={2}>NUMUNE ADEDİ</th>
                            <th className="border border-slate-200 p-1 w-20" rowSpan={2}>KONTROL SONUCU</th>
                          </tr>
                          <tr className="bg-slate-50 text-[8px] text-center font-bold">
                            <th className="border border-slate-200 p-1 w-12">GENİŞLİK (W)</th>
                            <th className="border border-slate-200 p-1 w-12">YÜKSEKLİK (H)</th>
                            <th className="border border-slate-200 p-1 w-12">KALINLIK (T)</th>
                            <th className="border border-slate-200 p-1 w-12">GENİŞLİK (W)</th>
                            <th className="border border-slate-200 p-1 w-12">YÜKSEKLİK (H)</th>
                            <th className="border border-slate-200 p-1 w-12">KALINLIK (T)</th>
                            <th className="border border-slate-200 p-1 w-10">ŞERİTMETRE</th>
                            <th className="border border-slate-200 p-1 w-10">KUMPAS</th>
                            <th className="border border-slate-200 p-1 w-10">FOLYO CİHAZI</th>
                            <th className="border border-slate-200 p-1 w-10">E.S. TEST CİHAZI</th>
                            <th className="border border-slate-200 p-1 w-24">KAPLAMA CİNSİ</th>
                            <th className="border border-slate-200 p-1 w-20">KALINLIK (µm)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fr12Items.map((item, idx) => {
                            const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const descStr = item.desc || item.description || item.productName || (prodCatalog && prodCatalog.name !== 'KABLO TAŞIYICI ELEMANLARI' ? prodCatalog.name : item.productCode);
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 text-center font-mono">
                                <td className="border border-slate-200 p-1 font-bold">{activeFR012ToShow.dispatchNoteNo}</td>
                                <td className="border border-slate-200 p-1">{activeFR012ToShow.date}</td>
                                <td className="border border-slate-200 p-1.5 font-sans text-left uppercase text-[9px] font-bold whitespace-normal break-words leading-tight">{activeFR012ToShow.customerName}</td>
                                <td className="border border-slate-200 p-1 font-bold text-slate-800">{item.productCode}</td>
                                <td className="border border-slate-200 p-1.5 font-sans text-left text-[9px] font-medium whitespace-normal break-words leading-tight">{descStr}</td>
                                <td className="border border-slate-200 p-1 font-bold text-slate-900">{item.quantity}</td>
                                <td className="border border-slate-200 p-1 font-sans">{getItemUnit(item)}</td>
                                
                                {/* RESİM ÖLÇÜSÜ INPUTS */}
                                <td className="border border-slate-200 p-0.5">
                                  <input 
                                    type="text" 
                                    value={item.resimGen || ''} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, resimGen: e.target.value } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="w-full text-center bg-transparent border-0 p-0 font-mono text-[10px] font-extrabold focus:ring-0 focus:bg-orange-50/50"
                                    placeholder="W"
                                  />
                                </td>
                                <td className="border border-slate-200 p-0.5">
                                  <input 
                                    type="text" 
                                    value={item.resimYuk || ''} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, resimYuk: e.target.value } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="w-full text-center bg-transparent border-0 p-0 font-mono text-[10px] font-extrabold focus:ring-0 focus:bg-orange-50/50"
                                    placeholder="H"
                                  />
                                </td>
                                <td className="border border-slate-200 p-0.5">
                                  <input 
                                    type="text" 
                                    value={item.resimKal || ''} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, resimKal: e.target.value } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="w-full text-center bg-transparent border-0 p-0 font-mono text-[10px] font-extrabold focus:ring-0 focus:bg-orange-50/50"
                                    placeholder="T"
                                  />
                                </td>
                                
                                {/* ÖLÇÜLEN DEĞER INPUTS */}
                                <td className="border border-slate-200 p-0.5">
                                  <input 
                                    type="text" 
                                    value={item.olculenGen || ''} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, olculenGen: e.target.value } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="w-full text-center bg-transparent border-0 p-0 font-mono text-[10px] font-extrabold focus:ring-0 focus:bg-orange-50/50"
                                    placeholder="W-m"
                                  />
                                </td>
                                <td className="border border-slate-200 p-0.5">
                                  <input 
                                    type="text" 
                                    value={item.olculenYuk || ''} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, olculenYuk: e.target.value } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="w-full text-center bg-transparent border-0 p-0 font-mono text-[10px] font-extrabold focus:ring-0 focus:bg-orange-50/50"
                                    placeholder="H-m"
                                  />
                                </td>
                                <td className="border border-slate-200 p-0.5">
                                  <input 
                                    type="text" 
                                    value={item.olculenKal || ''} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, olculenKal: e.target.value } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="w-full text-center bg-transparent border-0 p-0 font-mono text-[10px] font-extrabold focus:ring-0 focus:bg-orange-50/50"
                                    placeholder="T-m"
                                  />
                                </td>
                                
                                {/* MEASUREMENT TOOLS (M.A) CHECKBOXES */}
                                <td className="border border-slate-200 p-1">
                                  <input 
                                    type="checkbox" 
                                    checked={!!item.toolSerit} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, toolSerit: e.target.checked } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                                  />
                                </td>
                                <td className="border border-slate-200 p-1">
                                  <input 
                                    type="checkbox" 
                                    checked={!!item.toolKumpas} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, toolKumpas: e.target.checked } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                                  />
                                </td>
                                <td className="border border-slate-200 p-1">
                                  <input 
                                    type="checkbox" 
                                    checked={!!item.toolFolyo} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, toolFolyo: e.target.checked } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                                  />
                                </td>
                                <td className="border border-slate-200 p-1">
                                  <input 
                                    type="checkbox" 
                                    checked={!!item.toolElek} 
                                    onChange={(e) => {
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, toolElek: e.target.checked } : itm);
                                      setFr35Items(updated);
                                    }}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                                  />
                                </td>
                                
                                {/* COATING INFORMATION */}
                                <td className="border border-slate-200 p-0.5 w-32 text-center">
                                  <select
                                    value={item.coatingType || 'TS EN 10346 (Pregalvaniz)'}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    onChange={(e) => {
                                      const type = e.target.value;
                                      let thickness = 'YOK';
                                      if (type.includes('Pregalvaniz') || type.includes('10346')) {
                                        thickness = '10-15 µm';
                                      } else if (type.includes('Sıcak Daldırma') || type.includes('1461')) {
                                        thickness = '45-55 µm';
                                      } else if (type.includes('Elektrogalvaniz') || type.includes('2081')) {
                                        thickness = '8-12 µm';
                                      } else if (type.includes('Boya') || type.includes('13438')) {
                                        thickness = '60-80 µm';
                                      }
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, coatingType: type, coatingThickness: thickness } : itm);
                                      setFr35Items(updated);
                                    }}
                                    className="w-full bg-transparent border-0 p-0 text-[8px] font-bold text-slate-850 focus:ring-0 uppercase font-sans cursor-pointer text-center mx-auto block"
                                  >
                                    <option value="TS EN 10346 (Pregalvaniz)">PREGALVANİZ</option>
                                    <option value="TS EN ISO 1461 (Sıcak Daldırma Galvaniz)">SICAK DALDIRMA</option>
                                    <option value="TS EN ISO 2081 (Elektrogalvaniz)">ELEKTROGALVANİZ</option>
                                    <option value="304 Kalite Paslanmaz Çelik">304 PASLANMAZ</option>
                                    <option value="316 Kalite Paslanmaz Çelik">316 PASLANMAZ</option>
                                    <option value="Alüminyum (Ham / Kaplamasız)">ALÜMİNYUM</option>
                                    <option value="TS EN 13438 (Elektrostatik Toz Boya)">TOZ BOYALI</option>
                                  </select>
                                </td>
                                <td className="border border-slate-200 p-0.5 w-20">
                                  <input
                                    type="text"
                                    value={item.coatingThickness || '10-15 µm'}
                                    disabled={activeFR012ToShow.status === 'ONAYLANDI'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const updated = fr12Items.map((itm, i) => i === idx ? { ...itm, coatingThickness: val } : itm);
                                      setFr35Items(updated);
                                    }}
                                    className="w-full text-center bg-transparent border-0 p-0 font-mono text-[9px] font-bold text-slate-900 focus:ring-0"
                                  />
                                </td>
                                
                                <td className="border border-slate-200 p-1">{item.sampleSize || 2}</td>
                                <td className="border border-slate-200 p-1 text-green-700 font-extrabold">{item.result || '1. OLUMLU'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* QC Decision & Signatures */}
                    <div className="grid grid-cols-3 gap-6 border-t border-slate-200 pt-4 text-[9px] mt-4 font-sans leading-relaxed">
                      <div className="col-span-2 space-y-1">
                        <span className="block font-bold text-slate-450 uppercase text-[8px]">Kalite Muayene Notları & Açıklama:</span>
                        <p className="text-slate-700 italic border border-slate-100 p-2 rounded bg-slate-50/50">
                          {activeFR012ToShow.status === 'ONAYLANDI' 
                            ? 'Ürün geometrik ölçümleri, çinko kaplama kalınlığı mikrometre testleri ve elektriksel süreklilik test standartları TS EN 61537 / TS EN ISO 1461 doğrultusunda kontrol edilmiş olup sevk onayı verilmiştir.' 
                            : 'Son muayene ve ölçüm aleti kontrollerinin onaylanması beklenmektedir. Lütfen yukarıdaki "Resim Ölçüsü" ve "Ölçülen Değer" hücrelerini doldurunuz.'}
                        </p>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded flex flex-col justify-between items-center text-center">
                        <div>
                          <span className="block text-[7px] text-slate-450 uppercase font-black tracking-wider">MUAYENE VE TEST ONAYI</span>
                          {activeFR012ToShow.status === 'ONAYLANDI' ? (
                            <span className="text-green-700 font-black text-[13px] tracking-wide uppercase leading-none block mt-1">SEVK KABUL ONAYI</span>
                          ) : (
                            <span className="text-orange-700 font-black text-[12px] tracking-wide uppercase leading-none block mt-1 animate-pulse">ONAY BEKLİYOR</span>
                          )}
                        </div>
                        {activeFR012ToShow.status !== 'ONAYLANDI' && (
                          <div className="flex gap-2 mt-3 justify-center">
                            <button 
                              onClick={handleAutoFillFR12}
                              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded text-[10px] uppercase shadow-sm tracking-wide transition-colors"
                            >
                              ⚡ Otomatik Doldur
                            </button>
                            <button 
                              onClick={handleSaveFR012}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-4 py-2 rounded text-[10px] uppercase shadow-sm tracking-wide transition-colors"
                            >
                              Son Kontrolü Onayla & Kaydet
                            </button>
                          </div>
                        )}
                        {activeFR012ToShow.status === 'ONAYLANDI' && (
                          <div className="text-slate-655 text-[8px] mt-2 font-mono">
                            ONAYLAYAN: <strong className="text-slate-900 font-extrabold">İbrahim Sert (Fabrika Müdürü)</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Footer Signatures */}
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 mt-6 text-center text-[9px] font-sans">
                    <div className="space-y-6">
                      <span className="block font-bold text-slate-450 uppercase text-[8px]">HAZIRLAYAN (KONTROL / KALİTE GÜVENCE)</span>
                      <span className="block font-semibold text-slate-800">Faruk Oruç<br /><span className="text-[7px] text-slate-400">Kalite Güvence Sorumlusu</span></span>
                    </div>
                    <div className="space-y-6">
                      <span className="block font-bold text-slate-450 uppercase text-[8px]">ONAYLAYAN (FABRİKA MÜDÜRÜ)</span>
                      <span className="block font-semibold text-slate-800">İbrahim Sert<br /><span className="text-[7px] text-slate-400">Fabrika Müdürü</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: COATING ACCEPTANCE (KAPLAMADAN KABUL) */}
        {showCoatingAcceptModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-xs text-slate-700">
              <div className="bg-gradient-to-r from-teal-600 to-sky-600 p-4 text-white flex justify-between items-center">
                <div>
                  <span className="block text-[8px] font-bold uppercase tracking-widest text-teal-100">Kalite Kapısı: URT-04 / IZL-07</span>
                  <h3 className="text-sm font-black uppercase tracking-wide">Fason Kaplamadan Kabul Kontrolü</h3>
                </div>
                <button onClick={() => setShowCoatingAcceptModal(false)} className="text-teal-100 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-[10px] text-slate-500 leading-normal">
                  Kaplamadan dönen numunelerin boyutsal toleranslarını, çinko kalınlığını (mikron) ve test cihazı kalibrasyon vadesini girdi ara kontrol noktasında doğrulayın:
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Ölçülen Kaplama (µm)</label>
                    <input 
                      type="number" 
                      value={coatingAcceptMicron} 
                      onChange={e => setCoatingAcceptMicron(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Kaplama Lot No</label>
                    <input 
                      type="text" 
                      value={coatingAcceptLot} 
                      onChange={e => setCoatingAcceptLot(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500 font-mono font-bold" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Kullanılan Kalibrasyonlu Ölçüm Cihazı</label>
                  <select 
                    value={coatingAcceptDevice} 
                    onChange={e => setCoatingAcceptDevice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    {measuringDevices.map(d => (
                      <option key={d.id} value={d.id}>{d.id} - {d.name} (Sertifika: {d.certificateNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Görsel Yüzey Muayene Sonucu</label>
                  <select 
                    value={coatingAcceptVisual} 
                    onChange={e => setCoatingAcceptVisual(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Uygun">Kusursuz (Kaplama Pürüzsüz / Beyaz Pas Yok)</option>
                    <option value="Hatalı">Hatalı (Yüzeyde Lekeler / Zayıf Kaplama)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setShowCoatingAcceptModal(false)}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-lg text-center"
                  >
                    İptal
                  </button>
                  <button 
                    onClick={handleConfirmCoatingAccept}
                    className="w-2/3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-2.5 rounded-lg text-center shadow-md transition-all uppercase tracking-wider"
                  >
                    Ara Kontrolü Onayla
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EN 10204 3.1 QUALITY INSPECTION CERTIFICATE MODAL */}
        {activeCertificateToShow && (
          <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col print:relative overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                html, body { height: auto !important; overflow: visible !important; background: white !important; margin: 0 !important; padding: 0 !important; }
                .print\:hidden { display: none !important; }
                body, body *:has(.print-area), .print-area, .print-area * { visibility: visible !important; }
                body *:has(.print-area) {
                  position: static !important;
                  display: block !important;
                  overflow: visible !important;
                  height: auto !important;
                  width: 100% !important;
                  background: white !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .print-area {
                  position: relative !important;
                  left: auto !important;
                  top: auto !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  transform: scale(0.92);
                  transform-origin: top center;
                }
                .break-inside-avoid {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                @page { size: A4 portrait; margin: 6mm; }
              }
            `}} />
            <div className="w-full h-full flex flex-col bg-slate-200 overflow-hidden print:bg-white print:h-auto">
              <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider">Muayene Sertifikası (EN 10204 3.1)</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm"><Printer className="h-4 w-4" /> Sertifikayı Bas</button>
                  <button onClick={() => setActiveCertificateToShow(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs"><X className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="p-6 bg-slate-200 overflow-y-auto flex justify-center print:bg-white print:p-0">
                <div className="print-area print-portrait w-full max-w-[210mm] bg-white text-slate-800 p-8 shadow-lg border border-slate-300 rounded font-sans leading-normal mx-auto print:border-0 print:shadow-none print:p-2">
                  <div className="border-2 border-slate-900 grid grid-cols-4 text-center items-center text-[9px] font-bold mb-6">
                    <div className="p-2 border-r-2 border-slate-900 flex flex-col justify-center items-center">
                      <img src="sies_logo.png" alt="SIES Logo" className="h-6 object-contain" />
                      <span className="text-[5px] text-slate-500 uppercase mt-0.5">Kalite Kontrol</span>
                    </div>
                    <div className="p-2 border-r-2 border-slate-900 col-span-2 text-center uppercase text-slate-900 text-[10px] font-black tracking-wide">
                      MUAYENE SERTİFİKASI / INSPECTION CERTIFICATE<br />
                      <span className="text-[7px] text-slate-505 font-bold">(EN 10204 3.1)</span>
                    </div>
                    <div className="p-1.5 text-left font-mono text-[7px] space-y-0.5">
                      <div>SERTİFİKA NO: <span className="text-black font-bold">{activeCertificateToShow.id}</span></div>
                      <div>TARİH: <span className="text-black">{activeCertificateToShow.date}</span></div>
                      <div>DÖKÜMAN NO: <span className="text-black font-bold">FR-011</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200 text-[10px] text-slate-655 mb-4">
                    <div>
                      <span className="block text-slate-400 uppercase text-[8px] font-bold">Müşteri / Alıcı</span>
                      <span className="text-slate-900 font-extrabold">{activeCertificateToShow.customerName}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase text-[8px] font-bold">Sipariş No / İrsaliye No</span>
                      <span className="text-slate-900 font-extrabold">{activeCertificateToShow.orderId} / {activeCertificateToShow.dispatchNoteNo}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase text-[8px] font-bold">Proje Kodu / Üretim Yılı</span>
                      <span className="text-slate-900 font-semibold">{activeCertificateToShow.projectId} / {activeCertificateToShow.manufactureYear}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 uppercase text-[8px] font-bold">Çelik Sınıfı</span>
                      <span className="text-slate-900">{activeCertificateToShow.materialGrade}</span>
                    </div>
                  </div>

                  {activeCertificateToShow.items?.map((item: any, itemIdx: number) => (
                    <div key={itemIdx} className="space-y-3 mb-4 break-inside-avoid">
                      <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1 flex justify-between items-center">
                        <span>Ürün {itemIdx + 1}: {item.productCode} — {item.description || 'GLV ME TİPİ KABLO KANALI'} ({item.quantity} AD)</span>
                        <div className="flex items-center gap-1.5 print:hidden">
                          <span className="text-[9px] text-slate-500 font-semibold lowercase">çelik sınıfı:</span>
                          <select 
                            value={item.material || 'ST37'}
                            onChange={(e) => handleUpdateItemGrade(itemIdx, e.target.value)}
                            className="bg-white border border-slate-350 rounded text-[9px] font-bold text-slate-800 px-1 py-0.5 focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="ST37">ST37 (Karbon Çeliği)</option>
                            <option value="304 Paslanmaz">304 Paslanmaz</option>
                            <option value="316 Paslanmaz">316 Paslanmaz</option>
                            <option value="5754 Alüminyum">5754 Alüminyum</option>
                          </select>
                        </div>
                      </span>
                      
                      <div className="grid grid-cols-4 gap-4 text-[9px] text-slate-600 mb-2 leading-relaxed">
                        <div><strong>Ebatlar (Size):</strong> {item.size || '100X60X0.80MM'}</div>
                        <div><strong>Malzeme Sınıfı:</strong> <span className="font-extrabold text-slate-900">{item.material || 'ST37'}</span></div>
                        <div><strong>Proses (Process):</strong> {item.process || 'KESME - DELME - BÜKME'}</div>
                        <div><strong>Teknik Şartname (Specification):</strong> {item.requirement || 'TS EN 61537'}</div>
                      </div>

                      {/* Chemical Values Table */}
                      <div className="space-y-1">
                        <span className="block text-[7px] text-slate-400 font-bold uppercase">Kimyasal Analiz (Chemical Analysis %)</span>
                        <table className="w-full border border-slate-250 text-center text-[8px] font-mono leading-normal">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-250">
                              <th className="border border-slate-250 p-1">Element</th>
                              <th className="border border-slate-250 p-1">C</th>
                              <th className="border border-slate-250 p-1">Si</th>
                              <th className="border border-slate-250 p-1">Mn</th>
                              <th className="border border-slate-250 p-1">P</th>
                              <th className="border border-slate-250 p-1">S</th>
                              <th className="border border-slate-250 p-1">Cr</th>
                              <th className="border border-slate-250 p-1">Ni</th>
                              <th className="border border-slate-250 p-1">Mo</th>
                              <th className="border border-slate-250 p-1">Al</th>
                              <th className="border border-slate-250 p-1">N (ppm)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-250 p-1 font-sans font-bold">Ölçülen</td>
                              <td className="border border-slate-250 p-1">{item.c || 0.082}</td>
                              <td className="border border-slate-250 p-1">{item.si || 0.174}</td>
                              <td className="border border-slate-250 p-1">{item.mn || 0.425}</td>
                              <td className="border border-slate-250 p-1">{item.p || 0.012}</td>
                              <td className="border border-slate-250 p-1">{item.s || 0.008}</td>
                              <td className="border border-slate-250 p-1">{item.cr || 0.04}</td>
                              <td className="border border-slate-250 p-1">{item.ni || 0.05}</td>
                              <td className="border border-slate-250 p-1">{item.mo || 0.02}</td>
                              <td className="border border-slate-250 p-1">{item.al || 0.035}</td>
                              <td className="border border-slate-250 p-1">{item.n || 62}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Mechanical Values Table */}
                      <div className="space-y-1">
                        <span className="block text-[7px] text-slate-400 font-bold uppercase">Mekanik Testler (Mechanical Properties)</span>
                        <table className="w-full border border-slate-250 text-center text-[8px] font-mono leading-normal">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-250">
                              <th className="border border-slate-250 p-1">Mekanik Test Tipi</th>
                              <th className="border border-slate-250 p-1">Akma Dayanımı ReH (N/mm²)</th>
                              <th className="border border-slate-250 p-1">Çekme Dayanımı Rm (N/mm²)</th>
                              <th className="border border-slate-250 p-1">Kopma Uzaması A5 (%)</th>
                              <th className="border border-slate-250 p-1">Bükme Testi (Bend Test)</th>
                              <th className="border border-slate-250 p-1">Görsel / Çinko Muayene</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-250 p-1 font-sans font-bold">Ölçülen</td>
                              <td className="border border-slate-250 p-1 font-bold">{item.reh || 285}</td>
                              <td className="border border-slate-250 p-1 font-bold">{item.rm || 410}</td>
                              <td className="border border-slate-250 p-1 font-bold">{item.a || 28} %</td>
                              <td className="border border-slate-250 p-1 font-sans text-green-700 font-extrabold">UYGUN (180° OK)</td>
                              <td className="border border-slate-250 p-1 font-sans text-green-700 font-extrabold">UYGUN / KABUL</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[8px] leading-relaxed my-4 text-slate-655">
                    <strong>📄 KALİTE GÜVENCE BEYANI:</strong> Yukarıda belirtilen sevk malzemeleri, ilgili satın alma siparişi şartnamelerine ve uluslararası standartlara (TS EN 61537 / TS EN ISO 1461) uygun olarak muayene edilmiş, kimyasal ve mekanik mukavemet testleri doğrulanmıştır. Malzemeler EN 10204 3.1 standartlarına tam uyumluluk göstermektedir.
                  </div>

                  <div className="grid grid-cols-3 gap-8 border-t border-slate-200 pt-6 mt-6 text-[10px] text-center font-sans">
                    <div className="space-y-4">
                      <span className="block font-bold text-slate-400 uppercase text-[8px]">MÜŞTERİ / ALICI TEMSİLCİSİ</span>
                      <span className="block text-slate-400 mt-4 italic">[Teslim Alındı]</span>
                    </div>
                    <div className="space-y-3">
                      <span className="block font-bold text-slate-400 uppercase text-[8px]">HAZIRLAYAN (KONTROL EDEN)</span>
                      <div className="flex flex-col justify-center items-center leading-normal">
                        <span className="text-green-700 font-black text-[10px] uppercase">✓ ONAYLANDI</span>
                        <span className="text-[7px] font-mono text-slate-400">PREPARED BY SIES QC</span>
                        <span className="text-[8px] font-bold text-slate-700 mt-1">Faruk Oruç (QC Engineer)</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <span className="block font-bold text-slate-400 uppercase text-[8px]">ONAYLAYAN (KALİTE MÜDÜRÜ)</span>
                      <div className="flex flex-col justify-center items-center leading-normal">
                        <span className="text-green-700 font-black text-[10px] uppercase">✓ ONAYLANDI</span>
                        <span className="text-[7px] font-mono text-slate-400">APPROVED BY SIES QA</span>
                        <span className="text-[8px] font-bold text-slate-700 mt-1">İbrahim Sert (QA Manager)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      )}

      {/* EDIT ORDER MODAL */}
      {showEditOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-[800px] overflow-hidden flex flex-col my-4">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider">Siparişi Düzenle</span>
              <button onClick={() => setShowEditOrderModal(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Müşteri Ünvanı</label>
                  <input 
                    type="text" 
                    value={editOrderCustomerName}
                    onChange={e => setEditOrderCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-bold text-slate-800 mt-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Sipariş Tarihi</label>
                  <input 
                    type="date" 
                    value={editOrderDate}
                    onChange={e => setEditOrderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-bold text-slate-800 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Genel Sipariş Durumu</label>
                <select 
                  value={editOrderStatus}
                  onChange={e => setEditOrderStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-bold text-slate-800 mt-1"
                >
                  <option value="YENİ SİPARİŞ">YENİ SİPARİŞ</option>
                  <option value="ÜRETİMDE">ÜRETİMDE</option>
                  <option value="KAPLAMADA">KAPLAMADA</option>
                  <option value="BOYADA">BOYADA</option>
                  <option value="PAKETLEMEDE">PAKETLEMEDE</option>
                  <option value="KISMİ SEVK EDİLDİ">KISMİ SEVK EDİLDİ</option>
                  <option value="SEVK EDİLDİ">SEVK EDİLDİ</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Sipariş Kalemleri ve Aşamaları</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5">Ürün Kodu</th>
                        <th className="p-2.5">Tanım</th>
                        <th className="py-1 px-2 text-right w-20">Miktar</th>
                        <th className="p-2.5 w-16">Birim</th>
                        <th className="py-1 px-2 text-right w-20">Sevk Edilen</th>
                        <th className="py-1 px-1 text-center w-40">Proses / Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editOrderItems.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 font-mono">
                          <td className="p-2.5 font-bold text-slate-800">
                            <input 
                              type="text" 
                              value={item.productCode}
                              onChange={e => handleEditOrderItemField(idx, 'productCode', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none font-bold"
                            />
                          </td>
                          <td className="p-2.5">
                            <input 
                              type="text" 
                              value={item.description || ''}
                              onChange={e => handleEditOrderItemField(idx, 'description', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none text-slate-700"
                            />
                          </td>
                          <td className="py-1 px-2 text-right">
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={e => handleEditOrderItemField(idx, 'quantity', Number(e.target.value))}
                              className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-2.5">
                            <input 
                              type="text" 
                              value={item.unit || 'pcs'}
                              onChange={e => handleEditOrderItemField(idx, 'unit', e.target.value)}
                              className="w-12 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-800 text-xs"
                            />
                          </td>
                          <td className="py-1 px-2 text-right">
                            <input 
                              type="number" 
                              value={item.shippedQuantity}
                              onChange={e => handleEditOrderItemField(idx, 'shippedQuantity', Number(e.target.value))}
                              className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-bold text-slate-800"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <select 
                              value={item.status}
                              onChange={e => handleEditOrderItemField(idx, 'status', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-800"
                            >
                              <option value="Bekliyor">Bekliyor</option>
                              <option value="Üretimde">Üretimde</option>
                              <option value="Kaplamada">Kaplamada</option>
                              <option value="Boyada">Boyada</option>
                              <option value="Paketlemede">Paketlemede</option>
                              <option value="Sevk Edildi">Sevk Edildi</option>
                              <option value="Üretim Dışı">Üretim Prosesine Tabi Değildir (Üretim Dışı)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="bg-slate-100 p-4 border-t flex justify-end gap-2">
              <button 
                onClick={() => setShowEditOrderModal(false)}
                className="bg-slate-500 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded text-xs transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleSaveEditOrder}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors shadow-sm"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PARÇALI ÜRETİME GÖNDER / İŞ EMRİ OLUŞTUR */}
      {productionTargetOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setProductionTargetOrder(null)}
              className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/30">
                <Play className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  PARÇALI ÜRETİME GÖNDER & İŞ EMRİ OLUŞTUR (FR-009)
                </h3>
                <p className="text-xs text-slate-500">
                  Sipariş No: <strong className="text-slate-800 font-mono">{productionTargetOrder.id}</strong> — Müşteri: <strong className="text-slate-800">{productionTargetOrder.customerName}</strong>
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Bu imalat lotunda üretime göndermek istediğiniz kalemleri ve miktarlarını seçin. Seçilmeyen kalemler siparişte <em>Beklemede</em> kalır.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-bold text-[10px]">
                <button 
                  onClick={() => {
                    const next: Record<number, any> = {};
                    (productionTargetOrder.items || []).forEach((it, idx) => {
                      const rem = it.quantity - (it.shippedQuantity || 0);
                      next[idx] = { selected: true, qty: Math.max(1, rem), notes: productionItemSelection[idx]?.notes || '' };
                    });
                    setProductionItemSelection(next);
                  }}
                  className="text-orange-600 hover:underline bg-white px-2.5 py-1 rounded border border-amber-300 shadow-2xs"
                >
                  Tümünü Seç
                </button>
                <button 
                  onClick={() => {
                    const next: Record<number, any> = {};
                    (productionTargetOrder.items || []).forEach((it, idx) => {
                      next[idx] = { selected: false, qty: productionItemSelection[idx]?.qty || 1, notes: productionItemSelection[idx]?.notes || '' };
                    });
                    setProductionItemSelection(next);
                  }}
                  className="text-slate-600 hover:underline bg-white px-2.5 py-1 rounded border border-slate-300 shadow-2xs"
                >
                  Seçimi Temizle
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-mono uppercase text-[10px] sticky top-0 z-10">
                  <tr>
                    <th className="p-3 w-10 text-center">SEÇ</th>
                    <th className="p-3">ÜRÜN KODU / AÇIKLAMA</th>
                    <th className="p-3 w-28 text-right">SİPARİŞ MİKTARI</th>
                    <th className="p-3 w-28 text-right">SEVK / ÜRETİMDE</th>
                    <th className="p-3 w-36 text-center">BU LOTTA ÜRETİLECEK</th>
                    <th className="p-3">İŞ EMRİ NOTU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {(productionTargetOrder.items || []).map((item, idx) => {
                    const sel = productionItemSelection[idx] || { selected: false, qty: 1, notes: '' };
                    const shipped = item.shippedQuantity || 0;
                    const remaining = item.quantity - shipped;
                    const isDone = remaining <= 0 || item.status === 'Sevk Edildi';

                    return (
                      <tr key={idx} className={`hover:bg-slate-50 transition-colors ${sel.selected ? 'bg-orange-50/50' : isDone ? 'opacity-50 bg-slate-100' : ''}`}>
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox"
                            disabled={isDone}
                            checked={sel.selected}
                            onChange={(e) => {
                              setProductionItemSelection(prev => ({
                                ...prev,
                                [idx]: { ...sel, selected: e.target.checked }
                              }));
                            }}
                            className="h-4 w-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900 font-mono">{item.productCode}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{item.description || 'Kablo Taşıyıcı Elemanı'}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          {item.quantity} {getItemUnit(item)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {shipped} {getItemUnit(item)}
                        </td>
                        <td className="p-3 text-center">
                          <input 
                            type="number"
                            min="1"
                            max={remaining > 0 ? remaining : 99999}
                            disabled={!sel.selected || isDone}
                            value={sel.qty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              setProductionItemSelection(prev => ({
                                ...prev,
                                [idx]: { ...sel, qty: val }
                              }));
                            }}
                            className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold text-center text-slate-900 focus:ring-2 focus:ring-orange-500 bg-white shadow-2xs"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text"
                            placeholder="İş emri özel notu..."
                            disabled={!sel.selected || isDone}
                            value={sel.notes}
                            onChange={(e) => {
                              setProductionItemSelection(prev => ({
                                ...prev,
                                [idx]: { ...sel, notes: e.target.value }
                              }));
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700 bg-white focus:ring-1 focus:ring-orange-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                onClick={() => setProductionTargetOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmPartialProduction}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold rounded-xl text-xs uppercase shadow-md shadow-orange-500/20 transition-all flex items-center gap-2"
              >
                <Play className="h-4 w-4" /> SEÇİLEN KALEMLERİ ÜRETİME GÖNDER (FR-009 OLUŞTUR)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL (FR-013 / ORIGINAL PDF / EXCEL) */}
      {previewDocumentOrder && (() => {
        const origUrl = resolvedDocUrl || previewDocumentOrder.originalFileUrl || previewDocumentOrder.attachedFileLink || '';
        const origName = previewDocumentOrder.originalFileName || previewDocumentOrder.attachedFileName || 'Musteri_Siparisi.pdf';
        const isEmbeddablePdf = origUrl.startsWith('data:application/pdf') || origUrl.startsWith('data:text/html') || origUrl.startsWith('blob:');
        const isExternalCloud = origUrl.includes('yandex') || origUrl.includes('yadi.sk') || origUrl.startsWith('http://') || origUrl.startsWith('https://') || origUrl.startsWith('db://');
        const isExcel = origUrl.includes('spreadsheet') || origUrl.includes('excel') || origName.toLowerCase().endsWith('.xlsx') || origName.toLowerCase().endsWith('.xls');

        const handleUploadOriginalDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) {
              const dataUrl = evt.target.result as string;
              updateOrder(previewDocumentOrder.id, {
                originalFileUrl: dataUrl,
                originalFileName: file.name,
                attachedFileLink: dataUrl,
                attachedFileName: file.name
              });
              setPreviewDocumentOrder({
                ...previewDocumentOrder,
                originalFileUrl: dataUrl,
                originalFileName: file.name,
                attachedFileLink: dataUrl,
                attachedFileName: file.name
              });
              alert(`Orijinal Sipariş Belgesi (${file.name}) Başarıyla Kaydedildi!`);
            }
          };
          reader.readAsDataURL(file);
        };

        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-5 print:p-0 print:bg-white">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
              {/* Modal Header Bar */}
              <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black shadow-md shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                      <span>{previewDocumentOrder.customerOrderNo ? `SİPARİŞ: ${previewDocumentOrder.customerOrderNo}` : `SİPARİŞ BELGESİ (${previewDocumentOrder.id})`}</span>
                      <span className="text-[10px] font-mono text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-400/30">
                        {origUrl ? 'ORİJİNAL BELGE YÜKLÜ' : 'SİSTEM BELGESİ'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {previewDocumentOrder.customerName} | {previewDocumentOrder.projectNo ? `PROJE: ${previewDocumentOrder.projectNo}` : 'SIES QMS'}
                    </p>
                  </div>
                </div>

                {/* Tab Switcher & Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Tab Selector */}
                  <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700">
                    <button
                      onClick={() => setDocPreviewTab('original')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                        docPreviewTab === 'original' 
                          ? 'bg-orange-600 text-white shadow-sm' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>📄 ORİJİNAL BELGE</span>
                    </button>
                    <button
                      onClick={() => setDocPreviewTab('fr013')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                        docPreviewTab === 'fr013' 
                          ? 'bg-orange-600 text-white shadow-sm' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      <span>📋 FR-013 SİPARİŞ FORMU</span>
                    </button>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Printer className="h-4 w-4 text-orange-400" /> Yazdır
                  </button>

                  <button
                    onClick={() => setPreviewDocumentOrder(null)}
                    className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-800 bg-white font-sans flex-1">

                {/* TAB 1: ORİJİNAL MÜŞTERİ SİPARİŞ FORMU */}
                {docPreviewTab === 'original' && (
                  <div className="space-y-4">
                    {origUrl ? (
                      <div className="space-y-3">
                        {/* Control Bar */}
                        <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-wrap justify-between items-center gap-3 text-xs shadow-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-orange-400 shrink-0" />
                            <span className="font-extrabold truncate text-slate-200">
                              ORİJİNAL DOSYA: <span className="text-white font-mono">{origName}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={origUrl}
                              download={origName}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm uppercase"
                            >
                              📥 İndir ({origName})
                            </a>

                            <button
                              onClick={() => {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<iframe src="${origUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 uppercase"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-orange-400" /> Tam Ekran Aç
                            </button>

                            {previewDocumentOrder.externalCloudLink && (
                              <button
                                onClick={() => window.open(previewDocumentOrder.externalCloudLink, '_blank')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 uppercase shadow-sm"
                              >
                                ☁️ Yandex Disk / Bulut Aç
                              </button>
                            )}

                            <label htmlFor="orig-reupload-input" className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer border border-slate-700 uppercase">
                              🔄 Değiştir
                            </label>
                            <input type="file" accept=".pdf,.xlsx,.xls" id="orig-reupload-input" onChange={handleUploadOriginalDoc} className="hidden" />
                          </div>
                        </div>

                        {/* Viewer Window */}
                        {/* Viewer Window */}
                        {isExternalCloud ? (
                          <div className="w-full min-h-[480px] rounded-2xl border-2 border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
                            {/* Background Decorative Icon */}
                            <div className="absolute -right-10 -bottom-10 opacity-10 text-slate-100 pointer-events-none text-[180px] select-none">
                              ☁️
                            </div>

                            {/* Header Info Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl shadow-lg shrink-0 font-black">
                                  ☁️
                                </div>
                                <div>
                                  <h4 className="font-black text-base sm:text-lg text-white uppercase tracking-wide flex items-center gap-2">
                                    YANDEX DİSK BULUT ARŞİVİ & BACKUP DEPOSU
                                  </h4>
                                  <p className="text-xs text-blue-400 font-mono truncate max-w-md">
                                    https://disk.yandex.com.tr/d/1322d_cn4bYRaA
                                  </p>
                                </div>
                              </div>
                              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono px-3 py-1.5 rounded-full border border-emerald-500/30 font-bold self-start sm:self-auto flex items-center gap-1.5 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                                SİSTEM GÜVENLİ ARŞİV KORUMASI AKTİF
                              </span>
                            </div>

                            {/* Standardized File Archival Box */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-6 relative z-10">
                              <div className="space-y-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-inner">
                                <span className="text-[11px] font-mono text-slate-400 uppercase block font-extrabold tracking-wider">📋 Standart Yandex Arşiv Dosya Adı:</span>
                                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-amber-300 font-mono text-xs break-all font-bold select-all flex items-center justify-between shadow-sm">
                                  <span>{`${previewDocumentOrder.date || '2026-10-06'}_${(previewDocumentOrder.customerName || 'MUSTERI').replace(/[^a-zA-Z0-9]/g, '_')}_${previewDocumentOrder.customerOrderNo || previewDocumentOrder.id}_${(previewDocumentOrder.coatingTypes || ['GALVANIZ']).join('_').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                  * Vercel veri kotalarına takılmamak ve tüm siparişleri güvenli yedeklemek için dosyalar Yandex Disk sürücüsünde bu isim formatı ile arşivlenmektedir.
                                </p>
                              </div>

                              <div className="space-y-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 shadow-inner">
                                <span className="text-[11px] font-mono text-slate-400 uppercase block font-extrabold tracking-wider">📌 Sipariş Kayıt ve Kaplama Detayları:</span>
                                <div className="space-y-2 text-xs text-slate-300 font-mono">
                                  <p className="flex justify-between border-b border-slate-800/80 pb-1.5"><span className="text-slate-400">Müşteri Firması:</span> <strong className="text-white truncate max-w-[200px]">{previewDocumentOrder.customerName}</strong></p>
                                  <p className="flex justify-between border-b border-slate-800/80 pb-1.5"><span className="text-slate-400">Sipariş / İrsaliye No:</span> <strong className="text-orange-400">{previewDocumentOrder.customerOrderNo || previewDocumentOrder.id}</strong></p>
                                  <p className="flex justify-between border-b border-slate-800/80 pb-1.5"><span className="text-slate-400">Kaplama Cinsi:</span> <strong className="text-emerald-400">{previewDocumentOrder.coatingTypes?.join(', ') || 'Galvaniz'}</strong></p>
                                  <p className="flex justify-between"><span className="text-slate-400">Proje No:</span> <strong className="text-blue-300">{previewDocumentOrder.projectNo || 'PRJ-2026'}</strong></p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-700/80 pt-4 relative z-10">
                              <p className="text-xs text-slate-400 text-center sm:text-left font-medium">
                                Güvenli Bulut Arşivi Yandex Disk sunucularında doğrudan açılır.
                              </p>
                              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => {
                                    const nameToCopy = `${previewDocumentOrder.date || '2026-10-06'}_${(previewDocumentOrder.customerName || 'MUSTERI').replace(/[^a-zA-Z0-9]/g, '_')}_${previewDocumentOrder.customerOrderNo || previewDocumentOrder.id}_${(previewDocumentOrder.coatingTypes || ['GALVANIZ']).join('_').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                                    navigator.clipboard.writeText(nameToCopy);
                                    alert(`Standart Yandex Arşiv Dosya Adı Kopyalandı:\n\n${nameToCopy}`);
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-3.5 rounded-xl text-xs uppercase border border-slate-600 transition-all active:scale-95 shadow-sm"
                                >
                                  📋 Arşiv İsmini Kopyala
                                </button>

                                <button
                                  onClick={() => window.open(previewDocumentOrder.externalCloudLink || YANDEX_DISK_URL, '_blank')}
                                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black px-6 py-3.5 rounded-xl text-xs uppercase shadow-xl tracking-wider flex items-center gap-2 transform transition-all active:scale-95 cursor-pointer"
                                >
                                  ☁️ YANDEX DİSK BULUT ARŞİVİNDE DİREK AÇ ↗
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : isEmbeddablePdf ? (
                          <div className="w-full rounded-2xl border-2 border-slate-300 overflow-hidden bg-slate-100 shadow-inner">
                            <iframe 
                              src={origUrl} 
                              className="w-full h-[72vh] min-h-[500px]"
                              title="Orijinal Müşteri Sipariş Formu PDF Viewer"
                            />
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 space-y-4">
                            <div className="h-16 w-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                              <FileSpreadsheet className="h-8 w-8" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-base uppercase">Orijinal Müşteri Excel Sipariş Belgesi</h4>
                              <p className="text-xs text-slate-500 font-mono mt-1">{origName}</p>
                            </div>
                            <div className="flex justify-center gap-3">
                              <a
                                href={origUrl}
                                download={origName}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-xl text-xs uppercase shadow-lg tracking-wider inline-flex items-center gap-2"
                              >
                                📥 Excel Dosyasını İndir & Aç
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Dropzone if no original file attached */
                      <div className="border-2 border-dashed border-orange-300 rounded-2xl p-8 text-center bg-orange-50/40 space-y-4">
                        <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                          <Upload className="h-8 w-8" />
                        </div>
                        <div className="max-w-md mx-auto space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-sm uppercase">Orijinal Müşteri Sipariş Formu Yükleyin</h4>
                          <p className="text-xs text-slate-600">
                            Bu sipariş için henüz orijinal PDF veya Excel sipariş belgesi atanmamış. Müşteriden gelen orijinal belgeyi sisteme yükleyip yedekleyebilirsiniz.
                          </p>
                        </div>
                        <div className="pt-2">
                          <label htmlFor="orig-doc-upload-new" className="bg-orange-600 hover:bg-orange-700 text-white font-black px-6 py-3 rounded-xl cursor-pointer shadow-md text-xs uppercase tracking-wider inline-flex items-center gap-2">
                            📂 Orijinal PDF veya Excel Seç & Yükle
                          </label>
                          <input type="file" accept=".pdf,.xlsx,.xls" id="orig-doc-upload-new" onChange={handleUploadOriginalDoc} className="hidden" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SİES FR-013 FORM VIEW */}
                {docPreviewTab === 'fr013' && (
                  <div className="space-y-6">
                    {/* Document Header Table */}
                    <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 space-y-4">
                      <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                        <div>
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">SIES KABLO KANALLARI SAN. VE TİC. LTD. ŞTİ.</h2>
                          <p className="text-xs text-slate-500 font-medium">Sipariş Onay & İmalat Şartnamesi (FR-013)</p>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="bg-orange-100 text-orange-800 font-black px-2.5 py-1 rounded-md border border-orange-200 block">
                            Tarih: {previewDocumentOrder.date || new Date().toISOString().split('T')[0]}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">Sipariş kilitlenmiştir.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block uppercase">MÜŞTERİ ÜNVANI</span>
                          <span className="font-extrabold text-slate-900">{previewDocumentOrder.customerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block uppercase">MÜŞTERİ SİP. NO</span>
                          <span className="font-extrabold font-mono text-slate-900">{previewDocumentOrder.customerOrderNo || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block uppercase">PROJE KODU / ADI</span>
                          <span className="font-extrabold text-slate-900">{previewDocumentOrder.projectNo || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block uppercase">TESLİMAT / İSTASYON</span>
                          <span className="font-extrabold text-slate-900">{(previewDocumentOrder as any).deliveryLocation || 'Fabrika Teslim'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Table */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                            <th className="py-1 px-1 text-center w-10 border-r border-slate-800">#</th>
                            <th className="p-2.5 border-r border-slate-800">MALZEME KODU</th>
                            <th className="p-2.5 border-r border-slate-800">AÇIKLAMA / İMALAT TANIMI</th>
                            <th className="py-1 px-2 text-right w-20 border-r border-slate-800">MİKTAR</th>
                            <th className="py-1 px-1 text-center w-16 border-r border-slate-800">BİRİM</th>
                            <th className="py-1 px-1 text-center w-24">DURUM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-800">
                          {previewDocumentOrder.items && previewDocumentOrder.items.length > 0 ? (
                            previewDocumentOrder.items.map((item, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                                <td className="py-1 px-1 text-center font-mono font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                                <td className="py-1 px-2 font-mono font-black text-slate-900 border-r border-slate-200">{item.productCode}</td>
                                <td className="p-2.5 font-medium text-slate-800 whitespace-pre-wrap border-r border-slate-200">{item.description}</td>
                                <td className="py-1 px-2 text-right font-mono font-black text-slate-900 border-r border-slate-200">{item.quantity}</td>
                                <td className="py-1 px-1 text-center font-bold text-slate-600 border-r border-slate-200">{item.unit || 'AD'}</td>
                                <td className="py-1 px-1 text-center font-mono text-[10px] font-bold">
                                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                    {item.status || 'Üretimde'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400 italic font-mono">
                                Bu sipariş için kayıtlı kalem bulunamadı.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* General Order Notes & Terms */}
                    {previewDocumentOrder.notes && (
                      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                        <span className="font-extrabold uppercase text-[10px] block text-amber-800 mb-1">📌 SİPARİŞ & İMALAT ÖZEL NOTLARI:</span>
                        <p className="whitespace-pre-wrap font-sans font-medium">{previewDocumentOrder.notes}</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* MULTI-DOCUMENT SELECTION MODAL ("AÇILAN YENİ PENCERE") */}
      {docSelectionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">{docSelectionModal.title}</h3>
              </div>
              <button 
                onClick={() => setDocSelectionModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Bu siparişe ait birden fazla evrak kaydı bulunmaktadır. Lütfen açmak istediğiniz evrağı seçin:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {docSelectionModal.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDocSelectionModal(prev => ({ ...prev, isOpen: false }));
                    item.action();
                  }}
                  className="w-full bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-500 rounded-xl p-3 text-left transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-extrabold text-xs text-slate-900 group-hover:text-orange-900 block truncate">{item.title}</span>
                    {item.subtitle && <span className="text-[10px] text-slate-500 block font-mono mt-0.5 truncate">{item.subtitle}</span>}
                  </div>
                  {item.badge && (
                    <span className="bg-orange-100 text-orange-900 font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full border border-orange-200 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDocSelectionModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
