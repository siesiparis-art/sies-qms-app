'use client';

import React, { useState } from 'react';
import { useQms } from '@/context/QmsContext';
import { siesMachines, siesProducts } from '@/data/siesData';
import { 
  Building2, Users, HardHat, Settings, Anchor, FileCheck2, ArrowRight, ArrowLeft, Plus, Trash2, HelpCircle, FileSpreadsheet, Download 
} from 'lucide-react';

export default function Wizard() {
  const { completeSetup } = useQms();
  const [step, setStep] = useState(1);

  // Step 1: Company Info
  const [companyName, setCompanyName] = useState('Atlas Kablo Sistemleri San. Tic. A.Ş.');
  const [logo, setLogo] = useState('⚡ ATLAS QMS');
  const [address, setAddress] = useState('Organize Sanayi Bölgesi 3. Cadde No: 12, Kocaeli / Türkiye');
  const [taxOffice, setTaxOffice] = useState('Kocaeli Kurumlar');
  const [taxNumber, setTaxNumber] = useState('1234567890');
  const [phone, setPhone] = useState('+90 262 555 12 34');
  const [email, setEmail] = useState('kalite@atlaskablo.com');
  const [qualityPolicy, setQualityPolicy] = useState('Kablo kanalı ve tava sistemleri üretiminde ulusal ve uluslararası standartlara uygun, müşteri odaklı, yüksek kaliteli ürünler sunmak; süreçlerimizi sürekli iyileştirmek ve çevreye duyarlı üretim yapmaktır.');
  const [objectives, setObjectives] = useState([
    'Müşteri memnuniyet oranını %96 seviyesinin üzerinde tutmak.',
    'Üretim hatalarını ve hurda oranını %1.8 seviyesinin altına çekmek.',
    'Çalışanların yıllık eğitim saatini kişi başı minimum 16 saate çıkarmak.',
    'TS EN 61537 ürün testlerini sıfır hata ile tamamlamak.'
  ]);
  const [newObjective, setNewObjective] = useState('');

  // SIES Excel Paste Imports
  const [pastedProducts, setPastedProducts] = useState('');
  const [pastedMachines, setPastedMachines] = useState('');
  const [showProductPaste, setShowProductPaste] = useState(false);
  const [showMachinePaste, setShowMachinePaste] = useState(false);

  // Auto load SIES real company configuration
  const handleLoadSiesData = () => {
    setCompanyName('SIES ELEKTRİK İTH. İHR. SAN. VE TİC. LTD. ŞTİ.');
    setLogo('SIES');
    setAddress('Dilovası Mermerciler Küçük Sanayi Sitesi, 21. Cadde, No: 8, Kocaeli / Türkiye');
    setTaxOffice('Dilovası');
    setTaxNumber('7700388432');
    setPhone('+90 262 728 11 00');
    setEmail('info@sies.com.tr');
    setQualityPolicy('SIES ELEKTRİK olarak kablo taşıma sistemleri üretiminde TS EN 61537 standardına tam uygunluk, sürekli iyileşme ve sıfır hata ile üretim hedeflenmektedir.');
    setObjectives([
      'Müşteri memnuniyet oranını %98 seviyesinin üzerinde tutmak.',
      '37 makineden oluşan üretim hattının OEE oranını %90 üzerine çıkarmak.',
      'Tip testleri ve ara kontrol muayenelerini %100 doğrulukla kayıt altına almak.'
    ]);
    
    // Set SIES Personnel
    setPersList([
      { id: 'PERS-01', name: 'Faruk Oruç', department: 'Kalite Yönetimi', position: 'Kalite Yönetim Temsilcisi (K.Y.T)', certificates: ['ISO 9001:2015 Baş Denetçi', 'ISO 9001:2015 İç Tetkikçi', 'TS EN 61537 Standardizasyon'], competencies: ['Dokümantasyon Kontrolü', 'Ürün Son Kontrol', 'İç Denetim'], trainingRecords: [] },
      { id: 'PERS-02', name: 'İbrahim Sert', department: 'Yönetim / Genel Müdürlük', position: 'Genel Müdür', certificates: ['Yönetim Sistemleri Entegrasyonu', 'ISO 9001:2015 İç Tetkikçi'], competencies: ['Liderlik', 'YGG Yönetimi'], trainingRecords: [] },
      { id: 'PERS-03', name: 'Ahmet Şahin', department: 'Üretim ve Planlama', position: 'Üretim Müdürü', certificates: ['Yalın Üretim'], competencies: ['Pres Operasyonları', 'Lazer Kaynak Planlama'], trainingRecords: [] },
      { id: 'PERS-04', name: 'Bülent Sert', department: 'Bakım ve Teknik İşler', position: 'Bakım Sorumlusu', certificates: ['Yüksek Gerilim Belgesi'], competencies: ['Pres ve Servo Bakımı'], trainingRecords: [] },
      { id: 'PERS-05', name: 'Murat Arslan', department: 'Üretim ve Planlama', position: 'Test Operatörü', certificates: ['Tahribatsız Muayene Seviye 1'], competencies: ['SWL Yük Deneyleri', 'Sapma Ölçümleri'], trainingRecords: [] }
    ]);

    // Load SIES products & machines
    setProds(siesProducts);
    setMachs(siesMachines);

    alert("SIES firmasına ait 37 adet makine, kablo kanalı ürün katalog kodları ve kilit personeller (Faruk Oruç, İbrahim Sert) başarıyla yüklendi!");
  };

  const handleImportProducts = () => {
    if (!pastedProducts.trim()) return;
    const lines = pastedProducts.split('\n');
    const parsed: typeof prods = [];
    
    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const code = parts[0].trim();
        const category = parts[1].trim();
        const desc = parts[2].trim();
        const weight = parts[4] ? `, Ağırlık: ${parts[4].trim()} kg/m` : '';
        
        parsed.push({
          id: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          code,
          name: `${category}`,
          description: `${desc}${weight}`
        });
      }
    });

    if (parsed.length > 0) {
      setProds([...prods, ...parsed]);
      setPastedProducts('');
      setShowProductPaste(false);
      alert(`${parsed.length} adet ürün başarıyla Excel'den aktarıldı!`);
    } else {
      alert("Geçersiz format! Lütfen Excel satırlarını kopyalayıp yapıştırdığınızdan emin olun. (Sütunlar: Kod, Kategori, Açıklama, Birim, Birim Kg)");
    }
  };

  const handleImportMachines = () => {
    if (!pastedMachines.trim()) return;
    const lines = pastedMachines.split('\n');
    const parsed: typeof machs = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const code = parts[0].trim();
        const nameVal = parts[1].trim();
        const supplier = parts[2] ? parts[2].trim() : '';
        const dateStr = parts[3] ? parts[3].trim() : '01.06.2026';
        const brand = parts[4] ? parts[4].trim() : '';
        const type = parts[5] ? parts[5].trim() : '';

        parsed.push({
          id: `MAC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: `${nameVal} (${type || brand})`,
          serialNumber: code,
          manufacturer: supplier || brand,
          model: brand || 'Standart',
          maintenanceIntervalDays: 90,
          lastMaintenanceDate: '2026-06-01',
          nextMaintenanceDate: '2026-08-30',
          status: 'Çalışıyor' as const
        });
      }
    });

    if (parsed.length > 0) {
      setMachs([...machs, ...parsed]);
      setPastedMachines('');
      setShowMachinePaste(false);
      alert(`${parsed.length} adet makine başarıyla Excel'den aktarıldı!`);
    } else {
      alert("Geçersiz format! Lütfen Excel satırlarını kopyalayıp yapıştırdığınızdan emin olun. (Sütunlar: Kod, Ad, Firma, Fatura, Marka, Tip, Ünite, Adet, Değer)");
    }
  };

  // Step 2: Departments
  const [deps, setDeps] = useState([
    { id: 'DEP-01', name: 'Yönetim / Genel Müdürlük', manager: 'Kemal Yılmaz' },
    { id: 'DEP-02', name: 'Kalite Yönetimi', manager: 'Deniz Kaya' },
    { id: 'DEP-03', name: 'Üretim ve Planlama', manager: 'Ahmet Şahin' },
    { id: 'DEP-04', name: 'Satınalma ve Lojistik', manager: 'Merve Demir' },
    { id: 'DEP-05', name: 'Bakım ve Teknik İşler', manager: 'Bülent Sert' },
    { id: 'DEP-06', name: 'İnsan Kaynakları', manager: 'Elif Aslan' }
  ]);
  const [newDepName, setNewDepName] = useState('');
  const [newDepManager, setNewDepManager] = useState('');

  // Step 3: Personnel
  const [persList, setPersList] = useState([
    { id: 'PERS-01', name: 'Deniz Kaya', department: 'Kalite Yönetimi', position: 'Kalite Yönetim Temsilcisi', certificates: ['ISO 9001 İç Tetkikçi', 'Metroloji ve Kalibrasyon'], competencies: ['Dokümantasyon', 'İç Tetkik', 'İstatistiksel Proses Kontrol'], trainingRecords: [] },
    { id: 'PERS-02', name: 'Kemal Yılmaz', department: 'Yönetim / Genel Müdürlük', position: 'Genel Müdür', certificates: ['Stratejik Yönetim'], competencies: ['Liderlik', 'Risk Yönetimi'], trainingRecords: [] },
    { id: 'PERS-03', name: 'Ahmet Şahin', department: 'Üretim ve Planlama', position: 'Üretim Müdürü', certificates: ['Yalın Üretim'], competencies: ['Üretim Planlama', 'Kaynak Metalurjisi'], trainingRecords: [] },
    { id: 'PERS-04', name: 'Bülent Sert', department: 'Bakım ve Teknik İşler', position: 'Bakım Sorumlusu', certificates: ['Elektrik Yüksek Gerilim Yetki Belgesi'], competencies: ['Mekanik Bakım', 'Hidrolik/Pnömatik'], trainingRecords: [] },
    { id: 'PERS-05', name: 'Murat Arslan', department: 'Üretim ve Planlama', position: 'Test Operatörü', certificates: ['Tahribatsız Muayene Seviye 1'], competencies: ['Kablo Kanalı Yük Testleri', 'Boyutsal Ölçüm'], trainingRecords: [] }
  ]);
  const [newPersName, setNewPersName] = useState('');
  const [newPersDept, setNewPersDept] = useState('Kalite Yönetimi');
  const [newPersPos, setNewPersPos] = useState('');
  const [newPersCert, setNewPersCert] = useState('');
  const [newPersComp, setNewPersComp] = useState('');

  // Step 4: Products & Machines
  const [prods, setProds] = useState([
    { id: 'PROD-01', name: 'Ağır Hizmet Tipi Kablo Kanalı (50x100mm)', code: 'KK-AH-50100', description: 'Pre-galvaniz saçtan imal edilmiş ağır hizmet tipi kablo tavası' },
    { id: 'PROD-02', name: 'Ekstra Ağır Hizmet Tipi Kablo Merdiveni (100x400mm)', code: 'KM-EAH-100400', description: 'Sıcak daldırma galvaniz kaplı kablo merdiveni sistemi' }
  ]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  const [machs, setMachs] = useState([
    { id: 'MAC-01', name: 'Roll Forming Profil Çekme Hattı 1', serialNumber: 'RF-2024-009', manufacturer: 'Demsaç Makine', model: 'RF-500', maintenanceIntervalDays: 90, lastMaintenanceDate: '2026-04-10', nextMaintenanceDate: '2026-07-09', status: 'Çalışıyor' as const },
    { id: 'MAC-02', name: 'Eksantrik Pres Hattı 2 (250 Ton)', serialNumber: 'EP-2022-112', manufacturer: 'Dirinler', model: 'EP-250', maintenanceIntervalDays: 120, lastMaintenanceDate: '2026-03-15', nextMaintenanceDate: '2026-07-13', status: 'Çalışıyor' as const }
  ]);
  const [newMachName, setNewMachName] = useState('');
  const [newMachSN, setNewMachSN] = useState('');
  const [newMachMfg, setNewMachMfg] = useState('');
  const [newMachModel, setNewMachModel] = useState('');
  const [newMachInterval, setNewMachInterval] = useState(90);

  // Step 5: Measuring Devices & Suppliers
  const [devices, setDevices] = useState([
    { id: 'DEV-01', name: 'Mekanik Güvenli Çalışma Yükü (SWL) Test Standı', serialNumber: 'MTS-61537-01', certificateNumber: 'CAL-2026-089', calibrationDate: '2026-01-15', nextCalibrationDate: '2027-01-15', status: 'Kalibre' as const },
    { id: 'DEV-02', name: 'Kumpas (0-300mm Dijital)', serialNumber: 'KMP-0300-45', certificateNumber: 'CAL-2026-112', calibrationDate: '2026-02-10', nextCalibrationDate: '2027-02-10', status: 'Kalibre' as const },
    { id: 'DEV-03', name: 'Kaplama Kalınlığı Ölçüm Cihazı (Elcometer)', serialNumber: 'ELC-456-78', certificateNumber: 'CAL-2026-014', calibrationDate: '2026-05-20', nextCalibrationDate: '2027-05-20', status: 'Kalibre' as const }
  ]);
  const [newDevName, setNewDevName] = useState('');
  const [newDevSN, setNewDevSN] = useState('');
  const [newDevCert, setNewDevCert] = useState('');
  const [newDevCalDate, setNewDevCalDate] = useState('2026-06-01');

  const [sups, setSups] = useState([
    { id: 'SUP-01', name: 'Ereğli Demir Çelik Fabrikaları T.A.Ş.', contactPerson: 'Hasan Yılmaz', email: 'satis@erdemir.com.tr', rating: 92, status: 'Onaylı' as const },
    { id: 'SUP-02', name: 'Galvano Çinko Kaplama A.Ş.', contactPerson: 'Selim Akın', email: 'selim@galvano.com', rating: 85, status: 'Onaylı' as const }
  ]);
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupRating, setNewSupRating] = useState(85);

  // Onboarding Wizard Submit
  const handleFinalize = () => {
    const defaultCusts = [
      { id: 'CUST-01', name: 'Siemens Sanayi ve Ticaret A.Ş.', contactPerson: 'Levent Aksu', email: 'levent.aksu@siemens.com' },
      { id: 'CUST-02', name: 'Aselsan Elektronik Sanayi A.Ş.', contactPerson: 'Gökhan Can', email: 'gcan@aselsan.com.tr' }
    ];

    const defaultProcs = [
      { id: 'PROC-01', name: 'Profil Çekme (Roll Forming)', owner: 'Ahmet Şahin', inputs: ['Rulo Saç'], outputs: ['Şekillendirilmiş Profil'], kpis: ['OEE %85 üzeri', 'Hurda oranı %1.5 altı'] },
      { id: 'PROC-02', name: 'Sıcak Daldırma Galvaniz Kaplama', owner: 'Merve Demir', inputs: ['Bükülmüş Profil', 'Çinko Külçe'], outputs: ['Galvanizli Kablo Kanalı'], kpis: ['Kaplama kalınlığı 45-55 mikron', 'Çinko sarfiyatı toleransı'] },
      { id: 'PROC-03', name: 'Ürün Test ve Muayene', owner: 'Deniz Kaya', inputs: ['Galvanizli Kablo Kanalı'], outputs: ['Test Raporu', 'Onaylı Ürün'], kpis: ['Testlerin zamanında yapılması %100', 'Müşteri iadeleri sıfır'] }
    ];

    completeSetup(
      {
        name: companyName,
        logo,
        address,
        taxOffice,
        taxNumber,
        phone,
        email,
        qualityPolicy,
        qualityObjectives: objectives
      },
      deps,
      persList,
      prods,
      defaultProcs,
      machs,
      devices,
      sups,
      defaultCusts
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-4 text-gray-200">
      <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white glow-orange p-6 md:p-8 shadow-2xl">
        
        {/* Wizard Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/20 mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">QMS OS – Kurulum Sihirbazı</h1>
          <p className="mt-2 text-sm text-slate-500">
            Şirketinizin bilgilerini girerek ISO 9001 ve TS EN 61537 uyumlu Kalite Yönetim Sistemini otomatik oluşturun.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex justify-between items-center px-4">
          {[
            { nr: 1, label: 'Şirket', icon: Building2 },
            { nr: 2, label: 'Departmanlar', icon: Users },
            { nr: 3, label: 'Personel', icon: HardHat },
            { nr: 4, label: 'Ürün & Makine', icon: Settings },
            { nr: 5, label: 'Cihaz & Tedarikçi', icon: Anchor },
            { nr: 6, label: 'Başlat', icon: FileCheck2 }
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.nr;
            const isActive = step === s.nr;
            return (
              <div key={s.nr} className="flex flex-col items-center flex-1 relative">
                {s.nr > 1 && (
                  <div className={`absolute right-[50%] left-[-50%] top-4 h-[2px] -z-10 ${isCompleted ? 'bg-[#ff6b00]' : 'bg-[#1e1e1e]'}`} />
                )}
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#ff6b00] text-black border-[#ff6b00] shadow-[0_0_10px_rgba(255,107,0,0.4)]'
                    : isCompleted
                      ? 'bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/30'
                      : 'bg-[#101010] text-slate-400 border-slate-200'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`mt-2 text-[10px] md:text-xs font-medium hidden md:block ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Wizard Form Area */}
        <div className="min-h-[350px] border-t border-slate-200 pt-6">
          
          {/* STEP 1: COMPANY INFO */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">1. Şirket Temel Bilgileri</h3>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-lg p-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ff6b00]/20 rounded-md text-[#ff6b00] hidden sm:block">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">SIES Kablo Kanalı Sistemleri Varsayılan Verileri</span>
                    <span className="text-xs text-slate-500 block">37 adet makine envanteri, ürün kodları ve kalite personeli bilgilerini tek tıkla yükleyin.</span>
                  </div>
                </div>
                <button 
                  onClick={handleLoadSiesData}
                  type="button"
                  className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-semibold text-xs px-4 py-2 rounded-md transition-colors w-full sm:w-auto text-center"
                >
                  SIES Şablonunu Yükle
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Şirket Resmi Unvanı</label>
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Logo / Kısa Adı</label>
                  <input 
                    type="text" 
                    value={logo} 
                    onChange={e => setLogo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Şirket Adresi</label>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vergi Dairesi / No</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Vergi Dairesi"
                      value={taxOffice} 
                      onChange={e => setTaxOffice(e.target.value)}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Vergi No"
                      value={taxNumber} 
                      onChange={e => setTaxNumber(e.target.value)}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Telefon / E-posta</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kalite Politikası</label>
                  <textarea 
                    value={qualityPolicy} 
                    onChange={e => setQualityPolicy(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kalite Hedefleri</label>
                  <div className="space-y-2">
                    {objectives.map((obj, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                        <span className="text-xs text-[#ff6b00] font-bold">#{i+1}</span>
                        <span className="text-xs text-slate-700 flex-1">{obj}</span>
                        <button 
                          onClick={() => setObjectives(objectives.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Yeni hedef ekle..."
                        value={newObjective} 
                        onChange={e => setNewObjective(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500" 
                      />
                      <button 
                        onClick={() => {
                          if (newObjective.trim()) {
                            setObjectives([...objectives, newObjective.trim()]);
                            setNewObjective('');
                          }
                        }}
                        className="bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/30 rounded-md px-3 text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Ekle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DEPARTMENTS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">2. Departmanlar ve Sorumlular</h3>
                <span className="text-xs text-slate-500">En az 3 departman kurulması önerilir</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 border border-slate-100 p-4 rounded-lg bg-[#0e0e0e] max-h-[300px] overflow-y-auto">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mevcut Departmanlar ({deps.length})</span>
                  {deps.map((d) => (
                    <div key={d.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded border border-slate-100">
                      <div>
                        <span className="text-sm font-medium text-slate-800">{d.name}</span>
                        <span className="block text-[10px] text-slate-500">Yönetici: {d.manager || 'Atanmadı'}</span>
                      </div>
                      <button 
                        onClick={() => setDeps(deps.filter(item => item.id !== d.id))}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4 h-fit">
                  <span className="block text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">Yeni Departman Ekle</span>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Departman Adı</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Kalite Kontrol Laboratuvarı"
                      value={newDepName} 
                      onChange={e => setNewDepName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Departman Yöneticisi</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Hasan Yılmaz"
                      value={newDepManager} 
                      onChange={e => setNewDepManager(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (newDepName.trim()) {
                        setDeps([...deps, { id: `DEP-${Date.now()}`, name: newDepName.trim(), manager: newDepManager.trim() }]);
                        setNewDepName('');
                        setNewDepManager('');
                      }
                    }}
                    className="w-full bg-[#ff6b00] hover:bg-[#e05e00] text-black font-semibold rounded py-2 text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Departman Ekle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PERSONNEL */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">3. Kilit Personeller</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Personnel List (2 cols on large screen) */}
                <div className="md:col-span-2 space-y-2 border border-slate-100 p-4 rounded-lg bg-[#0e0e0e] max-h-[300px] overflow-y-auto">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kayıtlı Çalışanlar ({persList.length})</span>
                  {persList.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded border border-slate-100">
                      <div>
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                        <span className="block text-[10px] text-slate-500">{p.department} | {p.position}</span>
                      </div>
                      <button 
                        onClick={() => setPersList(persList.filter(item => item.id !== p.id))}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Personnel panel */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3 h-fit text-xs">
                  <span className="block text-xs font-semibold text-[#ff6b00] uppercase tracking-wider mb-2">Yeni Personel Ekle</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Adı Soyadı</label>
                    <input 
                      type="text" 
                      placeholder="Ahmet Yılmaz"
                      value={newPersName} 
                      onChange={e => setNewPersName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Departmanı</label>
                    <select 
                      value={newPersDept} 
                      onChange={e => setNewPersDept(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500"
                    >
                      {deps.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Görevi / Pozisyonu</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Kalite Mühendisi"
                      value={newPersPos} 
                      onChange={e => setNewPersPos(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Sertifika (Virgülle ayır)</label>
                      <input 
                        type="text" 
                        placeholder="ISO 9001, İSG"
                        value={newPersCert} 
                        onChange={e => setNewPersCert(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">Yetkinlik (Virgülle ayır)</label>
                      <input 
                        type="text" 
                        placeholder="Kaynak, Test"
                        value={newPersComp} 
                        onChange={e => setNewPersComp(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (newPersName.trim() && newPersPos.trim()) {
                        setPersList([...persList, {
                          id: `PERS-${Date.now()}`,
                          name: newPersName.trim(),
                          department: newPersDept,
                          position: newPersPos.trim(),
                          certificates: newPersCert ? newPersCert.split(',').map(s => s.trim()) : [],
                          competencies: newPersComp ? newPersComp.split(',').map(s => s.trim()) : [],
                          trainingRecords: []
                        }]);
                        setNewPersName('');
                        setNewPersPos('');
                        setNewPersCert('');
                        setNewPersComp('');
                      }
                    }}
                    className="w-full bg-[#ff6b00] hover:bg-[#e05e00] text-black font-semibold rounded py-2 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Personel Ekle
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PRODUCTS & MACHINES */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">4. Ürünler ve Üretim Makineleri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Products Area */}
                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">A. Üretilen Ürün Tipleri</span>
                  <div className="space-y-2 border border-slate-100 p-3 rounded bg-[#0e0e0e] max-h-[160px] overflow-y-auto">
                    {prods.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{p.name}</span>
                          <span className="block text-[10px] text-[#ff6b00]">{p.code}</span>
                        </div>
                        <button 
                          onClick={() => setProds(prods.filter(item => item.id !== p.id))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input 
                      type="text" 
                      placeholder="Ürün Kodu (Örn: KK-100)"
                      value={newProdCode} 
                      onChange={e => setNewProdCode(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Ürün Adı (Örn: Kablo Tavası)"
                      value={newProdName} 
                      onChange={e => setNewProdName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Kısa Açıklama"
                      value={newProdDesc} 
                      onChange={e => setNewProdDesc(e.target.value)}
                      className="col-span-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <button 
                      onClick={() => {
                        if (newProdCode.trim() && newProdName.trim()) {
                          setProds([...prods, {
                            id: `PROD-${Date.now()}`,
                            code: newProdCode.trim().toUpperCase(),
                            name: newProdName.trim(),
                            description: newProdDesc.trim()
                          }]);
                          setNewProdCode('');
                          setNewProdName('');
                          setNewProdDesc('');
                        }
                      }}
                      className="col-span-2 bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/30 font-semibold py-1.5 rounded"
                    >
                      + Ürün Ekle
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowProductPaste(!showProductPaste)}
                      className="col-span-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-800 mt-1"
                    >
                      <FileSpreadsheet className="h-3 w-3 text-green-500" />
                      {showProductPaste ? "Toplu Aktarımı Kapat" : "Excel'den Toplu Yapıştır"}
                    </button>

                    {showProductPaste && (
                      <div className="col-span-2 space-y-2 border border-slate-200 p-2 rounded bg-[#0a0a0a] mt-1">
                        <textarea
                          rows={3}
                          placeholder="Excel'den kopyalanan satırları yapıştırın (Kod \t Kategori \t Açıklama...)"
                          value={pastedProducts}
                          onChange={e => setPastedProducts(e.target.value)}
                          className="w-full bg-slate-50 border border-[#333] rounded p-1 text-[10px] text-slate-800 focus:outline-none focus:border-orange-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleImportProducts}
                          className="w-full bg-green-600 hover:bg-green-700 text-slate-800 font-semibold py-1 rounded text-[10px]"
                        >
                          Verileri Ayrıştır ve Aktar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Machines Area */}
                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">B. Üretim Hattı Makineleri</span>
                  <div className="space-y-2 border border-slate-100 p-3 rounded bg-[#0e0e0e] max-h-[160px] overflow-y-auto">
                    {machs.map(m => (
                      <div key={m.id} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          <span className="block text-[10px] text-slate-500">S/N: {m.serialNumber} | Bakım: {m.maintenanceIntervalDays} Gün</span>
                        </div>
                        <button 
                          onClick={() => setMachs(machs.filter(item => item.id !== m.id))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input 
                      type="text" 
                      placeholder="Makine Adı"
                      value={newMachName} 
                      onChange={e => setNewMachName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Seri Numarası"
                      value={newMachSN} 
                      onChange={e => setNewMachSN(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Üretici / Model"
                      value={newMachMfg} 
                      onChange={e => setNewMachMfg(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="number" 
                      placeholder="Bakım Aralığı (Gün)"
                      value={newMachInterval} 
                      onChange={e => setNewMachInterval(Number(e.target.value))}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <button 
                      onClick={() => {
                        if (newMachName.trim() && newMachSN.trim()) {
                          setMachs([...machs, {
                            id: `MAC-${Date.now()}`,
                            name: newMachName.trim(),
                            serialNumber: newMachSN.trim(),
                            manufacturer: newMachMfg.trim(),
                            model: newMachModel.trim() || 'Standart',
                            maintenanceIntervalDays: newMachInterval || 90,
                            lastMaintenanceDate: '2026-06-01',
                            nextMaintenanceDate: new Date(Date.now() + (newMachInterval || 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            status: 'Çalışıyor' as const
                          }]);
                          setNewMachName('');
                          setNewMachSN('');
                          setNewMachMfg('');
                          setNewMachModel('');
                          setNewMachInterval(90);
                        }
                      }}
                      className="col-span-2 bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/30 font-semibold py-1.5 rounded"
                    >
                      + Makine Ekle
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMachinePaste(!showMachinePaste)}
                      className="col-span-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-800 mt-1"
                    >
                      <FileSpreadsheet className="h-3 w-3 text-green-500" />
                      {showMachinePaste ? "Toplu Aktarımı Kapat" : "Excel'den Toplu Yapıştır"}
                    </button>

                    {showMachinePaste && (
                      <div className="col-span-2 space-y-2 border border-slate-200 p-2 rounded bg-[#0a0a0a] mt-1">
                        <textarea
                          rows={3}
                          placeholder="Excel'den kopyalanan satırları yapıştırın (Kod \t Ad \t Firma \t Fatura...)"
                          value={pastedMachines}
                          onChange={e => setPastedMachines(e.target.value)}
                          className="w-full bg-slate-50 border border-[#333] rounded p-1 text-[10px] text-slate-800 focus:outline-none focus:border-orange-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleImportMachines}
                          className="w-full bg-green-600 hover:bg-green-700 text-slate-800 font-semibold py-1 rounded text-[10px]"
                        >
                          Verileri Ayrıştır ve Aktar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 5: MEASURING DEVICES & SUPPLIERS */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">5. Test Cihazları ve Kritik Tedarikçiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Measuring Devices Area */}
                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">A. Kalibrasyona Tabi Ölçüm & Test Cihazları</span>
                  <div className="space-y-2 border border-slate-100 p-3 rounded bg-[#0e0e0e] max-h-[160px] overflow-y-auto">
                    {devices.map(d => (
                      <div key={d.id} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{d.name}</span>
                          <span className="block text-[10px] text-slate-500">Sertifika: {d.certificateNumber} | Kalib. Tarihi: {d.nextCalibrationDate}</span>
                        </div>
                        <button 
                          onClick={() => setDevices(devices.filter(item => item.id !== d.id))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input 
                      type="text" 
                      placeholder="Cihaz Adı"
                      value={newDevName} 
                      onChange={e => setNewDevName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Seri Numarası"
                      value={newDevSN} 
                      onChange={e => setNewDevSN(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Kalibrasyon Sertifika No"
                      value={newDevCert} 
                      onChange={e => setNewDevCert(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="date" 
                      value={newDevCalDate} 
                      onChange={e => setNewDevCalDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <button 
                      onClick={() => {
                        if (newDevName.trim() && newDevSN.trim()) {
                          const calDateObj = new Date(newDevCalDate);
                          const nextCalDate = new Date(calDateObj.getFullYear() + 1, calDateObj.getMonth(), calDateObj.getDate()).toISOString().split('T')[0];
                          
                          setDevices([...devices, {
                            id: `DEV-${Date.now()}`,
                            name: newDevName.trim(),
                            serialNumber: newDevSN.trim(),
                            certificateNumber: newDevCert.trim() || 'CERT-TEMP',
                            calibrationDate: newDevCalDate,
                            nextCalibrationDate: nextCalDate,
                            status: 'Kalibre' as const
                          }]);
                          setNewDevName('');
                          setNewDevSN('');
                          setNewDevCert('');
                        }
                      }}
                      className="col-span-2 bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/30 font-semibold py-1.5 rounded"
                    >
                      + Cihaz Ekle
                    </button>
                  </div>
                </div>

                {/* Suppliers Area */}
                <div className="space-y-3">
                  <span className="block text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">B. Kritik Hammadde / Hizmet Tedarikçileri</span>
                  <div className="space-y-2 border border-slate-100 p-3 rounded bg-[#0e0e0e] max-h-[160px] overflow-y-auto">
                    {sups.map(s => (
                      <div key={s.id} className="flex justify-between items-center bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{s.name}</span>
                          <span className="block text-[10px] text-slate-500">Temas: {s.contactPerson} | Skor: {s.rating}</span>
                        </div>
                        <button 
                          onClick={() => setSups(sups.filter(item => item.id !== s.id))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input 
                      type="text" 
                      placeholder="Tedarikçi Adı"
                      value={newSupName} 
                      onChange={e => setNewSupName(e.target.value)}
                      className="col-span-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="text" 
                      placeholder="Yetkili Kişi"
                      value={newSupContact} 
                      onChange={e => setNewSupContact(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="email" 
                      placeholder="E-posta"
                      value={newSupEmail} 
                      onChange={e => setNewSupEmail(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <input 
                      type="number" 
                      placeholder="Başlangıç Değ. Skoru (0-100)"
                      value={newSupRating} 
                      onChange={e => setNewSupRating(Number(e.target.value))}
                      className="col-span-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                    <button 
                      onClick={() => {
                        if (newSupName.trim()) {
                          setSups([...sups, {
                            id: `SUP-${Date.now()}`,
                            name: newSupName.trim(),
                            contactPerson: newSupContact.trim() || 'Satış Temsilcisi',
                            email: newSupEmail.trim() || 'info@tedarikci.com',
                            rating: newSupRating || 80,
                            status: 'Onaylı' as const
                          }]);
                          setNewSupName('');
                          setNewSupContact('');
                          setNewSupEmail('');
                          setNewSupRating(85);
                        }
                      }}
                      className="col-span-2 bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/30 font-semibold py-1.5 rounded"
                    >
                      + Tedarikçi Ekle
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 6: FINALIZE */}
          {step === 6 && (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/30 pulse-glow-orange mb-2">
                <FileCheck2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Sistem Yapılandırmaya Hazır!</h3>
                <p className="text-sm text-slate-500 max-w-lg mx-auto">
                  Girdiğiniz bilgilere göre **QMS OS**, 13 adet ISO prosedür/talimat belgesini, 10 adet kalite form şablonunu ve 5 adet yıllık kontrol kayıt planını otomatik olarak hazırlayacaktır.
                </p>
              </div>

              {/* Data Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto border border-slate-200 p-4 rounded-lg bg-slate-50 text-xs">
                <div>
                  <span className="block text-slate-400">Departmanlar</span>
                  <span className="text-lg font-bold text-[#ff6b00]">{deps.length}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Personel</span>
                  <span className="text-lg font-bold text-[#ff6b00]">{persList.length}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Makineler</span>
                  <span className="text-lg font-bold text-[#ff6b00]">{machs.length}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Ölçüm Cihazları</span>
                  <span className="text-lg font-bold text-[#ff6b00]">{devices.length}</span>
                </div>
              </div>

              <div className="text-slate-400 text-xs italic">
                * Kayıtlar sistem başlatıldıktan sonra güncellenebilir ve yeni belgeler eklenebilir.
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        <div className="mt-8 flex justify-between border-t border-slate-200 pt-4">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 rounded px-4 py-2 text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Önceki
          </button>

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 rounded bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-5 py-2 text-xs transition-colors"
            >
              Sonraki <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalize}
              className="flex items-center gap-2 rounded bg-green-600 hover:bg-green-700 text-slate-800 font-bold px-6 py-2 text-xs transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)] glow-green"
            >
              <FileCheck2 className="h-4 w-4" /> Sistemi Kur ve Başlat
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
