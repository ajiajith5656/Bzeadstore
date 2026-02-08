import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Save, X, Upload } from 'lucide-react';
import { logger } from '../../../utils/logger';


// TODO: Backend stubs — connect to your API
const client = { graphql: async (_opts: any): Promise<any> => ({ data: {} }) };
const uploadData = (_opts: any) => ({ result: Promise.resolve({}) });

interface SubCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
}

interface Category {
  id: string;
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sub_categories?: SubCategory[];
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

const listCategoriesQuery = `
  query ListCategories {
    listCategories {
      id
      categoryId
      name
      slug
      description
      image_url
      parent_id
      sub_categories {
        id
        name
        slug
        description
        image_url
      }
      is_active
      sort_order
      created_at
      updated_at
    }
  }
`;

const createCategoryMutation = `
  mutation CreateCategory($input: CategoryInput!) {
    createCategory(input: $input) {
      id
      categoryId
      name
      slug
      description
      image_url
      is_active
      sub_categories {
        id
        name
      }
    }
  }
`;

const updateCategoryMutation = `
  mutation UpdateCategory($id: ID!, $input: CategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      categoryId
      name
      slug
      description
      image_url
      is_active
    }
  }
`;

const deleteCategoryMutation = `
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [newSubCategory, setNewSubCategory] = useState({ name: '', image_url: '' });
  const [subImageFile, setSubImageFile] = useState<File | null>(null);
  const [subImagePreview, setSubImagePreview] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const result: any = await client.graphql({
        query: listCategoriesQuery,
        authMode: 'apiKey',
      });
      
      if (result.data?.listCategories) {
        setCategories(result.data.listCategories);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
      logger.error(err as Error, { context: 'Error fetching categories' });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, folder: string = 'categories'): Promise<string> => {
    try {
      const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      await uploadData({
        key: fileName,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;
      
      return `https://beauzead-store-images.s3.us-east-1.amazonaws.com/public/${fileName}`;
    } catch (error) {
      logger.error(error as Error, { context: 'Error uploading image' });
      throw new Error('Failed to upload image');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setSubImageFile(file);
      setSubImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      if (!editingId && !imageFile) {
        setError('Category image is required');
        return;
      }

      setUploadingImage(true);
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const input = {
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        image_url: imageUrl,
        is_active: true,
        sub_categories: subCategories,
      };

      if (editingId) {
        await client.graphql({
          query: updateCategoryMutation,
          authMode: 'apiKey',
          variables: { id: editingId, input },
        });
        setSuccess('Category updated successfully');
      } else {
        await client.graphql({
          query: createCategoryMutation,
          authMode: 'apiKey',
          variables: { input },
        });
        setSuccess('Category created successfully');
      }

      await fetchCategories();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
      logger.error(err as Error, { context: 'Error saving category' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await client.graphql({
        query: deleteCategoryMutation,
        authMode: 'apiKey',
        variables: { id: categoryId },
      });
      setSuccess('Category deleted successfully');
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      logger.error(err as Error, { context: 'Error deleting category' });
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.categoryId);
    setFormData({
      name: category.name,
      image_url: category.image_url || '',
    });
    setImagePreview(category.image_url || '');
    setSubCategories(category.sub_categories || []);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image_url: '',
    });
    setImageFile(null);
    setImagePreview('');
    setSubCategories([]);
    setNewSubCategory({ name: '', image_url: '' });
    setSubImageFile(null);
    setSubImagePreview('');
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const addSubCategory = async () => {
    if (!newSubCategory.name.trim()) {
      setError('Subcategory name is required');
      return;
    }
    
    if (!subImageFile) {
      setError('Subcategory image is required');
      return;
    }

    try {
      setUploadingImage(true);
      const imageUrl = await uploadImage(subImageFile, 'subcategories');
      
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const subCat: SubCategory = {
        id: uniqueId,
        name: newSubCategory.name,
        slug: newSubCategory.name.toLowerCase().replace(/\s+/g, '-'),
        image_url: imageUrl,
      };
      
      setSubCategories([...subCategories, subCat]);
      setNewSubCategory({ name: '', image_url: '' });
      setSubImageFile(null);
      setSubImagePreview('');
    } catch (err: any) {
      setError(err.message || 'Failed to add subcategory');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeSubCategory = (id: string) => {
    setSubCategories(subCategories.filter(sub => sub.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-center">
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
          <span className="text-green-800">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Category Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage categories and subcategories</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div key={category.categoryId} className="hover:bg-gray-50">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleExpand(category.categoryId)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {(category.sub_categories?.length || 0) > 0 ? (
                        expandedCategories.has(category.categoryId) ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )
                      ) : (
                        <div className="w-5" />
                      )}
                    </button>
                    
                    {category.image_url && (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      {(category.sub_categories?.length || 0) > 0 && (
                        <span className="text-xs text-gray-500">
                          {category.sub_categories?.length} subcategories
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {category.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit size={18} />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(category.categoryId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {expandedCategories.has(category.categoryId) &&
                  category.sub_categories &&
                  category.sub_categories.length > 0 && (
                    <div className="pl-16 pr-4 pb-4 space-y-2">
                      {category.sub_categories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">{sub.name}</h4>
                            {sub.description && (
                              <p className="text-sm text-gray-600">{sub.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              No categories found. Click "Add Category" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
                  placeholder="e.g., Electronics"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Image *
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              {/* Subcategories Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Subcategories</h3>
                
                {/* Existing Subcategories */}
                <div className="space-y-2 mb-4">
                  {subCategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {sub.image_url && (
                          <img src={sub.image_url} alt={sub.name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <h4 className="font-medium text-gray-900">{sub.name}</h4>
                      </div>
                      <button
                        onClick={() => removeSubCategory(sub.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Subcategory */}
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Subcategory name *"
                    value={newSubCategory.name}
                    onChange={(e) => setNewSubCategory({ ...newSubCategory, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory Image *
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="w-6 h-6 mb-1 text-gray-500" />
                        <p className="text-xs text-gray-500">Click to upload image</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleSubImageChange}
                      />
                    </label>
                    {subImagePreview && (
                      <img src={subImagePreview} alt="Sub Preview" className="mt-2 w-20 h-20 object-cover rounded" />
                    )}
                  </div>
                  
                  <button
                    onClick={addSubCategory}
                    disabled={uploadingImage}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading...' : 'Add Subcategory'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={uploadingImage}
                className="px-6 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {uploadingImage ? 'Uploading...' : editingId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
