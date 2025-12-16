import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const config = {
  api: {
    bodyParser: false, // We'll handle file uploads manually
  },
};

// Helper to parse multipart/form-data
import formidable, { Fields, Files } from 'formidable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err: any, fields: Fields, files: Files) => {
      if (err) return res.status(400).json({ error: 'Error parsing form data' });
      const { storeId, brandColor } = fields;
      if (!storeId) return res.status(400).json({ error: 'Missing storeId' });
      let logoUrl = null;
      if (files.logo) {
        const logoFile = Array.isArray(files.logo) ? files.logo[0] : files.logo;
        if (logoFile && logoFile.filepath) {
          const originalFilename = logoFile.originalFilename;
          if (!originalFilename || typeof originalFilename !== 'string' || !originalFilename.includes('.')) {
            return res.status(400).json({ error: 'Invalid file name' });
          }
          const storeIdStr = typeof storeId === 'string' ? storeId : String(storeId ?? '');
          if (!storeIdStr) {
            return res.status(400).json({ error: 'Invalid storeId' });
          }
          const fileExt = originalFilename.split('.').pop();
          const filePath: string = `store-logos/${storeIdStr}.${fileExt ? fileExt : 'png'}`;
          const fs = require('fs');
          let fileBody;
          if (typeof logoFile.filepath === 'string') {
            fileBody = fs.createReadStream(logoFile.filepath);
          } else {
            return res.status(400).json({ error: 'Invalid file path' });
          }
          const { data, error } = await supabase.storage
            .from('public')
            // @ts-expect-error: filePath is always a string here due to guards above
            .upload(filePath, fileBody, { upsert: true, contentType: logoFile.mimetype });
          if (error) return res.status(500).json({ error: 'Failed to upload logo' });
          const { publicUrl } = supabase.storage.from('public').getPublicUrl(filePath).data;
          logoUrl = publicUrl;
        }
      }
      // Update store record
      const updates: any = {};
      if (logoUrl) updates.logo_url = logoUrl;
      if (brandColor) updates.brand_color = brandColor;
      const { error: updateError } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', storeId);
      if (updateError) return res.status(500).json({ error: 'Failed to update store branding' });
      return res.status(200).json({ logoUrl, brandColor });
    });
  } else if (req.method === 'GET') {
    const { storeId } = req.query;
    if (!storeId) return res.status(400).json({ error: 'Missing storeId' });
    const { data, error } = await supabase
      .from('stores')
      .select('logo_url, brand_color')
      .eq('id', storeId)
      .single();
    if (error) return res.status(500).json({ error: 'Failed to fetch branding' });
    return res.status(200).json(data);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
