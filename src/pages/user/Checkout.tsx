import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import type { OrderData } from '../../types';

// TODO: Backend stubs — connect to your API
const CardElement = (_props: any) => null;
const Elements = ({ children }: any) => children;
const confirmPayment = async (..._a: any[]) => ({ success: true, orderId: 'ord_stub', status: 'succeeded', error: null as string | null });
const createPaymentIntent = async (..._a: any[]) => ({ clientSecret: '', success: true, paymentIntentId: 'pi_stub', error: null as string | null });
const loadStripe = async (_key: string) => null;
const useElements = () => ({ getElement: (..._a: any[]) => ({}) } as any);
const useStripe = () => ({ confirmCardPayment: async (..._a: any[]) => ({ error: null, paymentIntent: { status: 'succeeded' } }) } as any);

interface CheckoutProps {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  customerId: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  onSuccess?: (order: OrderData) => void;
  onCancel?: () => void;
}

const CheckoutForm: React.FC<CheckoutProps> = ({
  items,
  totalAmount,
  customerId,
  customerEmail,
  customerName,
  shippingAddress,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const [billingAddress, setBillingAddress] = useState({
    street: shippingAddress.street,
    city: shippingAddress.city,
    state: shippingAddress.state,
    postalCode: shippingAddress.postalCode,
    country: shippingAddress.country,
  });

  const [sameAsShipping, setSameAsShipping] = useState(true);

  // Initialize payment intent
  useEffect(() => {
    const initializePayment = async () => {
      setIsLoading(true);
      const result = await createPaymentIntent({
        customerId,
        customerEmail,
        customerName,
        items,
        totalAmount,
        shippingAddress,
      });

      if (result.success && result.clientSecret && result.paymentIntentId) {
        setClientSecret(result.clientSecret);
        setPaymentIntentId(result.paymentIntentId);
      } else {
        setError(result.error || 'Failed to initialize payment');
      }
      setIsLoading(false);
    };

    initializePayment();
  }, [customerId, customerEmail, customerName, items, totalAmount, shippingAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret || !paymentIntentId) {
      setError('Payment not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        setError('Card element not found');
        return;
      }

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerName,
            email: customerEmail,
            address: {
              line1: billingAddress.street,
              city: billingAddress.city,
              state: billingAddress.state,
              postal_code: billingAddress.postalCode,
              country: billingAddress.country,
            },
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        setIsLoading(false);
        return;
      }

      if (result.paymentIntent.status === 'succeeded') {
        // Confirm payment in backend and create order
        const confirmResult = await confirmPayment(paymentIntentId, {
          customerId,
          customerEmail,
          userId: customerId, // Add userId for backend
          items,
          totalAmount,
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        });

        if (confirmResult.success && confirmResult.orderId) {
          setSuccess(true);
          const orderData: OrderData = {
            id: confirmResult.orderId,
            customerId,
            customerEmail,
            totalAmount,
            orderStatus: (confirmResult.status || 'processing') as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
            paymentStatus: 'completed',
            paymentIntentId,
            items,
            shippingAddress,
            billingAddress: sameAsShipping ? shippingAddress : billingAddress,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // Navigate to confirmation page
          navigate('/checkout/confirmation', { state: { orderData } });
          
          if (onSuccess) {
            onSuccess(orderData);
          }
        } else {
          setError(confirmResult.error || 'Failed to create order');
        }
      } else {
        setError(`Payment status: ${result.paymentIntent.status}`);
      }
    } catch (err) {
      setError(`Payment error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h2>
          <p className="text-green-700 mb-6">Your order has been placed and confirmed.</p>
          <div className="bg-white rounded p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Order Amount:</strong> ${totalAmount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Items:</strong> {items.length} product(s)
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/checkout/review')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
      >
        <ArrowLeft size={18} />
        Back to Review
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h2>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-gray-600">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping Address Display */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
          <p className="text-sm text-gray-600">
            {shippingAddress.street}
            <br />
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
            <br />
            {shippingAddress.country}
          </p>
        </div>

        {/* Billing Address */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={sameAsShipping}
              onChange={(e) => setSameAsShipping(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-semibold text-gray-700">Same as shipping address</span>
          </label>

          {!sameAsShipping && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Street Address"
                value={billingAddress.street}
                onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="City"
                  value={billingAddress.city}
                  onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={billingAddress.state}
                  onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={billingAddress.postalCode}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, postalCode: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={billingAddress.country}
                  onChange={(e) =>
                    setBillingAddress({ ...billingAddress, country: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Card Details</label>
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#fa755a',
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || !elements || isLoading || !clientSecret}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-gray-900 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${totalAmount > 0 ? '$' + totalAmount.toFixed(2) : 'Now'}`
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your payment is secure and encrypted. We use Stripe to process payments safely.
        </p>
      </div>
    </div>
  );
};

// Main component with Stripe Elements provider
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const checkoutData = location.state as CheckoutProps | undefined;

  // Redirect if no checkout data
  useEffect(() => {
    if (!checkoutData) {
      navigate('/cart');
    }
  }, [checkoutData, navigate]);

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-600 text-gray-900 flex items-center justify-center font-bold mb-2">
                ✓
              </div>
              <span className="text-sm font-semibold text-green-600">Shipping</span>
            </div>
            <div className="flex-1 h-1 bg-green-600 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-green-600 text-gray-900 flex items-center justify-center font-bold mb-2">
                ✓
              </div>
              <span className="text-sm font-semibold text-green-600">Review</span>
            </div>
            <div className="flex-1 h-1 bg-blue-600 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-gray-900 flex items-center justify-center font-bold mb-2">
                3
              </div>
              <span className="text-sm font-semibold text-blue-600">Payment</span>
            </div>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm {...checkoutData} />
        </Elements>
      </div>
    </div>
  );
};

export default Checkout;
