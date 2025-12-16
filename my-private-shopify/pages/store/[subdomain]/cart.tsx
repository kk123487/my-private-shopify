import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import getSupabaseClient from '../../../lib/supabaseClient'

type CartItem = {
  id: string
  title: string
  price: number
  quantity: number
  image_url?: string
}

type Store = {
  id: string
  name: string
  subdomain: string
}

const CartPage: React.FC = () => {
  const router = useRouter()
  const { subdomain } = router.query
  
  const [store, setStore] = useState<Store | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  useEffect(() => {
    if (!subdomain) return
    loadData()
  }, [subdomain])

  const loadData = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    try {
      // Check auth status
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Load store
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('subdomain', subdomain as string)
        .single();

      if (storeData) setStore(storeData);

      // Load cart from localStorage
      const cart = localStorage.getItem(`cart_${subdomain}`);
      if (cart) {
        setCartItems(JSON.parse(cart) as CartItem[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setShowAccountMenu(false);
  }

  const updateCart = (items: CartItem[]) => {
    setCartItems(items)
    localStorage.setItem(`cart_${subdomain}`, JSON.stringify(items))
  }

  const updateQuantity = (itemId: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta
        return { ...item, quantity: Math.max(1, newQuantity) }
      }
      return item
    })
    updateCart(updated)
  }

  const removeItem = (itemId: string) => {
    const updated = cartItems.filter(item => item.id !== itemId)
    updateCart(updated)
  }

  const clearCart = () => {
    updateCart([])
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.15 // 15% VAT
  const shipping = subtotal > 500 ? 0 : 75 // Free shipping over R500
  const total = subtotal + tax + shipping

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin inline-block">⏳</div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={`/store/${subdomain}`} className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">{store?.name || 'Store'}</span>
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            <Link
              href={`/store/${subdomain}`}
              className="inline-block px-8 py-3 bg-[#008060] text-white rounded-lg font-semibold hover:bg-[#006E52]"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                  {/* Product Image */}
                  <Link href={`/store/${subdomain}/products/${item.id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <Image 
                          src={item.image_url} 
                          alt={item.title ? `Product image for ${item.title}` : 'Product image'}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1">
                    <Link href={`/store/${subdomain}/products/${item.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-[#008060] mb-1">{item.title}</h3>
                    </Link>
                    <p className="text-lg font-bold text-gray-900">R{item.price.toFixed(2)}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 font-bold"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Total */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      R{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700 px-2"
                    title="Remove item"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Clear Cart Button */}
              <div className="text-right">
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  aria-label="Clear cart"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({cartCount} items)</span>
                    <span>R{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>VAT (15%)</span>
                    <span>R{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `R${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-gray-600">
                      Add R{(500 - subtotal).toFixed(2)} more for free shipping
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-300 pt-4 mb-6">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>R{total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href={`/store/${subdomain}/checkout`}
                  className="block w-full px-6 py-3 bg-[#008060] text-white text-center rounded-lg font-semibold hover:bg-[#006E52] transition-colors mb-3"
                  aria-label="Proceed to checkout"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href={`/store/${subdomain}`}
                  className="block w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 text-center rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>🔒</span>
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🚚</span>
                      <span>Fast delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>↩️</span>
                      <span>Easy returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {store?.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CartPage
