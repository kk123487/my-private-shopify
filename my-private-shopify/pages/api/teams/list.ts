import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Get teams for this user
  const { data: memberships, error } = await supabase
    .from('team_members')
    .select('team_id, teams (id, name)')
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch teams' });
  }

  // Flatten and return team info
  const teams = (memberships || []).map(m => m.teams).filter(Boolean);
  return res.status(200).json({ teams });
}
