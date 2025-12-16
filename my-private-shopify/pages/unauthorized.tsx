import React from 'react';
import styles from './unauthorized.module.css';

export default function Unauthorized() {
  return (
    <div className={styles.unauthorizedContainer}>
      <h1>Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
    </div>
  );
}
