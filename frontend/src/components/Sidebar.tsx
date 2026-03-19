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
  Plus,
} from 'lucide-react';

const navItems = [
  { href: '/assignments', icon: Home, label: 'Home', activePatterns: ['/home', '/'] },
  { href: '/groups', icon: Users, label: 'My Groups', activePatterns: ['/groups'] },
  { href: '/assignments', icon: BookOpen, label: 'Assignments', activePatterns: ['/assignments', '/result', '/create'] },
  { href: '/toolkit', icon: Sparkles, label: "AI Teacher's Toolkit", activePatterns: ['/toolkit'] },
  { href: '/library', icon: Library, label: 'My Library', activePatterns: ['/library'] },
];

interface SidebarProps {
  assignmentCount?: number;
}

export default function Sidebar({ assignmentCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const isActiveItem = (patterns: string[]) => {
    if (patterns.length === 0) return false;
    return patterns.some((p) => pathname === p || (p !== '/' && pathname.startsWith(p + '/')));
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 w-[251px] bg-white flex flex-col z-30 border-r border-gray-100"
      style={{ boxShadow: '1px 0 10px rgba(0,0,0,0.01)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-8">
        <div className="flex items-center gap-3">
          {/* VedaAI icon — 40x40, 10px radius, bulky V (18x20px) */}
          <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[#E56820] to-[#D45E3E] rounded-[10px] flex items-center justify-center overflow-hidden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6L12 20L18 6" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">VedaAI</span>
        </div>
      </div>

      {/* Create Assignment CTA — Gradient Border Button matching Figma */}
      <div className="px-1 mb-6">
        <div className="h-[42px] p-[4px] rounded-full bg-gradient-to-r from-[#FF7950] to-[#C0350A] shadow-sm">
          <Link
            href="/create"
            className="flex items-center justify-center gap-2.5 w-full h-full bg-[#272727] text-white font-bold text-xs rounded-full hover:bg-black transition-all px-[43px]"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            Create Assignment
          </Link>
        </div>
      </div>

      {/* Nav — space-y-2 (8px gap) */}
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, activePatterns }) => {
          const active = isActiveItem(activePatterns);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 h-[38px] ${active
                  ? 'bg-[#F0F0F0] text-gray-900 font-bold'
                  : 'text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1 text-[13px]">{label}</span>
              {label === 'Assignments' && assignmentCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center bg-[#E8472A] text-white">
                  {assignmentCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6 space-y-4 pt-3 mt-auto">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-all"
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          <span className="text-[13px]">Settings</span>
        </Link>

        {/* School profile card — Figma #F0F0F0 gray box */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#F0F0F0] hover:bg-gray-200 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-white flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">Delhi Public School</p>
            <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
