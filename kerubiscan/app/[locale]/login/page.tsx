"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("Login");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base text-text-main relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-status-info/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-md p-8 bg-surface/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30 shadow-inner">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">KerubiScan</h1>
        <p className="text-text-muted mb-8 text-sm">
          Enterprise Vulnerability Management System
        </p>

        <button 
          onClick={() => signIn("keycloak", { callbackUrl: "/" })}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Sign In with SSO
        </button>

        <p className="mt-8 text-xs text-text-muted/60">
          Secure authentication provided by Keycloak Identity Provider
        </p>
      </div>
    </div>
  );
}
