'use client';

import React, { useState, useEffect } from 'react';
import { useQms } from '@/context/QmsContext';
import { Bot, AlertTriangle, ShieldCheck, CheckCircle, RefreshCw, Cpu, BookOpen, Send } from 'lucide-react';

export default function AiEngine() {
  const { 
    measuringDevices, machines, audits, capas, documents, addDocument, personnel 
  } = useQms();

  const [isScanning, setIsScanning] = useState(false);
  const [readinessScore, setReadinessScore] = useState(85);
  const [gaps, setGaps] = useState<{ id: string; type: 'Kritik' | 'Uyarı' | 'Bilgi'; title: string; desc: string; action: string }[]>([]);

  // AI Procedure generator fields
  const [procTopic, setProcTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const detectedGaps: typeof gaps = [];
      let score = 100;

      // 1. Calibration check
      const expiredCal = measuringDevices.filter(d => new Date(d.nextCalibrationDate) < new Date());
      if (expiredCal.length > 0) {
        score -= expiredCal.length * 10;
        expiredCal.forEach(d => {
          detectedGaps.push({
            id: `GAP-CAL-${d.id}`,
            type: 'Kritik',
            title: `Kalibrasyon Aşımı: ${d.name}`,
            desc: `Cihazın kalibrasyon süresi ${d.nextCalibrationDate} tarihinde dolmuştur ancak üretimde aktif görünüyor.`,
            action: `Hemen cihazı hattan çekin ve ${d.id} kodlu cihaz için Kalibrasyon Yenileme DÖF'ü başlatın.`
          });
        });
      }

      // 2. Machine maintenance check
      const expiredMaint = machines.filter(m => new Date(m.nextMaintenanceDate) < new Date());
      if (expiredMaint.length > 0) {
        score -= expiredMaint.length * 8;
        expiredMaint.forEach(m => {
          detectedGaps.push({
            id: `GAP-MAC-${m.id}`,
            type: 'Uyarı',
            title: `Önleyici Bakım Gecikmesi: ${m.name}`,
            desc: `Makinenin planlı bakım tarihi ${m.nextMaintenanceDate} geçilmiştir. Plan dışı duruş riski yüksek.`,
            action: `Bakım departmanı için bakım iş emri oluşturun.`
          });
        });
      }

      // 3. Check for open CAPAs (DÖFs) overdue
      const overdueCapas = capas.filter(c => c.status === 'Açık' && new Date(c.targetDate) < new Date());
      if (overdueCapas.length > 0) {
        score -= overdueCapas.length * 7;
        overdueCapas.forEach(c => {
          detectedGaps.push({
            id: `GAP-CAPA-${c.id}`,
            type: 'Kritik',
            title: `Gecikmiş DÖF Faaliyeti: ${c.id}`,
            desc: `Düzeltici faaliyet hedef kapatma tarihi (${c.targetDate}) aşılmıştır.`,
            action: `${c.assignedTo} sorumlusu ile temasa geçerek kapatma doğrulamasını sorgulayın.`
          });
        });
      }

      // 4. Missing procedure check
      const hasPurchasingProc = documents.some(d => d.id === 'PR-002');
      if (!hasPurchasingProc) {
        score -= 15;
        detectedGaps.push({
          id: 'GAP-DOC-PR-002',
          type: 'Kritik',
          title: 'Eksik Temel ISO Prosedürü',
          desc: 'Kalite El Kitabı PR-002 Satınalma Prosedürüne referans vermektedir ancak bu belge sistemde tanımlı değil.',
          action: 'Yapay zeka motorunu kullanarak "Satınalma Prosedürü" oluşturun.'
        });
      }

      // 5. Training Gap Check
      const hasTrainingPlan = documents.some(d => d.id === 'KR-001');
      if (!hasTrainingPlan) {
        score -= 5;
        detectedGaps.push({
          id: 'GAP-TRAIN',
          type: 'Bilgi',
          title: 'Eğitim Kayıt Eksiği',
          desc: 'ISO 9001:2015 Md 7.2 gereği yıllık eğitim planı bulunmalıdır.',
          action: 'Eğitim plan şablonunu Dokümanlar modülünden etkinleştirin.'
        });
      }

      setGaps(detectedGaps);
      setReadinessScore(Math.max(30, score));
      setIsScanning(false);
    }, 1500);
  };

  useEffect(() => {
    runScan();
  }, []);

  const handleGenerateProcedure = () => {
    if (!procTopic.trim()) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      const newDocId = `PR-0${Math.floor(Math.random() * 90) + 10}`;
      const prep = personnel[0]?.name || 'Kalite Müdürü';
      
      addDocument({
        id: newDocId,
        title: `${procTopic.trim()} Prosedürü`,
        type: 'PR',
        revision: 0,
        revisionDate: new Date().toISOString().split('T')[0],
        preparedBy: prep,
        approvedBy: 'Kemal Yılmaz',
        status: 'Onaylı',
        content: `# ${newDocId} ${procTopic.trim()} Prosedürü

## 1. Amaç
Bu prosedürün amacı, işletmemiz bünyesinde yürütülen **${procTopic.trim()}** süreçlerinin kalite hedefleri ve standart gerekliliklerine uygun olarak yönetilmesini sağlamaktır.

## 2. Kapsam
Bu prosedür, tüm fabrika departmanlarını ve ilişkili dış kaynak süreçleri kapsar.

## 3. Süreç Adımları
- Sürecin girdileri belirlenir ve analiz edilir.
- İş akışı adımları periyodik olarak kontrol edilir.
- Süreç performans göstergeleri (KPI) ay sonunda Kalite Temsilcisi tarafından raporlanır.

## 4. İlgili Belgeler
- [Kalite El Kitabı](doc://QM-001)
- [Doküman Kontrolü Prosedürü](doc://PR-001)
      `,
        relatedDocs: ['QM-001', 'PR-001']
      });

      alert(`[AI Üretici] "${procTopic} Prosedürü" (${newDocId}) başarıyla oluşturuldu ve Doküman Yönetim Sistemine eklendi.`);
      setProcTopic('');
      setIsGenerating(false);
      runScan(); // refresh scan
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">MÜHENDİSLİK YAPAY ZEKA DESTEĞİ</span>
          <h2 className="text-xl font-bold text-slate-800">Continuous Compliance AI Auditor (Gemini Taraması)</h2>
        </div>
        <button 
          onClick={runScan}
          disabled={isScanning}
          className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} /> Taramayı Yenile
        </button>
      </div>

      {/* AI Overview HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Audit Readiness Score Card */}
        <div className="border border-slate-200 bg-white rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-2 left-2 flex items-center gap-1 text-[9px] font-mono text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-[#ff6b00]" /> CO-AUDIT V1
          </div>
          
          <div className="relative flex items-center justify-center h-28 w-28 mb-3">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="transparent" stroke="#111" strokeWidth="6" />
              <circle 
                cx="56" 
                cy="56" 
                r="48" 
                fill="transparent" 
                stroke={readinessScore > 80 ? '#16a34a' : readinessScore > 60 ? '#d97706' : '#dc2626'} 
                strokeWidth="6" 
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - readinessScore / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="text-2xl font-black text-slate-800">{readinessScore}%</span>
          </div>

          <span className="text-xs font-semibold text-slate-800">Dış Denetim Hazırlık Endeksi</span>
          <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">ISO 9001:2015 sertifikasyon denetimine hazır bulunma oranı</span>
        </div>

        {/* AI Auto Procedure Generator */}
        <div className="md:col-span-2 border border-slate-200 bg-white rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Bot className="h-5 w-5 text-[#ff6b00]" /> Gemini AI Doküman Oluşturucu
            </h3>
            <p className="text-xs text-slate-500">Gerekli prosedür adını yazarak ISO standardına tam uyumlu taslak doküman oluşturun.</p>
            
            <div className="mt-4 flex gap-2">
              <input 
                type="text" 
                value={procTopic} 
                onChange={e => setProcTopic(e.target.value)}
                placeholder="Örn: Risk Değerlendirme, İş Güvenliği, Sevkiyat Kontrol"
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500" 
              />
              <button 
                onClick={handleGenerateProcedure}
                disabled={isGenerating || !procTopic.trim()}
                className="bg-[#ff6b00]/10 hover:bg-[#ff6b00]/20 text-[#ff6b00] border border-[#ff6b00]/30 font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isGenerating ? 'Yazılıyor...' : <><Send className="h-3.5 w-3.5" /> Oluştur</>}
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 italic border-t border-slate-200 pt-3 mt-4">
            * Yapay zeka tarafından oluşturulan belgeler "Dokümanlar" modülünde düzenlenebilir ve revize edilebilir.
          </div>
        </div>

      </div>

      {/* AI Gap Analysis Table */}
      <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-lg">
        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Tespit Edilen Sistem Boşlukları (Gaps) ve Öneriler</span>
        
        <div className="space-y-3">
          {gaps.map(g => (
            <div key={g.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex gap-3 text-xs items-start">
              <div className={`p-2 rounded shrink-0 ${
                g.type === 'Kritik' 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : g.type === 'Uyarı'
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              
              <div className="space-y-1.5 flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{g.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                    g.type === 'Kritik' ? 'text-red-500' : g.type === 'Uyarı' ? 'text-yellow-500' : 'text-blue-500'
                  }`}>
                    {g.type}
                  </span>
                </div>
                <p className="text-slate-500">{g.desc}</p>
                <div className="text-[11px] text-[#ff6b00] font-semibold bg-[#ff6b00]/5 p-2 rounded border border-[#ff6b00]/10">
                  Öneri Eylem: {g.action}
                </div>
              </div>
            </div>
          ))}

          {gaps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ShieldCheck className="h-16 w-16 text-green-500/30 mb-3" />
              <span className="text-sm font-semibold">Tebrikler, Hiçbir Uygunsuzluk Bulunmadı!</span>
              <span className="text-xs text-gray-600">Sisteminiz 100% ISO denetime hazır durumda görünüyor.</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
