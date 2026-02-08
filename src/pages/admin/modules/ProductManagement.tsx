import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, CheckCircle, XCircle, Power, Plus, X } from 'lucide-react';
import type { Product } from '../../../types';
import { logger } from '../../../utils/logger';


// TODO: Backend stubs — connect to your API
const client = { graphql: async (_opts: any): Promise<any> => ({ data: {} }) };

const listProductsQuery = `
  query ListProducts($limit: Int, $nextToken: String) {
    listProducts(limit: $limit, nextToken: $nextToken) {
      items {
        id
        productId
        name
        slug
        description
        category
        price
        discount_price
        stock
        sku
        brand
        images
        seller_id
        approval_status
        is_active
        is_featured
        tags
        created_at
        updated_at
      }
      nextToken
    }
  }
`;

const approveProductMutation = `
  mutation ApproveProduct($id: ID!) {
    approveProduct(id: $id) {
      id
      productId
      approval_status
      updated_at
    }
  }
`;

const rejectProductMutation = `
  mutation RejectProduct($id: ID!) {
    rejectProduct(id: $id) {
      id
      productId
      approval_status
      updated_at
    }
  }
`;

const toggleProductStatusMutation = `
  mutation ToggleProductStatus($id: ID!) {
    toggleProductStatus(id: $id) {
      id
      productId
      is_active
      updated_at
    }
  }
`;

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

export const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 50,
    total: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result: any = await client.graphql({
        query: listProductsQuery,
        authMode: 'apiKey',
        variables: {
          limit: pagination.limit,
          nextToken: nextToken,
        },
      });

      if (result.data?.listProducts) {
        const items = result.data.listProducts.items || [];
        setProducts(items);
        setNextToken(result.data.listProducts.nextToken);
        setPagination((prev) => ({ ...prev, total: items.length }));
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
      logger.error(err as Error, { context: 'Error fetching products' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId: string) => {
    try {
      setActionLoading(productId);
      await client.graphql({
        query: approveProductMutation,
        authMode: 'apiKey',
        variables: { id: productId },
      });
      setSuccess('Product approved successfully');
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to approve product');
      logger.error(err as Error, { context: 'Error approving product' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (productId: string) => {
    try {
      setActionLoading(productId);
      await client.graphql({
        query: rejectProductMutation,
        authMode: 'apiKey',
        variables: { id: productId },
      });
      setSuccess('Product rejected');
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to reject product');
      logger.error(err as Error, { context: 'Error rejecting product' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (productId: string) => {
    try {
      setActionLoading(productId);
      await client.graphql({
        query: toggleProductStatusMutation,
        authMode: 'apiKey',
        variables: { id: productId },
      });
      setSuccess('Product status updated');
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to update product status');
      logger.error(err as Error, { context: 'Error toggling product status' });
    } finally {
      setActionLoading(null);
    }
  };

  // Client-side filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesApproval = !approvalFilter || product.approval_status === approvalFilter;
    const matchesCategory = !categoryFilter || product.category === categoryFilter;

    return matchesSearch && matchesApproval && matchesCategory;
  });

  const totalPages = Math.ceil(filteredProducts.length / pagination.limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-600">Total Products: {filteredProducts.length}</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus size={20} />
          Add New Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
            />
          </div>

          <select
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
          >
            <option value="">All Approval Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home</option>
            <option value="beauty">Beauty</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Approval</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.productId || product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        {product.images && product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        )}
                        <div>
                          <div>{product.name}</div>
                          {product.sku && <div className="text-xs text-gray-500">SKU: {product.sku}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.category || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ${product.price?.toFixed(2) || '0.00'}
                      {product.discount_price && (
                        <div className="text-xs text-green-600">${product.discount_price.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.stock || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        product.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                        product.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(product.approval_status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowDetails(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {product.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(product.productId || product.id)}
                              disabled={actionLoading === (product.productId || product.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(product.productId || product.id)}
                              disabled={actionLoading === (product.productId || product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleToggleStatus(product.productId || product.id)}
                          disabled={actionLoading === (product.productId || product.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50"
                          title="Toggle Status"
                        >
                          <Power size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {totalPages}
          </span>

          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
            disabled={pagination.page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetails && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Product Name</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SKU</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.sku || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sub Category</p>
                  <p className="text-lg font-semibold text-gray-900">N/A</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="text-lg font-semibold text-gray-900">${selectedProduct.price?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.stock || 0} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Brand</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.brand || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Discount Price</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedProduct.discount_price ? `$${selectedProduct.discount_price.toFixed(2)}` : 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-700 mt-1">{selectedProduct.description}</p>
              </div>

              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Images</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedProduct.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Product ${idx}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
