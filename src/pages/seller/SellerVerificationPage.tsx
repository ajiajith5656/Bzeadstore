/**
 * Unified Seller Verification Page
 * Combines Stripe Connect KYC (recommended) with traditional document-based KYC (fallback)
 */

import React, { useState } from 'react';
import { Shield, FileText, CreditCard, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import SellerKYCVerification from './SellerKYCVerification';
import type { Seller } from '../../types';

// TODO: Backend stubs — connect to your API
const StripeKYCStatus = (_props: any) => null;

interface SellerVerificationPageProps {
  seller: Seller;
  onStatusUpdate?: (updates: Partial<Seller>) => void;
  onCancel?: () => void;
}

type VerificationMethod = 'stripe' | 'documents' | null;

export const SellerVerificationPage: React.FC<SellerVerificationPageProps> = ({
  seller,
  onStatusUpdate,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>(null);
  const [showDocumentKYC, setShowDocumentKYC] = useState(false);

  // Check if seller already has Stripe account
  const hasStripeAccount = !!seller.stripe_account_id;
  const stripeOnboardingComplete = seller.stripe_onboarding_completed;

  if (showDocumentKYC) {
    return (
      <div className="animate-in fade-in duration-500">
        <button
          onClick={() => setShowDocumentKYC(false)}
          className="mb-6 text-gray-500 hover:text-gray-900 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          ← Back to verification options
        </button>
        <SellerKYCVerification
          sellerEmail={seller.email}
          sellerPhone={seller.phone || ''}
          sellerFullName={seller.shop_name}
          sellerCountry={'US'}
          sellerId={seller.id}
          onSubmit={(data) => {
            console.log('Document KYC submitted:', data);
            if (onStatusUpdate) {
              onStatusUpdate({ kyc_status: 'pending' });
            }
          }}
          onCancel={() => setShowDocumentKYC(false)}
        />
      </div>
    );
  }

  if (selectedMethod === 'stripe') {
    return (
      <div className="animate-in fade-in duration-500">
        <button
          onClick={() => setSelectedMethod(null)}
          className="mb-6 text-gray-500 hover:text-gray-900 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          ← Back to verification options
        </button>
        
        <div className="bg-[#0a0a0a] border border-gray-900 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center">
              <CreditCard size={24} className="text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Stripe Connect Verification</h2>
              <p className="text-gray-500 text-sm mt-1">Fast, secure identity verification powered by Stripe</p>
            </div>
          </div>

          <StripeKYCStatus 
            seller={seller}
            onStatusUpdate={(updates: Partial<Seller>) => {
              console.log('Stripe KYC status updated:', updates);
              if (onStatusUpdate) {
                onStatusUpdate(updates);
              }
            }}
          />

          {onCancel && (
            <div className="mt-6 pt-6 border-t border-gray-900">
              <button
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Method selection screen
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield size={32} className="text-black" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Verify Your Seller Account</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Choose your preferred verification method. We recommend Stripe Connect for the fastest approval.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Stripe Connect Method - RECOMMENDED */}
        <button
          onClick={() => setSelectedMethod('stripe')}
          className="bg-[#0a0a0a] border-2 border-yellow-500/30 rounded-2xl p-8 text-left hover:border-yellow-500 hover:bg-yellow-500/5 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Recommended
          </div>
          
          <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <CreditCard size={24} className="text-black" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Stripe Connect</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Quick online verification powered by Stripe. Complete in minutes with automatic status updates.
          </p>

          <div className="space-y-3 mb-6">
            <Feature text="5-10 minute verification" icon={<CheckCircle2 size={16} className="text-green-500" />} />
            <Feature text="Automatic status updates" icon={<CheckCircle2 size={16} className="text-green-500" />} />
            <Feature text="Integrated payment processing" icon={<CheckCircle2 size={16} className="text-green-500" />} />
            <Feature text="No document uploads required" icon={<CheckCircle2 size={16} className="text-green-500" />} />
          </div>

          {hasStripeAccount && stripeOnboardingComplete && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-green-400 text-sm font-medium">Already verified</span>
            </div>
          )}

          {hasStripeAccount && !stripeOnboardingComplete && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-yellow-500" />
              <span className="text-yellow-400 text-sm font-medium">Complete verification</span>
            </div>
          )}

          <div className="flex items-center justify-between text-yellow-500 font-medium">
            <span>Get Started</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Traditional Document Method */}
        <button
          onClick={() => setShowDocumentKYC(true)}
          className="bg-[#0a0a0a] border-2 border-gray-200 rounded-2xl p-8 text-left hover:border-gray-200 hover:bg-gray-100/30 transition-all group"
        >
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <FileText size={24} className="text-gray-500" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">Document Upload</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Traditional verification with manual document review. Takes 2-3 business days.
          </p>

          <div className="space-y-3 mb-6">
            <Feature text="Manual review required" icon={<Clock size={16} className="text-gray-500" />} />
            <Feature text="2-3 day processing" icon={<Clock size={16} className="text-gray-500" />} />
            <Feature text="Document uploads needed" icon={<AlertCircle size={16} className="text-gray-500" />} />
            <Feature text="Email updates only" icon={<AlertCircle size={16} className="text-gray-500" />} />
          </div>

          <div className="flex items-center justify-between text-gray-500 font-medium group-hover:text-gray-900 transition-colors">
            <span>Use Documents</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Shield size={20} className="text-blue-400" />
            </div>
          </div>
          <div>
            <h4 className="text-gray-900 font-semibold mb-2">Why Verification is Required</h4>
            <p className="text-gray-500 text-sm leading-relaxed">
              To comply with financial regulations and ensure marketplace safety, we verify all sellers. 
              Your information is encrypted and handled according to industry security standards.
            </p>
          </div>
        </div>
      </div>

      {onCancel && (
        <div className="mt-8 text-center">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

const Feature: React.FC<{ text: string; icon: React.ReactNode }> = ({ text, icon }) => (
  <div className="flex items-center gap-3">
    {icon}
    <span className="text-gray-600 text-sm">{text}</span>
  </div>
);

export default SellerVerificationPage;
