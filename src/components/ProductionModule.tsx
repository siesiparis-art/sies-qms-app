'use client';

import React, { useState } from 'react';
import { useQms, ProductionRun } from '@/context/QmsContext';
import { 
  FileSpreadsheet, Plus, Check, Printer, FileText, Upload, Clock, User, CheckCircle2, ShieldCheck, X, RefreshCw, Truck 
} from 'lucide-react';

export default function ProductionModule() {
  const { 
    productionRuns, addProductionRun, updateProductionRun, 
    personnel, products, companyInfo,
    orders, updateOrder, addOutgoingInspection,
    incomingInspections
  } = useQms();

  const [activeRunId, setActiveRunId] = useState<string>(productionRuns[0]?.id || '');
  const [showAddRun, setShowAddRun] = useState(false);
  const [uploadedPdf, setUploadedPdf] = useState<string>('');
  const [selectedIncomingLot, setSelectedIncomingLot] = useState(incomingInspections?.[0]?.id || 'GKK-2026-001');

  // Form states
  const [prodOrderNo, setProdOrderNo] = useState('');
  const [productCode, setProductCode] = useState(products[0]?.code || 'SU 10/P');
  const [qty, setQty] = useState(100);
  const [operator, setOperator] = useState(personnel[0]?.name || 'Faruk Oruç');

  // First-Article Checks states
  const [firstWidth, setFirstWidth] = useState(100);
  const [firstHeight, setFirstHeight] = useState(40);
  const [firstThickness, setFirstThickness] = useState(0.80);
  const [firstStatus, setFirstStatus] = useState<'Uygun' | 'Hatalı'>('Uygun');

  // In-Process check log states
  const [measureWidth, setMeasureWidth] = useState(100);
  const [measureThickness, setMeasureThickness] = useState(0.80);
  const [measureVisual, setMeasureVisual] = useState<'Uygun' | 'Hatalı'>('Uygun');

  const activeRun = productionRuns.find(r => r.id === activeRunId) || productionRuns[0];

  const handleAddRun = () => {
    const newId = `PRD-${Date.now().toString().substring(11)}`;
    addProductionRun({
      id: newId,
      productionOrderNo: prodOrderNo || `EMR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      productCode,
      quantity: qty,
      operator,
      pdfFile: uploadedPdf || `Uretim_Formu_${prodOrderNo || 'EMR2026'}.pdf`,
      firstCheckStatus: 'Bekliyor',
      inProcessChecks: [],
      status: 'İlk Kontrol Bekliyor',
      notes: `Kullanılan Hammadde Lot No: ${selectedIncomingLot}`
    });

    setActiveRunId(newId);
    setProdOrderNo('');
    setUploadedPdf('');
    setShowAddRun(false);
  };

  const handleApplyFirstCheck = () => {
    if (!activeRun) return;
    updateProductionRun(activeRun.id, {
      firstCheckStatus: firstStatus,
      firstCheckWidthMm: firstWidth,
      firstCheckHeightMm: firstHeight,
      firstCheckThicknessMm: firstThickness,
      firstCheckInspector: operator,
      firstCheckDate: new Date().toISOString().split('T')[0],
      status: firstStatus === 'Uygun' ? 'Ara Kontrol Devam Ediyor' : 'İlk Kontrol Bekliyor'
    });
  };

  const handleAddInProcessCheck = () => {
    if (!activeRun) return;
    const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const sampleNo = activeRun.inProcessChecks.length + 1;
    const newCheck = {
      timestamp,
      sampleNo,
      measuredWidthMm: measureWidth,
      measuredThicknessMm: measureThickness,
      visualStatus: measureVisual,
      inspector: operator
    };
    
    const updatedChecks = [...activeRun.inProcessChecks, newCheck];
    const isCompleted = updatedChecks.length >= 3; // Standard: 3 measurements complete a run

    updateProductionRun(activeRun.id, {
      inProcessChecks: updatedChecks,
      status: isCompleted ? 'Tamamlandı' : 'Ara Kontrol Devam Ediyor'
    });
  };

  const handleShipProducts = () => {
    if (!activeRun) return;

    const dispatchNo = `SE12026${Math.floor(1000 + Math.random() * 9000)}`;
    const dispatchDate = new Date().toISOString().split('T')[0];

    // Find the linked order
    const linkedOrder = orders.find(o => o.productionRunId === activeRun.id);
    if (linkedOrder) {
      updateOrder(linkedOrder.id, {
        status: 'SEVK EDİLDİ',
        dispatchNoteNo: dispatchNo
      });
    }

    addOutgoingInspection({
      id: `SK-${Date.now().toString().substring(11)}`,
      customerId: linkedOrder ? linkedOrder.customerName : 'ANUŞ ELEKTRİK KEREM ANUŞ',
      dispatchNoteNo: dispatchNo,
      dispatchDate,
      productCode: activeRun.productCode,
      quantityMetres: activeRun.quantity,
      thicknessMm: activeRun.firstCheckThicknessMm || 0.80,
      widthMm: activeRun.firstCheckWidthMm || 100,
      measuredCoatingMicron: 12,
      visualStatus: 'Uygun',
      decision: 'Kabul',
      inspector: 'Faruk Oruç',
      pdfFile: `Irsaliye_${dispatchNo}.pdf`
    });

    updateProductionRun(activeRun.id, {
      finalInspectionDispatchNo: dispatchNo
    });

    alert(`[ERP SEVKİYAT] Sipariş sevk edildi!\n\n1. İrsaliye No: "${dispatchNo}" düzenlendi.\n2. FR 12 Son Kontrol Formu onaylandı ve sevkiyat defterine kaydedildi.`);
  };

    const activeRuns = productionRuns.filter(run => {
      if (run.finalInspectionDispatchNo) return false;
      const linkedOrder = orders.find(o => 
        o.productionRunId === run.id || 
        (o.dispatchNoteNo && o.dispatchNoteNo === run.finalInspectionDispatchNo) ||
        (o.status === 'SEVK EDİLDİ' && o.items.some(oi => oi.productCode.toUpperCase() === run.productCode.toUpperCase()))
      );
      if (linkedOrder && linkedOrder.status === 'SEVK EDİLDİ') return false;
      return true;
    });

    const completedRuns = productionRuns.filter(run => {
      if (run.finalInspectionDispatchNo) return true;
      const linkedOrder = orders.find(o => 
        o.productionRunId === run.id || 
        (o.dispatchNoteNo && o.dispatchNoteNo === run.finalInspectionDispatchNo) ||
        (o.status === 'SEVK EDİLDİ' && o.items.some(oi => oi.productCode.toUpperCase() === run.productCode.toUpperCase()))
      );
      if (linkedOrder && linkedOrder.status === 'SEVK EDİLDİ') return true;
      return false;
    });

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
        <div>
          <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">İmalat & Proses Kontrol (İlk / Ara Muayeneler)</span>
          <h2 className="text-xl font-bold text-slate-800">Üretim Formları ve Proses Kalite Kontrolü</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="h-4 w-4" /> Formu Yazdır
          </button>
          <button 
            onClick={() => setShowAddRun(!showAddRun)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Yeni Üretim Formu PDF Yükle
          </button>
        </div>
      </div>

      {showAddRun && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 max-w-4xl text-xs text-slate-700 shadow-sm print:hidden">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
            <Upload className="h-4 w-4" /> Yeni Üretim İş Emri / Üretim Formu PDF Yükleme
          </h3>
          
          {/* Drag & Drop PDF upload zone */}
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-orange-500 transition-colors bg-slate-50 relative">
            <input 
              type="file" 
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadedPdf(`Uretim_Formu_${file.name}`);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <span className="block font-bold text-slate-700">Üretim İş Emri / Formu PDF Dosyasını Sürükleyin veya Seçin</span>
            <span className="block text-[10px] text-slate-400 mt-1">Bu işlem imalat kalite takip kartını otomatik başlatır</span>
            {uploadedPdf && (
              <div className="mt-2 bg-green-50 text-green-700 font-bold py-1 px-3 rounded inline-flex items-center gap-1.5 text-[10px] border border-green-200">
                <Check className="h-3.5 w-3.5" /> Seçilen Üretim Formu: {uploadedPdf}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">Üretim İş Emri / Form No</label>
              <input 
                type="text" placeholder="Örn: EMR-2026-104"
                value={prodOrderNo} onChange={e => setProdOrderNo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Üretilecek Ürün</label>
              <select 
                value={productCode} 
                onChange={e => setProductCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                {products.map(p => (
                  <option key={p.id} value={p.code}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Kullanılacak Sac Rulo (HM-01)</label>
              <select 
                value={selectedIncomingLot} 
                onChange={e => setSelectedIncomingLot(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none font-bold"
              >
                {incomingInspections.map(inc => (
                  <option key={inc.id} value={inc.id}>{inc.id} - {inc.materialName} (İrsaliye: {inc.deliveryNoteNo})</option>
                ))}
                {incomingInspections.length === 0 && (
                  <option value="GKK-2026-001">GKK-2026-001 (Sac Rulo ST37)</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Planlanan Miktar (Metre)</label>
              <input 
                type="number" value={qty} onChange={e => setQty(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Sorumlu Operatör</label>
              <select 
                value={operator} 
                onChange={e => setOperator(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                {personnel.map(p => (
                  <option key={p.id} value={p.name}>{p.name} - {p.position}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddRun(false)} className="px-3 py-2 text-slate-400 hover:text-slate-600">İptal</button>
            <button onClick={handleAddRun} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded">İş Emrini Başlat ve Formu Yükle</button>
          </div>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Runs list */}
        <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-4 max-h-[600px] overflow-y-auto shadow-sm print:hidden">
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase mb-3 flex justify-between items-center">
              <span>Aktif Üretim Kartları ({activeRuns.length})</span>
              <RefreshCw className="h-3 w-3 text-slate-400 cursor-pointer hover:rotate-180 transition-transform" />
            </span>
            <div className="space-y-1.5">
              {activeRuns.map(run => (
                <button
                  key={run.id}
                  onClick={() => {
                    setActiveRunId(run.id);
                    if (run.productCode === 'SU 10/P') {
                      setFirstWidth(100);
                      setFirstHeight(40);
                      setFirstThickness(0.80);
                      setMeasureWidth(100.1);
                      setMeasureThickness(0.80);
                    } else if (run.productCode === 'SU 20') {
                      setFirstWidth(200);
                      setFirstHeight(40);
                      setFirstThickness(0.90);
                      setMeasureWidth(200.1);
                      setMeasureThickness(0.90);
                    } else {
                      setFirstWidth(150);
                      setFirstHeight(60);
                      setFirstThickness(1.20);
                      setMeasureWidth(150.1);
                      setMeasureThickness(1.20);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 ${
                    activeRunId === run.id 
                      ? 'bg-orange-50 text-orange-600 border-orange-200 font-semibold shadow-sm scale-[0.98]' 
                      : 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-mono text-orange-600 font-bold">{run.productionOrderNo}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      run.status === 'Tamamlandı' 
                        ? 'text-green-600 bg-green-50 border border-green-200' 
                        : run.status === 'Ara Kontrol Devam Ediyor'
                          ? 'text-amber-600 bg-amber-50 border border-amber-200 animate-pulse'
                          : 'text-red-600 bg-red-50 border border-red-200'
                    }`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block text-slate-800">{run.productCode} Üretimi</span>
                    <span className="text-[10px] text-slate-500 block">Operatör: {run.operator}</span>
                  </div>
                </button>
              ))}
              {activeRuns.length === 0 && (
                <span className="text-slate-400 italic text-[10px] block py-2 text-center bg-slate-50 rounded border border-dashed">Aktif üretim bulunmamaktadır.</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Tamamlanan Üretimler ({completedRuns.length})
            </span>
            <div className="space-y-1.5">
              {completedRuns.map(run => (
                <button
                  key={run.id}
                  onClick={() => {
                    setActiveRunId(run.id);
                    if (run.productCode === 'SU 10/P') {
                      setFirstWidth(100);
                      setFirstHeight(40);
                      setFirstThickness(0.80);
                      setMeasureWidth(100.1);
                      setMeasureThickness(0.80);
                    } else if (run.productCode === 'SU 20') {
                      setFirstWidth(200);
                      setFirstHeight(40);
                      setFirstThickness(0.90);
                      setMeasureWidth(200.1);
                      setMeasureThickness(0.90);
                    } else {
                      setFirstWidth(150);
                      setFirstHeight(60);
                      setFirstThickness(1.20);
                      setMeasureWidth(150.1);
                      setMeasureThickness(1.20);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 ${
                    activeRunId === run.id 
                      ? 'bg-orange-50 text-orange-600 border-orange-200 font-semibold shadow-sm scale-[0.98]' 
                      : 'bg-slate-50/50 text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{run.productionOrderNo}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200">
                      ✓ TAMAMLANDI
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block text-slate-700">{run.productCode} Üretimi</span>
                    <span className="text-[10px] text-slate-400 block">Sipariş Ref: {run.finalInspectionDispatchNo || 'Sevk Edildi'}</span>
                  </div>
                </button>
              ))}
              {completedRuns.length === 0 && (
                <span className="text-slate-400 italic text-[10px] block py-1 text-center">Tamamlanan üretim bulunmamaktadır.</span>
              )}
            </div>
          </div>
        </div>

        {/* Control sheet and inspector dashboard */}
        <div className="md:col-span-3 space-y-6">
          {activeRun ? (
            <>
              {/* Process inspector interactive zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                
                {/* 1. İlk Kontrol (First-Article Inspection) panel */}
                <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-orange-600" /> Aşama 1: İlk Kontrol (İlk Baskı)
                    </h4>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      activeRun.firstCheckStatus === 'Uygun' 
                        ? 'text-green-600 bg-green-50' 
                        : activeRun.firstCheckStatus === 'Hatalı'
                          ? 'text-red-600 bg-red-50'
                          : 'text-slate-500 bg-slate-50'
                    }`}>
                      {activeRun.firstCheckStatus}
                    </span>
                  </div>

                  {activeRun.firstCheckStatus === 'Bekliyor' ? (
                    <div className="space-y-3 text-xs text-slate-700">
                      <p className="text-[10px] text-slate-400">
                        Rollforming hattını sıfırladıktan sonra çıkan ilk ürünün ölçülerini girip kalite onayını verin:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-0.5">Genişlik (mm)</label>
                          <input type="number" value={firstWidth} onChange={e => setFirstWidth(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-0.5">Yükseklik (mm)</label>
                          <input type="number" value={firstHeight} onChange={e => setFirstHeight(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-0.5">Sac Kalınlığı (mm)</label>
                          <input type="number" step="0.05" value={firstThickness} onChange={e => setFirstThickness(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <select value={firstStatus} onChange={e => setFirstStatus(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1">
                          <option value="Uygun">Kabul (UYGUN)</option>
                          <option value="Hatalı">Red (UYGUNSUZ)</option>
                        </select>
                        <button onClick={handleApplyFirstCheck} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded">
                          Kararı Kaydet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded text-[10px] space-y-1.5 text-slate-600 font-mono">
                      <div>Genişlik: <span className="font-bold text-slate-800">{activeRun.firstCheckWidthMm} mm</span></div>
                      <div>Yükseklik: <span className="font-bold text-slate-800">{activeRun.firstCheckHeightMm} mm</span></div>
                      <div>Kalınlık: <span className="font-bold text-slate-800">{activeRun.firstCheckThicknessMm} mm</span></div>
                      <div>Denetçi: <span className="font-bold text-slate-800">{activeRun.firstCheckInspector}</span> ({activeRun.firstCheckDate})</div>
                    </div>
                  )}
                </div>

                {/* 2. Ara Kontrol (In-Process Inspection) panel */}
                <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-4 w-4 text-orange-600" /> Aşama 2: Ara Kontrol (Periyodik Muayene)
                    </h4>
                    <span className="text-[9px] font-bold text-slate-500">
                      Ölçüm Logu: {activeRun.inProcessChecks.length} / 3
                    </span>
                  </div>

                  {activeRun.firstCheckStatus === 'Uygun' && activeRun.status !== 'Tamamlandı' ? (
                    <div className="space-y-3 text-xs text-slate-700">
                      <p className="text-[10px] text-slate-400">
                        İmalat esnasında periyodik olarak ara numune ölçümlerini girin (En az 3 kayıt gereklidir):
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 mb-0.5">Genişlik (mm)</label>
                          <input type="number" value={measureWidth} onChange={e => setMeasureWidth(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-0.5">Sac Kalınlığı (mm)</label>
                          <input type="number" step="0.05" value={measureThickness} onChange={e => setMeasureThickness(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <select value={measureVisual} onChange={e => setMeasureVisual(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1">
                          <option value="Uygun">Görsel Kusursuz</option>
                          <option value="Hatalı">Hatalı (Çapak/Çizik)</option>
                        </select>
                        <button onClick={handleAddInProcessCheck} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded">
                          Ölçüm Ekle
                        </button>
                      </div>
                    </div>
                  ) : activeRun.status === 'Tamamlandı' ? (
                    <div className="bg-green-50 border border-green-100 p-3 rounded text-[10px] text-green-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Muayeneler Tamamlandı</span>
                          {activeRun.finalInspectionDispatchNo ? (
                            <span>Ürün sevk edildi. (İrsaliye: {activeRun.finalInspectionDispatchNo})</span>
                          ) : (
                            <span>Ürün sevkiyata hazır. Son Kontrol ve İrsaliye kesimi bekleniyor.</span>
                          )}
                        </div>
                      </div>
                      {!activeRun.finalInspectionDispatchNo && (
                        <button
                          onClick={handleShipProducts}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded text-[10px] flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Truck className="h-3.5 w-3.5" /> Sevkiyata Hazırla (İrsaliye Taslağı Oluştur)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-[10px]">
                      Ara kontrolleri başlatmak için önce ilk kontrol onayını vermelisiniz.
                    </div>
                  )}
                </div>

              </div>

              {/* Physical A4 Sheet Document - PROSES MUAYENE KART (DÖKÜMAN VE FORMLAR) */}
              <div className="print-area print-portrait w-full max-w-[210mm] bg-white text-slate-800 p-8 shadow-lg border border-slate-300 rounded font-sans leading-normal mx-auto">
                {/* Header */}
                <div className="border border-slate-900 grid grid-cols-4 text-center items-center text-[9px] font-bold mb-6">
                  <div className="p-2 border-r border-slate-900 flex flex-col justify-center items-center">
                    <img src="/sies_logo.png" alt="SIES Logo" className="h-6 object-contain" />
                    <span className="text-[5px] text-slate-500 uppercase mt-0.5">Üretim Kontrol</span>
                  </div>
                  <div className="p-2 border-r border-slate-900 col-span-2 text-center uppercase text-slate-900 text-[10px] font-black tracking-wide">
                    İMALAT TAKİP VE PROSES MUAYENE KARTI
                  </div>
                  <div className="p-1.5 text-left font-mono text-[7px] space-y-0.5">
                    <div>KAYIT NO: <span className="text-black font-bold">{activeRun.id}</span></div>
                    <div>TARİH: <span className="text-black">{activeRun.date}</span></div>
                    <div>DÖKÜMAN NO: <span className="text-black font-bold">FR-009</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200 text-[10px] text-slate-600 mb-4">
                  <div>
                    <span className="block text-slate-400 uppercase text-[8px] font-bold">İş Emri / Üretim Form No</span>
                    <span className="text-slate-900 font-extrabold flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-orange-600" /> {activeRun.productionOrderNo} 
                      <span className="text-[8px] text-slate-400 font-normal">({activeRun.pdfFile})</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 uppercase text-[8px] font-bold">Üretilecek Ürün Kodu</span>
                    <span className="text-slate-900 font-extrabold">{activeRun.productCode}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 uppercase text-[8px] font-bold">Planlanan Miktar</span>
                    <span className="text-slate-900 font-semibold">{activeRun.quantity} Metre</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 uppercase text-[8px] font-bold">Sorumlu İmalat Operatörü</span>
                    <span className="text-slate-900">{activeRun.operator}</span>
                  </div>
                  {activeRun.notes && (
                    <div className="col-span-2 bg-orange-50 border border-orange-200 text-orange-800 p-2.5 rounded font-mono text-[9px] mt-2">
                      <strong>⚠️ ÖZEL ÜRETİM TALİMATI / NOTLAR:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{activeRun.notes}</p>
                    </div>
                  )}
                </div>

                {/* First Article Quality Control section */}
                <div className="space-y-2 mb-6">
                  <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                    1. İLK KONTROL (MAKİNE SIFIRLAMA ONAYI)
                  </span>
                  {activeRun.firstCheckStatus !== 'Bekliyor' ? (
                    <table className="w-full text-left text-[9px] border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                          <th className="p-1">Ölçülen Kriter</th>
                          <th className="p-1 text-center">Tolerans Değeri</th>
                          <th className="p-1 text-center">Ölçülen Değer</th>
                          <th className="p-1 text-right">İlk Baskı Kararı</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="p-1">Profil Genişliği (En)</td>
                          <td className="p-1 text-center">Resim Ölçüsü ± 1.5mm</td>
                          <td className="p-1 text-center font-bold">{activeRun.firstCheckWidthMm} mm</td>
                          <td className="p-1 text-right text-green-600 font-bold" rowSpan={3}>✓ KABUL</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-1">Kanal Yüksekliği (Boy)</td>
                          <td className="p-1 text-center">Resim Ölçüsü ± 1.0mm</td>
                          <td className="p-1 text-center font-bold">{activeRun.firstCheckHeightMm} mm</td>
                        </tr>
                        <tr>
                          <td className="p-1">Sac Kalınlığı</td>
                          <td className="p-1 text-center">Resim Ölçüsü ± 0.08mm</td>
                          <td className="p-1 text-center font-bold">{activeRun.firstCheckThicknessMm} mm</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4 text-slate-400 italic text-[10px]">
                      Hattın üretime başlaması için ilk kontrol onayı bekliyor.
                    </div>
                  )}
                </div>

                {/* In-Process Quality Controls table */}
                <div className="space-y-2 mb-6">
                  <span className="block text-[10px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                    2. ARA KONTROL (PERİYODİK PROSES ÖLÇÜMLERİ)
                  </span>
                  {activeRun.inProcessChecks.length > 0 ? (
                    <table className="w-full text-left text-[9px] border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                          <th className="p-1">Saat / Numune</th>
                          <th className="p-1 text-center">Ölçülen Genişlik (mm)</th>
                          <th className="p-1 text-center">Ölçülen Kalınlık (mm)</th>
                          <th className="p-1 text-center">Yüzey / Görsel</th>
                          <th className="p-1 text-right">Muayene Eden</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeRun.inProcessChecks.map((c, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-1 font-bold">{c.timestamp} (Num. {c.sampleNo})</td>
                            <td className="p-1 text-center">{c.measuredWidthMm} mm</td>
                            <td className="p-1 text-center">{c.measuredThicknessMm} mm</td>
                            <td className="p-1 text-center text-green-600 font-bold">{c.visualStatus}</td>
                            <td className="p-1 text-right">{c.inspector}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-4 text-slate-400 italic text-[10px]">
                      Kayıtlı proses ara muayene ölçümü bulunmamaktadır.
                    </div>
                  )}
                </div>

                {/* Outgoing traceability linking status */}
                <div className="border-t border-slate-200 pt-4 text-[10px] text-slate-600 space-y-2">
                  <span className="block text-[9px] font-bold text-slate-800 uppercase">3. SEVKİYAT VE SON KONTROL (FR 12) İLİŞKİSİ</span>
                  <div className="flex justify-between items-center">
                    <div>
                      <span>Nihai Son Kontrol Durumu:</span>
                      <span className={`font-bold ml-1 ${activeRun.status === 'Tamamlandı' ? 'text-green-600' : 'text-amber-500'}`}>
                        {activeRun.status === 'Tamamlandı' ? '✓ TAMAMLANDI' : 'DEVAM EDİYOR'}
                      </span>
                    </div>
                    {activeRun.finalInspectionDispatchNo && (
                      <div className="font-mono text-[9px] bg-orange-50 border border-orange-200 text-orange-600 py-0.5 px-2 rounded">
                        Sevk İrsaliye Eşleşmesi: {activeRun.finalInspectionDispatchNo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                <div className="border-t border-slate-300 pt-4 grid grid-cols-2 text-[8px] text-slate-500 font-sans mt-8">
                  <div>
                    <span className="block font-bold text-slate-900">OPERATÖR</span>
                    <span className="block mt-1 font-semibold text-slate-900">{activeRun.operator}</span>
                    <span>İmza / Saat</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-slate-900">KALİTE YÖNETİCİSİ</span>
                    <span className="block mt-1 font-semibold text-slate-900">Faruk Oruç</span>
                    <span>İmza & Onay</span>
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 border border-slate-200 bg-white rounded-xl">
              Gösterilecek aktif imalat kartı bulunamadı.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
