import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { withRoleAuth } from '../../lib/withRoleAuth';
import { useAuth } from '../../lib/useAuth';
import styles from './orders.module.css';

function OrdersPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState('');
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch stores for this user
  useEffect(() => {
    if (!user) return;
    fetch(`/api/stores/list?ownerId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setStores(data.stores || []);
        if (data.stores && data.stores.length > 0) {
          setSelectedStore(data.stores[0].id);
        }
      });
  }, [user]);

  // Fetch orders for selected store
  useEffect(() => {
    if (!selectedStore) return;
    fetch(`/api/orders/list?storeId=${selectedStore}`)
      .then(res => res.json())
      .then(data => setOrders(data.orders || []));
  }, [selectedStore]);

  const handleCreateOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setMessage('User not authenticated.');
      return;
    }
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: selectedStore, userId: user.id, total, status }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('Order created!');
      setTotal('');
      setStatus('pending');
      // Refresh orders
      fetch(`/api/orders/list?storeId=${selectedStore}`)
        .then(res => res.json())
        .then(data => setOrders(data.orders || []));
    } else {
      setMessage(data.error || 'Failed to create order.');
    }
  };

  // Update order status handler
  const handleStatusChange = async (order: any, e: ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setLoading(true);
    setMessage('');
    let customerEmail = order.customer_email;
    if (!customerEmail) {
      try {
        const res = await fetch(`/api/store/${order.store_subdomain}/orders/${order.id}`);
        const data = await res.json();
        customerEmail = data.order?.customer_email;
      } catch {}
    }
    const res = await fetch(`/api/store/${order.store_subdomain}/orders/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, customerEmail }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage('Order status updated!');
      fetch(`/api/orders/list?storeId=${selectedStore}`)
        .then(res => res.json())
        .then(data => setOrders(data.orders || []));
    } else {
      setMessage('Failed to update order status.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Order Management</h1>
      <form onSubmit={handleCreateOrder} className={styles.form}>
        <label htmlFor="storeSelect">Select Store:</label>
        <select
          id="storeSelect"
          className={styles.select}
          value={selectedStore}
          onChange={e => setSelectedStore(e.target.value)}
          required
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
        <label htmlFor="orderTotal">Total (R):</label>
        <input
          id="orderTotal"
          className={styles.input}
          type="number"
          value={total}
          onChange={e => setTotal(e.target.value)}
          required
        />
        <label htmlFor="orderStatus">Status:</label>
        <select
          id="orderStatus"
          className={styles.select}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Order'}
        </button>
      </form>
      {message && <p className={styles.message} role="status">{message}</p>}
      <h2>Orders</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Total</th>
            <th>Status</th>
            <th>Placed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>R{order.total}</td>
              <td>{order.status}</td>
              <td>{order.created_at?.slice(0,10)}</td>
              <td>
                <label htmlFor={`statusSelect-${order.id}`} className="sr-only">Update status for order {order.id}</label>
                <select
                  id={`statusSelect-${order.id}`}
                  className={styles.statusSelect}
                  value={order.status}
                  onChange={e => handleStatusChange(order, e)}
                  disabled={loading}
                  aria-label={`Update status for order ${order.id}`}
                  title={`Update status for order ${order.id}`}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Create and manage orders for your selected store here!</p>
    </div>
  );
}

export default withRoleAuth(OrdersPage, ['super_admin', 'store_admin']);
