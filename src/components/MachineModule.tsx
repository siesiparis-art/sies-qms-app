'use client';

import React, { useState } from 'react';
import { useQms, Machine, MaintenanceRecord } from '@/context/QmsContext';
import { 
  Settings, Plus, Wrench, FileText, Calendar, AlertTriangle, Play, Check, ShieldAlert, Award 
} from 'lucide-react';

export default function MachineModule() {
  const { machines, addMachine, maintenanceRecords, addMaintenanceRecord, personnel } = useQms();
  const [activeTab, setActiveTab] = useState<'inventory' | 'instructions'>('inventory');
  
  const [activeMachId, setActiveMachId] = useState<string>(machines[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // Maintenance Logging Form
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDetails, setLogDetails] = useState('');
  const [logCost, setLogCost] = useState(1500);
  const [logParts, setLogParts] = useState('');

  // New Machine Form
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [interval, setInterval] = useState(90);

  const activeMach = machines.find(m => m.id === activeMachId) || machines[0];

  const getMachStatus = (m: Machine) => {
    if (!m) return { label: 'Yok', color: 'text-slate-400' };
    const nextDate = new Date(m.nextMaintenanceDate);
    const today = new Date();
    
    if (m.status === 'Arızalı') return { label: 'Arızalı (Acil)', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    if (m.status === 'Bakımda') return { label: 'Bakımda', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    if (nextDate < today) return { label: 'Bakım Aşımı (Gecikmiş)', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 animate-pulse' };
    
    return { label: 'Normal / Çalışıyor', color: 'text-green-500 bg-green-500/10 border-green-500/20' };
  };

  const handleAddMachine = () => {
    if (!name || !serialNumber) return;
    const intervalDays = interval || 90;
    addMachine({
      id: `MAC-${Date.now()}`,
      name,
      serialNumber,
      manufacturer,
      model: model || 'Standart',
      maintenanceIntervalDays: intervalDays,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDate: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Çalışıyor'
    });
    setName('');
    setSerialNumber('');
    setManufacturer('');
    setModel('');
    setInterval(90);
    setShowAddForm(false);
  };

  const handleLogMaintenance = () => {
    if (!logDetails || !activeMach) return;
    
    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date(Date.now() + activeMach.maintenanceIntervalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    addMaintenanceRecord({
      id: `PM-${Date.now()}`,
      machineId: activeMach.id,
      maintenanceDate: today,
      doneBy: personnel[0]?.name || 'Faruk Oruç',
      details: logDetails,
      partsReplaced: logParts ? logParts.split(',').map(s => s.trim()) : [],
      cost: logCost
    });

    setLogDetails('');
    setLogParts('');
    setLogCost(1500);
    setShowLogForm(false);
    
    alert(`[Kayıt] ${activeMach.name} için Periyodik Bakım Kaydı sisteme işlendi. Bir sonraki bakım tarihi ${nextDate} olarak güncellendi.`);
  };

  // Helper to resolve operating and safety instructions based on machine name
  const getMachineInstruction = (machName: string) => {
    const nameLower = machName.toLowerCase();
    
    if (nameLower.includes('pres') || nameLower.includes('bükme')) {
      return {
        title: 'Pres (Eksantrik & Abkant) Emniyetli Kullanım Talimatı',
        code: 'TL-M-001',
        ppe: ['Çelik Burunlu Ayakkabı', 'Koruyucu Gözlük', 'Kulaklık', 'Deri İş Eldiveni'],
        steps: [
          'Çalışmaya başlamadan önce fotosel (ışık perdesi) ve çift el kumanda butonlarının aktifliğini test edin.',
          'Kalıp ayarlarının yetkili kalıpçı tarafından yapıldığını ve kalıp sıkma vidalarının torkunu doğrulayın.',
          'Operasyon esnasında kalıp arasına kesinlikle el, alet veya yabancı cisim sokmayın.',
          'Pedal mekanizmasını sadece iş parçası yerleşimi bittikten ve eller kumanda dışındayken kullanın.',
          'Kalıp temizliği veya parça sıkışması durumunda makineyi tamamen durdurup enerjisini kesin.'
        ],
        rules: [
          'Işık perdelerini devre dışı bırakmak veya köprülemek kesinlikle yasaktır ve iş akdi fesih sebebidir.',
          'Kalıp değiştirme işlemlerinde pres kilitleme pimini mutlaka takın ve emniyet takozunu yerleştirin.'
        ]
      };
    }
    
    if (nameLower.includes('kaynak') || nameLower.includes('punta')) {
      return {
        title: 'Gazaltı / Lazer / Punta Kaynak İşleri Emniyet Talimatı',
        code: 'TL-M-002',
        ppe: ['Kararan Kaynak Maskesi', 'Deri Kaynakçı Önlüğü', 'Uzun Kaynak Eldiveni', 'Toz Maskesi'],
        steps: [
          'Kaynak ünitesi şase kablosunun iş parçasına tam ve sıkı bağlandığından emin olun.',
          'Gaz hortumlarını, tüp manometresini ve sızıntı kontrolünü yapın (MIG/MAG için).',
          'Lazer kaynak makinelerinde emniyet kabini kilitlerini ve lazer gözlüğünü kontrol edin.',
          'Kaynak yapılacak alanı yanıcı, parlayıcı malzemelerden tamamen temizleyin.',
          'Çalışma bittiğinde gaz vanasını kapatın, şalteri indirin ve kaynak torcunu asın.'
        ],
        rules: [
          'Havalandırma ve duman emiş fanını çalıştırmadan kesinlikle kaynak işlemine başlamayın.',
          'Lazer kaynak odasına yetkisiz kişilerin girmesini önleyin, oda kapısındaki uyarı lambalarını çalıştırın.'
        ]
      };
    }
    
    if (nameLower.includes('matkap') || nameLower.includes('testere') || nameLower.includes('delme')) {
      return {
        title: 'Delme & Kesme (Matkap, Sulu Testere) Kullanım Talimatı',
        code: 'TL-M-003',
        ppe: ['Koruyucu Gözlük', 'Kulaklık', 'Çelik Burunlu Ayakkabı'],
        steps: [
          'Kesilecek veya delinecek iş parçasını makine mengenesine sıkıca sabitleyin. Elle tutarak işlem yapmayın.',
          'Matkap ucunu veya testere bıçağını mandrenle / sabitleme somunuyla iyice sıkıştırın.',
          'Soğutma sıvısı / kesme yağı pompasının çalıştığından ve akışın kesme noktasına ulaştığından emin olun.',
          'Dönüş hızını (devir) delinecek malzemenin sertliğine ve kalınlığına göre ayarlayın.',
          'Talaşları temizlemek için elinizi kullanmayın, mutlaka talaş fırçası veya kanca kullanın.'
        ],
        rules: [
          'Döner milli ve şaftlı delme/kesme işlemlerinde sıkışma riskini önlemek için eldiven takmak kesinlikle yasaktır!',
          'Çalışma esnasında sarkan kıyafetler giymeyin, kravat, künye takmayın ve saçlarınızı toplayın.'
        ]
      };
    }
    
    if (nameLower.includes('giyotin') || nameLower.includes('makas')) {
      return {
        title: 'Giyotin Makas Sac Kesim Emniyet Talimatı',
        code: 'TL-M-004',
        ppe: ['Çelik Burunlu Ayakkabı', 'Deri İş Eldiveni', 'Koruyucu Gözlük'],
        steps: [
          'Kesilecek sacın kalınlığını makas kesme kapasitesi sınırlarıyla karşılaştırın. Aşırı kalın sac kesmeyin.',
          'Bıçak boşluk ayarını sac kalınlığına uygun olarak ayarlayın.',
          'Sacı ön sehpaya yerleştirip arka dayamaya dayayın. Ellerinizin sac baskı pabuçları altında kalmamasına dikkat edin.',
          'Kesim esnasında sacın kaymasını önlemek için baskı silindirlerinin tam bastığını doğrulayın.'
        ],
        rules: [
          'Bıçak koruma kafesini yukarı kaldırmak veya kesim esnasında kafesin altından el uzatmak yasaktır.',
          'Bıçak değişiminde veya bıçak ayarı yaparken makine ana şalterini kilitleyin (LOTO uygulayın).'
        ]
      };
    }

    if (nameLower.includes('kompresör') || nameLower.includes('hava')) {
      return {
        title: 'Kompresör ve Basınçlı Hava Sistemleri Emniyet Talimatı',
        code: 'TL-M-005',
        ppe: ['Kulaklık / Kulak Tıkacı', 'Koruyucu Gözlük'],
        steps: [
          'Günlük olarak kompresör yağ seviyesini gösterge camından kontrol edin.',
          'Hava tankı alt tahliye vanasını haftalık olarak açarak tankta biriken yoğuşma suyunu boşaltın.',
          'Emniyet ventili ve manometrenin çalışır durumda olduğunu kontrol edin.',
          'Hava kaçaklarını tespit edip derhal bakım birimine bildirin.'
        ],
        rules: [
          'Basınçlı havayı temizlik amacıyla elbisenize veya doğrudan vücudunuza tutmayın (emboli riski!).',
          'Basınçlı kapların (hava tankı) yıllık periyodik test ve muayenelerini akredite kuruluşa yaptırın.'
        ]
      };
    }

    // Default instruction
    return {
      title: 'Genel Makine Operasyon ve İş Güvenliği Talimatı',
      code: 'TL-M-000',
      ppe: ['Çelik Burunlu Ayakkabı', 'Koruyucu Gözlük', 'Kulaklık'],
      steps: [
        'Makineyi çalıştırmadan önce etrafında yabancı cisimler olmadığını, koruyucu muhafazaların takılı olduğunu kontrol edin.',
        'Herhangi bir arıza veya anormal ses duyulduğunda makineyi durdurup bakım ekibine haber verin.',
        'Temizlik, ayar veya bakım öncesinde enerji beslemesini kapatıp kilitleyin (LOTO uygulayın).',
        'Sadece yetkili olduğunuz ve eğitimi aldığınız makineleri kullanın.'
      ],
      rules: [
        'Makinelerin üzerindeki güvenlik etiketlerini sökmeyin, uyarı işaretlerine tam uyun.',
        'Çalışma alanını temiz, tertipli ve düzenli tutun (5S standartlarına uyun).'
      ]
    };
  };

  const instruction = getMachineInstruction(activeMach?.name || '');

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'inventory' 
              ? 'border-[#ff6b00] text-slate-800' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          ⚙️ Makine Envanteri & Bakım Takibi
        </button>
        <button
          onClick={() => setActiveTab('instructions')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'instructions' 
              ? 'border-[#ff6b00] text-slate-800' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          📕 Makine Kullanım & İSG Talimatları
        </button>
      </div>

      {activeTab === 'inventory' ? (
        /* INVENTORY TAB */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">SIES Üretim Parkuru</span>
              <h2 className="text-xl font-bold text-slate-800">Önleyici Bakım ve Makine Yönetimi</h2>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Yeni Makine Ekle
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 max-w-lg">
              <h3 className="text-sm font-bold text-slate-800 text-[#ff6b00] uppercase">Yeni Makine Tanımlama Kartı</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Makine Adı</label>
                  <input 
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Örn: CNC Profil Bükme Hattı"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Seri Numarası (Kodu)</label>
                  <input 
                    type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)}
                    placeholder="Örn: SM 38"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Üretici / Tedarikçi</label>
                  <input 
                    type="text" value={manufacturer} onChange={e => setManufacturer(e.target.value)}
                    placeholder="Örn: Ermaksan"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Bakım Periyodu (Gün)</label>
                  <input 
                    type="number" value={interval} onChange={e => setInterval(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button onClick={() => setShowAddForm(false)} className="px-3 py-2 text-slate-500 hover:text-slate-800">İptal</button>
                <button onClick={handleAddMachine} className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded">Makinayı Ekle</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List */}
            <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 max-h-[500px] overflow-y-auto">
              <span className="block text-xs font-semibold text-slate-400 uppercase mb-3">Makineler ({machines.length})</span>
              {machines.map(m => {
                const status = getMachStatus(m);
                return (
                  <button
                    key={m.id}
                    onClick={() => { setActiveMachId(m.id); setShowLogForm(false); }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                      activeMachId === m.id 
                        ? 'bg-[#ff6b00]/10 text-slate-800 border-[#ff6b00]/30' 
                        : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono text-[#ff6b00] block">{m.serialNumber}</span>
                      <span className="text-xs font-semibold block text-slate-800 truncate max-w-[150px]">{m.name}</span>
                      <span className="text-[9px] text-slate-400 block truncate">{m.manufacturer} | Periyot: {m.maintenanceIntervalDays} Gün</span>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Details */}
            {activeMach ? (
              <div className="md:col-span-2 border border-slate-200 bg-white p-6 rounded-xl space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{activeMach.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Kodu: {activeMach.serialNumber} | Üretici: {activeMach.manufacturer} | Model: {activeMach.model}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded border font-semibold ${getMachStatus(activeMach).color}`}>
                    {getMachStatus(activeMach).label}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded text-center">
                    <span className="text-[9px] text-slate-400 block">Son Bakım Tarihi</span>
                    <span className="font-semibold text-slate-800 block mt-1">{activeMach.lastMaintenanceDate}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded text-center col-span-1">
                    <span className="text-[9px] text-slate-400 block">Gelecek Bakım Vadesi</span>
                    <span className="font-semibold text-[#ff6b00] block mt-1">{activeMach.nextMaintenanceDate}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded text-center">
                    <span className="text-[9px] text-slate-400 block">Bakım Periyodu</span>
                    <span className="font-semibold text-slate-800 block mt-1">{activeMach.maintenanceIntervalDays} Gün</span>
                  </div>
                </div>

                {/* Log Maintenance */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Periyodik Bakım Kayıtları</span>
                    <button 
                      onClick={() => setShowLogForm(!showLogForm)}
                      className="text-xs text-[#ff6b00] hover:text-[#ff6b00]/80 font-semibold flex items-center gap-1"
                    >
                      <Wrench className="h-3 w-3" /> Bakım Kaydı İşle
                    </button>
                  </div>

                  {showLogForm && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-1">Yapılan İşlemler / Detaylı Bakım Özeti</label>
                        <textarea 
                          value={logDetails} onChange={e => setLogDetails(e.target.value)}
                          rows={2} placeholder="Haftalık periyodik yağlama yapıldı, filtreler ve keçeler temizlendi."
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1">Değişen Parçalar (Virgülle ayırın)</label>
                          <input 
                            type="text" value={logParts} onChange={e => setLogParts(e.target.value)}
                            placeholder="Örn: Yağ Filtresi, Keçe"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">Bakım Maliyeti (TL)</label>
                          <input 
                            type="number" value={logCost} onChange={e => setLogCost(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setShowLogForm(false)} className="text-slate-500 hover:text-slate-800">İptal</button>
                        <button onClick={handleLogMaintenance} className="bg-[#ff6b00] text-black font-bold px-3 py-1.5 rounded">Kayıt Ekle</button>
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-xs">
                    <table className="w-full text-left text-slate-700 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px]">
                          <th className="p-2.5">Tarih</th>
                          <th className="p-2.5">Yapılan İşlem</th>
                          <th className="p-2.5">Değişen Parça</th>
                          <th className="p-2.5 text-right">Bakımcı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintenanceRecords.filter(r => r.machineId === activeMach.id).map(r => (
                          <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30">
                            <td className="p-2.5 font-mono">{r.maintenanceDate}</td>
                            <td className="p-2.5">{r.details}</td>
                            <td className="p-2.5 text-slate-500">{r.partsReplaced.join(', ') || 'Yok'}</td>
                            <td className="p-2.5 text-right">{r.doneBy}</td>
                          </tr>
                        ))}
                        {maintenanceRecords.filter(r => r.machineId === activeMach.id).length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400 italic">Kayıtlı bakım faaliyeti bulunamadı.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 text-center py-12 text-slate-400">
                Seçili makine bulunamadı.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* INSTRUCTIONS TAB */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Machine List */}
          <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 max-h-[500px] overflow-y-auto">
            <span className="block text-xs font-semibold text-slate-400 uppercase mb-3">Makineler ({machines.length})</span>
            {machines.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMachId(m.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                  activeMachId === m.id 
                    ? 'bg-[#ff6b00]/10 text-slate-800 border-[#ff6b00]/30' 
                    : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-[#ff6b00] block">{m.serialNumber}</span>
                  <span className="text-xs font-semibold block text-slate-800 truncate max-w-[150px]">{m.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Guidelines Display */}
          {activeMach ? (
            <div className="md:col-span-2 border border-slate-200 bg-white p-6 rounded-xl space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">MAKİNE İSG TALİMATI</span>
                  <h3 className="text-base font-bold text-slate-800 mt-1">{instruction.title}</h3>
                  <span className="text-[9px] text-[#ff6b00] font-mono mt-0.5 block">KOD: {instruction.code}</span>
                </div>
                <button 
                  onClick={() => alert(`[Printer] ${instruction.code} makine kullanma ve İSG talimatı pano çıktısı yazdırıldı.`)}
                  className="bg-slate-50 hover:bg-slate-200 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded text-slate-700 flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5 text-[#ff6b00]" /> Pano Çıktısı Al
                </button>
              </div>

              {/* Required PPE (KKD) */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Gerekli Kişisel Koruyucu Donanımlar (KKD)</span>
                <div className="flex flex-wrap gap-2">
                  {instruction.ppe.map((item, idx) => (
                    <span key={idx} className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] px-2.5 py-1 rounded font-bold uppercase">
                      ⚠️ {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">Emniyetli Çalıştırma ve Operasyon Adımları</span>
                <ol className="space-y-2 text-xs text-slate-700 list-decimal pl-4 leading-relaxed">
                  {instruction.steps.map((step, idx) => (
                    <li key={idx} className="pl-1">{step}</li>
                  ))}
                </ol>
              </div>

              {/* Safety rules */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <span className="block text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Kırmızı Çizgiler ve İSG Yasakları
                </span>
                <ul className="space-y-2 text-xs text-slate-500 list-disc pl-4 leading-relaxed">
                  {instruction.rules.map((rule, idx) => (
                    <li key={idx} className="pl-1 text-slate-700 font-medium">{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Warning note */}
              <div className="p-3 bg-[#ff6b00]/5 border border-[#ff6b00]/10 rounded-lg text-[10px] text-slate-500 leading-normal flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-[#ff6b00] shrink-0" />
                <span>
                  <strong>DİKKAT:</strong> İşbu talimata uymayan personel hakkında 6331 sayılı İSG Kanunu ve şirket disiplin prosedürleri uyarınca yasal işlem uygulanacaktır. Herhangi bir kazada hemen <strong>ACİL STOP</strong> butonuna basın.
                </span>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 text-center py-12 text-slate-400">
              Seçili makine bulunamadı.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
