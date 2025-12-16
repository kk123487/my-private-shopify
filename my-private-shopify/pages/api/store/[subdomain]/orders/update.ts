import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '../../../../../lib/supabaseAdmin';
import { sendEmail } from '../../../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subdomain, id } = req.query;
  const { status, customerEmail } = req.body;

  if (!subdomain || !id || typeof subdomain !== 'string' || typeof id !== 'string' || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('store_subdomain', subdomain)
      .eq('id', id)
      .select()
      .single();

    if (error || !order) {
      return res.status(500).json({ error: error?.message || 'Failed to update order' });
    }

    // Fetch store info for branding/email
    const { data: store } = await supabase
      .from('stores')
      .select('name')
      .eq('subdomain', subdomain)
      .single();

    // Send shipping update email to customer
    if (customerEmail) {
      try {
        await sendEmail({
          to: customerEmail,
          subject: `Shipping Update - ${store?.name || 'Your Store'}`,
          html: `<h2>Your order #${order.id} status has been updated to: <b>${status}</b>.</h2>`
        });
      } catch (e) {
        // Log but don't fail
      }
    }

    return res.status(200).json({ order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
