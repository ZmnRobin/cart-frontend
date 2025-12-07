import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Tag, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Types
interface CartItem {
  productId: number;
  quantity: number;
  name: string;
  priceCents: number;
  totalCents: number;
}

interface CartTotals {
  subtotalCents: number;
  discountCents: number;
  finalTotalCents: number;
  appliedCouponCode: string | null;
}

interface CartResponse {
  items: CartItem[];
  totals: CartTotals;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  priceCents: number;
}

// API Configuration
const API_BASE_URL = 'http://localhost:5000';
const USER_ID = 'user123';

// Utility Functions
const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

// API Service
const api = {
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getCart(): Promise<CartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/${USER_ID}`);
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  },

  async addItem(productId: number, quantity: number): Promise<CartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/${USER_ID}/item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add item');
    }
    return res.json();
  },

  async updateItem(productId: number, quantity: number): Promise<CartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/${USER_ID}/item/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update item');
    }
    return res.json();
  },

  async removeItem(productId: number): Promise<CartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/${USER_ID}/item/${productId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to remove item');
    }
    return res.json();
  },

  async applyCoupon(code: string): Promise<CartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/${USER_ID}/coupon/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to apply coupon');
    }
    return res.json();
  },

  async removeCoupon(): Promise<CartResponse> {
    const res = await fetch(`${API_BASE_URL}/cart/${USER_ID}/coupon/remove`, {
      method: 'POST'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to remove coupon');
    }
    return res.json();
  }
};

// Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } text-white animate-slideIn`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X size={16} />
      </button>
    </div>
  );
};

// Main App
const App: React.FC = () => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      showToast('Failed to load products', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      setCart(data);
    } catch (error) {
      showToast('Failed to load cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  const handleAddToCart = async (productId: number) => {
    try {
      setActionLoading(true);
      const data = await api.addItem(productId, 1);
      setCart(data);
      showToast('Item added to cart', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to add item', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    try {
      setActionLoading(true);
      const data = await api.updateItem(productId, newQuantity);
      setCart(data);
      showToast('Quantity updated', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update quantity', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      setActionLoading(true);
      const data = await api.removeItem(productId);
      setCart(data);
      showToast('Item removed from cart', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove item', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      setActionLoading(true);
      const data = await api.applyCoupon(couponCode.trim());
      setCart(data);
      setCouponCode('');
      showToast('Coupon applied successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to apply coupon', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      setActionLoading(true);
      const data = await api.removeCoupon();
      setCart(data);
      showToast('Coupon removed', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove coupon', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCouponKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading your shopping experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="text-indigo-600" size={40} />
          <h1 className="text-4xl font-bold text-gray-800">Shopping Cart</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Products</h2>
              {products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No products available</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                          <p className="text-xs text-gray-400 mb-2">{product.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-indigo-600">
                          {formatPrice(product.priceCents)}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={actionLoading}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h2>
              {!cart || cart.items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.priceCents)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={actionLoading}
                          className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={actionLoading}
                          className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-800">
                          {formatPrice(item.totalCents)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={actionLoading}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-6">
            {/* Coupon Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Tag size={24} className="text-indigo-600" />
                Coupon Code
              </h2>

              {cart?.totals.appliedCouponCode ? (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-green-800 block">
                          {cart.totals.appliedCouponCode}
                        </span>
                        <span className="text-xs text-green-600">
                          ✨ Auto-applied or manually added
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        disabled={actionLoading}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <p className="text-sm text-green-700 font-semibold">
                      Saving {formatPrice(cart.totals.discountCents)}!
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Or enter a different coupon code below
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-yellow-800">
                    💡 No coupon applied yet. Add items to see if any auto-apply coupons qualify!
                  </p>
                </div>
              )}

              <div className="space-y-3 mt-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyPress={handleCouponKeyPress}
                  placeholder="Enter coupon code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || actionLoading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Manual Coupon
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600 font-semibold mb-2">Manual Codes:</p>
                <p className="text-xs text-gray-600 mb-1">• SAVE10 - $10 off</p>
                <p className="text-xs text-gray-600 mb-3">• OFF10 - 10% off (max $5)</p>
                <p className="text-xs text-gray-500 italic">
                  💡 Auto-apply coupons will activate automatically when you meet the requirements!
                </p>
              </div>
            </div>

            {/* Order Summary */}
            {cart && cart.items.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      {formatPrice(cart.totals.subtotalCents)}
                    </span>
                  </div>
                  {cart.totals.discountCents > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-semibold">
                        -{formatPrice(cart.totals.discountCents)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xl font-bold text-gray-800">
                      <span>Total:</span>
                      <span className="text-indigo-600">
                        {formatPrice(cart.totals.finalTotalCents)}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;