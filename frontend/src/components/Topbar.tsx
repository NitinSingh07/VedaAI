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
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          {showBack && <span className="text-gray-300">›</span>}
          <span className="font-semibold text-gray-800">{title}</span>
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
