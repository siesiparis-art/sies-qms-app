'use client';

import React, { useState } from 'react';
import { useQms, MeasuringDevice, CalibrationRecord } from '@/context/QmsContext';
import { Activity, Plus, ShieldCheck, FileDown, Calendar, AlertOctagon, Check, X, FileText, Printer, ShieldAlert } from 'lucide-react';

// Simple native IndexedDB helper for large file storage
const dbName = 'qms_file_storage';
const storeName = 'pdf_files';

const getFileFromIndexedDB = (key: string): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        db.createObjectStore(storeName);
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const getReq = store.get(key);
        getReq.onsuccess = () => {
          resolve(getReq.result || '');
        };
        getReq.onerror = () => resolve('');
      };
      request.onerror = () => resolve('');
    } catch (err) {
      resolve('');
    }
  });
};

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
        tx.oncomplete = () => {
          resolve(true);
        };
        tx.onerror = () => {
          resolve(false);
        };
      };
      request.onerror = () => resolve(false);
    } catch (err) {
      resolve(false);
    }
  });
};

export default function CalibrationModule() {
  const { measuringDevices, addMeasuringDevice, updateMeasuringDevice, calibrationRecords, addCalibrationRecord, personnel } = useQms();
  const [activeDevId, setActiveDevId] = useState<string>(measuringDevices[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Calibration Record Form
  const [showCalForm, setShowCalForm] = useState(false);
  const [calCert, setCalCert] = useState('');
  const [calDate, setCalDate] = useState('2026-06-01');
  const [calResult, setCalResult] = useState<'Uygun' | 'Sapmalı' | 'Kullanılamaz'>('Uygun');

  // New Device Form
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [certNo, setCertNo] = useState('');

  // Detailed calibration form states (Enerji Kalibrasyon format)
  const [calManufacturer, setCalManufacturer] = useState('Insize');
  const [calTypeModel, setCalTypeModel] = useState('1108-150');
  const [calOrderNo, setCalOrderNo] = useState('T250944');
  const [calPageCount, setCalPageCount] = useState(3);
  const [showUploadedCert, setShowUploadedCert] = useState<any>(null);
  const [selectedCertBase64, setSelectedCertBase64] = useState<string>('');
  // Bulk Verification (FR-012) States
  const [bulkVerifDate, setBulkVerifDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bulkInspector, setBulkInspector] = useState('Faruk Oruç');
  const [bulkRows, setBulkRows] = useState<Record<string, {
    visual: 'Uygun' | 'Kusurlu';
    zero: 'Uygun' | 'Sapmalı';
    ref: string;
    measured: string;
    decision: 'Kabul' | 'Red';
  }>>({});
  const [activeVerifTab, setActiveVerifTab] = useState<'bulkEntry' | 'history'>('bulkEntry');
  const [printBulkDate, setPrintBulkDate] = useState<string | null>(null);

  // Helper to retrieve PDF from IndexedDB or Base64 and open in a new tab
  const handleOpenCertificate = async (device: any) => {
    if (device.pdfFileUrl && device.pdfFileUrl.startsWith('db://')) {
      const fileKey = 'pdf_file_' + device.id;
      const base64Data = await getFileFromIndexedDB(fileKey);
      if (base64Data) {
        openPdfInNewTab(base64Data, device.name + '_Sertifika.pdf');
      } else {
        alert("Sertifika belgesi veritabanında bulunamadı.");
      }
    } else if (device.pdfFileUrl && device.pdfFileUrl.startsWith('data:')) {
      openPdfInNewTab(device.pdfFileUrl, device.name + '_Sertifika.pdf');
    } else {
      // Fallback simulated modal view
      setShowUploadedCert(device);
    }
  };

  // Helper to convert Base64 to Blob and open in new tab (bypasses iframe sandboxing block)
  const openPdfInNewTab = (dataURI: string, filename: string) => {
    try {
      if (!dataURI) return;
      if (!dataURI.startsWith('data:')) return;
      
      const parts = dataURI.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const blobUrl = URL.createObjectURL(blob);
      
      const newTab = window.open(blobUrl, '_blank');
      if (!newTab) {
        // Popup blocker fallback
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'sertifika.pdf';
        link.click();
      }
    } catch (err) {
      console.error("Error opening PDF in new tab:", err);
      // Direct data uri link fallback
      const link = document.createElement('a');
      link.href = dataURI;
      link.download = filename || 'sertifika.pdf';
      link.click();
    }
  };

  // Initialize bulk verification rows
  React.useEffect(() => {
    const initialRows: any = {};
    measuringDevices.forEach(d => {
      let defaultRef = '50.00 mm';
      let defaultMeasured = '50.00 mm';
      if (d.name.toLowerCase().includes('kumpas')) {
        defaultRef = '50.00 mm';
        defaultMeasured = '50.00 mm';
      } else if (d.name.toLowerCase().includes('folyo')) {
        defaultRef = '100 µm';
        defaultMeasured = '100 µm';
      } else if (d.name.toLowerCase().includes('terazi') || d.name.toLowerCase().includes('kantar')) {
        defaultRef = '10.00 kg';
        defaultMeasured = '10.00 kg';
      } else if (d.name.toLowerCase().includes('kaplama')) {
        defaultRef = '100 µm';
        defaultMeasured = '100 µm';
      } else {
        defaultRef = '10.00';
        defaultMeasured = '10.00';
      }
      
      initialRows[d.id] = {
        visual: 'Uygun',
        zero: 'Uygun',
        ref: defaultRef,
        measured: defaultMeasured,
        decision: 'Kabul'
      };
    });
    setBulkRows(initialRows);
  }, [measuringDevices]);

  const handleSaveBulkVerification = () => {
    const newLogs: any[] = [];
    measuringDevices.forEach(d => {
      const row = bulkRows[d.id] || {
        visual: 'Uygun',
        zero: 'Uygun',
        ref: '10.00',
        measured: '10.00',
        decision: 'Kabul'
      };
      
      newLogs.push({
        id: `VL-${d.id}-${Date.now().toString().substring(11)}`,
        deviceId: d.id,
        deviceName: d.name,
        serialNumber: d.serialNumber,
        inspector: bulkInspector,
        date: bulkVerifDate,
        visualStatus: row.visual,
        zeroStatus: row.zero,
        refValue: row.ref,
        measuredValue: row.measured,
        decision: row.decision,
        notes: 'Toplu günlük doğrulama kontrolü gerçekleştirildi.'
      });
    });

    // Merge avoiding duplicates for the same device on the same date
    const filteredExisting = verificationLogs.filter(log => 
      !(log.date === bulkVerifDate && measuringDevices.some(d => d.id === log.deviceId))
    );

    const updated = [...newLogs, ...filteredExisting];
    setVerificationLogs(updated);
    localStorage.setItem('qms_device_verifications', JSON.stringify(updated));
    alert(`${bulkVerifDate} tarihine ait tüm cihazların günlük doğrulama (FR-012) kayıtları toplu olarak başarıyla kaydedildi! presidency`);
  };
  const activeDev = measuringDevices.find(d => d.id === activeDevId) || measuringDevices[0];

  // Verification Logs (FR-012) States
  const [verificationLogs, setVerificationLogs] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qms_device_verifications');
      return saved ? JSON.parse(saved) : [
        {
          id: 'VL-001',
          deviceId: 'DEV-001',
          deviceName: 'Dijital Kumpas 150mm',
          serialNumber: 'SN-KMP-202',
          inspector: 'Faruk Oruç',
          date: '2026-06-25',
          visualStatus: 'Uygun',
          zeroStatus: 'Uygun',
          refValue: '50.00 mm',
          measuredValue: '50.01 mm',
          decision: 'Kabul',
          notes: 'Mastar blok ara doğrulaması yapıldı, sapma limit içi.'
        },
        {
          id: 'VL-002',
          deviceId: 'DEV-002',
          deviceName: 'Dijital Mikrometre 0-25mm',
          serialNumber: 'SN-MIC-08',
          inspector: 'Faruk Oruç',
          date: '2026-06-26',
          visualStatus: 'Uygun',
          zeroStatus: 'Uygun',
          refValue: '10.00 mm',
          measuredValue: '10.00 mm',
          decision: 'Kabul',
          notes: 'Sıfır ayarı ve doğrulama başarılı.'
        },
        {
          id: 'VL-003',
          deviceId: 'DEV-003',
          deviceName: 'Kaplama Kalınlık Ölçer',
          serialNumber: 'SN-COAT-55',
          inspector: 'Faruk Oruç',
          date: '2026-06-28',
          visualStatus: 'Uygun',
          zeroStatus: 'Uygun',
          refValue: '100 µm',
          measuredValue: '102 µm',
          decision: 'Kabul',
          notes: 'Folyolu ara doğrulama yapıldı.'
        }
      ];
    }
    return [];
  });

  const [showVerifForm, setShowVerifForm] = useState(false);
  const [printVerifLog, setPrintVerifLog] = useState<any | null>(null);

  // Verification Form States
  const [verifInspector, setVerifInspector] = useState('Faruk Oruç');
  const [verifVisual, setVerifVisual] = useState<'Uygun' | 'Kusurlu'>('Uygun');
  const [verifZero, setVerifZero] = useState<'Uygun' | 'Sapmalı'>('Uygun');
  const [verifRef, setVerifRef] = useState('50.00 mm');
  const [verifMeasured, setVerifMeasured] = useState('50.00 mm');
  const [verifDecision, setVerifDecision] = useState<'Kabul' | 'Red'>('Kabul');
  const [verifNotes, setVerifNotes] = useState('');

  const handleAddVerification = () => {
    if (!activeDev) return;
    const newLog = {
      id: `VL-${Date.now().toString().substring(11)}`,
      deviceId: activeDev.id,
      deviceName: activeDev.name,
      serialNumber: activeDev.serialNumber,
      inspector: verifInspector,
      date: new Date().toISOString().split('T')[0],
      visualStatus: verifVisual,
      zeroStatus: verifZero,
      refValue: verifRef,
      measuredValue: verifMeasured,
      decision: verifDecision,
      notes: verifNotes || 'Periyodik ara doğrulama kontrolü gerçekleştirildi.'
    };

    const updated = [newLog, ...verificationLogs];
    setVerificationLogs(updated);
    localStorage.setItem('qms_device_verifications', JSON.stringify(updated));
    setShowVerifForm(false);
    
    // Clear inputs
    setVerifNotes('');
    alert("Doğrulama kaydı (FR-012) başarıyla kaydedildi.");
  };

  const handlePrintVerification = (log: any) => {
    setPrintVerifLog(log);
  };

  // Expiration countdown
  const getDeviceStatus = (d: MeasuringDevice) => {
    if (!d) return { label: 'Yok', style: 'text-slate-400', isExpired: false };
    
    const nextCal = new Date(d.nextCalibrationDate);
    const today = new Date();
    const diffTime = nextCal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        label: `SÜRESİ GEÇMİŞ (${Math.abs(diffDays)} gün önce)`, 
        style: 'text-red-500 bg-red-500/10 border-red-500/20 font-bold animate-pulse', 
        isExpired: true,
        daysText: 'Gecikmiş'
      };
    }
    if (diffDays <= 30) {
      return { 
        label: `YAKLAŞIYOR (${diffDays} gün kaldı)`, 
        style: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 font-bold', 
        isExpired: false,
        daysText: 'Kritik (E-posta Uyarısı Aktif)'
      };
    }
    return { 
      label: `UYGUN (Kalan: ${diffDays} gün)`, 
      style: 'text-green-500 bg-green-500/10 border-green-500/20', 
      isExpired: false,
      daysText: 'Güvenli'
    };
  };

  const handleAddDevice = () => {
    if (!name || !serialNumber) return;
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    addMeasuringDevice({
      id: `DEV-${Date.now()}`,
      name,
      serialNumber,
      certificateNumber: certNo || 'CERT-INITIAL',
      calibrationDate: today,
      nextCalibrationDate: nextYear,
      status: 'Kalibre'
    });
    setName('');
    setSerialNumber('');
    setCertNo('');
    setShowAddForm(false);
  };

  const handleCalibrate = () => {
    if (!calCert || !activeDev) return;
    
    const calDateObj = new Date(calDate);
    const nextCalDate = new Date(calDateObj.getFullYear() + 1, calDateObj.getMonth(), calDateObj.getDate()).toISOString().split('T')[0];
    
    // Add record to history log
    addCalibrationRecord({
      id: `CL-${Date.now()}`,
      deviceId: activeDev.id,
      calibrationDate: calDate,
      nextCalibrationDate: nextCalDate,
      calibratedBy: 'ENERJİ KALİBRASYON SAN. VE TİC. LTD. ŞTİ.',
      certificateNo: calCert,
      result: calResult
    });

    // Update active device details in database
    updateMeasuringDevice(activeDev.id, {
      calibrationDate: calDate,
      nextCalibrationDate: nextCalDate,
      certificateNumber: calCert,
      manufacturer: calManufacturer,
      typeModel: calTypeModel,
      orderNo: calOrderNo,
      pageCount: Number(calPageCount),
      status: calResult === 'Uygun' ? 'Kalibre' : 'Kullanım Dışı',
      pdfFileUrl: selectedCertBase64 || activeDev.pdfFileUrl // store base64 data URL
    });

    setCalCert('');
    setSelectedCertBase64('');
    setShowCalForm(false);
    
    alert(`[Kalibrasyon] ${activeDev.name} için Yeni Kalibrasyon Belgesi (${calCert}) başarıyla sisteme yüklendi ve cihaz bilgileri güncellendi!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">ÖLÇÜM ALETİ YÖNETİMİ</span>
          <h2 className="text-xl font-bold text-slate-800">Kalibrasyon ve Doğrulama Takip Modülü</h2>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Yeni Ölçüm Cihazı Ekle
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 max-w-lg">
          <h3 className="text-sm font-bold text-slate-800">Yeni Ölçüm Cihazı Tanımlama Kartı</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 mb-1">Cihaz Adı</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Dijital Mikro-ohm Metre"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Seri Numarası</label>
              <input 
                type="text" 
                value={serialNumber} 
                onChange={e => setSerialNumber(e.target.value)}
                placeholder="Örn: SN-OHM-404"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-500 mb-1">Başlangıç Kalibrasyon Sertifikası No</label>
              <input 
                type="text" 
                value={certNo} 
                onChange={e => setCertNo(e.target.value)}
                placeholder="Örn: CERT-2026-X1"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-2 text-slate-500 hover:text-slate-800">İptal</button>
            <button onClick={handleAddDevice} className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded">Cihazı Ekle</button>
          </div>
        </div>
      )}

      {/* ⚠️ KALİBRASYON VADE UYARI & BİLDİRİM PANELİ (ISO 9001 Standart Takip) */}
      {(() => {
        const warningDevices = measuringDevices.filter(d => {
          const nextCal = new Date(d.nextCalibrationDate);
          const today = new Date();
          const diffTime = nextCal.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30; // Under 30 days remaining or expired
        });

        if (warningDevices.length === 0) return null;

        return (
          <div className="bg-red-50/10 border border-red-500/20 rounded-xl p-4 space-y-3 print:hidden">
            <div className="flex items-center gap-2 border-b border-red-500/10 pb-2">
              <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Kalibrasyon Hatırlatma & Bildirim Paneli <span className="text-[10px] bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded animate-bounce">{warningDevices.length} UYARI</span>
              </h3>
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {warningDevices.map(d => {
                const nextCal = new Date(d.nextCalibrationDate);
                const today = new Date();
                const diffTime = nextCal.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isExpired = diffDays < 0;

                return (
                  <div key={d.id} className={`p-2.5 rounded border text-xs flex justify-between items-center ${isExpired ? 'bg-red-500/5 border-red-500/20 text-red-800' : 'bg-yellow-500/5 border-yellow-500/20 text-yellow-800'}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-base mt-0.5">{isExpired ? '❌' : '⚠️'}</span>
                      <div>
                        <span className="font-bold block">{d.id} - {d.name} (Seri No: {d.serialNumber})</span>
                        <span className="text-[10px] block mt-0.5">
                          {isExpired 
                            ? `DİKKAT: Cihazın kalibrasyon süresi ${Math.abs(diffDays)} gün önce dolmuştur! ISO 9001 gereğince alet derhal kırmızı etiketlenmeli ve kullanım dışı bırakılmalıdır!` 
                            : `UYARI: Kalibrasyon süresinin dolmasına son ${diffDays} gün kaldı! Sistem her gün otomatik hatırlatma yapmaktadır. Lütfen akredite laboratuvardan randevu alın.`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveDevId(d.id);
                        setShowCalForm(true);
                      }}
                      className={`text-[9px] font-bold px-2.5 py-1 rounded shadow-sm border transition-colors ${
                        isExpired 
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-700' 
                          : 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-700'
                      }`}
                    >
                      Sertifika Yükle / Güncelle
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Main Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Devices Sidebar */}
        <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 max-h-[500px] overflow-y-auto">
          <span className="block text-xs font-semibold text-slate-400 uppercase mb-3">Kayıtlı Ölçüm Aletleri ({measuringDevices.length})</span>
          {measuringDevices.map(d => {
            const statusInfo = getDeviceStatus(d);
            return (
              <button
                key={d.id}
                onClick={() => { setActiveDevId(d.id); setShowCalForm(false); }}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                  activeDevId === d.id 
                    ? 'bg-[#ff6b00]/10 text-slate-800 border-[#ff6b00]/30' 
                    : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="space-y-1 w-full">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-850 truncate max-w-[150px]">{d.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${statusInfo.style}`}>
                      {statusInfo.isExpired ? 'Gecikmiş' : 'Aktif'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-1.5 text-[9px] text-slate-500 font-mono">
                    <div>Envanter: <span className="text-slate-700 font-semibold">{d.id}</span></div>
                    <div className="truncate">Seri: <span className="text-slate-700">{d.serialNumber}</span></div>
                    <div>Son Kal: <span className="text-slate-700">{d.calibrationDate}</span></div>
                    <div className="text-[#ff6b00] font-bold">Vade: {d.nextCalibrationDate}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Device Details and Calibrations */}
        <div className="md:col-span-2 border border-slate-200 bg-white rounded-xl p-5 space-y-6">
          {activeDev ? (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#ff6b00]/10 text-[#ff6b00] rounded-lg border border-[#ff6b00]/20">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{activeDev.name}</h3>
                    <p className="text-xs text-slate-500">Seri No: {activeDev.serialNumber} | Aktif Sertifika: {activeDev.certificateNumber}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowCalForm(!showCalForm)}
                  className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Kalibrasyon Yenile
                </button>
              </div>

              {/* Status card */}
              {(() => {
                const statusInfo = getDeviceStatus(activeDev);
                return (
                  <div className={`border p-4 rounded-lg flex items-center gap-3 text-xs ${statusInfo.style}`}>
                    {statusInfo.isExpired ? (
                      <AlertOctagon className="h-6 w-6 text-red-500 animate-bounce" />
                    ) : (
                      <ShieldCheck className="h-6 w-6 text-green-500" />
                    )}
                    <div>
                      <span className="block font-bold text-slate-800 uppercase tracking-wider">{statusInfo.label}</span>
                      <span className="text-[10px] block opacity-80 mt-0.5">Bildirim Takip Durumu: {statusInfo.daysText}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Daily Verification Status Check (FR-012) */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const hasVerificationToday = verificationLogs.some(log => 
                  log.deviceId === activeDev.id && log.date === todayStr
                );

                return (
                  <div className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    hasVerificationToday 
                      ? 'bg-green-500/5 border-green-500/20 text-green-800' 
                      : 'bg-red-500/5 border-red-500/20 text-red-800 animate-pulse'
                  }`}>
                    <div className="flex items-start gap-2.5 text-xs">
                      <span className="text-base mt-0.5">{hasVerificationToday ? '🟢' : '🔴'}</span>
                      <div>
                        <span className="font-bold block uppercase tracking-wider text-[10px]">
                          Günlük Fonksiyon Kontrol Durumu (FR-012)
                        </span>
                        <span className="text-[11px] block mt-0.5">
                          {hasVerificationToday 
                            ? `BUGÜNÜN KONTROLÜ YAPILDI: Cihazın bugünkü fonksiyon kontrolü başarıyla tamamlandı ve sapma sınır içi olarak tescillendi.`
                            : `BUGÜNÜN KONTROLÜ YAPILMADI: ISO 9001:2015 standardı gereğince bu ölçüm cihazı ile üretime başlamadan önce günlük kumpas/folyo/terazi fonksiyon testi yapılmalıdır!`}
                        </span>
                      </div>
                    </div>
                    {!hasVerificationToday && (
                      <button
                        onClick={() => {
                          setVerifNotes('');
                          setVerifVisual('Uygun');
                          setVerifZero('Uygun');
                          setVerifDecision('Kabul');
                          // set default reference and measurements based on device name
                          if (activeDev.name.toLowerCase().includes('kumpas')) {
                            setVerifRef('50.00 mm');
                            setVerifMeasured('50.00 mm');
                          } else if (activeDev.name.toLowerCase().includes('folyo')) {
                            setVerifRef('100 µm');
                            setVerifMeasured('100 µm');
                          } else if (activeDev.name.toLowerCase().includes('terazi') || activeDev.name.toLowerCase().includes('kantar')) {
                            setVerifRef('10.00 kg');
                            setVerifMeasured('10.00 kg');
                          } else if (activeDev.name.toLowerCase().includes('kaplama')) {
                            setVerifRef('100 µm');
                            setVerifMeasured('100 µm');
                          } else {
                            setVerifRef('10.00');
                            setVerifMeasured('10.00');
                          }
                          setShowVerifForm(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-[10px] flex items-center gap-1 shadow-sm shrink-0"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" /> Şimdi Kontrol Yap (FR-012)
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Detailed Device Attributes (Enerji Kalibrasyon Format) */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-xs">
                <span className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b pb-1">Cihaz Kimlik & Sertifika Detayları</span>
                <div className="grid grid-cols-2 gap-y-2 text-slate-600">
                  <div><strong>Envanter No (ID):</strong> <span className="text-slate-900 font-mono font-bold">{activeDev.id}</span></div>
                  <div><strong>Cihaz Sahibi:</strong> <span className="text-slate-900">{activeDev.customerName || 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti'}</span></div>
                  <div className="col-span-2"><strong>Adres:</strong> <span className="text-slate-900">{activeDev.address || 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul'}</span></div>
                  <div><strong>İmalatçı (Manufacturer):</strong> <span className="text-slate-900 font-bold">{activeDev.manufacturer || 'Insize'}</span></div>
                  <div><strong>Tip / Model (Type):</strong> <span className="text-slate-900 font-bold">{activeDev.typeModel || '1108-150'}</span></div>
                  <div><strong>Seri Numarası:</strong> <span className="text-slate-900 font-mono font-bold">{activeDev.serialNumber}</span></div>
                  <div><strong>Teklif No (Order Nr):</strong> <span className="text-slate-900 font-mono">{activeDev.orderNo || 'T250944'}</span></div>
                  <div><strong>Sertifika No:</strong> <span className="text-slate-900 font-mono font-bold">{activeDev.certificateNumber}</span></div>
                  <div><strong>Sertifika Sayfa Sayısı:</strong> <span className="text-slate-900">{activeDev.pageCount || 3}</span></div>
                  <div className="col-span-2 flex items-center gap-1.5 mt-1 border-t pt-2">
                    <strong>Belge Durumu:</strong> 
                    {activeDev.certificateNumber ? (
                      <button 
                        onClick={() => handleOpenCertificate(activeDev)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1 rounded text-[10px] shadow-sm flex items-center gap-1 animate-pulse"
                      >
                        <FileText className="h-3 w-3" /> Sertifika Belgesini Aç (PDF)
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Yüklü Belge Bulunmuyor</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-500">
                <div className="border border-slate-200 p-3 rounded bg-slate-50">
                  <span className="text-[10px] text-slate-400 block uppercase">Son Kalibrasyon</span>
                  <span className="text-slate-800 font-bold block mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" /> {activeDev.calibrationDate}
                  </span>
                </div>
                <div className="border border-slate-200 p-3 rounded bg-slate-50">
                  <span className="text-[10px] text-slate-400 block uppercase">Gelecek Kalibrasyon Vadesi</span>
                  <span className="text-slate-800 font-bold block mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#ff6b00]" /> {activeDev.nextCalibrationDate}
                  </span>
                </div>
              </div>

              {/* Calibration renewal form */}
              {showCalForm && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[#ff6b00]">Yeni Kalibrasyon Kayıt Girişi</h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Yeni Sertifika No</label>
                      <input 
                        type="text" 
                        value={calCert} 
                        onChange={e => setCalCert(e.target.value)}
                        placeholder="Örn: 0186K-0725-00555"
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Kalibrasyon Tarihi</label>
                      <input 
                        type="date" 
                        value={calDate} 
                        onChange={e => setCalDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Sonuç Uygunluğu</label>
                      <select 
                        value={calResult} 
                        onChange={e => setCalResult(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                      >
                        <option value="Uygun">Uygun</option>
                        <option value="Sapmalı">Sapmalı (Tolerans Dışı)</option>
                        <option value="Kullanılamaz">Kullanılamaz / Hurda</option>
                      </select>
                    </div>
                    
                    {/* Additional fields from the Enerji Kalibrasyon Certificate (2nd picture) */}
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">İmalatçı (Manufacturer)</label>
                      <input 
                        type="text" 
                        value={calManufacturer} 
                        onChange={e => setCalManufacturer(e.target.value)}
                        placeholder="Örn: Insize"
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Tip / Model (Type)</label>
                      <input 
                        type="text" 
                        value={calTypeModel} 
                        onChange={e => setCalTypeModel(e.target.value)}
                        placeholder="Örn: 1108-150"
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Teklif Numarası (Order Nr)</label>
                      <input 
                        type="text" 
                        value={calOrderNo} 
                        onChange={e => setCalOrderNo(e.target.value)}
                        placeholder="Örn: T250944"
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1 font-bold">Sertifika Sayfa Sayısı</label>
                      <input 
                        type="number" 
                        value={calPageCount} 
                        onChange={e => setCalPageCount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                      />
                    </div>

                    {/* Belge Yükleme Alanı */}
                    <div className="col-span-3">
                      <label className="block text-slate-500 mb-1 font-bold text-[10px] uppercase">Kalibrasyon Sertifikası Yükleme (.pdf, .jpg, .png)</label>
                      <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-white flex flex-col items-center justify-center text-center">
                        <FileText className="h-6 w-6 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-600 font-semibold">Belgeyi sürükleyin veya Dosya Seç butonuna tıklayın</span>
                        <input 
                          type="file" 
                          id="cert-file-picker" 
                          className="hidden" 
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const base64Data = event.target?.result as string;
                                setCalCert(file.name);
                                const fileKey = 'pdf_file_' + activeDev.id;
                                await saveFileToIndexedDB(fileKey, base64Data);
                                setSelectedCertBase64('db://' + activeDev.id);
                                alert(`${file.name} belgesi IndexedDB depolama alanına başarıyla yüklendi! Lütfen kaydetmek için alttaki "Kalibrasyon Sertifikasını Kaydet" butonuna basın.`);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button 
                          type="button" 
                          onClick={() => document.getElementById('cert-file-picker')?.click()}
                          className="mt-1.5 bg-slate-100 hover:bg-slate-200 border text-slate-700 font-bold px-3 py-1 rounded text-[9px]"
                        >
                          Dosya Seç
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button onClick={() => setShowCalForm(false)} className="px-3 py-1.5 text-slate-500 hover:text-slate-800">İptal</button>
                    <button onClick={handleCalibrate} className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-1.5 rounded flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Kalibrasyon Sertifikasını Kaydet
                    </button>
                  </div>
                </div>
              )}

              {/* Calibration Records log */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Kalibrasyon Laboratuvar Sertifika Geçmişi</span>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {calibrationRecords.filter(r => r.deviceId === activeDev.id).map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1.5">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-[#ff6b00] font-bold">CL-{r.id.substring(10)}</span>
                        <span className="text-slate-400">{r.calibrationDate}</span>
                      </div>
                      <div className="text-slate-700 grid grid-cols-2 gap-2 text-[11px]">
                        <span>Sertifika No: <span className="text-slate-800 font-bold">{r.certificateNo}</span></span>
                        <span>Akredite Kurum: <span className="text-slate-800">{r.calibratedBy}</span></span>
                        <span>Sonuç: <span className={r.result === 'Uygun' ? 'text-green-500' : 'text-red-500'}>{r.result}</span></span>
                        <span>Vade: <span className="text-slate-800">{r.nextCalibrationDate}</span></span>
                      </div>
                    </div>
                  ))}
                  {calibrationRecords.filter(r => r.deviceId === activeDev.id).length === 0 && (
                    <span className="text-xs text-slate-400 italic block py-4 text-center">Bu cihaz için henüz akredite kalibrasyon kaydı eklenmemiştir. (Fabrika ilk girişi)</span>
                  )}
                </div>
              </div>

              {/* SECTION: Periodic Ara Doğrulama & Fonksiyon Kontrolü (FR-012) */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#ff6b00]" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Periyodik Ara Doğrulama & Fonksiyon Kontrolü (FR-012)</span>
                  </div>
                  <button
                    onClick={() => setShowVerifForm(!showVerifForm)}
                    className="bg-transparent hover:bg-slate-200 text-[#ff6b00] border border-[#ff6b00]/30 hover:border-[#ff6b00] font-bold px-3 py-1 rounded text-[10px] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Yeni Doğrulama Yap (FR-012)
                  </button>
                </div>

                {showVerifForm && (
                  <div className="bg-slate-50 border border-[#ff6b00]/20 p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[#ff6b00]">Cihaz Fonksiyon Kontrol Form Girişi</span>
                      <button onClick={() => setShowVerifForm(false)} className="text-slate-500 hover:text-slate-800"><X className="h-4 w-4" /></button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-1">Kontrol Eden (Kalite Sorumlusu)</label>
                        <select
                          value={verifInspector}
                          onChange={e => setVerifInspector(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                        >
                          {personnel.map(p => (
                            <option key={p.id} value={p.name}>{p.name} ({p.position})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Görsel Kontrol (Pas/Hasar/Ekran)</label>
                        <select
                          value={verifVisual}
                          onChange={e => setVerifVisual(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                        >
                          <option value="Uygun">Uygun (Hasarsız)</option>
                          <option value="Kusurlu">Kusurlu (Hasarlı/Paslı)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Sıfır Noktası Kontrolü (Zero Align)</label>
                        <select
                          value={verifZero}
                          onChange={e => setVerifZero(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                        >
                          <option value="Uygun">Uygun (Sıfırlıyor)</option>
                          <option value="Sapmalı">Sapmalı (Sıfırlamıyor)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Standart Referans Mastar / Folyo</label>
                        <input
                          type="text"
                          value={verifRef}
                          onChange={e => setVerifRef(e.target.value)}
                          placeholder="Örn: 50.00 mm veya 100 µm"
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Ölçülen Değer</label>
                        <input
                          type="text"
                          value={verifMeasured}
                          onChange={e => setVerifMeasured(e.target.value)}
                          placeholder="Örn: 50.01 mm veya 99 µm"
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Doğrulama Sonuç Kararı</label>
                        <select
                          value={verifDecision}
                          onChange={e => setVerifDecision(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                        >
                          <option value="Kabul">Kabul (Sapma Tolerans İçi)</option>
                          <option value="Red">Red (Kullanım Dışı / Servise Gönder)</option>
                        </select>
                      </div>

                      <div className="col-span-2 md:col-span-3">
                        <label className="block text-slate-500 mb-1">Muayene Açıklaması / Notlar</label>
                        <input
                          type="text"
                          value={verifNotes}
                          onChange={e => setVerifNotes(e.target.value)}
                          placeholder="Mastar bloklar ile doğrulandı, sapma limit içi vb."
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-xs">
                      <button onClick={() => setShowVerifForm(false)} className="px-3 py-1.5 text-slate-500 hover:text-slate-800">İptal</button>
                      <button onClick={handleAddVerification} className="bg-green-600 hover:bg-green-700 text-slate-800 font-bold px-4 py-1.5 rounded flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Doğrulamayı Kaydet & Logla
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {verificationLogs.filter(l => l.deviceId === activeDev.id).map(l => (
                    <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#ff6b00] font-mono font-bold">{l.id}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{l.date}</span>
                          <span className={`text-[9px] px-1 rounded font-bold ${
                            l.decision === 'Kabul' 
                              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {l.decision === 'Kabul' ? 'UYGUN' : 'RED'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[10px] grid grid-cols-2 gap-x-4 gap-y-0.5 font-sans">
                          <span>Kontrolör: <span className="text-slate-800">{l.inspector}</span></span>
                          <span>Görsel / Sıfır: <span className="text-slate-800">{l.visualStatus} / {l.zeroStatus}</span></span>
                          <span>Referans Mastar: <span className="text-slate-800 font-bold">{l.refValue}</span></span>
                          <span>Ölçülen Değer: <span className="text-slate-800 font-bold">{l.measuredValue}</span></span>
                        </div>
                        <p className="text-[10px] text-slate-400 italic font-sans truncate max-w-[320px]">{l.notes}</p>
                      </div>

                      <button
                        onClick={() => handlePrintVerification(l)}
                        className="bg-slate-200 hover:bg-slate-100 border border-slate-200 text-slate-800 p-2 rounded hover:text-[#ff6b00] transition-colors flex items-center justify-center shrink-0"
                        title="Doğrulama Formu FR-012 Önizle / Yazdır"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {verificationLogs.filter(l => l.deviceId === activeDev.id).length === 0 && (
                    <span className="text-xs text-slate-400 italic block py-4 text-center">Bu cihaz için henüz ara doğrulama fonksiyon kontrol kaydı yapılmamıştır.</span>
                  )}
                </div>
              </div>

            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Gösterilecek test cihazı bulunamadı.
            </div>
          )}
        </div>

      </div>

      {/* 🛡️ TOPLU GÜNLÜK ARA DOĞRULAMA (FR-012) PANELİ */}
      <div className="border border-slate-200 bg-white rounded-xl p-5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#ff6b00]" />
            <div>
              <h3 className="text-base font-bold text-slate-800">Toplu Günlük Ara Doğrulama ve Fonksiyon Takip Defteri (FR-012)</h3>
              <p className="text-[11px] text-slate-500">Tüm kumpas, mikrometre, folyo ve terazilerin günlük doğrulamalarını tek ekranda girip tarih tarih takip edin.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs self-end md:self-auto">
            <button
              onClick={() => setActiveVerifTab('bulkEntry')}
              className={`px-3 py-1.5 font-bold rounded ${activeVerifTab === 'bulkEntry' ? 'bg-[#ff6b00] text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              Toplu Doğrulama Girişi (Bugün)
            </button>
            <button
              onClick={() => setActiveVerifTab('history')}
              className={`px-3 py-1.5 font-bold rounded ${activeVerifTab === 'history' ? 'bg-[#ff6b00] text-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
            >
              Tarih Tarih Kayıt Defteri
            </button>
          </div>
        </div>

        {activeVerifTab === 'bulkEntry' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border p-3 rounded-lg text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Doğrulama Kontrol Tarihi</label>
                  <input
                    type="date"
                    value={bulkVerifDate}
                    onChange={e => setBulkVerifDate(e.target.value)}
                    className="bg-white border rounded px-3 py-1.5 text-slate-800 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Kontrol Eden (Kalite Sorumlusu)</label>
                  <select
                    value={bulkInspector}
                    onChange={e => setBulkInspector(e.target.value)}
                    className="bg-white border rounded px-3 py-1.5 text-slate-800 focus:outline-none"
                  >
                    {personnel.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.position})</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleSaveBulkVerification}
                className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2.5 rounded flex items-center gap-1.5 text-xs shadow"
              >
                <Check className="h-4 w-4" /> Tümünün Doğrulama Kayıtlarını Kaydet (Toplu FR-012)
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b">
                    <th className="p-3 w-[100px]">Envanter No</th>
                    <th className="p-3">Ölçüm Cihazı Adı</th>
                    <th className="p-3">Seri No</th>
                    <th className="p-3 w-[120px]">Görsel Durum</th>
                    <th className="p-3 w-[120px]">Sıfır Ayarı</th>
                    <th className="p-3 w-[110px]">Mastar Değeri</th>
                    <th className="p-3 w-[110px]">Ölçülen Değer</th>
                    <th className="p-3 w-[100px]">Karar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {measuringDevices.map(d => {
                    const row = bulkRows[d.id] || {
                      visual: 'Uygun',
                      zero: 'Uygun',
                      ref: '10.00',
                      measured: '10.00',
                      decision: 'Kabul'
                    };

                    const updateRow = (fields: Partial<typeof row>) => {
                      setBulkRows(prev => ({
                        ...prev,
                        [d.id]: { ...prev[d.id] || row, ...fields }
                      }));
                    };

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-900">{d.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{d.name}</td>
                        <td className="p-3 font-mono text-slate-500">{d.serialNumber}</td>
                        <td className="p-3">
                          <select
                            value={row.visual}
                            onChange={e => updateRow({ visual: e.target.value as any })}
                            className="w-full bg-white border rounded px-2 py-1 text-slate-800 text-[11px]"
                          >
                            <option value="Uygun">Uygun</option>
                            <option value="Kusurlu">Kusurlu</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={row.zero}
                            onChange={e => updateRow({ zero: e.target.value as any })}
                            className="w-full bg-white border rounded px-2 py-1 text-slate-800 text-[11px]"
                          >
                            <option value="Uygun">Uygun</option>
                            <option value="Sapmalı">Sapmalı</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.ref}
                            onChange={e => updateRow({ ref: e.target.value })}
                            className="w-full bg-white border rounded px-2 py-1 text-slate-800 text-[11px] font-mono"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.measured}
                            onChange={e => updateRow({ measured: e.target.value })}
                            className="w-full bg-white border rounded px-2 py-1 text-slate-800 text-[11px] font-mono font-bold text-orange-600"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={row.decision}
                            onChange={e => updateRow({ decision: e.target.value as any })}
                            className={`w-full bg-white border rounded px-2 py-1 text-[11px] font-bold ${row.decision === 'Kabul' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            <option value="Kabul">Kabul</option>
                            <option value="Red">Red</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <span className="block text-xs font-semibold text-slate-400 uppercase">Tarih Bazlı Günlük Doğrulama Kayıt Defterleri</span>
            
            {(() => {
              const dateGroups: Record<string, typeof verificationLogs> = {};
              verificationLogs.forEach(log => {
                if (!dateGroups[log.date]) {
                  dateGroups[log.date] = [];
                }
                dateGroups[log.date].push(log);
              });

              const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));

              if (sortedDates.length === 0) {
                return <span className="text-xs text-slate-400 italic block py-6 text-center">Henüz kaydedilmiş günlük doğrulama bulunmamaktadır.</span>;
              }

              return (
                <div className="space-y-2">
                  {sortedDates.map(date => {
                    const logs = dateGroups[date];
                    const isAllOk = logs.every(l => l.decision === 'Kabul');
                    return (
                      <div key={date} className="p-3.5 bg-slate-50 border rounded-lg flex items-center justify-between text-xs hover:bg-slate-100/55 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-base">{isAllOk ? '🟢' : '🔴'}</span>
                          <div>
                            <span className="font-bold block text-slate-800 font-mono text-[13px]">{date}</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {logs.length} Cihaz Kontrolü Yapıldı | Sorumlu: <span className="font-semibold">{logs[0]?.inspector}</span>
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setPrintBulkDate(date)}
                          className="bg-white hover:bg-orange-655 hover:text-[#ff6b00] border text-slate-800 font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-colors text-[10px]"
                        >
                          <Printer className="h-3.5 w-3.5" /> Toplu Rapor Yazdır (A4)
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* MODAL: FR-012 QUALITY CONTROL PRINT PREVIEW */}
      {/* 📜 ENERJİ KALİBRASYON SERTİFİKA GÖRÜNTÜLEYİCİ MODAL */}
      {showUploadedCert && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto print:p-0">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-[850px] overflow-hidden flex flex-col my-8 print:my-0 print:border-0 print:shadow-none print:rounded-none">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-orange-500" /> Kalibrasyon Sertifikası Ön İzleme ({showUploadedCert.id})
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" /> Sertifikayı Yazdır (A4)
                </button>
                <button 
                  onClick={() => setShowUploadedCert(null)} 
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded text-xs font-bold"
                >
                  Kapat
                </button>
              </div>
            </div>

            {/* Certificate A4 Sheet or actual PDF iframe (High Fidelity Recreation of 2nd Picture) */}
            <div className="p-4 bg-slate-100 flex-1 flex flex-col items-center justify-start print:bg-white print:p-0 min-h-[600px] overflow-y-auto space-y-4">
              
              {/* If actual file uploaded, show download card and image preview (or iframe option) */}
              {showUploadedCert.pdfFileUrl && showUploadedCert.pdfFileUrl.startsWith('data:') ? (
                <div className="w-full max-w-[210mm] bg-white border border-slate-300 rounded-lg p-6 shadow-md flex flex-col items-center justify-center space-y-4 mb-2 print:hidden">
                  <div className="p-4 bg-red-50 text-red-500 rounded-full">
                    <FileText className="h-12 w-12" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Yüklenen Resmi Kalibrasyon Sertifikası</h3>
                    <p className="text-xs text-slate-500">Dosya Adı: <span className="font-mono font-bold text-slate-700">{showUploadedCert.pdfFileUrl.substring(5, 40)}...</span></p>
                    <p className="text-[11px] text-slate-400">Sertifika No: <span className="font-mono font-bold">{showUploadedCert.certificateNumber}</span></p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        openPdfInNewTab(showUploadedCert.pdfFileUrl, showUploadedCert.name + '_Sertifika.pdf');
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <FileDown className="h-4 w-4" /> Belgeyi İndir / Aç
                    </button>
                    <a 
                      href="https://disk.yandex.com.tr/d/1322d_cn4bYRaA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      ☁️ Yandex Disk Arşivinde Gör (10 GB Sınırsız)
                    </a>
                  </div>

                  {/* If it's an image, display inline preview */}
                  {!showUploadedCert.pdfFileUrl.startsWith('data:application/pdf') && (
                    <div className="border-t pt-4 w-full flex justify-center">
                      <img 
                        src={showUploadedCert.pdfFileUrl} 
                        alt="Sertifika Önizleme" 
                        className="max-w-full max-h-[400px] object-contain rounded border"
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {/* High Fidelity Enerji Kalibrasyon Template (Always show metadata table for readability) */}
              <div className="print-area print-portrait w-full max-w-[210mm] bg-white text-black p-8 shadow-lg border border-slate-300 rounded font-sans leading-normal mx-auto print:border-0 print:shadow-none print:p-0" style={{ minHeight: '297mm' }}>
                
                {/* Upper Header Grid */}
                <div className="border border-black p-4 flex justify-between items-start gap-4">
                  {/* Left Column: Enerji Kalibrasyon Logo & Address */}
                  <div className="flex items-center gap-3">
                    <div className="text-red-600 font-extrabold text-2xl tracking-tighter leading-none border-r border-slate-300 pr-3 flex flex-col items-center">
                      <span className="text-slate-900 text-xs font-bold uppercase block tracking-widest">enerji</span>
                      <span className="text-red-600 font-black italic block">kalibrasyon</span>
                    </div>
                    <div className="text-[9px] text-slate-800 font-sans leading-tight">
                      <strong className="block text-[10px] text-blue-900 font-extrabold uppercase">ENERJİ KALİBRASYON SAN. VE TİC. LTD. ŞTİ.</strong>
                      <span>Kaynarca Mah. Sazlı Sok. No:9/A Pendik / İSTANBUL</span><br />
                      <span>Tel: 0216 390 55 11</span><br />
                      <a href="http://www.enerjikalibrasyon.com" target="_blank" className="text-blue-600 underline">www.enerjikalibrasyon.com</a> | info@enerjikalibrasyon.com
                    </div>
                  </div>

                  {/* Middle Column: TÜRKAK Logo & Accreditation info */}
                  <div className="flex flex-col items-center border border-red-600 p-2 rounded text-center max-w-[120px] font-sans">
                    <span className="text-red-600 font-bold text-[10px] leading-none uppercase">TÜRKAK</span>
                    <div className="w-8 h-8 rounded-full border border-red-600 my-1.5 flex items-center justify-center text-[8px] text-red-600 font-extrabold">
                      ✓
                    </div>
                    <span className="text-[7px] text-slate-800 leading-none">Kalibrasyon</span>
                    <span className="text-[7px] text-slate-800 leading-none">TS EN ISO/IEC 17025</span>
                    <span className="text-[7px] text-red-600 font-bold leading-none mt-0.5">AB-0186-K</span>
                  </div>

                  {/* Right Column: certificate ID & QR Code */}
                  <div className="flex flex-col items-end text-right font-sans">
                    {/* Simulated QR Code */}
                    <div className="w-12 h-12 border border-slate-900 p-1 bg-white mb-2 flex items-center justify-center">
                      <div className="grid grid-cols-4 gap-0.5 w-10 h-10 bg-slate-900">
                        {Array.from({ length: 16 }).map((_, idx) => (
                          <div key={idx} className={`w-2 h-2 ${idx % 3 === 0 || idx % 5 === 0 ? 'bg-white' : 'bg-slate-900'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 block uppercase">Sertifika No / Certificate Nr</span>
                    <span className="text-xs font-mono font-bold text-slate-900 block">{showUploadedCert.certificateNumber || '0186K-0725-00555'}</span>
                  </div>
                </div>

                {/* Document Title */}
                <div className="text-center my-6">
                  <h2 className="text-lg font-black text-blue-900 tracking-wider uppercase leading-none">KALİBRASYON SERTİFİKASI</h2>
                  <span className="text-[10px] text-slate-500 italic block mt-0.5">CALIBRATION CERTIFICATE</span>
                </div>

                {/* Attributes Table */}
                <div className="border border-black divide-y divide-black text-xs">
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">Cihaz Sahibi<br /><span className="text-[9px] text-slate-500 font-normal italic">Customer</span></div>
                    <div className="p-2 col-span-2 font-bold text-slate-900">{showUploadedCert.customerName || 'Sies Elektrik Mümessillik San. ve Tic. Ltd. Şti'}</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">Adres<br /><span className="text-[9px] text-slate-500 font-normal italic">Address</span></div>
                    <div className="p-2 col-span-2 text-slate-900">{showUploadedCert.address || 'Yeşilce Mah. Daim Sok. 6 D:1 Kağıthane/İstanbul'}</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">Teklif Numarası<br /><span className="text-[9px] text-slate-500 font-normal italic">Order Nr</span></div>
                    <div className="p-2 col-span-2 text-slate-900 font-mono">{showUploadedCert.orderNo || 'T250944'}</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">Makine / Cihaz<br /><span className="text-[9px] text-slate-500 font-normal italic">Instrument / Device</span></div>
                    <div className="p-2 col-span-2 text-slate-900 font-bold">{showUploadedCert.name}</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">İmalatçı<br /><span className="text-[9px] text-slate-500 font-normal italic">Manufacturer</span></div>
                    <div className="p-2 col-span-2 text-slate-900 font-bold">{showUploadedCert.manufacturer || 'Insize'}</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">Tip / Model<br /><span className="text-[9px] text-slate-500 font-normal italic">Type</span></div>
                    <div className="p-2 col-span-2 text-slate-900 font-mono font-bold">{showUploadedCert.typeModel || '1108-150'}</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">Seri Numarası<br /><span className="text-[9px] text-slate-500 font-normal italic">Serial Nr</span></div>
                    <div className="p-2 col-span-2 text-slate-900 font-mono font-bold">{showUploadedCert.serialNumber}</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">Kalibrasyon Tarihi<br /><span className="text-[9px] text-slate-500 font-normal italic">Date of Calibration</span></div>
                    <div className="p-2 col-span-2 text-slate-900 font-mono font-bold">{showUploadedCert.calibrationDate}</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-black">
                    <div className="p-2 font-bold bg-slate-50">Sayfa Sayısı<br /><span className="text-[9px] text-slate-500 font-normal italic">Nr of pages of Cert.</span></div>
                    <div className="p-2 text-slate-900">{showUploadedCert.pageCount || 3}</div>
                    <div className="p-2 bg-slate-50 border-l border-black font-bold">Envanter No: <span className="text-slate-950 font-mono">{showUploadedCert.id}</span></div>
                  </div>
                </div>

                {/* Accreditation text statement */}
                <div className="text-[9px] text-slate-600 leading-tight mt-6 space-y-2 border-t pt-4">
                  <p>
                    <strong>Enerji Kalibrasyon</strong>, TÜRKAK tarafından AB-0186-K akreditasyon numarası ile TS EN ISO/IEC 17025:2017 standardına göre akredite edilmiştir.
                  </p>
                  <p className="italic">
                    This certificate documents the traceability to national standards, which realize the physical units of measurements according to the International System of Units (SI).
                  </p>
                </div>

                {/* Signatures block */}
                <div className="mt-12 flex justify-between items-center text-xs font-bold text-slate-800">
                  <div className="text-center">
                    <span>Kalibrasyonu Yapan</span><br />
                    <span className="text-slate-500 font-normal italic text-[10px]">Calibrated by</span><br />
                    <span className="block mt-4 text-slate-900 font-bold">Kemal Sunal</span>
                  </div>
                  <div className="text-center">
                    <span>Onaylayan (Laboratuvar Müdürü)</span><br />
                    <span className="text-slate-500 font-normal italic text-[10px]">Approved by</span><br />
                    <span className="block mt-4 text-slate-900 font-bold">İbrahim Sert</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 bg-slate-100 flex justify-end gap-2 border-t print:hidden">
              <button 
                onClick={() => setShowUploadedCert(null)} 
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded text-xs shadow-md"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📜 FR-012 TOPLU GÜNLÜK DOĞRULAMA A4 YAZDIRMA MODALİ */}
      {printBulkDate && (() => {
        const logsForDate = verificationLogs.filter(l => l.date === printBulkDate);
        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto print:p-0">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-[850px] overflow-hidden flex flex-col my-8 print:my-0 print:border-0 print:shadow-none print:rounded-none">
              {/* Modal Header */}
              <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="h-4 w-4 text-[#ff6b00]" /> Toplu Günlük Doğrulama Raporu ({printBulkDate})
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.print()} 
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" /> Raporu Yazdır (A4)
                  </button>
                  <button 
                    onClick={() => setPrintBulkDate(null)} 
                    className="bg-slate-850 hover:bg-slate-800 text-white px-4 py-1.5 rounded text-xs font-bold"
                  >
                    Kapat
                  </button>
                </div>
              </div>

              {/* Printable A4 Sheet */}
              <div className="p-6 bg-slate-100 overflow-y-auto flex justify-center print:bg-white print:p-0">
                <div className="print-area print-portrait w-full max-w-[210mm] bg-white text-black p-8 shadow-lg border border-slate-300 rounded font-sans leading-normal mx-auto print:border-0 print:shadow-none print:p-0" style={{ minHeight: '297mm' }}>
                  
                  {/* QMS Header Block */}
                  <div className="border-2 border-slate-950 flex font-sans mb-6">
                    <div className="border-r-2 border-slate-950 p-3 flex flex-col items-center justify-center w-[120px] shrink-0">
                      <span className="font-extrabold text-sm tracking-wider text-slate-800 uppercase block">SIES</span>
                      <span className="text-[7px] text-slate-400 block tracking-widest leading-none mt-0.5">KABLO TAVALARI</span>
                    </div>
                    <div className="border-r-2 border-slate-950 p-3 flex-1 flex flex-col items-center justify-center text-center">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">ÖLÇÜM VE TEST CİHAZLARI TOPLU GÜNLÜK ARA DOĞRULAMA FORMU</h2>
                      <span className="text-[8px] text-slate-500 italic block mt-0.5">BULK DAILY VERIFICATION AND FUNCTIONAL CHECK REGISTER</span>
                    </div>
                    <div className="w-[150px] shrink-0 text-[8px] divide-y divide-slate-950">
                      <div className="grid grid-cols-2 border-b border-slate-950"><span className="p-1 border-r border-slate-950">Form Tarihi</span><span className="p-1 text-center font-mono font-bold">{printBulkDate}</span></div>
                      <div className="grid grid-cols-2 border-b border-slate-950"><span className="p-1 border-r border-slate-950">Rev. No</span><span className="p-1 text-center font-mono">1</span></div>
                      <div className="grid grid-cols-2 border-b border-slate-950"><span className="p-1 border-r border-slate-950">Y. Tarihi</span><span className="p-1 text-center font-mono">07/02/2026</span></div>
                      <div className="grid grid-cols-2"><span className="p-1 border-r border-slate-950">Dok. No</span><span className="p-1 text-center font-mono">FR-012-T</span></div>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-600 mb-4 bg-slate-50 p-2 border border-slate-200 rounded leading-relaxed">
                    * Bu form, ISO 9001:2015 ve TS EN 61537 standart şartları gereğince fabrika bünyesindeki ölçüm cihazlarının günlük doğrulamalarını toplu kayıt altına almak için düzenlenir. Sapma toleransını aşan cihazlar acilen işaretlenip kullanım dışı bırakılmalıdır.
                  </p>

                  {/* Inspector / Date Info */}
                  <div className="grid grid-cols-2 gap-4 text-xs mb-4 border border-slate-300 p-3 rounded bg-slate-50 font-sans">
                    <div><strong>Kontrolü Yapan (Kalite Sorumlusu):</strong> {logsForDate[0]?.inspector || 'Faruk Oruç'}</div>
                    <div className="text-right"><strong>Kayıt Sayısı:</strong> {logsForDate.length} Adet Ölçüm Cihazı</div>
                  </div>

                  {/* Dynamic Table */}
                  <table className="w-full border-collapse border-2 border-slate-950 text-center text-[10px] font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-950">
                        <th className="border border-slate-950 p-1 w-[80px]">Envanter No</th>
                        <th className="border border-slate-950 p-1 text-left">Ölçüm Cihazı Adı</th>
                        <th className="border border-slate-950 p-1">Seri No</th>
                        <th className="border border-slate-950 p-1">Görsel Kontrol</th>
                        <th className="border border-slate-950 p-1">Sıfır Ayarı</th>
                        <th className="border border-slate-950 p-1 w-[70px]">Mastar Değer</th>
                        <th className="border border-slate-950 p-1 w-[70px]">Ölçülen</th>
                        <th className="border border-slate-950 p-1 w-[60px]">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsForDate.map(l => (
                        <tr key={l.id} className="border-b border-slate-950">
                          <td className="border border-slate-950 p-1.5 font-bold font-mono">{l.deviceId}</td>
                          <td className="border border-slate-950 p-1.5 text-left font-bold">{l.deviceName}</td>
                          <td className="border border-slate-950 p-1.5 font-mono">{l.serialNumber}</td>
                          <td className="border border-slate-950 p-1.5">{l.visualStatus}</td>
                          <td className="border border-slate-950 p-1.5">{l.zeroStatus}</td>
                          <td className="border border-slate-950 p-1.5 font-mono font-bold">{l.refValue}</td>
                          <td className="border border-slate-950 p-1.5 font-mono font-bold text-orange-600">{l.measuredValue}</td>
                          <td className={`border border-slate-950 p-1.5 font-bold ${l.decision === 'Kabul' ? 'text-green-700' : 'text-red-700'}`}>
                            {l.decision === 'Kabul' ? 'KABUL' : 'RED'}
                          </td>
                        </tr>
                      ))}
                      {logsForDate.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-4 text-center italic text-slate-400">Bu tarihe ait kayıt bulunmamaktadır.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Signatures Footer */}
                  <div className="grid grid-cols-2 border-t-2 border-slate-950 pt-8 text-center gap-12 mt-12">
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-800">KONTROLÜ GERÇEKLEŞTİREN (Kalite Sorumlusu)</span>
                      <span className="block text-slate-600 font-sans">{logsForDate[0]?.inspector || 'Faruk Oruç'}</span>
                      <span className="block text-[8px] text-slate-400 font-mono">İmza / Tarih</span>
                      <div className="h-10"></div>
                    </div>
                    <div className="space-y-1">
                      <span className="block font-bold text-slate-800">ONAYLAYAN (Kalite Müdürü)</span>
                      <span className="block text-slate-600 font-sans">İbrahim Sert</span>
                      <span className="block text-[8px] text-slate-400 font-mono">İmza / Tarih</span>
                      <div className="h-10"></div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="bg-slate-100 p-4 border-t flex justify-end gap-2 print:hidden">
                <button onClick={() => setPrintBulkDate(null)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded text-xs">Kapat</button>
              </div>
            </div>
          </div>
        );
      })()}


      {printVerifLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto print:bg-white print:p-0 print:position-static">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col">
            <div className="bg-slate-950 text-slate-800 p-4 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <FileText className="h-4 w-4 text-orange-500" /> Cihaz Ara Doğrulama ve Fonksiyon Kontrol Formu Önizleme (FR-012)
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-orange-600 hover:bg-orange-700 text-slate-800 font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1"
                >
                  <Printer className="h-4 w-4" /> Formu Yazdır
                </button>
                <button onClick={() => setPrintVerifLog(null)} className="text-slate-400 hover:text-slate-800"><X className="h-5 w-5" /></button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[75vh] bg-slate-200 flex justify-center">
              <div id="print-area-fr015" className="print-area print-portrait bg-white p-8 border border-slate-400 shadow-lg w-[210mm] min-h-[297mm] text-slate-900 font-sans relative text-[11px] leading-relaxed flex flex-col justify-between">
                
                <div>
                  {/* SIES Form Header Grid */}
                  <div className="border-2 border-slate-950 grid grid-cols-4 text-center items-center mb-6">
                    <div className="border-r-2 border-slate-950 p-2 flex justify-center">
                      <img src="/sies_logo.png" alt="SIES" className="h-10 object-contain error-fallback" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      <span className="font-extrabold text-lg tracking-wider text-slate-900 block font-mono">SIES</span>
                    </div>
                    <div className="col-span-2 border-r-2 border-slate-950 p-3 flex flex-col justify-center">
                      <span className="font-bold text-[13px] tracking-wide block uppercase">ÖLÇÜM CİHAZI ARA DOĞRULAMA VE FONKSİYON KONTROL FORMU</span>
                    </div>
                    <div className="font-bold text-[9px] text-left shrink-0 font-mono">
                      <div className="grid grid-cols-2 border-b border-slate-950"><span className="p-1 border-r border-slate-950">Sayfa No</span><span className="p-1 text-center font-mono">1/1</span></div>
                      <div className="grid grid-cols-2 border-b border-slate-950"><span className="p-1 border-r border-slate-950">Rev. No</span><span className="p-1 text-center font-mono">1</span></div>
                      <div className="grid grid-cols-2 border-b border-slate-950"><span className="p-1 border-r border-slate-950">Y. Tarihi</span><span className="p-1 text-center font-mono">07/02/2026</span></div>
                      <div className="grid grid-cols-2"><span className="p-1 border-r border-slate-950">Dok. No</span><span className="p-1 text-center font-mono">FR-012</span></div>
                    </div>
                  </div>

                  {/* Form Description */}
                  <p className="text-[10px] text-slate-600 mb-4 bg-slate-50 p-2 border border-slate-200 rounded leading-relaxed">
                    * Bu form, ISO 9001:2015 7.1.5 İzleme ve Ölçme Kaynakları maddesi ve TS EN 61537 standart şartları gereğince fabrika bünyesindeki ölçüm cihazlarının kalibrasyon aralarındaki ara doğrulamalarını kayıt altına almak için düzenlenir. Sapma toleransını aşan cihazlar acilen işaretlenip kullanım dışı bırakılmalıdır.
                  </p>

                  {/* Device Metadata */}
                  <h4 className="font-bold border-b border-slate-900 pb-1 text-[11px] mb-2 uppercase tracking-wide text-slate-800">1. Cihaz Bilgileri</h4>
                  <table className="w-full border-collapse border-2 border-slate-950 text-left mb-6 font-sans">
                    <tbody>
                      <tr>
                        <td className="border border-slate-950 p-2 bg-slate-100 font-bold w-[130px]">Ölçüm Cihazı Adı</td>
                        <td className="border border-slate-950 p-2 text-slate-800 font-bold">{printVerifLog.deviceName}</td>
                        <td className="border border-slate-950 p-2 bg-slate-100 font-bold w-[120px]">Seri Numarası</td>
                        <td className="border border-slate-950 p-2 text-slate-850 font-mono">{printVerifLog.serialNumber}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-950 p-2 bg-slate-100 font-bold">Doğrulama Periyodu</td>
                        <td className="border border-slate-950 p-2 text-slate-800">Haftalık / Periyodik Ara Doğrulama</td>
                        <td className="border border-slate-950 p-2 bg-slate-100 font-bold">Kontrol Tarihi</td>
                        <td className="border border-slate-950 p-2 text-slate-850 font-mono">{printVerifLog.date}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Inspection Findings */}
                  <h4 className="font-bold border-b border-slate-900 pb-1 text-[11px] mb-2 uppercase tracking-wide text-slate-800">2. Ara Doğrulama Bulguları ve Test Ölçümleri</h4>
                  <table className="w-full border-collapse border-2 border-slate-950 text-center mb-6 font-sans">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-950 p-2 text-left">Muayene / Doğrulama Kriteri</th>
                        <th className="border border-slate-950 p-2 w-[180px]">Beklenen Kriter / Mastar Değeri</th>
                        <th className="border border-slate-950 p-2 w-[180px]">Ölçülen / Gözlenen Durum</th>
                        <th className="border border-slate-950 p-2 w-[120px]">Sonuç</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-950 p-2 text-left font-bold">A. Görsel ve Fiziksel Durum Kontrolü</td>
                        <td className="border border-slate-950 p-2">Çatlak, pas, kırık veya aşırı kir yok</td>
                        <td className="border border-slate-950 p-2">{printVerifLog.visualStatus === 'Uygun' ? 'Temiz, hasarsız, okunaklı' : 'Sapmalı / Aşınma Var'}</td>
                        <td className="border border-slate-950 p-2 font-bold text-green-700 font-sans">✓ UYGUN</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-950 p-2 text-left font-bold">B. Sıfır Noktası Ayar Kontrolü (Zero alignment)</td>
                        <td className="border border-slate-950 p-2">Ekran veya gösterge tam sıfırda</td>
                        <td className="border border-slate-950 p-2">{printVerifLog.zeroStatus === 'Uygun' ? '0.00 konumunda tam kilitli' : 'Sapma Var'}</td>
                        <td className="border border-slate-950 p-2 font-bold text-green-700 font-sans">✓ UYGUN</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-950 p-2 text-left font-bold">C. Mastar Blok / Referans Folyo Ölçümü</td>
                        <td className="border border-slate-950 p-2 font-mono font-bold bg-slate-50">{printVerifLog.refValue}</td>
                        <td className="border border-slate-950 p-2 font-mono font-bold text-orange-700">{printVerifLog.measuredValue}</td>
                        <td className="border border-slate-950 p-2 font-bold text-green-700 font-sans">✓ UYGUN</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Decision and Notes */}
                  <h4 className="font-bold border-b border-slate-900 pb-1 text-[11px] mb-2 uppercase tracking-wide text-slate-800">3. Değerlendirme ve Karar</h4>
                  <div className="border-2 border-slate-950 p-4 rounded bg-slate-50 mb-6 space-y-2">
                    <div>
                      <span className="font-bold text-slate-800 block">Kullanılabilirlik Kararı:</span>
                      <span className={`text-xs font-extrabold uppercase font-sans ${printVerifLog.decision === 'Kabul' ? 'text-green-700' : 'text-red-700'}`}>
                        {printVerifLog.decision === 'Kabul' 
                          ? '✓ KABUL (Cihaz Üretimde ve Kalite Kontrolde Güvenle Kullanılabilir)' 
                          : '⚠️ RED / KULLANIM DIŞI (Tolerans Dışı Aşırı Sapma Nedeniyle Kırmızı Etiketlendi, Servise Gönderildi)'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-850 block">Açıklama ve Tespitler:</span>
                      <p className="text-slate-700 italic font-sans">{printVerifLog.notes}</p>
                    </div>
                  </div>
                </div>

                {/* Signatures Footer */}
                <div className="grid grid-cols-2 border-t-2 border-slate-950 pt-8 text-center gap-12 mt-auto">
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-800">DOĞRULAMAYI YAPAN (Kalite Kontrolör)</span>
                    <span className="block text-slate-600 font-sans">{printVerifLog.inspector}</span>
                    <span className="block text-[9px] text-slate-400 font-mono">İmza / Tarih</span>
                    <div className="h-10"></div>
                  </div>
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-800">ONAYLAYAN (Kalite Yöneticisi)</span>
                    <span className="block text-slate-600 font-sans">İbrahim Sert</span>
                    <span className="block text-[9px] text-slate-400 font-mono">İmza / Tarih</span>
                    <div className="h-10"></div>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-slate-100 p-4 border-t flex justify-end gap-2">
              <button onClick={() => setPrintVerifLog(null)} className="bg-slate-700 hover:bg-slate-800 text-slate-800 font-bold px-4 py-2 rounded text-xs">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
