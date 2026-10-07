'use client';

import React, { useState } from 'react';
import { User, SYSTEM_USERS } from '@/context/QmsContext';
import { Lock, UserCheck, ShieldCheck, ArrowRight, Building, CheckCircle2, KeyRound } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(SYSTEM_USERS[0]);
  const [password, setPassword] = useState<string>('123456');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPassword('123456'); // Pre-fill default demo password for smooth user experience
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg('Lütfen bir kullanıcı profili seçin.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Check credentials against system user list
    const found = SYSTEM_USERS.find(u => u.id === selectedUser.id);
    if (found && found.passwordHash === password) {
      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess(selectedUser);
      }, 400);
    } else {
      setTimeout(() => {
        setIsSubmitting(false);
        setErrorMsg('Girdiğiniz şifre hatalı. (Varsayılan şifre: 123456)');
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto">
        
        {/* LEFT SIDEBAR: BRANDING & SYSTEM INFO */}
        <div className="md:w-5/12 bg-gradient-to-br from-slate-900 via-slate-850 to-orange-950 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="space-y-6 relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-2xl shadow-lg shrink-0">
                <img src="/sies_logo.png" alt="SIES Logo" className="h-9 object-contain" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-orange-400 uppercase tracking-widest block">SIES ERP & QMS</span>
                <h2 className="text-sm font-black tracking-tight text-white uppercase">SİES ELEKTRİK A.Ş.</h2>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                Kurumsal Kalite & Sipariş Yönetim Sistemi
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                ISO 9001:2015 & TS EN 61537 Standartlarına tam uyumlu akıllı üretim, sipariş, sevk ve sertifikasyon platformu.
              </p>
            </div>

            <div className="space-y-2.5 pt-3 text-xs text-slate-300 font-sans border-t border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Çoklu Kullanıcı Yetkilendirme Güvenliği</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" />
                <span>Mobil & Masaüstü Cihazlarla Senkronize</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-amber-400 shrink-0" />
                <span>FR-009, FR-10 & 3.1 Muayene Sertifikası (FR-011)</span>
              </div>
            </div>
          </div>

          <div className="pt-6 relative z-10 border-t border-slate-800/80 mt-6 md:mt-0">
            <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>SÜRÜM v2026.09.26</span>
              <span className="text-emerald-400 font-bold">● ONLINE CANLI</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: USER LOGIN SELECTOR & FORM */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between bg-white space-y-6">
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">KULLANICI GİRİŞİ</h3>
                <p className="text-xs text-slate-500 font-medium">Lütfen profilinizi seçip şifrenizi giriniz</p>
              </div>
              <div className="p-2.5 bg-orange-50 border border-orange-200 text-orange-600 rounded-2xl">
                <Lock className="h-5 w-5" />
              </div>
            </div>

            {/* Quick User Selection Grid (5 Real Company Accounts) */}
            <div className="space-y-2 mb-5">
              <label className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                1. KULLANICI PROFİLİNİZİ SEÇİN:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYSTEM_USERS.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20 shadow-md scale-[1.01]' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${user.color} text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0 uppercase font-mono`}>
                        {user.avatarInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs text-slate-900 truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">{user.role}</div>
                      </div>
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-orange-600 shrink-0 animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedUser && (
                <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${selectedUser.color} text-white font-black text-xs flex items-center justify-center shrink-0 font-mono`}>
                      {selectedUser.avatarInitials}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-orange-400 block font-bold">SEÇİLEN HESAP</span>
                      <span className="text-xs font-black uppercase text-white">{selectedUser.name} ({selectedUser.role})</span>
                    </div>
                  </div>
                  <UserCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono font-black text-slate-600 uppercase tracking-wider block mb-1.5">
                  2. ŞİFRENİZİ GİRİN:
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifre (Varsayılan: 123456)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                    required
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  💡 Varsayılan test şifresi: <strong className="text-slate-700 font-bold">123456</strong>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-bold font-sans">
                  ⚠️ {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black py-3 px-4 rounded-xl text-xs uppercase shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-orange-400/40"
              >
                {isSubmitting ? (
                  <span>GİRİŞ YAPILIYOR...</span>
                ) : (
                  <>
                    <span>SİSTEME GİRİŞ YAP</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-[10px] text-slate-400 text-center font-mono pt-2 border-t border-slate-100">
            SİES ELEKTRİK MÜH. SAN. TİC. LTD. ŞTİ. © 2026
          </div>
        </div>

      </div>
    </div>
  );
}
