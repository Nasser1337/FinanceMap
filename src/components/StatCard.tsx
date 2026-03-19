"use client";

import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "green" | "red" | "black";
}

const colorMap = {
  green: "bg-green-50 text-green-600 border-green-100",
  red: "bg-red-50 text-primary-500 border-red-100",
  black: "bg-dark-50 text-dark-700 border-dark-100",
};

const iconBg = {
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-primary-500",
  black: "bg-dark-100 text-dark-600",
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = "black" }: Props) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-60">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-50">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
