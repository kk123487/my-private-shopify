import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { subdomain } = req.query;
  if (!subdomain) return res.status(400).json({ error: 'Missing subdomain' });
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_subdomain', subdomain)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) return res.status(500).json({ error: 'Failed to fetch products' });
  return res.status(200).json(data);
}
