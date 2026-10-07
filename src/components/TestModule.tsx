'use client';

import React, { useState } from 'react';
import { useQms, TestReport, OutgoingInspection } from '@/context/QmsContext';
import { 
  FileText, Plus, ShieldCheck, Printer, Check, Trash2, Eye, Truck, Sparkles, HelpCircle, Upload, X
} from 'lucide-react';

export default function TestModule() {
  const { 
    testReports, addTestReport, 
    outgoingInspections, addOutgoingInspection,
    measuringDevices, personnel, products, documents, customers, companyInfo 
  } = useQms();
  
  const [activeTab, setActiveTab] = useState<'test_reports' | 'outgoing_inspections'>('test_reports');
  const [activeReportId, setActiveReportId] = useState<string>(testReports[0]?.id || '');
  const [activeOutgoingId, setActiveOutgoingId] = useState<string>(outgoingInspections[0]?.id || '');
  
  const [showAddTest, setShowAddTest] = useState(false);
  const [showAddOutgoing, setShowAddOutgoing] = useState(false);

  // New Test Report Form States
  const [testType, setTestType] = useState<TestReport['testType']>('Mekanik Yük');
  const [prodCode, setProdCode] = useState(products[0]?.code || 'S 25H');
  const [deviceId, setDeviceId] = useState(measuringDevices[0]?.id || '');
  const [operatorId, setOperatorId] = useState(personnel[0]?.id || '');
  const [instructionId, setInstructionId] = useState('TL-001');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [notes, setNotes] = useState('');

  // Test type specific states
  const [loadKg, setLoadKg] = useState(150);
  const [deflectionMm, setDeflectionMm] = useState(12);
  const [supportSpanM, setSupportSpanM] = useState(2.0);
  const [resistanceMilliOhm, setResistanceMilliOhm] = useState(2.1);
  const [connectionLengthMm, setConnectionLengthMm] = useState(500);
  const [dimWidth, setDimWidth] = useState(250);
  const [dimHeight, setDimHeight] = useState(60);
  const [dimThickness, setDimThickness] = useState(1.20);
  const [dimCoating, setDimCoating] = useState(20);
  const [corrosionHours, setCorrosionHours] = useState(240);
  const [corrosionDetected, setCorrosionDetected] = useState<'Evet' | 'Hayır'>('Hayır');
  const [corrosionClass, setCorrosionClass] = useState(6);

  // Outgoing inspection states
  const [outCustomer, setOutCustomer] = useState(customers[0]?.name || 'ANUŞ ELEKTRİK KEREM ANUŞ');
  const [outDispatchNo, setOutDispatchNo] = useState('');
  const [outProdCode, setOutProdCode] = useState(products[0]?.code || 'S 25H');
  const [outQty, setOutQty] = useState(100);
  const [outThickness, setOutThickness] = useState(1.20);
  const [outWidth, setOutWidth] = useState(250);
  const [outCoating, setOutCoating] = useState(20);
  const [outVisual, setOutVisual] = useState<'Uygun' | 'Hatalı'>('Uygun');
  const [outDecision, setOutDecision] = useState<'Kabul' | 'Red'>('Kabul');
  const [outInspector, setOutInspector] = useState(personnel[0]?.name || 'Faruk Oruç');
  const [outNotes, setOutNotes] = useState('');
  
  // Custom SIES FR 12 extra states
  const [outPdfFile, setOutPdfFile] = useState<string>('');
  const [pdfPreviewFile, setPdfPreviewFile] = useState<string | null>(null);

  const activeReport = testReports.find(r => r.id === activeReportId) || testReports[0];
  const activeOutgoing = outgoingInspections.find(o => o.id === activeOutgoingId) || outgoingInspections[0];

  React.useEffect(() => {
    if (testType === 'Mekanik Yük') {
      setAcceptanceCriteria('TS EN 61537 Madde 10.4 uyarınca, uygulanan güvenli çalışma yükü (SWL) altında sehim miktarı L/100 açıklık oranını geçmemelidir. Yapısal kırılma, çatlak veya kalıcı deformasyon oluşmamalıdır.');
      setInstructionId('TL-001');
      setNotes('Mekanik yük testi başarıyla tamamlanmıştır. Sehim L/100 limitlerinin altındadır.');
    } else if (testType === 'Elektriksel Süreklilik') {
      setAcceptanceCriteria('TS EN 61537 Madde 11.1 uyarınca, kablo tavaları ve ekleme elemanları arasındaki elektriksel geçiş direnci 50 mΩ (miliohm) değerini aşmamalıdır.');
      setInstructionId('TL-005');
      setNotes('Elektriksel süreklilik testi yapılmıştır. Geçiş direnci sınır değer olan 50 mΩ limitinin altındadır.');
    } else if (testType === 'Korozyon Direnci') {
      setAcceptanceCriteria('TS EN 61537 Madde 11.2 uyarınca, tuz püskürtme testi sonrasında numune yüzeyinde kırmızı paslanma görülmemelidir. Sınıf 6 (240 saat) korozyon direnci doğrulanacaktır.');
      setInstructionId('PR-007');
      setNotes('Tuz püskürtme testi yapılmıştır. Numune yüzeyinde korozyon tespiti olumsuz olup ürün Sınıf 6 standartlarını karşılamaktadır.');
    } else if (testType === 'Boyutsal Muayene') {
      setAcceptanceCriteria('Kablo kanalı en, boy, sac kalınlığı ve galvaniz kaplama kalınlığının ürün teknik resmine ve TS EN 61537 standardındaki korozyon sınıflarına (çinko kaplama kalınlığı µm) uygunluğu ölçülecektir.');
      setInstructionId('TL-005');
      setNotes('Boyutsal ölçümler ve kaplama kalınlıkları tolerans sınırları içinde doğrulanmıştır.');
    } else {
      setAcceptanceCriteria('TS EN 61537 standart genel gereksinimlerine göre fonksiyonel doğrulama yapılacaktır.');
      setInstructionId('TL-001');
      setNotes('Genel test ve görsel inceleme sonuçları uygundur.');
    }
  }, [testType]);

  const handleAddTest = () => {
    const selectedDevice = measuringDevices.find(d => d.id === deviceId) || measuringDevices[0];
    const selectedOp = personnel.find(p => p.id === operatorId) || personnel[0];
    const newReportId = `TR-${Date.now().toString().substring(11)}`;

    let resultsObj = {};
    let status: 'Geçti' | 'Kaldı' = 'Geçti';

    if (testType === 'Mekanik Yük' || testType === 'Sapma (Deflection)') {
      const limit = (supportSpanM * 1000) / 100;
      resultsObj = {
        appliedLoadKgM: loadKg,
        supportSpanM: supportSpanM,
        measuredDeflectionMm: deflectionMm,
        allowableDeflectionMm: limit
      };
      status = deflectionMm <= limit ? 'Geçti' : 'Kaldı';
    } else if (testType === 'Elektriksel Süreklilik') {
      resultsObj = {
        resistanceMilliOhm: resistanceMilliOhm,
        connectionLengthMm: connectionLengthMm,
        limitMilliOhm: 50
      };
      status = resistanceMilliOhm <= 50 ? 'Geçti' : 'Kaldı';
    } else if (testType === 'Boyutsal Muayene') {
      resultsObj = {
        widthMm: dimWidth,
        heightMm: dimHeight,
        thicknessMm: dimThickness,
        coatingMicron: dimCoating
      };
      status = dimCoating >= 15 && Math.abs(dimThickness - 1.20) < 0.15 ? 'Geçti' : 'Kaldı';
    } else if (testType === 'Korozyon Direnci') {
      resultsObj = {
        saltSprayHours: corrosionHours,
        corrosionDetected: corrosionDetected,
        corrosionClass: corrosionClass
      };
      status = corrosionDetected === 'Hayır' ? 'Geçti' : 'Kaldı';
    }

    addTestReport({
      id: newReportId,
      testType,
      productCode: prodCode,
      testDate: new Date().toISOString().split('T')[0],
      testDevice: selectedDevice?.name || 'Test Düzeneği',
      calibrationCertificate: selectedDevice?.certificateNumber || 'CAL-SERBEST',
      operator: selectedOp?.name || 'Faruk Oruç',
      instructionId,
      acceptanceCriteria,
      resultsJson: JSON.stringify(resultsObj),
      status,
      notes
    });

    setActiveReportId(newReportId);
    setShowAddTest(false);
  };

  const handleAddOutgoing = () => {
    const newId = `SK-${Date.now().toString().substring(11)}`;

    addOutgoingInspection({
      id: newId,
      customerId: outCustomer,
      dispatchNoteNo: outDispatchNo || `SE12026${Math.floor(1000 + Math.random() * 9000)}`,
      dispatchDate: new Date().toISOString().split('T')[0],
      productCode: outProdCode,
      quantityMetres: outQty,
      thicknessMm: outThickness,
      widthMm: outWidth,
      measuredCoatingMicron: outCoating,
      visualStatus: outVisual,
      decision: outDecision,
      inspector: outInspector,
      notes: outNotes || 'Sevkiyat öncesi nihai muayene ve tolerans kontrolleri yapılmıştır.',
      pdfFile: outPdfFile || `Irsaliye_${outDispatchNo || 'SE12026'}.pdf`
    });

    setOutDispatchNo('');
    setOutPdfFile('');
    setShowAddOutgoing(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('test_reports')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'test_reports' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🔬 TS EN 61537 Laboratuvar Testleri
        </button>
        <button
          onClick={() => setActiveTab('outgoing_inspections')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'outgoing_inspections' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🚚 Son Kontrol & Sevkiyat (Giden İrsaliye)
        </button>
      </div>

      {activeTab === 'test_reports' ? (
        /* TAB 1: TEST REPORTS */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">TS EN 61537 Standart Doğrulamaları</span>
              <h2 className="text-xl font-bold text-slate-800">Mekanik, Elektriksel ve Korozyon Test Raporları</h2>
            </div>
            <button 
              onClick={() => setShowAddTest(!showAddTest)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Yeni Test Raporu Düzenle
            </button>
          </div>

          {showAddTest && (
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 max-w-2xl text-xs text-slate-700 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-orange-600 flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> Yeni Ürün Test Rapor Girişi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Test Tipi</label>
                  <select 
                    value={testType} 
                    onChange={e => setTestType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="Mekanik Yük">Mekanik Yük Testi (SWL)</option>
                    <option value="Elektriksel Süreklilik">Elektriksel Süreklilik Testi</option>
                    <option value="Sapma (Deflection)">Sapma (Deflection) Testi</option>
                    <option value="Boyutsal Muayene">Boyutsal Muayene (Et Kalınlığı / Kaplama)</option>
                    <option value="Korozyon Direnci">Korozyon Direnci (Tuz Püskürtme)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Test Edilen Ürün</label>
                  <select 
                    value={prodCode} 
                    onChange={e => setProdCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.code}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Kullanılan Ölçüm Cihazı</label>
                  <select 
                    value={deviceId} 
                    onChange={e => setDeviceId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="">Seçin...</option>
                    {measuringDevices.map(d => (
                      <option key={d.id} value={d.id}>{d.name} (S/N: {d.serialNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Test Sorumlusu Operatör</label>
                  <select 
                    value={operatorId} 
                    onChange={e => setOperatorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    {personnel.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Test Talimatı / Referans</label>
                  <select 
                    value={instructionId} 
                    onChange={e => setInstructionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    {documents.filter(d => d.type === 'TL' || d.type === 'PR').map(d => (
                      <option key={d.id} value={d.id}>{d.id} {d.title}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic input sections */}
                {(testType === 'Mekanik Yük' || testType === 'Sapma (Deflection)') && (
                  <>
                    <div>
                      <label className="block text-slate-500 mb-1">Destek Açıklığı L (Metre)</label>
                      <input 
                        type="number" step="0.1" value={supportSpanM} 
                        onChange={e => setSupportSpanM(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Uygulanan Yük (kg/m)</label>
                      <input 
                        type="number" value={loadKg} 
                        onChange={e => setLoadKg(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Ölçülen Sehim (mm)</label>
                      <input 
                        type="number" value={deflectionMm} 
                        onChange={e => setDeflectionMm(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                  </>
                )}

                {testType === 'Elektriksel Süreklilik' && (
                  <>
                    <div>
                      <label className="block text-slate-500 mb-1">Ölçülen Geçiş Direnci (mΩ - miliohm)</label>
                      <input 
                        type="number" step="0.1" value={resistanceMilliOhm} 
                        onChange={e => setResistanceMilliOhm(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Bağlantı Elemanı Boyu (mm)</label>
                      <input 
                        type="number" value={connectionLengthMm} 
                        onChange={e => setConnectionLengthMm(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Maksimum Limit</label>
                      <span className="block w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-slate-800 font-bold">50 mΩ (Limit)</span>
                    </div>
                  </>
                )}

                {testType === 'Boyutsal Muayene' && (
                  <>
                    <div>
                      <label className="block text-slate-500 mb-1">Genişlik (mm)</label>
                      <input 
                        type="number" value={dimWidth} 
                        onChange={e => setDimWidth(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Kenar Yükseklik H (mm)</label>
                      <input 
                        type="number" value={dimHeight} 
                        onChange={e => setDimHeight(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Levha Sac Kalınlığı (mm)</label>
                      <input 
                        type="number" step="0.05" value={dimThickness} 
                        onChange={e => setDimThickness(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Galvaniz Kaplama Kalınlığı (µm)</label>
                      <input 
                        type="number" value={dimCoating} 
                        onChange={e => setDimCoating(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                  </>
                )}

                {testType === 'Korozyon Direnci' && (
                  <>
                    <div>
                      <label className="block text-slate-500 mb-1">Tuz Testi Süresi (Saat)</label>
                      <input 
                        type="number" value={corrosionHours} 
                        onChange={e => setCorrosionHours(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Yüzeyde Paslanma Var mı?</label>
                      <select 
                        value={corrosionDetected} 
                        onChange={e => setCorrosionDetected(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800"
                      >
                        <option value="Hayır">Hayır (Pas yok - UYGUN)</option>
                        <option value="Evet">Evet (Kırmızı pas tespiti - RED)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">TS EN 61537 Korozyon Sınıfı</label>
                      <input 
                        type="number" min="1" max="8" value={corrosionClass} 
                        onChange={e => setCorrosionClass(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800" 
                      />
                    </div>
                  </>
                )}

                <div className="col-span-3">
                  <label className="block text-slate-500 mb-1">Kabul Kriterleri</label>
                  <textarea 
                    value={acceptanceCriteria} 
                    onChange={e => setAcceptanceCriteria(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-slate-500 mb-1">Açıklama & Notlar</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddTest(false)} className="px-3 py-2 text-slate-400 hover:text-slate-600">İptal</button>
                <button onClick={handleAddTest} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded">Raporu Oluştur</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* List */}
            <div className="md:col-span-1 border border-slate-200 rounded-xl bg-white p-4 space-y-2 max-h-[500px] overflow-y-auto shadow-sm">
              <span className="block text-xs font-semibold text-slate-500 uppercase mb-3">Kayıtlı Test Raporları ({testReports.length})</span>
              {testReports.map((r, idx) => (
                <button
                  key={`${r.id}-${idx}`}
                  onClick={() => setActiveReportId(r.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                    activeReportId === r.id 
                      ? 'bg-orange-50 text-orange-600 border-orange-200 font-semibold shadow-sm' 
                      : 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[9px] font-mono text-orange-600 block">{r.id}</span>
                    <span className="text-xs font-semibold block text-slate-800 truncate">{r.testType}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{r.productCode}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${
                    r.status === 'Geçti' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    {r.status}
                  </span>
                </button>
              ))}
            </div>

            {/* Preview details (Rendered as physical A4 Page!) */}
            <div className="md:col-span-3 border border-slate-200 rounded-xl bg-slate-200 p-6 space-y-6 shadow-sm overflow-x-auto flex flex-col justify-between">
              {activeReport ? (
                <>
                  <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-800 p-8 md:p-12 shadow-lg border border-slate-300 rounded font-sans leading-normal flex flex-col justify-between mx-auto" style={{ boxSizing: 'border-box' }}>
                    
                    <div>
                      {/* Grid official header table */}
                      <div className="border-2 border-slate-900 grid grid-cols-4 text-center items-center text-[9px] font-bold mb-6">
                        <div className="p-2 border-r-2 border-slate-900 flex justify-center items-center h-full">
                          <img src="/sies_logo.png" alt="SIES Logo" className="h-6 object-contain" />
                        </div>
                        <div className="p-3 border-r-2 border-slate-900 col-span-2 text-center uppercase text-slate-900 text-[10px] font-black tracking-wide flex flex-col justify-center">
                          <span>TS EN 61537 ÜRÜN UYGUNLUK RAPORU</span>
                          <span className="text-[6px] text-slate-500 font-mono mt-0.5">KYS Deney ve Muayene Laboratuvarı</span>
                        </div>
                        <div className="p-2 text-left font-mono text-[7px] space-y-0.5">
                          <div>RAPOR NO: <span className="text-black font-bold">{activeReport.id}</span></div>
                          <div>TARİH: <span className="text-black">{activeReport.testDate}</span></div>
                          <div>REVİZYON: <span className="text-black font-bold">Rev.0</span></div>
                          <div>DÖK. NO: <span className="text-black font-bold">FR-011</span></div>
                        </div>
                      </div>
                      
                      {/* Header parameters */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-b border-slate-200 text-[10px] text-slate-600 mb-4">
                        <div>
                          <span className="block text-slate-400 uppercase text-[8px] font-bold">Test Edilen Ürün</span>
                          <span className="text-slate-900 font-extrabold">{activeReport.productCode}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 uppercase text-[8px] font-bold">Ölçüm Cihazı</span>
                          <span className="text-slate-900">{activeReport.testDevice}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 uppercase text-[8px] font-bold">Kalibrasyon Belgesi</span>
                          <span className="text-slate-900 font-mono">{activeReport.calibrationCertificate}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 uppercase text-[8px] font-bold">Test Operatörü</span>
                          <span className="text-slate-900">{activeReport.operator}</span>
                        </div>
                      </div>

                      {/* Acceptance criteria */}
                      <div className="space-y-1.5 mb-6">
                        <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-wider">Kabul Kriterleri & Referans Talimat</span>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 leading-normal">
                          <div className="flex gap-4 text-[9px] font-mono text-slate-400 mb-1">
                            <span>Süreç Prosedürü: PR-012</span>
                            <span>|</span>
                            <span>Referans Talimat: {activeReport.instructionId}</span>
                          </div>
                          {activeReport.acceptanceCriteria}
                        </div>
                      </div>
                      
                      {/* Dynamic Test results render */}
                      {activeReport.resultsJson && (() => {
                        try {
                          const data = JSON.parse(activeReport.resultsJson);
                          
                          // 1. Mechanical deflection report
                          if (activeReport.testType === 'Mekanik Yük' || activeReport.testType === 'Sapma (Deflection)') {
                            return (
                              <div className="space-y-2 mb-6">
                                <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-wider">Mekanik Yük & Deflasyon Ölçüm Sonuçları</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-700">
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Uygulanan Yük</span>
                                    <span className="text-slate-900 font-extrabold text-xs block mt-1">{data.appliedLoadKgM} kg/m</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Destek Açıklığı</span>
                                    <span className="text-slate-900 font-extrabold text-xs block mt-1">{data.supportSpanM} m</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Ölçülen Sehim</span>
                                    <span className="text-orange-600 font-extrabold text-xs block mt-1">{data.measuredDeflectionMm} mm</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">İzin Verilen Limit</span>
                                    <span className="text-green-600 font-extrabold text-xs block mt-1">{data.allowableDeflectionMm} mm (L/100)</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          // 2. Electrical continuity report
                          if (activeReport.testType === 'Elektriksel Süreklilik') {
                            return (
                              <div className="space-y-2 mb-6">
                                <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-wider">Elektriksel Geçiş Direnç Ölçümleri</span>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono text-slate-700">
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Geçiş Direnci</span>
                                    <span className="text-orange-600 font-extrabold text-xs block mt-1">{data.resistanceMilliOhm} mΩ</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Bağlantı Boyu</span>
                                    <span className="text-slate-900 font-extrabold text-xs block mt-1">{data.connectionLengthMm} mm</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Sınır Değer</span>
                                    <span className="text-green-600 font-extrabold text-xs block mt-1">&lt; 50 mΩ</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // 3. Dimensional inspect
                          if (activeReport.testType === 'Boyutsal Muayene') {
                            return (
                              <div className="space-y-2 mb-6">
                                <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-wider">Boyutsal & Kaplama Ölçüm Analizi</span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-700">
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Genişlik</span>
                                    <span className="text-slate-900 font-extrabold text-xs block mt-1">{data.widthMm} mm</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Kenar Yüksekliği</span>
                                    <span className="text-slate-900 font-extrabold text-xs block mt-1">{data.heightMm} mm</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Sac Kalınlığı</span>
                                    <span className="text-slate-900 font-extrabold text-xs block mt-1">{data.thicknessMm} mm</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Galvaniz Kaplama</span>
                                    <span className="text-green-600 font-extrabold text-xs block mt-1">{data.coatingMicron} µm</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // 4. Corrosion Spray
                          if (activeReport.testType === 'Korozyon Direnci') {
                            return (
                              <div className="space-y-2 mb-6">
                                <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-wider">Tuz Püskürtme Korozyon Kabin Sonucu</span>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono text-slate-700">
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Test Süresi</span>
                                    <span className="text-slate-900 font-extrabold text-xs block mt-1">{data.saltSprayHours} Saat</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Paslanma Durumu</span>
                                    <span className={`font-extrabold text-xs block mt-1 ${data.corrosionDetected === 'Evet' ? 'text-red-600' : 'text-green-600'}`}>
                                      {data.corrosionDetected}
                                    </span>
                                  </div>
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                                    <span className="text-[9px] text-slate-400 uppercase block">Korozyon Sınıfı</span>
                                    <span className="text-orange-600 font-extrabold text-xs block mt-1">Sınıf {data.corrosionClass}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          return null;
                        } catch {
                          return <pre className="text-[10px] font-mono">{activeReport.resultsJson}</pre>;
                        }
                      })()}

                      {/* Notes and Conclusion */}
                      <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-bold">Değerlendirme Notu</span>
                          <p className="text-slate-700 mt-1 max-w-sm">{activeReport.notes}</p>
                        </div>
                        <div className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-bold ${
                          activeReport.status === 'Geçti' 
                            ? 'text-green-600 bg-green-50 border-green-200' 
                            : 'text-red-600 bg-red-50 border-red-200'
                        }`}>
                          <ShieldCheck className="h-5 w-5" />
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400">Karar</span>
                            <span>STANDARDA UYGUN: {activeReport.status.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Official Sign-off signatures */}
                    <div className="border-t border-slate-300 pt-4 grid grid-cols-2 text-[8px] text-slate-500 font-sans mt-8">
                      <div>
                        <span className="block font-bold text-slate-900">TEST OPERATÖRÜ:</span>
                        <span className="block mt-1 font-semibold text-slate-900">{activeReport.operator}</span>
                        <span className="block">İmza / Tarih</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-slate-900">LABORATUVAR SORUMLUSU / ONAYLAYAN:</span>
                        <span className="block mt-1 font-semibold text-slate-900">{companyInfo.name} Kalite Birimi</span>
                        <span className="block">İmza & Kaşe</span>
                      </div>
                    </div>

                  </div>

                  {/* Document Action controls below A4 sheet */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-300 w-full max-w-[210mm] mx-auto text-xs">
                    <button 
                      onClick={() => alert(`[QuestPDF] PDF test raporu önizlemesi oluşturuldu: ${activeReport.id}`)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4 text-orange-600" /> QuestPDF Önizleme
                    </button>
                    <button 
                      onClick={() => alert(`[Arşiv] Rapor basılarak fiziki arşive gönderildi.`)}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded flex items-center gap-1"
                    >
                      <Printer className="h-4 w-4" /> Yazdır / Arşivle
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Seçili test raporu bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: OUTGOING INSPECTIONS (SON KONTROL) */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Giden İrsaliye Kontrolleri</span>
              <h2 className="text-xl font-bold text-slate-800">Sevkiyat Öncesi Ürün Son Kontrol Raporları</h2>
            </div>
            <button 
              onClick={() => setShowAddOutgoing(!showAddOutgoing)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Yeni Son Kontrol Formu Düzenle
            </button>
          </div>

          {showAddOutgoing && (
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 max-w-2xl text-xs text-slate-700 shadow-sm print:hidden">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-orange-600" /> Yeni Sevkiyat Son Kontrol Kaydı & Çıkış İrsaliyesi Yükle
              </h3>
              
              {/* Drag & Drop outgoing PDF upload */}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-orange-500 transition-colors bg-slate-50 relative">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setOutPdfFile(`Irsaliye_${file.name}`);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <span className="block font-bold text-slate-700">Çıkış Sevk İrsaliyesi PDF Dosyasını Sürükleyin veya Seçin</span>
                <span className="block text-[10px] text-slate-400 mt-1">Sadece .pdf formatı</span>
                {outPdfFile && (
                  <div className="mt-2 bg-green-50 text-green-700 font-bold py-1 px-3 rounded inline-flex items-center gap-1.5 text-[10px] border border-green-200">
                    <Check className="h-3.5 w-3.5" /> Seçilen Belge: {outPdfFile}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Müşteri</label>
                  <select 
                    value={outCustomer} 
                    onChange={e => setOutCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Giden İrsaliye No</label>
                  <input 
                    type="text" placeholder="Örn: SEV-2026-1029"
                    value={outDispatchNo} onChange={e => setOutDispatchNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Ürün Kodu</label>
                  <select 
                    value={outProdCode} 
                    onChange={e => setOutProdCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.code}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Sevkiyat Miktarı (Metre)</label>
                  <input 
                    type="number" value={outQty} 
                    onChange={e => setOutQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Ölçülen Sac Kalınlığı (mm)</label>
                  <input 
                    type="number" step="0.05" value={outThickness} 
                    onChange={e => setOutThickness(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Ölçülen Genişlik (mm)</label>
                  <input 
                    type="number" value={outWidth} 
                    onChange={e => setOutWidth(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Çinko Kaplama Kalınlığı (µm)</label>
                  <input 
                    type="number" value={outCoating} 
                    onChange={e => setOutCoating(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Görsel Kontrol Sonucu</label>
                  <select 
                    value={outVisual} 
                    onChange={e => setOutVisual(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="Uygun">Uygun (Görsel kusur yok)</option>
                    <option value="Hatalı">Hatalı (Çapak/Galvaniz kusurlu)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Karar / Onay</label>
                  <select 
                    value={outDecision} 
                    onChange={e => setOutDecision(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="Kabul">Kabul (Sevkiyata Uygun)</option>
                    <option value="Red">Red (Karantina / Hurda)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Muayene Eden Denetçi</label>
                  <input 
                    type="text" value={outInspector} 
                    onChange={e => setOutInspector(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Sevkiyat / Paketleme Notları</label>
                  <textarea 
                    value={outNotes} 
                    onChange={e => setOutNotes(e.target.value)}
                    rows={2}
                    placeholder="Ambalajlama durumu, çemberleme ve paletleme notları..."
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddOutgoing(false)} className="px-3 py-2 text-slate-400 hover:text-slate-600">İptal</button>
                <button onClick={handleAddOutgoing} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded">Sevkiyat Kaydını Kaydet</button>
              </div>
            </div>
          )}

          {/* FR 12 SON KONTROL FORMU - CONSOLIDATED LEDGER IN LANDSCAPE A4 VIEW */}
          <div className="space-y-6">
            <div className="flex justify-end gap-2 text-xs">
              <button 
                onClick={() => window.print()}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-4 w-4" /> Formu Yazdır / PDF İndir (FR 12)
              </button>
            </div>

            <div className="overflow-x-auto bg-slate-200 p-6 rounded-xl flex justify-center">
              <div 
                className="print-area print-landscape w-full min-w-[297mm] bg-white text-slate-800 p-6 shadow-lg border border-slate-300 rounded font-sans text-[10px] leading-tight flex flex-col justify-between"
                style={{ boxSizing: 'border-box' }}
              >
                <div>
                  {/* FR 12 official grid header */}
                  <table className="w-full border-2 border-slate-900 border-collapse mb-4 text-center font-bold text-[10px]">
                    <tbody>
                      <tr>
                        <td className="p-2 border-r-2 border-slate-900 w-[15%] text-center">
                          <img src="/sies_logo.png" alt="SIES Logo" className="h-8 object-contain mx-auto mb-1" />
                          <span className="text-[7px] text-slate-500 uppercase tracking-widest block">www.sies.com.tr</span>
                          <span className="text-[6px] text-slate-400 block">info@sies.com.tr</span>
                        </td>
                        <td className="p-2 border-r-2 border-slate-900 w-[65%] text-lg font-black tracking-widest uppercase text-slate-950">
                          SON KONTROL FORMU
                        </td>
                        <td className="p-1 text-left font-mono text-[7px] space-y-0.5 w-[20%]">
                          <div className="grid grid-cols-2 border-b border-slate-400 pb-0.5">
                            <div>Sayfa No:</div>
                            <div className="text-right text-black font-bold">1/1</div>
                          </div>
                          <div className="grid grid-cols-2 border-b border-slate-400 pb-0.5">
                            <div>Rev. No:</div>
                            <div className="text-right text-black font-bold">1</div>
                          </div>
                          <div className="grid grid-cols-2 border-b border-slate-400 pb-0.5">
                            <div>Y. Tarihi:</div>
                            <div className="text-right text-black">10/28/2011</div>
                          </div>
                          <div className="grid grid-cols-2">
                            <div>Dok. No:</div>
                            <div className="text-right text-black font-bold">FR 12</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* FR 12 Main Table */}
                  <table className="w-full border-2 border-slate-900 border-collapse text-[9px] text-center font-sans">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-900 text-slate-900 font-bold">
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>İRSALİYE NUMARASI</th>
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>TARİH</th>
                        <th className="p-1 border-r border-slate-900 text-left" rowSpan={2}>MÜŞTERİ ADI</th>
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>ÜRÜN KODU</th>
                        <th className="p-1 border-r border-slate-900 text-left" rowSpan={2}>MAL ADI</th>
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>ÜRÜN MİKTARI</th>
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>BİRİM METRE / ADET</th>
                        <th className="p-1 border-r border-slate-900" colSpan={3}>RESİM ÖLÇÜSÜ</th>
                        <th className="p-1 border-r border-slate-900" colSpan={3}>ÖLÇÜLEN DEĞER</th>
                        <th className="p-1 border-r border-slate-900" colSpan={3}>ÖLÇÜ ALETİ</th>
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>ELEK. SÜR.</th>
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>KAPLAMA CİNSİ</th>
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>KAPLAMA KALINLIĞI</th>
                        <th className="p-1 border-r border-slate-900" rowSpan={2}>NUM. SAYISI</th>
                        <th className="p-1 border-slate-900" rowSpan={2}>61537 Deneyler</th>
                      </tr>
                      <tr className="bg-slate-50 border-b-2 border-slate-900 text-slate-800 text-[8px] font-bold">
                        {/* Resim Ölçüsü */}
                        <th className="p-1 border-r border-slate-900">GEN.</th>
                        <th className="p-1 border-r border-slate-900">YÜK.</th>
                        <th className="p-1 border-r border-slate-900">KAL.</th>
                        {/* Ölçülen Değer */}
                        <th className="p-1 border-r border-slate-900">GEN.</th>
                        <th className="p-1 border-r border-slate-900">YÜK.</th>
                        <th className="p-1 border-r border-slate-900">KAL.</th>
                        {/* Ölçü Aleti */}
                        <th className="p-1 border-r border-slate-900 text-[7px]">ŞERİT METRE</th>
                        <th className="p-1 border-r border-slate-900 text-[7px]">KUMPAS</th>
                        <th className="p-1 border-r border-slate-900 text-[7px]">KALINLIK FOLYOSU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {outgoingInspections.map((o) => {
                        const isBolt = o.productCode.includes('BB');
                        const isSomun = o.productCode.includes('MBF');
                        const isJoiner = o.productCode.includes('S2');
                        const isTray = o.productCode.includes('SU 10') || o.productCode.includes('SU 20');
                        
                        let malAdi = 'KABLO TAVASI';
                        if (isBolt) malAdi = 'BOMBE BAŞLI CIVATA';
                        else if (isSomun) malAdi = 'FLANŞLI SOMUN';
                        else if (o.productCode === 'SU 10/P') malAdi = '304 KALİTE ÜNİVERSAL KABLO KANALI';
                        else if (o.productCode === 'SU 20') malAdi = 'UNIVERSAL TİP K.KANALI';
                        else if (isJoiner) malAdi = 'BİRLEŞTİRME PARÇASI';

                        const birim = isBolt || isSomun || isJoiner || o.productCode === 'SAU 20' || o.productCode === 'SD-2T' || o.productCode === 'MBX2000' || o.productCode === 'SPU-1' || o.productCode === 'T30-K' || o.productCode === 'T40-HB' || o.productCode === 'T40-K' || o.productCode === 'T30-HB' || o.productCode === 'T10-HB' || o.productCode === 'T10-K' || o.productCode === 'SKK-HB' ? 'AD' : 'M';
                        
                        // Resim Ölçüsü
                        let resimGen = '';
                        let resimYuk = '';
                        let resimKal = '';
                        if (o.productCode === 'BB 8X15') {
                          resimGen = 'M8';
                          resimYuk = '15 MM';
                        } else if (o.productCode === 'MBF') {
                          resimGen = 'M8';
                        } else if (o.productCode === 'SU 10/P') {
                          resimGen = '100 MM';
                          resimYuk = '40 MM';
                          resimKal = '0.80 MM';
                        } else if (o.productCode === 'SU 20') {
                          resimGen = '200 MM';
                          resimYuk = '40 MM';
                          resimKal = '0.90 MM';
                        }
                        
                        // Ölçülen değerler
                        const olculenGen = resimGen;
                        const olculenYuk = resimYuk;
                        const olculenKal = resimKal;
                        
                        // Checkboxes
                        const isSeritChecked = isTray;
                        const isKumpasChecked = isTray || isBolt || isSomun;
                        const isFolyosuChecked = isTray;
                        const isElekChecked = isTray;
                        
                        let kaplamaCinsi = '';
                        let kaplamaKalinligi = '';
                        if (o.productCode === 'BB 8X15' || o.productCode === 'MBF') {
                          kaplamaCinsi = 'TS 822 PREG...';
                          kaplamaKalinligi = '5-10 M';
                        } else if (o.productCode === 'SU 10/P') {
                          kaplamaCinsi = '304 PASLANM...';
                          kaplamaKalinligi = 'YOK';
                        } else if (o.productCode === 'SU 20') {
                          kaplamaCinsi = 'TS 822 PREG...';
                          kaplamaKalinligi = '10-15 M';
                        }

                        const numSayisi = isJoiner ? '' : '2';
                        const deneyStatus = isJoiner ? '' : '1. OLUMLU';

                        return (
                          <tr key={o.id} className="hover:bg-slate-50 border-b border-slate-400">
                            <td className="p-1 border-r border-slate-900 font-mono text-[8px]">
                              <div className="flex flex-col items-center">
                                <span>{o.dispatchNoteNo}</span>
                                {(o.pdfFile || o.id === 'SK-001' || o.id === 'SK-002' || o.id === 'SK-003' || o.id === 'SK-004' || o.id === 'SK-005') && (
                                  <button
                                    onClick={() => setPdfPreviewFile(o.pdfFile || `Irsaliye_${o.dispatchNoteNo}.pdf`)}
                                    className="text-orange-600 hover:text-orange-800 text-[7px] font-bold underline flex items-center gap-0.5 mt-0.5 print:hidden"
                                  >
                                    <FileText className="h-2 w-2" /> PDF
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-1 border-r border-slate-900 text-[8px]">{o.dispatchDate}</td>
                            <td className="p-1 border-r border-slate-900 text-left truncate max-w-[100px] font-semibold text-[8px]">{o.customerId}</td>
                            <td className="p-1 border-r border-slate-900 font-bold text-[8px]">{o.productCode}</td>
                            <td className="p-1 border-r border-slate-900 text-left truncate max-w-[150px] text-[8px]">{malAdi}</td>
                            <td className="p-1 border-r border-slate-900 font-bold text-[8px]">{o.quantityMetres}</td>
                            <td className="p-1 border-r border-slate-900 text-[8px]">{birim}</td>
                            
                            {/* Resim Ölçüsü */}
                            <td className="p-1 border-r border-slate-900 text-[8px]">{resimGen}</td>
                            <td className="p-1 border-r border-slate-900 text-[8px]">{resimYuk}</td>
                            <td className="p-1 border-r border-slate-900 text-[8px]">{resimKal}</td>
                            
                            {/* Ölçülen Değer */}
                            <td className="p-1 border-r border-slate-900 text-[8px]">{olculenGen}</td>
                            <td className="p-1 border-r border-slate-900 text-[8px]">{olculenYuk}</td>
                            <td className="p-1 border-r border-slate-900 text-[8px]">{olculenKal}</td>
                            
                            {/* Ölçü Aletleri */}
                            <td className="p-1 border-r border-slate-900 text-center">
                              {isSeritChecked && <span className="text-black font-extrabold text-[9px]">✔</span>}
                            </td>
                            <td className="p-1 border-r border-slate-900 text-center">
                              {isKumpasChecked && <span className="text-black font-extrabold text-[9px]">✔</span>}
                            </td>
                            <td className="p-1 border-r border-slate-900 text-center">
                              {isFolyosuChecked && <span className="text-black font-extrabold text-[9px]">✔</span>}
                            </td>
                            
                            {/* Elek Sür */}
                            <td className="p-1 border-r border-slate-900 text-center">
                              {isElekChecked && <span className="text-black font-extrabold text-[9px]">✔</span>}
                            </td>
                            
                            <td className="p-1 border-r border-slate-900 text-[8px]">{kaplamaCinsi}</td>
                            <td className="p-1 border-r border-slate-900 text-[8px]">{kaplamaKalinligi}</td>
                            <td className="p-1 border-r border-slate-900 text-[8px]">{numSayisi}</td>
                            <td className="p-1 text-center text-[8px]">
                              {deneyStatus && (
                                <span className="px-1.5 py-0.5 bg-green-700 text-white text-[7px] font-bold rounded block text-center uppercase tracking-wide">
                                  {deneyStatus}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom official footer */}
                <div className="border-t border-slate-400 pt-3 grid grid-cols-2 text-[7px] text-slate-500 font-sans mt-4">
                  <div>
                    <span className="block font-bold text-slate-900">MUAYENE VE KONTROLLERİ YAPAN:</span>
                    <span className="block mt-0.5 font-semibold text-slate-900">Faruk Oruç (Kalite Temsilcisi)</span>
                    <span className="block">İmza / Kaşe</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-slate-900">ONAYLAYAN (Sevkiyat Müdürü):</span>
                    <span className="block mt-0.5 font-semibold text-slate-900">İbrahim Sert (Genel Müdür)</span>
                    <span className="block">İmza & Tarih</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Outgoing PDF Preview Modal */}
          {pdfPreviewFile && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <span className="text-xs font-bold font-mono">{pdfPreviewFile} (Çıkış Sevk İrsaliyesi PDF)</span>
                  </div>
                  <button 
                    onClick={() => setPdfPreviewFile(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 bg-slate-50 overflow-y-auto max-h-[70vh]">
                  {/* Mock PDF Invoice */}
                  <div className="bg-white border border-slate-300 p-8 shadow-sm text-xs font-sans text-slate-800 space-y-6">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase">SIES SEVK İRSALİYESİ</h4>
                        <span className="text-[10px] text-slate-500 block">Tarih: 27.05.2024</span>
                        <span className="text-[10px] text-slate-500 block">İrsaliye No: {pdfPreviewFile.replace('Irsaliye_', '').replace('.pdf', '')}</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <img src="/sies_logo.png" alt="SIES Logo" className="h-6 object-contain mb-1" />
                        <span className="text-[9px] text-slate-400">Mescit Mah. Demokrasi Cad. No:12 Tuzla</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      <div>
                        <span className="block text-slate-400 font-bold uppercase">GÖNDEREN FİRMA</span>
                        <span className="font-extrabold text-slate-900 block">SIES ELEKTRİK LTD. ŞTİ.</span>
                        <span>Tuzla, Istanbul</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase">SEVK EDİLEN ALICI MÜŞTERİ</span>
                        <span className="font-extrabold text-slate-900 block">ANUŞ ELEKTRİK / TINAZ ELEKTRONİK</span>
                        <span>Müşteri Sevk Adresi</span>
                      </div>
                    </div>

                    <table className="w-full border-collapse border border-slate-200 text-[9px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold">
                          <th className="p-2 border border-slate-200 text-left">MAMUL AÇIKLAMASI</th>
                          <th className="p-2 border border-slate-200 text-right">MİKTAR</th>
                          <th className="p-2 border border-slate-200 text-right">BİRİM</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200 font-bold">Kablo Tava Taşıyıcı Sistemleri ve Ekleme Elemanları (TS EN 61537)</td>
                          <td className="p-2 border border-slate-200 text-right font-mono">100</td>
                          <td className="p-2 border border-slate-200 text-right">METRE</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[9px] text-slate-400">
                      <span>* Bu belge sevk edilen mamullerin resmi çıkış irsaliyesidir.</span>
                      <div className="border-2 border-green-500 text-green-500 font-bold p-1 rounded -rotate-2 uppercase text-[8px] tracking-wider">
                        SEVKİYAT SON KONTROL ONAYLI (FR 12)
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-100 p-3 flex justify-end gap-2">
                  <button 
                    onClick={() => setPdfPreviewFile(null)}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded text-xs"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
