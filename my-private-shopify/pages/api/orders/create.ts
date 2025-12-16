
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { storeId, userId, total, status, customerEmail } = req.body;
  if (!storeId || !userId || !total || !customerEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert([{ store_id: storeId, user_id: userId, total, status: status || 'pending' }])
    .select()
    .single();

  if (error || !order) {
    return res.status(500).json({ error: 'Failed to create order' });
  }

  // Fetch store info for notification
  const { data: store } = await supabase
    .from('stores')
    .select('name, owner_email')
    .eq('id', storeId)
    .single();

  // Send order confirmation to customer
  try {
    await sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${store?.name || 'Your Store'}`,
      html: `<h2>Thank you for your order!</h2><p>Your order #${order.id} has been received.</p>`
    });
  } catch {}

  // Notify store owner
  if (store?.owner_email) {
    try {
      await sendEmail({
        to: store.owner_email,
        subject: `New Order Received - ${store.name}`,
        html: `<p>You have received a new order (#${order.id}) for R${total}.</p>`
      });
    } catch {}
  }

  return res.status(200).json({ order });
}
