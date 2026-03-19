"use client";

import { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  action?: { label: string; onClick: () => void };
}

export default function PageHeader({ title, subtitle, icon: Icon, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20">
          <Icon size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-dark-800">{title}</h1>
          {subtitle && <p className="text-sm text-dark-400">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
        >
          <Plus size={16} />
          {action.label}
        </button>
      )}
    </div>
  );
}
