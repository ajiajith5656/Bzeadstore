import React, { useEffect, useState } from 'react';
import { logger } from '../../../utils/logger';
import { Loading, ErrorMessage } from '../components/StatusIndicators';
import type { DashboardData } from '../../../types';


// GraphQL queries
// TODO: Backend stubs — connect to your API
const client = { graphql: async (_opts: any): Promise<any> => ({ data: {} }) };

const listUsersQuery = `
  query ListUsers {
    listUsers {
      items {
        userId
        profile_type
        created_at
      }
    }
  }
`;

const listCategoriesQuery = `
  query ListCategories {
    listCategories {
      items {
        categoryId
        name
      }
    }
  }
`;

const listProductsQuery = `
  query ListProducts {
    listProducts {
      items {
        productId
        name
        status
      }
    }
  }
`;

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-2xl opacity-20">{icon}</div>
      </div>
    </div>
  );
};

export const AdminOverview: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const metrics = data?.metrics;

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch users
        const usersResponse: any = await client.graphql({
          query: listUsersQuery,
          authMode: 'apiKey',
        });
        const users = usersResponse.data.listUsers.items || [];

        // Fetch categories
        const categoriesResponse: any = await client.graphql({
          query: listCategoriesQuery,
          authMode: 'apiKey',
        });
        const categories = categoriesResponse.data.listCategories.items || [];

        // Fetch products
        const productsResponse: any = await client.graphql({
          query: listProductsQuery,
          authMode: 'apiKey',
        });
        const products = productsResponse.data.listProducts.items || [];

        // Calculate metrics
        const totalUsers = users.filter((u: any) => u.profile_type !== 'seller' && u.profile_type !== 'admin').length;
        const totalSellers = users.filter((u: any) => u.profile_type === 'seller').length;
        const primeMembers = users.filter((u: any) => u.profile_type === 'prime').length;
        const totalProducts = products.length;

        // Get current month registrations
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const userRegistrationsThisMonth = users.filter((u: any) => {
          if (!u.created_at) return false;
          const date = new Date(u.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;

        const sellerRegistrationsThisMonth = users.filter((u: any) => {
          if (!u.created_at || u.profile_type !== 'seller') return false;
          const date = new Date(u.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;

        setData({
          metrics: {
            total_sales: 0, // TODO: Add orders table
            total_expenses: 0, // TODO: Add expenses tracking
            total_products: totalProducts,
            total_users: totalUsers,
            total_sellers: totalSellers,
            total_bookings: 0, // TODO: Add orders table
            ongoing_orders: 0, // TODO: Add orders table
            returns_cancellations: 0, // TODO: Add returns tracking
          },
          user_registrations: userRegistrationsThisMonth,
          prime_members: primeMembers,
          seller_registrations: sellerRegistrationsThisMonth,
          top_categories: categories.slice(0, 5).map((c: any) => ({
            id: c.categoryId,
            name: c.name,
          })),
          top_sellers: [], // TODO: Add seller revenue tracking
        });

        setError(null);
      } catch (err) {
        logger.error(err as Error, { context: 'Error loading dashboard data' });
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <Loading message="Loading dashboard metrics..." />;

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      {/* Business Metrics */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Business Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Sales"
            value={metrics ? `$${metrics.total_sales.toLocaleString()}` : '$0'}
            icon="💰"
            color="border-green-500"
          />
          <MetricCard
            title="Total Expenses"
            value={metrics ? `$${metrics.total_expenses.toLocaleString()}` : '$0'}
            icon="📊"
            color="border-red-500"
          />
          <MetricCard
            title="Total Products"
            value={metrics?.total_products ?? 0}
            icon="📦"
            color="border-blue-500"
          />
          <MetricCard
            title="Total Users"
            value={metrics?.total_users ?? 0}
            icon="👥"
            color="border-purple-500"
          />
          <MetricCard
            title="Total Sellers"
            value={metrics?.total_sellers ?? 0}
            icon="🏪"
            color="border-orange-500"
          />
          <MetricCard
            title="Total Bookings"
            value={metrics?.total_bookings ?? 0}
            icon="🛒"
            color="border-indigo-500"
          />
          <MetricCard
            title="Ongoing Orders"
            value={metrics?.ongoing_orders ?? 0}
            icon="📦"
            color="border-yellow-500"
          />
          <MetricCard
            title="Returns & Cancellations"
            value={metrics?.returns_cancellations ?? 0}
            icon="↩️"
            color="border-pink-500"
          />
        </div>
      </div>

      {/* User & Seller Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">User Registrations (This Month)</h3>
          <p className="text-2xl font-bold text-blue-600">{data?.user_registrations || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Prime Members</h3>
          <p className="text-2xl font-bold text-purple-600">{data?.prime_members || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Seller Registrations (This Month)</h3>
          <p className="text-2xl font-bold text-orange-600">{data?.seller_registrations || 0}</p>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Movement Categories</h3>
        {data?.top_categories && data.top_categories.length > 0 ? (
          <div className="space-y-2">
            {data.top_categories.slice(0, 5).map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                <span className="font-medium text-gray-700">{category.name}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No categories available</p>
        )}
      </div>

      {/* Top Sellers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Sellers (by Revenue)</h3>
        {data?.top_sellers && data.top_sellers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Shop Name</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Badge</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.top_sellers.slice(0, 5).map((seller) => (
                  <tr key={seller.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{seller.shop_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        seller.badge === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                        seller.badge === 'platinum' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {seller.badge?.toUpperCase() || 'STANDARD'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">${seller.total_revenue?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{seller.total_orders || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No sellers available</p>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
