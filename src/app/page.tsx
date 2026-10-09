'use client';

import React, { useState, useEffect } from 'react';
import { useQms } from '@/context/QmsContext';
import Wizard from '@/components/Wizard';
import Dashboard from '@/components/Dashboard';
import DocumentViewer from '@/components/DocumentViewer';
import GraphEngine from '@/components/GraphEngine';
import PersonnelModule from '@/components/PersonnelModule';
import MachineModule from '@/components/MachineModule';
import CalibrationModule from '@/components/CalibrationModule';
import TestModule from '@/components/TestModule';
import RiskModule from '@/components/RiskModule';
import SupplierModule from '@/components/SupplierModule';
import AuditCapaModule from '@/components/AuditCapaModule';
import AiEngine from '@/components/AiEngine';
import ProductionModule from '@/components/ProductionModule';
import TraceabilityModule from '@/components/TraceabilityModule';
import SalesModule from '@/components/SalesModule';
import LoginModal from '@/components/LoginModal';
import { 
  Building, LayoutDashboard, FileText, Network, Users, Settings, Activity, ShieldAlert, 
  Anchor, Search, RotateCcw, AlertTriangle, Eye, ShieldCheck, UserCheck, ClipboardList, Menu, ChevronLeft, ChevronRight, Laptop, X, Download, HelpCircle, CheckCircle2, LogOut,
  ShoppingCart, Briefcase, Plus, RefreshCw
} from 'lucide-react';

function UpcomingAlertTicker({ orders, setActiveTab, setOrderSearchQuery }: { orders: any[]; setActiveTab: (t: string) => void; setOrderSearchQuery: (q: string) => void }) {
  return null;
}

