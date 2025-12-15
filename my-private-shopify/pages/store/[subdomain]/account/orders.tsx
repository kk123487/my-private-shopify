import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import getSupabaseClient from '@/lib/supabaseClient';

type Store = {
  id: string;
  name: string;
  subdomain: string;
};

type Order = {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  shipping_status: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  payment_method: string;
  created_at: string;
};

const OrderHistoryPage: React.FC = () => {
  const router = useRouter();
  const { subdomain } = router.query;
  
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!subdomain) return;

    const supabase = getSupabaseClient();
    try {
      // Get user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Store return URL and redirect to login
        const returnUrl = encodeURIComponent(`/store/${subdomain}/account/orders`);
        router.push(`/store/${subdomain}/account/login?returnUrl=${returnUrl}`);
        return;
      }

      // Load store
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('subdomain', subdomain as string)
        .single();
      if (storeData) setStore(storeData);

      // Load orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .eq('store_subdomain', subdomain as string)
        .order('created_at', { ascending: false });
      if (ordersData) setOrders(ordersData);
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
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Filter</label>
        <select title="Order status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <ul className="divide-y divide-gray-200">
        {orders
          .filter((order) => filter === 'all' || order.status === filter)
          .map((order) => (
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
    </div>
  );
};

export default OrderHistoryPage;
