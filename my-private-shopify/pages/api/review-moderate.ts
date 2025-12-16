import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, action } = req.body;
  if (!id || !action) return res.status(400).json({ error: 'Missing id or action' });
  let update = {};
  if (action === 'approve') update = { status: 'approved' };
  if (action === 'hide') update = { status: 'hidden' };
  if (action === 'delete') update = { status: 'deleted' };
  const { error } = await supabase
    .from('reviews')
    .update(update)
    .eq('id', id);
  if (error) return res.status(500).json({ error: 'Failed to update review' });
  return res.status(200).json({ success: true });
}
