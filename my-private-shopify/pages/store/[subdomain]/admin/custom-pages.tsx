import React, { useState, useEffect } from 'react';
import styles from './custom-pages.module.css';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import StoreLayout from '../StoreLayout';

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export default function CustomPagesAdmin() {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch custom pages
  useEffect(() => {
    fetch('/api/custom-pages')
      .then(res => res.json())
      .then(data => setPages(Array.isArray(data) ? data : []));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/custom-pages', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, title, slug, content }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('Page saved!');
      setTitle(''); setSlug(''); setContent(''); setEditingId(null);
      setPages(data.pages || []);
    } else {
      setMessage(data.error || 'Failed to save page.');
    }
  };

  const handleEdit = (page: CustomPage) => {
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this page?')) return;
    setLoading(true);
    setMessage('');
    const res = await fetch('/api/custom-pages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage('Page deleted.');
      setPages(data.pages || []);
    } else {
      setMessage(data.error || 'Failed to delete page.');
    }
  };

  return (
    <StoreLayout>
      <div className={styles.container}>
        <h1>Custom Pages</h1>
        <form onSubmit={handleSave} className={styles.form}>
          <label>
            Title:
            <input value={title} onChange={e => setTitle(e.target.value)} required className={styles.input} />
          </label>
          <label>
            Slug:
            <input value={slug} onChange={e => setSlug(e.target.value)} required className={styles.input} placeholder="about, faq, etc." />
          </label>
          <label className={styles.label}>
            Content:
            <div className={styles.quillWrapper}>
              <ReactQuill
                value={content}
                onChange={setContent}
                theme="snow"
              />
            </div>
          </label>
          <button type="submit" disabled={loading} aria-label={editingId ? 'Update page' : 'Create page'}>{editingId ? 'Update' : 'Create'} Page</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setTitle(''); setSlug(''); setContent(''); }}>Cancel</button>}
        </form>
        {message && <p>{message}</p>}
        <h2>Existing Pages</h2>
        <ul>
          {pages.map(page => (
            <li key={page.id} className={styles.pageItem}>
              <strong>{page.title}</strong> (<code>/{page.slug}</code>)
              <button className={styles.editButton} onClick={() => handleEdit(page)} aria-label={`Edit page ${page.title}`}>Edit</button>
              <button className={styles.deleteButton} onClick={() => handleDelete(page.id)} aria-label={`Delete page ${page.title}`}>Delete</button>
            </li>
          ))}
        </ul>
        <p>Custom pages will be visible at <code>/store/[subdomain]/{'{slug}'}</code>.</p>
      </div>
    </StoreLayout>
  );
}
