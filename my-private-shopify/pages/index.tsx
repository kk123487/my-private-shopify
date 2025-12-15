import React from 'react';
import Link from 'next/link';
import styles from './index.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <h1>Welcome to My Private Shopify</h1>
      <p>Your minimal, private, free Shopify-like platform for South Africa is running!</p>
      <div className={styles.quickAccess}>
        <h2>Quick Access</h2>
        <ul className={styles.quickList}>
          <li>
            <Link href="/admin/users">Admin Dashboard</Link>
          </li>
          <li>
            <Link href="/store/test-store">Storefront Example</Link>
          </li>
          <li>
            <Link href="/super-admin">Super Admin</Link>
          </li>
          <li>
            <Link href="/auth/login">Login</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
