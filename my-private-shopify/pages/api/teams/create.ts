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

  const { name, userId } = req.body;
  if (!name || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create the team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert([{ name, created_by: userId }])
    .select()
    .single();

  if (teamError || !team) {
    return res.status(500).json({ error: 'Failed to create team' });
  }

  // Add creator as team admin
  const { error: memberError } = await supabase.from('team_members').insert([
    {
      team_id: team.id,
      user_id: userId,
      role: 'admin',
      invited_by: userId,
    },
  ]);

  if (memberError) {
    return res.status(500).json({ error: 'Team created, but failed to add creator as admin.' });
  }

  return res.status(200).json({ team });
}
