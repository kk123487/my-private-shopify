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
    .from('stores')
    .select('name, logo_url, brand_color')
    .eq('subdomain', subdomain)
    .single();
  if (error) return res.status(500).json({ error: 'Failed to fetch branding' });
  return res.status(200).json(data);
}
