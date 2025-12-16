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

  const { ownerId } = req.query;
  if (!ownerId) {
    return res.status(400).json({ error: 'Missing ownerId' });
  }

  // Get stores for this owner
  const { data, error } = await supabase
    .from('stores')
    .select('id, name')
    .eq('owner_id', ownerId);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch stores' });
  }

  return res.status(200).json({ stores: data || [] });
}
