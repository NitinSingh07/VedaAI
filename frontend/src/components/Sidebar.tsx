'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  BookOpen,
  Sparkles,
  Library,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/assignments', icon: Home,    label: 'Home',               activePatterns: ['/home', '/'] },
  { href: '/groups',      icon: Users,   label: 'My Groups',          activePatterns: ['/groups'] },
  { href: '/assignments', icon: BookOpen,label: 'Assignments',        activePatterns: ['/assignments', '/result', '/create'] },
  { href: '/toolkit',     icon: Sparkles,label: "AI Teacher's Toolkit", activePatterns: ['/toolkit'] },
  { href: '/library',     icon: Library, label: 'My Library',         activePatterns: ['/library'] },
];

interface SidebarProps {
  assignmentCount?: number;
}

export default function Sidebar({ assignmentCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (patterns: string[]) =>
    patterns.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')));

  return (
    <aside
      className="fixed z-30 flex flex-col"
      style={{
        top: 12,
        left: 12,
        bottom: 12,
        width: 304,
        borderRadius: 16,
        background: '#FFFFFF',
        padding: 24,
        justifyContent: 'space-between',
        boxShadow:
          '0 32px 48px rgba(0,0,0,0.20), 0 16px 48px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* ── TOP: logo + CTA + nav (gap 56px between groups) ── */}
      <div className="flex flex-col" style={{ gap: 32 }}>

        {/* Logo */}
        <div className="flex items-center" style={{ gap: 10 }}>
          {/* Icon — 40×40, radius 10, gradient #E56820→#D45E3E */}
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #E56820 0%, #D45E3E 100%)',
            }}
          >
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
              <path
                d="M3 3L10 19L17 3"
                stroke="white"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {/* VedaAI — Bricolage Grotesque, Bold 700, 28px, -6%, #303030 */}
          <span
            style={{
              fontFamily: 'var(--font-bricolage, inherit)',
              fontSize: 28,
              fontWeight: 700,
              color: '#303030',
              letterSpacing: '-0.06em',
              lineHeight: '20px',
            }}
          >
            VedaAI
          </span>
        </div>

        {/* Create Assignment CTA — dark pill with gradient border */}
        <Link
          href="/create"
          className="flex items-center justify-center transition-all hover:opacity-90"
          style={{
            gap: 8,
            height: 42,
            borderRadius: 100,
            background: '#1E1E1E',
            color: '#FFFFFF',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: '-0.04em',
            lineHeight: '28px',
            textDecoration: 'none',
            border: '2px solid transparent',
            backgroundImage:
              'linear-gradient(#1E1E1E, #1E1E1E), linear-gradient(135deg, #FF7950, #C0350A)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          <Sparkles
            style={{ width: 18, height: 18, fill: 'white', stroke: 'none', flexShrink: 0 }}
          />
          Create Assignment
        </Link>

        {/* Nav items */}
        <nav className="flex flex-col" style={{ gap: 4 }}>
          {navItems.map(({ href, icon: Icon, label, activePatterns }) => {
            const active = isActive(activePatterns);
            return (
              <Link
                key={label}
                href={href}
                className="flex items-center transition-colors"
                style={{
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  height: 40,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#303030' : '#A9A9A9',
                  background: active ? '#F0F0F0' : 'transparent',
                }}
              >
                <Icon
                  style={{ width: 18, height: 18, flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>{label}</span>
                {label === 'Assignments' && assignmentCount > 0 && (
                  <span
                    style={{
                      background: '#E8472A',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 100,
                    }}
                  >
                    {assignmentCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── BOTTOM: settings + school card ── */}
      <div className="flex flex-col" style={{ gap: 12 }}>
        <Link
          href="/settings"
          className="flex items-center transition-colors hover:opacity-80"
          style={{
            gap: 12,
            padding: '6px 12px',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            color: '#A9A9A9',
          }}
        >
          <Settings style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span>Settings</span>
        </Link>

        {/* Delhi Public School card — #F0F0F0 bg, radius 16 */}
        <div
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            gap: 12,
            padding: '12px 16px',
            borderRadius: 16,
            background: '#F0F0F0',
          }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              width: 36,
              height: 36,
              borderRadius: 100,
              background: 'white',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#E8472A">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#303030',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Delhi Public School
            </p>
            <p
              style={{
                fontSize: 11,
                color: '#A9A9A9',
                lineHeight: 1.4,
                marginTop: 2,
              }}
            >
              Bokaro Steel City
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
