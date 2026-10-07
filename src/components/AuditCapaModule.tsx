'use client';

import React, { useState } from 'react';
import { useQms, Audit, CAPA } from '@/context/QmsContext';
import { FileText, Plus, ShieldCheck, HelpCircle, CheckCircle, AlertCircle, Play, Check, Trash2, Printer } from 'lucide-react';

export default function AuditCapaModule() {
  const { audits, capas, addCapa, addAudit, personnel } = useQms();
  const [activeTab, setActiveTab] = useState<'audit' | 'capa'>('audit');
  
  const [activeAuditId, setActiveAuditId] = useState<string>(audits[0]?.id || '');
  const [activeCapaId, setActiveCapaId] = useState<string>(capas[0]?.id || '');

  // New CAPA Form States
  const [showAddCapa, setShowAddCapa] = useState(false);
  const [capaTitle, setCapaTitle] = useState('');
  const [capaDesc, setCapaDesc] = useState('');
  const [capaImmediate, setCapaImmediate] = useState('');
  const [capaAction, setCapaAction] = useState('');
  const [why1, setWhy1] = useState('');
  const [why2, setWhy2] = useState('');
  const [why3, setWhy3] = useState('');
  const [why4, setWhy4] = useState('');
  const [why5, setWhy5] = useState('');
  const [capaAssignee, setCapaAssignee] = useState('Deniz Kaya');

  // New Audit Form States
  const [showAddAudit, setShowAddAudit] = useState(false);
  const [auditTitle, setAuditTitle] = useState('');
  const [auditorName, setAuditorName] = useState('Faruk Oruç');
  const [auditeeName, setAuditeeName] = useState('Ahmet Şahin');
  const [auditDate, setAuditDate] = useState('2026-07-01');
  const [auditQuestions, setAuditQuestions] = useState([
    { question: 'Kalite politikası çalışanlarca biliniyor mu? (Standart Md. 5.2)', result: 'Uygun' as 'Uygun' | 'Uygunsuz' | 'Gözlem', note: 'Personel sorgulandı, politika bilinci doğrulanmıştır.' },
    { question: 'Dokümanlar revizyon takip sistemine uygun mu? (Standart Md. 7.5)', result: 'Uygun' as 'Uygun' | 'Uygunsuz' | 'Gözlem', note: 'Üretimdeki formların güncel revizyonları kontrol edildi.' },
    { question: 'Ölçüm cihazlarının kalibrasyon etiketleri güncel mi? (Standart Md. 7.1.5)', result: 'Uygun' as 'Uygun' | 'Uygunsuz' | 'Gözlem', note: 'Ölçüm cihazlarının etiket kontrolleri yapıldı.' },
    { question: 'Müşteri şikayetleri kayıt altına alınıp DÖF açılıyor mu? (Standart Md. 8.2.1)', result: 'Uygun' as 'Uygun' | 'Uygunsuz' | 'Gözlem', note: 'Şikayet kayıtları ve kapatılan aksiyonlar incelendi.' },
    { question: 'Makine periyodik bakımları zamanında yapılıyor mu? (Standart Md. 8.5)', result: 'Uygun' as 'Uygun' | 'Uygunsuz' | 'Gözlem', note: '37 makineye ait aylık önleyici bakım kayıtları incelendi.' },
    { question: 'Giriş kalite kontrol muayeneleri irsaliye bazlı kayıt altına alınıyor mu? (TS EN 61537)', result: 'Uygun' as 'Uygun' | 'Uygunsuz' | 'Gözlem', note: 'Ereğli sac irsaliyeleri ve girdi kontrol raporları doğrulandı.' },
    { question: 'Sevkiyat öncesi ürün son kontrolleri yapılarak test raporu düzenleniyor mu? (TS EN 61537)', result: 'Uygun' as 'Uygun' | 'Uygunsuz' | 'Gözlem', note: 'Giden sevkiyatlar öncesi son kontrol muayene onayları kontrol edildi.' }
  ]);

  const activeAudit = audits.find(a => a.id === activeAuditId) || audits[0];
  const activeCapa = capas.find(c => c.id === activeCapaId) || capas[0];

  const handleAddCapa = () => {
    if (!capaTitle || !capaDesc) return;
    
    const rootCause = `
5 Neden Kök Neden Zinciri:
1. Neden? ${why1 || 'Operatör hatası yapıldı.'}
2. Neden? ${why2 || 'Makine kullanımı talimatlara tam uygun yürütülmedi.'}
3. Neden? ${why3 || 'Kullanım talimatı operatör eğitimlerinde yeterince vurgulanmamıştı.'}
4. Neden? ${why4 || 'Eğitim planında makine talimatı eksikti.'}
5. Neden? ${why5 || 'Yetersiz standart eğitim takibi ve denetimi.'}
    `.trim();

    addCapa({
      id: `DF-${Date.now().toString().substring(11)}`,
      title: capaTitle,
      sourceType: 'Denetim',
      detectedDate: new Date().toISOString().split('T')[0],
      description: capaDesc,
      immediateAction: capaImmediate || 'Düzeltici önlem alındı.',
      rootCauseAnalysis: rootCause,
      preventiveAction: capaAction,
      assignedTo: capaAssignee,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Açık'
    });

    setCapaTitle('');
    setCapaDesc('');
    setCapaImmediate('');
    setCapaAction('');
    setWhy1('');
    setWhy2('');
    setWhy3('');
    setWhy4('');
    setWhy5('');
    setShowAddCapa(false);
  };

  const handleAddAudit = () => {
    if (!auditTitle) return;
    
    const newId = `IA-${Date.now().toString().substring(11)}`;
    
    addAudit({
      id: newId,
      title: auditTitle,
      planDate: auditDate,
      actualDate: auditDate,
      auditors: [auditorName],
      auditees: [auditeeName],
      checklist: auditQuestions,
      status: 'Tamamlandı',
      findingsReport: `İç tetkik başarıyla tamamlanmıştır. Denetlenen süreçlerde ${auditQuestions.filter(q => q.result === 'Uygunsuz').length} adet uygunsuzluk tespit edilmiş olup gerekli DÖF talepleri oluşturulmuştur.`
    });

    // Automatically trigger CAPA prompts for failed questions
    auditQuestions.forEach((q, idx) => {
      if (q.result === 'Uygunsuz') {
        // trigger quick capa creation
        addCapa({
          id: `DF-AUTO-${Math.floor(100 + Math.random() * 900)}`,
          title: `${auditTitle} - Uygunsuzluk #${idx + 1}`,
          sourceType: 'Denetim',
          detectedDate: auditDate,
          description: `İç denetimde tespit edilen bulgu: "${q.question}" maddesiyle ilgili olarak: ${q.note}`,
          immediateAction: 'Hatalı durum geçici olarak düzeltildi ve karantinaya alındı.',
          rootCauseAnalysis: 'Kök neden analizi devam ediyor (5 Neden analizi yapılması planlandı).',
          preventiveAction: 'Süreç kontrol talimatı revize edilerek eğitim düzenlenecektir.',
          assignedTo: auditorName,
          targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Açık'
        });
      }
    });

    setAuditTitle('');
    setShowAddAudit(false);
    setActiveAuditId(newId);
    alert('İç denetim kaydı başarıyla oluşturuldu! Uygunsuz bulunan adımlar için otomatik DÖF talepleri açılmıştır.');
  };

  const handleVerifyCapa = () => {
    if (!activeCapa) return;
    alert(`[Kayıt] ${activeCapa.id} düzeltici faaliyeti etkililik doğrulaması yapılmış ve Kapatılmıştır.`);
  };

  const updateQuestionResult = (index: number, val: 'Uygun' | 'Uygunsuz' | 'Gözlem') => {
    const updated = [...auditQuestions];
    updated[index].result = val;
    setAuditQuestions(updated);
  };

  const updateQuestionNote = (index: number, val: string) => {
    const updated = [...auditQuestions];
    updated[index].note = val;
    setAuditQuestions(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'audit' 
              ? 'border-[#ff6b00] text-slate-800' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          🔍 İç Tetkik ve Denetim Kayıtları
        </button>
        <button
          onClick={() => setActiveTab('capa')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'capa' 
              ? 'border-[#ff6b00] text-slate-800' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          📝 DÖF (Düzeltici & Önleyici Faaliyetler)
        </button>
      </div>

      {activeTab === 'audit' ? (
        /* AUDITS TAB */
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">ISO 9001 Maddesi 9.2</span>
              <h2 className="text-xl font-bold text-slate-800">İç Tetkik Süreçleri ve Soru Listeleri</h2>
            </div>
            <button 
              onClick={() => setShowAddAudit(!showAddAudit)}
              className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Yeni İç Tetkik Düzenle
            </button>
          </div>

          {showAddAudit && (
            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 text-xs text-slate-700">
              <h3 className="text-sm font-bold text-slate-800 uppercase text-[#ff6b00]">Yeni İç Tetkik Değerlendirme Oturumu Başlat</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">Tetkik Konusu / Başlık</label>
                  <input 
                    type="text" value={auditTitle} onChange={e => setAuditTitle(e.target.value)}
                    placeholder="Örn: 2026 Yıllık Kalite ve Üretim Denetimi"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Baş Tetkikçi</label>
                  <input 
                    type="text" value={auditorName} onChange={e => setAuditorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Denetlenen Süreç Sorumlusu</label>
                  <input 
                    type="text" value={auditeeName} onChange={e => setAuditeeName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                  />
                </div>
              </div>

              {/* Questionnaire list with inputs */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold text-[#ff6b00] uppercase">Soru Listesi Değerlendirmeleri (Uygunsuz seçilirse otomatik DÖF açılır)</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400">
                        <th className="p-3">Süreç Muayene Maddesi</th>
                        <th className="p-3 w-40">Değerlendirme</th>
                        <th className="p-3">Tespit & Notlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditQuestions.map((q, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0">
                          <td className="p-3 text-slate-700 w-1/3">{q.question}</td>
                          <td className="p-3">
                            <select 
                              value={q.result} 
                              onChange={e => updateQuestionResult(idx, e.target.value as any)}
                              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                            >
                              <option value="Uygun">Uygun (Geçti)</option>
                              <option value="Uygunsuz">Uygunsuz (DÖF Aç)</option>
                              <option value="Gözlem">Gözlem</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <input 
                              type="text" value={q.note} onChange={e => updateQuestionNote(idx, e.target.value)}
                              placeholder="Tespit edilen kanıt..."
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:border-orange-500" 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button onClick={() => setShowAddAudit(false)} className="px-3 py-2 text-slate-500 hover:text-slate-800">İptal</button>
                <button onClick={handleAddAudit} className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded">Tetkiki Tamamla ve Kaydet</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar list */}
            <div className="md:col-span-1 border border-slate-200 rounded-xl bg-white p-4 space-y-2 max-h-[500px] overflow-y-auto">
              <span className="block text-xs font-semibold text-slate-400 uppercase mb-3">Denetim Geçmişi ({audits.length})</span>
              {audits.map(a => (
                <button
                  key={a.id}
                  onClick={() => setActiveAuditId(a.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                    activeAuditId === a.id 
                      ? 'bg-[#ff6b00]/10 text-slate-800 border-[#ff6b00]/30' 
                      : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-[10px] font-mono text-[#ff6b00] block">{a.id}</span>
                    <span className="text-xs font-semibold block text-slate-800 truncate">{a.title}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{a.actualDate || a.planDate}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Audit details details */}
            <div className="md:col-span-3 border border-slate-200 rounded-xl bg-white p-5 space-y-6">
              {activeAudit ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeAudit.id}</span>
                      <h3 className="text-base font-bold text-slate-800 mt-1">{activeAudit.title}</h3>
                      <p className="text-xs text-slate-500">Denetçiler: {activeAudit.auditors.join(', ')} | Denetlenenler: {activeAudit.auditees.join(', ')}</p>
                    </div>
                    <span className="text-xs text-green-500 font-semibold bg-green-500/10 px-3 py-1 rounded border border-green-500/20">
                      Durum: {activeAudit.status}
                    </span>
                  </div>

                  {/* Checklist questions table */}
                  <div className="space-y-3">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">İç Tetkik Soru ve Kontrol Listesi</span>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 border-b border-slate-200">
                            <th className="p-3 font-semibold">Soru & Değerlendirme</th>
                            <th className="p-3 font-semibold w-24">Sonuç</th>
                            <th className="p-3 font-semibold">Gözlem / Not</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeAudit.checklist.map((c, i) => (
                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30">
                              <td className="p-3 text-slate-800 font-medium">{c.question}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.result === 'Uygun' 
                                    ? 'bg-green-500/10 text-green-500' 
                                    : 'bg-red-500/10 text-red-500 animate-pulse'
                                }`}>
                                  {c.result}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500">
                                {c.note}
                                {c.capaId && (
                                  <span className="block text-[10px] text-[#ff6b00] font-mono mt-1">İlişkili DÖF: {c.capaId}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Audit summary */}
                  <div className="space-y-2 border-t border-slate-200 pt-4 text-xs">
                    <span className="block font-semibold text-slate-800">Denetim Sonuç Raporu Özeti</span>
                    <p className="p-3 bg-slate-50 border border-slate-100 rounded text-slate-700">
                      {activeAudit.findingsReport || 'Bulgu raporu girilmemiştir.'}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => alert(`[Tetkik] Rapor çıktısı fiziki imza için PDF formatına dönüştürüldü.`)}
                      className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded text-xs flex items-center gap-1"
                    >
                      <Printer className="h-4 w-4" /> Denetim Raporunu Yazdır
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Gösterilecek denetim planı bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CAPA (DÖF) TAB */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* CAPA list sidebar */}
          <div className="md:col-span-1 border border-slate-200 rounded-xl bg-white p-4 space-y-2 max-h-[500px] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Aktif DÖF Listesi</span>
              <button 
                onClick={() => setShowAddCapa(true)} 
                className="text-[#ff6b00] hover:text-[#ff6b00]/80 p-1 bg-[#ff6b00]/10 border border-[#ff6b00]/20 rounded text-[10px] font-bold"
              >
                + Yeni Talep
              </button>
            </div>
            {capas.map(c => (
              <button
                key={c.id}
                onClick={() => { setActiveCapaId(c.id); setShowAddCapa(false); }}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                  activeCapaId === c.id 
                    ? 'bg-[#ff6b00]/10 text-slate-800 border-[#ff6b00]/30' 
                    : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-[#ff6b00] block">{c.id}</span>
                  <span className="text-xs font-semibold block text-slate-800 truncate max-w-[120px]">{c.title}</span>
                  <span className="text-[9px] text-slate-400 block">{c.status}</span>
                </div>
              </button>
            ))}
          </div>

          {/* CAPA details & 5 Whys Root cause analyzer */}
          <div className="md:col-span-3 border border-slate-200 rounded-xl bg-white p-5 space-y-6">
            {showAddCapa ? (
              /* ADD NEW CAPA */
              <div className="space-y-4 text-xs text-slate-700">
                <h3 className="text-sm font-bold text-slate-800 uppercase text-[#ff6b00]">Yeni Düzeltici Önleyici Faaliyet Başlat</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-slate-500 mb-1">DÖF Başlığı / Kısa Tanım</label>
                    <input 
                      type="text" 
                      value={capaTitle} 
                      onChange={e => setCapaTitle(e.target.value)}
                      placeholder="Örn: Kalibrasyonu dolmuş kumpas kullanımı hakkında düzeltme"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-500 mb-1">Bulgu / Uygunsuzluk Açıklaması</label>
                    <textarea 
                      value={capaDesc} 
                      onChange={e => setCapaDesc(e.target.value)}
                      rows={2}
                      placeholder="İç denetimde, Profil Hattı 1'de kullanılan KMP-01 kumpasının kalibrasyon süresinin 3 gün geçmiş olduğu görüldü."
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>

                  {/* 5 Whys block */}
                  <div className="col-span-2 border border-slate-100 p-3 rounded bg-slate-50 space-y-2">
                    <span className="block text-[10px] text-[#ff6b00] font-bold uppercase tracking-wider">Kök Neden Analizi (5 Neden / 5 Whys Zinciri)</span>
                    <input type="text" placeholder="1. Neden? (Hata neden oluştu?)" value={why1} onChange={e => setWhy1(e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800" />
                    <input type="text" placeholder="2. Neden?" value={why2} onChange={e => setWhy2(e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800" />
                    <input type="text" placeholder="3. Neden?" value={why3} onChange={e => setWhy3(e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800" />
                    <input type="text" placeholder="4. Neden?" value={why4} onChange={e => setWhy4(e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800" />
                    <input type="text" placeholder="5. Neden? (Kök Neden)" value={why5} onChange={e => setWhy5(e.target.value)} className="w-full bg-[#0a0a0a] border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800" />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Hemen Alınan Geçici Önlem</label>
                    <input 
                      type="text" 
                      value={capaImmediate} 
                      onChange={e => setCapaImmediate(e.target.value)}
                      placeholder="Cihaz hattan çekilip kalibrasyon laboratuvarına gönderildi."
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold text-[#ff6b00]">Kalıcı Düzeltici Aksiyon</label>
                    <input 
                      type="text" 
                      value={capaAction} 
                      onChange={e => setCapaAction(e.target.value)}
                      placeholder="Kumpaslar için otomatik periyot uyarı yazılımı entegre edilecek."
                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs pt-4 border-t border-slate-200">
                  <button onClick={() => setShowAddCapa(false)} className="px-3 py-2 text-slate-500 hover:text-slate-800">İptal</button>
                  <button onClick={handleAddCapa} className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded">DÖF Başlat</button>
                </div>
              </div>
            ) : activeCapa ? (
              /* DÖF DETAILS DISPLAY */
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{activeCapa.id}</span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">{activeCapa.title}</h3>
                    <p className="text-slate-500">Atanan: {activeCapa.assignedTo} | Tespit Tarihi: {activeCapa.detectedDate}</p>
                  </div>
                  <span className={`px-2 py-1 rounded border font-semibold ${
                    activeCapa.status === 'Kapalı' 
                      ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                      : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                  }`}>
                    Durum: {activeCapa.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                    <span className="block text-[#ff6b00] font-bold uppercase tracking-wider mb-1.5">Bulgu / Uygunsuzluk Açıklaması</span>
                    <p className="text-slate-500">{activeCapa.description}</p>
                  </div>
                  <div className="border border-slate-200 p-3 rounded-lg bg-slate-50">
                    <span className="block text-[#ff6b00] font-bold uppercase tracking-wider mb-1.5">Hemen Alınan Önlem</span>
                    <p className="text-slate-500">{activeCapa.immediateAction}</p>
                  </div>
                </div>

                {/* 5 Whys Analysis display */}
                <div className="border border-slate-200 p-4 rounded-lg bg-[#070707] text-xs">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-widest mb-2">5 Neden Kök Neden Analizi</span>
                  <div className="whitespace-pre-line text-slate-700 font-mono leading-relaxed bg-[#020202] p-3 rounded border border-slate-100">
                    {activeCapa.rootCauseAnalysis}
                  </div>
                </div>

                {/* Preventive action plan */}
                <div className="space-y-2 text-xs">
                  <span className="block font-semibold text-slate-800 uppercase tracking-wider">Kalıcı Önleyici Aksiyon Planı</span>
                  <p className="p-3 bg-slate-50 border border-slate-100 rounded text-slate-700">
                    {activeCapa.preventiveAction}
                  </p>
                </div>

                {/* Action panel closure */}
                {activeCapa.status !== 'Kapalı' && (
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button 
                      onClick={handleVerifyCapa}
                      className="bg-green-600 hover:bg-green-700 text-slate-800 font-bold px-4 py-2 rounded text-xs transition-all flex items-center gap-1"
                    >
                      <Check className="h-4 w-4" /> Etkililik Doğrulamasını Tamamla ve DÖF Kapat
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Gösterilecek DÖF kaydı bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
