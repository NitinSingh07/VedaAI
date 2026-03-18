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
  { href: '/assignments', icon: Home, label: 'Home', activePatterns: [] as string[] },
  { href: '/groups', icon: Users, label: 'My Groups', activePatterns: ['/groups'] },
  { href: '/assignments', icon: BookOpen, label: 'Assignments', activePatterns: ['/assignments', '/result'] },
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
    return patterns.some((p) => pathname === p || pathname.startsWith(p + '/'));
  };

  return (
    <aside
      className="fixed inset-y-0 left-0 w-[304px] bg-white flex flex-col z-30"
      style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)' }}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          {/* VedaAI icon — orange hexagon */}
          <div className="w-9 h-9 flex-shrink-0">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="8" fill="#E8472A"/>
              <path d="M18 8L26 13V23L18 28L10 23V13L18 8Z" fill="white" fillOpacity="0.25"/>
              <path d="M13 14L18 26L23 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17H24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">VedaAI</span>
        </div>
      </div>

      {/* Create Assignment CTA */}
      <div className="px-4 mb-4">
        <Link
          href="/create"
          className="flex items-center gap-2 w-full bg-[#1A1A2E] text-white font-semibold text-sm px-5 py-3 rounded-2xl hover:bg-[#0f0f1a] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, activePatterns }) => {
          const active = isActiveItem(activePatterns);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-150 ${
                active
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {label === 'Assignments' && assignmentCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center bg-[#E8472A] text-white">
                  {assignmentCount}
                </span>
              )}
              {label === 'My Library' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center bg-[#E8472A] text-white">
                  02
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-1 pt-3 mt-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          Settings
        </Link>

        {/* School profile */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex-shrink-0 overflow-hidden">
            <img
              src="https://ui-avatars.com/api/?name=Delhi+Public+School&background=E8472A&color=fff&size=36"
              alt="School"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate leading-tight">Delhi Public School</p>
            <p className="text-xs text-gray-400 truncate leading-tight">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