export default function Home() {
  const { 
    companySetupDone, companyInfo, resetAll, clearTransactionData, currentUser, login, logout, orders, 
    activeCategoryTab, setActiveCategoryTab, showCreateOrderWizard, setShowCreateOrderWizard,
    orderSearchQuery, setOrderSearchQuery, forceSyncCloud
  } = useQms();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // 1. Initial tab: Read from URL hash first, then localStorage, defaulting to 'orders'
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) return hash;
      const saved = localStorage.getItem('qms_active_tab');
      if (saved) return saved;
    }
    return 'orders';
  });

  // 2. Synchronize active tab with URL hash and localStorage whenever activeTab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qms_active_tab', activeTab);
      if (window.location.hash.replace('#', '') !== activeTab) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    }
  }, [activeTab]);

  // Listen for browser back/forward or manual hash updates in URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // PWA Deferred Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (const reg of registrations) {
            reg.unregister();
          }
        }).catch(() => null);
      }
      if ('caches' in window) {
        caches.keys().then(names => {
          for (const name of names) {
            caches.delete(name);
          }
        }).catch(() => null);
      }
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      setShowInstallGuideModal(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsAppInstalled(true);
    }
  };

  const [userRole, setUserRole] = useState<string>('Kalite Temsilcisi');
  const [auditMode, setAuditMode] = useState<boolean>(false);
  const [documentPreloadId, setDocumentPreloadId] = useState<string>('QM-001');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Sidebar Menu Items - Orders and Quotes are completely separate sidebar modules!
  const menuItems = [
    { id: 'orders', label: '1. Müşteri Sipariş Takip & Sevk', icon: ShoppingCart, highlight: true },
    { id: 'quotes', label: '2. Fiyat Teklifleri (FR-013)', icon: Briefcase },
    { id: 'dashboard', label: 'Panel (Kontrol Odası)', icon: LayoutDashboard },
    { id: 'document', label: 'Doküman Yönetimi', icon: FileText },
    { id: 'graph', label: 'Wikipedia İlişki Grafiği', icon: Network },
    { id: 'personnel', label: 'Personel Yetkinlik', icon: Users },
    { id: 'machines', label: 'Makine & Önleyici Bakım', icon: Settings },
    { id: 'calibration', label: 'Cihaz & Kalibrasyon', icon: Activity },
    { id: 'test', label: 'TS EN 61537 Test Raporları', icon: ShieldCheck },
    { id: 'risk', label: 'Risk ve Fırsat Analizi', icon: ShieldAlert },
    { id: 'suppliers', label: 'Tedarikçi Değerlendirme', icon: Anchor },
    { id: 'capa', label: 'İç Tetkik & DÖF', icon: AlertTriangle },
    { id: 'traceability', label: 'İzlenebilirlik Arama (Soy Ağacı)', icon: Search },
    { id: 'ai', label: 'Yapay Zeka Taraması', icon: UserCheck }
  ];

  // Helper to open document from the Graph engine or others
  const handleOpenDocFromModule = (docId: string) => {
    setDocumentPreloadId(docId);
    setActiveTab('document');
  };

  // If company setup is not done, force the Wizard
  if (!companySetupDone) {
    return <Wizard />;
  }

  // If not logged in or login requested, render LoginModal
  if (!currentUser || showLoginModal) {
    return (
      <LoginModal 
        onLoginSuccess={(user) => {
          login(user.username, '123456');
          setShowLoginModal(false);
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      
      {/* PWA INSTALLATION VISUAL GUIDE MODAL */}
      {showInstallGuideModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setShowInstallGuideModal(false)}
              className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/30">
                <Laptop className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">MASAÜSTÜ UYGULAMASI OLARAK KURMA REHBERİ</h3>
                <p className="text-xs text-slate-500">Tarayıcınızın sağ üst köşesinden 5 saniyede masaüstünüze kurabilirsiniz</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-800 leading-relaxed font-sans">
              <div className="font-extrabold text-orange-600 uppercase text-[11px] tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> MICROSOFT EDGE / CHROME / BRAVE İÇİN ADIMLAR:
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="bg-slate-900 text-white font-mono font-black h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                <div>
                  <strong className="text-slate-900 font-extrabold block">En Sağ Üstteki Üç Noktaya (...) Tıklayın</strong>
                  <span className="text-slate-600">Ekranın sağ üst köşesinde ("Sohbet et" butonunun hemen yanında) bulunan <strong>üç nokta (...)</strong> menü simgesine basın.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="bg-slate-900 text-white font-mono font-black h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                <div>
                  <strong className="text-slate-900 font-extrabold block">"Uygulamalar" (Apps) Menüsüne Gelin</strong>
                  <span className="text-slate-600">Açılan listede <strong>"Uygulamalar"</strong> (*veya "Diğer Araçlar"*) sekmesini bulun.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="bg-slate-900 text-white font-mono font-black h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
                <div>
                  <strong className="text-slate-900 font-extrabold block">"Bu siteyi bir uygulama olarak yükle" Butonuna Basın</strong>
                  <span className="text-slate-600">Çıkan onay kutusunda <strong>Yükle (Install)</strong> butonuna bastığınız an SIES QMS masaüstünüze ayrı bir program olarak yüklenecektir!</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInstallGuideModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase shadow-md transition-all"
              >
                ANLADIM, TEŞEKKÜRLER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-4/5 max-w-xs bg-white h-full flex flex-col justify-between shadow-2xl p-4 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                <img src="sies_logo.png" alt="SIES Logo" className="h-8 object-contain" />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">MENÜ SEÇENEKLERİ</div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                        if (item.id === 'document') setDocumentPreloadId('QM-001');
                      }}
                      className={`w-full rounded-lg text-xs transition-all flex items-center gap-3 px-3 py-2.5 border ${
                        isActive 
                          ? 'bg-orange-500 text-white border-orange-600 font-semibold shadow-md' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Footer App Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              {!isAppInstalled && (
                <button
                  onClick={handleInstallPwa}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" /> UYGULAMAYI TELEFONA / MASAÜSTÜNE KUR
                </button>
              )}
              <div className="text-[10px] text-slate-400 text-center font-mono">
                SIES QMS ERP v2026.06.23
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className={`border-r border-slate-200 bg-white flex flex-col justify-between hidden md:flex shrink-0 transition-all duration-300 print:hidden ${
        isSidebarExpanded ? 'w-64' : 'w-16'
      }`}>
        <div>
          {/* Header Info & Collapse Toggle */}
          <div className={`p-4 border-b border-slate-200 flex items-center justify-between gap-2 ${
            !isSidebarExpanded ? 'flex-col justify-center' : ''
          }`}>
            {isSidebarExpanded ? (
              <img src="sies_logo.png" alt="SIES Logo" className="h-10 object-contain" />
            ) : (
              <img src="sies_logo.png" alt="SIES Logo" className="h-6 object-contain" />
            )}
            <button 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title={isSidebarExpanded ? "Menüyü Daralt" : "Menüyü Genişlet"}
            >
              {isSidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === 'document') {
                        setDocumentPreloadId('QM-001');
                      }
                    }}
                    className={`w-full rounded-lg text-xs transition-all flex items-center border ${
                      isSidebarExpanded 
                        ? 'px-3 py-2.5 gap-2.5 justify-start' 
                        : 'p-2.5 justify-center'
                    } ${
                      isActive 
                        ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs' 
                        : item.highlight 
                        ? 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200 font-medium'
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-slate-900 font-bold' : 'text-slate-400'}`} />
                    {isSidebarExpanded && <span>{item.label}</span>}
                  </button>
                  
                  {/* Collapsed Sidebar Hover Tooltip */}
                  {!isSidebarExpanded && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-slate-950 text-white text-[10px] font-bold rounded-md shadow-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 pointer-events-none z-50 whitespace-nowrap border border-slate-800">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Reset System panel */}
        <div className="p-3 border-t border-slate-200 space-y-2">
          <button 
            onClick={() => {
              if (confirm('Tüm sipariş, teklif, irsaliye, üretim formları ve proses kartı verilerini temizlemek istiyor musunuz?\n\n(Şirket ayarları, personeller, makineler ve ISO dokümanları KORUNACAKTIR)')) {
                if (confirm('Emin misiniz? Bu işlem geri alınamaz!')) {
                  clearTransactionData();
                  alert('Tüm işlem verileri başarıyla temizlendi.');
                }
              }
            }}
            className={`w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded py-2 text-[10px] font-mono tracking-wider transition-colors flex items-center justify-center gap-1 ${
              !isSidebarExpanded ? 'px-0' : ''
            }`}
            title="İşlem Verilerini Temizle"
          >
            <RotateCcw className="h-3 w-3 shrink-0 text-orange-500" /> 
            {isSidebarExpanded && <span>İŞLEM VERİLERİNİ TEMİZLE</span>}
          </button>

          <button 
            onClick={() => {
              if (confirm('Tüm sistemi sıfırlamak ve Kurulum Sihirbazına geri dönmek istediğinizden emin misiniz?')) {
                resetAll();
              }
            }}
            className={`w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded py-2 text-[10px] font-mono tracking-wider transition-colors flex items-center justify-center gap-1 ${
              !isSidebarExpanded ? 'px-0' : ''
            }`}
            title="Sistemi Sıfırla"
          >
            <RotateCcw className="h-3 w-3 shrink-0 text-red-500" /> 
            {isSidebarExpanded && <span>TÜMÜNÜ SIFIRLA</span>}
          </button>
          
          {isSidebarExpanded && (
            <div className="text-[9px] text-slate-400 text-center font-mono pt-1">
              V.2026.06.23
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP STATUS BAR */}
        <header className="h-10 border-b border-slate-200 bg-white px-3 flex items-center justify-between gap-2 shrink-0 print:hidden">
          
          {/* Mobile menu hamburger toggle + Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <img src="sies_logo.png" alt="SIES Logo" className="h-7 object-contain md:hidden" />
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          </div>

          {/* Left-Aligned Wide Red Pulsing Alert Ticker */}
          <div className="flex-1 min-w-0 flex items-center">
            <UpcomingAlertTicker orders={orders} setActiveTab={setActiveTab} setOrderSearchQuery={setOrderSearchQuery} />
          </div>

          {/* Right Controls: User Profile, New Order & Auditor Mode */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Yandex Disk Direct Drive Link Button */}
            <a
              href="https://disk.yandex.com.tr/d/1322d_cn4bYRaA"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider transition-all flex items-center gap-1 shrink-0 shadow-2xs h-7"
              title="Yandex Disk Sınırsız Doküman ve Sertifika Arşivi"
            >
              <span className="text-sm">☁️</span> <span className="hidden sm:inline font-black">YANDEX DİSK</span>
            </a>

            {/* CANLI BULUT HAVUZUNU YENİLE Button */}
            <button
              onClick={async () => {
                setIsSyncing(true);
                setOrderSearchQuery('');
                setActiveCategoryTab('TÜMÜ');
                await forceSyncCloud();
                setIsSyncing(false);
              }}
              disabled={isSyncing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 px-2.5 py-1 rounded-lg text-[11px] font-mono font-black tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-sm h-8 cursor-pointer"
              title="Yandex Disk Canlı Bulut Havuzunu Anında Yenile ve Tüm Siparişleri Göster"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'YENİLENİYOR...' : `BULUTU YENİLE (${(orders || []).length} SİPARİŞ)`}</span>
            </button>

            {/* + YENİ SİPARİŞ GİRİŞİ Button in Top Header Navbar */}
            <button 
              onClick={() => {
                setShowCreateOrderWizard(true);
                if (activeTab !== 'orders') setActiveTab('orders');
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-2.5 py-1 rounded-md text-[11px] shadow-2xs transition-all flex items-center justify-center gap-1 border border-slate-800 shrink-0 whitespace-nowrap h-7"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> YENİ SİPARİŞ GİRİŞİ
            </button>

            {/* Audit Mode Toggle */}
            <button
              onClick={() => setAuditMode(!auditMode)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider border transition-all flex items-center gap-1 h-7 ${
                auditMode 
                  ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
              title="Dış denetçiler için salt okunur yüksek güvenlik modu"
            >
              <Eye className="h-3.5 w-3.5" /> <span className="hidden xs:inline">{auditMode ? 'DENETİM MODU (AÇIK)' : 'DENETİM MODU'}</span>
            </button>

            {/* Active Logged-In User Badge */}
            {currentUser && (
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 rounded-xl px-2.5 py-1 transition-all cursor-pointer shadow-2xs"
                  title="Kullanıcı Değiştir"
                >
                  <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${currentUser.color} text-white font-black text-[10px] flex items-center justify-center font-mono shrink-0 shadow-2xs`}>
                    {currentUser.avatarInitials}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <span className="font-black text-xs text-slate-900 block truncate max-w-[110px]">{currentUser.name}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase font-mono block truncate max-w-[110px]">{currentUser.role}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setShowLoginModal(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Oturumu Kapat"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

        </header>

        {/* TAB WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 bg-slate-50 print:p-0 print:bg-white">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} auditMode={auditMode} />}
          {activeTab === 'document' && <DocumentViewer initialDocId={documentPreloadId} auditMode={auditMode} />}
          {activeTab === 'graph' && <GraphEngine onOpenDoc={handleOpenDocFromModule} />}
          {activeTab === 'personnel' && <PersonnelModule />}
          {activeTab === 'machines' && <MachineModule />}
          {activeTab === 'calibration' && <CalibrationModule />}
          {activeTab === 'test' && <TestModule />}
          {activeTab === 'risk' && <RiskModule />}
          {activeTab === 'suppliers' && <SupplierModule />}
          {activeTab === 'capa' && <AuditCapaModule />}

          {activeTab === 'orders' && <SalesModule initialSubTab="orders" auditMode={auditMode} />}
          {activeTab === 'quotes' && <SalesModule initialSubTab="quotes" auditMode={auditMode} />}
          {activeTab === 'sales' && <SalesModule initialSubTab="orders" auditMode={auditMode} />}
          {activeTab === 'production' && <ProductionModule />}
          {activeTab === 'traceability' && <TraceabilityModule />}
          {activeTab === 'ai' && <AiEngine />}
        </main>

      </div>

    </div>
  );
}
