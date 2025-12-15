import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import getSupabaseClient from '@/lib/supabaseClient';

type Store = {
  id: string;
  name: string;
  subdomain: string;
};

const CustomerLoginPage: React.FC = () => {
  const router = useRouter();
  const { subdomain } = router.query;
  
  const [store, setStore] = useState<Store | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStore = useCallback(async () => {
    if (!subdomain) return;
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('subdomain', subdomain as string)
      .single();
    if (data) setStore(data);
  }, [subdomain]);

  React.useEffect(() => {
    loadStore();
  }, [loadStore]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseClient();
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      // Redirect to return URL or account dashboard
      const returnUrl = router.query.returnUrl as string;
      const destination = returnUrl ? decodeURIComponent(returnUrl) : `/store/${subdomain}/account`;
      router.push(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Customer Login</h1>
      <form onSubmit={handleLogin} className="bg-white rounded shadow p-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Email</label>
          <input
            placeholder="Enter value"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Password</label>
          <input
            placeholder="Enter value"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full bg-[#008060] text-white py-3 rounded font-semibold hover:bg-[#006E52]"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <span className="text-gray-600">Don't have an account?</span>{' '}
        <Link href={`/store/${subdomain}/account/register`} className="text-[#008060] hover:underline">Register</Link>
      </div>
    </div>
  );
};

export default CustomerLoginPage;
