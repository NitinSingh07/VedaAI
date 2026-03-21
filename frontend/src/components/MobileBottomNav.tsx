'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, BookMarked, Sparkles, Plus } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home',        label: 'Home',        icon: LayoutGrid },
  { href: '/assignments', label: 'Assignments',  icon: FileText },
  { href: '/library',     label: 'Library',      icon: BookMarked },
  { href: '/toolkit',     label: 'AI Toolkit',   icon: Sparkles },
];

export default function MobileBottomNav({ showFab = true }: { showFab?: boolean }) {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ padding: '0 10px 10px' }}
    >
      {/* FAB — white circle, orange + icon, right-aligned */}
      {showFab && (
        <div className="flex justify-end" style={{ marginBottom: 13 }}>
          <Link
            href="/create"
            className="flex items-center justify-center bg-white rounded-full"
            style={{
              width: 48,
              height: 48,
              boxShadow: '0px 8px 24px rgba(0,0,0,0.14), 0px 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Plus className="w-5 h-5 text-[#FF5623]" strokeWidth={2.5} />
          </Link>
        </div>
      )}

      {/* Bottom nav bar */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 72,
          borderRadius: 24,
          background: '#181818',
          paddingLeft: 24,
          paddingRight: 24,
          boxShadow:
            '0px 32px 48px rgba(0,0,0,0.20), 0px 16px 48px rgba(0,0,0,0.12)',
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/' && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center"
              style={{ gap: 4, minWidth: 52 }}
            >
              <Icon
                style={{
                  width: 22,
                  height: 22,
                  color: active ? '#FFFFFF' : '#5E5E5E',
                  strokeWidth: active ? 2.5 : 2,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 400,
                  color: active ? '#FFFFFF' : '#5E5E5E',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-bricolage, inherit)',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
