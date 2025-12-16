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

  const { name, ownerId } = req.body;
  if (!name || !ownerId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create the store
  const { data: store, error } = await supabase
    .from('stores')
    .insert([{ name, owner_id: ownerId }])
    .select()
    .single();

  if (error || !store) {
    return res.status(500).json({ error: 'Failed to create store' });
  }

  return res.status(200).json({ store });
}
