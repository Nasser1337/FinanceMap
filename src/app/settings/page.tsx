"use client";

import { useState } from "react";
import { Settings, DatabaseZap, Download, Upload, Loader2, Globe, Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Image from "next/image";

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!confirm("Dit zal standaard tandartspraktijk categorieën, rekeningen en budgetten aanmaken. Doorgaan?")) return;
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSeedResult(`Succesvol! ${data.categories || ""} categorieën, ${data.accounts || ""} rekeningen en ${data.budgets || ""} budgetten aangemaakt.`);
      } else {
        setSeedResult("Er is iets misgegaan bij het seeden.");
      }
    } catch {
      setSeedResult("Fout bij verbinding met server.");
    }
    setSeeding(false);
  };

  const handleExport = async () => {
    try {
      const [cats, accs, txs, buds] = await Promise.all([
        fetch("/api/categories").then(r => r.json()),
        fetch("/api/accounts").then(r => r.json()),
        fetch("/api/transactions").then(r => r.json()),
        fetch("/api/budgets").then(r => r.json()),
      ]);
      const data = { categories: cats, accounts: accs, transactions: txs, budgets: buds, exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financemap-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export mislukt.");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Instellingen"
        subtitle="Beheer je applicatie-instellingen"
        icon={Settings}
      />

      {/* About */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gray-50 rounded-xl p-2 flex items-center justify-center border border-gray-100">
            <Image src="/logo.png" alt="MediDental" width={48} height={48} className="object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-800">FinanceMap</h2>
            <p className="text-sm text-dark-400">Visuele geldstroom tracker voor tandartspraktijken</p>
            <p className="text-xs text-dark-300 mt-1">Versie 1.0.0</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
          <Info size={16} className="text-dark-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-dark-500">
            <p>
              Dit systeem is gemaakt door <strong className="text-dark-700">Nasser F.</strong> van{" "}
              <a href="https://lightfusion.be" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-400 font-medium">
                Lightfusion.be
              </a>
            </p>
            <p className="mt-1 text-xs text-dark-400">
              Technologie: Next.js · Neon PostgreSQL · Drizzle ORM · Vercel
            </p>
          </div>
        </div>
      </div>

      {/* Database */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
          <DatabaseZap size={20} className="text-primary-500" />
          Database
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-dark-700 mb-2">Standaard data laden</h4>
            <p className="text-xs text-dark-400 mb-3">
              Vul de database met vooraf ingestelde categorieën, rekeningen en budgetten
              specifiek voor een Belgische tandartspraktijk.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 bg-dark-800 text-white rounded-xl text-sm font-medium hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              {seeding ? <Loader2 size={16} className="animate-spin" /> : <DatabaseZap size={16} />}
              {seeding ? "Bezig met laden..." : "Tandartspraktijk data laden"}
            </button>
            {seedResult && (
              <p className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{seedResult}</p>
            )}
          </div>
        </div>
      </div>

      {/* Export / Import */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-primary-500" />
          Data Export
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-dark-700 mb-2">Exporteren</h4>
            <p className="text-xs text-dark-400 mb-3">
              Download al je data als JSON-bestand.
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <Download size={16} />
              Data exporteren
            </button>
          </div>
          <div>
            <h4 className="text-sm font-medium text-dark-700 mb-2">Importeren</h4>
            <p className="text-xs text-dark-400 mb-3">
              Upload een eerder geëxporteerd JSON-bestand.
            </p>
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-dark-400 rounded-xl text-sm font-medium cursor-not-allowed"
            >
              <Upload size={16} />
              Binnenkort beschikbaar
            </button>
          </div>
        </div>
      </div>

      {/* Deployment info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-dark-800 mb-4">Deployment Info</h3>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <span className="text-dark-400">Platform</span>
          <span className="text-dark-700 font-medium">Vercel</span>
          <span className="text-dark-400">Database</span>
          <span className="text-dark-700 font-medium">Neon PostgreSQL</span>
          <span className="text-dark-400">ORM</span>
          <span className="text-dark-700 font-medium">Drizzle</span>
          <span className="text-dark-400">Framework</span>
          <span className="text-dark-700 font-medium">Next.js 15</span>
          <span className="text-dark-400">Taal</span>
          <span className="text-dark-700 font-medium">TypeScript</span>
        </div>
      </div>

      {/* Credit */}
      <div className="mt-8 text-center">
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
