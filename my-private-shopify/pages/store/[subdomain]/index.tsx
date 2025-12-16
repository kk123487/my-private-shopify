import StoreLayout from './StoreLayout';
import { GetServerSideProps } from 'next';
import { getStoreBranding } from '../api/store-branding';
import { useEffect, useState } from 'react';
import styles from './index.module.css';
import Link from 'next/link';
import Head from 'next/head';

export default function StoreHome({ subdomain, initialBranding }: any) {
  const [branding, setBranding] = useState(initialBranding);
  const [products, setProducts] = useState<any[]>([]);

  // Optionally, fetch branding client-side for updates
  useEffect(() => {
    if (!branding && subdomain) {
      fetch(`/api/store-branding?subdomain=${subdomain}`)
        .then(res => res.json())
        .then(data => setBranding(data));
    }
  }, [branding, subdomain]);

  useEffect(() => {
    if (subdomain) {
      fetch(`/api/store-products?subdomain=${subdomain}`)
        .then(res => res.json())
        .then(data => setProducts(Array.isArray(data) ? data : []));
    }
  }, [subdomain]);

  // SEO meta tags
  const title = branding?.name ? `${branding.name} | Online Store` : 'Online Store';
  const description = branding?.name
    ? `Shop the best products at ${branding.name}. Powered by your local store.`
    : 'Shop the best products, powered by your local store.';
  const ogImage = branding?.logoUrl || (products[0]?.image_url ?? undefined);

  return (
    <StoreLayout branding={branding} subdomain={subdomain}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Head>
      <main className={styles.main}>
        <h1>Welcome to {subdomain ? `${subdomain}'s` : 'the'} Store!</h1>
        {branding?.logoUrl && (
          <img src={branding.logoUrl} alt="Store Logo" className={styles.logo} />
        )}
        <p
          className={styles.brandText + ' ' + (branding?.brandColor ? styles.dynamicBrandColor : styles.defaultBrandColor)}
          data-brandcolor={branding?.brandColor || ''}
        >
          Shop the best products, powered by your local store.
        </p>

        {products.length > 0 && (
          <section>
            <h2
              className={styles.featuredHeading + ' ' + (branding?.brandColor ? styles.dynamicBrandColor : styles.defaultBrandColor)}
              data-brandcolor={branding?.brandColor || ''}
            >
              Featured Products
            </h2>
            <div className={styles.productGrid}>
              {products.map(product => (
                <Link
                  href={`/store/${subdomain}/products/${product.id}`}
                  key={product.id}
                  className={styles.productLink}
                >
                  <div className={styles.productCard}>
                    {product.image_url && (
                      <img src={product.image_url} alt={product.title} className={styles.productImage} />
                    )}
                    <div className={styles.productTitle}>{product.title}</div>
                    <div className={styles.productPrice}>R {product.price?.toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </StoreLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { subdomain } = context.query;
  let initialBranding = null;
  try {
    initialBranding = await getStoreBranding(subdomain as string);
  } catch (e) {
    // fallback: branding not found
  }
  return {
    props: {
      subdomain: subdomain || null,
      initialBranding,
    },
  };
};
