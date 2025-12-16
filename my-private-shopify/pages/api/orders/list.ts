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

  const { storeId } = req.query;
  if (!storeId) {
    return res.status(400).json({ error: 'Missing storeId' });
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, total, status, created_at')
    .eq('store_id', storeId);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }

  return res.status(200).json({ orders: data || [] });
}
