import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { teamId } = req.query;
  if (!teamId) {
    return res.status(400).json({ error: 'Missing teamId' });
  }

  // Get team members and their emails/roles
  const { data, error } = await supabase
    .from('team_members')
    .select('id, role, user_profiles (email)')
    .eq('team_id', teamId);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch members' });
  }

  // Flatten member info
  const members = (data || []).map(m => ({
    id: m.id,
    email: m.user_profiles?.email || '',
    role: m.role,
  }));
  return res.status(200).json({ members });
}
