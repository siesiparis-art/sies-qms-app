'use client';

import React, { useState, useEffect } from 'react';
import { useQms, QmsDocument } from '@/context/QmsContext';
import { 
  FileText, Plus, Edit2, Check, ArrowUpRight, History, Calendar, User, FileDown, Eye, Save, X, Search, ChevronDown, ChevronRight, AlertTriangle, ShieldCheck, Printer, FileArchive, Sparkles
} from 'lucide-react';

interface DocumentViewerProps {
  initialDocId?: string;
  auditMode: boolean;
}

export default function DocumentViewer({ initialDocId = 'QM-001', auditMode }: DocumentViewerProps) {
  const { 
    documents, addDocument, updateDocument, personnel, companyInfo,
    incomingInspections, addIncomingInspection,
    outgoingInspections, addOutgoingInspection,
    testReports, addTestReport,
    calibrationRecords, addCalibrationRecord,
    maintenanceRecords, addMaintenanceRecord,
    trainingRecords, addTrainingRecord,
    capas, addCapa,
    nonconformities, addNonconformity,
    complaints, addComplaint,
    suppliers, customers, machines, measuringDevices, orders
  } = useQms();

  const [activeDocId, setActiveDocId] = useState(initialDocId);
  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState<'template' | 'records'>('template');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Folder state explorer
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '01_Yonetim_Sistemi': true,
    '02_Uretim': true,
    '03_Hammadde': true,
    '04_Satin_Alma': true,
    '05_Kalibrasyon': true,
    '06_Personel': true,
    '07_Bakim': true,
    '08_Deneyler': true,
    '09_Izlenebilirlik': true,
    '10_Olcum': true,
    '11_Uygunsuzluk': true,
    '12_Musteri': true,
    '13_Stok': true,
    '14_Sevkiyat': true,
    '15_CE': true,
    '16_TSE_Denetim': true
  });

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  // Form input states
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [formFields, setFormFields] = useState<Record<string, any>>({});

  const handleAutofill = () => {
    if (!activeDoc) return;
    const code = activeDoc.id;
    const fields: Record<string, any> = {};

    if (code === 'HM-01') {
      fields.supplierId = suppliers[0]?.id || 'T-01';
      fields.deliveryNoteNo = 'IRS-2026-' + Math.floor(1000 + Math.random() * 9000);
      fields.materialName = 'Sac Rulo ST37';
      fields.thicknessMm = '2.00';
      fields.widthMm = '250';
      fields.coatingThicknessMicron = '45';
      fields.visualStatus = 'Uygun';
      fields.decision = 'Kabul';
      fields.notes = 'Rulo kalınlık, genişlik ve kaplama mikron ölçümleri standart toleranslar dahilindedir. Görsel yüzey kontrolü uygun.';
    } else if (code === 'URT-05') {
      fields.customerId = customers[0]?.id || 'M-01';
      fields.dispatchNoteNo = 'SEVK-2026-' + Math.floor(1000 + Math.random() * 9000);
      fields.productCode = 'SU 10';
      fields.quantityMetres = '150';
      fields.visualStatus = 'Uygun';
      fields.verdict = 'Kabul';
      fields.notes = 'Mamul büküm formu ve çapak kontrolleri yapıldı. Boyutsal ölçümler onaylandı, sevk edilebilir.';
    } else if (code.startsWith('DNY')) {
      fields.productCode = 'SU 10';
      fields.loadKN = '15';
      fields.deflectionMm = '8';
      fields.testDevice = 'Yük Test Standı XT-50';
      fields.verdict = 'Geçti';
      fields.notes = 'TS EN 61537 standartlarına göre 10.4 yükleme testi yapıldı. Sehim değeri kabul edilebilir sınırlar içerisindedir.';
    } else if (activeDoc.templateFields && activeDoc.templateFields.length > 0) {
      // General dynamic fields autofill (e.g. URT-06, etc.)
      activeDoc.templateFields.forEach((field) => {
        const name = field.fieldName.toUpperCase();
        if (field.fieldType === 'Date') {
          fields[field.fieldName] = new Date().toISOString().split('T')[0];
        } else if (field.fieldType === 'Number') {
          if (name.includes('KALINLIK') || name.includes('MM')) {
            fields[field.fieldName] = '1.5';
          } else if (name.includes('ADET') || name.includes('MİKTAR') || name.includes('SAYI')) {
            fields[field.fieldName] = '100';
          } else if (name.includes('MIKRON') || name.includes('KAPLAMA')) {
            fields[field.fieldName] = '50';
          } else {
            fields[field.fieldName] = '10';
          }
        } else if (field.fieldType === 'Boolean') {
          fields[field.fieldName] = true;
        } else {
          // Text fields
          if (name.includes('KONTROL EDEN') || name.includes('SORUMLU') || name.includes('İMZA') || name.includes('OPERATÖR')) {
            fields[field.fieldName] = 'Faruk Oruç';
          } else if (name.includes('KARAR') || name.includes('SONUÇ') || name.includes('DURUM')) {
            fields[field.fieldName] = 'UYGUN';
          } else if (name.includes('ÖLÇÜLEN') || name.includes('DEĞER') || name.includes('PARAMETRE')) {
            fields[field.fieldName] = '1.52 mm (Tolerans İçi)';
          } else if (name.includes('MAKİNE') || name.includes('HAT') || name.includes('CİHAZ')) {
            fields[field.fieldName] = 'H-01 Büküm Hattı';
          } else if (name.includes('NO') || name.includes('KOD')) {
            fields[field.fieldName] = 'LOT-2026-A1';
          } else {
            fields[field.fieldName] = 'Kontrol tamamlandı, toleranslar dahilinde.';
          }
        }
      });
      fields.notes = 'Yapılan ölçümler ve kontroller neticesinde ürün özellikleri standart spesifikasyonlara uygun bulunmuştur.';
    }

    setFormFields(fields);
  };
  const [dbRecords, setDbRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Active Doc
  const activeDoc = documents.find(d => d.id === activeDocId) || documents[0];

  useEffect(() => {
    setSubTab('template');
    setSelectedRecordId(null);
    setDbRecords([]);
  }, [activeDocId]);

  useEffect(() => {
    if (subTab === 'records' && activeDocId) {
      setLoadingRecords(true);
      fetch(`http://localhost:5000/api/QmsDocManagement/definitions/${activeDocId}/records`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to load records from backend.");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setDbRecords(data);
          } else {
            setDbRecords([]);
          }
          setLoadingRecords(false);
        })
        .catch(err => {
          console.error(err);
          setDbRecords([]);
          setLoadingRecords(false);
        });
    }
  }, [activeDocId, subTab]);

  // Sidebar grouping based on document prefix
  const foldersMapping = [
    { key: '01_Yonetim_Sistemi', label: '01. Yönetim Sistemi & Prosedürler (KYS/PR/FR/TL/PL/LS/DS)', prefixes: ['QM', 'KYS', 'PR', 'PRO', 'FR', 'FRM', 'TL', 'TAL', 'GT', 'KR', 'DEF', 'PL', 'LS', 'DS', 'SD'] },
    { key: '02_Uretim', label: '02. Üretim Süreçleri (URT)', prefixes: ['URT'] },
    { key: '03_Hammadde', label: '03. Hammadde Kontrolleri (HM)', prefixes: ['HM'] },
    { key: '04_Satin_Alma', label: '04. Satınalma (SAT)', prefixes: ['SAT'] },
    { key: '05_Kalibrasyon', label: '05. Cihaz & Kalibrasyon (KAL)', prefixes: ['KAL'] },
    { key: '06_Personel', label: '06. Personel & Yetkinlik (PER)', prefixes: ['PER'] },
    { key: '07_Bakim', label: '07. Makine & Önleyici Bakım (BKM)', prefixes: ['BKM'] },
    { key: '08_Deneyler', label: '08. TS EN 61537 Deneyler (DNY)', prefixes: ['DNY'] },
    { key: '09_Izlenebilirlik', label: '09. Ürün İzlenebilirliği (IZL)', prefixes: ['IZL'] },
    { key: '10_Olcum', label: '10. Boyutsal Ölçümler (OLC)', prefixes: ['OLC'] },
    { key: '11_Uygunsuzluk', label: '11. Uygunsuzluk & DÖF (UYG)', prefixes: ['UYG'] },
    { key: '12_Musteri', label: '12. Müşteri Şikayetleri (MUS)', prefixes: ['MUS'] },
    { key: '13_Stok', label: '13. Stok Yönetimi (STK)', prefixes: ['STK'] },
    { key: '14_Sevkiyat', label: '14. Sevkiyat & Etiket (SVK)', prefixes: ['SVK'] },
    { key: '15_CE', label: '15. CE Teknik Dosya (CE)', prefixes: ['CE'] },
    { key: '16_TSE_Denetim', label: '16. TSE Denetim Paketleri (TSE)', prefixes: ['TSE'] }
  ];

  // Filtered documents
  const filteredDocs = documents.filter(d => 
    d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDocsInFolder = (prefixes: string[]) => {
    return filteredDocs.filter(d => {
      const prefix = d.id.split('-')[0];
      return prefixes.includes(prefix);
    });
  };

  const allKnownPrefixes = foldersMapping.flatMap(f => f.prefixes);
  const uncategorizedDocs = filteredDocs.filter(d => {
    const prefix = d.id.split('-')[0];
    return !allKnownPrefixes.includes(prefix);
  });

  // Check if active document has transactional data records associated
  const hasRecordsSupport = () => {
    if (!activeDoc) return false;
    const prefix = activeDoc.id.split('-')[0];
    return ['QM', 'KYS', 'HM', 'URT', 'SAT', 'KAL', 'PER', 'BKM', 'DNY', 'UYG', 'MUS', 'STK', 'SVK', 'CE', 'TSE', 'PR', 'PRO', 'FR', 'FRM', 'TL', 'TAL', 'GT', 'KR', 'DEF', 'PL', 'SD'].includes(prefix);
  };

  // Get records for active document type
  const getActiveRecordsList = () => {
    if (!activeDoc) return [];
    const prefix = activeDoc.id.split('-')[0];
    const code = activeDoc.id;
    if (code === 'HM-01') return incomingInspections;
    if (code === 'URT-05') return outgoingInspections;
    if (prefix === 'DNY') return testReports.filter(t => t.testType.toLowerCase().includes(activeDoc.title.split(' ')[0].toLowerCase()) || t.id.includes(code));
    if (code === 'BKM-05') return maintenanceRecords;
    if (code === 'KAL-02') return calibrationRecords;
    if (code === 'PER-06') return trainingRecords;
    if (code === 'UYG-01') return nonconformities;
    if (code === 'UYG-05') return capas;
    if (code === 'MUS-01') return complaints;
    return [];
  };

  const handleCreateRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = activeDoc.id;
    const dateStr = new Date().toISOString().split('T')[0];

    if (code === 'HM-01') {
      const newRec = {
        id: `GKK-${Date.now().toString().slice(-5)}`,
        supplierId: formFields.supplierId || suppliers[0]?.id || 'T-01',
        deliveryNoteNo: formFields.deliveryNoteNo || 'IRS-2026-001',
        deliveryDate: dateStr,
        materialName: formFields.materialName || 'Sac Rulo ST37',
        thicknessMm: Number(formFields.thicknessMm || 2.0),
        widthMm: Number(formFields.widthMm || 250),
        coatingThicknessMicron: Number(formFields.coatingThicknessMicron || 45),
        visualStatus: (formFields.visualStatus || 'Uygun') as 'Uygun' | 'Hatalı',
        decision: (formFields.decision || 'Kabul') as 'Kabul' | 'Koşullu Kabul' | 'Red',
        inspector: formFields.inspector || 'Faruk Oruç',
        notes: formFields.notes || ''
      };
      addIncomingInspection(newRec);
    } else if (code === 'URT-05') {
      const newRec = {
        id: `SK-${Date.now().toString().slice(-5)}`,
        customerId: formFields.customerId || customers[0]?.id || 'M-01',
        dispatchNoteNo: formFields.dispatchNoteNo || 'SEVK-2026-001',
        dispatchDate: dateStr,
        productCode: formFields.productCode || 'SU 10',
        quantityMetres: Number(formFields.quantityMetres || 100),
        thicknessMm: Number(formFields.thicknessMm || 1.5),
        widthMm: Number(formFields.widthMm || 200),
        measuredCoatingMicron: Number(formFields.measuredCoatingMicron || 55),
        visualStatus: (formFields.visualStatus || 'Uygun') as 'Uygun' | 'Hatalı',
        decision: (formFields.decision || 'Kabul') as 'Kabul' | 'Red',
        inspector: formFields.inspector || 'Faruk Oruç',
        notes: formFields.notes || ''
      };
      addOutgoingInspection(newRec);
    } else if (activeDoc.id.startsWith('DNY')) {
      const newRec = {
        id: `TEST-${Date.now().toString().slice(-5)}`,
        testType: activeDoc.title as any,
        productCode: formFields.productCode || 'SU 10',
        testDate: dateStr,
        testDevice: formFields.testDevice || 'Yük Test Standı XT-50',
        calibrationCertificate: formFields.calibrationCertificate || 'CAL-2026-042',
        operator: formFields.operator || 'Ahmet Usta',
        instructionId: 'TL-012',
        acceptanceCriteria: `TS EN 61537 Madde 10.4 gereksinimleri. Defleksiyon limiti L/100, kırılma emniyet katsayısı 1.7.`,
        resultsJson: JSON.stringify({ loadKN: formFields.loadKN || 15, deflectionMm: formFields.deflectionMm || 8 }),
        status: (formFields.verdict || 'Geçti') as 'Geçti' | 'Kaldı',
        notes: formFields.notes || ''
      };
      addTestReport(newRec);
    } else if (code === 'BKM-05') {
      const newRec = {
        id: GuidString(),
        machineId: formFields.machineId || machines[0]?.id || '',
        maintenanceDate: dateStr,
        doneBy: formFields.doneBy || 'Faruk Oruç',
        details: formFields.details || 'Haftalık periyodik motor ve büküm kalıp kontrolleri yapıldı.',
        partsReplaced: (formFields.partsReplaced || '').split(','),
        cost: Number(formFields.cost || 0)
      };
      addMaintenanceRecord(newRec);
    } else if (code === 'KAL-02') {
      const newRec = {
        id: GuidString(),
        deviceId: formFields.deviceId || measuringDevices[0]?.id || '',
        calibrationDate: dateStr,
        nextCalibrationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        calibratedBy: formFields.calibratedBy || 'Atlas Kalibrasyon Laboratuvarı',
        certificateNo: formFields.certificateNo || 'CERT-2026-991',
        result: (formFields.result || 'Uygun') as 'Uygun' | 'Sapmalı'
      };
      addCalibrationRecord(newRec);
    }

    // Persist to SQL Backend database
    if (activeDoc.databaseId && activeDoc.templateFields && activeDoc.templateFields.length > 0) {
      const generatedRecordNo = `${activeDoc.id}-REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const fieldValues = activeDoc.templateFields.map((field: any) => {
        const val = formFields[field.fieldName];
        return {
          TemplateFieldId: field.id,
          TextValue: field.fieldType === 'Text' ? String(val || '') : null,
          NumericValue: field.fieldType === 'Number' ? Number(val || 0) : null,
          DateValue: field.fieldType === 'Date' ? (val ? new Date(val).toISOString() : null) : null,
          BooleanValue: field.fieldType === 'Boolean' ? Boolean(val) : null
        };
      });

      const newRecord = {
        TenantId: "00000000-0000-0000-0000-000000000000",
        DocumentDefinitionId: activeDoc.databaseId,
        DocumentRevisionId: activeDoc.revisionId,
        RecordNo: generatedRecordNo,
        LifecycleState: "Signed",
        Status: "Aktif",
        FieldValues: fieldValues
      };

      fetch('http://localhost:5000/api/QmsDocManagement/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRecord)
      })
      .then(res => {
        if (!res.ok) throw new Error("Kayıt veritabanına eklenirken hata oluştu.");
        return res.json();
      })
      .then(data => {
        alert("Yeni Kayıt Başarıyla Veritabanına Eklendi ve E-İmzalandı!");
        // Refresh records tab view
        setSubTab('template');
        setTimeout(() => setSubTab('records'), 100);
      })
      .catch(err => {
        alert("Hata: " + err.message);
      });
    }

    setShowAddRecordModal(false);
    setFormFields({});
  };

  const GuidString = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Client-side PDF Exporter (calls html2pdf.js dynamically from CDN)
  const handlePdfDownload = () => {
    const element = document.getElementById('printable-a4-sheet');
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${activeDoc.id}_${activeDoc.title.replace(/\s+/g, '_')}_Rev${activeDoc.revision}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Load from CDN
    const runPdfExport = () => {
      // @ts-ignore
      window.html2pdf().from(element).set(opt).save();
    };

    // @ts-ignore
    if (window.html2pdf) {
      runPdfExport();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = runPdfExport;
      document.head.appendChild(script);
    }
  };

  // Client-side ZIP exporter
  const handleZipDownloadAll = () => {
    const loadJSZip = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        // @ts-ignore
        if (window.JSZip) {
          // @ts-ignore
          resolve(window.JSZip);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
          // @ts-ignore
          resolve(window.JSZip);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadJSZip().then(JSZip => {
      const zip = new JSZip();
      
      foldersMapping.forEach(folder => {
        const folderZip = zip.folder(folder.key);
        const docs = documents.filter(d => folder.prefixes.includes(d.id.split('-')[0]));
        
        docs.forEach(doc => {
          folderZip.file(`${doc.id}_${doc.title.replace(/\s+/g, '_')}.txt`, 
            `KOD: ${doc.id}\nBAŞLIK: ${doc.title}\nREVİZYON: Rev.${doc.revision}\nTARİH: ${doc.revisionDate}\n\nİÇERİK:\n${doc.content}`
          );
        });
      });

      zip.file("00_OKU_BENI.txt", `KALİTE-SİES Doküman ve Kayıt Arşivi\nÜretim Tarihi: ${new Date().toLocaleDateString('tr-TR')}\nToplam Doküman: ${documents.length}`);

      zip.generateAsync({ type: "blob" }).then((contentBlob: any) => {
        const url = URL.createObjectURL(contentBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SIES_Kalite_Paketi_${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
      });
    }).catch(err => {
      alert("ZIP oluşturulurken hata: " + err);
    });
  };

  // Render compliance alerts list (Eksik Kayıt Uyarı Sistemi)
  const renderComplianceDashboard = () => {
    const alerts = [];
    
    // Rule 1: Production run completed without URT-05
    if (outgoingInspections.length === 0) {
      alerts.push({ code: 'PROD_MISSING_FINAL', title: 'Üretim tamamlandı, Ürün Son Kontrol Formu (URT-05) bulunamadı!', severity: 'Kritik' });
    }
    // Rule 2: Inward materials missing certifications
    if (incomingInspections.length > 0) {
      alerts.push({ code: 'LOT_MISSING_CERT', title: 'Hammadde girdileri kabul edildi, Malzeme Kalite Sertifikaları sisteme bağlanmadı!', severity: 'Kritik' });
    }
    // Rule 3: Calibration due checks
    alerts.push({ code: 'CALIB_OVERDUE_USAGE', title: '1 Ölçüm Cihazının (Kumpas) kalibrasyon vadesi yaklaşmaktadır!', severity: 'Yüksek' });

    return (
      <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg font-sans">
        <h4 className="font-bold text-xs uppercase tracking-wider text-orange-800 flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          EKSİK KAYIT VE UYUM UYARI SİSTEMİ (COMPLIANCE ALERTS)
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {alerts.map((al, idx) => (
            <div key={idx} className="flex justify-between items-center text-[11px] bg-white p-2.5 rounded border border-orange-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-mono">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                  al.severity === 'Kritik' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>{al.severity}</span>
                <span>{al.title}</span>
              </div>
              <span className="text-slate-400 font-mono text-[9px]">{al.code}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderParsedContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-4 text-xs md:text-sm leading-relaxed text-slate-800 font-sans">
        {lines.map((line, i) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={i} className="text-xl md:text-2xl font-black text-slate-900 border-b-2 border-slate-900 pb-2 mt-6 uppercase tracking-tight">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={i} className="text-base md:text-lg font-bold text-orange-600 mt-4 border-b border-slate-100 pb-1 uppercase">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="text-sm md:text-base font-semibold text-slate-950 mt-3 font-mono">
                {line.replace('### ', '')}
              </h3>
            );
          }
          
          const isBullet = line.startsWith('- ');
          let lineContent = isBullet ? line.substring(2) : line;

          return isBullet ? (
            <ul key={i} className="list-disc pl-5 my-1">
              <li className="text-slate-700">{lineContent}</li>
            </ul>
          ) : lineContent.trim() === '' ? (
            <div key={i} className="h-2" />
          ) : (
            <p key={i} className="text-slate-800 text-justify">{lineContent}</p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between h-full print:hidden">
        <div className="p-3 border-b border-slate-200 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Doküman No veya Başlık ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full border border-slate-200 rounded-md p-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50"
            />
          </div>

          <button 
            onClick={handleZipDownloadAll}
            className="w-full bg-slate-900 hover:bg-slate-950 text-white rounded py-2 text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <FileArchive className="h-4 w-4 text-orange-500" />
            TÜM DOKÜMANLARI ZIP İNDİR
          </button>
        </div>

        {/* Tree Explorer folders */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {foldersMapping.map((folder) => {
            const docs = getDocsInFolder(folder.prefixes);
            if (docs.length === 0) return null;
            const isExpanded = expandedFolders[folder.key];

            return (
              <div key={folder.key} className="space-y-0.5">
                <button
                  onClick={() => toggleFolder(folder.key)}
                  className="w-full text-left p-1.5 hover:bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between rounded"
                >
                  <span className="flex items-center gap-1 text-slate-800">
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                    {folder.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">({docs.length})</span>
                </button>

                {isExpanded && (
                  <div className="pl-4 space-y-0.5">
                    {docs.map((doc) => {
                      const isActive = activeDocId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => setActiveDocId(doc.id)}
                          className={`w-full text-left px-2 py-1.5 text-xs rounded transition-all flex justify-between items-center border ${
                            isActive 
                              ? 'bg-orange-50 text-orange-700 font-semibold border-orange-200' 
                              : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{doc.id} - {doc.title}</span>
                          <span className="text-[9px] font-mono text-slate-400">Rev.{doc.revision}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {uncategorizedDocs.length > 0 && (
            <div key="99_Diger" className="space-y-0.5 border-t border-slate-200 pt-1 mt-1">
              <button
                onClick={() => toggleFolder('99_Diger')}
                className="w-full text-left p-1.5 hover:bg-slate-50 text-slate-700 font-bold text-[11px] uppercase tracking-wider flex items-center justify-between rounded"
              >
                <span className="flex items-center gap-1 text-slate-800">
                  {expandedFolders['99_Diger'] ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                  99. Diğer Dokümanlar & Ekler
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({uncategorizedDocs.length})</span>
              </button>

              {expandedFolders['99_Diger'] && (
                <div className="pl-4 space-y-0.5">
                  {uncategorizedDocs.map((doc) => {
                    const isActive = activeDocId === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setActiveDocId(doc.id)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded transition-all flex justify-between items-center border ${
                          isActive 
                            ? 'bg-orange-50 text-orange-700 font-semibold border-orange-200' 
                            : 'text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className="truncate">{doc.id} - {doc.title}</span>
                        <span className="text-[9px] font-mono text-slate-400">Rev.{doc.revision}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 bg-slate-100 overflow-y-auto p-4 md:p-6 print:bg-white print:p-0">
        
        {/* Actions header toolbar */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-lg uppercase tracking-tight font-mono">{activeDoc?.id}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-700 text-sm font-semibold">{activeDoc?.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sub-tab selection */}
            {hasRecordsSupport() && (
              <div className="bg-slate-200 p-0.5 rounded-lg flex items-center mr-4">
                <button
                  onClick={() => setSubTab('template')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${subTab === 'template' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Şablon Görüntüle
                </button>
                <button
                  onClick={() => setSubTab('records')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold ${subTab === 'records' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Süreç İşlem Kayıtları
                </button>
              </div>
            )}

            <button 
              onClick={handlePdfDownload}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 shadow-sm"
            >
              <FileDown className="h-4 w-4 text-orange-600" />
              PDF İNDİR
            </button>
            <a
              href="https://disk.yandex.com.tr/d/1322d_cn4bYRaA"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-semibold text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-all"
              title="Tüm Kalite Dokümanları ve Sertifika Arşivi (Yandex Disk 10 GB Sınırsız)"
            >
              <span className="text-sm">☁️</span>
              <span className="font-bold">YANDEX DİSK ARŞİVİ</span>
            </a>
            <button 
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-md flex items-center gap-1 shadow-sm"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              YAZDIR
            </button>
          </div>
        </div>

        {/* Content body container */}
        {subTab === 'template' ? (
          /* STANDARD TEMPLATE A4 PREVIEW */
          <div className="flex justify-center">
            <div 
              id="printable-a4-sheet"
              className="print-area print-portrait w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-950 p-[15mm] md:p-[20mm] shadow-xl border border-slate-200 rounded relative font-sans leading-relaxed flex flex-col justify-between print:border-none print:shadow-none print:rounded-none print:p-2 print:m-0 print:w-full print:max-w-full print:min-h-0"
              style={{ boxSizing: 'border-box' }}
            >
              <div>
                {/* ISO 9001 Official Header Table Grid */}
                <div className="border border-slate-950 grid grid-cols-4 text-center items-center text-[10px] font-bold mb-6 font-mono">
                  <div className="p-2 border-r border-slate-950 flex flex-col justify-center items-center h-full">
                    <span className="text-orange-600 font-black text-xl tracking-tight">SİES</span>
                    <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-bold">KABLO TAŞIMA</span>
                  </div>
                  <div className="p-2 border-r border-slate-950 col-span-2 text-center uppercase text-slate-900 text-[12px] font-black tracking-wide h-full flex items-center justify-center font-sans">
                    {activeDoc?.title}
                  </div>
                  <div className="p-2 text-left text-[8px] space-y-0.5 h-full flex flex-col justify-center leading-normal">
                    <div>Doküman No: <span className="text-black font-bold">{activeDoc?.id}</span></div>
                    <div>Yayın Tarihi: <span className="text-black">{activeDoc?.revisionDate}</span></div>
                    <div>Revizyon No: <span className="text-black font-bold">Rev.{activeDoc?.revision}</span></div>
                    <div>Sayfa No: <span className="text-black font-bold">1 / 1</span></div>
                  </div>
                </div>

                {/* Markdown content parser block */}
                <div className="my-6">
                  {activeDoc && renderParsedContent(activeDoc.content)}
                </div>
              </div>

              {/* Repeating Footer Grid */}
              <div>
                {/* Signature box grid */}
                <div className="grid grid-cols-3 border border-slate-950 text-center text-[9px] mt-8 mb-4 font-mono leading-normal">
                  <div className="p-2 border-r border-slate-950">
                    <div className="font-bold border-b border-slate-950 pb-1">HAZIRLAYAN</div>
                    <div className="pt-1.5 font-bold text-slate-800">{activeDoc?.preparedBy || 'FARUK ORUÇ'}</div>
                    <div className="text-[7px] text-slate-500">Kalite Temsilcisi</div>
                    <div className="text-[7px] font-bold text-green-700 pt-1">✓ DİJİTAL ONAYLI</div>
                  </div>
                  <div className="p-2 border-r border-slate-950">
                    <div className="font-bold border-b border-slate-950 pb-1">KONTROL EDEN</div>
                    <div className="pt-1.5 font-bold text-slate-800">FARUK ORUÇ</div>
                    <div className="text-[7px] text-slate-500">Kalite Yönetim Müdürü</div>
                    <div className="text-[7px] font-bold text-green-700 pt-1">✓ DİJİTAL ONAYLI</div>
                  </div>
                  <div className="p-2">
                    <div className="font-bold border-b border-slate-950 pb-1">ONAYLAYAN</div>
                    <div className="pt-1.5 font-bold text-slate-800">İBRAHİM SERT</div>
                    <div className="text-[7px] text-slate-500">Genel Müdür</div>
                    <div className="text-[7px] font-bold text-green-700 pt-1">✓ DİJİTAL ONAYLI</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono">
                  <span>SİES ELEKTRİK MÜMESSİLLİK SAN. TİC. LTD. ŞTİ.</span>
                  <span className="font-bold uppercase">KONTROLLÜ DOKÜMAN</span>
                  <span>{activeDoc?.id} • Rev.{activeDoc?.revision} • {activeDoc?.revisionDate}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* DYNAMIC SÜREÇ İŞLEM KAYITLARI (TRANSACTIONAL DATA VIEW) */
          <div className="space-y-6">
            
            {/* Compliance Alerts Panel for TSE category */}
            {activeDoc?.id.startsWith('TSE') && renderComplianceDashboard()}

            <div className="bg-white rounded-lg shadow border border-slate-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  {activeDoc?.title} - Sistem Kayıt Defteri Örnekleri
                </h3>
                <button
                  onClick={() => setShowAddRecordModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Kayıt Ekle
                </button>
              </div>

              {/* Table of active records */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="p-2">Kayıt No</th>
                      {activeDoc?.id === 'HM-01' ? (
                        <>
                          <th className="p-2">Tedarikçi</th>
                          <th className="p-2">İrsaliye</th>
                          <th className="p-2">Kalınlık (mm)</th>
                          <th className="p-2">Mikron</th>
                          <th className="p-2">Görsel</th>
                          <th className="p-2">Karar</th>
                        </>
                      ) : activeDoc?.id === 'URT-05' ? (
                        <>
                          <th className="p-2">Müşteri</th>
                          <th className="p-2">Sipariş</th>
                          <th className="p-2">Ürün Kodu</th>
                          <th className="p-2">Metraj</th>
                          <th className="p-2">Durum</th>
                          <th className="p-2">Karar</th>
                        </>
                      ) : activeDoc?.id.startsWith('DNY') ? (
                        <>
                          <th className="p-2">Test Tipi</th>
                          <th className="p-2">Ürün Kodu</th>
                          <th className="p-2">Tarih</th>
                          <th className="p-2">Cihaz</th>
                          <th className="p-2">Durum</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2">Tarih</th>
                          <th className="p-2">Açıklama</th>
                          <th className="p-2">Durum</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecords ? (
                      <tr>
                        <td colSpan={10} className="p-4 text-center text-slate-400">Veritabanından kayıtlar yükleniyor...</td>
                      </tr>
                    ) : dbRecords.length > 0 ? (
                      dbRecords.map((rec: any, idx: number) => {
                        const fieldsSummary = rec.fieldValues?.map((fv: any) => 
                          `${fv.templateField?.fieldName || 'Alan'}: ${fv.textValue || fv.numericValue || (fv.dateValue ? new Date(fv.dateValue).toLocaleDateString('tr-TR') : '')}`
                        ).filter(Boolean).join(', ');

                        return (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-2 font-bold text-orange-600">{rec.recordNo}</td>
                            <td className="p-2">{new Date(rec.recordDate).toLocaleDateString('tr-TR')}</td>
                            <td className="p-2 truncate max-w-md">{fieldsSummary || 'Giriş Alanı Bulunmuyor'}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rec.lifecycleState === 'Signed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>{rec.lifecycleState}</span>
                            </td>
                            <td className="p-2 text-right">
                              <a 
                                href={`http://localhost:5000/api/QmsDocManagement/records/${rec.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-900 hover:bg-slate-950 text-white rounded px-2.5 py-1 text-[10px] font-bold shadow-sm transition-colors"
                              >
                                PDF İNDİR
                              </a>
                            </td>
                          </tr>
                        );
                      })
                    ) : getActiveRecordsList().length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-4 text-center text-slate-400 italic">Henüz kaydedilmiş veri kaydı bulunmuyor.</td>
                      </tr>
                    ) : (
                      getActiveRecordsList().map((rec: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-2 font-bold text-orange-600">{rec.id || `REC-${idx + 1}`}</td>
                          {activeDoc?.id === 'HM-01' ? (
                            <>
                              <td className="p-2">{rec.supplierId}</td>
                              <td className="p-2">{rec.deliveryNoteNo}</td>
                              <td className="p-2">{rec.thicknessMm} mm</td>
                              <td className="p-2">{rec.coatingThicknessMicron} µm</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rec.visualStatus === 'Uygun' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rec.visualStatus}</span>
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  rec.decision === 'Kabul' ? 'bg-green-100 text-green-700' : rec.decision === 'Koşullu Kabul' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>{rec.decision}</span>
                              </td>
                            </>
                          ) : activeDoc?.id === 'URT-05' ? (
                            <>
                              <td className="p-2">{rec.customerId}</td>
                              <td className="p-2">{rec.dispatchNoteNo}</td>
                              <td className="p-2">{rec.productCode}</td>
                              <td className="p-2">{rec.quantityMetres} m</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rec.visualStatus === 'Uygun' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rec.visualStatus}</span>
                              </td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rec.decision === 'Kabul' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rec.decision}</span>
                              </td>
                            </>
                          ) : activeDoc?.id.startsWith('DNY') ? (
                            <>
                              <td className="p-2">{rec.testType}</td>
                              <td className="p-2">{rec.productCode}</td>
                              <td className="p-2">{rec.testDate}</td>
                              <td className="p-2">{rec.testDevice}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rec.status === 'Geçti' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rec.status}</span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2">{rec.date || rec.calibrationDate || new Date().toISOString().split('T')[0]}</td>
                              <td className="p-2 truncate max-w-xs">{rec.details || rec.notes || rec.result || 'Kayıt onaylandı.'}</td>
                              <td className="p-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">✓ Onaylı</span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* DYNAMIC RECORD ENTRY MODAL */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden font-sans">
            <div className="bg-slate-950 p-4 text-white flex justify-between items-center">
              <span className="font-bold text-sm uppercase tracking-wide">Yeni Kayıt Formu - {activeDoc?.id}</span>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleAutofill}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Otomatik Doldur
                </button>
                <button type="button" onClick={() => setShowAddRecordModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateRecordSubmit} className="p-4 space-y-3">
              {activeDoc?.id === 'HM-01' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Tedarikçi Seçimi</label>
                    <select 
                      onChange={(e) => setFormFields(prev => ({ ...prev, supplierId: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                    >
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (Puan: {s.rating})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">İrsaliye No</label>
                      <input 
                        type="text" 
                        placeholder="IRS-2026-..." 
                        value={formFields.deliveryNoteNo || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, deliveryNoteNo: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Malzeme Tanımı</label>
                      <input 
                        type="text" 
                        placeholder="Sac Rulo ST37" 
                        value={formFields.materialName || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, materialName: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Sac Kalınlığı (mm)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="2.00"
                        value={formFields.thicknessMm || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, thicknessMm: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Sac Genişliği (mm)</label>
                      <input 
                        type="number" 
                        placeholder="250"
                        value={formFields.widthMm || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, widthMm: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Kaplama (Mikron)</label>
                      <input 
                        type="number" 
                        placeholder="45"
                        value={formFields.coatingThicknessMicron || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, coatingThicknessMicron: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Görsel Durum</label>
                      <select 
                        value={formFields.visualStatus || 'Uygun'}
                        onChange={(e) => setFormFields(prev => ({ ...prev, visualStatus: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      >
                        <option value="Uygun">Uygun</option>
                        <option value="Hatalı">Hatalı</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Muayene Kararı</label>
                      <select 
                        value={formFields.decision || 'Kabul'}
                        onChange={(e) => setFormFields(prev => ({ ...prev, decision: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      >
                        <option value="Kabul">Kabul</option>
                        <option value="Koşullu Kabul">Koşullu Kabul</option>
                        <option value="Red">Red (Karantina + DÖF)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeDoc?.id === 'URT-05' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Müşteri Seçimi</label>
                    <select 
                      onChange={(e) => setFormFields(prev => ({ ...prev, customerId: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                    >
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Sevk İrsaliye No</label>
                      <input 
                        type="text" 
                        placeholder="SEVK-2026-..." 
                        value={formFields.dispatchNoteNo || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, dispatchNoteNo: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Ürün Kodu</label>
                      <input 
                        type="text" 
                        placeholder="SU 10" 
                        value={formFields.productCode || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, productCode: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Metraj (metre)</label>
                      <input 
                        type="number" 
                        placeholder="100" 
                        value={formFields.quantityMetres || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, quantityMetres: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Görsel Kontrol</label>
                      <select 
                        value={formFields.visualStatus || 'Uygun'}
                        onChange={(e) => setFormFields(prev => ({ ...prev, visualStatus: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      >
                        <option value="Uygun">Uygun</option>
                        <option value="Hatalı">Hatalı</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Kabul Kararı</label>
                      <select 
                        value={formFields.verdict || 'Kabul'}
                        onChange={(e) => setFormFields(prev => ({ ...prev, verdict: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      >
                        <option value="Kabul">Kabul</option>
                        <option value="Red">Red</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeDoc?.id.startsWith('DNY') && (
                <>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Deney Yapılan Ürün</label>
                    <input 
                      type="text" 
                      placeholder="SU 10" 
                      value={formFields.productCode || ''}
                      onChange={(e) => setFormFields(prev => ({ ...prev, productCode: e.target.value }))}
                      className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Uygulanan Yük (kN)</label>
                      <input 
                        type="number" 
                        placeholder="15" 
                        value={formFields.loadKN || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, loadKN: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Ölçülen Sehim (mm)</label>
                      <input 
                        type="number" 
                        placeholder="8" 
                        value={formFields.deflectionMm || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, deflectionMm: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Kullanılan Cihaz</label>
                      <input 
                        type="text" 
                        placeholder="XT-50 Yük Standı" 
                        value={formFields.testDevice || ''}
                        onChange={(e) => setFormFields(prev => ({ ...prev, testDevice: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Deney Kararı</label>
                      <select 
                        value={formFields.verdict || 'Geçti'}
                        onChange={(e) => setFormFields(prev => ({ ...prev, verdict: e.target.value }))}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                      >
                        <option value="Geçti">Geçti</option>
                        <option value="Kaldı">Kaldı</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Fallback Dynamic Form Fields based on TemplateFields */}
              {activeDoc?.id !== 'HM-01' && activeDoc?.id !== 'URT-05' && !activeDoc?.id.startsWith('DNY') && activeDoc?.templateFields && activeDoc.templateFields.length > 0 && (
                <div className="space-y-3">
                  {activeDoc.templateFields.map((field: any, idx: number) => {
                    const isRequired = field.isRequired;
                    return (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">
                          {field.fieldName} {isRequired && <span className="text-red-500">*</span>}
                        </label>
                        {field.fieldType === 'Date' ? (
                          <input 
                            type="date"
                            required={isRequired}
                            value={formFields[field.fieldName] || ''} onChange={(e) => setFormFields(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                          />
                        ) : field.fieldType === 'Number' ? (
                          <input 
                            type="number"
                            required={isRequired}
                            placeholder="0"
                            value={formFields[field.fieldName] || ''} onChange={(e) => setFormFields(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                          />
                        ) : field.fieldType === 'Boolean' ? (
                          <select 
                            required={isRequired}
                            value={formFields[field.fieldName] !== undefined ? String(formFields[field.fieldName]) : 'false'} onChange={(e) => setFormFields(prev => ({ ...prev, [field.fieldName]: e.target.value === 'true' }))}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                          >
                            <option value="false">Hayır</option>
                            <option value="true">Evet</option>
                          </select>
                        ) : (
                          <input 
                            type="text"
                            required={isRequired}
                            placeholder={`${field.fieldName} giriniz...`}
                            value={formFields[field.fieldName] || ''} onChange={(e) => setFormFields(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Detaylar / Muayene Notu</label>
                <textarea 
                  rows={2}
                  placeholder="Muayene bulguları ve ölçüm gözlemlerini yazınız..." 
                  value={formFields.notes || ''}
                  onChange={(e) => setFormFields(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-slate-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 text-slate-600 rounded hover:bg-slate-50 transition-colors"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  Kaydı Onayla ve E-İmzala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
