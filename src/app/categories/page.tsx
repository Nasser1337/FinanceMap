"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Tag, Edit2, Trash2, Loader2, Plus } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string | null;
  parentId: number | null;
}

interface FormData {
  name: string;
  type: "income" | "expense";
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "expense",
    color: COLOR_PALETTE[0],
  });

  // Load categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        type: "expense",
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
      alert(t("fillCategoryName"));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        type: formData.type,
        color: formData.color,
      };

      const url = editingId
        ? `/api/categories/${editingId}`
        : `/api/categories`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save category");

      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving category:", error);
      alert(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      setDeleting(id);

      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      await fetchCategories();
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(t("deleteError"));
    } finally {
      setDeleting(null);
    }
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const CategoryCard = ({ category }: { category: Category }) => (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <span className="text-sm font-medium text-dark-800">{category.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleOpenModal(category)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-dark-400 hover:text-primary-500 transition-colors"
          title={t("edit")}
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => setConfirmDelete(category.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-primary-600 transition-colors"
          title={t("delete")}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  const EmptyState = ({ type }: { type: string }) => (
    <div className="p-12 text-center">
      <p className="text-dark-400 text-sm mb-4">
        {type === "income" ? t("noIncomeCategoriesFound") : t("noExpenseCategoriesFound")}
      </p>
      <button
        onClick={() => {
          setEditingId(null);
          setFormData({
            name: "",
            type: type as "income" | "expense",
            color: COLOR_PALETTE[0],
          });
          setModalOpen(true);
        }}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-sm font-medium"
      >
        <Plus size={14} />
        {t("add")}
      </button>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl">
      {/* Page Header */}
      <PageHeader
        title={t("categories")}
        subtitle={t("manageCategories")}
        icon={Tag}
        action={{
          label: t("add"),
          onClick: () => handleOpenModal(),
        }}
      />

      {/* Two Column Layout */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin text-primary-500" size={24} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-dark-800">{t("incomeCategories")}</h2>
              <p className="text-xs text-dark-400 mt-1">
                {incomeCategories.length} {incomeCategories.length !== 1 ? t("categoriesCount") : t("categoryCount")}
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {incomeCategories.length === 0 ? (
                <EmptyState type="income" />
              ) : (
                <div className="p-4 space-y-2">
                  {incomeCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-dark-800">{t("expenseCategories")}</h2>
              <p className="text-xs text-dark-400 mt-1">
                {expenseCategories.length} {expenseCategories.length !== 1 ? t("categoriesCount") : t("categoryCount")}
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {expenseCategories.length === 0 ? (
                <EmptyState type="expense" />
              ) : (
                <div className="p-4 space-y-2">
                  {expenseCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={editingId ? t("editCategory") : t("newCategory")}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">
              {t("categoryName")}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder={t("categoryNamePlaceholder")}
              required
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              {(["income", "expense"] as const).map((type) => (
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
                  {type === "income" ? t("income") : t("expenses")}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">
              {t("color")}
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
              {t("deleteCategory")}
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
                onClick={() => handleDeleteCategory(confirmDelete)}
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
