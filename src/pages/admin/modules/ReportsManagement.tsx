import React, { useState } from 'react';
import { ErrorMessage, SuccessMessage } from '../components/StatusIndicators';

// TODO: Backend stubs — connect to your API
const adminApiService = {
  getAllSellers: async () => [],
  updateSellerKYC: async (..._a: any[]) => ({}),
  updateSellerBadge: async (..._a: any[]) => ({}),
  getAllComplaints: async () => [],
  updateComplaintStatus: async (..._a: any[]) => ({}),
  getAllReviews: async () => [],
  flagReview: async (..._a: any[]) => ({}),
  deleteReview: async (..._a: any[]) => ({}),
  getAccountSummary: async () => ({}),
  getDaybook: async () => [],
  getBankBook: async () => [],
  getAccountHeads: async () => [],
  getExpenses: async () => [],
  getSellerPayouts: async () => [],
  getMembershipPlans: async () => [],
  getTaxRules: async () => [],
  getPlatformCosts: async () => [],
  generateReport: async (..._a: any[]) => new Blob(),
  getAllOrders: async () => [],
  updateOrderStatus: async (..._a: any[]) => ({}),
  processRefund: async (..._a: any[]) => ({}),
  getAllCategories: async () => [],
  createProduct: async (..._a: any[]) => ({}),
  getAllCountries: async () => [],
  getAllBanners: async () => [],
  updateBanner: async (..._a: any[]) => ({}),
  createBanner: async (..._a: any[]) => ({}),
  deleteBanner: async (..._a: any[]) => ({}),
  getAllPromotions: async () => [],
  getAdminProfile: async () => ({ name: 'Admin', email: '', role: 'admin' }),
};

export const ReportsManagement: React.FC = () => {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const blob = await adminApiService.generateReport(reportType, {
        dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
        category: category || undefined,
        country: country || undefined,
        format,
      });

      if (!blob) {
        setError('Failed to generate report');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beauzead-${reportType}-report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setSuccess('Report generated and downloaded successfully');
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Reports</h2>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
            >
              <option value="sales">Sales</option>
              <option value="orders">Orders</option>
              <option value="users">Users</option>
              <option value="sellers">Sellers</option>
              <option value="products">Products</option>
              <option value="finance">Finance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'csv' | 'excel' | 'pdf')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={loading || (!!startDate && !endDate) || (!startDate && !!endDate)}
            className="px-6 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;
