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

  const { storeId, name, email, phone } = req.body;
  if (!storeId || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert([{ store_id: storeId, name, email, phone }])
    .select()
    .single();

  if (error || !customer) {
    return res.status(500).json({ error: 'Failed to add customer' });
  }

  return res.status(200).json({ customer });
}
