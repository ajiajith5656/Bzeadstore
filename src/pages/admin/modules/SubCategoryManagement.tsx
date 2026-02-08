import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

// TODO: Backend stubs — connect to your API
const categoryService = {
  getAllCategories: async () => [{ id: '', name: '' }],
  getSubCategoriesByCategory: async (..._a: any[]) => [],
  updateSubCategory: async (..._a: any[]) => ({}),
  createSubCategory: async (..._a: any[]) => ({}),
  deleteSubCategory: async (..._a: any[]) => ({}),
};

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export const SubCategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories();
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    const cats = await categoryService.getAllCategories();
    if (cats) {
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id);
      }
    }
  };

  const loadSubcategories = async () => {
    setLoading(true);
    const subs = await categoryService.getSubCategoriesByCategory(selectedCategory);
    setSubcategories(subs);
    setLoading(false);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', imageUrl: '' });
    setShowForm(true);
  };

  const handleEdit = (sub: SubCategory) => {
    setEditingId(sub.id);
    setFormData({
      name: sub.name,
      description: sub.description || '',
      imageUrl: sub.imageUrl || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Name is required');
      return;
    }

    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    if (editingId) {
      const success = await categoryService.updateSubCategory(
        editingId,
        selectedCategory,
        formData.name,
        formData.description,
        formData.imageUrl
      );
      if (success) {
        alert('Updated successfully');
        loadSubcategories();
        setShowForm(false);
      }
    } else {
      const success = await categoryService.createSubCategory(
        selectedCategory,
        formData.name,
        formData.description,
        formData.imageUrl
      );
      if (success) {
        alert('Created successfully');
        loadSubcategories();
        setShowForm(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this subcategory?')) {
      const success = await categoryService.deleteSubCategory(id);
      if (success) {
        alert('Deleted successfully');
        loadSubcategories();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sub-Categories</h1>
            <p className="text-gray-600 mt-2">Manage subcategories for each category</p>
          </div>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-gray-900 font-bold px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> Add Sub-Category
          </button>
        </div>

        {/* Category Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Choose a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold mb-6">
              {editingId ? 'Edit Sub-Category' : 'Add New Sub-Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mobiles & Smartphones"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-gray-900 font-bold px-6 py-2 rounded-lg"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subcategories List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        ) : !selectedCategory ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">Please select a category first</p>
          </div>
        ) : subcategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No subcategories found for this category</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Image
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subcategories.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sub.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {sub.imageUrl ? '✓' : '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(sub)}
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-red-600 hover:text-red-800 font-semibold inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
