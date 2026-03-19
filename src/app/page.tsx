"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowLeftRight,
  Loader2,
  DatabaseZap,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import SankeyDiagram from "@/components/SankeyDiagram";
import DashboardCharts from "@/components/DashboardCharts";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, formatDate, getCurrentMonth } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  recentTransactions: {
    id: number;
    description: string;
    amount: string;
    type: string;
    date: string;
    categoryName: string | null;
    accountName: string | null;
  }[];
  spendingByCategory: { name: string; total: number; count: number; color: string; descriptions: string[] }[];
  incomeByCategory: { name: string; total: number; count: number; color: string }[];
  sankeyData: {
    nodes: { name: string; color?: string }[];
    links: { source: number; target: number; value: number; count?: number; descriptions?: string[] }[];
  };
  trendData: { month: string; income: number; expenses: number }[];
  stats: {
    avgExpense: number;
    avgIncome: number;
    largestExpense: number;
    largestIncome: number;
    expenseCount: number;
    incomeCount: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [seeding, setSeeding] = useState(false);
  const { t } = useLanguage();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${month}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    }
    setLoading(false);
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        await fetchData();
        alert(t("seedSuccess"));
      }
    } catch (e) {
      console.error("Seed failed:", e);
    }
    setSeeding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <PageHeader
          title={t("dashboard")}
          subtitle={t("dashboardSubtitle")}
          icon={LayoutDashboard}
        />
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-3 py-2 bg-dark-800 text-white rounded-xl text-xs font-medium hover:bg-dark-700 transition-colors disabled:opacity-50"
            title={t("seedDb")}
          >
            <DatabaseZap size={14} />
            {seeding ? t("seeding") : t("seedDb")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t("income")}
          value={formatCurrency(data?.totalIncome || 0)}
          subtitle={`${month}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title={t("expenses")}
          value={formatCurrency(data?.totalExpenses || 0)}
          subtitle={`${month}`}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title={t("balance")}
          value={formatCurrency(data?.balance || 0)}
          subtitle={t("incomeMinusExpenses")}
          icon={Scale}
          color={(data?.balance || 0) >= 0 ? "green" : "red"}
        />
        <StatCard
          title={t("transactionsCount")}
          value={String(data?.transactionCount || 0)}
          subtitle={t("thisMonth")}
          icon={ArrowLeftRight}
          color="black"
        />
      </div>

      {/* Sankey Diagram */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-dark-800 mb-1">{t("cashFlow")}</h2>
        <p className="text-xs text-dark-400 mb-4">
          {t("cashFlowSubtitle")}
        </p>
        <SankeyDiagram data={data?.sankeyData || { nodes: [], links: [] }} />
      </div>

      {/* Charts section */}
      {data && (
        <div className="mb-8">
          <DashboardCharts
            spendingByCategory={data.spendingByCategory || []}
            incomeByCategory={data.incomeByCategory || []}
            trendData={data.trendData || []}
            stats={data.stats || { avgExpense: 0, avgIncome: 0, largestExpense: 0, largestIncome: 0, expenseCount: 0, incomeCount: 0 }}
            totalIncome={data.totalIncome}
            totalExpenses={data.totalExpenses}
          />
        </div>
      )}

      {/* Bottom row: Spending + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top spending */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark-800 mb-4">{t("topSpendingByCategory")}</h2>
          {data?.spendingByCategory && data.spendingByCategory.length > 0 ? (
            <div className="space-y-3">
              {data.spendingByCategory.slice(0, 8).map((cat, i) => {
                const maxAmount = data.spendingByCategory[0].total;
                const pct = maxAmount > 0 ? (cat.total / maxAmount) * 100 : 0;
                return (
                  <div key={i} title={cat.descriptions?.join(", ") || ""}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-dark-600 font-medium">{cat.name}</span>
                        <span className="text-[10px] text-dark-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{cat.count}x</span>
                      </div>
                      <span className="text-dark-800 font-bold">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: cat.color || "#DC2626",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-dark-400">{t("noExpensesThisMonth")}</p>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-dark-800 mb-4">{t("recentTransactions")}</h2>
          {data?.recentTransactions && data.recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {data.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        tx.type === "income" ? "bg-green-500" : "bg-primary-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-dark-700">{tx.description}</p>
                      <p className="text-xs text-dark-400">
                        {tx.categoryName || t("noCategory")} · {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      tx.type === "income" ? "text-green-600" : "text-primary-600"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(Math.abs(parseFloat(tx.amount)))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-400">{t("noTransactionsYet")}</p>
          )}
        </div>
      </div>

      {/* Credit footer */}
      <div className="mt-10 text-center">
        <p className="text-xs text-dark-300">
          FinanceMap v1.0 — Made by <span className="font-semibold text-dark-500">Nasser F.</span> from{" "}
          <a href="https://lightfusion.be" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400">
            Lightfusion.be
          </a>
        </p>
      </div>
    </div>
  );
}
