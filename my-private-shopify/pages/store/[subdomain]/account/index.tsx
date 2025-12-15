import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import getSupabaseClient from '@/lib/supabaseClient';

type Store = {
  id: string;
  name: string;
  subdomain: string;
};

type User = {
  id: string;
  email: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
};

type OrderStats = {
  total: number;
  pending: number;
  totalSpent: number;
};

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
};

const AccountDashboardPage: React.FC = () => {
  const router = useRouter();
  const { subdomain } = router.query;
  
  const [store, setStore] = useState<Store | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({ total: 0, pending: 0, totalSpent: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!subdomain) return;

    const supabase = getSupabaseClient();
    try {
      // Get user session
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (!sessionUser) {
        // Store return URL and redirect to login
        const returnUrl = encodeURIComponent(`/store/${subdomain}/account`);
        router.push(`/store/${subdomain}/account/login?returnUrl=${returnUrl}`);
        return;
      }
      setUser(sessionUser as User);

      // Load store
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('subdomain', subdomain as string)
        .single();
      if (storeData) setStore(storeData);

      // Load order stats
      const { data: statsData } = await supabase.rpc('get_order_stats', { store_subdomain: subdomain });
      if (statsData) setOrderStats(statsData);

      // Load recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', sessionUser.id)
        .eq('store_subdomain', subdomain as string)
        .order('created_at', { ascending: false })
        .limit(5);
      if (ordersData) setRecentOrders(ordersData);
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [subdomain, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Account Dashboard</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Welcome, {user?.user_metadata?.first_name || user?.email}</h2>
        <p className="text-gray-600">Store: {store?.name}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded shadow p-6">
          <div className="text-2xl font-bold">{orderStats.total}</div>
          <div className="text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white rounded shadow p-6">
          <div className="text-2xl font-bold">{orderStats.pending}</div>
          <div className="text-gray-600">Pending Orders</div>
        </div>
        <div className="bg-white rounded shadow p-6">
          <div className="text-2xl font-bold">R{orderStats.totalSpent.toFixed(2)}</div>
          <div className="text-gray-600">Total Spent</div>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-600">No recent orders.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <li key={order.id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">Order #{order.id}</div>
                  <div className="text-gray-600 text-sm">{new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">R{order.total.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{order.status}</div>
                  <Link href={`/store/${subdomain}/account/orders/${order.id}`} className="text-[#008060] hover:underline ml-4">View</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-4">
        <Link href={`/store/${subdomain}/account/orders`} className="px-4 py-2 bg-[#008060] text-white rounded hover:bg-[#006E52]">Order History</Link>
        <Link href={`/store/${subdomain}/account/addresses`} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Addresses</Link>
        <Link href={`/store/${subdomain}/account/settings`} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Settings</Link>
        <Link href={`/store/${subdomain}/account/wishlist`} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Wishlist</Link>
      </div>
    </div>
  );
};

export default AccountDashboardPage;
