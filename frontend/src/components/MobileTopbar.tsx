'use client';

import Link from 'next/link';
import { Bell, Menu } from 'lucide-react';

export default function MobileTopbar() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 md:hidden"
      style={{ padding: '18px 20px' }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          height: 56,
          borderRadius: 16,
          paddingLeft: 12,
          paddingRight: 16,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <Link href="/assignments" className="flex items-center" style={{ gap: 8 }}>
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #E56820 0%, #D45E3E 100%)',
            }}
          >
            <svg width="14" height="16" viewBox="0 0 20 22" fill="none">
              <path d="M3 3L10 19L17 3" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-bricolage, inherit)',
              fontWeight: 700,
              fontSize: 16,
              color: '#181818',
              letterSpacing: '-0.04em',
            }}
          >
            VedaAI
          </span>
        </Link>

        {/* Right: bell + avatar + hamburger */}
        <div className="flex items-center" style={{ gap: 0 }}>
          {/* Bell */}
          <button className="relative w-10 h-10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#303030]" strokeWidth={2} />
            <span
              className="absolute rounded-full bg-[#FF5623]"
              style={{ width: 7, height: 7, top: 10, right: 10 }}
            />
          </button>

          {/* Avatar */}
          <button className="w-10 h-10 flex items-center justify-center">
            <img
              src="https://ui-avatars.com/api/?name=John+Doe&background=F6F6F6&color=303030&size=32&bold=true"
              alt="John Doe"
              className="rounded-full object-cover"
              style={{ width: 28, height: 28 }}
            />
          </button>

          {/* Hamburger */}
          <button className="w-10 h-10 flex items-center justify-center">
            <Menu className="w-5 h-5 text-[#303030]" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
