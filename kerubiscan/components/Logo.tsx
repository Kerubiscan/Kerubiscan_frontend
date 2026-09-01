import React from "react";
import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 relative shrink-0">
        <Image 
          src="/logo.svg" 
          alt="Kerubiscan Logo" 
          fill 
          className="object-contain"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-[19px] font-bold tracking-widest leading-none text-white">KERUBISCAN</span>
        <span className="text-[9px] text-text-muted mt-1 uppercase tracking-widest">Vulnerability Scanner</span>
      </div>
    </div>
  );
}
