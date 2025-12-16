import React from 'react';
import { withRoleAuth } from '../../lib/withRoleAuth';
import styles from './analytics.module.css';

function AnalyticsPage() {
  return (
    <div className={styles.analyticsContainer}>
      <h1>Platform Analytics</h1>
      <p>Here you will be able to view platform analytics and reports. (Feature coming soon!)</p>
    </div>
  );
}

export default withRoleAuth(AnalyticsPage, ['super_admin', 'store_admin']);
