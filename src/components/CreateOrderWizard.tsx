import React, { useState } from 'react';
import { 
  Building, 
  Cpu, 
  RefreshCw, 
  Truck, 
  Check, 
  Plus, 
  Package, 
  Trash2, 
  X,
  ShoppingCart
} from 'lucide-react';
import { Customer, Order, Product, generateNextOrderNumber, useQms, YANDEX_DISK_URL } from '@/context/QmsContext';
import * as XLSX from 'xlsx';
import { cleanCodeAndDesc, parsePdfTextToItems, normalizeUnit, isFooterOrSummaryLine, cleanFooterFromDesc, extractBestQtyAndUnit } from '@/utils/orderParser';

const DEFAULT_COATINGS = [
  'Sıcak Daldırma Galvaniz (HDG)',
  'Elektro Galvaniz (EG)',
  'Pre-Galvaniz (PG)',
  'Paslanmaz 304 (AISI 304)',
  'Paslanmaz 316 (AISI 316)',
  'Elektrostatik Boyalı',
  'Kaplamasız / Ham'
];

const DEFAULT_DELIVERY_TYPES = [
  'AMBAR İLE SEVK',
  'FABRİKA TESLİM',
  'MÜŞTERİ ARACI İLE',
  'ADRESE TESLİM (ŞİRKET ARACI)',
  'KARGO İLE SEVK'
];

const DEFAULT_SHIPPING_FEES = [
  'Müşteriye Ait (Alıcı Ödemeli)',
  'Firmamıza Ait (Satıcı Ödemeli)',
  'Fiyata Dahil'
];

const DEFAULT_UNITS = [
  'ADET',
  'METRE',
  'BOY',
  'KG',
  'SET',
  'TAKIM',
  'PCS',
  'PAKET'
];

const getStoredList = (key: string, defaultItems: string[]) => {
  if (typeof window === 'undefined') return defaultItems;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(defaultItems));
      return defaultItems;
    }
    const parsed = JSON.parse(saved);
    return Array.from(new Set([...defaultItems, ...parsed]));
  } catch {
    return defaultItems;
  }
};

const saveToStoredList = (key: string, newItem: string, defaultItems: string[]) => {
  if (!newItem || !newItem.trim()) return;
  const cleanItem = newItem.trim();
  const currentList = getStoredList(key, defaultItems);
  if (!currentList.some(item => item.toUpperCase() === cleanItem.toUpperCase())) {
    const updated = [...currentList, cleanItem];
    localStorage.setItem(key, JSON.stringify(updated));
  }
};

interface CreateOrderWizardProps {
  customers: Customer[];
  orders: Order[];
  products: Product[];
  addProduct: (product: Product) => void;
  addCustomer: (customer: Customer) => void;
  addOrder: (order: Order) => void;
  updateOrder?: (id: string, updatedOrder: Partial<Order>) => void;
  editingOrder?: Order | null;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  onClose: () => void;
  onOrderCreated: (newOrderId: string) => void;
}

