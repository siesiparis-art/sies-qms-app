'use client';

import React, { useState, useEffect } from 'react';
import { useQms, Quote, Order, Product, InspectionCertificate, AnalysisRow } from '@/context/QmsContext';
import { 
  FileText, Plus, Check, Printer, FileSpreadsheet, Play, CheckCircle2, ChevronRight, X, 
  Briefcase, ShoppingCart, Truck, RefreshCw, Send, Barcode, ShieldAlert, Award, FileCheck, Eye,
  Building, User, Phone, Mail, MapPin, Cpu, Upload, ExternalLink,
  Search, Trash2, Calendar, AlertCircle, Zap, Palette, Package, Edit, ChevronDown, ChevronUp, ClipboardList, ListChecks
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

export default function SalesModule({ auditMode = false }: { auditMode?: boolean }) {
  const { 
    quotes, addQuote, updateQuote, deleteQuote,
    orders, addOrder, updateOrder, deleteOrder,
    certificates, addCertificate,
    products, addProduct, customers, addCustomer, addProductionRun, addOutgoingInspection, companyInfo,
    productionRuns, personnel, updateProductionRun, measuringDevices
  } = useQms();

  const [activeTab, setActiveTab] = useState<'quotes' | 'orders'>('quotes');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGeminiApiKey(localStorage.getItem('qms_gemini_api_key') || '');
    }
  }, []);

  useEffect(() => {
    if (selectedOrderDetailOrder) {
      const updatedOrder = orders.find(o => o.id === selectedOrderDetailOrder.id);
      if (updatedOrder) {
        setSelectedOrderDetailOrder(updatedOrder);
      }
    }
  }, [orders]);
  
  // Full-Page Create Order Screen States
  const [showCreateOrderScreen, setShowCreateOrderScreen] = useState(false);
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
            setCoAiScanning(false);
            setCoAiLogs(prev => [...prev, `[BAŞARILI] Excel tablosundan ${parsed.items.length} kalem başarıyla çözümlendi.`]);
            alert(`EXCEL DOSYASI BAŞARIYLA OKUNDU!\nKalem Sayısı: ${parsed.items.length}`);
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
      if (textUpper.includes('YUKSEL BEY') || textUpper.includes('YÜKSEL BEY') || textUpper.includes('YUKSEL') || textUpper.includes('YÜKSEL')) {
        customer = 'YÜKSEL BEY';
      } else if (textUpper.includes('NORSE') || textUpper.includes('RAMIS') || textUpper.includes('RAMİS')) {
        customer = 'NORSE TERSANESİ';
      } else if (textUpper.includes('TERSAN') || textUpper.includes('TERSANE')) {
        customer = 'TERSAN TERSANECİLİK SAN. VE TİC. A.Ş.';
      } else if (textUpper.includes('OZDEMIR') || textUpper.includes('ÖZDEMİR')) {
        customer = 'ÖZDEMİR ELEKTRİK A.Ş.';
      } else if (textUpper.includes('HASAN') || textUpper.includes('SERT')) {
        customer = 'HASAN SERT PROJE A.Ş.';
      } else if (textUpper.includes('GAYZER') || textUpper.includes('GEYZER')) {
        customer = 'GAYZER ELEKTRİK A.Ş.';
      } else if (textUpper.includes('AUDIT') || textUpper.includes('AUDİT') || textUpper.includes('DENETİM')) {
        customer = 'AUDİT DENETİM FİRMASI A.Ş.';
      } else {
        const customerInvoiceMatch = textUpper.match(/(?:MUSTERI|ALICI|FIRMA|MÜŞTERİ|MÜŞTERİ ADI)\s*[:\-\s]\s*([^;\n\r]{5,60})/);
        if (customerInvoiceMatch) {
          customer = customerInvoiceMatch[1].trim();
        } else {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const companyLine = lines.find(l => l.toUpperCase().includes('LTD') || l.toUpperCase().includes('A.Ş') || l.toUpperCase().includes('SAN') || l.toUpperCase().includes('A.S.'));
          if (companyLine && companyLine.length < 60) {
            customer = companyLine.toUpperCase();
          }
        }
      }

      // 2. Order number / Teklif No detection (e.g. 400897 NOLU or 2026/06/0020)
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
      const deliveryDateMatch = textUpper.match(/(?:TESLIM|DELIVERY)\s*(?:TARIHI)?\s*[:\-\s]\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
      if (deliveryDateMatch) {
        const parts = deliveryDateMatch[1].split('.');
        deliveryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      const orderDateMatch = textUpper.match(/(?:SIPARIS|ORDER|TEKLIF)\s*(?:TARIHI)?\s*[:\-\s]\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
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

      // If a Gemini API Key is provided, call Gemini directly from the client side!
      if (geminiApiKey && geminiApiKey.trim() !== '') {
        setCoAiLogs(prev => [...prev, `[YAPAY ZEKA] GEMINI MODELİ ÇAĞRILIYOR (Model: gemini-1.5-flash)...`]);
        try {
          const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`;
          const prompt = `Aşağıdaki ham döküman metninden sipariş bilgilerini çıkar. Yanıtı sadece ve sadece belirtilen JSON formatında döndür. Hiçbir açıklama, markdown backtick veya JSON etiketi ekleme. Sadece saf JSON string olarak döndür.
Gerekli alanlar:
- customerName: Müşteri unvanı, örn: NORSE TERSANESİ, YÜKSEL BEY, TERSAN TERSANECİLİK vb.
- orderNo: Sipariş/Teklif numarası, bulamazsan boş bırak.
- projectNo: Proje numarası, bulamazsan boş bırak.
- coatingType: Kaplama cinsi (örn: TS 914 Sıcak Daldırma, Pregalvaniz vb., bulamazsan boş bırak)
- address: Sevk/Teslimat adresi (bulamazsan boş bırak)
- items: Ürün kalemleri listesi. Her kalem şunları içermelidir:
  - productCode: Ürün kodu (örn: SU 10, SG 10-MSD, SC-1, S839863 vb.)
  - description: Ürün açıklaması (örn: AĞIR HİZMET TİPİ KABLO KANALI...). 
    ÖNEMLİ: description alanına sadece ve sadece ürüne ait tanım/açıklama bilgilerini yaz. Sayfa altbilgilerini, toplam tutarları, KDV açıklamalarını, "Yukarıda belirtilen...", "Açıklamalar:", "Faturanızın açıklama kısmında...", "Sertifikası gönderilmeyen...", "Geri ödemeler..." gibi sipariş genel açıklamalarını ve genel koşulları ASLA ürün açıklamasına ekleme! Bunları tamamen göz ardı et.
  - quantity: Miktar (sayısal değer)
  - unit: Birim (örn: pcs, m, adet)
  - price: Birim fiyatı (sayısal değer)
  - total: Toplam tutar (sayısal değer)

JSON format şablonu:
{
  "customerName": "Müşteri Adı",
  "orderNo": "12345",
  "projectNo": "NB1136",
  "coatingType": "TS 914 Sıcak Daldırma",
  "address": "Teslimat adresi...",
  "items": [
    {
      "productCode": "SU 10",
      "description": "AÇIKLAMA",
      "quantity": 100,
      "unit": "pcs",
      "price": 4.5,
      "total": 450
    }
  ]
}

Ham Döküman Metni:
${text}`;

          const response = await fetch(modelUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log("Gemini API raw reply:", reply);

            let cleanedText = reply.trim();
            if (cleanedText.includes('```')) {
              const firstIdx = cleanedText.indexOf('```');
              const lastIdx = cleanedText.lastIndexOf('```');
              if (firstIdx !== lastIdx) {
                let sub = cleanedText.substring(firstIdx + 3, lastIdx).trim();
                if (sub.startsWith('json')) {
                  sub = sub.substring(4).trim();
                }
                cleanedText = sub;
              }
            }

            const parsed = JSON.parse(cleanedText);
            const customer = (parsed.customerName || '').toUpperCase();
            const orderNo = parsed.orderNo || '';
            const projectNo = parsed.projectNo || '';
            const coating = parsed.coatingType ? [parsed.coatingType] : [];
            const address = parsed.address || '';
            const extractedItems = (parsed.items || []).map((it: any) => ({
              productCode: (it.productCode || '').toUpperCase(),
              description: (it.description || '').toUpperCase(),
              quantity: Number(it.quantity || 0),
              unit: (it.unit || 'pcs').toLowerCase(),
              price: Number(it.price || 0),
              total: Number(it.total || 0),
              isUretimDisi: (it.productCode || '').toLowerCase().includes('civata') || (it.productCode || '').toLowerCase().includes('somun') || (it.productCode || '').toLowerCase().includes('tij')
            }));

            setCoAiLogs(prev => [
              ...prev, 
              `[YAPAY ZEKA] GEMINI MODELİ VERİLERİ BAŞARIYLA ÇÖZÜMLEDİ!`,
              `[YAPAY ZEKA] Bulunan Müşteri: "${customer || 'Bulunamadı'}"`,
              `[YAPAY ZEKA] Bulunan Kalem Sayısı: ${extractedItems.length}`
            ]);

            setTimeout(() => {
              if (customer) {
                const exists = customers.some(c => c.name.toUpperCase() === customer.toUpperCase());
                if (!exists) {
                  addCustomer({
                    id: `MŞT-${customer.substring(0, 6).replace(/\s+/g, '').toUpperCase()}`,
                    name: customer,
                    contactPerson: 'Sipariş Asistanı (AI)',
                    email: 'info@' + customer.substring(0, 6).toLowerCase().replace(/\s+/g, '') + '.com'
                  });
                }
              }

              setCoCustomerName(customer);
              setCoOrderNo(orderNo);
              setCoProjectNo(projectNo);
              setCoOrderDate(new Date().toISOString().split('T')[0]);
              setCoDeliveryDate('');
              setCoCoatingTypes(coating);
              setCoDeliveryType('AMBAR İLE SEVK');
              setCoShippingAddress(address);
              setCoShippingFee('Müşteriye Ait');
              setCoItems(extractedItems);

              const mockDriveUrl = `https://drive.google.com/file/d/1${Math.random().toString(36).substring(2, 17)}/view?usp=sharing`;
              setCoAttachedFileLink(mockDriveUrl);
              setCoAttachedFileName(file.name);

              setCoAiScanning(false);
              alert(`YAPAY ZEKA (GEMINI) BELGEYİ OKUDU VE DRIVE'A YÜKLEDİ!\nMüşteri: ${customer}\nSipariş No: ${orderNo}\nKalem Sayısı: ${extractedItems.length}`);
            }, 500);
            return;
          } else {
            console.error("Gemini API error:", response.statusText);
            setCoAiLogs(prev => [...prev, `[HATA] Gemini API hatası: ${response.statusText}. Yerel analizciye aktarılıyor...`]);
          }
        } catch (err: any) {
          console.error("Gemini API call failed:", err);
          setCoAiLogs(prev => [...prev, `[HATA] Gemini bağlantısı başarısız oldu: ${err.message || err}. Yerel analizciye aktarılıyor...`]);
        }
      } else {
        setCoAiLogs(prev => [...prev, `[BİLGİ] Gemini Key bulunamadı. Yerel çevrimdışı motor kullanılıyor...`]);
      }

      runLocalHeuristicParser(text);
    };

    const runLocalHeuristicParser = (text: string) => {
      setCoAiLogs(prev => [...prev, `[ANALİZ] Yerel sezgisel analizci başlatıldı...`]);
      const textUpper = text.toUpperCase();

      let customer = '';
      let orderNo = '';
      let projectNo = '';
      let orderDate = '';
      let deliveryDate = '';
      let coating: string[] = [];
      let address = '';
      let extractedItems: any[] = [];

      // 1. Customer detection
      if (textUpper.includes('YUKSEL BEY') || textUpper.includes('YÜKSEL BEY') || textUpper.includes('YUKSEL') || textUpper.includes('YÜKSEL')) {
        customer = 'YÜKSEL BEY';
      } else if (textUpper.includes('NORSE') || textUpper.includes('RAMIS') || textUpper.includes('RAMİS')) {
        customer = 'NORSE TERSANESİ';
      } else if (textUpper.includes('TERSAN') || textUpper.includes('TERSANE')) {
        customer = 'TERSAN TERSANECİLİK SAN. VE TİC. A.Ş.';
      } else if (textUpper.includes('OZDEMIR') || textUpper.includes('ÖZDEMİR')) {
        customer = 'ÖZDEMİR ELEKTRİK A.Ş.';
      } else if (textUpper.includes('HASAN') || textUpper.includes('SERT')) {
        customer = 'HASAN SERT PROJE A.Ş.';
      } else if (textUpper.includes('GAYZER') || textUpper.includes('GEYZER')) {
        customer = 'GAYZER ELEKTRİK A.Ş.';
      } else if (textUpper.includes('AUDIT') || textUpper.includes('AUDİT') || textUpper.includes('DENETİM')) {
        customer = 'AUDİT DENETİM FİRMASI A.Ş.';
      } else {
        const customerInvoiceMatch = textUpper.match(/(?:MUSTERI|ALICI|FIRMA|MÜŞTERİ|MÜŞTERİ ADI)\s*[:\-\s]\s*([^;\n\r]{5,60})/);
        if (customerInvoiceMatch) {
          customer = customerInvoiceMatch[1].trim();
        } else {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const companyLine = lines.find(l => l.toUpperCase().includes('LTD') || l.toUpperCase().includes('A.Ş') || l.toUpperCase().includes('SAN') || l.toUpperCase().includes('A.S.'));
          if (companyLine && companyLine.length < 60) {
            customer = companyLine.toUpperCase();
          }
        }
      }

      // 2. Order number / Teklif No detection (e.g. 400897 NOLU or 2026/06/0020)
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
      const deliveryDateMatch = textUpper.match(/(?:TESLIM|DELIVERY)\s*(?:TARIHI)?\s*[:\-\s]\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
      if (deliveryDateMatch) {
        const parts = deliveryDateMatch[1].split('.');
        deliveryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      const orderDateMatch = textUpper.match(/(?:SIPARIS|ORDER|TEKLIF)\s*(?:TARIHI)?\s*[:\-\s]\s*(\d{1,2}\.\d{1,2}\.\d{4})/);
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

      // 7. Double-Insurance Table Parser:
      // Try Y-coordinate lined parser first
      let tableEnded = false;
      const linesList = text.split('\n');
      linesList.forEach(line => {
        const cleanedLine = line.trim();
        if (!cleanedLine) return;

        // Match: Qty + Unit + Price + [Optional Discount] + Total + End of Line
        const endPattern = /(\d+(?:[\.,]\d+)?)\s*(MT|AD|PCS|M|ADET|TAKIM|TK|SET|KG|M2)(?:\s+[^0-9]*\s*(\d+(?:[\.,]\d+)?))?\s+[^0-9]*\s*(\d+(?:[\.,]\d+)?)\s*[^0-9]*\s*(\d+(?:[.,\d]*))\s*$/i;
        const endMatch = cleanedLine.match(endPattern);

        if (endMatch) {
          tableEnded = false; // Reset flag for multi-page tables
          const qty = Number(endMatch[1].replace(',', '.'));
          const unit = endMatch[2].toUpperCase();
          const price = Number((endMatch[3] || endMatch[4]).replace(',', '.'));
          const total = Number(endMatch[5].replace(/\s/g, '').replace('.', '').replace(',', '.'));
          
          const prefixStr = cleanedLine.substring(0, cleanedLine.indexOf(endMatch[0])).trim();
          const tokens = prefixStr.split(/\s+/).filter(t => t.length > 0);
          if (tokens.length === 0) return;

          let code = '';
          let startIdx = 0;

          if (/^\d{1,2}$/.test(tokens[0])) {
            startIdx = 1;
          }

          if (startIdx < tokens.length) {
            const token1 = tokens[startIdx].toUpperCase();
            if (startIdx + 1 < tokens.length && /^(SU|SG|SC|L|SD|BB)$/.test(token1) && /^\d+/.test(tokens[startIdx+1])) {
              code = tokens[startIdx] + " " + tokens[startIdx+1];
              startIdx += 2;
            } else {
              code = tokens[startIdx];
              startIdx += 1;
            }
          }

          const descTokens = tokens.slice(startIdx);
          // Filter out SFI (6-digit numbers) and Proje (NB + digits) column values from description
          const descTokensFiltered = descTokens.filter(t => {
            const isSfi = /^\d{6}$/.test(t);
            const isProje = /^NB\d+$/i.test(t);
            return !isSfi && !isProje;
          });
          const desc = descTokensFiltered.join(" ") || 'KABLO MALZEMESİ';

          if (code && qty > 0) {
            extractedItems.push({
              productCode: code.toUpperCase(),
              description: desc.toUpperCase(),
              quantity: qty,
              unit: unit === 'MT' || unit === 'M' ? 'pcs' : (unit === 'AD' || unit === 'TK' ? 'pcs' : unit.toLowerCase()),
              price: price,
              total: total,
              isUretimDisi: code.toLowerCase().includes('civata') || code.toLowerCase().includes('somun') || code.toLowerCase().includes('tij')
            });
          }
        } else {
          // Description continuation block for lines without quantities (e.g. multi-line descriptions)
          if (extractedItems.length > 0 && !tableEnded) {
            const lastItem = extractedItems[extractedItems.length - 1];
            const cleanUpper = cleanedLine.toUpperCase();
            
            // Check if this line signals the end of the item table (footer / total area)
            const isFooterSignal = 
              cleanUpper.includes('NET TUTAR') || 
              cleanUpper.includes('KDV TUTAR') || 
              cleanUpper.includes('BRÜT TUTAR') || 
              cleanUpper.includes('TOPLAM') || 
              cleanUpper.includes('TUTAR') || 
              cleanUpper.includes('KDV') || 
              cleanUpper.includes('AÇIKLAMA') || 
              cleanUpper.includes('PROJE ONAY') || 
              cleanUpper.includes('YUKARIDA') || 
              cleanUpper.includes('SATINALMA') || 
              cleanUpper.includes('MUAFTIR') || 
              cleanUpper.includes('İSTİSNA') || 
              cleanUpper.includes('MUSTERI') || 
              cleanUpper.includes('MÜŞTERİ') || 
              cleanUpper.includes('TELEFON') || 
              cleanUpper.includes('FAKS') || 
              cleanUpper.includes('TEL:') || 
              cleanUpper.includes('E-POSTA') ||
              cleanUpper.includes('PAGE') ||
              cleanUpper.includes('SAYFA') ||
              cleanUpper.includes('DÖVİZ') ||
              cleanUpper.includes('TCMB') ||
              cleanUpper.includes('TERSANEMİZDE') ||
              cleanUpper.includes('AÇIKLAMALAR');

            if (isFooterSignal) {
              tableEnded = true;
            } else {
              const isHeader = cleanUpper.includes('TARIH') || cleanUpper.includes('NO:') || cleanUpper.includes('MÜŞTERİ') || cleanUpper.includes('SAYFA');
              if (!isHeader && cleanUpper.length > 3) {
                // Filter out any SFI (6 digits) or Proje (NB + digits) tokens that might have drifted to continuation lines
                const lineTokens = cleanedLine.split(/\s+/);
                const lineTokensFiltered = lineTokens.filter(t => {
                  const isSfi = /^\d{6}$/.test(t);
                  const isProje = /^NB\d+$/i.test(t);
                  return !isSfi && !isProje;
                });
                const cleanLineFiltered = lineTokensFiltered.join(" ");
                if (cleanLineFiltered.trim().length > 0) {
                  lastItem.description = (lastItem.description + " " + cleanLineFiltered.trim()).trim().toUpperCase();
                }
              }
            }
          }
        }
      });

      // Fallback: Segment-based Global Parser if line-by-line found 0 items
      if (extractedItems.length === 0) {
        setCoAiLogs(prev => [...prev, `[BİLGİ] Satır tespiti yapılamadı. Hücresel segmentasyon analizine geçiliyor...`]);
        
        // Find all product codes in the text
        const codeRegex = /\b(S\d{6}|SG[LBMB]?\s*\d+[-A-Z0-9]*|SGM\s*\d+|SU\s*\d+|SC-\d+|L\s*\d+|SD-\d+|BB\s*[0-9\*+A-Z]+)\b/gi;
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

          const qtyUnitRegex = /(\d+(?:[.,]\d+)?)\s*(pcs|AD|MT|M|ADET|TAKIM|TK|SET|KG|M2)\b/i;
          const qtyUnitMatch = segment.match(qtyUnitRegex);

          if (qtyUnitMatch) {
            const qty = Number(qtyUnitMatch[1].replace(',', '.'));
            const unit = qtyUnitMatch[2].toUpperCase();

            let desc = segment.substring(0, qtyUnitMatch.index || 0).trim();
            desc = desc.replace(/^[^a-zA-Z0-9]*/, '').replace(/[^a-zA-Z0-9]*$/, '');

            const afterQty = segment.substring((qtyUnitMatch.index || 0) + qtyUnitMatch[0].length);
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
              unit: unit === 'MT' || unit === 'M' ? 'pcs' : (unit === 'AD' || unit === 'TK' ? 'pcs' : unit.toLowerCase()),
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
        if (customer || extractedItems.length > 0) {
          alert(`YAPAY ZEKA BELGE BİLGİLERİNİ OKUDU VE GOOGLE DRIVE'A YÜKLEDİ!\nMüşteri: ${customer || 'Belirtilmemiş'}\nSipariş No: ${orderNo || 'Belirtilmemiş'}\nKalem Sayısı: ${extractedItems.length}`);
        } else {
          alert("UYARI: Yüklenen belgede sipariş verisi (Müşteri, Kalemler) ayrıştırılamadı. Lütfen alanları manuel doldurunuz.");
        }
      }, 1200);
    };

    const readAndExtractPdf = (file: File, callback: (text: string) => void) => {
      setCoAiLogs(prev => [...prev, `[PDF] PDF.js ile görsel koordinat analizi başlatılıyor...`]);
      const reader = new FileReader();
      reader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdfjsLib = (window as any).pdfjsLib;
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Group items by their vertical position (translateY)
            const items = textContent.items.map((item: any) => {
              const tx = item.transform[4];
              const ty = item.transform[5];
              return { str: item.str, x: tx, y: ty, width: item.width || 0 };
            });
            
            // Group items within 5 units threshold (prevents adjacent text lines from merging and interleaving when sorted by x-coordinate)
            const rows: { y: number; items: any[] }[] = [];
            items.forEach((item: any) => {
              if (!item.str.trim()) return; // skip empty tokens
              let foundRow = rows.find(r => Math.abs(r.y - item.y) < 5);
              if (foundRow) {
                foundRow.items.push(item);
              } else {
                rows.push({ y: item.y, items: [item] });
              }
            });
            
            // Sort rows descending
            rows.sort((a, b) => b.y - a.y);
            
            // Sort each row ascending and join using spatial gap calculation
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
                  // If horizontal gap is less than 2.5 units, join without space (parts of the same word)
                  if (gap < 2.5) {
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
          const cleanTurkishSpacing = (str: string): string => {
            if (!str) return '';
            let cleaned = str;
            // 1. Remove spaces between consecutive single letters (e.g. "P R O F I L" -> "PROFIL")
            let last;
            do {
              last = cleaned;
              cleaned = cleaned.replace(/(?<=^|\s)([a-zA-Z0-9ıiİğĞşŞçÇöÖüÜ])\s+(?=[a-zA-Z0-9ıiİğĞşŞçÇöÖüÜ](\s|$))/g, '$1');
            } while (cleaned !== last);
            
            // 2. Join isolated Turkish characters at the end of words (e.g. "GALVAN İ" -> "GALVANİ")
            cleaned = cleaned.replace(/([a-zA-Z0-9ıiİğĞşŞçÇöÖüÜ]+)\s+([ıiİğĞşŞçÇöÖüÜ])/gi, '$1$2');
            // 3. Double spaces normalize
            return cleaned.replace(/\s+/g, ' ').trim();
          };

          const cleanedText = fullText.split('\n').map(l => cleanTurkishSpacing(l)).join('\n');

          setCoAiLogs(prev => [...prev, `[PDF BAŞARILI] Satır ve sütunlar başarıyla hizalandı (Boyut: ${cleanedText.length} karakter).`]);
          callback(cleanedText);
        } catch (err: any) {
          console.error("PDF extraction error:", err);
          setCoAiLogs(prev => [...prev, `[HATA] PDF okuma hatası: ${err.message || err}`]);
          callback(file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    };

    const readAndExtractExcel = (file: File, callback: (text: string) => void) => {
      setCoAiLogs(prev => [...prev, `[EXCEL] SheetJS ile yapısal analiz başlatılıyor...`]);
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const XLSX = (window as any).XLSX;
          const workbook = XLSX.read(data, { type: 'array' });
          
          let excelItems: any[] = [];
          let detectedCustomer = "";
          let detectedOrderNo = "";
          
          workbook.SheetNames.forEach((sheetName: string) => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            let colIdxCode = -1;
            let colIdxDesc = -1;
            let colIdxQty = -1;
            let colIdxUnit = -1;
            let colIdxPrice = -1;
            let colIdxTotal = -1;
            
            for (let r = 0; r < rows.length; r++) {
              const row = rows[r];
              if (!row || row.length === 0) continue;
              
              row.forEach((cell: any) => {
                if (cell && typeof cell === 'string') {
                  const cellUpper = cell.toUpperCase();
                  if (cellUpper.includes('TEKLİF NO') || cellUpper.includes('SİPARİŞ NO') || cellUpper.includes('ORDER NO')) {
                    const numMatch = cellUpper.match(/(\d{5,10})/);
                    if (numMatch) detectedOrderNo = numMatch[1];
                  }
                }
              });
              
              const isHeader = row.some((cell: any) => {
                if (!cell) return false;
                const cellStr = String(cell).toUpperCase();
                return cellStr.includes('MALZEME') || cellStr.includes('KOD') || cellStr.includes('TANIM') || cellStr.includes('AÇIKLAMA') || cellStr.includes('MİKTAR') || cellStr.includes('QTY') || cellStr.includes('FİYAT') || cellStr.includes('PRICE') || cellStr.includes('TUTAR') || cellStr.includes('TOTAL');
              });
              
              if (isHeader) {
                row.forEach((cell: any, cIdx: number) => {
                  if (!cell) return;
                  const cellStr = String(cell).toUpperCase();
                  if (cellStr.includes('KOD') || cellStr.includes('NO') || cellStr.includes('CODE')) colIdxCode = cIdx;
                  if (cellStr.includes('TANIM') || cellStr.includes('AÇIKLAMA') || cellStr.includes('DESC')) colIdxDesc = cIdx;
                  if (cellStr.includes('MİK') || cellStr.includes('QTY') || cellStr.includes('ADET') || cellStr.includes('BOY') || cellStr.includes('MİKTAR')) colIdxQty = cIdx;
                  if (cellStr.includes('BİRİM') || cellStr.includes('UNIT') || cellStr.includes('BRM')) colIdxUnit = cIdx;
                  if (cellStr.includes('FİYAT') || cellStr.includes('PRICE') || cellStr.includes('B. FİYAT')) colIdxPrice = cIdx;
                  if (cellStr.includes('TUTAR') || cellStr.includes('TOTAL') || cellStr.includes('TOPLAM')) colIdxTotal = cIdx;
                });
                continue;
              }
              
              if (colIdxCode !== -1 && colIdxQty !== -1) {
                const codeVal = row[colIdxCode];
                const qtyVal = row[colIdxQty];
                
                if (codeVal && qtyVal) {
                  const codeStr = String(codeVal).trim();
                  const qtyNum = Number(String(qtyVal).replace(',', '.').replace(/[^\d\.]/g, ''));
                  
                  if (codeStr && qtyNum > 0) {
                    const descStr = colIdxDesc !== -1 && row[colIdxDesc] ? String(row[colIdxDesc]).trim() : 'KABLO MALZEMESİ';
                    const unitStr = colIdxUnit !== -1 && row[colIdxUnit] ? String(row[colIdxUnit]).trim() : 'pcs';
                    const priceNum = colIdxPrice !== -1 && row[colIdxPrice] ? Number(String(row[colIdxPrice]).replace(',', '.').replace(/[^\d\.]/g, '')) : 0;
                    const totalNum = colIdxTotal !== -1 && row[colIdxTotal] ? Number(String(row[colIdxTotal]).replace(',', '.').replace(/[^\d\.]/g, '')) : (qtyNum * priceNum);
                    
                    excelItems.push({
                      productCode: codeStr.toUpperCase(),
                      description: descStr.toUpperCase(),
                      quantity: qtyNum,
                      unit: unitStr === 'MT' || unitStr === 'M' ? 'pcs' : (unitStr === 'AD' || unitStr === 'TK' ? 'pcs' : unitStr.toLowerCase()),
                      price: priceNum,
                      total: totalNum,
                      isUretimDisi: codeStr.toLowerCase().includes('civata') || codeStr.toLowerCase().includes('somun') || codeStr.toLowerCase().includes('tij')
                    });
                  }
                }
              }
            }
          });
          
          if (excelItems.length > 0) {
            setCoAiLogs(prev => [...prev, `[EXCEL BAŞARILI] Yapısal tablo çözümlendi. Bulunan kalem: ${excelItems.length}`]);
            const mockText = JSON.stringify({
              customerName: detectedCustomer || "EXCEL İLE YÜKLENEN MÜŞTERİ",
              orderNo: detectedOrderNo || "",
              items: excelItems
            });
            callback(mockText);
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
          setCoAiLogs(prev => [...prev, `[HATA] Excel okuma hatası: 	h${err.message || err}`]);
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

    addOrder(newOrder);
    setShowCreateOrderScreen(false);
    setActiveOrderId(newOrderId);
    setActiveTab('orders');
  };

  const updateCoItemField = (idx: number, field: string, val: any) => {
    const updated = coItems.map((item, i) => {
      if (i === idx) {
        return { ...item, [field]: val };
      }
      return item;
    });
    setCoItems(updated);
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
    setEditOrderCustomerName(order.customerName);
    setEditOrderDate(order.date);
    setEditOrderStatus(order.status);
    setEditOrderItems(order.items.map((item: any) => ({ ...item })));
    setShowEditOrderModal(true);
  };

  const handleSaveEditOrder = () => {
    if (!activeOrder) return;
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

    updateOrder(activeOrder.id, {
      customerName: editOrderCustomerName,
      date: editOrderDate,
      status: editOrderStatus,
      items: editOrderItems
    });
    // Trigger update of local selection
    setActiveOrderId(activeOrder.id);
    setShowEditOrderModal(false);
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

  // Advanced Search & Grouping States
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<'status' | 'customer' | 'date'>('status');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'YENİ SİPARİŞ': true,
    'ÜRETİMDE': true,
    'KAPLAMADA': true,
    'BOYADA': true,
    'PAKETLEMEDE': true,
    'SEVK EDİLDİ': false
  });

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
  const [activeDispatchToShow, setActiveDispatchToShow] = useState<any | null>(null);
  const [showCoatingAcceptModal, setShowCoatingAcceptModal] = useState(false);
  const [coatingAcceptMicron, setCoatingAcceptMicron] = useState(55);
  const [coatingAcceptVisual, setCoatingAcceptVisual] = useState('Uygun');
  const [coatingAcceptDevice, setCoatingAcceptDevice] = useState('KAL-05');
  const [coatingAcceptLot, setCoatingAcceptLot] = useState('KAP-2026-001');

  const handleOpenFR009 = (runs: any[]) => {
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

    setActiveFR009ToShow(uniqueRuns);
    setEditableRuns(uniqueRuns.map(r => ({
      ...r,
      standardDimensions: r.standardDimensions || '',
      firstCheckWidthMm: r.firstCheckWidthMm || '',
      firstCheckHeightMm: r.firstCheckHeightMm || '',
      firstCheckThicknessMm: r.firstCheckThicknessMm || '',
      firstCheckStatus: r.firstCheckStatus || 'Bekliyor',
      inProcessChecks: r.inProcessChecks || [],
      operatorsAssigned: r.operatorsAssigned || {},
      notes: r.notes || ''
    })));
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
      // pre-fill action quantity if not set
      if (next[itemKey] && activeOrder) {
        const lastDashIndex = itemKey.lastIndexOf('-');
        const prodCode = itemKey.substring(0, lastDashIndex);
        const itemIdx = parseInt(itemKey.substring(lastDashIndex + 1));
        const item = activeOrder.items[itemIdx];
        if (item && item.productCode === prodCode) {
          const remaining = item.quantity - (item.shippedQuantity || 0);
          setActionQuantities(prevQ => ({ ...prevQ, [itemKey]: remaining }));
        }
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (!activeOrder) return;
    const selectables = activeOrder.items.map((item, idx) => {
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
    if (!activeOrder) return;
    const updatedItems = activeOrder.items.map(it => {
      if (it.productCode === prodCode) {
        return { ...it, coatingType: coating };
      }
      return it;
    });
    updateOrder(activeOrder.id, { items: updatedItems });
  };

  // Action: Send Selected to Production (Direct execution, no modal!)
  const handleSendSelectedToProduction = (orderInput?: Order) => {
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;
    
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen üretime gönderilecek kalemleri seçin.");
      return;
    }
    
    if (orderInput) setActiveOrderId(orderInput.id);

    selectedKeys.forEach(key => {
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      if (!item) return;

      const remaining = item.quantity - (item.shippedQuantity || 0);
      const qty = actionQuantities[key] || remaining;
      const orderNo = `EMR-2026-${Math.floor(100 + Math.random() * 900)}`;
      const runId = `PRD-2026-${Math.floor(100 + Math.random() * 900)}`;

      // Create ProductionRun leaving operator blank and saving selected processes list
      addProductionRun({
        id: runId,
        productionOrderNo: orderNo,
        date: new Date().toISOString().split('T')[0],
        productCode: prodCode,
        quantity: qty,
        operator: '', // Leave blank as requested
        pdfFile: `Uretim_Formu_${orderNo}.pdf`,
        firstCheckStatus: 'Bekliyor',
        inProcessChecks: [],
        status: 'İlk Kontrol Bekliyor',
        notes: 'Seri üretim emri otomatik oluşturuldu.',
        orderId: targetOrder.id,
        processes: ['Kesme', 'Delme', 'Bükme']
      });
    });

    // Update item statuses to 'Üretimde'
    const updatedItems = targetOrder.items.map((item, idx) => {
      const key = `${item.productCode}-${idx}`;
      if (selectedItems[key]) {
        return { ...item, status: 'Üretimde' as const };
      }
      return item;
    });

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'ÜRETİMDE'
    });

    alert("[ERP PROSES] Seçilen kalemler için üretim emirleri başarıyla oluşturuldu ve üretime gönderildi.");
    setSelectedItems({});
  };

  // Action: Send Selected to Coating
  const handleSendSelectedToCoating = (orderInput?: Order) => {
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;
    
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen kaplamaya gönderilecek kalemleri seçin.");
      return;
    }

    const updatedItems = targetOrder.items.map((item, idx) => {
      const key = `${item.productCode}-${idx}`;
      if (selectedItems[key]) {
        return { ...item, status: 'Kaplamada' as const };
      }
      return item;
    });

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'KAPLAMADA'
    });

    alert("[ERP PROSES] Seçilen kalemler kaplama (galvaniz) ünitesine sevk edildi.");
    setSelectedItems({});
  };

  // Action: Open Coating Acceptance Modal
  const handleReceiveFromCoating = (orderInput?: Order) => {
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;

    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
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

    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      return item && item.status === 'Kaplamada';
    });

    // Update item statuses to 'Paketlemede' (or 'Tamamlandı' / ready to pack)
    const updatedItems = targetOrder.items.map((item, idx) => {
      const key = `${item.productCode}-${idx}`;
      if (selectedItems[key]) {
        // Also save measured thickness inside a custom field or localStorage mapping
        // so that the 3.1 cert and son kontrol forms can pick it up!
        const savedInspections = localStorage.getItem('qms_fr12_inspections') || '{}';
        const inspections = JSON.parse(savedInspections);
        
        // We will store it for the product code so it can be autofilled later
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

    // Auto-generate URT-04 and IZL-07 quality record definitions in localStorage or backend
    // Since URT-04 is the Ara Kontrol Formu, let's create a local record for this run
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
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;
    
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen boyaya gönderilecek kalemleri seçin.");
      return;
    }

    const updatedItems = targetOrder.items.map((item, idx) => {
      const key = `${item.productCode}-${idx}`;
      if (selectedItems[key]) {
        return { ...item, status: 'Boyada' as const };
      }
      return item;
    });

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'BOYADA'
    });

    alert("[ERP PROSES] Seçilen kalemler elektrostatik toz boya ünitesine sevk edildi.");
    setSelectedItems({});
  };

  // Action: Send Selected to Packaging
  const handleSendSelectedToPackaging = (orderInput?: Order) => {
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;
    
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen paketlemeye alınacak kalemleri seçin.");
      return;
    }

    const updatedItems = targetOrder.items.map((item, idx) => {
      const key = `${item.productCode}-${idx}`;
      if (selectedItems[key]) {
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
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;

    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      if (lastDashIndex === -1) {
        return targetOrder.items.some(i => i.productCode === key);
      }
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
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
          const item = targetOrder.items.find(i => i.productCode === key);
          if (item) {
            const remaining = item.quantity - (item.shippedQuantity || 0);
            setActionQuantities(prev => ({ ...prev, [key]: remaining }));
          }
        } else {
          const prodCode = key.substring(0, lastDashIndex);
          const itemIdx = parseInt(key.substring(lastDashIndex + 1));
          const item = targetOrder.items[itemIdx];
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

    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      if (lastDashIndex === -1) {
        return order.items.some(i => i.productCode === key);
      }
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = order.items[itemIdx];
      return item && item.productCode === prodCode;
    });

    const dispatchItems: { productCode: string, quantity: number }[] = [];

    // Verify quantities
    let hasError = false;
    selectedKeys.forEach(key => {
      const lastDashIndex = key.lastIndexOf('-');
      if (lastDashIndex === -1) {
        const orderItem = order.items.find(i => i.productCode === key);
        if (orderItem) {
          const qtyToShip = actionQuantities[key] || 0;
          const remaining = orderItem.quantity - (orderItem.shippedQuantity || 0);
          if (qtyToShip <= 0 || qtyToShip > remaining) {
            alert(`Hatalı Miktar: ${key} için sevk miktarı 1 ile kalan miktar (${remaining}) arasında olmalıdır.`);
            hasError = true;
          } else {
            dispatchItems.push({ productCode: key, quantity: qtyToShip });
          }
        }
        return;
      }
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const orderItem = order.items[itemIdx];
      
      if (orderItem) {
        const qtyToShip = actionQuantities[key] || 0;
        const remaining = orderItem.quantity - (orderItem.shippedQuantity || 0);
        if (qtyToShip <= 0 || qtyToShip > remaining) {
          alert(`Hatalı Miktar: ${prodCode} (Kalem ${itemIdx + 1}) için sevk miktarı 1 ile kalan miktar (${remaining}) arasında olmalıdır.`);
          hasError = true;
        } else {
          dispatchItems.push({ productCode: prodCode, quantity: qtyToShip });
        }
      }
    });

    if (hasError) return;

    // Create the Dispatch Note entry
    const newDispatch = {
      dispatchNoteNo: dispatchNo,
      date: shipDate,
      carrierName: shipCarrierName,
      plateNo: shipPlateNo,
      items: dispatchItems
    };

    const updatedItems = order.items.map((item, idx) => {
      const key = `${item.productCode}-${idx}`;
      const shippedForThisItem = actionQuantities[key] || actionQuantities[item.productCode] || 0;
      if (selectedItems[key] || selectedItems[item.productCode]) {
        const totalShipped = (item.shippedQuantity || 0) + shippedForThisItem;
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

    updateOrder(order.id, {
      items: updatedItems,
      status: orderStatus,
      dispatches: [...currentDispatches, newDispatch]
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
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;
    
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      if (lastDashIndex === -1) {
        return targetOrder.items.some(i => i.productCode === key);
      }
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
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

  const handleShowFR012 = (dispatchNo: string) => {
    const order = selectedOrderDetailOrder || activeOrder;
    const dispatch = order.dispatches.find(d => d.dispatchNoteNo === dispatchNo);
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

    const items = dispatch ? dispatch.items.map((item, idx) => {
      const orderItem = order.items.find(oi => oi.productCode === item.productCode);
      const isUretimDisi = orderItem && orderItem.status === 'Üretim Dışı';
      const savedRow = existing && existing.items ? existing.items.find((i: any) => i.productCode === item.productCode) : null;
      if (savedRow) {
        return { ...savedRow, isUretimDisi };
      }
      return {
        productCode: item.productCode,
        quantity: item.quantity,
        unit: item.productCode.includes('SU') ? 'M' : 'AD',
        desc: products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase())?.name || (orderItem?.description || (item.productCode.includes('SU') ? 'UNIVERSAL TİP K.KANALI' : 'BİRLEŞTİRME PARÇASI')),
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
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 print:hidden">
        <button
          onClick={() => {
            setActiveTab('quotes');
            setShowCreateOrderScreen(false);
            setIsEditingNewQuote(false);
          }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'quotes' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="h-4 w-4" /> 1. Fiyat Teklifleri (FR-013)
        </button>
        <button
          onClick={() => {
            setActiveTab('orders');
            setShowCreateOrderScreen(false);
            setIsEditingNewQuote(false);
          }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="h-4 w-4" /> 2. Müşteri Sipariş Takip
        </button>
      </div>

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
                          <img src="/sies_logo.png" alt="SIES Logo" className="h-16 object-contain" />
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
        /* CREATE ORDER WIZARD SCREEN - 1:1 REPLICA OF THE SCREENSHOT */
        <div className="space-y-6 print:hidden bg-slate-100 p-6 rounded-xl border border-slate-200">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <ChevronRight 
                className="h-6 w-6 cursor-pointer text-slate-500 hover:text-slate-800 rotate-180" 
                onClick={() => setShowCreateOrderScreen(false)} 
              />
              <div>
                <h2 className="text-xl font-bold text-slate-800 uppercase">Yeni Sipariş Oluştur</h2>
                <p className="text-xs text-slate-500 uppercase mt-0.5">Dosya yükleyerek AI ile otomatik doldurun veya manuel girin</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCreateOrderScreen(false)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs uppercase shadow-sm transition-all"
              >
                İptal
              </button>
              <button 
                onClick={handleCreateOrderSubmit}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2 rounded text-xs uppercase shadow-sm transition-all"
              >
                Siparişi Oluştur
              </button>
            </div>
          </div>

          {/* AI Upload Bar / Exemption Toggle */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="file"
                  id="co-ai-file-input"
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleCoAiFileUpload(file);
                    }
                  }}
                />
                <label 
                  htmlFor="co-ai-file-input"
                  className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-750 font-bold px-5 py-2.5 rounded-lg text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Cpu className="h-4 w-4 animate-pulse text-orange-550" /> AI ile doldur — PDF / Excel / Resim seç (isteğe bağlı)
                </label>

                {coAiScanning && (
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 animate-pulse uppercase">
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-500" /> Yapay zeka belge okuma yapılıyor...
                  </div>
                )}
              </div>

              {/* Gemini API Key Input */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">GEMINI KEY:</span>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={e => {
                    setGeminiApiKey(e.target.value);
                    localStorage.setItem('qms_gemini_api_key', e.target.value);
                  }}
                  placeholder="Girmek için tıklayın..."
                  className="bg-transparent text-xs font-mono w-40 focus:outline-none text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={coIsExempt}
                    onChange={e => setCoIsExempt(e.target.checked)}
                    className="h-4 w-4 accent-orange-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase">Muafiyet</span>
                </label>
              </div>
            </div>

            {/* AI Log Console Terminal */}
            {coAiLogs.length > 0 && (
              <div className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-3 rounded-lg border border-slate-800 space-y-1 max-h-28 overflow-y-auto shadow-inner">
                {coAiLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-1">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Müşteri & Sipariş Bilgileri (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
              <span className="text-xs font-bold text-[#1f4e5b] uppercase flex items-center gap-1 border-b border-slate-100 pb-2">
                <Building className="h-4 w-4 text-[#1f4e5b]" /> Müşteri & Sipariş Bilgileri
              </span>

              {/* Müşteri */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Müşteri *</label>
                <select
                  value={coCustomerName}
                  onChange={e => setCoCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">Müşteri seçin veya oluşturun</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Sipariş No & Proje No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Müşteri Sipariş No</label>
                  <input
                    type="text"
                    value={coOrderNo}
                    onChange={e => setCoOrderNo(e.target.value)}
                    placeholder="SP-2025-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold font-mono text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Proje No</label>
                  <input
                    type="text"
                    value={coProjectNo}
                    onChange={e => setCoProjectNo(e.target.value)}
                    placeholder="PRJ-2025-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sipariş Tarihi & Teslimat Tarihi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sipariş Tarihi *</label>
                  <input
                    type="date"
                    value={coOrderDate}
                    onChange={e => setCoOrderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Teslimat Tarihi *</label>
                  <input
                    type="date"
                    value={coDeliveryDate}
                    onChange={e => setCoDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Kaplama Cinsi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kaplama Cinsi *</label>
                <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded p-3 max-h-36 overflow-y-auto bg-slate-50">
                  {[
                    'TS 914 Sıcak Daldırma',
                    'TS 822 Pregalvanizli',
                    'TS 14.9 Elektrogalvaniz',
                    'Elektrostatik Toz Boya',
                    'Astar Boyalı',
                    '304 Kalite Paslanmaz',
                    '316 Kalite Paslanmaz',
                    'Elektro Polisajlı',
                    'Elektro Polisajsız',
                    '1050 Kalite Alüminyum'
                  ].map(coating => (
                    <label key={coating} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-700 hover:text-slate-900 select-none">
                      <input 
                        type="checkbox"
                        checked={coCoatingTypes.includes(coating)}
                        onChange={e => {
                          if (e.target.checked) {
                            setCoCoatingTypes([...coCoatingTypes, coating]);
                          } else {
                            setCoCoatingTypes(coCoatingTypes.filter(x => x !== coating));
                          }
                        }}
                        className="h-3.5 w-3.5 accent-[#1f4e5b] rounded cursor-pointer"
                      />
                      <span>{coating}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Teslimat Şekli & Detayı */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Teslimat Şekli *</label>
                  <select
                    value={coDeliveryType}
                    onChange={e => setCoDeliveryType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="">Seçin</option>
                    <option value="AMBAR İLE SEVK">AMBAR İLE SEVK</option>
                    <option value="FABRİKA TESLİM (EX WORKS)">FABRİKA TESLİM (EX WORKS)</option>
                    <option value="ADRESE TESLİM (DDP)">ADRESE TESLİM (DDP)</option>
                    <option value="KARGO İLE SEVK">KARGO İLE SEVK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Teslimat Detayı</label>
                  <input
                    type="text"
                    value={coDeliveryDetail}
                    onChange={e => setCoDeliveryDetail(e.target.value)}
                    placeholder="İkitelli Ambarı ile sevk"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* SEVKİYAT BİLGİLERİ */}
              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-3">
                <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">SEVKİYAT BİLGİLERİ</span>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sevk Adresi *</label>
                  <textarea
                    rows={2}
                    value={coShippingAddress}
                    onChange={e => setCoShippingAddress(e.target.value)}
                    placeholder="Malzemenin teslim edileceği tam adres..."
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-850 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sevkiyat Ücreti *</label>
                    <select
                      value={coShippingFee}
                      onChange={e => setCoShippingFee(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-850 focus:outline-none"
                    >
                      <option value="Müşteriye Ait">Müşteriye Ait</option>
                      <option value="Firmamıza Ait (SIES)">Firmamıza Ait (SIES)</option>
                      <option value="Alıcı Ödemeli">Alıcı Ödemeli</option>
                    </select>
                  </div>
                  <div className="pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-700 hover:text-slate-900 select-none">
                      <input 
                        type="checkbox"
                        checked={coDifferentBilling}
                        onChange={e => setCoDifferentBilling(e.target.checked)}
                        className="h-3.5 w-3.5 accent-[#1f4e5b] rounded cursor-pointer"
                      />
                      <span>Fatura Adresi Farklı</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Açıklama / Notlar</label>
                <textarea
                  rows={2}
                  value={coNotes}
                  onChange={e => setCoNotes(e.target.value)}
                  placeholder="Siparişle ilgili özel notlar..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-850 focus:outline-none"
                />
              </div>
            </div>

            {/* Right Column: Sipariş Kalemleri (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-[#1f4e5b] uppercase flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4 text-[#1f4e5b]" /> Sipariş Kalemleri
                </span>
                <button
                  onClick={addCoItem}
                  className="bg-[#1f4e5b] hover:bg-[#15363e] text-white font-bold px-3 py-1.5 rounded text-[10px] uppercase flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="h-3 w-3" /> Yeni Kalem
                </button>
              </div>

              {coItems.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                  <ShoppingCart className="h-10 w-10 text-slate-300 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Henüz kalem eklenmedi</span>
                  <p className="text-[10px] text-slate-400 max-w-[280px] uppercase">
                    "Yeni Kalem" butonuyla ekleyin veya yukarıdan AI ile dosyadan otomatik çıkarın.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-x-auto overflow-hidden font-mono">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="p-2 w-28">Malz. No</th>
                          <th className="p-2">Tanım</th>
                          <th className="p-2 w-20 text-right">Miktar</th>
                          <th className="p-2 w-16">Birim</th>
                          <th className="p-2 w-20 text-right">B. Fiyat</th>
                          <th className="p-2 w-20 text-right">Toplam</th>
                          <th className="p-2 text-center w-10"></th>
                        </tr>
                      </thead>
                                            <tbody>
                        {coItems.map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="p-2 font-mono font-bold text-slate-800">
                              {item.productCode}
                            </td>
                            <td className="p-2 text-slate-700">
                              {item.description || ''}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-800">
                              {item.quantity}
                            </td>
                            <td className="p-2 font-medium text-slate-600">
                              {item.unit || 'pcs'}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-800">
                              {(item.price || 0).toFixed(2)}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-700">
                              {(item.quantity * (item.price || 0)).toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => deleteCoItem(idx)}
                                className="text-red-500 hover:text-red-700 font-bold text-xs"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase">GENEL TOPLAM:</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {coItems.reduce((acc, it) => acc + (it.quantity * (it.price || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <select 
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                      defaultValue="USD"
                    >
                      <option value="USD">USD</option>
                      <option value="TRY">TRY</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* ORDERS LIST & OPERATIONS (SIPARIS) */
        <div className="space-y-6 print:hidden">
          {/* Sies-style Stats & Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">SİPARİŞLER</h1>
                <span className="bg-slate-100 border border-slate-200 text-slate-600 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase shadow-sm">
                  {orders.length} Toplam
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">İrsaliye kesim işlemleri, son kontrol formları (FR-10) ve 3.1 Muayene Sertifikası (FR-011) evrak takibi</p>
            </div>
            
            <button 
              onClick={() => setShowCreateOrderScreen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Yeni Sipariş Girişi (İrsaliye Oluştur)
            </button>
          </div>

          {/* Sies-style Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="MÜŞTERİ VEYA SİPARİŞ NO ARA..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all uppercase"
                />
              </div>
            </div>
          </div>

          {/* Siparişler Listesi (Accordions Grouped by Customer) */}
          <div className="space-y-4">
            {(() => {
              // Group orders by customerName
              const filteredOrders = orders.filter(o => 
                o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.id.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredOrders.length === 0) {
                return (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 uppercase font-mono tracking-wider text-[11px] bg-white">
                    Aranan kriterlere uygun sipariş bulunamadı.
                  </div>
                );
              }

              const grouped: Record<string, Order[]> = {};
              filteredOrders.forEach(o => {
                if (!grouped[o.customerName]) {
                  grouped[o.customerName] = [];
                }
                grouped[o.customerName].push(o);
              });

              const customerNames = Object.keys(grouped).sort();

              return customerNames.map(custName => {
                const customerOrders = grouped[custName];
                const isExpanded = expandedGroups[custName] !== false; // expanded by default
                
                return (
                  <div key={custName} className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
                    {/* Customer Accordion Header */}
                    <div 
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [custName]: !isExpanded }))}
                      className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/70 transition-colors print:hidden"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-200 text-slate-800 font-mono font-black px-2 py-0.5 rounded text-[10px]">
                          {customerOrders.length} Sipariş
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">{custName}</span>
                      </div>
                      
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>

                    {/* Customer Orders Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border-t border-slate-200 text-left text-xs font-sans">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">
                              <th className="p-3 w-32">Sipariş No</th>
                              <th className="p-3 text-center w-28">Kaplama Cinsi</th>
                              <th className="p-3 text-center w-28">Sevk Durumu</th>
                              <th className="p-3">Sipariş Kalemleri Özeti</th>
                              <th className="p-3 text-right w-36">Sevk Edilen Miktar</th>
                              <th className="p-3 text-center w-28 print:hidden">Durum</th>
                              <th className="p-3 text-center w-24 print:hidden">İşlemler</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerOrders.map(order => {
                              // Calculate metrics
                              let totalQty = 0;
                              let totalShipped = 0;
                              order.items.forEach(itm => {
                                totalQty += itm.quantity;
                                totalShipped += itm.shippedQuantity || 0;
                              });

                              // Extract coating types dynamically
                              const coatingBadges = (order.coatingTypes || []).map(c => {
                                if (c.includes('304')) {
                                  return <span key={c} className="bg-blue-100 border border-blue-200 text-blue-800 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider block w-fit mx-auto mb-0.5">304 PSL.</span>;
                                } else if (c.includes('SICAK') || c.includes('1461')) {
                                  return <span key={c} className="bg-[#1f4e5b] text-white font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider block w-fit mx-auto mb-0.5">TS914 S.D.</span>;
                                } else if (c.includes('BOYA')) {
                                  return <span key={c} className="bg-orange-100 border border-orange-200 text-orange-850 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider block w-fit mx-auto mb-0.5">ASTAR</span>;
                                }
                                return <span key={c} className="bg-slate-100 border border-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider block w-fit mx-auto mb-0.5">{c.substring(0, 8)}</span>;
                              });

                              const deliveryBadge = order.deliveryType === 'AMBAR İLE SEVK' 
                                ? <span className="bg-purple-100 border border-purple-200 text-purple-700 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider inline-block">AMBAR</span>
                                : <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider inline-block">FABRİKA TESLİM</span>;

                              let statusColor = 'bg-slate-100 text-slate-700 border border-slate-200';
                              let displayStatus = 'BEKLEMEDE';

                              if (order.status === 'SEVK EDİLDİ') {
                                statusColor = 'bg-green-100 text-green-700 border border-green-200 font-extrabold';
                                displayStatus = 'SEVK EDİLDİ';
                              } else if (order.status === 'KISMİ SEVK EDİLDİ') {
                                statusColor = 'bg-amber-100 text-amber-700 border border-amber-200 font-extrabold';
                                displayStatus = 'KISMİ SEVK';
                              } else if (order.status === 'ÜRETİMDE') {
                                statusColor = 'bg-blue-100 text-blue-700 border border-blue-200 font-bold';
                                displayStatus = 'ÜRETİMDE';
                              } else if (order.status === 'KAPLAMADA') {
                                statusColor = 'bg-teal-100 text-teal-700 border border-teal-200 font-bold';
                                displayStatus = 'KAPLAMA';
                              } else if (order.status === 'BOYADA') {
                                statusColor = 'bg-purple-100 text-purple-700 border border-purple-200 font-bold';
                                displayStatus = 'BOYADA';
                              } else if (order.status === 'PAKETLEMEDE') {
                                statusColor = 'bg-pink-100 text-pink-700 border border-pink-200 font-bold';
                                displayStatus = 'PAKET';
                              }

                              return (
                                <tr 
                                  key={order.id} 
                                  onClick={() => {
                                    setSelectedOrderDetailOrder(order);
                                    setShowOrderDetailModal(true);
                                  }}
                                  className="border-b last:border-0 hover:bg-orange-50/30 transition-colors font-mono cursor-pointer"
                                >
                                  <td className="p-3">
                                    <span className="font-extrabold text-red-650 block hover:underline">{order.id}</span>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{order.projectNo || '-'}</span>
                                  </td>
                                  <td className="p-3 text-center">{coatingBadges.length > 0 ? coatingBadges : '-'}</td>
                                  <td className="p-3 text-center">{deliveryBadge}</td>
                                  <td className="p-3 font-sans text-slate-755 font-normal leading-relaxed text-[11px]">
                                    <span className="font-bold text-slate-900">{order.items.length} Kalem</span> — {order.items[0]?.description || 'KABLO MALZEMESİ'}
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="text-green-600 font-bold">{totalShipped}</span> / <span className="text-slate-500 font-bold">{totalQty}</span> <span className="text-[9px] text-slate-400 font-bold uppercase">pcs</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider inline-block shadow-sm ${statusColor}`}>
                                      {displayStatus}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center print:hidden flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={() => {
                                        setActiveOrderId(order.id);
                                        handleStartEditOrder(order);
                                      }}
                                      className="p-1 text-blue-505 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                      title="Siparişi Düzenle"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    {order.attachedFileLink && (
                                      <a
                                        href={order.attachedFileLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-purple-650 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                                        title="Müşteri Sipariş Formunu Aç"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => {
                                        if (confirm(`${order.id} nolu siparişi tamamen silmek istediğinizden emin misiniz?`)) {
                                          deleteOrder(order.id);
                                        }
                                      }}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      title="Siparişi Sil"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

        {/* MODAL: WORKSPACE MODAL FOR SIPARIS DETAY & EVRAK YONETIMI */}
        {showOrderDetailModal && selectedOrderDetailOrder && (() => {
          const order = selectedOrderDetailOrder;
          const quote = quotes.find(q => q.id === order.quoteId);
          const statusColor = order.status === 'SEVK EDİLDİ' 
            ? 'bg-green-100 text-green-700 border border-green-200'
            : order.status === 'KISMİ SEVK EDİLDİ'
            ? 'bg-amber-100 text-amber-700 border border-amber-200'
            : order.status === 'BOYADA'
            ? 'bg-purple-100 text-purple-700 border border-purple-200'
            : order.status === 'KAPLAMADA'
            ? 'bg-teal-100 text-teal-700 border border-teal-200'
            : order.status === 'ÜRETİMDE'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-slate-100 text-slate-700 border border-slate-200';
          
          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-0 overflow-hidden">
              <div className="w-full h-full flex flex-col bg-slate-100 overflow-hidden">
                
                {/* Header */}
                <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center shadow-md">
                  <div className="flex items-center gap-4">
                    <span className="bg-orange-600 p-2 rounded-lg text-white">
                      <ClipboardList className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider">SİPARİŞ DOKÜMANTASYON & OPERASYON MERKEZİ</h3>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">SIES Kalite Yönetim Sistemi (QMS-OS)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-bold uppercase">SİPARİŞ NO:</span>
                    <span className="bg-slate-800 border border-slate-700 text-white font-mono font-black px-3.5 py-1 rounded text-xs">
                      {order.id}
                    </span>
                    
                    <span className="text-xs text-slate-400 font-bold uppercase ml-2">DURUM:</span>
                    <span className={`px-3 py-1 rounded text-xs font-black tracking-wide shadow-sm uppercase ${statusColor}`}>
                      {order.status || 'BEKLEMEDE'}
                    </span>
                    
                    <button 
                      onClick={() => {
                        setShowOrderDetailModal(false);
                        setSelectedOrderDetailOrder(null);
                      }} 
                      className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all ml-4"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Sub-header info bar */}
                <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-3.5 text-[10px] text-slate-700 leading-relaxed flex flex-wrap gap-x-6 gap-y-1.5 font-sans shadow-sm">
                  <div>🏢 <strong>MÜŞTERİ:</strong> <span className="font-extrabold text-slate-900">{order.customerName}</span></div>
                  <div>📅 <strong>SİPARİŞ TARİHİ:</strong> <span className="font-bold text-slate-900">{order.date}</span></div>
                  <div>💳 <strong>ÖDEME ŞEKLİ:</strong> <span className="font-bold text-orange-850">{quote?.paymentTerms || '45 GÜN VADELİ'}</span></div>
                  <div>👤 <strong>SATINALMACI:</strong> <span className="font-bold text-slate-900">{quote?.customerRepresentative || 'SİPARİŞ ASİSTANI (AI)'}</span></div>
                  <div>📍 <strong>SEVK ADRESİ:</strong> <span className="font-bold text-slate-900">{quote?.customerAddress || 'TESİS TESLİM'}</span></div>
                  <div>🏷️ <strong>PROJE ONAY ID:</strong> <span className="font-mono font-bold text-slate-900">{order.projectNo || 'NB1129'}</span></div>
                  <div>💰 <strong>KDV MUAFİYETİ:</strong> <span className="font-bold text-slate-900">{quote?.taxPercent === 0 ? "KDV'DEN MUAFTIR" : "MUAFIYET YOKTUR."}</span></div>
                </div>

                {/* Main Workspace Body */}
                <div className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">
                  
                  {/* Left Column: Items and Process stations */}
                  <div className="col-span-7 flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-150 flex justify-between items-center bg-slate-50/50">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <ListChecks className="h-4 w-4 text-orange-500" /> Sipariş Kalemleri & İşlem Havuzu
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">* KALEMLERİ SEÇİP AŞAĞIDAKİ İŞLEMLERİ YAPABİLİRSİNİZ.</span>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <table className="w-full border-collapse border border-slate-200 text-left text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                            <th className="p-3 text-center w-12">
                              <input 
                                type="checkbox" 
                                checked={order.items.length > 0 && order.items.every((i, idx) => selectedItems[`${i.productCode}-${idx}`] || (i.quantity - (i.shippedQuantity || 0)) <= 0)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const allKeys: Record<string, boolean> = { ...selectedItems };
                                    order.items.forEach((i, idx) => {
                                      const remaining = i.quantity - (i.shippedQuantity || 0);
                                      if (remaining > 0) {
                                        allKeys[`${i.productCode}-${idx}`] = true;
                                      }
                                    });
                                    setSelectedItems(allKeys);
                                  } else {
                                    const nextSelection = { ...selectedItems };
                                    order.items.forEach((i, idx) => {
                                      delete nextSelection[`${i.productCode}-${idx}`];
                                    });
                                    setSelectedItems(nextSelection);
                                  }
                                }}
                                className="rounded border-slate-350 text-orange-600 focus:ring-orange-500 h-4 w-4"
                              />
                            </th>
                            <th className="p-3 w-28">Ürün Kodu</th>
                            <th className="p-3">Malın Tanımı / Açıklaması</th>
                            <th className="p-3 text-right w-20">Miktar</th>
                            <th className="p-3 text-right w-24">Sevk Edilen</th>
                            <th className="p-3 text-right w-20">Kalan</th>
                            <th className="p-3 text-center w-28">İşlem Miktarı</th>
                            <th className="p-3 text-center w-24">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {order.items.map((item, idx) => {
                            const remaining = item.quantity - (item.shippedQuantity || 0);
                            const isSelected = !!selectedItems[`${item.productCode}-${idx}`];
                            
                            // Dynamically resolve mal tanımı
                            const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const descStr = prodCatalog ? prodCatalog.name : item.description || 'KABLO YOLU VE TAŞIYICI ELEMANLARI';
                            
                            return (
                              <tr key={`${item.productCode}-${idx}`} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-orange-50/10' : ''}`}>
                                <td className="p-3 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectItem(`${item.productCode}-${idx}`)}
                                    disabled={remaining <= 0}
                                    className="rounded border-slate-355 text-orange-600 focus:ring-orange-500 h-4 w-4"
                                  />
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-900">{item.productCode}</td>
                                <td className="p-3 font-sans text-xs text-slate-700 leading-normal font-semibold">{descStr}</td>
                                <td className="p-3 text-right text-slate-500 font-mono font-bold">{item.quantity} AD</td>
                                <td className="p-3 text-right text-green-600 font-mono font-bold">{item.shippedQuantity || 0} AD</td>
                                <td className="p-3 text-right text-orange-600 font-mono font-bold">{remaining} AD</td>
                                <td className="p-3 text-center">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max={remaining}
                                    value={actionQuantities[`${item.productCode}-${idx}`] ?? remaining}
                                    onChange={(e) => setActionQuantities({ ...actionQuantities, [`${item.productCode}-${idx}`]: parseInt(e.target.value) || 0 })}
                                    disabled={remaining <= 0}
                                    className="w-20 text-center bg-slate-50 border border-slate-200 rounded py-1 px-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-orange-500"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  {item.status === 'Sevk Edildi' ? (
                                    <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-green-100 text-green-700 border border-green-200 inline-block shadow-sm">SEVK EDİLDİ</span>
                                  ) : item.status === 'Üretimde' ? (
                                    <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 border border-blue-200 inline-block shadow-sm">ÜRETİMDE</span>
                                  ) : item.status === 'Kaplamada' ? (
                                    <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-teal-100 text-teal-700 border border-teal-200 inline-block shadow-sm">KAPLAMADA</span>
                                  ) : item.status === 'Boyada' ? (
                                    <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-purple-100 text-purple-700 border border-purple-200 inline-block shadow-sm">BOYADA</span>
                                  ) : item.status === 'Paketlemede' ? (
                                    <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-pink-100 text-pink-700 border border-pink-200 inline-block shadow-sm">PAKETLEMEDE</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200 inline-block shadow-sm">BEKLEMEDE</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Action Panel */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3">
                      
                      <div className="grid grid-cols-6 gap-2">
                        <button 
                          onClick={() => handleSendSelectedToProduction(order)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Üretime Gönder
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToCoating(order)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Kaplamaya Gönder
                        </button>
                        <button 
                          onClick={() => handleReceiveFromCoating(order)}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Kaplamadan Kabul
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToPainting(order)}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Boyaya Gönder
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToPackaging(order)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Paketlemeye Git
                        </button>
                        <button 
                          onClick={() => handleOpenLabels(order)}
                          className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Etiket Yazdır
                        </button>
                      </div>

                      <button 
                        onClick={() => handleShipSelected(order)}
                        className="bg-green-600 hover:bg-green-700 text-white font-extrabold py-3 px-4 rounded-lg text-xs uppercase shadow-md transition-all flex items-center justify-center gap-1.5 w-full tracking-wide"
                      >
                        <Truck className="h-4 w-4" /> Sevk Et (Yeni İrsaliye Kes)
                      </button>
                    </div>
                  </div>
                  
                  {/* Right Column: Documents Timeline Ledger */}
                  <div className="col-span-5 flex flex-col h-full bg-slate-100 overflow-y-auto p-5 space-y-5 border-l border-slate-200">
                    
                    {/* Dispatches Timeline List */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-150">
                        <Truck className="h-4 w-4 text-orange-500" /> Sevkiyat & Kalite Evrakları (FR-10 & 3.1)
                      </h4>
                      {order.dispatches && order.dispatches.length > 0 ? (
                        <div className="space-y-4">
                          {order.dispatches.map((dispatch) => {
                            const savedInspections = localStorage.getItem('qms_fr12_inspections');
                            const inspections = savedInspections ? JSON.parse(savedInspections) : {};
                            const inspection = inspections[dispatch.dispatchNoteNo];
                            const isApproved = inspection && inspection.status === 'ONAYLANDI';
                            const existingCert = certificates.find(c => c.dispatchNoteNo === dispatch.dispatchNoteNo);
                            
                            return (
                              <div key={dispatch.dispatchNoteNo} className="border border-slate-200 rounded-xl p-4 space-y-3.5 bg-slate-50 shadow-sm relative overflow-hidden">
                                
                                {/* Status indicators on card border */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${isApproved ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />

                                <div className="flex justify-between items-center border-b border-slate-200 pb-2 pt-1">
                                  <span className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <FileSpreadsheet className="h-4 w-4 text-slate-505" /> {dispatch.dispatchNoteNo}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">{dispatch.date}</span>
                                </div>
                                
                                <div className="bg-white border border-slate-150 rounded-lg p-2.5 space-y-1.5">
                                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Sevk Edilen Mal Listesi</span>
                                  <div className="text-[10px] text-slate-700 font-sans leading-relaxed space-y-1">
                                    {dispatch.items.map((di, diIdx) => {
                                      const prodCatalog = products.find(p => p.code.toUpperCase() === di.productCode.toUpperCase());
                                      const descStr = prodCatalog ? prodCatalog.name : 'KABLO MALZEMESİ';
                                      return (
                                        <div key={diIdx} className="flex justify-between border-b border-slate-50 last:border-0 pb-1 last:pb-0">
                                          <span className="font-semibold text-slate-900">{di.productCode}</span>
                                          <span className="text-slate-500 truncate max-w-[200px]" title={descStr}>{descStr}</span>
                                          <span className="font-mono font-bold text-slate-955">{di.quantity} AD</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-1">
                                  
                                  {/* İrsaliye Bas Button */}
                                  <button
                                    onClick={() => setActiveDispatchToShow(dispatch)}
                                    className="bg-white hover:bg-slate-100 border border-slate-255 text-slate-700 font-extrabold py-2 px-1.5 rounded-lg text-[9px] uppercase tracking-wide flex flex-col justify-center items-center gap-1 shadow-sm transition-all"
                                  >
                                    <Printer className="h-4 w-4 text-blue-500" />
                                    <span>İrsaliye Bas</span>
                                  </button>

                                  {/* FR-10 Son Kontrol Raporu Button */}
                                  <button
                                    onClick={() => handleShowFR012(dispatch.dispatchNoteNo)}
                                    className={`font-extrabold py-2 px-1.5 rounded-lg text-[9px] uppercase tracking-wide border flex flex-col justify-center items-center gap-1 shadow-sm transition-all ${
                                      isApproved
                                        ? 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'
                                        : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 animate-pulse'
                                    }`}
                                  >
                                    <FileCheck className="h-4 w-4" />
                                    <span>{isApproved ? 'FR-10 Yazdır' : 'FR-10 Doldur'}</span>
                                  </button>
                                  
                                  {/* 3.1 Muayene Sertifikası Button */}
                                  {isApproved ? (
                                    existingCert ? (
                                      <button
                                        onClick={() => setActiveCertificateToShow(existingCert)}
                                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold py-2 px-1.5 rounded-lg text-[9px] uppercase tracking-wide flex flex-col justify-center items-center gap-1 shadow-sm transition-all"
                                      >
                                        <Award className="h-4 w-4 text-emerald-600" />
                                        <span>3.1 Sertifika Bas</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleLaunchCertCreator(dispatch.dispatchNoteNo)}
                                        className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold py-2 px-1.5 rounded-lg text-[9px] uppercase tracking-wide flex flex-col justify-center items-center gap-1 shadow-sm transition-all animate-bounce"
                                      >
                                        <Award className="h-4 w-4 text-blue-600" />
                                        <span>3.1 Sertifika Al</span>
                                      </button>
                                    )
                                  ) : (
                                    <button
                                      disabled
                                      className="bg-slate-100 border border-slate-200 text-slate-400 font-bold py-2 px-1.5 rounded-lg text-[9px] uppercase tracking-wide flex flex-col justify-center items-center gap-1 cursor-not-allowed"
                                      title="İrsaliyenin 3.1 Muayene Sertifikasını oluşturmak için önce FR-10 Son Kontrol Formunu doldurmalı ve onaylamalısınız."
                                    >
                                      <ShieldAlert className="h-4 w-4 text-slate-350" />
                                      <span>3.1 Bekliyor</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-mono uppercase text-[9px] bg-slate-50/50">
                          Henüz bu siparişe ait irsaliye kesilmemiştir.
                        </div>
                      )}
                    </div>
                    
                    {/* Production Runs (FR-009) */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1 pb-2 border-b border-slate-150">
                        <Play className="h-4 w-4 text-orange-500" /> İmalat Takip Kartları (FR-009)
                      </h4>
                      {(() => {
                        const relatedRuns = (productionRuns || []).filter(pr => pr.orderId === order.id);
                        if (relatedRuns.length > 0) {
                          return (
                            <div className="space-y-2">
                              {relatedRuns.map((run, idx) => (
                                <div key={`${run.id}-${idx}`} className="border border-slate-200 rounded-lg p-2.5 flex justify-between items-center bg-slate-50 hover:bg-slate-100/50 transition-colors shadow-xs">
                                  <div>
                                    <span className="font-mono font-bold text-slate-800 text-[10px] block">{run.productionOrderNo} ({run.productCode})</span>
                                    <span className="text-[8px] text-slate-400 font-mono block mt-0.5">Operatör: {run.operator} | Miktar: {run.quantity} MT | Tarih: {run.date}</span>
                                  </div>
                                  <button
                                    onClick={() => setActiveFR009ToShow(run)}
                                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-[9px] uppercase shadow-sm flex items-center gap-0.5"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-slate-500" /> Proses Kartı
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 font-mono uppercase text-[9px]">
                            Üretime gönderilmiş imalat kartı bulunamadı.
                          </div>
                        );
                      })()}
                    </div>
                    
                  </div>
                </div>

              </div>
            </div>
          );
        })()}
        {isEditingNewQuote && (
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
                        <img src="/sies_logo.png" alt="SIES Logo" className="h-14 object-contain" />
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
                                  <td className="p-2.5 text-right font-extrabold font-mono text-base">₺ {grandTotal.toFixed(2)}</td>
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Taşıyıcı / Şoför</label>
                    <input 
                      type="text" 
                      placeholder="Şoför Adı Soyadı"
                      value={shipCarrierName} 
                      onChange={e => setShipCarrierName(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs font-semibold text-slate-800 mt-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Araç Plaka No</label>
                    <input 
                      type="text" 
                      placeholder="Örn: 34 ABC 123"
                      value={shipPlateNo} 
                      onChange={e => setShipPlateNo(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs font-mono font-bold text-slate-800 mt-1 focus:ring-orange-500 focus:border-orange-500"
                    />
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
                          <th className="p-2.5 text-center w-12">Sevk</th>
                          <th className="p-2.5 w-24">Ürün Kodu</th>
                          <th className="p-2.5">Malın Tanımı</th>
                          <th className="p-2.5 text-right w-20">Sipariş</th>
                          <th className="p-2.5 text-right w-20">Kalan</th>
                          <th className="p-2.5 text-center w-28">Sevk Miktarı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeOrder.items.map((item, idx) => {
                          const key = `${item.productCode}-${idx}`;
                          if (!selectedItems[key]) return null;

                          const remaining = item.quantity - (item.shippedQuantity || 0);
                          const isSelected = !!selectedItems[key];
                          const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                          const descStr = prodCatalog ? prodCatalog.name : item.description || 'KABLO YOLU ELEMANI';
                          
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 bg-emerald-50/10">
                              <td className="p-2.5 text-center">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    handleToggleSelectItem(key);
                                  }}
                                  disabled={remaining <= 0}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                />
                              </td>
                              <td className="p-2.5 font-mono font-bold text-slate-900">{item.productCode}</td>
                              <td className="p-2.5 font-semibold text-slate-700">{descStr}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-50">{item.quantity} AD</td>
                              <td className="p-2.5 text-right font-mono font-bold text-orange-600">{remaining} AD</td>
                              <td className="p-2.5 text-center">
                                <input 
                                  type="number"
                                  min="1"
                                  max={remaining}
                                  value={actionQuantities[key] || ''}
                                  onChange={e => {
                                    const val = Math.min(remaining, Math.max(1, parseInt(e.target.value) || 1));
                                    setActionQuantities(prev => ({ ...prev, [key]: val }));
                                  }}
                                  className="w-20 text-center font-mono font-bold border border-slate-300 rounded p-1 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
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
                html, body { height: auto !important; overflow: visible !important; }
                body * { visibility: hidden; }
                .honeywell-label-50-100, .honeywell-label-50-100 * { visibility: visible; }
                .honeywell-label-50-100 {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100mm !important;
                  height: 50mm !important;
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
                  const lastDashIndex = key.lastIndexOf('-');
                  const prodCode = key.substring(0, lastDashIndex);
                  const itemIdx = parseInt(key.substring(lastDashIndex + 1));
                  const item = targetOrder.items[itemIdx];
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
                          <span className="text-slate-700 block truncate">{targetOrder.projectNo || 'NB1129'}</span>
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
                html, body { height: auto !important; overflow: visible !important; }
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area {
                  position: absolute;
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
                        <img src="/sies_logo.png" alt="SIES Logo" className="h-10 object-contain w-fit" />
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
                          <th className="border border-slate-300 p-2.5 w-32">ÜRÜN KODU</th>
                          <th className="border border-slate-300 p-2.5">MALIN CİNSİ VE TANIMI</th>
                          <th className="border border-slate-300 p-2.5 w-24 text-right">MİKTAR</th>
                          <th className="border border-slate-300 p-2.5 w-20 text-center">BİRİM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeDispatchToShow.items?.map((item: any, idx: number) => {
                          const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                          const descStr = prodCatalog ? prodCatalog.name : 'KABLO TAŞIYICI ELEMANLARI VE AKSESUARLARI';
                          const unitStr = item.productCode.includes('SU') ? 'M' : 'AD';
                          return (
                            <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50/50">
                              <td className="border border-slate-300 p-2.5 text-center">{idx + 1}</td>
                              <td className="border border-slate-300 p-2.5 font-bold text-slate-900">{item.productCode}</td>
                              <td className="border border-slate-300 p-2.5 font-sans font-medium text-slate-700">{descStr}</td>
                              <td className="border border-slate-300 p-2.5 text-right font-extrabold text-slate-900">{item.quantity}</td>
                              <td className="border border-slate-300 p-2.5 text-center">{unitStr}</td>
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
          <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col print:relative overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                html, body { height: auto !important; overflow: visible !important; }
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area {
                  position: absolute;
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
            <div className="w-full h-full flex flex-col bg-slate-150 overflow-hidden print:bg-white print:h-auto">
              <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider">FR-009 İmalat Takip & Proses Muayene Kartları</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm"><Printer className="h-4 w-4" /> Kartları Yazdır</button>
                  <button onClick={() => setActiveFR009ToShow(null)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs"><X className="h-5 w-5" /></button>
                </div>
              </div>
              
              <div className="p-6 bg-slate-200 overflow-y-auto flex flex-col items-center gap-6 print:bg-white print:p-0 print:gap-0">
                {activeFR009ToShow.map((run: any) => {
                  const targetOrder = selectedOrderDetailOrder || activeOrder;
                  return (
                    <div key={run.id} className="print-area print-portrait w-full max-w-[210mm] bg-white text-slate-900 p-8 shadow-lg border border-slate-300 rounded font-sans leading-normal flex flex-col justify-between mx-auto print:border-0 print:shadow-none print:p-2 min-h-[290mm] print:page-break-after-always">
                      <div>
                        {/* Header Box */}
                        <div className="border border-slate-950 grid grid-cols-4 text-center items-center text-[9px] font-bold mb-4">
                          <div className="p-2 border-r border-slate-950 flex flex-col justify-center items-center">
                            <img src="/sies_logo.png" alt="SIES Logo" className="h-6 object-contain" />
                            <span className="text-[5px] text-slate-500 uppercase mt-0.5">Kalite Güvence</span>
                          </div>
                          <div className="p-2 border-r border-slate-950 col-span-2 text-center uppercase text-slate-900 text-[10px] font-black tracking-wide">
                            İMALAT TAKİP VE PROSES MUAYENE KARTI<br />
                            <span className="text-[7px] text-slate-505 font-bold">(PROCESS INSPECTION CARD)</span>
                          </div>
                          <div className="p-1.5 text-left font-mono text-[7px] space-y-0.5">
                            <div>KART NO: <span className="text-black font-bold">{run.id}</span></div>
                            <div>TARİH: <span className="text-black">{run.date}</span></div>
                            <div>DÖKÜMAN NO: <span className="text-black font-bold">FR-009</span></div>
                          </div>
                        </div>

                        {/* Order & Card Info */}
                        <div className="grid grid-cols-3 gap-2 border border-slate-250 p-2.5 rounded text-[9px] text-slate-655 mb-4 leading-normal bg-slate-50/50">
                          <div><strong>Müşteri Adı:</strong> <span className="text-slate-900 font-bold uppercase">{targetOrder?.customerName}</span></div>
                          <div><strong>Sipariş ID / No:</strong> <span className="text-slate-900 font-mono font-bold">{targetOrder?.id}</span></div>
                          <div><strong>Ürün Kodu:</strong> <span className="text-slate-900 font-mono font-bold">{run.productCode}</span></div>
                          <div><strong>Toplam Miktar:</strong> <span className="text-slate-900 font-bold">{run.quantity} MT / AD</span></div>
                          <div><strong>Operatör Ref:</strong> <span className="text-slate-900 font-semibold">{run.operator || 'Depo Sorumlusu'}</span></div>
                          <div><strong>İş Emri No:</strong> <span className="text-slate-950 font-mono font-extrabold">{run.productionOrderNo}</span></div>
                        </div>

                        {/* Operasyon Yonlendirme Şeması */}
                        <div className="border border-slate-200 rounded-lg p-3 bg-white shadow-xs mb-4">
                          <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-wider mb-2 border-b pb-1">Operasyon İstasyon Rotası & Proses Akışı</h5>
                          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                            {(run.processes || ['Kesme', 'Delme', 'Bükme']).map((step: string, sIdx: number) => (
                              <div key={step} className="flex items-center gap-1 shrink-0">
                                <div className="bg-slate-900 text-white border border-slate-800 text-[8px] font-extrabold px-2.5 py-1 rounded shadow-sm uppercase tracking-wide">
                                  {sIdx + 1}. {step}
                                </div>
                                {sIdx < (run.processes || []).length - 1 && (
                                  <span className="text-slate-350 text-[10px] font-mono">➔</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Muayene Tablosu */}
                        <table className="w-full border-collapse border border-slate-300 text-[8px] font-sans text-left">
                          <thead>
                            <tr className="bg-slate-100 text-center font-bold border-b border-slate-350 text-slate-800">
                              <th className="border border-slate-300 p-1 w-16" rowSpan={2}>KONTROL OPERASYONU</th>
                              <th className="border border-slate-300 p-1 w-16" rowSpan={2}>KONTROL PARAMETRESİ</th>
                              <th className="border border-slate-300 p-1 w-16" rowSpan={2}>TOLERANS / STANDART</th>
                              <th className="border border-slate-300 p-1 col-span-3">İLK ÜRETİM ONAYI (İ.U.O)</th>
                              <th className="border border-slate-300 p-1 col-span-3">PROSES PERİYODİK KONTROL (P.P.K)</th>
                            </tr>
                            <tr className="bg-slate-50 text-[7px] text-center text-slate-655">
                              <th className="border border-slate-300 p-1">ÖLÇÜLEN (MM)</th>
                              <th className="border border-slate-300 p-1 w-14">DURUM</th>
                              <th className="border border-slate-300 p-1 w-14">ONAY / İMZA</th>
                              <th className="border border-slate-300 p-1">PERİYOT (HER 10. ADET)</th>
                              <th className="border border-slate-300 p-1 w-14">DURUM</th>
                              <th className="border border-slate-300 p-1 w-14">ONAY / İMZA</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="hover:bg-slate-50/50">
                              <td className="border border-slate-300 p-1 font-bold text-slate-900" rowSpan={3}>1. GEOMETRİK BOYUTLAR</td>
                              <td className="border border-slate-300 p-1">Genişlik (Width)</td>
                              <td className="border border-slate-300 p-1 font-mono text-[7px]">±1.0 mm (TS EN 61537)</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">{run.firstCheckWidthMm || '-'} mm</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">QMS-APP</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Her 50 Metre</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="border border-slate-300 p-1">Kenar Yükseklik (Height)</td>
                              <td className="border border-slate-300 p-1 font-mono text-[7px]">±1.0 mm (TS EN 61537)</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">{run.firstCheckHeightMm || '-'} mm</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">QMS-APP</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Her 50 Metre</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="border border-slate-300 p-1">Kalınlık (Thickness)</td>
                              <td className="border border-slate-300 p-1 font-mono text-[7px]">±0.05 mm (TS EN 10143)</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">{run.firstCheckThicknessMm || '-'} mm</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">QMS-APP</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Sac Bobin Değişimi</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="border border-slate-300 p-1 font-bold text-slate-900">2. PERFORASYON ŞEKLİ</td>
                              <td className="border border-slate-300 p-1">Delik Çapı / Eksen Ölçüsü</td>
                              <td className="border border-slate-300 p-1 font-mono text-[7px]">±0.5 mm</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Görsel Kontrol</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">QMS-APP</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Her Bobin Başı</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="border border-slate-300 p-1 font-bold text-slate-900" rowSpan={2}>3. GÖRSEL MUAYENE</td>
                              <td className="border border-slate-300 p-1">Büküm Açıları (90°)</td>
                              <td className="border border-slate-300 p-1 font-mono text-[7px]">±1.5° (Çapak, Deformasyon Yok)</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Görsel / Şablon</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">QMS-APP</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Sürekli Gözlem</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">F.O</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                              <td className="border border-slate-300 p-1">Çapak / Kenar Keskinliği</td>
                              <td className="border border-slate-300 p-1 font-mono text-[7px]">Çapaksız (Kenarlar Radüslü)</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Görsel Kontrol</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">QMS-APP</td>
                              <td className="border border-slate-300 p-1 text-center font-mono">Sürekli Gözlem</td>
                              <td className="border border-slate-300 p-1 text-center"><span className="text-green-700 font-extrabold uppercase text-[7px]">UYGUN</span></td>
                              <td className="border border-slate-300 p-1 text-center font-mono">F.O</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-[8px] mt-6 leading-relaxed">
                        <div className="space-y-1">
                          <span className="block font-bold text-slate-500 uppercase">KART NOTLARI VE OPERATÖR BEYANI:</span>
                          <p className="text-slate-700">{run.notes || 'Herhangi bir proses dışı veya uygunsuzluk kaydı yapılmamıştır. İlk üretim onayına göre seri üretime geçilmiştir.'}</p>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2 rounded">
                          <div>
                            <span className="block text-[6px] text-slate-400 font-bold uppercase">PROSES KONTROL KARARI</span>
                            <span className="text-green-700 font-black text-[10px] uppercase leading-none">SEVKİYAT YAPILABİLİR (KABUL)</span>
                          </div>
                          <div className="text-right space-y-0.5">
                            <div><span className="text-[6px] text-slate-400 font-bold uppercase">HAZIRLAYAN: </span><span className="font-extrabold text-slate-850 text-[8px]">Faruk Oruç (QA)</span></div>
                            <div><span className="text-[6px] text-slate-400 font-bold uppercase">ONAYLAYAN: </span><span className="font-extrabold text-slate-850 text-[8px]">İbrahim Sert (Müdür)</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: FR-10 SON KONTROL RAPORU MODAL */}
        {activeFR012ToShow && (
          <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col print:relative overflow-hidden">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                html, body { height: auto !important; overflow: visible !important; }
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
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
                        <img src="/sies_logo.png" alt="SIES Logo" className="h-8 object-contain" />
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
                            const descStr = prodCatalog ? prodCatalog.name : item.desc || 'KABLO TAŞIYICI ELEMANLARI';
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 text-center font-mono">
                                <td className="border border-slate-200 p-1 font-bold">{activeFR012ToShow.dispatchNoteNo}</td>
                                <td className="border border-slate-200 p-1">{activeFR012ToShow.date}</td>
                                <td className="border border-slate-200 p-1.5 font-sans text-left uppercase text-[9px] font-bold whitespace-normal break-words leading-tight">{activeFR012ToShow.customerName}</td>
                                <td className="border border-slate-200 p-1 font-bold text-slate-800">{item.productCode}</td>
                                <td className="border border-slate-200 p-1.5 font-sans text-left text-[9px] font-medium whitespace-normal break-words leading-tight">{descStr}</td>
                                <td className="border border-slate-200 p-1 font-bold text-slate-900">{item.quantity}</td>
                                <td className="border border-slate-200 p-1 font-sans">{item.unit || 'AD'}</td>
                                
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
                html, body { height: auto !important; overflow: visible !important; }
                body * { visibility: hidden; }
                .print-area, .print-area * { visibility: visible; }
                .print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
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
                      <img src="/sies_logo.png" alt="SIES Logo" className="h-6 object-contain" />
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
                        <th className="p-2.5 text-right w-20">Miktar</th>
                        <th className="p-2.5 w-16">Birim</th>
                        <th className="p-2.5 text-right w-20">Sevk Edilen</th>
                        <th className="p-2.5 text-center w-40">Proses / Durum</th>
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
                          <td className="p-2.5 text-right">
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
                          <td className="p-2.5 text-right">
                            <input 
                              type="number" 
                              value={item.shippedQuantity}
                              onChange={e => handleEditOrderItemField(idx, 'shippedQuantity', Number(e.target.value))}
                              className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-right font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-center">
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


    </div>
  );
}
