'use client';

import React, { useState } from 'react';
import { useQms, RiskOpportunity } from '@/context/QmsContext';
import { ShieldAlert, Plus, ShieldCheck, Activity, TrendingUp, CheckCircle, Trash2 } from 'lucide-react';

export default function RiskModule() {
  const { risks, addRisk, processes } = useQms();
  const [activeRiskId, setActiveRiskId] = useState<string>(risks[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Risk Form
  const [type, setType] = useState<'Risk' | 'Fırsat'>('Risk');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState(processes[0]?.name || 'Üretim Süreci');
  const [probability, setProbability] = useState<number>(3);
  const [severity, setSeverity] = useState<number>(3);
  const [mitigationAction, setMitigationAction] = useState('');
  const [owner, setOwner] = useState('Kalite Müdürü');

  const activeRisk = risks.find(r => r.id === activeRiskId) || risks[0];

  const handleAddRisk = () => {
    if (!description || !mitigationAction) return;
    
    addRisk({
      id: `${type === 'Risk' ? 'R' : 'F'}-${Date.now().toString().substring(11)}`,
      type,
      description,
      source,
      probability,
      severity,
      score: probability * severity,
      mitigationAction,
      owner,
      status: 'Açık'
    });

    setDescription('');
    setMitigationAction('');
    setShowAddForm(false);
  };

  // Helper to color risk scores
  const getScoreInfo = (score: number, rType: 'Risk' | 'Fırsat') => {
    if (rType === 'Fırsat') {
      return { label: 'Yüksek Fırsat', color: 'text-green-500 bg-green-500/10 border-green-500/20' };
    }
    if (score >= 12) return { label: 'Kritik (Kabul Edilemez)', color: 'text-red-500 bg-red-500/10 border-red-500/20 font-bold' };
    if (score >= 6) return { label: 'Orta (Gözetim Altında)', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Düşük (Kabul Edilebilir)', color: 'text-green-500 bg-green-500/10 border-green-500/20' };
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-semibold text-[#ff6b00] uppercase tracking-wider">ISO 9001 RİSK TABANLI DÜŞÜNCE</span>
          <h2 className="text-xl font-bold text-slate-800">Risk ve Fırsat Analiz Modülü</h2>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Yeni Risk/Fırsat Ekle
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 max-w-lg text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-800 uppercase text-[#ff6b00]">Yeni Risk & Fırsat Tanımlama</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">Tip</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value="Risk">Risk (Tehdit)</option>
                <option value="Fırsat">Fırsat (Gelişim)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Kaynak Süreç / Birim</label>
              <select 
                value={source} 
                onChange={e => setSource(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                {processes.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                <option value="Diğer">Diğer</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-slate-500 mb-1">Tanım / Risk Senaryosu</label>
              <input 
                type="text" 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                placeholder="Örn: Hammadde maliyetlerindeki dalgalanma sebebiyle teklif fiyatlarının geçersiz kalması"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Olasılık (1-5)</label>
              <select 
                value={probability} 
                onChange={e => setProbability(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value={1}>1 - Çok Düşük</option>
                <option value={2}>2 - Düşük</option>
                <option value={3}>3 - Orta</option>
                <option value={4}>4 - Yüksek</option>
                <option value={5}>5 - Çok Yüksek</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Şiddet / Etki (1-5)</label>
              <select 
                value={severity} 
                onChange={e => setSeverity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value={1}>1 - Çok Düşük</option>
                <option value={2}>2 - Düşük</option>
                <option value={3}>3 - Orta</option>
                <option value={4}>4 - Ciddi</option>
                <option value={5}>5 - Felaket</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-slate-500 mb-1">Önleyici / Azaltıcı Faaliyet Planı</label>
              <textarea 
                value={mitigationAction} 
                onChange={e => setMitigationAction(e.target.value)}
                rows={2}
                placeholder="Örn: Tedarikçilerle 6 aylık sabit fiyat sözleşmeleri yapılacak, alternatif hammadde arayışına gidilecek."
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-500 mb-1">Faaliyet Sorumlusu (Pozisyon)</label>
              <input 
                type="text" 
                value={owner} 
                onChange={e => setOwner(e.target.value)}
                placeholder="Örn: Satınalma Müdürü"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-2 text-slate-500 hover:text-slate-800">İptal</button>
            <button onClick={handleAddRisk} className="bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold px-4 py-2 rounded">Riski Ekle</button>
          </div>
        </div>
      )}

      {/* List and details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left list */}
        <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 max-h-[500px] overflow-y-auto">
          <span className="block text-xs font-semibold text-slate-400 uppercase mb-3">Tanımlı Risk & Fırsatlar ({risks.length})</span>
          {risks.map(r => {
            const isRisk = r.type === 'Risk';
            const scoreInfo = getScoreInfo(r.score, r.type);
            return (
              <button
                key={r.id}
                onClick={() => setActiveRiskId(r.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${
                  activeRiskId === r.id 
                    ? 'bg-[#ff6b00]/10 text-slate-800 border-[#ff6b00]/30' 
                    : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono block text-slate-400">{r.id}</span>
                  <span className="text-xs font-semibold block text-slate-800 truncate max-w-[130px]">{r.description}</span>
                  <span className="text-[9px] text-[#ff6b00] block">{r.source}</span>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${scoreInfo.color}`}>
                    {isRisk ? `Skor: ${r.score}` : 'Fırsat'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Details & Interactive 5x5 mini-matrix for active item */}
        <div className="md:col-span-2 border border-slate-200 bg-white rounded-xl p-5 space-y-6">
          {activeRisk ? (
            <>
              {/* Header card details */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg border ${
                    activeRisk.type === 'Risk' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                  }`}>
                    {activeRisk.type === 'Risk' ? <ShieldAlert className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeRisk.type} - {activeRisk.source}</span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">{activeRisk.description}</h3>
                  </div>
                </div>
              </div>

              {/* Matrix cell positioning info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-500">
                
                {/* 5x5 Mini Grid Visualizer */}
                <div className="space-y-2 border border-slate-100 p-3 rounded-lg bg-slate-50">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-widest">Matris Konumu</span>
                  
                  <div className="grid grid-cols-5 gap-1.5 aspect-video border border-slate-200 p-1.5 rounded">
                    {Array.from({ length: 25 }).map((_, i) => {
                      const x = (i % 5) + 1; // Probability
                      const y = 5 - Math.floor(i / 5); // Severity
                      
                      const isActiveCell = activeRisk.probability === x && activeRisk.severity === y;
                      const score = x * y;
                      
                      const isHigh = score >= 12;
                      const isMedium = score >= 6 && score < 12;
                      const bgCell = isActiveCell 
                        ? 'bg-[#ff6b00] border-white shadow-[0_0_8px_rgba(255,107,0,0.8)] scale-105 z-10 text-black' 
                        : isHigh 
                          ? 'bg-red-950/20 border-red-900/30 text-red-900' 
                          : isMedium 
                            ? 'bg-yellow-950/20 border-yellow-900/30 text-yellow-900' 
                            : 'bg-green-950/10 border-green-900/20 text-green-900';

                      return (
                        <div 
                          key={i} 
                          className={`border text-[8px] font-extrabold flex items-center justify-center rounded transition-all duration-300 ${bgCell}`}
                          title={`Olasılık: ${x}, Şiddet: ${y}`}
                        >
                          {isActiveCell ? '•' : score}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-600 px-2 font-mono">
                    <span>Olasılık: {activeRisk.probability} / 5</span>
                    <span>Şiddet: {activeRisk.severity} / 5</span>
                  </div>
                </div>

                {/* Score analysis details */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Risk Analiz Sonucu</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${getScoreInfo(activeRisk.score, activeRisk.type).color} inline-block`}>
                      {getScoreInfo(activeRisk.score, activeRisk.type).label} (Skor: {activeRisk.score})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Aksiyon Sorumlusu</span>
                    <span className="text-slate-800 font-semibold">{activeRisk.owner}</span>
                  </div>
                </div>

              </div>

              {/* Dynamic Mitigation Action plans */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <span className="block text-xs font-semibold text-[#ff6b00] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-green-500" /> Planlanan Önleyici Azaltıcı Aksiyonlar
                </span>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed">
                  {activeRisk.mitigationAction}
                </div>
              </div>

            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Gösterilecek risk analiz kaydı bulunamadı.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
