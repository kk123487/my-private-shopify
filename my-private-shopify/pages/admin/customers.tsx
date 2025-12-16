
import React, { useState, useEffect } from 'react';
import { withRoleAuth } from '../../lib/withRoleAuth';
import { useAuth } from '../../lib/useAuth';
import styles from './customers.module.css';

interface Store {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

function CustomersPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

  // Fetch customers for selected store
  useEffect(() => {
    if (!selectedStore) return;
    fetch(`/api/customers/list?storeId=${selectedStore}`)
      .then(res => res.json())
      .then(data => setCustomers(data.customers || []));
  }, [selectedStore]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/customers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: selectedStore, name, email, phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('Customer added!');
      setName(''); setEmail(''); setPhone('');
      // Refresh customers
      fetch(`/api/customers/list?storeId=${selectedStore}`)
        .then(res => res.json())
        .then(data => setCustomers(data.customers || []));
    } else {
      setMessage(data.error || 'Failed to add customer.');
    }
  };

  return (
    <div className={styles.customersContainer}>
      <h1>Customer Management</h1>
      <form onSubmit={handleAddCustomer} className={styles.formWithMargin}>
        <label>
          Select Store:
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            required
            className={styles.inputWithMargin}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className={styles.inputWithMargin}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={styles.inputWithMargin}
          />
        </label>
        <label>
          Phone:
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className={styles.inputWithMargin}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Customer'}
        </button>
      </form>
      {message && <p>{message}</p>}
      <h2>Customers</h2>
      <ul>
        {customers.map((customer) => (
          <li key={customer.id}>
            <strong>{customer.name}</strong> | {customer.email} {customer.phone && <>| {customer.phone}</>}
          </li>
        ))}
      </ul>
      <p>Add and manage customers for your selected store here!</p>
    </div>
  );
}

export default withRoleAuth(CustomersPage, ['super_admin', 'store_admin']);
