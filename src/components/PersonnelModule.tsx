'use client';

import React, { useState } from 'react';
import { useQms, Personnel } from '@/context/QmsContext';
import { Users, Plus, ShieldAlert, Award, FileText, Printer, CheckCircle } from 'lucide-react';

export default function PersonnelModule() {
  const { personnel, addPersonnel, departments, companyInfo } = useQms();
  const [activePersId, setActivePersId] = useState<string>(personnel[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Personnel Form
  const [name, setName] = useState('');
  const [dept, setDept] = useState(departments[0]?.name || 'Kalite Yönetimi');
  const [pos, setPos] = useState('');
  const [certs, setCerts] = useState('');
  const [comps, setComps] = useState('');

  const activePers = personnel.find(p => p.id === activePersId) || personnel[0];

  const handleAdd = () => {
    if (!name || !pos) return;
    addPersonnel({
      id: `PERS-${Date.now()}`,
      name,
      department: dept,
      position: pos,
      certificates: certs ? certs.split(',').map(s => s.trim()) : [],
      competencies: comps ? comps.split(',').map(s => s.trim()) : [],
      trainingRecords: []
    });
    setName('');
    setPos('');
    setCerts('');
    setComps('');
    setShowAddForm(false);
  };

  const handlePrint = (title: string) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">İNSAN KAYNAKLARI</span>
          <h2 className="text-xl font-bold text-slate-800">Personel ve Yetkinlik Yönetimi</h2>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Yeni Personel Ekle
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 max-w-lg shadow-sm text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-800 uppercase text-orange-600">Yeni Personel Kayıt Kartı</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">Adı Soyadı</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Serkan Yıldız"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Pozisyon / Görev</label>
              <input 
                type="text" 
                value={pos} 
                onChange={e => setPos(e.target.value)}
                placeholder="Örn: Test Mühendisi"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-orange-500" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Departman</label>
              <select 
                value={dept} 
                onChange={e => setDept(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Sertifikalar (Virgülle ayır)</label>
              <input 
                type="text" 
                value={certs} 
                onChange={e => setCerts(e.target.value)}
                placeholder="ISO 9001, İSG Yetki Belgesi"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-500 mb-1">Yetkinlik Alanları (Virgülle ayır)</label>
              <input 
                type="text" 
                value={comps} 
                onChange={e => setComps(e.target.value)}
                placeholder="Metrik Ölçüm, Kalibrasyon Takip, Kaynak Kontrolü"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 focus:outline-none" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-2 text-slate-400 hover:text-slate-600">İptal</button>
            <button onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded">Kaydet</button>
          </div>
        </div>
      )}

      {/* Main Grid: Personnel List on left, Details on right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Personnel List Sidebar */}
        <div className="border border-slate-200 bg-white p-4 rounded-xl space-y-2 max-h-[500px] overflow-y-auto shadow-sm">
          <span className="block text-xs font-semibold text-slate-500 uppercase mb-3">Çalışan Personeller ({personnel.length})</span>
          {personnel.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePersId(p.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                activePersId === p.id 
                  ? 'bg-orange-50 text-orange-600 border-orange-200 font-semibold shadow-sm' 
                  : 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-orange-600 border border-slate-200">
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="truncate flex-1">
                <span className="text-xs font-semibold block text-slate-800">{p.name}</span>
                <span className="text-[10px] text-slate-500 block truncate">{p.position}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Personnel Detail & Auto-Generated Document views */}
        <div className="md:col-span-2 border border-slate-200 bg-white rounded-xl p-5 space-y-6 shadow-sm">
          {activePers ? (
            <>
              {/* Header metadata */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center font-bold text-lg text-orange-600 border border-orange-200">
                    {activePers.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{activePers.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{activePers.department} | {activePers.position}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePrint(`Görev Tanımı - ${activePers.name}`)}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold px-3 py-1.5 rounded flex items-center gap-1"
                  >
                    <Printer className="h-3.5 w-3.5 text-orange-600" /> Görev Tanımı Yazdır
                  </button>
                  <button 
                    onClick={() => handlePrint(`Nitelik Kaydı - ${activePers.name}`)}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold px-3 py-1.5 rounded flex items-center gap-1"
                  >
                    <Award className="h-3.5 w-3.5 text-orange-600" /> Nitelik Kaydı (TR)
                  </button>
                </div>
              </div>

              {/* Competencies & Certificates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 text-slate-700">
                  <span className="block text-orange-600 font-bold uppercase tracking-wider mb-2">Sertifika & Eğitim Belgeleri</span>
                  <div className="space-y-1.5">
                    {activePers.certificates.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-600">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        <span>{c}</span>
                      </div>
                    ))}
                    {activePers.certificates.length === 0 && (
                      <span className="text-slate-400 italic block">Kayıtlı sertifika bulunmamaktadır.</span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 text-slate-700">
                  <span className="block text-orange-600 font-bold uppercase tracking-wider mb-2">Yetkinlik Seviyeleri</span>
                  <div className="space-y-2">
                    {activePers.competencies.map((c, i) => (
                      <div key={i} className="flex justify-between items-center text-slate-600">
                        <span>{c}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <span 
                              key={idx} 
                              className={`h-2.5 w-2 rounded-sm ${idx < 4 ? 'bg-orange-500' : 'bg-slate-200'}`} 
                              title="Uzmanlık Derecesi"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {activePers.competencies.length === 0 && (
                      <span className="text-slate-400 italic block">Kayıtlı yetkinlik bulunmamaktadır.</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Dynamic Job Description Preview (A4 Page View style) */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Otomatik Üretilen Görev Tanımı Formu</span>
                
                <div className="p-4 bg-slate-200 border border-slate-300 rounded-lg flex justify-center overflow-x-auto">
                  <div className="print-area print-portrait w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-800 p-8 shadow-md border border-slate-300 rounded font-sans text-left flex flex-col justify-between" style={{ boxSizing: 'border-box' }}>
                    
                    <div>
                      {/* Standard ISO 9001 Page Header */}
                      <div className="border-2 border-slate-900 grid grid-cols-4 text-center items-center text-[9px] font-bold mb-6">
                        <div className="p-2 border-r-2 border-slate-900 flex flex-col justify-center items-center">
                          <img src="/sies_logo.png" alt="SIES Logo" className="h-8 object-contain mb-0.5" />
                          <span className="text-[6px] text-slate-500 font-extrabold">İK / KALİTE</span>
                        </div>
                        <div className="p-2 border-r-2 border-slate-900 col-span-2 text-center uppercase text-slate-900 text-[10px] font-black">
                          PERSONEL GÖREV VE SORUMLULUK FORMU
                        </div>
                        <div className="p-2.5 text-left font-mono text-[7px] space-y-0.5">
                          <div>FORM NO: <span className="text-black font-bold">FR-İK-001</span></div>
                          <div>TARİH: <span className="text-black">{new Date().toISOString().split('T')[0]}</span></div>
                          <div>REV: <span className="text-black">Rev.0</span></div>
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="space-y-4 text-xs">
                        <h1 className="text-base font-extrabold text-slate-950 border-b border-slate-900 pb-1 uppercase">
                          GÖREV TANIMI: {activePers.position.toUpperCase()}
                        </h1>
                        
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 p-2 text-[10px]">
                          <div><strong>Çalışanın Adı Soyadı:</strong> {activePers.name}</div>
                          <div><strong>Pozisyonu / Görevi:</strong> {activePers.position}</div>
                          <div><strong>Bağlı Olduğu Departman:</strong> {activePers.department}</div>
                          <div><strong>Durumu:</strong> Aktif İstihdam (ISO 9001 Yetkili)</div>
                        </div>

                        <div>
                          <h2 className="font-bold text-slate-900 uppercase text-[11px] mb-1">1. Rol ve Sorumluluk Tanımı</h2>
                          <p className="text-slate-700 leading-relaxed text-justify text-[11px]">
                            Bu görev tanımı, {activePers.department} bünyesinde görev yapan <strong>{activePers.name}</strong> isimli personelin rol, yetki ve organizasyonel sınırlarını tanımlar. Personel, ISO 9001:2015 standart şartlarına ve SIES elektrik pano/kablo kanalı imalat prosedürlerine uygun çalışmakla yükümlüdür.
                          </p>
                        </div>

                        <div>
                          <h2 className="font-bold text-slate-900 uppercase text-[11px] mb-1">2. Temel Görevler</h2>
                          <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[10px]">
                            <li>Bulunduğu departmandaki üretim ve süreç planına eksiksiz uymak.</li>
                            <li>Kişisel koruyucu donanımları (KKD) çalışma talimatlarına uygun olarak kullanmak.</li>
                            <li>Sorumlu olduğu makinelerin önleyici günlük bakımlarını yapmak ve sapmaları raporlamak.</li>
                            <li>Tedarikçi girdi ve sevkiyat son kontrol muayene onaylarında kalite sınır değerlerine uymak.</li>
                            <li>İç tetkiklerde belirlenen uygunsuzlukların giderilmesi için DÖF aksiyonlarını yerine getirmek.</li>
                          </ul>
                        </div>

                        <div>
                          <h2 className="font-bold text-slate-900 uppercase text-[11px] mb-1">3. Yetkinlikler & Sertifikalar</h2>
                          <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-700">
                            <div>
                              <strong className="block text-slate-900">Eğitim & Nitelik:</strong>
                              {activePers.certificates.map((c, i) => <span key={i} className="block">• {c}</span>)}
                              {activePers.certificates.length === 0 && <span className="block">• ISO 9001 Temel Eğitimi</span>}
                            </div>
                            <div>
                              <strong className="block text-slate-900">Teknik Yetkinlikler:</strong>
                              {activePers.competencies.map((c, i) => <span key={i} className="block">• {c}</span>)}
                              {activePers.competencies.length === 0 && <span className="block">• Süreç Kontrol Yeteneği</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Signatures footer */}
                    <div className="border-t border-slate-300 pt-4 grid grid-cols-2 text-[8px] text-slate-500 font-sans mt-8">
                      <div>
                        <span className="block font-bold text-slate-900">HAZIRLAYAN (Personel):</span>
                        <span className="block mt-1 font-semibold text-slate-900">{activePers.name}</span>
                        <span className="block">İmza / Tarih</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-slate-900">ONAYLAYAN (IK / Genel Müdür):</span>
                        <span className="block mt-1 font-semibold text-slate-900">{companyInfo.name} Kalite Birimi</span>
                        <span className="block">İmza / Kaşe</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Gösterilecek personel verisi yok.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
