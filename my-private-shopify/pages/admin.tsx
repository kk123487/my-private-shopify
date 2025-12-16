

import styles from './admin.module.css';
import { withRoleAuth } from '../lib/withRoleAuth';

function AdminDashboard() {
  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <h2>Admin Dashboard</h2>
        <nav>
          <ul>
            <li><a href="/admin/teams">Team Management</a></li>
            <li><a href="/admin/stores">Store Management</a></li>
            <li><a href="/admin/products">Product Management</a></li>
            <li><a href="/admin/orders">Order Management</a></li>
            <li><a href="/admin/customers">Customer Management</a></li>
            <li><a href="/admin/users">User Management</a></li>
            <li><a href="/admin/analytics">Platform Analytics</a></li>
          </ul>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        <h1>Welcome, Admin!</h1>
        <p>Use the navigation to manage teams, stores, users, and view analytics.</p>
      </main>
    </div>
  );
}

export default withRoleAuth(AdminDashboard, ['super_admin', 'store_admin']);
