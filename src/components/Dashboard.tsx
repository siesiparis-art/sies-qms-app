'use client';

import React, { useState } from 'react';
import { useQms } from '@/context/QmsContext';
import { 
  Activity, AlertTriangle, CheckCircle2, ShieldAlert, Award, FileSpreadsheet, FileWarning, 
  RotateCcw, ShieldCheck, ChevronRight, DollarSign, TrendingUp, ShoppingCart, Wrench, Clock, 
  UserCheck, FileText, Layers, Settings, Flame, Sliders, Calendar, Shield, HeartPulse, X
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  auditMode: boolean;
}

export default function Dashboard({ onNavigate, auditMode }: DashboardProps) {
  const { 
    companyInfo, capas, calibrationRecords, measuringDevices, machines, audits, 
    complaints, suppliers, risks, nonconformities, trainingRecords, quotes, orders, productionRuns, personnel
  } = useQms();

  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'quality' | 'factory'>('overview');

  // 1. Sales & Offer calculations
  const totalQuotes = quotes.length;
  const approvedQuotes = quotes.filter(q => q.status === 'Onaylandı').length;
  const draftQuotes = quotes.filter(q => q.status === 'Teklif Hazırlandı').length;
  const totalQuoteAmount = quotes.reduce((acc, q) => acc + (q.totalAmount || 0), 0);
  const approvedQuoteAmount = quotes.filter(q => q.status === 'Onaylandı').reduce((acc, q) => acc + (q.totalAmount || 0), 0);

  // 2. Order & Production calculations
  const totalOrders = orders.length;
  const activeOrdersCount = orders.filter(o => o.status !== 'SEVK EDİLDİ').length;
  const shippedOrdersCount = orders.filter(o => o.status === 'SEVK EDİLDİ').length;
  const activeRunsCount = productionRuns.filter(r => r.status !== 'Tamamlandı').length;

  // 3. Calibration Status
  const totalDevices = measuringDevices.length;
  const calibratedDevices = measuringDevices.filter(d => d.status === 'Kalibre').length;
  const expiredCalibrations = measuringDevices.filter(d => d.status === 'Süresi Geçmiş' || new Date(d.nextCalibrationDate) < new Date()).length;
  const outOfServiceDevices = measuringDevices.filter(d => d.status === 'Kullanım Dışı').length;

  // 4. Machine Status
  const totalMachines = machines.length;
  const operatingMachines = machines.filter(m => m.status === 'Çalışıyor').length;
  const inMaintenanceMachines = machines.filter(m => m.status === 'Bakımda').length;
  const brokenMachines = machines.filter(m => m.status === 'Arızalı').length;
  const overdueMaintenance = machines.filter(m => {
    const nextMaint = new Date(m.nextMaintenanceDate);
    return nextMaint < new Date() && m.status !== 'Bakımda';
  }).length;

  // 5. CAPA & Complaints
  const totalCapas = capas.length;
  const openCapas = capas.filter(c => c.status !== 'Kapalı').length;
  const inActionCapas = capas.filter(c => c.status === 'Doğrulama Bekliyor').length;
  const closedCapas = capas.filter(c => c.status === 'Kapalı').length;

  const totalComplaints = complaints.length;
  const openComplaints = complaints.filter(c => c.status !== 'Çözüldü').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'Çözüldü').length;

  // 6. Risks & Compliance
  const highRisks = risks.filter(r => r.type === 'Risk' && r.score >= 12).length;
  const openNonconformities = nonconformities.filter(n => n.status === 'Açık').length;

  // 7. Compliance Score calculation
  const complianceScore = Math.max(
    50, 
    100 - (openCapas * 4) - (expiredCalibrations * 6) - (overdueMaintenance * 5) - (openNonconformities * 3) - (openComplaints * 3)
  );

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Top Header & Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-semibold text-[#1f4e5b] uppercase tracking-widest">SIES ELEKTRİK ERP & KALİTE YÖNETİM SİSTEMİ</span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">Fabrika Uygunluk Kontrol Paneli</h1>
          <p className="text-sm text-slate-500 mt-1">
            {auditMode 
              ? '🔒 DIŞ DENETÇİ MODU AKTİF - Tüm onaylı prosedürler, talimatlar, test raporları ve izlenebilirlik kayıtları doğrulanabilir durumda.' 
              : 'ISO 9001:2015 & TS EN 61537 Standartları kapsamında entegre fabrika operasyon ve kalite takip arayüzü.'}
          </p>
        </div>
        
        {/* Compliance Gauge */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="relative flex items-center justify-center h-14 w-14">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="24" fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
              <circle 
                cx="28" 
                cy="28" 
                r="24" 
                fill="transparent" 
                stroke={complianceScore > 85 ? '#1f4e5b' : complianceScore > 70 ? '#d97706' : '#dc2626'} 
                strokeWidth="5" 
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - complianceScore / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className="text-xs font-black text-slate-800">{complianceScore}%</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">FABRİKA UYGUNLUK SKORU</span>
            <span className="text-sm font-bold text-[#1f4e5b] block">
              {complianceScore > 85 ? 'Kusursuz Entegrasyon' : complianceScore > 70 ? 'Risk Altında' : 'Kritik Seviye'}
            </span>
            <span className="text-[10px] text-slate-400 italic">DÖF, Kalibrasyon ve Bakım uyum oranı</span>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 print:hidden bg-slate-100 p-1.5 rounded-xl">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'overview' ? 'bg-[#1f4e5b] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Layers className="h-4 w-4" /> Genel Özet
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'sales' ? 'bg-[#1f4e5b] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <ShoppingCart className="h-4 w-4" /> Satış & Sipariş Takibi ({totalQuotes + totalOrders})
        </button>
        <button 
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'quality' ? 'bg-[#1f4e5b] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <ShieldCheck className="h-4 w-4" /> Kalite & DÖF ({openCapas + openComplaints})
        </button>
        <button 
          onClick={() => setActiveTab('factory')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'factory' ? 'bg-[#1f4e5b] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Wrench className="h-4 w-4" /> Fabrika & Ekipman Sağlığı ({expiredCalibrations + overdueMaintenance})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Sales Financial Overview */}
            <div 
              onClick={() => setActiveTab('sales')}
              className="group cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-[#1f4e5b]/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ONAYLI TEKLİF HACMİ</span>
                <div className="bg-[#1f4e5b]/10 p-1.5 rounded-lg text-[#1f4e5b] group-hover:scale-110 transition-transform">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900">
                  {approvedQuoteAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Toplam {approvedQuotes} Sipariş Onaylı</span>
                  <span className="text-[#1f4e5b] font-semibold flex items-center gap-0.5">Detay <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>
            </div>

            {/* Card 2: Shop Floor Status */}
            <div 
              onClick={() => onNavigate('sales')}
              className="group cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-amber-400/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İMALATTAKİ İŞLER</span>
                <div className="bg-amber-500/10 p-1.5 rounded-lg text-amber-600 group-hover:scale-110 transition-transform">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900">{activeRunsCount} Aktif Kalem</div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>{activeOrdersCount} Sipariş Sevk Bekliyor</span>
                  <span className="text-amber-600 font-semibold flex items-center gap-0.5">Üretim Hattı <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>
            </div>

            {/* Card 3: Metrology Calibration Status */}
            <div 
              onClick={() => setActiveTab('factory')}
              className="group cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-red-400/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KALİBRASYON SAĞLIĞI</span>
                <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${expiredCalibrations > 0 ? 'bg-red-500/10 text-red-600 animate-pulse' : 'bg-green-500/10 text-green-600'}`}>
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900">
                  {expiredCalibrations > 0 ? `${expiredCalibrations} Gecikmiş Cihaz` : 'Tüm Cihazlar Kalibre'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>Toplam {totalDevices} Ölçüm Cihazı</span>
                  <span className="text-red-500 font-semibold flex items-center gap-0.5">Cihazlar <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>
            </div>

            {/* Card 4: Quality & CAPA */}
            <div 
              onClick={() => setActiveTab('quality')}
              className="group cursor-pointer bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-red-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DÖF VE UYGUNSUZLUK</span>
                <div className="bg-red-500/10 p-1.5 rounded-lg text-red-500 group-hover:scale-110 transition-transform">
                  <FileWarning className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900">{openCapas} Açık DÖF Kartı</div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>{openNonconformities} Parça Uygunsuzluğu</span>
                  <span className="text-red-500 font-semibold flex items-center gap-0.5">Kalite Paneli <ChevronRight className="h-3 w-3" /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Split Detail Panels: Live Order Execution & Notification Alarms */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Order Production Pipeline */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1f4e5b] uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-[#1f4e5b]" /> Sipariş Kalemlerinin Güncel Durum ve İmalat Aşamaları
                  </h3>
                  <p className="text-xs text-slate-400">Üretimdeki siparişlerin anlık proses aşamaları ve sevk bilgileri</p>
                </div>
                <button 
                  onClick={() => onNavigate('sales')}
                  className="text-xs font-bold text-[#1f4e5b] hover:underline"
                >
                  Sipariş Yönetimi →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50 text-[10px] uppercase">
                      <th className="p-2.5">Sipariş / Müşteri</th>
                      <th className="p-2.5">Ürün Kodu</th>
                      <th className="p-2.5">Miktar</th>
                      <th className="p-2.5">Sevk</th>
                      <th className="p-2.5 text-center">Durum / Proses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(o => o.status !== 'SEVK EDİLDİ').slice(0, 5).map((order) => (
                      <React.Fragment key={order.id}>
                        {order.items.map((item, itemIdx) => {
                          const shippedPct = item.shippedQuantity ? Math.round((item.shippedQuantity / item.quantity) * 100) : 0;
                          
                          let statusColor = 'bg-slate-100 text-slate-600';
                          if (item.status === 'Sevk Edildi') statusColor = 'bg-green-100 text-green-700 font-bold';
                          else if (item.status === 'Üretimde') statusColor = 'bg-blue-100 text-blue-700 font-bold';
                          else if (item.status === 'Kaplamada') statusColor = 'bg-orange-100 text-orange-700 font-bold';
                          else if (item.status === 'Boyada') statusColor = 'bg-purple-100 text-purple-700 font-bold';
                          else if (item.status === 'Paketlemede') statusColor = 'bg-pink-100 text-pink-700 font-bold';

                          return (
                            <tr key={`${order.id}-${item.productCode}-${itemIdx}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <td className="p-2.5">
                                {itemIdx === 0 && (
                                  <div>
                                    <span className="font-bold text-slate-900 block">{order.customerName}</span>
                                    <span className="text-[10px] text-slate-500 font-mono font-bold">{order.id}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-[#1f4e5b]">{item.productCode}</td>
                              <td className="p-2.5 font-mono">{item.quantity} M</td>
                              <td className="p-2.5 font-mono">
                                <div>
                                  <span className="font-bold">{item.shippedQuantity || 0} M</span>
                                  <span className="text-[9px] text-slate-400 block">%{shippedPct} Sevk</span>
                                </div>
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider inline-block ${statusColor}`}>
                                  {item.status || 'Bekliyor'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                    {orders.filter(o => o.status !== 'SEVK EDİLDİ').length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          Aktif imalat veya sevk bekleyen sipariş bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Critical Notification center */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0" /> Kritik Alarm & Uyarı Paneli
                </h3>
                <div className="space-y-4">
                  
                  {expiredCalibrations > 0 && (
                    <div className="flex gap-2.5 items-start border-l-3 border-red-500 pl-3 py-1 bg-red-50/40 rounded-r-lg pr-2">
                      <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Kalibrasyon Tarihi Geçti!</span>
                        <span className="text-[10px] text-slate-600 block mt-0.5">
                          {expiredCalibrations} adet ölçüm kumpası/cihazının akredite kalibrasyon tarihi geçmiştir.
                        </span>
                        <button 
                          onClick={() => setActiveTab('factory')}
                          className="text-[10px] font-bold text-red-700 hover:underline mt-1 block"
                        >
                          Cihazları Listele →
                        </button>
                      </div>
                    </div>
                  )}

                  {overdueMaintenance > 0 && (
                    <div className="flex gap-2.5 items-start border-l-3 border-yellow-500 pl-3 py-1 bg-yellow-50/40 rounded-r-lg pr-2">
                      <AlertTriangle className="h-4.5 w-4.5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Makine Periyodik Bakım Aşımı</span>
                        <span className="text-[10px] text-slate-600 block mt-0.5">
                          {overdueMaintenance} adet makine ünitesinin periyodik bakım tarihi aşılmıştır.
                        </span>
                        <button 
                          onClick={() => setActiveTab('factory')}
                          className="text-[10px] font-bold text-yellow-700 hover:underline mt-1 block"
                        >
                          Makineleri Gözden Geçir →
                        </button>
                      </div>
                    </div>
                  )}

                  {openComplaints > 0 && (
                    <div className="flex gap-2.5 items-start border-l-3 border-orange-500 pl-3 py-1 bg-orange-50/40 rounded-r-lg pr-2">
                      <FileWarning className="h-4.5 w-4.5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Çözülmemiş Müşteri Şikayeti</span>
                        <span className="text-[10px] text-slate-600 block mt-0.5">
                          {openComplaints} adet müşteri şikayeti açık durumda yanıt bekliyor.
                        </span>
                        <button 
                          onClick={() => setActiveTab('quality')}
                          className="text-[10px] font-bold text-orange-700 hover:underline mt-1 block"
                        >
                          Şikayetleri Görüntüle →
                        </button>
                      </div>
                    </div>
                  )}

                  {expiredCalibrations === 0 && overdueMaintenance === 0 && openComplaints === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center">
                      <ShieldCheck className="h-14 w-14 text-green-500/20 mb-2" />
                      <span className="text-xs font-bold text-slate-800">Fabrika %100 Uyumlu</span>
                      <span className="text-[10px] text-slate-500 mt-1">Aktif gecikmiş kalibrasyon veya kritik bakım uyarısı bulunmamaktadır.</span>
                    </div>
                  )}

                </div>
              </div>

              <button 
                onClick={() => onNavigate('ai')}
                className="w-full mt-6 bg-[#1f4e5b]/10 hover:bg-[#1f4e5b]/20 text-[#1f4e5b] border border-[#1f4e5b]/20 rounded-lg py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Activity className="h-3.5 w-3.5" /> AI Sürekli Kalite Taramasını Başlat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES & ORDERS */}
      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Orders List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1f4e5b] uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" /> Siparişlerin Güncel Sevkiyat ve İmalat İzleme Tablosu
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50 uppercase text-[9px]">
                    <th className="p-2.5">Sipariş ID</th>
                    <th className="p-2.5">Müşteri</th>
                    <th className="p-2.5">Teklif Kodu</th>
                    <th className="p-2.5">Sipariş Tarihi</th>
                    <th className="p-2.5 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{o.id}</td>
                      <td className="p-2.5 font-bold">{o.customerName}</td>
                      <td className="p-2.5 font-mono text-slate-500">{o.quoteId}</td>
                      <td className="p-2.5 text-slate-500">{o.date}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          o.status === 'SEVK EDİLDİ' 
                            ? 'bg-green-100 text-green-700' 
                            : o.status === 'KISMİ SEVK EDİLDİ' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-orange-100 text-orange-700 animate-pulse'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quotes Analysis */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1f4e5b] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Satış & Teklif Hunisi
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <span className="text-[10px] text-slate-400 font-bold block">TOPLAM TEKLİF</span>
                <span className="text-2xl font-black text-slate-800">{totalQuotes} Adet</span>
              </div>
              <div className="bg-[#1f4e5b]/10 border border-[#1f4e5b]/20 rounded-lg p-3 text-center">
                <span className="text-[10px] text-[#1f4e5b] font-bold block">ONAYLANAN</span>
                <span className="text-2xl font-black text-[#1f4e5b]">{approvedQuotes} Adet</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Son Hazırlanan Teklifler</span>
              <div className="space-y-2">
                {quotes.slice(-3).reverse().map((q) => (
                  <div key={q.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded border border-slate-150">
                    <div>
                      <span className="font-mono font-bold text-slate-800 block">{q.id}</span>
                      <span className="text-[9px] text-slate-500 font-semibold">{q.customerName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#1f4e5b] block">{(q.totalAmount || 0).toLocaleString('tr-TR')} ₺</span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        q.status === 'Onaylandı' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>{q.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUALITY & CAPA */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CAPA (DÖF) List */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#1f4e5b] uppercase tracking-wider flex items-center gap-1.5">
                <FileWarning className="h-4 w-4" /> Düzeltici Önleyici Faaliyetler (DÖF / CAPA) Defteri
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50 uppercase text-[9px]">
                      <th className="p-2.5 w-24">Faaliyet ID</th>
                      <th className="p-2.5">Başlık / Açıklama</th>
                      <th className="p-2.5 w-24">Tespit Tarihi</th>
                      <th className="p-2.5 w-24">Sorumlu</th>
                      <th className="p-2.5 text-center w-24">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capas.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-red-600">{c.id}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-900 block">{c.title}</span>
                          <span className="text-[10px] text-slate-500 block leading-normal line-clamp-1">{c.description}</span>
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono">{c.detectedDate}</td>
                        <td className="p-2.5 text-slate-500 font-semibold">{c.assignedTo}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'Kapalı' 
                              ? 'bg-green-100 text-green-700' 
                              : c.status === 'Doğrulama Bekliyor' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-red-100 text-red-700 animate-pulse'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Complaints list */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#1f4e5b] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-red-500" /> Müşteri Şikayet Takibi
              </h3>
              
              <div className="space-y-3">
                {complaints.map((comp) => (
                  <div key={comp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between hover:bg-slate-100/50 transition-colors">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>{comp.customerName}</span>
                      <span className="font-mono">{comp.id}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 mt-1 block leading-normal">{comp.details}</span>
                    <div className="flex justify-between items-center mt-3 border-t border-slate-200/60 pt-2 text-[9px] font-bold">
                      <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        comp.status === 'Çözüldü' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'
                      }`}>{comp.status}</span>
                      <span className="text-slate-500">{comp.complaintDate}</span>
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <div className="text-center py-6 text-slate-400 italic">
                    Kayıtlı müşteri şikayeti bulunamadı.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Risk Matrix */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm max-w-2xl">
            <h3 className="text-sm font-bold text-[#1f4e5b] uppercase tracking-wider mb-2">Kurumsal Risk Dağılım Matrisi</h3>
            <p className="text-xs text-slate-400 mb-4">ISO 9001:2015 Risk tabanlı düşünme kapsamındaki olasılık ve şiddet katsayıları matrisi</p>
            
            <div className="grid grid-cols-5 gap-2 max-w-md mx-auto aspect-square border border-slate-200 p-2 bg-slate-50 rounded">
              {Array.from({ length: 25 }).map((_, i) => {
                const x = (i % 5) + 1; // Probability
                const y = 5 - Math.floor(i / 5); // Severity
                const score = x * y;
                
                const isHigh = score >= 12;
                const isMedium = score >= 6 && score < 12;
                const bgClass = isHigh 
                  ? 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700' 
                  : isMedium 
                    ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700' 
                    : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700';
                
                const matchingRisksCount = risks.filter(r => r.type === 'Risk' && r.probability === x && r.severity === y).length;

                return (
                  <div 
                    key={i} 
                    title={`Olasılık: ${x}, Şiddet: ${y}, Skor: ${score}`}
                    className={`flex items-center justify-center border text-[9px] font-bold rounded transition-colors relative cursor-help ${bgClass}`}
                  >
                    {matchingRisksCount > 0 ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white font-extrabold text-[10px] shadow-md animate-pulse">
                        {matchingRisksCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">{score}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between text-[10px] text-slate-400 px-4">
              <span>← Düşük Olasılık (1)</span>
              <span>Yüksek Olasılık (5) →</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FACTORY & METROLOGY */}
      {activeTab === 'factory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Machines Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1f4e5b] uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-[#1f4e5b]" /> Üretim Makine ve Ekipman Bakım İzleme Listesi
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold bg-slate-50 uppercase text-[9px]">
                    <th className="p-2.5">Makine Kodu / Adı</th>
                    <th className="p-2.5">Seri No</th>
                    <th className="p-2.5">Son Bakım</th>
                    <th className="p-2.5">Sonraki Bakım</th>
                    <th className="p-2.5 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((m) => {
                    let statusColor = 'bg-green-100 text-green-700';
                    if (m.status === 'Bakımda') statusColor = 'bg-yellow-100 text-yellow-700 animate-pulse';
                    else if (m.status === 'Arızalı') statusColor = 'bg-red-100 text-red-700 font-bold';

                    return (
                      <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="p-2.5">
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{m.manufacturer} / {m.model}</span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-500">{m.serialNumber}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{m.lastMaintenanceDate}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{m.nextMaintenanceDate}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Measuring Devices / Metrology Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1f4e5b] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4" /> Ölçüm & Kalibrasyon Cihazları
            </h3>
            
            <div className="space-y-3">
              {measuringDevices.map((d) => {
                const nextCalDate = new Date(d.nextCalibrationDate);
                const isOverdue = nextCalDate < new Date();

                return (
                  <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col hover:bg-slate-100/50 transition-colors">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span className="font-mono text-slate-900 font-bold">{d.id}</span>
                      <span>Sertifika: {d.certificateNumber}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 mt-1 block">{d.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5">S/N: {d.serialNumber}</span>
                    
                    <div className="flex justify-between items-center mt-3 border-t border-slate-200/60 pt-2 text-[9px] font-bold">
                      <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isOverdue 
                          ? 'bg-red-100 text-red-700 animate-pulse' 
                          : d.status === 'Kalibre' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isOverdue ? 'Süresi Geçmiş' : d.status}
                      </span>
                      <span className="text-slate-500 font-mono">Sonraki: {d.nextCalibrationDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
