import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL || '',
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { email, password, fullName } = req.body;
	if (!email || !password) {
		return res.status(400).json({ error: 'Email and password are required' });
	}

	// Sign up user with Supabase Auth
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
	});

	if (error || !data.user) {
		return res.status(400).json({ error: error?.message || 'Signup failed' });
	}

	// Insert user profile row
	const { error: profileError } = await supabase.from('user_profiles').insert([
		{
			id: data.user.id,
			email,
			full_name: fullName || '',
			role: 'user',
		},
	]);

	if (profileError) {
		return res.status(500).json({ error: 'User created, but failed to create user profile.' });
	}

	return res.status(200).json({ user: data.user });
}
