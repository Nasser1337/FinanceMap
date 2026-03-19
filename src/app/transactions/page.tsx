"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { formatCurrency, formatDate, getCurrentMonth } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import {
  ArrowLeftRight,
  Search,
  Edit2,
  Trash2,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface Transaction {
  id: number;
  description: string;
  amount: string | number;
  type: "income" | "expense" | "transfer";
  categoryId: number | null;
  accountId: number;
  toAccountId: number | null;
  date: string;
  notes: string | null;
  tags: string | null;
  category?: { id: number; name: string; type: string };
  account?: { id: number; name: string };
  toAccount?: { id: number; name: string };
}

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
}

interface Account {
  id: number;
  name: string;
}

interface FormData {
  description: string;
  amount: string;
  type: "income" | "expense" | "transfer";
  categoryId: string;
  accountId: string;
  toAccountId: string;
  date: string;
  notes: string;
  tags: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    description: "",
    amount: "",
    type: "expense",
    categoryId: "",
    accountId: "",
    toAccountId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    tags: "",
  });

  // Load transactions and data
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchAccounts();
  }, [selectedMonth, typeFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("month", selectedMonth);
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (!response.ok) throw new Error("Failed to fetch accounts");

      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Filter transactions based on search
  useEffect(() => {
    let filtered = transactions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category?.name.toLowerCase().includes(query) ||
          t.account?.name.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery]);

  const handleOpenModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingId(transaction.id);
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        categoryId: transaction.categoryId?.toString() || "",
        accountId: transaction.accountId.toString(),
        toAccountId: transaction.toAccountId?.toString() || "",
        date: new Date(transaction.date).toISOString().split("T")[0],
        notes: transaction.notes || "",
        tags: transaction.tags || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        categoryId: "",
        accountId: "",
        toAccountId: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        tags: "",
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

    if (
      !formData.description ||
      !formData.amount ||
      !formData.accountId ||
      !formData.date
    ) {
      alert(t("fillRequired"));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        accountId: parseInt(formData.accountId),
        toAccountId: formData.toAccountId
          ? parseInt(formData.toAccountId)
          : null,
        date: formData.date,
        notes: formData.notes || null,
        tags: formData.tags || null,
      };

      const url = editingId
        ? `/api/transactions/${editingId}`
        : `/api/transactions`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save transaction");

      await fetchTransactions();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      setDeleting(id);

      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete transaction");

      await fetchTransactions();
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert(t("deleteError"));
    } finally {
      setDeleting(null);
    }
  };

  const getFilteredCategories = () => {
    return categories.filter((c) => c.type === formData.type);
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return formatCurrency(num);
  };

  return (
    <div className="p-6 max-w-7xl">
      {/* Page Header */}
      <PageHeader
        title={t("transactions")}
        subtitle={t("manageIncomeExpenses")}
        icon={ArrowLeftRight}
        action={{
          label: t("add"),
          onClick: () => handleOpenModal(),
        }}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Month Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-dark-400">{t("month")}</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-dark-400">{t("type")}</label>
            <div className="flex gap-2">
              {(
                ["all", "income", "expense"] as const
              ).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === type
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-dark-600 hover:bg-gray-200"
                  }`}
                >
                  {type === "all"
                    ? t("all")
                    : type === "income"
                      ? t("income")
                      : t("expenses")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          />
          <input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-48"
          />
        </div>
      </div>

      {/* Transactions List/Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-primary-500" size={24} />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-dark-400">
              {transactions.length === 0
                ? t("noTransactionsFound")
                : t("noTransactionsMatchSearch")}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-dark-600">
                      {t("date")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-dark-600">
                      {t("description")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-dark-600">
                      {t("category")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-dark-600">
                      {t("account")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-dark-600">
                      {t("amount")}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-dark-600">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "" : ""
                      }`}
                    >
                      <td className="px-6 py-3 text-sm text-dark-700">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-dark-800">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-3 text-sm text-dark-600">
                        {transaction.category?.name || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-dark-600">
                        {transaction.account?.name}
                      </td>
                      <td
                        className={`px-6 py-3 text-sm font-semibold text-right ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : transaction.type === "expense"
                              ? "text-primary-600"
                              : "text-dark-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatAmount(transaction.amount)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(transaction)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-dark-400 hover:text-primary-500 transition-colors"
                            title={t("edit")}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(transaction.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-primary-600 transition-colors"
                            title={t("delete")}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="font-medium text-dark-800">
                          {transaction.description}
                        </p>
                        <button
                          onClick={() => setConfirmDelete(transaction.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-primary-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="text-xs text-dark-500 space-y-1">
                        <p>{formatDate(transaction.date)}</p>
                        {transaction.category && (
                          <p>{transaction.category.name}</p>
                        )}
                        <p>{transaction.account?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold text-sm ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : transaction.type === "expense"
                              ? "text-primary-600"
                              : "text-dark-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatAmount(transaction.amount)}
                      </p>
                      <button
                        onClick={() => handleOpenModal(transaction)}
                        className="mt-2 text-xs px-2 py-1 rounded bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                      >
                        {t("edit")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingId ? t("editTransaction") : t("newTransaction")}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              {t("description")}
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder={t("descriptionPlaceholder")}
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              {t("amount")}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 font-medium">
                €
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              {(["income", "expense", "transfer"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.type === type
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-dark-600 hover:bg-gray-200"
                  }`}
                >
                  {type === "income"
                    ? t("income")
                    : type === "expense"
                      ? t("expenses")
                      : t("transfer")}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          {formData.type !== "transfer" && (
            <div>
              <label className="block text-sm font-medium text-dark-800 mb-1">
                {t("category")}
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none bg-white"
              >
                <option value="">{t("selectCategory")}</option>
                {getFilteredCategories().map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* From Account */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              {t("account")}
            </label>
            <select
              value={formData.accountId}
              onChange={(e) =>
                setFormData({ ...formData, accountId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none bg-white"
              required
            >
              <option value="">{t("selectAccount")}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id.toString()}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* To Account (Transfer) */}
          {formData.type === "transfer" && (
            <div>
              <label className="block text-sm font-medium text-dark-800 mb-1">
                {t("toAccount")}
              </label>
              <select
                value={formData.toAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, toAccountId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none bg-white"
              >
                <option value="">{t("selectAccount")}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id.toString()}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              {t("date")}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              {t("notes")}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
              placeholder={t("notesPlaceholder")}
              rows={2}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              {t("tags")}
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder={t("tagsPlaceholder")}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-dark-800 font-medium hover:bg-gray-50 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editingId ? t("save") : t("add")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-dark-800 mb-2">
              {t("deleteTransaction")}
            </h3>
            <p className="text-sm text-dark-600 mb-6">
              {t("deleteConfirm")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-dark-800 font-medium hover:bg-gray-50 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleDeleteTransaction(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting === confirmDelete && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {t("deleteAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
