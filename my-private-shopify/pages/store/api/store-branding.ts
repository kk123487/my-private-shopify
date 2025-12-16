import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function getStoreBranding(subdomain: string) {
  if (!subdomain) return null;
  const { data, error } = await supabase
    .from('stores')
    .select('name, logo_url, brand_color')
    .eq('subdomain', subdomain)
    .single();
  if (error) return null;
  return {
    name: data.name,
    logoUrl: data.logo_url,
    brandColor: data.brand_color,
  };
}
