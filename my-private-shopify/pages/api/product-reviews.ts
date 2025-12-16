import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { productId } = req.query;
    if (!productId) return res.status(400).json({ error: 'Missing productId' });
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch reviews' });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { productId, name, rating, comment } = req.body;
    if (!productId || !name || !rating) return res.status(400).json({ error: 'Missing fields' });
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ product_id: productId, name, rating, comment }]);
    if (error) return res.status(500).json({ error: 'Failed to submit review' });

    // Fetch product and store info for notification
    const { data: product } = await supabase
      .from('products')
      .select('title, store_subdomain')
      .eq('id', productId)
      .single();
    let ownerEmail = null;
    if (product?.store_subdomain) {
      const { data: store } = await supabase
        .from('stores')
        .select('owner_email, name')
        .eq('subdomain', product.store_subdomain)
        .single();
      ownerEmail = store?.owner_email;
      // Send notification email to store owner
      if (ownerEmail) {
        try {
          await sendEmail({
            to: ownerEmail,
            subject: `New Review for ${product.title}`,
            html: `<p>${name} left a ${rating}-star review:</p><blockquote>${comment}</blockquote>`
          });
        } catch {}
      }
    }
    return res.status(200).json(data[0]);
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
