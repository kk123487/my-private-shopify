import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
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

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
};

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
};

const CustomerOrderDetailPage: React.FC = () => {
  const router = useRouter();
  const { subdomain, orderId } = router.query;
  
  const [store, setStore] = useState<Store | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const loadData = useCallback(async () => {
    if (!subdomain || !orderId) return;
    
    setLoading(true);
    setError(null);
    const supabase = getSupabaseClient();
    try {
      // Check auth status
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        const returnUrl = encodeURIComponent(`/store/${subdomain}/account/orders/${orderId}`);
        router.push(`/store/${subdomain}/account/login?returnUrl=${returnUrl}`);
        return;
      }
      setUser(authUser as User);

      // Load store
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('subdomain', subdomain as string)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Load order (verify it belongs to this customer)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId as string)
        .eq('store_subdomain', subdomain as string)
        .eq('customer_email', authUser.email)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Load order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId as string);

      if (itemsError) {
        setOrderItems([]);
      } else {
        setOrderItems(itemsData || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading order');
    } finally {
      setLoading(false);
    }
  }, [subdomain, orderId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setShowAccountMenu(false);
  };

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin inline-block">⏳</div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order || !store) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href={`/store/${subdomain}`} className="text-2xl font-bold text-gray-900">
                {store?.name || 'Store'}
              </Link>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
            <p className="text-gray-600 mb-6">{error || 'This order does not exist or you do not have permission to view it'}</p>
            <Link
              href={`/store/${subdomain}/account/orders`}
              className="inline-block px-6 py-3 bg-[#008060] text-white rounded-lg font-semibold hover:bg-[#006E52]"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = order.total / 1.15 / (order.total > 500 ? 1 : 1.075);
  const tax = subtotal * 0.15;
  const shipping = order.total > 500 ? 0 : 75;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/store/${subdomain}`} className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">{store.name}</span>
            </Link>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    <span className="text-xl">👤</span>
                    <span className="hidden md:inline">{user.user_metadata?.first_name || 'Account'}</span>
                  </button>
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-2 z-50">
                      <Link
                        href={`/store/${subdomain}/account`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        href={`/store/${subdomain}/account/orders`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        Order History
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/store/${subdomain}/account`} className="text-gray-600 hover:text-gray-900">
            Account
          </Link>
          <span className="text-gray-400">›</span>
          <Link href={`/store/${subdomain}/account/orders`} className="text-gray-600 hover:text-gray-900">
            Orders
          </Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-semibold">Order Details</span>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-600">
                Placed on {new Date(order.created_at).toLocaleDateString('en-ZA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-600 mb-1">Payment Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {order.payment_status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Shipping Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                order.shipping_status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.shipping_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                order.shipping_status === 'processing' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {order.shipping_status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Payment Method</p>
              <p className="text-sm font-semibold text-gray-900">{order.payment_method}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>

              {orderItems.length > 0 ? (
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      {item.image_url ? (
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <Image
                            src={item.image_url}
                            alt={item.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-600">Order items details not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            {/* Order Total */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (15%)</span>
                  <span className="text-gray-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Shipping Address</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">{order.customer_name}</p>
                {order.shipping_address && <p>{order.shipping_address}</p>}
                {(order.shipping_city || order.shipping_postal_code) && (
                  <p>
                    {order.shipping_city}
                    {order.shipping_city && order.shipping_postal_code && ', '}
                    {order.shipping_postal_code}
                  </p>
                )}
                <p>South Africa</p>
                {order.customer_phone && (
                  <p className="pt-2 text-gray-600">📞 {order.customer_phone}</p>
                )}
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-xs text-gray-600 mb-3">
                Questions about this order? Contact our support team.
              </p>
              <Link
                href={`/store/${subdomain}/contact`}
                className="block w-full px-4 py-2 bg-[#008060] text-white text-center rounded-lg font-semibold hover:bg-[#006E52] transition-colors text-sm"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <Link
            href={`/store/${subdomain}/account/orders`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span>←</span>
            <span>Back to All Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderDetailPage;
