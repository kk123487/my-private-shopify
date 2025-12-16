
import styles from './discount-codes.module.css';
import StoreLayout from '../StoreLayout';
import { useState, useEffect } from 'react';

export default function DiscountCodesPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [amount, setAmount] = useState(10);
  const [type, setType] = useState('percent');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/discount-codes')
      .then(res => res.json())
      .then(data => {
        setCodes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load codes');
        setLoading(false);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/discount-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode, amount, type }),
    });
    if (res.ok) {
      setMessage('Code created!');
      setNewCode('');
      setAmount(10);
      setType('percent');
      setCodes(await res.json());
    } else {
      setMessage('Failed to create code');
    }
  };

  return (
    <StoreLayout>
      <div className={styles.discountCodesContainer}>
        <h1>Discount Codes</h1>
        <form onSubmit={handleCreate} className={styles.discountForm}>
          <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Code" required className={styles.inputMargin} />
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={1} required className={styles.inputNumber} placeholder="Amount" />
          <select value={type} onChange={e => setType(e.target.value)} className={styles.inputMargin} title="Discount type">
            <option value="percent">%</option>
            <option value="fixed">R</option>
          </select>
          <button type="submit">Create</button>
        </form>
        {message && <p>{message}</p>}
        {loading ? <p>Loading...</p> : error ? <p className={styles.errorMsg}>{error}</p> : (
          <table className={styles.codesTable}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.amount}</td>
                  <td>{c.type}</td>
                  <td>{c.active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </StoreLayout>
  );
}
