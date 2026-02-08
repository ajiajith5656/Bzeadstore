import React, { useEffect, useState } from 'react';
import { Loading, ErrorMessage } from '../components/StatusIndicators';
import type { Admin } from '../../../types';

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
  generateReport: async (..._a: any[]) => ({}),
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
  getAdminProfile: async () => ({ id: '', email: '', full_name: 'Admin', phone: '', created_at: new Date().toISOString(), permissions: [], is_active: true } as any),
};

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await adminApiService.getAdminProfile();
        if (result) {
          setProfile(result);
          setError(null);
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <Loading message="Loading profile..." />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Profile</h2>

      {error && <ErrorMessage message={error} />}

      {profile && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Admin Name</p>
              <p className="text-lg font-semibold text-gray-900">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-semibold text-gray-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">UID</p>
              <p className="text-lg font-semibold text-gray-900">{profile.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
