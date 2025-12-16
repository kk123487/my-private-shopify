import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './storelayout.module.css';


interface StoreBranding {
  name: string;
  logo_url?: string;
  brand_color?: string;
}

interface CustomPageNav {
  id: string;
  title: string;
  slug: string;
}

const StoreLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { subdomain } = router.query;

  const [branding, setBranding] = useState<StoreBranding | null>(null);
  const [customPages, setCustomPages] = useState<CustomPageNav[]>([]);


  useEffect(() => {
    if (!subdomain) return;
    fetch(`/api/store-branding?subdomain=${subdomain}`)
      .then(res => res.json())
      .then(data => setBranding(data));
    // Fetch custom pages for navigation
    fetch(`/api/custom-pages?subdomain=${subdomain}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomPages(data.map((p: any) => ({ id: p.id, title: p.title, slug: p.slug })));
        }
      });
  }, [subdomain]);


  return (
    <div className={styles.layoutRoot}>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className={styles.skipToContent}>Skip to main content</a>
      <header
        className={styles.header + ' ' + styles.dynamicBrandColor}
        data-brandcolor-border={branding?.brand_color || ''}
      >
        <div className={styles.headerInner}>
          <Link href={`/store/${subdomain}`} className={styles.logoLink} aria-label="Go to store homepage">
            {branding?.logo_url && (
              <img src={branding.logo_url} alt={branding?.name ? `${branding.name} logo` : 'Store Logo'} className={styles.logoImg} />
            )}
            <span
              className={styles.storeName + ' ' + styles.dynamicBrandColor}
              data-brandcolor={branding?.brand_color || ''}
            >
              {branding?.name || 'Store'}
            </span>
          </Link>
          {/* Navigation links for custom pages */}
          {customPages.length > 0 && (
            <nav className={styles.navLinks} aria-label="Custom Pages">
              {customPages.map(page => (
                <Link
                  key={page.id}
                  href={`/store/${subdomain}/${page.slug}`}
                  className={styles.navLink}
                  aria-label={`Go to page ${page.title}`}
                >
                  {page.title}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer
        className={styles.footer + ' ' + styles.dynamicBrandColor}
        data-brandcolor-bg={branding?.brand_color || ''}
      >
        <div className={styles.footerInner}>
          {/* Footer navigation links for custom pages */}
          {customPages.length > 0 && (
            <nav className={styles.footerNavLinks} aria-label="Custom Pages Footer">
              {customPages.map(page => (
                <Link
                  key={page.id}
                  href={`/store/${subdomain}/${page.slug}`}
                  className={styles.footerNavLink}
                  aria-label={`Go to page ${page.title}`}
                >
                  {page.title}
                </Link>
              ))}
            </nav>
          )}
          <p className={styles.footerText}>
            © {new Date().getFullYear()} {branding?.name || 'Store'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StoreLayout;
