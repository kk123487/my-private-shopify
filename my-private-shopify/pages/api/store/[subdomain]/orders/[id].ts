
import { NextApiRequest, NextApiResponse } from 'next';
import supabaseAdmin from '../../../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { subdomain, id } = req.query;

	if (!subdomain || !id || typeof subdomain !== 'string' || typeof id !== 'string') {
		return res.status(400).json({ error: 'Missing subdomain or order ID' });
	}

	try {
		const { data: order, error } = await supabaseAdmin
			.from('orders')
			.select('*')
			.eq('store_subdomain', subdomain)
			.eq('id', id)
			.single();

		if (error) throw error;
		if (!order) {
			return res.status(404).json({ error: 'Order not found' });
		}

		return res.status(200).json({ order });
	} catch (err: any) {
		return res.status(500).json({ error: err.message || 'Server error' });
	}
}
