'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  showBack?: boolean;
}

export default function Topbar({ title, showBack = false }: Props) {
  const router = useRouter();

  return (
    <div
      className="fixed z-20 flex items-center justify-between"
      style={{
        top: 12,
        left: 263,
        right: 12,
        height: 56,
        borderRadius: 16,
        paddingLeft: 24,
        paddingRight: 12,
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.08)',
      }}
    >
      {/* Left: back arrow + title */}
      <div className="flex items-center gap-[10px]">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 flex-shrink-0"
          >
            {/* Arrow Left icon — 18×15, stroke 2px, color #303030 */}
            <svg width="18" height="15" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7.5H1M1 7.5L7.5 1M1 7.5L7.5 14" stroke="#303030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        {/* Title — Bricolage Grotesque, 600, 16px, #A9A9A9 */}
        <span
          className="font-semibold"
          style={{ fontSize: 16, color: '#A9A9A9', letterSpacing: '-0.04em', lineHeight: '100%', fontFamily: 'var(--font-bricolage, inherit)' }}
        >
          {title}
        </span>
      </div>

      {/* Right: bell + John Doe */}
      <div className="flex items-center gap-[10px]">
        {/* Bell with orange dot */}
        <button className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
          {/* Bell SVG — 24×24 */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#303030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#303030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Orange notification dot — 8×8, #FF5623 */}
          <span
            className="absolute rounded-full"
            style={{ width: 8, height: 8, background: '#FF5623', top: 8, right: 8 }}
          />
        </button>

        {/* John Doe profile */}
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {/* Avatar — 32×32, radius 100px, bg #F6F6F6 */}
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{ width: 32, height: 32, borderRadius: 100, background: '#F6F6F6' }}
          >
            <img
              src="https://ui-avatars.com/api/?name=John+Doe&background=F6F6F6&color=303030&size=32&bold=true"
              alt="John Doe"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Name + chevron — gap 4px */}
          <div className="flex items-center gap-1">
            <span
              className="font-semibold"
              style={{ fontSize: 16, color: '#A9A9A9', letterSpacing: '-0.04em', lineHeight: '100%', fontFamily: 'var(--font-bricolage, inherit)' }}
            >
              John Doe
            </span>
            {/* Chevron down — 24×24 */}
            <ChevronDown className="text-[#A9A9A9]" style={{ width: 24, height: 24 }} />
          </div>
        </button>
      </div>
    </div>
  );
}
