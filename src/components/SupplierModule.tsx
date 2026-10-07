'use client';

import React, { useState } from 'react';
import { useQms, Supplier, IncomingInspection } from '@/context/QmsContext';
import { 
  Award, Plus, Mail, CheckCircle2, ShieldAlert, Star, TrendingUp, Check, FileSpreadsheet, Eye, Printer, ShieldCheck, Upload, FileText, X
} from 'lucide-react';

export default function SupplierModule() {
  const { 
    suppliers, addSupplier, 
    incomingInspections, addIncomingInspection, 
    personnel, companyInfo 
  } = useQms();
  
  const [activeTab, setActiveTab] = useState<'suppliers' | 'incoming_inspections'>('suppliers');
  
  const [activeSupId, setActiveSupId] = useState<string>(suppliers[0]?.id || '');
  const [activeIncomingId, setActiveIncomingId] = useState<string>(incomingInspections[0]?.id || '');

  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddIncoming, setShowAddIncoming] = useState(false);

  // New Supplier Form
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(85);

  // New Incoming Inspection Form States
  const [inSupplierId, setInSupplierId] = useState(suppliers[0]?.name || 'VAMETAŞ YASSI METAL');
  const [inNoteNo, setInNoteNo] = useState('');
  const [inMaterial, setInMaterial] = useState('0.80X1200X2400');
  const [inThickness, setInThickness] = useState(0.80);
  const [inWidth, setInWidth] = useState(1200);
  const [inCoating, setInCoating] = useState(12);
  const [inVisual, setInVisual] = useState<'Uygun' | 'Hatalı'>('Uygun');
  const [inDecision, setInDecision] = useState<'Kabul' | 'Koşullu Kabul' | 'Red'>('Kabul');
  const [inInspector, setInInspector] = useState(personnel[0]?.name || 'Faruk Oruç');
  const [inNotes, setInNotes] = useState('');
  
  // Custom SIES FR 17 extra fields
  const [inMeasuredValue, setInMeasuredValue] = useState('0,80x1200x2400');
  const [inBoyut, setInBoyut] = useState(true);
  const [inGozle, setInGozle] = useState(true);
  const [inKaplama, setInKaplama] = useState('10-15 MİKRON');
  const [inMiktarKg, setInMiktarKg] = useState(5000);
  const [inMiktarPlaka, setInMiktarPlaka] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const [pdfPreviewFile, setPdfPreviewFile] = useState<string | null>(null);

  const activeSup = suppliers.find(s => s.id === activeSupId) || suppliers[0];
  const activeIncoming = incomingInspections.find(i => i.id === activeIncomingId) || incomingInspections[0];

  const getSubRatings = (s: Supplier) => {
    if (!s) return { quality: 90, delivery: 85, price: 80, support: 90 };
    return {
      quality: Math.min(100, s.rating + 5),
      delivery: Math.min(100, s.rating - 2),
      price: Math.max(50, s.rating - 8),
      support: Math.min(100, s.rating + 3)
    };
  };

  const subRatings = getSubRatings(activeSup);

  const handleAddSupplier = () => {
    if (!name) return;
    
    addSupplier({
      id: `SUP-${Date.now().toString().substring(11)}`,
      name,
      contactPerson: contact || 'Satış Sorumlusu',
      email: email || 'satis@firma.com',
      rating,
      status: 'Onaylı'
    });

    setName('');
    setContact('');
    setEmail('');
    setRating(85);
    setShowAddSupplier(false);
  };

  const handleAddIncoming = () => {
    const newId = `GI-${Date.now().toString().substring(11)}`;

    addIncomingInspection({
      id: newId,
      supplierId: inSupplierId,
      deliveryNoteNo: inNoteNo || `YER2026${Math.floor(100000000 + Math.random() * 900000000)}`,
      deliveryDate: new Date().toISOString().split('T')[0],
      materialName: inMaterial,
      thicknessMm: inThickness,
      widthMm: inWidth,
      coatingThicknessMicron: inCoating,
      visualStatus: inVisual,
      decision: inDecision,
      inspector: inInspector,
      notes: inNotes || 'Giriş kontrolü yapıldı, ebatlar ve kaplama mikron testi standartlara uygun.',
      pdfFile: uploadedFile || `Irsaliye_YER2026${Math.floor(1000 + Math.random() * 9000)}.pdf`,
      measuredValue: inMeasuredValue || `${inThickness}x${inWidth}x2400`,
      boyutKontrolu: inBoyut,
      gozleElle: inGozle,
      kaplamaMikron: inKaplama,
      miktarKg: inMiktarKg,
      miktarPlaka: inMiktarPlaka
    });

    setInNoteNo('');
    setUploadedFile('');
    setShowAddIncoming(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'suppliers' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🤝 Tedarikçi Performans & Karneler
        </button>
        <button
          onClick={() => setActiveTab('incoming_inspections')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'incoming_inspections' 
              ? 'border-orange-600 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📥 Girdi Kontrol Muayeneleri (Gelen İrsaliye)
        </button>
      </div>

      {activeTab === 'suppliers' ? (
        /* TAB 1: SUPPLIERS */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Satınalma & Tedarik Zinciri</span>
              <h2 className="text-xl font-bold text-slate-800">Onaylı Tedarikçi Listesi ve Performans Yönetimi</h2>
            </div>
            <button 
              onClick={() => setShowAddSupplier(!showAddSupplier)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Yeni Tedarikçi Tanımla
            </button>
          </div>

          {showAddSupplier && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 max-w-lg text-xs text-slate-700 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase text-orange-600">Yeni Tedarikçi Kartı Girişi</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Tedarikçi Firma Resmi Adı</label>
                  <input 
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Örn: Ereğli Demir Çelik A.Ş."
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Yetkili İrtibat Kişisi</label>
                  <input 
                    type="text" value={contact} onChange={e => setContact(e.target.value)}
                    placeholder="Örn: Hasan Demir"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">İrtibat E-posta</label>
                  <input 
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="hasan@erdemir.com.tr"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-500 mb-1">Değerlendirme Puanı (0-100)</label>
                  <input 
                    type="number" value={rating} onChange={e => setRating(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddSupplier(false)} className="px-3 py-2 text-slate-400 hover:text-slate-600">İptal</button>
                <button onClick={handleAddSupplier} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded">Tedarikçiyi Kaydet</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 max-h-[500px] overflow-y-auto shadow-sm">
              <span className="block text-xs font-semibold text-slate-500 uppercase mb-3">Onaylı Tedarikçiler ({suppliers.length})</span>
              {suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSupId(s.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                    activeSupId === s.id 
                      ? 'bg-orange-50 text-orange-600 border-orange-200 font-semibold shadow-sm' 
                      : 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div>
                    <span className="text-xs font-semibold block text-slate-800 truncate max-w-[150px]">{s.name}</span>
                    <span className="text-[10px] text-slate-500 block truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 text-orange-600" /> {s.email}
                    </span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${
                    s.rating >= 85 ? 'text-green-600 bg-green-50 border-green-200' : 'text-amber-600 bg-amber-50 border-amber-200'
                  }`}>
                    Skor: {s.rating}
                  </span>
                </button>
              ))}
            </div>

            {activeSup ? (
              <div className="md:col-span-2 border border-slate-200 bg-white p-6 rounded-xl space-y-6 shadow-sm">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-orange-600" />
                      <h3 className="text-base font-bold text-slate-800">{activeSup.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">İrtibat: {activeSup.contactPerson} | {activeSup.email}</p>
                  </div>
                  <span className="bg-green-50 border border-green-200 text-green-600 text-xs px-3 py-1 rounded-full font-bold">
                    {activeSup.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center text-slate-700">
                    <span className="text-[9px] text-slate-400 block font-semibold">Ürün Kalitesi</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">{subRatings.quality}/100</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center text-slate-700">
                    <span className="text-[9px] text-slate-400 block font-semibold">Zamanında Teslim</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">{subRatings.delivery}/100</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center text-slate-700">
                    <span className="text-[9px] text-slate-400 block font-semibold">Fiyat İstikrarı</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">{subRatings.price}/100</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center text-slate-700">
                    <span className="text-[9px] text-slate-400 block font-semibold">Teknik Destek</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1 block">{subRatings.support}/100</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Tedarikçi Karne Analizi</span>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs space-y-3 text-slate-700">
                    <div className="flex justify-between items-center">
                      <span>Ortalama Performans İndeksi (KPI)</span>
                      <span className="font-bold text-orange-600">{activeSup.rating} / 100</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-300">
                      <div className="bg-orange-600 h-full" style={{ width: `${activeSup.rating}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      * ISO 9001:2015 Satınalma prosedürlerine göre tedarikçinin asgari kabul puan barajı 70\'tir. Bu değer altındaki firmalara DÖF açılır.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 text-center py-12 text-slate-400">
                Seçili tedarikçi kartı bulunamadı.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: INCOMING INSPECTIONS (GİRDİ KONTROL LANDSCAPE A4) */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4 print:hidden">
            <div>
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Hammadde ve Malzeme Muayeneleri</span>
              <h2 className="text-xl font-bold text-slate-800">Giriş Kalite Kontrol (Girdi Kontrol) Kütüphanesi</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-4 w-4" /> Yazdır / PDF Kaydet
              </button>
              <button 
                onClick={() => setShowAddIncoming(!showAddIncoming)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Yeni Girdi Kaydı & İrsaliye Yükle
              </button>
            </div>
          </div>

          {showAddIncoming && (
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 max-w-2xl text-xs text-slate-700 shadow-sm print:hidden">
              <h3 className="text-sm font-bold text-slate-800 uppercase text-orange-600 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-orange-600" /> Yeni Gelen İrsaliye Kalite Muayene & PDF Kaydı
              </h3>
              
              {/* Drag and Drop PDF upload zone */}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-orange-500 transition-colors bg-slate-50 relative">
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFile(`Irsaliye_${file.name}`);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <span className="block font-bold text-slate-700">Tedarikçi İrsaliye PDF Dosyasını Sürükleyin veya Seçin</span>
                <span className="block text-[10px] text-slate-400 mt-1">Sadece .pdf dosyaları desteklenir</span>
                {uploadedFile && (
                  <div className="mt-2 bg-green-50 text-green-700 font-bold py-1 px-3 rounded inline-flex items-center gap-1.5 text-[10px] border border-green-200">
                    <Check className="h-3.5 w-3.5" /> Yüklenen Dosya: {uploadedFile}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Tedarikçi Firma</label>
                  <select 
                    value={inSupplierId} 
                    onChange={e => setInSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                    <option value="VAMETAŞ YASSI METAL">VAMETAŞ YASSI METAL</option>
                    <option value="GÜVEN PASLANMAZ">GÜVEN PASLANMAZ</option>
                    <option value="ÇAĞ ÇELİK">ÇAĞ ÇELİK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Tedarikçi İrsaliye Numarası</label>
                  <input 
                    type="text" placeholder="Örn: YER2024000000346"
                    value={inNoteNo} onChange={e => setInNoteNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Malzemenin Cinsi</label>
                  <input 
                    type="text" placeholder="Örn: 0.80X1200X2400"
                    value={inMaterial} onChange={e => setInMaterial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Ölçülen Değer</label>
                  <input 
                    type="text" placeholder="Örn: 0,80x1200x2400"
                    value={inMeasuredValue} onChange={e => setInMeasuredValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Kaplama Kalınlığı (Mikron)</label>
                  <input 
                    type="text" placeholder="Örn: 10-15 MİKRON veya YOK"
                    value={inKaplama} onChange={e => setInKaplama(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Miktarı (KG)</label>
                  <input 
                    type="number" value={inMiktarKg} onChange={e => setInMiktarKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Miktarı (Plaka)</label>
                  <input 
                    type="number" value={inMiktarPlaka} onChange={e => setInMiktarPlaka(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={inBoyut} onChange={e => setInBoyut(e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500" />
                    <span>Boyut Kontrolü</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={inGozle} onChange={e => setInGozle(e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500" />
                    <span>Gözle Elle Muayene</span>
                  </label>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Muayene Kararı</label>
                  <select 
                    value={inDecision} 
                    onChange={e => setInDecision(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="Kabul">Kabul (Üretime Uygun)</option>
                    <option value="Koşullu Kabul">Koşullu Kabul</option>
                    <option value="Red">Red (İade / Karantina)</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-slate-500 mb-1">Kalite Muayene Notu</label>
                  <textarea 
                    value={inNotes} 
                    onChange={e => setInNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddIncoming(false)} className="px-3 py-2 text-slate-400 hover:text-slate-600">İptal</button>
                <button onClick={handleAddIncoming} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded">Muayeneyi Kaydet ve Listeye Ekle</button>
              </div>
            </div>
          )}

          {/* PHYSICAL A4 LANDSCAPE FR 17 SHEET VIEW */}
          <div className="print-area print-landscape w-full max-w-[297mm] bg-white text-slate-800 p-8 shadow-lg border border-slate-200 rounded font-sans mx-auto overflow-x-auto">
            {/* Header table */}
            <div className="border border-slate-900 grid grid-cols-6 text-center items-center text-[10px] font-bold mb-4">
              <div className="p-2 border-r border-slate-900 col-span-1 flex justify-center items-center">
                <img src="/sies_logo.png" alt="SIES Logo" className="h-10 object-contain" />
              </div>
              <div className="p-3 border-r border-slate-900 col-span-4 text-center uppercase text-slate-900 text-base font-black tracking-wide">
                GİRİŞ KALİTE KONTROL FORMU
              </div>
              <div className="col-span-1 text-[8px] text-left border-collapse w-full h-full font-mono">
                <div className="grid grid-rows-4 h-full">
                  <div className="p-1 border-b border-slate-900 flex justify-between"><span>Sayfa No</span><span>00</span></div>
                  <div className="p-1 border-b border-slate-900 flex justify-between"><span>Rev. No</span><span>1</span></div>
                  <div className="p-1 border-b border-slate-900 flex justify-between"><span>Y. Tarihi</span><span>26.10.2011</span></div>
                  <div className="p-1 flex justify-between"><span>Dök. No</span><span>FR 17</span></div>
                </div>
              </div>
            </div>

            {/* Table main body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[9px] border-collapse border border-slate-300 font-mono">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-slate-800 font-bold uppercase">
                    <th className="p-1.5 border border-slate-300">MALZEMENİN CİNSİ</th>
                    <th className="p-1.5 border border-slate-300">TEDARİKÇİ ADI</th>
                    <th className="p-1.5 border border-slate-300">TEDARİKÇİ İRSALİYE</th>
                    <th className="p-1.5 border border-slate-300">İRS. TARİHİ</th>
                    <th className="p-1.5 border border-slate-300">İRSALİYE NUMARASI</th>
                    <th className="p-1.5 border border-slate-300">ÖLÇÜLEN DEĞER</th>
                    <th className="p-1.5 border border-slate-300 text-center">BOYUT KONTROLÜ</th>
                    <th className="p-1.5 border border-slate-300 text-center">GÖZLE VE ELLE MUAYENE</th>
                    <th className="p-1.5 border border-slate-300">KAPLAMA KALINLIĞI (MİKRON)</th>
                    <th className="p-1.5 border border-slate-300 text-right">MİKTARI (KG)</th>
                    <th className="p-1.5 border border-slate-300 text-right">MİKTARI (PLAKA)</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingInspections.map((i, index) => (
                    <tr key={i.id || index} className="hover:bg-slate-50 border-b border-slate-200">
                      <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{i.materialName}</td>
                      <td className="p-1.5 border border-slate-300 font-semibold text-slate-700">{i.supplierId}</td>
                      <td className="p-1.5 border border-slate-300">
                        {i.pdfFile ? (
                          <button 
                            onClick={() => setPdfPreviewFile(i.pdfFile || null)}
                            className="text-orange-600 hover:text-orange-800 font-semibold flex items-center gap-1 underline underline-offset-2"
                          >
                            <FileText className="h-3 w-3 shrink-0" /> {i.pdfFile}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Ek Yok</span>
                        )}
                      </td>
                      <td className="p-1.5 border border-slate-300">{i.deliveryDate}</td>
                      <td className="p-1.5 border border-slate-300 font-bold text-slate-600">{i.deliveryNoteNo}</td>
                      <td className="p-1.5 border border-slate-300">{i.measuredValue || '-'}</td>
                      <td className="p-1.5 border border-slate-300 text-center">
                        {i.boyutKontrolu !== false ? (
                          <Check className="h-3.5 w-3.5 text-green-600 mx-auto font-black" />
                        ) : (
                          <span className="text-red-500 font-bold">X</span>
                        )}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center">
                        {i.gozleElle !== false ? (
                          <Check className="h-3.5 w-3.5 text-green-600 mx-auto font-black" />
                        ) : (
                          <span className="text-red-500 font-bold">X</span>
                        )}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-medium">{i.kaplamaMikron || i.coatingThicknessMicron ? `${i.coatingThicknessMicron} µm` : 'YOK'}</td>
                      <td className="p-1.5 border border-slate-300 text-right font-bold text-slate-800">
                        {i.miktarKg ? `${i.miktarKg} KG` : '-'}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right">
                        {i.miktarPlaka || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* A4 landscape footer block */}
            <div className="border-t border-slate-300 pt-6 mt-8 flex justify-between text-[8px] text-slate-500">
              <div>
                <span className="block font-bold text-slate-700">MUAYENE VE KONTROL EDEN</span>
                <span className="block font-semibold text-slate-900 mt-1">Faruk Oruç - Kalite Kontrol Temsilcisi</span>
                <span>İmza / Tarih</span>
              </div>
              <div className="text-right">
                <span className="block font-bold text-slate-700">KYS ONAYI</span>
                <span className="block font-semibold text-slate-900 mt-1">İbrahim Sert - Genel Müdür</span>
                <span>İmza & Kaşe</span>
              </div>
            </div>
          </div>

          {/* Interactive PDF Preview Modal */}
          {pdfPreviewFile && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <span className="text-xs font-bold font-mono">{pdfPreviewFile} (Gelen İrsaliye PDF Belgesi)</span>
                  </div>
                  <button 
                    onClick={() => setPdfPreviewFile(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 bg-slate-50 overflow-y-auto max-h-[70vh]">
                  {/* Mock PDF invoice */}
                  <div className="bg-white border border-slate-300 p-8 shadow-sm text-xs font-sans text-slate-800 space-y-6">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase">Tedarikçi Sevk İrsaliyesi</h4>
                        <span className="text-[10px] text-slate-500 block">Tarih: 02.01.2024</span>
                        <span className="text-[10px] text-slate-500 block">No: {pdfPreviewFile.replace('Irsaliye_', '').replace('.pdf', '')}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-xs tracking-wider block text-slate-950">SIES ELEKTRİK</span>
                        <span className="text-[9px] text-slate-400">Girdi Kontrol Sevkiyatı</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      <div>
                        <span className="block text-slate-400 font-bold uppercase">GÖNDEREN TEDARİKÇİ</span>
                        <span className="font-extrabold text-slate-900 block">Güven Paslanmaz / Vametaş Yassı Metal</span>
                        <span>Demirciler Sanayi Sitesi, Istanbul</span>
                      </div>
                      <div>
                        <span className="block text-slate-400 font-bold uppercase">ALICI MÜŞTERİ</span>
                        <span className="font-extrabold text-slate-900 block">SIES ELEKTRİK MÜMESSİLLİK</span>
                        <span>Mescit Mah. Demokrasi Cad. No: 12 Tuzla</span>
                      </div>
                    </div>

                    <table className="w-full border-collapse border border-slate-200 text-[9px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold">
                          <th className="p-2 border border-slate-200 text-left">MALZEME KALEMİ</th>
                          <th className="p-2 border border-slate-200 text-right">MİKTAR</th>
                          <th className="p-2 border border-slate-200 text-right">BİRİM</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200 font-bold">DX51D+Z Galvanizli Rulo/Plaka Sac (0.80mm)</td>
                          <td className="p-2 border border-slate-200 text-right font-mono">5.000</td>
                          <td className="p-2 border border-slate-200 text-right">KG</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[9px] text-slate-400">
                      <span>* Bu belge fiziki sevk irsaliyesinin taranmış dijital kopyasıdır.</span>
                      <div className="border-2 border-green-500 text-green-500 font-bold p-1 rounded rotate-3 uppercase text-[8px] tracking-wider">
                        GİRDİ KONTROL KABUL EDİLDİ
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
