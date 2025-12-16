import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { teamId, email, role = 'member', invitedBy } = req.body;
  if (!teamId || !email || !invitedBy) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: 'User not found. Ask them to sign up first.' });
  }

  // Add to team_members
  const { error: insertError } = await supabase.from('team_members').insert([
    {
      team_id: teamId,
      user_id: user.id,
      role,
      invited_by: invitedBy,
    },
  ]);

  if (insertError) {
    return res.status(500).json({ error: 'Failed to add user to team.' });
  }

  return res.status(200).json({ message: 'User invited successfully!' });
}
