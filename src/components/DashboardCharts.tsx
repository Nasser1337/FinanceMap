"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
  LineChart, Line, Area, AreaChart,
  Treemap,
} from "recharts";
import { useLanguage } from "@/lib/LanguageContext";
import { BarChart3, PieChart as PieIcon, TrendingUp, LayoutGrid } from "lucide-react";

interface SpendingCategory {
  name: string;
  total: number;
  count: number;
  color: string;
  descriptions: string[];
}

interface IncomeCategory {
  name: string;
  total: number;
  count: number;
  color: string;
}

interface TrendDataPoint {
  month: string;
  income: number;
  expenses: number;
}

interface Stats {
  avgExpense: number;
  avgIncome: number;
  largestExpense: number;
  largestIncome: number;
  expenseCount: number;
  incomeCount: number;
}

interface Props {
  spendingByCategory: SpendingCategory[];
  incomeByCategory: IncomeCategory[];
  trendData: TrendDataPoint[];
  stats: Stats;
  totalIncome: number;
  totalExpenses: number;
}

type ChartView = "bar" | "pie" | "line" | "treemap";

const formatEuro = (v: number) =>
  new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(v);

const COLORS = [
  "#DC2626", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#EC4899", "#06B6D4", "#6366F1", "#22c55e", "#f97316",
];

export default function DashboardCharts({
  spendingByCategory,
  incomeByCategory,
  trendData,
  stats,
  totalIncome,
  totalExpenses,
}: Props) {
  const { t } = useLanguage();
  const [view, setView] = useState<ChartView>("bar");

  const views: { key: ChartView; labelKey: "viewBar" | "viewPie" | "viewLine" | "viewTreemap"; icon: typeof BarChart3 }[] = [
    { key: "bar", labelKey: "viewBar", icon: BarChart3 },
    { key: "pie", labelKey: "viewPie", icon: PieIcon },
    { key: "line", labelKey: "viewLine", icon: TrendingUp },
    { key: "treemap", labelKey: "viewTreemap", icon: LayoutGrid },
  ];

  // Prepare data for bar chart: combined income + expense by category
  const barData = [
    ...incomeByCategory.map((c) => ({ name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name, fullName: c.name, income: c.total, expenses: 0 })),
    ...spendingByCategory.map((c) => ({ name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name, fullName: c.name, income: 0, expenses: c.total })),
  ];

  // Prepare data for treemap
  const treemapData = spendingByCategory.map((c, i) => ({
    name: c.name,
    size: c.total,
    color: c.color || COLORS[i % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-dark-800 mb-1">{payload[0]?.payload?.fullName || label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: {formatEuro(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-dark-800">{data.name}</p>
        <p className="text-xs text-dark-600">{formatEuro(data.total || data.value)}</p>
        {data.count && <p className="text-xs text-dark-400">{data.count} {t("transactions").toLowerCase()}</p>}
      </div>
    );
  };

  // Custom treemap content
  const TreemapContent = (props: any) => {
    const { x, y, width, height, name, color } = props;
    if (width < 40 || height < 30) return null;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={color || "#DC2626"} rx={4} opacity={0.85} stroke="#fff" strokeWidth={2} />
        {width > 60 && height > 40 && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central" className="text-[10px] fill-white font-medium" style={{ pointerEvents: "none" }}>
            {name.length > 15 ? name.slice(0, 15) + "…" : name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        {views.map(({ key, labelKey, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              view === key
                ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                : "bg-gray-100 text-dark-600 hover:bg-gray-200"
            }`}
          >
            <Icon size={14} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[400px]">
        {view === "bar" && (
          <div>
            <h3 className="text-sm font-bold text-dark-800 mb-4">{t("incomeVsExpenses")}</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name={t("income")} fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name={t("expenses")} fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-dark-400 text-center py-16">{t("noDataAvailable")}</p>
            )}
          </div>
        )}

        {view === "pie" && (
          <div>
            <h3 className="text-sm font-bold text-dark-800 mb-4">{t("categoryBreakdown")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expense pie */}
              <div>
                <p className="text-xs font-medium text-dark-500 mb-2 text-center">{t("expenses")}: {formatEuro(totalExpenses)}</p>
                {spendingByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={spendingByCategory}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name.length > 12 ? name.slice(0, 12) + "…" : name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {spendingByCategory.map((entry, i) => (
                          <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-dark-400 text-center py-8">{t("noDataAvailable")}</p>
                )}
              </div>
              {/* Income pie */}
              <div>
                <p className="text-xs font-medium text-dark-500 mb-2 text-center">{t("income")}: {formatEuro(totalIncome)}</p>
                {incomeByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name.length > 12 ? name.slice(0, 12) + "…" : name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {incomeByCategory.map((entry, i) => (
                          <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-dark-400 text-center py-8">{t("noDataAvailable")}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "line" && (
          <div>
            <h3 className="text-sm font-bold text-dark-800 mb-4">{t("monthlyTrend")}</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatEuro(value), name === "income" ? t("income") : t("expenses")]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => value === "income" ? t("income") : t("expenses")} />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="#DC2626" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-dark-400 text-center py-16">{t("noDataAvailable")}</p>
            )}
          </div>
        )}

        {view === "treemap" && (
          <div>
            <h3 className="text-sm font-bold text-dark-800 mb-4">{t("spendingBreakdown")}</h3>
            {treemapData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  content={<TreemapContent />}
                >
                  <Tooltip
                    formatter={(value: number) => [formatEuro(value), t("totalAmount")]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                </Treemap>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-dark-400 text-center py-16">{t("noDataAvailable")}</p>
            )}
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-medium text-dark-400 uppercase tracking-wider">{t("averageTransaction")}</p>
          <p className="text-lg font-bold text-dark-800 mt-1">{formatEuro(stats.avgExpense)}</p>
          <p className="text-[10px] text-dark-400">{t("expenses")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-medium text-dark-400 uppercase tracking-wider">{t("averageTransaction")}</p>
          <p className="text-lg font-bold text-green-600 mt-1">{formatEuro(stats.avgIncome)}</p>
          <p className="text-[10px] text-dark-400">{t("income")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-medium text-dark-400 uppercase tracking-wider">{t("largestTransaction")}</p>
          <p className="text-lg font-bold text-dark-800 mt-1">{formatEuro(stats.largestExpense)}</p>
          <p className="text-[10px] text-dark-400">{stats.expenseCount} {t("transactions").toLowerCase()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-medium text-dark-400 uppercase tracking-wider">{t("largestTransaction")}</p>
          <p className="text-lg font-bold text-green-600 mt-1">{formatEuro(stats.largestIncome)}</p>
          <p className="text-[10px] text-dark-400">{stats.incomeCount} {t("transactions").toLowerCase()}</p>
        </div>
      </div>
    </div>
  );
}
