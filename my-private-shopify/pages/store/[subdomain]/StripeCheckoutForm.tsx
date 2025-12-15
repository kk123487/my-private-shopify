"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from './StripeCheckoutForm.module.css';

export interface CheckoutFormProps {
  subdomain: string;
  customerEmail: string;
  paymentIntentId: string;
}

const StripeCheckoutForm: React.FC<CheckoutFormProps> = ({ 
  subdomain, 
  customerEmail, 
  paymentIntentId
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostal, setShippingPostal] = useState('');
  const [shippingCountry, setShippingCountry] = useState('US');

  // Stripe functionality disabled for local testing
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('Stripe payments are disabled for local testing.');
  };

  return (
    <form className={styles.checkoutForm} onSubmit={handleSubmit}>
      <div>
        <label className={styles.label}>Full Name *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Full Name"
          className={styles.input}
        />
      </div>

      <div>
        <label className={styles.label}>Email *</label>
        <input
          type="email"
          value={customerEmail}
          readOnly
          placeholder="Email"
          className={`${styles.input} ${styles.inputReadOnly}`}
        />
      </div>

      <div>
        <label className={styles.label}>Shipping Address *</label>
        <input
          type="text"
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
          placeholder="Street address"
          required
          className={styles.input}
        />
        <input
          type="text"
          value={shippingCity}
          onChange={(e) => setShippingCity(e.target.value)}
          placeholder="City"
          required
          className={styles.input}
        />
        <input
          type="text"
          value={shippingPostal}
          onChange={(e) => setShippingPostal(e.target.value)}
          placeholder="Postal code"
          required
          className={styles.input}
        />
        <input
          type="text"
          value={shippingCountry}
          onChange={(e) => setShippingCountry(e.target.value)}
          placeholder="Country"
          required
          className={styles.input}
        />
      </div>

      {/* Stripe PaymentElement removed for local testing */}

      {error && <p className={styles.error}>{error}</p>}

      <button
        type="submit"
        className={`${styles.submitButton} ${loading ? styles.buttonLoading : ''}`}
        disabled={loading}
      >
        {loading ? 'Processing…' : 'Pay Now'}
      </button>
    </form>
  );
};

export default StripeCheckoutForm;
