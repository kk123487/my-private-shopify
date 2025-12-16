
import styles from './review-moderation.module.css';
import StoreLayout from '../StoreLayout';
import { useEffect, useState } from 'react';

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/all-reviews')
      .then(res => res.json())
      .then(data => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load reviews');
        setLoading(false);
      });
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'hide' | 'delete') => {
    await fetch('/api/review-moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    setReviews(reviews => reviews.map(r => r.id === id ? { ...r, status: action === 'approve' ? 'approved' : action === 'hide' ? 'hidden' : 'deleted' } : r));
  };

  return (
    <StoreLayout>
      <div className={styles.reviewModerationContainer}>
        <h1>Review Moderation</h1>
        {loading ? <p>Loading...</p> : error ? <p className={styles.errorMsg}>{error}</p> : (
          <table className={styles.reviewTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id} className={r.status === 'deleted' ? styles.deletedRow : undefined}>
                  <td>{r.name}</td>
                  <td>{'★'.repeat(r.rating)}</td>
                  <td>{r.comment}</td>
                  <td>{r.status || 'pending'}</td>
                  <td>
                    {r.status !== 'approved' && (
                      <button onClick={() => handleAction(r.id, 'approve')} aria-label={`Approve review by ${r.name}`}>Approve</button>
                    )}
                    {r.status !== 'hidden' && (
                      <button onClick={() => handleAction(r.id, 'hide')} aria-label={`Hide review by ${r.name}`}>Hide</button>
                    )}
                    {r.status !== 'deleted' && (
                      <button onClick={() => handleAction(r.id, 'delete')} aria-label={`Delete review by ${r.name}`}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </StoreLayout>
  );
}
