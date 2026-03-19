"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { formatCurrency } from "@/lib/utils";
import { PiggyBank, Edit2, Trash2, Loader2, Plus } from "lucide-react";

interface Budget {
  id: number;
  name: string;
  monthlyLimit: string | number;
  categoryId: number | null;
  period: "monthly" | "yearly";
  color: string;
  category?: { id: number; name: string };
}

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
}

interface Transaction {
  id: number;
  amount: string | number;
  categoryId: number | null;
  date: string;
}

interface FormData {
  name: string;
  monthlyLimit: string;
  categoryId: string;
  period: "monthly" | "yearly";
  color: string;
}

const COLOR_PALETTE = [
  "#DC2626", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    monthlyLimit: "",
    categoryId: "",
    period: "monthly",
    color: COLOR_PALETTE[0],
  });

  // Load budgets, categories, and transactions
  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchTransactions();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/budgets");
      if (!response.ok) throw new Error("Failed to fetch budgets");

      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      const expenseCategories = data.filter((c: Category) => c.type === "expense");
      setCategories(expenseCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      setEditingId(budget.id);
      setFormData({
        name: budget.name,
        monthlyLimit: budget.monthlyLimit.toString(),
        categoryId: budget.categoryId?.toString() || "",
        period: budget.period,
        color: budget.color,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        monthlyLimit: "",
        categoryId: "",
        period: "monthly",
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

    if (!formData.name.trim() || !formData.monthlyLimit) {
      alert("Vul alle verplichte velden in");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        monthlyLimit: parseFloat(formData.monthlyLimit),
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        period: formData.period,
        color: formData.color,
      };

      const url = editingId ? `/api/budgets/${editingId}` : `/api/budgets`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save budget");

      await fetchBudgets();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Er is een fout opgetreden bij het opslaan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      setDeleting(id);

      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete budget");

      await fetchBudgets();
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("Er is een fout opgetreden bij het verwijderen");
    } finally {
      setDeleting(null);
    }
  };

  // Calculate spent amount for a budget
  const calculateSpent = (budget: Budget): number => {
    if (!budget.categoryId) return 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        const txYear = txDate.getFullYear();
        const txMonth = txDate.getMonth();

        if (budget.period === "monthly") {
          return t.categoryId === budget.categoryId && txYear === currentYear && txMonth === currentMonth;
        } else {
          return t.categoryId === budget.categoryId && txYear === currentYear;
        }
      })
      .reduce((sum, t) => sum + (typeof t.amount === "string" ? parseFloat(t.amount) : t.amount), 0);
  };

  // Calculate total budget
  const totalBudget = budgets.reduce(
    (sum, b) => sum + (typeof b.monthlyLimit === "string" ? parseFloat(b.monthlyLimit) : b.monthlyLimit),
    0
  );

  const totalSpent = budgets.reduce((sum, b) => sum + calculateSpent(b), 0);

  const BudgetCard = ({ budget }: { budget: Budget }) => {
    const spent = calculateSpent(budget);
    const limit = typeof budget.monthlyLimit === "string" ? parseFloat(budget.monthlyLimit) : budget.monthlyLimit;
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
        {/* Header with color accent */}
        <div className="h-1.5" style={{ backgroundColor: budget.color }} />

        <div className="p-5">
          {/* Name and Category */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-dark-800">{budget.name}</h3>
            {budget.category && (
              <p className="text-xs text-dark-500 mt-1">{budget.category.name}</p>
            )}
          </div>

          {/* Limit and Period */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-dark-600">Limiet</span>
              <span className="text-lg font-bold text-dark-800">
                {formatCurrency(limit)}
              </span>
            </div>
            <p className="text-xs text-dark-400 mt-1">
              {budget.period === "monthly" ? "Maandelijks" : "Jaarlijks"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-dark-600">Uitgegeven</span>
              <span className="text-sm font-semibold text-dark-800">
                {formatCurrency(spent)}
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  backgroundColor: percentage > 100 ? "#DC2626" : budget.color,
                  width: `${Math.min(percentage, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-dark-500 mt-1.5">
              {percentage.toFixed(0)}% van budget
              {percentage > 100 && (
                <span className="text-red-600 font-medium ml-1">
                  ({formatCurrency(spent - limit)} over budget)
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleOpenModal(budget)}
              className="flex-1 p-2 rounded-lg hover:bg-gray-50 text-dark-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
              title="Bewerk"
            >
              <Edit2 size={16} />
              <span className="text-xs font-medium">Bewerk</span>
            </button>
            <button
              onClick={() => setConfirmDelete(budget.id)}
              className="flex-1 p-2 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
              title="Verwijder"
            >
              <Trash2 size={16} />
              <span className="text-xs font-medium">Verwijder</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="p-12 text-center">
      <p className="text-dark-400 text-sm mb-4">Geen budgetten ingesteld</p>
      <button
        onClick={() => handleOpenModal()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-sm font-medium"
      >
        <Plus size={16} />
        Budget toevoegen
      </button>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl">
      {/* Page Header */}
      <PageHeader
        title="Budgetten"
        subtitle="Stel maandelijkse limieten in per categorie"
        icon={PiggyBank}
        action={{
          label: "Toevoegen",
          onClick: () => handleOpenModal(),
        }}
      />

      {/* Total Budget Summary */}
      {!loading && budgets.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-dark-500 mb-1">Totaal Budget</p>
            <p className="text-2xl font-bold text-dark-800">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-dark-500 mb-1">Totaal Uitgegeven</p>
            <p className="text-2xl font-bold text-dark-800">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs font-medium text-dark-500 mb-1">Nog Beschikbaar</p>
            <p
              className={`text-2xl font-bold ${
                totalSpent > totalBudget ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(Math.abs(totalBudget - totalSpent))}
            </p>
          </div>
        </div>
      )}

      {/* Budget Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin text-primary-500" size={24} />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <EmptyState />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Budget bewerken" : "Nieuw budget"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              Budgetnaam
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder="Bijv. Boodschappen"
              required
            />
          </div>

          {/* Monthly Limit */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              Limiet (EUR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 font-medium">
                €
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.monthlyLimit}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyLimit: e.target.value })
                }
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              Categorie (optioneel)
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none bg-white"
            >
              <option value="">Geen categorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              Periode
            </label>
            <div className="flex gap-2">
              {(["monthly", "yearly"] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setFormData({ ...formData, period })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.period === period
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-dark-600 hover:bg-gray-200"
                  }`}
                >
                  {period === "monthly" ? "Maandelijks" : "Jaarlijks"}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              Kleur
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full h-10 rounded-lg transition-all border-2 ${
                    formData.color === color
                      ? "border-dark-800 shadow-md"
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
              Budget verwijderen?
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
                onClick={() => handleDeleteBudget(confirmDelete)}
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
