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

  const { storeId, name, description, price, imageUrl } = req.body;
  if (!storeId || !name || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert([{ store_id: storeId, name, description, price, image_url: imageUrl }])
    .select()
    .single();

  if (error || !product) {
    return res.status(500).json({ error: 'Failed to add product' });
  }

  return res.status(200).json({ product });
}
