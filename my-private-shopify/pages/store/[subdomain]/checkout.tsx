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

type CustomerInfo = {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

const CheckoutPage: React.FC = () => {
  const router = useRouter()
  const { subdomain } = router.query
  
  const [store, setStore] = useState<Store | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string; user_metadata?: { first_name?: string; last_name?: string } } | null>(null)
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'South Africa'
  })
  
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'ozow'>('payfast')

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.15
    const shipping = subtotal > 500 ? 0 : 75

  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  // Discount code state
  const [discountCode, setDiscountCode] = useState('')
  type Discount = {
    code: string;
    type: 'percentage' | 'fixed_amount' | 'free_shipping';
    value: number;
    starts_at?: string;
    ends_at?: string;
    minimum_order_amount?: number;
    usage_limit?: number;
    usage_count?: number;
  };
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [applyingDiscount, setApplyingDiscount] = useState(false)

  useEffect(() => {
    if (!subdomain) return
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subdomain])

  const loadData = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    try {
      // Check auth status
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(
        authUser
          ? {
              email: authUser.email || '',
              user_metadata: authUser.user_metadata,
            }
          : null
      );

      // Pre-fill customer info if logged in
      if (authUser) {
        setCustomerInfo(prev => ({
          ...prev,
          email: authUser.email || '',
          firstName: authUser.user_metadata?.first_name || '',
          lastName: authUser.user_metadata?.last_name || ''
        }));
      }

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
        const items = JSON.parse(cart) as CartItem[];
        setCartItems(items);
        
        // Redirect if cart is empty
        if (items.length === 0) {
          router.push(`/store/${subdomain}/cart`)
        }
      } else {
        router.push(`/store/${subdomain}/cart`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Calculate discount
  let discountAmount = 0
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percentage') {
      discountAmount = subtotal * (appliedDiscount.value / 100)
    } else if (appliedDiscount.type === 'fixed_amount') {
      discountAmount = appliedDiscount.value
    } else if (appliedDiscount.type === 'free_shipping') {
      discountAmount = shipping
    }
    discountAmount = Math.min(discountAmount, subtotal + shipping)
  }
  
  const total = subtotal + tax + shipping - discountAmount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    })
  }
  
  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code')
      return
    }
    
    setApplyingDiscount(true)
    setDiscountError(null)
    
    try {
      const supabase = getSupabaseClient();
      const { data: discount, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('store_subdomain', subdomain)
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (error || !discount) {
        setDiscountError('Invalid discount code');
        return;
      }
      
      // Check if discount has started
      if (discount.starts_at && new Date(discount.starts_at) > new Date()) {
        setDiscountError('This discount code is not yet valid');
        return;
      }
      
      // Check if discount has expired
      if (discount.ends_at && new Date(discount.ends_at) < new Date()) {
        setDiscountError('This discount code has expired')
        return
      }
      
      // Check minimum order amount
      if (discount.minimum_order_amount && subtotal < discount.minimum_order_amount) {
        setDiscountError(`Minimum order of R${discount.minimum_order_amount.toFixed(2)} required`)
        return
      }
      
      // Check usage limit
      if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
        setDiscountError('This discount code has reached its usage limit')
        return
      }
      
      setAppliedDiscount(discount)
      setDiscountError(null)
    } catch (err) {
      console.error('Error applying discount:', err)
      setDiscountError('Failed to apply discount code')
    } finally {
      setApplyingDiscount(false)
    }
  }
  
  const removeDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCode('')
    setDiscountError(null)
  }

  const validateForm = (): boolean => {
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName) {
      setError('Please fill in all required fields')
      return false
    }
    
    if (!customerInfo.phone || !customerInfo.address || !customerInfo.city || !customerInfo.postalCode) {
      setError('Please complete your shipping address')
      return false
    }
    
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions')
      return false
    }
    
    return true
  }

  const handlePlaceOrder = async () => {
    setError(null)
    if (!validateForm()) return
    setProcessing(true)
    try {
      const supabase = getSupabaseClient();
      // Create order in database
      const orderData = {
        store_subdomain: subdomain as string,
        customer_email: customerInfo.email,
        customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customer_phone: customerInfo.phone,
        shipping_address: customerInfo.address,
        shipping_city: customerInfo.city,
        shipping_postal_code: customerInfo.postalCode,
        total: total,
        discount_code: appliedDiscount?.code || null,
        discount_amount: discountAmount || 0,
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: 'pending',
        shipping_status: 'pending'
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (orderError) throw orderError

      // Insert order items
      const orderItemsData = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData)

      if (itemsError) {
        console.error('Error inserting order items:', itemsError)
        // Don't fail the order if items insertion fails
      }

      // Send order confirmation emails (don't wait for completion)
      fetch('/api/emails/send-order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      }).catch(err => console.error('Error sending confirmation email:', err))

      // Redirect to payment gateway
      if (paymentMethod === 'payfast') {
        // Initiate PayFast payment
        const response = await fetch('/api/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            amount: total,
            customerFirstName: customerInfo.firstName,
            customerLastName: customerInfo.lastName,
            customerEmail: customerInfo.email,
            subdomain: subdomain as string,
            paymentMethod: 'payfast'
          })
        })

        const { redirectUrl, error: paymentError } = await response.json()
        
        if (paymentError) throw new Error(paymentError)
        
        // Clear cart
        localStorage.removeItem(`cart_${subdomain}`)
        
        // Redirect to PayFast
        window.location.href = redirectUrl
      } else {
        // For other payment methods (not yet implemented), go to confirmation
        localStorage.removeItem(`cart_${subdomain}`)
        router.push(`/store/${subdomain}/order-confirmation?orderId=${order.id}`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error placing order')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin inline-block">⏳</div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/store/${subdomain}`} className="text-2xl font-bold text-gray-900">
              {store?.name || 'Store'}
            </Link>
            <div className="flex items-center gap-4">
              {user && (
                <Link href={`/store/${subdomain}/account`} className="text-sm text-gray-600 hover:text-gray-900">
                  My Account
                </Link>
              )}
              <Link href={`/store/${subdomain}/cart`} className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-3 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={customerInfo.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={customerInfo.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={customerInfo.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleInputChange}
                    placeholder="0123456789"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Address</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={customerInfo.city}
                      onChange={handleInputChange}
                      placeholder="Johannesburg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={customerInfo.postalCode}
                      onChange={handleInputChange}
                      placeholder="2000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    name="country"
                    value={customerInfo.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008060] focus:border-transparent"
                    title="Country"
                  >
                    <option value="South Africa">South Africa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#008060] transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="payfast"
                    checked={paymentMethod === 'payfast'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'payfast')}
                    className="w-4 h-4 text-[#008060]"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">PayFast</span>
                      <span className="text-2xl">💳</span>
                    </div>
                    <p className="text-sm text-gray-600">Secure South African payment gateway</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#008060] transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ozow"
                    checked={paymentMethod === 'ozow'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'ozow')}
                    className="w-4 h-4 text-[#008060]"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Ozow</span>
                      <span className="text-2xl">⚡</span>
                    </div>
                    <p className="text-sm text-gray-600">Instant EFT payment</p>
                  </div>
                </label>

                {/* Stripe payment method temporarily removed for local testing */}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 text-[#008060] mt-1"
                />
                <span className="ml-3 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href={`/store/${subdomain}/terms`} className="text-[#008060] hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href={`/store/${subdomain}/privacy`} className="text-[#008060] hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Payment Section Switcher - Stripe temporarily disabled for local testing */}
            <>
              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="w-full px-8 py-4 bg-[#008060] text-white text-lg font-semibold rounded-lg hover:bg-[#006E52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : `Place Order - R${total.toFixed(2)}`}
              </button>
              {paymentMethod === 'payfast' && (
                <div className="mt-2 text-xs text-gray-600">PayFast is a leading South African payment gateway supporting local cards and instant EFT.</div>
              )}
              {paymentMethod === 'ozow' && (
                <div className="mt-2 text-xs text-gray-600">Ozow enables instant EFT payments from all major South African banks.</div>
              )}
            </>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image_url ? (
                          <Image 
                            src={item.image_url} 
                            alt={item.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                      <span className="absolute -top-2 -right-2 bg-gray-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.title}</h3>
                      <p className="text-sm text-gray-600">R{item.price.toFixed(2)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      R{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Discount Code */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                {!appliedDiscount ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Have a discount code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        disabled={applyingDiscount}
                      />
                      <button
                        onClick={applyDiscountCode}
                        disabled={applyingDiscount || !discountCode.trim()}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:bg-gray-300"
                      >
                        {applyingDiscount ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-sm text-red-600 mt-2">{discountError}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Discount applied: {appliedDiscount.code}
                        </p>
                        <p className="text-xs text-green-700">
                          {appliedDiscount.type === 'percentage' && `${appliedDiscount.value}% off`}
                          {appliedDiscount.type === 'fixed_amount' && `R${appliedDiscount.value} off`}
                          {appliedDiscount.type === 'free_shipping' && 'Free shipping'}
                        </p>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="text-green-700 hover:text-green-900 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Subtotal</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>VAT (15%)</span>
                  <span>R{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `R${shipping.toFixed(2)}`}</span>
                </div>
                {appliedDiscount && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span>-R{discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                <span>Total</span>
                <span>R{total.toFixed(2)}</span>
              </div>

              {/* Security Badges */}
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Secure SSL encrypted checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>100% money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
