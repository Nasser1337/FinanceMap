"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { Tag, Edit2, Trash2, Loader2, Plus, ChevronRight, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string | null;
  parentId: number | null;
}

interface CategoryTree extends Category {
  children: CategoryTree[];
}

interface FormData {
  name: string;
  type: "income" | "expense";
  color: string;
  parentId: string;
}

const COLOR_PALETTE = [
  "#DC2626", "#F59E0B", "#10B981", "#3B82F6",
  "#8B5CF6", "#EC4899", "#06B6D4", "#6366F1",
];

function buildTree(cats: Category[], parentId: number | null = null): CategoryTree[] {
  return cats
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, children: buildTree(cats, c.id) }));
}

function flattenForSelect(tree: CategoryTree[], depth = 0): { id: number; name: string; depth: number }[] {
  const result: { id: number; name: string; depth: number }[] = [];
  for (const node of tree) {
    result.push({ id: node.id, name: node.name, depth });
    result.push(...flattenForSelect(node.children, depth + 1));
  }
  return result;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "expense",
    color: COLOR_PALETTE[0],
    parentId: "",
  });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      setCategories(await response.json());
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleOpenModal = (category?: Category, parentIdOverride?: number, typeOverride?: "income" | "expense") => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color,
        parentId: category.parentId ? String(category.parentId) : "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        type: typeOverride || "expense",
        color: COLOR_PALETTE[0],
        parentId: parentIdOverride ? String(parentIdOverride) : "",
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
    if (!formData.name.trim()) { alert(t("fillCategoryName")); return; }

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        type: formData.type,
        color: formData.color,
        parentId: formData.parentId ? parseInt(formData.parentId) : null,
      };

      const url = editingId ? `/api/categories/${editingId}` : `/api/categories`;
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
      // Delete children first
      const children = categories.filter((c) => c.parentId === id);
      for (const child of children) {
        await fetch(`/api/categories/${child.id}`, { method: "DELETE" });
      }
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
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
  const incomeTrees = buildTree(incomeCategories);
  const expenseTrees = buildTree(expenseCategories);

  const CategoryNode = ({ node, depth = 0 }: { node: CategoryTree; depth?: number }) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    return (
      <div>
        <div
          className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white"
          style={{ marginLeft: depth * 24 }}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button onClick={() => toggleExpand(node.id)} className="p-0.5 text-dark-400 hover:text-dark-600">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />
            <span className="text-sm font-medium text-dark-800">{node.name}</span>
            {hasChildren && (
              <span className="text-[10px] text-dark-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {node.children.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenModal(undefined, node.id, node.type)}
              className="p-1.5 rounded-lg hover:bg-green-50 text-dark-400 hover:text-green-600 transition-colors"
              title={t("addSubcategory")}
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => handleOpenModal(node)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-dark-400 hover:text-primary-500 transition-colors"
              title={t("edit")}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setConfirmDelete(node.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-primary-600 transition-colors"
              title={t("delete")}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {node.children.map((child) => (
              <CategoryNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const EmptyState = ({ type }: { type: string }) => (
    <div className="p-12 text-center">
      <p className="text-dark-400 text-sm mb-4">
        {type === "income" ? t("noIncomeCategoriesFound") : t("noExpenseCategoriesFound")}
      </p>
      <button
        onClick={() => handleOpenModal(undefined, undefined, type as "income" | "expense")}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-sm font-medium"
      >
        <Plus size={14} />
        {t("add")}
      </button>
    </div>
  );

  // Build select options for parent category in modal
  const getParentOptions = () => {
    const sameTypeCats = categories.filter((c) => c.type === formData.type);
    const tree = buildTree(sameTypeCats);
    return flattenForSelect(tree).filter((o) => o.id !== editingId);
  };

  const hasChildCategories = confirmDelete
    ? categories.some((c) => c.parentId === confirmDelete)
    : false;

  return (
    <div className="p-6 max-w-7xl">
      <PageHeader
        title={t("categories")}
        subtitle={t("manageCategories")}
        icon={Tag}
        action={{ label: t("add"), onClick: () => handleOpenModal() }}
      />

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
              {incomeTrees.length === 0 ? (
                <EmptyState type="income" />
              ) : (
                <div className="p-4 space-y-1">
                  {incomeTrees.map((node) => (
                    <CategoryNode key={node.id} node={node} />
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
              {expenseTrees.length === 0 ? (
                <EmptyState type="expense" />
              ) : (
                <div className="p-4 space-y-1">
                  {expenseTrees.map((node) => (
                    <CategoryNode key={node.id} node={node} />
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
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">{t("categoryName")}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              placeholder={t("categoryNamePlaceholder")}
              required
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">Type</label>
            <div className="flex gap-2">
              {(["income", "expense"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type, parentId: "" })}
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

          {/* Parent Category Selector */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-1">{t("parentCategory")}</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm appearance-none bg-white"
            >
              <option value="">{t("noParent")}</option>
              {getParentOptions().map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {"─".repeat(opt.depth)} {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-dark-800 mb-2">{t("color")}</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-full h-10 rounded-lg transition-all border-2 ${
                    formData.color === color ? "border-dark-800 shadow-md" : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

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
            <h3 className="text-lg font-bold text-dark-800 mb-2">{t("deleteCategory")}</h3>
            <p className="text-sm text-dark-600 mb-2">{t("deleteConfirm")}</p>
            {hasChildCategories && (
              <p className="text-sm text-red-600 font-medium mb-4">{t("childrenWillBeDeleted")}</p>
            )}
            <div className="flex gap-3 mt-4">
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
                {deleting === confirmDelete && <Loader2 size={16} className="animate-spin" />}
                {t("deleteAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
