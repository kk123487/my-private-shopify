
import React, { useState, useEffect } from 'react';
import { withRoleAuth } from '../../lib/withRoleAuth';
import { useAuth } from '../../lib/useAuth';
import styles from './products.module.css';

interface Store {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
}

function ProductsPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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

  // Fetch products for selected store
  useEffect(() => {
    if (!selectedStore) return;
    fetch(`/api/products/list?storeId=${selectedStore}`)
      .then(res => res.json())
      .then(data => setProducts(data.products || []));
  }, [selectedStore]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: selectedStore, name, description, price, imageUrl }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('Product added!');
      setName(''); setDescription(''); setPrice(''); setImageUrl('');
      // Refresh products
      fetch(`/api/products/list?storeId=${selectedStore}`)
        .then(res => res.json())
        .then(data => setProducts(data.products || []));
    } else {
      setMessage(data.error || 'Failed to add product.');
    }
  };

  return (
    <div className={styles.productsContainer}>
      <h1>Product Management</h1>
      <form onSubmit={handleAddProduct} className={styles.formWithMargin}>
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
          Description:
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={styles.inputWithMargin}
          />
        </label>
        <label>
          Price:
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            className={styles.inputWithMargin}
          />
        </label>
        <label>
          Image URL:
          <input
            type="text"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            className={styles.inputWithMargin}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
      {message && <p>{message}</p>}
      <h2>Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <strong>{product.name}</strong> - R{product.price}
            {product.description && <> | {product.description}</>}
            {product.image_url && <><br /><img src={product.image_url} alt={product.name} className={styles.productImage} /></>}
          </li>
        ))}
      </ul>
      <p>Add and manage products for your selected store here!</p>
    </div>
  );
}

export default withRoleAuth(ProductsPage, ['super_admin', 'store_admin']);
