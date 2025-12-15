import React from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './admin.module.css';

export default function AdminDashboard() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Admin Dashboard</h1>
      <p className={styles.info}>Welcome to the admin dashboard. Here you can manage your store, products, and users.</p>
      {/* Add your admin dashboard features here */}
    </div>
  );
}
