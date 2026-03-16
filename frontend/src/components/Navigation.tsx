'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, FolderOpen, QrCode, Search, ShieldCheck, Upload, UserRound } from 'lucide-react';

const links = [
  { href: '/', label: 'Scan', icon: Search },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/collections', label: 'Collections', icon: FolderOpen },
  { href: '/import', label: 'Import', icon: Upload },
  { href: '/stocktake', label: 'Stocktake', icon: ShieldCheck },
  { href: '/reports', label: 'Reports', icon: QrCode },
  { href: '/account', label: 'Account', icon: UserRound },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex overflow-x-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`min-w-[78px] flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${active ? 'text-indigo-600' : ''}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
