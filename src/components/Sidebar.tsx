"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Wallet,
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transacties", icon: ArrowLeftRight },
  { href: "/categories", label: "Categorieën", icon: Tag },
  { href: "/accounts", label: "Rekeningen", icon: Wallet },
  { href: "/budgets", label: "Budgetten", icon: PiggyBank },
  { href: "/settings", label: "Instellingen", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-64"
      } bg-dark-900 text-white flex flex-col transition-all duration-300 ease-in-out relative`}
    >
      {/* Logo area */}
      <div className="px-4 py-6 flex items-center gap-3 border-b border-dark-700">
        <div className="w-10 h-10 flex-shrink-0 bg-white rounded-lg p-1 flex items-center justify-center">
          <Image src="/logo.png" alt="MediDental" width={32} height={32} className="object-contain" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold leading-tight text-white">FinanceMap</h1>
            <p className="text-[10px] text-dark-400 leading-tight">by Lightfusion.be</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                  : "text-dark-300 hover:text-white hover:bg-dark-800"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-dark-700">
          <p className="text-[10px] text-dark-500 text-center">
            Made by Nasser F. from{" "}
            <a
              href="https://lightfusion.be"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300"
            >
              Lightfusion.be
            </a>
          </p>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-dark-800 border border-dark-600 rounded-full flex items-center justify-center text-dark-300 hover:text-white hover:bg-primary-500 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