export const CreateOrderWizard: React.FC<CreateOrderWizardProps> = ({
  customers,
  orders,
  products,
  addProduct,
  addCustomer,
  addOrder,
  updateOrder,
  editingOrder,
  geminiApiKey,
  setGeminiApiKey,
  onClose,
  onOrderCreated,
}) => {
  const { currentUser } = useQms();
  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic Master Lists Loaded from localStorage
  const [coatingOptions, setCoatingOptions] = useState<string[]>(() => getStoredList('qms_coating_types', DEFAULT_COATINGS));
  const [deliveryTypeOptions, setDeliveryTypeOptions] = useState<string[]>(() => getStoredList('qms_delivery_types', DEFAULT_DELIVERY_TYPES));
  const [shippingFeeOptions, setShippingFeeOptions] = useState<string[]>(() => getStoredList('qms_shipping_fees', DEFAULT_SHIPPING_FEES));
  const [unitOptions, setUnitOptions] = useState<string[]>(() => getStoredList('qms_unit_types', DEFAULT_UNITS));

  const [coCustomerId, setCoCustomerId] = useState<string>('');
  const [coCustomerName, setCoCustomerName] = useState<string>('');
  const [coSiesNo, setCoSiesNo] = useState<string>('');
  const [coOrderNo, setCoOrderNo] = useState<string>('');
  const [coProjectNo, setCoProjectNo] = useState<string>('');
  const [coOrderDate, setCoOrderDate] = useState<string>(todayStr);
  const [coDeliveryDate, setCoDeliveryDate] = useState<string>('');
  const [coCoatingType, setCoCoatingType] = useState<string>('Sıcak Daldırma Galvaniz (HDG)');
  const [coDeliveryType, setCoDeliveryType] = useState<string>('AMBAR İLE SEVK');
  const [coDeliveryDetail, setCoDeliveryDetail] = useState<string>('');
  const [coShippingAddress, setCoShippingAddress] = useState<string>('');
  const [coShippingFee, setCoShippingFee] = useState<string>('Müşteriye Ait (Alıcı Ödemeli)');
  const [coNotes, setCoNotes] = useState<string>('');
  const [coIsExempt, setCoIsExempt] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('USD');

  // Populate initial values ONCE when opening or switching editingOrder (Do NOT re-run on polling updates!)
  React.useEffect(() => {
    if (editingOrder) {
      const cust = customers.find(c => c.name.toUpperCase().trim() === (editingOrder.customerName || '').toUpperCase().trim());
      setCoCustomerId(cust?.id || '');
      setCoCustomerName(editingOrder.customerName || '');
      setCoSiesNo(editingOrder.id || '');
      setCoOrderNo(editingOrder.customerOrderNo || editingOrder.id || '');
      setCoProjectNo(editingOrder.projectNo || '');
      setCoOrderDate(editingOrder.date || todayStr);
      setCoDeliveryDate(editingOrder.deliveryDate || '');
      setCoCoatingType(editingOrder.coatingTypes?.[0] || 'Sıcak Daldırma Galvaniz (HDG)');
      setCoDeliveryType(editingOrder.deliveryType || 'AMBAR İLE SEVK');
      setCoDeliveryDetail(editingOrder.deliveryDetail || '');
      setCoShippingAddress(editingOrder.shippingAddress || '');
      setCoShippingFee(editingOrder.shippingFee || 'Müşteriye Ait (Alıcı Ödemeli)');
      setCoNotes(editingOrder.notes || '');
      setCoIsExempt(editingOrder.isExempt || false);
      setCoOriginalFileUrl(editingOrder.originalFileUrl || editingOrder.attachedFileLink || '');
      setCoOriginalFileName(editingOrder.originalFileName || editingOrder.attachedFileName || '');
      setCoExternalCloudLink(editingOrder.externalCloudLink || '');
      if (editingOrder.items && editingOrder.items.length > 0) {
        setCoItems(editingOrder.items.map((it, idx) => ({
          id: 'item-edit-' + idx + '-' + Date.now(),
          productCode: it.productCode || '',
          productName: it.description || it.productCode || '',
          description: it.description || it.productCode || '',
          quantity: it.quantity || 1,
          unit: it.unit || 'ADET',
          price: it.price || 0
        })));
      }
    } else {
      const nextId = generateNextOrderNumber(orders);
      setCoSiesNo(nextId);
    }
  }, [editingOrder?.id]);

  // AI Scanner state
  const [coAiScanning, setCoAiScanning] = useState<boolean>(false);
  const [coAiLogs, setCoAiLogs] = useState<string[]>([]);
  const [coOriginalFileUrl, setCoOriginalFileUrl] = useState<string>('');
  const [coOriginalFileName, setCoOriginalFileName] = useState<string>('');
  const [coExternalCloudLink, setCoExternalCloudLink] = useState<string>('');


  // Items State
  const [coItems, setCoItems] = useState<Array<{
    id: string;
    productCode: string;
    productName: string;
    description?: string;
    quantity: number;
    unit: string;
    price: number;
    sfiNo?: string;
    notes?: string;
  }>>([]);

  // Manual New Item State
  const [newItemCode, setNewItemCode] = useState<string>('');
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<string>('ADET');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);

  // Auto-correct items if productCode was assigned a sequence number (1, 2, 3, 4...)
  const handleAutoFixItems = () => {
    setCoItems(prev => prev.map((item) => {
      let pCode = String(item.productCode || '').trim();
      let pName = String(item.productName || item.description || '').trim();

      if (/^\d{1,3}$/.test(pCode)) {
        if (pName && !/^\d{1,3}$/.test(pName)) {
          pCode = pName;
        }
      }

      if (!pName || /^\d{1,3}$/.test(pName)) {
        pName = pCode;
      }

      return {
        ...item,
        productCode: pCode.toUpperCase(),
        productName: pName.toUpperCase(),
        description: pName.toUpperCase()
      };
    }));
  };

  React.useEffect(() => {
    if (coItems.some(item => /^\d{1,3}$/.test(String(item.productCode || '').trim()) && item.productName && !/^\d{1,3}$/.test(String(item.productName).trim()))) {
      handleAutoFixItems();
    }
  }, [coItems]);

  // Form reset handler
  const resetForm = () => {
    setCoCustomerId('');
    setCoCustomerName('');
    setCoOrderNo('');
    setCoProjectNo('');
    setCoOrderDate(todayStr);
    setCoDeliveryDate('');
    setCoCoatingType('Sıcak Daldırma Galvaniz');
    setCoDeliveryType('AMBAR İLE SEVK');
    setCoDeliveryDetail('');
    setCoShippingAddress('');
    setCoShippingFee('Müşteriye Ait');
    setCoNotes('');
    setCoIsExempt(false);
    setCoOriginalFileUrl('');
    setCoOriginalFileName('');
    setCoExternalCloudLink('');
    setCoItems([]);
    setCoAiLogs([]);
    setNewItemCode('');
    setNewItemName('');
    setNewItemQty(1);
    setNewItemUnit('ADET');
    setNewItemPrice(0);
  };

  // Add Item Row
  const handleAddManualItem = () => {
    if (!newItemCode && !newItemName) {
      alert('Lütfen en azından bir Ürün Kodu veya Ürün Tanımı girin.');
      return;
    }
    setCoItems(prev => [
      ...prev,
      {
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        productCode: newItemCode || 'KOD-YOK',
        productName: newItemName || newItemCode,
        description: newItemName,
        quantity: newItemQty || 1,
        unit: newItemUnit || 'ADET',
        price: newItemPrice || 0,
      }
    ]);
    setNewItemCode('');
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice(0);
  };

  // Update Item Row
  const updateCoItem = (id: string, field: string, value: any) => {
    setCoItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Remove Item Row
  const removeCoItemRow = (id: string) => {
    setCoItems(prev => prev.filter(item => item.id !== id));
  };

  // Read and Extract PDF files
  const readAndExtractPdf = (file: File) => {
    setCoAiLogs(prev => [...prev, `[PDF] PDF.js ile görsel koordinat analizi başlatılıyor...`]);
    const reader = new FileReader();
    reader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          setCoAiLogs(prev => [...prev, `[HATA] PDF.js kütüphanesi yüklenemedi.`]);
          setCoAiScanning(false);
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
        
        // If extracted text is empty or under 20 chars, it is a scanned image PDF -> fallback to Canvas OCR
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
              parseTextAndFill(file.name);
              setCoAiScanning(false);
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
              parseTextAndFill(text);
              setCoAiScanning(false);
            }).catch((err: any) => {
              console.error("Canvas OCR error:", err);
              parseTextAndFill(file.name);
              setCoAiScanning(false);
            });
          };

          if (typeof window !== 'undefined' && !(window as any).Tesseract) {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.0.2/tesseract.min.js";
            script.onload = () => runCanvasOcr(canvas);
            script.onerror = () => {
              parseTextAndFill(file.name);
              setCoAiScanning(false);
            };
            document.head.appendChild(script);
          } else {
            runCanvasOcr(canvas);
          }
          return;
        }

        setCoAiLogs(prev => [...prev, `[PDF BAŞARILI] Metin başarıyla okundu (${cleanedText.length} karakter).`]);
        parseTextAndFill(cleanedText);
        setCoAiScanning(false);
      } catch (err: any) {
        console.error("PDF extraction error:", err);
        setCoAiLogs(prev => [...prev, `[HATA] PDF okuma hatası: ${err.message || err}`]);
        parseTextAndFill(file.name);
        setCoAiScanning(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Parse Text and Fill Form (PDF / Text extraction)
  const parseTextAndFill = (text: string) => {
    try {
      const textUpper = norm(text);
      let detectedCustomer = '';
      let detectedOrderNo = '';
      let detectedProjectNo = '';
      let detectedDeliveryDate = '';
      let detectedOrderDate = '';
      let extractedItems: any[] = [];

      // 1. Customer detection
      if (textUpper.includes('CEMRE')) detectedCustomer = 'CEMRE TERSANECİLİK SAN. VE TİC. A.Ş.';
      else if (textUpper.includes('DEARSAN')) detectedCustomer = 'DEARSAN GEMİ İNŞAAT SANAYİ A.Ş.';
      else if (textUpper.includes('MARINI') || textUpper.includes('FAYAT')) detectedCustomer = 'MARİNİ MAKİNA A.Ş.';
      else if (textUpper.includes('ASELSAN')) detectedCustomer = 'Aselsan Elektronik Sanayi A.Ş.';
      else if (textUpper.includes('TERSAN')) detectedCustomer = 'Tersan Tersanecilik A.Ş.';
      else if (textUpper.includes('NORSE')) detectedCustomer = 'NORSE SHIPBUILDING';
      else {
        const custMatch = text.match(/(?:MÜŞTERİ|MUSTERI|FİRMA|FIRMA|ALICI|SİPARİŞİ VEREN)\s*[:\-\s]\s*([^\n\r]{3,60})/i);
        if (custMatch) detectedCustomer = custMatch[1].trim();
      }

      // 2. Order No detection (Tersan PO format: "407012 NOLU SATINALMA SİPARİŞİ", "S01234", "SİPARİŞ NO: 407012")
      const tersanMatch = text.match(/\b([A-Z0-9\-\/]{4,20})\s+(?:NOLU|NO'LU|NUMARALI)\s+(?:SATINALMA\s+)?SİPARİŞ/i) || text.match(/\b(\d{5,10})\s+(?:NOLU|NO'LU|NUMARALI)/i);
      const sMatch = text.match(/(S\d{5})/i);
      const orderNoMatch = text.match(/(?:SİPARİŞ NO|SIPARIS NO|TEKLİF NO|TALEP NO|ORDER NO|PO NO)\s*[:\-\s]*([A-Z0-9\-\/]{4,20})/i) || text.match(/\b(2026\d{4,6})\b/);

      if (tersanMatch) {
        detectedOrderNo = tersanMatch[1].toUpperCase();
      } else if (sMatch) {
        detectedOrderNo = sMatch[1].toUpperCase();
      } else if (orderNoMatch) {
        detectedOrderNo = orderNoMatch[1].trim().toUpperCase();
      }

      // 3. Project No detection (e.g. NB1123, NB1099)
      const nbMatch = text.match(/(NB\d{3,5}[A-Z]?)/i);
      if (nbMatch) {
        detectedProjectNo = nbMatch[1].toUpperCase();
      } else {
        const prjMatch = text.match(/(?:PROJE|PROJECT|PROJE NO|PROJE ID)\s*[:\-\s]*([A-Z0-9-]{3,20})/i);
        if (prjMatch && norm(prjMatch[1]) !== 'PROJE' && norm(prjMatch[1]) !== 'PROJECT') {
          detectedProjectNo = prjMatch[1].trim();
        }
      }

      // 4. Dates detection
      const deliveryMatch = text.match(/(?:TESLİMAT|TESLIMAT|TESLİM|DELIVERY|TERMİN)\s*(?:TARİHİ|TARIHI|TARİH|TARIH)?\s*[:\-\s]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i);
      if (deliveryMatch) {
        const parts = deliveryMatch[1].split(/[\.\/]/);
        detectedDeliveryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      const orderMatch = text.match(/(?:SİPARİŞ|SIPARIS|ORDER|TEKLİF)\s*(?:TARİHİ|TARIHI|TARİH|TARIH)?\s*[:\-\s]*(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/i);
      if (orderMatch) {
        const parts = orderMatch[1].split(/[\.\/]/);
        detectedOrderDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }

      // 5. Line items extraction using orderParser
      const pdfParseResult = parsePdfTextToItems(text);
      extractedItems = pdfParseResult.items;
      if (!detectedProjectNo && pdfParseResult.detectedProjectNo) {
        detectedProjectNo = pdfParseResult.detectedProjectNo;
      }

      // Segment-based fallback if 0 items were matched line-by-line
      if (extractedItems.length === 0) {
        const itemRegex = /\b([A-Z0-9\/-]{3,20})\s+([^0-9\n\r]{3,50})\s+(\d+(?:[\.,]\d+)?)\s*(ADET|AD|MT|M|METRE|KG|SET|TAKIM|PCS)\b/gi;
        let match;
        while ((match = itemRegex.exec(text)) !== null) {
          const qty = parseFloat(match[3].replace(',', '.'));
          const pCode = match[1].toUpperCase();
          const pDesc = match[2].trim().toUpperCase();
          if (qty > 0 && !norm(pDesc).includes('AÇIKLAMA') && !pCode.startsWith('TR9') && !pDesc.includes('IBAN')) {
            extractedItems.push({
              id: 'item-seg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              productCode: pCode,
              productName: pDesc,
              description: pDesc,
              quantity: qty,
              unit: match[4].toUpperCase() === 'AD' ? 'ADET' : match[4].toUpperCase(),
              price: 0,
            });
          }
        }
      }

      if (detectedCustomer) {
        setCoCustomerName(detectedCustomer);
        const existingCust = customers.find(c => c.name.toUpperCase().includes(detectedCustomer.toUpperCase()));
        if (existingCust) {
          setCoCustomerId(existingCust.id);
          if (existingCust.address) setCoShippingAddress(existingCust.address);
        }
      }
      if (detectedOrderNo) setCoOrderNo(detectedOrderNo);
      if (detectedProjectNo) setCoProjectNo(detectedProjectNo);
      if (detectedDeliveryDate) setCoDeliveryDate(detectedDeliveryDate);
      if (detectedOrderDate) setCoOrderDate(detectedOrderDate);
      if (extractedItems.length > 0) setCoItems(extractedItems);

      setCoAiLogs(prev => [
        ...prev, 
        `[TAMAMLANDI] Müşteri: "${detectedCustomer || 'Belirtilmedi'}", Sipariş No: "${detectedOrderNo || 'Otomatik'}", Proje: "${detectedProjectNo || '-'}", Kalem: ${extractedItems.length}`
      ]);
    } catch (e: any) {
      console.error(e);
      setCoAiLogs(prev => [...prev, `[UYARI] Metin işleme hatası: ${e.message}`]);
    }
  };

  // Helper to normalize Turkish characters for robust string comparisons
  const norm = (str: any) => String(str || '')
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/I/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .trim();

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

  // Read and Extract Excel files
  const readAndExtractExcel = (file: File) => {
    setCoAiLogs(prev => [...prev, `[EXCEL] SheetJS ile dosya analiz ediliyor...`]);
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        let excelItems: any[] = [];
        let detectedCustomer = '';
        let detectedOrderNo = '';
        let detectedProjectNo = '';
        let detectedDeliveryDate = '';

        const normStr = (str: any): string => norm(str);
        const isFooterRow = (str: string): boolean => isFooterOrSummaryLine(str) || normStr(str).includes('MALZ-KOD');

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

                if (!detectedCustomer) {
                  if (cellUpper.includes('NEVA')) detectedCustomer = 'NEVA ROBOTİCS SAN. VE TİC. A.Ş.';
                  else if (cellUpper.includes('AKSİYON') || cellUpper.includes('AKSIYON')) detectedCustomer = 'AKSİYON ROBOTİK SAN. TİC. A.Ş.';
                  else if (cellUpper.includes('AZURİNE') || cellUpper.includes('AZURINE')) detectedCustomer = 'AZURİNE YATÇILIK DANIŞMANLIK TURİZM VE TİC. A.Ş.';
                  else if (cellUpper.includes('DEARSAN')) detectedCustomer = 'DEARSAN GEMİ İNŞAAT SANAYİ A.Ş.';
                  else if (cellUpper.includes('TERSAN')) detectedCustomer = 'TERSAN TERSANECİLİK SAN. VE TİC. A.Ş.';
                  else if (cellUpper.includes('MARINI') || cellUpper.includes('MARİNİ')) detectedCustomer = 'MARİNİ MAKİNA A.Ş.';
                  else if (cellUpper.includes('ASELSAN')) detectedCustomer = 'ASELSAN ELEKTRONİK SANAYİ A.Ş.';
                  else if (cellUpper.includes('CEMRE')) detectedCustomer = 'CEMRE TERSANECİLİK SAN. VE TİC. A.Ş.';
                  else if (cellUpper.includes('U4')) detectedCustomer = 'U4 MARİNE SAN. VE TİC. A.Ş.';
                  else if (cellUpper.includes('MORE ELEKTRONİK') || cellUpper.includes('MORE ELEKTRONIK')) detectedCustomer = 'MORE ELEKTRONİK SAN. VE TİC. A.Ş.';
                  else if (cellUpper.includes('SİPARİŞ FORMU') || cellUpper.includes('SIPARIS FORMU')) {
                    const custPart = cellStr.split('-')[0].trim();
                    if (custPart.length > 3 && !custPart.toUpperCase().includes('SIES')) {
                      detectedCustomer = custPart.toUpperCase();
                    }
                  }
                }

                if (!detectedOrderNo) {
                  if (cellUpper.includes('SİPARİŞ NO') || cellUpper.includes('SIPARIS NO') || cellUpper.includes('TEKLİF NO') || cellUpper.includes('ORDER NO')) {
                    const numMatch = cellStr.match(/(?:SİPARİŞ NO|SIPARIS NO|TEKLİF NO|ORDER NO)\s*[:\-\s]*([A-Z0-9\/\\-]{4,20})/i) || cellStr.match(/([A-Z0-9\/\\-]{4,20})/);
                    if (numMatch) detectedOrderNo = numMatch[1].trim();
                  }
                }

                if (!detectedProjectNo) {
                  if (cellUpper.includes('PROJE') || cellUpper.includes('PROJECT')) {
                    const prjMatch = cellStr.match(/(?:PROJE|PROJECT|PROJE ID)\s*[:\-\s]*([A-Z0-9-]{4,15})/i) || cellStr.match(/(NB\d{4})/i);
                    if (prjMatch) detectedProjectNo = prjMatch[1].trim();
                  }
                }

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

          // Helper to check non-item rows (address, tax, bank, notes)
          const isNonItemRow = (str: string): boolean => {
            if (!str) return false;
            const s = normStr(str);
            if (isFooterRow(s) || isFooterOrSummaryLine(s)) return true;
            if (s.includes('V.D') || s.includes('V.NO') || s.includes('VERGI') || s.includes('VKN') || s.includes('TCKN')) return true;
            if (s.includes('CADDE') || s.includes('CAD.') || s.includes('SOKAK') || s.includes('SOK.') || s.includes('MAHALLE') || s.includes('MAH.') || s.includes('BULVAR') || s.includes('MEVKI') || s.includes('NO:4') || s.includes('NO:') || s.includes('NO :')) return true;
            if (s.includes('TEL:') || s.includes('TELEFON') || s.includes('FAX') || s.includes('MOBIL') || s.includes('GSM') || s.includes('E MAIL') || s.includes('EMAIL') || s.includes('WWW.') || s.includes('BANKA') || s.includes('IBAN') || s.includes('ODEME')) return true;
            if (s.includes('KONACIK') || s.includes('BODRUM') || s.includes('ISTANBUL') || s.includes('ANKARA') || s.includes('IZMIR') || s.includes('KOCAELI') || s.includes('GEBZE') || s.includes('TUZLA')) return true;
            if (s.includes('ISKONTO') || s.includes('NET TOPLAM') || s.includes('K.D.V') || s.includes('GENEL TOPLAM') || s.includes('TOPLAM TUTAR')) return true;
            return false;
          };

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

              const isCodeH = h.includes('SIPARIS KOD') || h.includes('URUN KOD') || h.includes('STOK KOD') || h.includes('MALZEME NO') || h.includes('MALZEME KOD') || h.includes('M.NO') || h.includes('M NO') || h.includes('PARCA NO') || h.includes('PART NO') || h === 'KOD' || h === 'CODE' || h === 'KODU';
              const isDescH = h.includes('MAL/HIZMET') || h.includes('MAL HIZMET') || h.includes('MALIN CINSI') || h.includes('MAL CINSI') || h.includes('URUN ADI') || h.includes('ÜRÜN ADI') || h.includes('URUN TANIM') || h.includes('ÜRÜN TANIM') || h.includes('ACIKLAMA') || h.includes('AÇIKLAMA') || h.includes('MALZEME TANIM') || h.includes('MALZEME ADI') || h.includes('MALIN TANIM') || h.includes('TANIM') || h.includes('DESCRIPTION') || h.includes('MALZEME') || h.includes('CINSI') || h.includes('CİNSİ');
              const isQtyH = h.includes('MIKTAR') || h.includes('QTY') || h.includes('QUANTITY') || h.includes('TALEP MIKTARI') || h.includes('SIPARIS MIKTARI');
              const isUnitH = h.includes('BIRIM') || h === 'OB' || h === 'UNIT';
              const isPriceH = h.includes('FIYAT') || h.includes('PRICE') || h.includes('B.FIYAT');
              const isTotalH = h.includes('TOPLAM') || h.includes('TUTAR') || h.includes('TOTAL');

              if (codeC === -1 && isCodeH) {
                codeC = cIdx;
                matchCount++;
              } else if (descC === -1 && isDescH) {
                descC = cIdx;
                matchCount++;
              } else if (qtyC === -1 && isQtyH) {
                qtyC = cIdx;
                matchCount++;
              } else if (unitC === -1 && isUnitH) {
                unitC = cIdx;
                matchCount++;
              } else if (priceC === -1 && isPriceH) {
                priceC = cIdx;
                matchCount++;
              } else if (totalC === -1 && isTotalH) {
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

            if (excelItems.length > 0 && (isFooterRow(rowJoined) || isNonItemRow(rowJoined))) break;
            if (isFooterRow(rowJoined) || isFooterOrSummaryLine(rowJoined) || isNonItemRow(rowJoined)) continue;

            let codeVal = colIdxCode !== -1 && row[colIdxCode] != null ? String(row[colIdxCode]).trim() : '';
            let descVal = colIdxDesc !== -1 && row[colIdxDesc] != null ? String(row[colIdxDesc]).trim() : '';
            let qtyVal = colIdxQty !== -1 ? row[colIdxQty] : null;

            if (isNonItemRow(codeVal) || isNonItemRow(descVal)) continue;

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

            if (isFooterRow(codeVal) || isFooterRow(descVal) || isFooterRow(rowJoined) || normStr(codeVal).includes('MALZ-KOD')) continue;

            let qtyNum = qtyVal != null ? Number(String(qtyVal).replace(',', '.').replace(/[^\d\.]/g, '')) : 0;
            let explicitUnit = colIdxUnit !== -1 && row[colIdxUnit] ? String(row[colIdxUnit]).trim().toUpperCase() : '';

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

              let { code, desc, detectedProjectNo: prj } = cleanCodeAndDesc(codeVal, descVal);
              desc = cleanFooterFromDesc(desc);
              if (prj && !detectedProjectNo) detectedProjectNo = prj;

              if (code && code !== 'MALZ-KOD' && desc && !isFooterRow(code) && !isFooterRow(desc)) {
                excelItems.push({
                  id: 'item-xl-' + r + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                  productCode: code,
                  productName: desc,
                  description: desc,
                  quantity: qtyNum,
                  unit: unitStr,
                  price: priceNum,
                });
              }
            }
          }
        });

        if (detectedCustomer) {
          setCoCustomerName(detectedCustomer);
          const foundCust = customers.find(c => c.name.toUpperCase().includes(detectedCustomer.toUpperCase()));
          if (foundCust) {
            setCoCustomerId(foundCust.id);
            if (foundCust.address) setCoShippingAddress(foundCust.address);
          }
        }
        if (detectedOrderNo) setCoOrderNo(detectedOrderNo);
        if (detectedProjectNo) setCoProjectNo(detectedProjectNo);
        if (detectedDeliveryDate) setCoDeliveryDate(detectedDeliveryDate);

        if (excelItems.length > 0) {
          setCoItems(excelItems);
          setCoAiLogs(prev => [...prev, `[EXCEL BAŞARILI] Toplam ${excelItems.length} sipariş kalemi otomatik aktarıldı!`]);

          // Automatically generate clean PDF preview Data URL from Excel upload
          const generatedPdfDataUrl = await generateExcelPdfDataUrl(
            detectedCustomer || coCustomerName || 'MORE ELEKTRONİK SAN. VE TİC. A.Ş.',
            detectedOrderNo || coOrderNo || 'SP-2026-001',
            detectedProjectNo || coProjectNo || '',
            file.name,
            excelItems
          );
          if (generatedPdfDataUrl) {
            setCoOriginalFileUrl(generatedPdfDataUrl);
          }
        } else {
          setCoAiLogs(prev => [...prev, `[BİLGİ] Excel dosyasından satır okundu, müşteri/tarih ayarlandı.`]);
        }
      } catch (err: any) {
        console.error(err);
        setCoAiLogs(prev => [...prev, `[HATA] Excel okuma hatası: ${err.message}`]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle File Upload
  const handleCoAiFileUpload = (file: File) => {
    setCoAiScanning(true);
    setCoAiLogs([`[BAŞLATILDI] Dosya: ${file.name}`]);
    setCoOriginalFileName(file.name);
    // Automatically link to Yandex Disk Cloud Archive
    setCoExternalCloudLink('https://disk.yandex.com.tr/d/1322d_cn4bYRaA');

    const readerUrl = new FileReader();
    readerUrl.onload = (e) => {
      if (e.target?.result) {
        setCoOriginalFileUrl(e.target.result as string);
      }
    };
    readerUrl.readAsDataURL(file);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      setCoAiLogs(prev => [...prev, `[YANDEX DİSK & PDF DÖNÜŞTÜRÜCÜ] Excel yüklendi. Otomatik PDF belgesi oluşturuluyor ve Yandex Disk arşivine bağlanıyor...`]);
      readAndExtractExcel(file);
      setCoAiScanning(false);
    } else if (ext === 'pdf') {
      setCoAiLogs(prev => [...prev, `[YANDEX DİSK & PDF OKUYUCU] PDF belgesi okuma ve Yandex Disk arşiv bağlantısı yapılıyor...`]);
      if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
        setCoAiLogs(prev => [...prev, `[PDF] PDF.js kütüphanesi dinamik yükleniyor...`]);
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
        script.onload = () => {
          (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
          readAndExtractPdf(file);
        };
        script.onerror = () => {
          setCoAiLogs(prev => [...prev, `[UYARI] PDF.js yüklenemedi. Dosya adı süzülüyor...`]);
          parseTextAndFill(file.name);
          setCoAiScanning(false);
        };
        document.head.appendChild(script);
      } else {
        readAndExtractPdf(file);
      }
    } else {
      setTimeout(() => {
        parseTextAndFill(file.name);
        setCoAiScanning(false);
      }, 500);
    }
  };

  // Safe Numeric Parser for Turkish Locale (commas & dots)
  const parseNumVal = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const str = String(val).replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Save Order (Create or Update)
  const handleSaveOrder = async () => {
    try {
      const selectedCust = customers.find(c => c.id === coCustomerId);
      const finalCustName = (coCustomerName && coCustomerName.trim()) ? coCustomerName.trim() : (selectedCust ? selectedCust.name : '');
      
      if (!finalCustName) {
        alert('Lütfen bir müşteri ünvanı girin veya listeden seçin.');
        return;
      }
      if (coItems.length === 0) {
        alert('Lütfen en az 1 sipariş kalemi ekleyin.');
        return;
      }

      // Auto-save dynamic options into localStorage master lists
      if (coCoatingType) saveToStoredList('qms_coating_types', coCoatingType, DEFAULT_COATINGS);
      if (coDeliveryType) saveToStoredList('qms_delivery_types', coDeliveryType, DEFAULT_DELIVERY_TYPES);
      if (coShippingFee) saveToStoredList('qms_shipping_fees', coShippingFee, DEFAULT_SHIPPING_FEES);

      // Auto-save new customer if not in customers array
      if (finalCustName && !customers.some(c => c.name.toUpperCase().trim() === finalCustName.toUpperCase().trim())) {
        addCustomer({
          id: 'cust-' + Date.now(),
          name: finalCustName,
          address: coShippingAddress || ''
        });
      }

      // Auto-save new products if not in products array
      coItems.forEach(it => {
        if (it.productCode && !products.some(p => p.code.toUpperCase().trim() === it.productCode.toUpperCase().trim())) {
          const prodCode = it.productCode.toUpperCase().trim();
          const prodName = (it.description || it.productName || it.productCode).toUpperCase().trim();
          addProduct({
            id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            code: prodCode,
            name: prodName,
            description: prodName,
            unit: it.unit || 'ADET',
            unitPrice: parseNumVal(it.price),
            currency: currency
          });
        }
      });

      const orderNoStr = coOrderNo.trim();
      const siesNoStr = coSiesNo.trim() || (editingOrder ? editingOrder.id : generateNextOrderNumber(orders));
      const finalCustOrderNo = orderNoStr || (editingOrder ? (editingOrder.customerOrderNo || editingOrder.id) : siesNoStr);

      // Ensure a PDF Data URL is generated if missing
      let finalFileUrl = coOriginalFileUrl;
      let finalFileName = coOriginalFileName;
      if (!finalFileUrl && coItems.length > 0) {
        finalFileUrl = await generateExcelPdfDataUrl(
          finalCustName,
          finalCustOrderNo,
          coProjectNo,
          `${siesNoStr}_Siparis_Belgesi.pdf`,
          coItems
        );
        finalFileName = `${siesNoStr}_Siparis_Belgesi.pdf`;
      }

      const defaultYandexCloud = 'https://disk.yandex.com.tr/d/1322d_cn4bYRaA';
      const finalCloudLink = coExternalCloudLink || defaultYandexCloud;

      if (editingOrder && updateOrder) {
        // EDIT EXISTING ORDER
        updateOrder(editingOrder.id, {
          customerOrderNo: finalCustOrderNo,
          customerName: finalCustName,
          date: coOrderDate || todayStr,
          projectNo: coProjectNo,
          deliveryDate: coDeliveryDate || todayStr,
          coatingTypes: [coCoatingType],
          deliveryType: coDeliveryType,
          deliveryDetail: coDeliveryDetail,
          shippingAddress: coShippingAddress,
          shippingFee: coShippingFee,
          notes: coNotes,
          isExempt: coIsExempt,
          attachedFileLink: finalFileUrl || editingOrder.attachedFileLink || editingOrder.originalFileUrl || '',
          attachedFileName: finalFileName || editingOrder.attachedFileName || editingOrder.originalFileName || '',
          originalFileUrl: finalFileUrl || editingOrder.originalFileUrl || editingOrder.attachedFileLink || '',
          originalFileName: finalFileName || editingOrder.originalFileName || editingOrder.attachedFileName || '',
          externalCloudLink: finalCloudLink,
          items: coItems.map(it => {
            const existingItem = (editingOrder.items || []).find(e => e.productCode.toUpperCase().trim() === it.productCode.toUpperCase().trim());
            const qty = parseNumVal(it.quantity);
            const prc = parseNumVal(it.price);
            return {
              productCode: (it.productCode || '').trim(),
              quantity: qty,
              shippedQuantity: existingItem ? existingItem.shippedQuantity || 0 : 0,
              status: existingItem ? existingItem.status || 'Bekliyor' : 'Bekliyor',
              description: it.description || it.productName || it.productCode || '',
              price: prc,
              total: qty * prc,
              unit: it.unit || 'ADET',
            };
          })
        });

        onClose();
        setTimeout(() => alert(`Sipariş (${finalCustOrderNo} / ${siesNoStr}) Başarıyla Güncellendi!\nMüşteri: ${finalCustName}`), 100);
      } else {
        // CREATE NEW ORDER
        const userStr = currentUser ? `${currentUser.name} (${currentUser.role})` : 'İbrahim Sert (Genel Müdür)';
        const nowStr = new Date().toLocaleString('tr-TR');

        const newOrder: Order = {
          id: siesNoStr,
          customerOrderNo: finalCustOrderNo,
          quoteId: '',
          customerName: finalCustName,
          date: coOrderDate || todayStr,
          status: 'YENİ SİPARİŞ',
          dispatches: [],
          items: coItems.map(it => {
            const qty = parseNumVal(it.quantity);
            const prc = parseNumVal(it.price);
            return {
              productCode: (it.productCode || '').trim(),
              quantity: qty,
              shippedQuantity: 0,
              status: 'Bekliyor',
              description: it.description || it.productName || it.productCode || '',
              price: prc,
              total: qty * prc,
              unit: it.unit || 'ADET',
            };
          }),
          projectNo: coProjectNo,
          deliveryDate: coDeliveryDate || todayStr,
          coatingTypes: [coCoatingType],
          deliveryType: coDeliveryType,
          deliveryDetail: coDeliveryDetail,
          shippingAddress: coShippingAddress,
          shippingFee: coShippingFee,
          notes: coNotes,
          isExempt: coIsExempt,
          attachedFileLink: finalFileUrl || finalCloudLink || YANDEX_DISK_URL,
          attachedFileName: finalFileName || `${siesNoStr}_Siparis_Belgesi.pdf`,
          originalFileUrl: finalFileUrl || finalCloudLink || YANDEX_DISK_URL,
          originalFileName: finalFileName || `${siesNoStr}_Siparis_Belgesi.pdf`,
          externalCloudLink: finalCloudLink || YANDEX_DISK_URL,
          createdBy: userStr,
          createdDate: nowStr,
          history: [
            {
              id: 'hist-init-' + Date.now(),
              action: 'SİPARİŞ OLUŞTURULDU',
              performedBy: userStr,
              timestamp: nowStr,
              details: `${coItems.length} Kalem Sipariş Yüklendi`
            }
          ]
        };

        addOrder(newOrder);
        onOrderCreated(siesNoStr);
      }
    } catch (err: any) {
      console.error('Save Order Error:', err);
      alert('Sipariş kaydederken hata oluştu: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="space-y-6 print:hidden">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-5 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/30 shrink-0">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">YENİ SİPARİŞ OLUŞTUR (İRSALİYE GİRİŞİ)</h1>
            <p className="text-[11px] text-slate-300 mt-0.5 font-sans">
              Form bilgilerini doldurabilir veya PDF/Excel dosyanızı yükleyerek yapay zekanın otomatik doldurmasını sağlayabilirsiniz.
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="bg-slate-700/80 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase shadow-sm transition-all flex items-center gap-1.5 self-start md:self-auto"
        >
          <X className="h-4 w-4" /> Kapat / İptal
        </button>
      </div>

      {/* AI Upload Bar */}
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
                if (file) handleCoAiFileUpload(file);
              }}
            />
            <label 
              htmlFor="co-ai-file-input"
              className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-750 font-bold px-5 py-2.5 rounded-lg text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-sm transition-all text-orange-900"
            >
              <Cpu className="h-4 w-4 animate-pulse text-orange-600" /> AI ile Doldur — PDF / Excel / Resim Seç
            </label>

            {coAiScanning && (
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 animate-pulse uppercase">
                <RefreshCw className="h-4 w-4 animate-spin text-purple-500" /> Yapay zeka belge okuma yapılıyor...
              </div>
            )}
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

        {/* AI Log Terminal */}
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

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customer & Order Info */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <span className="text-xs font-bold text-[#1f4e5b] uppercase flex items-center gap-1 border-b border-slate-100 pb-2">
            <Building className="h-4 w-4 text-[#1f4e5b]" /> Müşteri & Sipariş Bilgileri
          </span>

          {/* Müşteri Selection or Direct Typing (Request #3 & #5) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Müşteri *</label>
            <div className="space-y-1.5">
              <select
                value={coCustomerId}
                onChange={e => {
                  const selectedId = e.target.value;
                  setCoCustomerId(selectedId);
                  const cust = customers.find(c => c.id === selectedId);
                  if (cust) {
                    setCoCustomerName(cust.name);
                    if (cust.address) setCoShippingAddress(cust.address);
                  }
                }}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">-- Müşteri Listesinden Seçin (İsteğe Bağlı) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input 
                type="text"
                placeholder="veya Müşteri Ünvanını doğrudan buraya yazın..."
                value={coCustomerName}
                onChange={e => setCoCustomerName(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-orange-700 mb-1 uppercase flex items-center justify-between">
                <span>SIES SİP NO</span>
                <span className="text-[9px] text-slate-400 font-normal">(Sistem)</span>
              </label>
              <input
                type="text"
                value={coSiesNo}
                onChange={e => setCoSiesNo(e.target.value)}
                placeholder="Örn: SIES20260324"
                className="w-full border border-orange-200 bg-orange-50/50 rounded px-2 py-1.5 text-xs font-mono font-extrabold text-orange-900 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase flex items-center justify-between">
                <span>MÜŞTERİ SİP NO *</span>
              </label>
              <input
                type="text"
                value={coOrderNo}
                onChange={e => setCoOrderNo(e.target.value)}
                placeholder="Örn: 407298, URAS-01"
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">PROJE NO</label>
              <input
                type="text"
                value={coProjectNo}
                onChange={e => setCoProjectNo(e.target.value)}
                placeholder="Örn: PRJ-8821"
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Sipariş Tarihi *</label>
              <input
                type="date"
                value={coOrderDate}
                onChange={e => setCoOrderDate(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Teslimat Tarihi *</label>
              <input
                type="date"
                value={coDeliveryDate}
                onChange={e => setCoDeliveryDate(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Kaplama Cinsi *</label>
              <div className="space-y-1">
                <select
                  value={coatingOptions.includes(coCoatingType) ? coCoatingType : 'ÖZEL_GIRIS'}
                  onChange={e => {
                    if (e.target.value !== 'ÖZEL_GIRIS') {
                      setCoCoatingType(e.target.value);
                    } else {
                      setCoCoatingType('');
                    }
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  {coatingOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="ÖZEL_GIRIS">+ YENİ KAPLAMA CİNSİ EKLE...</option>
                </select>
                {(!coatingOptions.includes(coCoatingType) || coCoatingType === '') && (
                  <input
                    type="text"
                    placeholder="Yeni kaplama cinsini yazınız..."
                    value={coCoatingType}
                    onChange={e => setCoCoatingType(e.target.value)}
                    className="w-full border border-orange-400 bg-orange-50/40 rounded px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Teslimat Şekli *</label>
              <div className="space-y-1">
                <select
                  value={deliveryTypeOptions.includes(coDeliveryType) ? coDeliveryType : 'ÖZEL_GIRIS'}
                  onChange={e => {
                    if (e.target.value !== 'ÖZEL_GIRIS') {
                      setCoDeliveryType(e.target.value);
                    } else {
                      setCoDeliveryType('');
                    }
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  {deliveryTypeOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="ÖZEL_GIRIS">+ YENİ TESLİMAT ŞEKLİ EKLE...</option>
                </select>
                {(!deliveryTypeOptions.includes(coDeliveryType) || coDeliveryType === '') && (
                  <input
                    type="text"
                    placeholder="Yeni teslimat şeklini yazınız..."
                    value={coDeliveryType}
                    onChange={e => setCoDeliveryType(e.target.value)}
                    className="w-full border border-orange-400 bg-orange-50/40 rounded px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Teslimat Detayı</label>
            <input
              type="text"
              value={coDeliveryDetail}
              onChange={e => setCoDeliveryDetail(e.target.value)}
              placeholder="Örn: İkitelli Ambarı ile sevk..."
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* SEVKİYAT BİLGİLERİ */}
          <div className="pt-2 border-t border-slate-200/80 space-y-3">
            <span className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5 tracking-wider">
              <Truck className="h-3.5 w-3.5 text-orange-600" /> Sevkiyat Bilgileri
            </span>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Sevk Adresi *</label>
              <textarea
                rows={2}
                value={coShippingAddress}
                onChange={e => setCoShippingAddress(e.target.value)}
                placeholder="Malzemenin teslim edileceği tam adres..."
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Sevkiyat Ücreti *</label>
              <div className="space-y-1">
                <select
                  value={shippingFeeOptions.includes(coShippingFee) ? coShippingFee : 'ÖZEL_GIRIS'}
                  onChange={e => {
                    if (e.target.value !== 'ÖZEL_GIRIS') {
                      setCoShippingFee(e.target.value);
                    } else {
                      setCoShippingFee('');
                    }
                  }}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                >
                  {shippingFeeOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="ÖZEL_GIRIS">+ YENİ SEVKİYAT ÜCRETİ TİPİ EKLE...</option>
                </select>
                {(!shippingFeeOptions.includes(coShippingFee) || coShippingFee === '') && (
                  <input
                    type="text"
                    placeholder="Yeni sevkiyat ücreti seçeneğini yazınız..."
                    value={coShippingFee}
                    onChange={e => setCoShippingFee(e.target.value)}
                    className="w-full border border-orange-400 bg-orange-50/40 rounded px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-orange-500 outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Açıklama / Notlar</label>
            <textarea
              rows={2}
              value={coNotes}
              onChange={e => setCoNotes(e.target.value)}
              placeholder="Siparişle ilgili özel notlar..."
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={handleSaveOrder}
              className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Siparişi Kaydet
            </button>
          </div>
        </div>

        {/* Right Column: Sipariş Kalemleri */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-[#1f4e5b] uppercase flex items-center gap-1">
              <Package className="h-4 w-4 text-[#1f4e5b]" /> Sipariş Kalemleri ({coItems.length})
            </span>
          </div>

          {/* Quick Add Row */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Hızlı Kalem Ekle:</span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                placeholder="Ürün Kodu"
                value={newItemCode}
                onChange={e => setNewItemCode(e.target.value)}
                className="sm:col-span-3 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800"
              />
              <input
                type="text"
                placeholder="Ürün Adı / Açıklaması"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                className="sm:col-span-4 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
              />
              <input
                type="number"
                min="1"
                placeholder="Miktar"
                value={newItemQty}
                onChange={e => setNewItemQty(parseFloat(e.target.value) || 1)}
                className="sm:col-span-2 border border-slate-300 rounded px-2 py-1 text-xs text-center font-bold"
              />
              <select
                value={newItemUnit}
                onChange={e => setNewItemUnit(e.target.value)}
                className="sm:col-span-1 border border-slate-300 rounded px-1 py-1 text-xs font-medium"
              >
                <option value="ADET">ADET</option>
                <option value="METRE">METRE</option>
                <option value="BOY">BOY</option>
                <option value="KG">KG</option>
                <option value="SET">SET</option>
              </select>
              <button
                type="button"
                onClick={handleAddManualItem}
                className="sm:col-span-2 bg-[#1f4e5b] hover:bg-[#163740] text-white font-bold px-2 py-1 rounded text-xs uppercase flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Ekle
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-2 border-r border-slate-200 w-8 text-center">#</th>
                  <th className="p-2 border-r border-slate-200 min-w-[140px]">Ürün Kodu / Tanımı</th>
                  <th className="p-2 border-r border-slate-200 w-20 text-center">Miktar</th>
                  <th className="p-2 border-r border-slate-200 w-16 text-center">Birim</th>
                  <th className="p-2 border-r border-slate-200 w-24 text-right">Birim Fiyat</th>
                  <th className="p-2 border-r border-slate-200 w-24 text-right">Tutar</th>
                  <th className="p-2 w-8 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {coItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-2 border-r border-slate-100 text-center font-bold text-slate-400 text-[10px]">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-100 space-y-1">
                      <input
                        type="text"
                        placeholder="Ürün Kodu..."
                        value={item.productCode}
                        onChange={e => updateCoItem(item.id, 'productCode', e.target.value)}
                        className="w-full border border-slate-200 rounded px-1.5 py-1 text-[11px] font-mono font-bold text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Ürün Adı..."
                        value={item.productName}
                        onChange={e => updateCoItem(item.id, 'productName', e.target.value)}
                        className="w-full border border-slate-200 rounded px-1.5 py-1 text-[11px] font-sans"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateCoItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded px-1.5 py-1 text-center font-bold text-xs"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100">
                      <select
                        value={item.unit}
                        onChange={e => updateCoItem(item.id, 'unit', e.target.value)}
                        className="w-full border border-slate-200 rounded px-1 py-1 text-[11px] font-medium font-sans"
                      >
                        <option value="ADET">ADET</option>
                        <option value="METRE">METRE</option>
                        <option value="BOY">BOY</option>
                        <option value="KG">KG</option>
                        <option value="SET">SET</option>
                        <option value="TAKIM">TAKIM</option>
                      </select>
                    </td>
                    <td className="p-2 border-r border-slate-100">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price || 0}
                        onChange={e => updateCoItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded px-1.5 py-1 text-right font-mono text-xs"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-100 text-right font-mono font-bold text-slate-800 text-xs">
                      {((item.quantity || 0) * (item.price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeCoItemRow(item.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {coItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic font-sans text-xs">
                      Henüz sipariş kalemi eklenmedi. Hızlı Kalem Ekle alanını kullanın veya yukarıdan dosya yükleyin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {coItems.length > 0 && (
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-xs text-slate-500 font-medium">Toplam {coItems.length} Kalem</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">GENEL TOPLAM:</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {coItems.reduce((acc, it) => acc + (it.quantity * (it.price || 0)), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <select 
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
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
  );
};
