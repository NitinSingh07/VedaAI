'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  showBack?: boolean;
}

export default function Topbar({ title, showBack = false }: Props) {
  const router = useRouter();

  return (
    <div
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6 h-14"
      style={{
        left: 251,
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Left: back + title */}
      <div className="flex items-center gap-[10px]">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-100 hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 8H1M1 8L8 1M1 8L8 15" stroke="#011625" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2 text-[15px]">
          <span className="font-bold text-gray-900">{title}</span>
        </div>
      </div>

      {/* Right: notification + profile */}
      <div className="flex items-center gap-3">
        <button className="relative flex items-center justify-center w-9 h-9 hover:opacity-70 transition-opacity">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <button className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-2xl hover:bg-gray-100 transition-colors">
          <img
            src="https://ui-avatars.com/api/?name=John+Doe&background=6C63FF&color=fff&size=32&rounded=true&bold=true"
            alt="John Doe"
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <span className="text-sm font-medium text-gray-700">John Doe</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
