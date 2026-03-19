"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import {
  Wallet,
  Edit2,
  Trash2,
  Loader2,
  Plus,
  Building2,
  PiggyBank,
  Banknote,
  CreditCard,
  HandCoins,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: number;
  name: string;
  type: "checking" | "savings" | "cash" | "credit_card" | "loan";
  balance: string;
  currency: string;
  description: string | null;
  color: string;
  createdAt: string;
}

interface FormData {
  name: string;
  type: "checking" | "savings" | "cash" | "credit_card" | "loan";
  balance: string;
  description: string;
  color: string;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Zichtrekening",
  savings: "Spaarrekening",
  cash: "Kas",
  credit_card: "Kredietkaart",
  loan: "Lening",
};

const ACCOUNT_TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  checking: Building2,
  savings: PiggyBank,
  cash: Banknote,
  credit_card: CreditCard,
  loan: HandCoins,
};

const COLOR_PALETTE = [
  "#DC2626", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#1A1A1A", // Black
  "#6B7280", // Gray
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "checking",
    balance: "0",
    description: "",
    color: COLOR_PALETTE[0],
  });

  // Load accounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/accounts");
      if (!response.ok) throw new Error("Failed to fetch accounts");

      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (account?: Account) => {
    if (account) {
      setEditingId(account.id);
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance,
        description: account.description || "",
        color: account.color,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        type: "checking",
        balance: "0",
        description: "",
        color: COLOR_PALETTE[0],
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Vul een rekeningnaam in");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
        currency: "EUR",
        description: formData.description || null,
        color: formData.color,
      };

      const url = editingId ? `/api/accounts/${editingId}` : `/api/accounts`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save account");

      await fetchAccounts();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving account:", error);
      alert("Er is een fout opgetreden bij het opslaan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    try {
      setDeleting(id);

      const response = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete account");

      await fetchAccounts();
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Er is een fout opgetreden bij het verwijderen");
    } finally {
      setDeleting(null);
    }
  };

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => {
    return sum + parseFloat(account.balance);
  }, 0);

  const AccountCard = ({ account }: { account: Account }) => {
    const IconComponent = ACCOUNT_TYPE_ICONS[account.type];

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden">
        {/* Top accent bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: account.color }}
        />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: `${account.color}15` }}
              >
                {IconComponent && <IconComponent size={18} style={{ color: account.color }} />}
              </div>
              <div>
                <h3 className="font-semibold text-dark-800">{account.name}</h3>
                <p className="text-xs text-dark-400">
                  {ACCOUNT_TYPE_LABELS[account.type]}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenModal(account)}
                className="p-2 rounded-lg hover:bg-gray-100 text-dark-400 hover:text-primary-500 transition-colors"
                title="Bewerk"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => setConfirmDelete(account.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-dark-400 hover:text-primary-600 transition-colors"
                title="Verwijder"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="mb-3">
            <p className="text-sm text-dark-400 mb-1">Saldo</p>
            <p className="text-2xl font-bold text-dark-800">
              {formatCurrency(account.balance)}
            </p>
          </div>

          {/* Description */}
          {account.description && (
            <p className="text-sm text-dark-600 line-clamp-2">
              {account.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl">
      {/* Page Header */}
      <PageHeader
        title="Rekeningen"
        subtitle="Beheer je bankrekeningen en kasregisters"
        icon={Wallet}
        action={{
          label: "Toevoegen",
          onClick: () => handleOpenModal(),
        }}
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin text-primary-500" size={24} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total Balance Summary Card */}
          {accounts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <p className="text-sm font-medium text-dark-400 mb-1">
                Totaal saldo
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-dark-800">
                {formatCurrency(totalBalance)}
              </h2>
              <p className="text-xs text-dark-400 mt-2">
                {accounts.length} rekening{accounts.length !== 1 ? "en" : ""}
              </p>
            </div>
          )}

          {/* Accounts Grid */}
          {accounts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <Wallet
                size={48}
                className="mx-auto mb-4 text-dark-400"
              />
              <p className="text-dark-600 mb-4">
                Geen rekeningen gevonden. Voeg je eerste rekening toe om aan de slag te gaan.
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
              >
                <Plus size={16} />
                Eerste rekening toevoegen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Rekening bewerken" : "Nieuwe rekening"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              Rekeningnaam
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="Bijv. ING Zichtrekening"
              required
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as FormData["type"],
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
            >
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              Saldo (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) =>
                setFormData({ ...formData, balance: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="0.00"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              Omschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
              placeholder="Optionele omschrijving..."
              rows={3}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              Kleur
            </label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full h-10 rounded-lg transition-all border-2 ${
                    formData.color === color
                      ? "border-dark-800 shadow-md scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-dark-800 font-medium hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editingId ? "Opslaan" : "Toevoegen"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-dark-800 mb-2">
              Rekening verwijderen?
            </h3>
            <p className="text-sm text-dark-600 mb-6">
              Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-dark-800 font-medium hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDeleteAccount(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting === confirmDelete && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
