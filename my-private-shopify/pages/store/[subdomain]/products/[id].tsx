import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import getSupabaseClient from '@/lib/supabaseClient';
import Button from '@/components/ui/Button';
// import ProductCard from '@/components/ui/ProductCard'; // For future related/upsell products

type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
};

type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  published: boolean;
  image_url?: string;
  inventory?: number;
  sku?: string;
  created_at?: string; // For badge logic
  seo_title?: string;
  seo_description?: string;
  seo_image_url?: string;
};

type Store = {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  brand_color?: string;
};

const ProductDetailPage: React.FC = () => {
  const router = useRouter();
  const { subdomain, id } = router.query;
  
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const loadData = useCallback(async () => {
    if (!subdomain || !id) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      // Check auth status
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Load store (with branding)
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*, logo_url, brand_color')
        .eq('subdomain', subdomain as string)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Load product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id as string)
        .eq('store_subdomain', subdomain as string)
        .eq('published', true)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Load cart count
      const cart = localStorage.getItem(`cart_${subdomain}`);
      if (cart) {
        const cartItems = JSON.parse(cart) as CartItem[];
        const count = cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
        setCartCount(count);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading product');
    } finally {
      setLoading(false);
    }
  }, [subdomain, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setShowAccountMenu(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const cart = localStorage.getItem(`cart_${subdomain}`);
    const cartItems: CartItem[] = cart ? JSON.parse(cart) : [];
    
    const existingItem = cartItems.find((item: CartItem) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartItems.push({
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: quantity,
        image_url: product.image_url
      });
    }
    
    localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cartItems));
    const count = cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
    setCartCount(count);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && (!product?.inventory || newQuantity <= product.inventory)) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin inline-block">⏳</div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product || !store) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href={`/store/${subdomain}`} className="text-2xl font-bold text-gray-900">
                {store?.name || 'Store'}
              </Link>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
            <p className="text-gray-600 mb-6">{error || 'This product does not exist or is no longer available'}</p>
            <Link
              href={`/store/${subdomain}`}
              className="inline-block px-6 py-3 bg-[#008060] text-white rounded-lg font-semibold hover:bg-[#006E52]"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Badge logic: show 'New' if product created within last 14 days
  let badge: string | undefined = undefined;
  if (product?.created_at) {
    const created = new Date(product.created_at);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 14) badge = 'New';
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>{product.seo_title || product.title}</title>
        <meta name="description" content={product.seo_description || product.description || ''} />
        <meta property="og:title" content={product.seo_title || product.title} />
        <meta property="og:description" content={product.seo_description || product.description || ''} />
        <meta property="og:type" content="product" />
        {product.seo_image_url && <meta property="og:image" content={product.seo_image_url} />}
        <meta property="og:url" content={`https://yourdomain.com/store/${subdomain}/products/${product.id}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.seo_title || product.title} />
        <meta name="twitter:description" content={product.seo_description || product.description || ''} />
        {product.seo_image_url && <meta name="twitter:image" content={product.seo_image_url} />}
      </Head>

      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50" style={{ borderColor: store.brand_color || undefined }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/store/${subdomain}`} className="flex items-center gap-2">
              {store.logo_url && (
                <img src={store.logo_url} alt="Store Logo" style={{ height: 40, width: 40, objectFit: 'contain', borderRadius: 8 }} />
              )}
              <span className="text-2xl font-bold" style={{ color: store.brand_color || undefined }}>{store.name}</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href={`/store/${subdomain}`} className="text-gray-700 hover:text-gray-900 font-medium">
                Home
              </Link>
              <Link href={`/store/${subdomain}/products`} className="text-gray-700 hover:text-gray-900 font-medium">
                Shop
              </Link>
              <Link href={`/store/${subdomain}/about`} className="text-gray-700 hover:text-gray-900 font-medium">
                About
              </Link>
              <Link href={`/store/${subdomain}/contact`} className="text-gray-700 hover:text-gray-900 font-medium">
                Contact
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Account Dropdown */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    <span className="text-xl">👤</span>
                    <span className="hidden md:inline">{user.user_metadata?.first_name || 'Account'}</span>
                  </button>
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-2 z-50">
                      <Link
                        href={`/store/${subdomain}/account`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        href={`/store/${subdomain}/account/orders`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        Order History
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href={`/store/${subdomain}/account/login`} className="text-gray-700 hover:text-gray-900 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="text-xl">👤</span>
                    <span className="hidden md:inline">Login</span>
                  </span>
                </Link>
              )}
              <Link href={`/store/${subdomain}/cart`} className="relative text-gray-700 hover:text-gray-900">
                <span className="text-xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#008060] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href={`/store/${subdomain}`} className="hover:text-[#008060]">Home</Link>
          <span>›</span>
          <Link href={`/store/${subdomain}/products`} className="hover:text-[#008060]">Products</Link>
          <span>›</span>
          <span className="text-gray-900">{product.title}</span>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
            {product.image_url ? (
              <Image 
                src={product.image_url} 
                alt={product.title ? `Product image for ${product.title}` : 'Product image'}
                width={800}
                height={800}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <span className="text-9xl">📦</span>
                <p className="text-gray-500 mt-4">No image available</p>
              </div>
            )}
            {badge && (
              <span className="absolute top-4 left-4 bg-[#008060] text-white text-xs font-bold px-4 py-2 rounded-full shadow">{badge}</span>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.title}</h1>
            
            {/* Price */}
            <div className="mb-6 flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">R{product.price.toFixed(2)}</span>
              {badge && (
                <span className="bg-[#008060] text-white text-xs font-bold px-3 py-1 rounded-full shadow">{badge}</span>
              )}
            </div>

            {/* Stock Status */}
            {product.inventory !== undefined && (
              <div className="mb-6">
                {product.inventory > 0 ? (
                  <p className="text-green-600 font-medium">✓ In stock ({product.inventory} available)</p>
                ) : (
                  <p className="text-red-600 font-medium">✗ Out of stock</p>
                )}
              </div>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-gray-600 mb-6">SKU: {product.sku}</p>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-16 text-center text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={product.inventory ? quantity >= product.inventory : false}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="mb-8">
              <Button
                onClick={handleAddToCart}
                disabled={product.inventory === 0}
                className="w-full px-8 py-4 text-lg"
                aria-label={product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
              >
                {product.inventory === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              {addedToCart && (
                <p className="text-green-600 text-center mt-3 font-medium">✓ Added to cart!</p>
              )}
            </div>

            {/* Buy Now */}
            <div className="mb-8">
              <Link
                href={`/store/${subdomain}/checkout`}
                className="block w-full px-8 py-4 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors text-center"
                aria-label="Buy now and proceed to checkout"
              >
                Buy Now
              </Link>
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">
                  {product.description}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-[#008060] mr-2">✓</span>
                  <span className="text-gray-700">High quality product</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#008060] mr-2">✓</span>
                  <span className="text-gray-700">Fast and secure delivery</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#008060] mr-2">✓</span>
                  <span className="text-gray-700">30-day return policy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#008060] mr-2">✓</span>
                  <span className="text-gray-700">Customer support available</span>
                </li>
              </ul>
            </div>

            {/* Customer Reviews */}
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Reviews</h2>
              <ReviewsSection productId={product.id} />
            </div>
          // --- ReviewsSection component ---
          import { useRef } from 'react';

          function ReviewsSection({ productId }: { productId: string }) {
            const [reviews, setReviews] = useState<any[]>([]);
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState<string | null>(null);
            const [name, setName] = useState('');
            const [rating, setRating] = useState(5);
            const [comment, setComment] = useState('');
            const [submitting, setSubmitting] = useState(false);
            const [success, setSuccess] = useState(false);
            const formRef = useRef<HTMLFormElement>(null);

            useEffect(() => {
              setLoading(true);
              fetch(`/api/product-reviews?productId=${productId}`)
                .then(res => res.json())
                .then(data => {
                  setReviews(Array.isArray(data) ? data : []);
                  setLoading(false);
                })
                .catch(() => {
                  setError('Failed to load reviews');
                  setLoading(false);
                });
            }, [productId, success]);

            const handleSubmit = async (e: React.FormEvent) => {
              e.preventDefault();
              setSubmitting(true);
              setError(null);
              setSuccess(false);
              const res = await fetch('/api/product-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, name, rating, comment }),
              });
              if (res.ok) {
                setSuccess(true);
                setName('');
                setRating(5);
                setComment('');
                formRef.current?.reset();
              } else {
                setError('Failed to submit review');
              }
              setSubmitting(false);
            };

            return (
              <div>
                {loading ? (
                  <p>Loading reviews...</p>
                ) : (
                  <>
                    {reviews.length === 0 ? (
                      <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                    ) : (
                      <ul className="space-y-4 mb-8">
                        {reviews.map((review, idx) => (
                          <li key={idx} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-800">{review.name}</span>
                              <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                            </div>
                            <div className="text-gray-700 mb-1">{review.comment}</div>
                            <div className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                <form onSubmit={handleSubmit} ref={formRef} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <select
                      value={rating}
                      onChange={e => setRating(Number(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {[5,4,3,2,1].map(r => (
                        <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comment</label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#008060] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#006E52] disabled:opacity-50"
                    aria-label="Submit product review"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  {error && <p className="text-red-600 text-sm mt-2" role="alert" aria-live="assertive">{error}</p>}
                  {success && <p className="text-green-600 text-sm mt-2" role="status" aria-live="polite">✓ Review submitted!</p>}
                </form>
              </div>
            );
          }
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 mt-20" style={{ background: store.brand_color || '#222', color: '#fff' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {store.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetailPage;
