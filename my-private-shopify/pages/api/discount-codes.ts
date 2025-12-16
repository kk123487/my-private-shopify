import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch codes' });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { code, amount, type } = req.body;
    if (!code || !amount || !type) return res.status(400).json({ error: 'Missing fields' });
    const { error } = await supabase
      .from('discount_codes')
      .insert([{ code, amount, type, active: true }]);
    if (error) return res.status(500).json({ error: 'Failed to create code' });
    // Return updated list
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    return res.status(200).json(data);
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
