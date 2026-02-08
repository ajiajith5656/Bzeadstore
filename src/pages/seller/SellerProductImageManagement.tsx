import React, { useEffect, useState } from 'react';
import { Upload, Trash2, Eye, Loader2, GripVertical } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// TODO: Connect to your backend image service
interface ProductImage { id: string; product_id: string; image_url: string; imageUrl: string; is_main: boolean; isMainImage: boolean; display_order: number; displayOrder: number; }
const getProductImages = async (_pid: string): Promise<ProductImage[]> => [];
const createProductImage = async (..._a: any[]): Promise<ProductImage> => ({ id: `img_${Date.now()}`, product_id: '', image_url: '', imageUrl: '', is_main: false, isMainImage: false, display_order: 0, displayOrder: 0 });
const deleteProductImage = async (..._a: any[]): Promise<boolean> => true;
const uploadProductImageFile = async (..._a: any[]): Promise<string> => '';
const setMainProductImage = async (..._a: any[]): Promise<boolean> => true;
const reorderProductImages = async (..._a: any[]): Promise<void> => {};

export const SellerProductImageManagement: React.FC = () => {
  const { user } = useAuth();
  const [sellerProducts] = useState<any[]>([
    { id: 'p1', name: 'My Product 1' },
    { id: 'p2', name: 'My Product 2' },
  ]);
  const [selectedProductId, setSelectedProductId] = useState<string>('p1');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sellerId = user?.id || 'seller1';

  useEffect(() => {
    if (selectedProductId) {
      loadImages();
    }
  }, [selectedProductId]);

  const loadImages = async () => {
    setLoading(true);
    const imageList = await getProductImages(selectedProductId);
    setImages(imageList.sort((a, b) => a.displayOrder - b.displayOrder));
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setUploading(true);
    const maxOrder = images.length > 0 ? Math.max(...images.map((img) => img.displayOrder)) : 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isMain = images.length === 0 && i === 0;

      const imageUrl = await uploadProductImageFile(selectedProductId, file, sellerId);

      if (imageUrl) {
        await createProductImage(
          selectedProductId,
          imageUrl,
          imageUrl,
          maxOrder + i + 1,
          isMain,
          sellerId,
          file.name
        );
      }
    }

    loadImages();
    setUploading(false);
  };

  const handleDelete = async (imageId: string) => {
    if (window.confirm('Delete this image?')) {
      const success = await deleteProductImage(imageId);
      if (success) {
        loadImages();
      }
    }
  };

  const handleSetMain = async (imageId: string) => {
    const oldMainImage = images.find((img) => img.isMainImage);
    const success = await setMainProductImage(
      selectedProductId,
      imageId,
      oldMainImage?.id
    );
    if (success) {
      loadImages();
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = images.findIndex((img) => img.id === draggedId);
    const targetIndex = images.findIndex((img) => img.id === targetId);

    const newImages = [...images];
    [newImages[draggedIndex], newImages[targetIndex]] = [
      newImages[targetIndex],
      newImages[draggedIndex],
    ];

    const updates = newImages.map((img, idx) => ({
      id: img.id,
      displayOrder: idx + 1,
    }));

    await reorderProductImages(updates);
    loadImages();
    setDraggedId(null);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Product Images</h1>
        <p className="text-gray-600 mb-8">Upload and manage images for your products</p>

        {/* Product Selector */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Product
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
          >
            {sellerProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow border-2 border-dashed border-green-300">
          <h2 className="text-lg font-bold mb-4">Upload Images</h2>
          <label className="cursor-pointer">
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100">
              <Upload size={20} className="text-green-600" />
              <span className="text-green-600 font-semibold">
                Click to upload product images
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </label>
          <p className="text-sm text-gray-600 mt-2">
            Maximum 10MB per file. Supports JPEG, PNG, WebP
          </p>
          {uploading && (
            <div className="flex items-center gap-2 text-green-600 mt-2">
              <Loader2 className="animate-spin" size={20} />
              <span>Uploading...</span>
            </div>
          )}
        </div>

        {/* Images Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-green-600" size={24} />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No images yet. Upload images to showcase your product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(image.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(image.id)}
                className={`relative group bg-white rounded-lg shadow-md overflow-hidden cursor-move ${
                  draggedId === image.id ? 'opacity-50' : ''
                }`}
              >
                <img
                  src={image.imageUrl}
                  alt="Product"
                  className="w-full h-48 object-cover"
                />

                <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleSetMain(image.id)}
                    className={`p-2 rounded-full ${
                      image.isMainImage
                        ? 'bg-yellow-500 text-gray-900'
                        : 'bg-gray-600 text-gray-900 opacity-0 group-hover:opacity-100'
                    }`}
                    title="Set as main image"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-2 rounded-full bg-red-600 text-gray-900 opacity-0 group-hover:opacity-100"
                    title="Delete image"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="absolute top-2 left-2 flex items-center gap-1">
                  {image.isMainImage && (
                    <span className="bg-yellow-500 text-gray-900 text-xs px-2 py-1 rounded">
                      Main
                    </span>
                  )}
                  <div className="bg-gray-200 text-gray-900 text-xs px-2 py-1 rounded flex items-center gap-1">
                    <GripVertical size={12} />
                    {image.displayOrder}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
