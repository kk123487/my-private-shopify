import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id, title, slug, content, subdomain } = req.body;
  const storeSubdomain = subdomain || req.query.subdomain;

  if (!storeSubdomain) return res.status(400).json({ error: 'Missing store subdomain' });

  if (method === 'GET') {
    const { data, error } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('store_subdomain', storeSubdomain);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (method === 'POST') {
    if (!title || !slug || !content) return res.status(400).json({ error: 'Missing fields' });
    const { error } = await supabase
      .from('custom_pages')
      .insert([{ title, slug, content, store_subdomain: storeSubdomain }]);
    if (error) return res.status(500).json({ error: error.message });
    // Return updated list
    const { data } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('store_subdomain', storeSubdomain);
    return res.status(200).json({ pages: data });
  }

  if (method === 'PUT') {
    if (!id || !title || !slug || !content) return res.status(400).json({ error: 'Missing fields' });
    const { error } = await supabase
      .from('custom_pages')
      .update({ title, slug, content })
      .eq('id', id)
      .eq('store_subdomain', storeSubdomain);
    if (error) return res.status(500).json({ error: error.message });
    const { data } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('store_subdomain', storeSubdomain);
    return res.status(200).json({ pages: data });
  }

  if (method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const { error } = await supabase
      .from('custom_pages')
      .delete()
      .eq('id', id)
      .eq('store_subdomain', storeSubdomain);
    if (error) return res.status(500).json({ error: error.message });
    const { data } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('store_subdomain', storeSubdomain);
    return res.status(200).json({ pages: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
