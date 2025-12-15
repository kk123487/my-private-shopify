import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import getSupabaseClient from '@/lib/supabaseClient';

type Store = {
  id: string;
  name: string;
  subdomain: string;
};

const CustomerRegisterPage: React.FC = () => {
  const router = useRouter();
  const { subdomain } = router.query;
  
  const [store, setStore] = useState<Store | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (signUpError) throw signUpError;
      // Redirect to login
      router.push(`/store/${subdomain}/account/login`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Account</h1>
      <form onSubmit={handleRegister} className="bg-white rounded shadow p-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">First Name</label>
          <input
            placeholder="Enter value"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
          <input
            placeholder="Enter value"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
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
        <div className="mb-4">
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
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
          <input
            placeholder="Enter value"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <span className="text-gray-600">Already have an account?</span>{' '}
        <Link href={`/store/${subdomain}/account/login`} className="text-[#008060] hover:underline">Login</Link>
      </div>
    </div>
  );
};

export default CustomerRegisterPage;
