import React, { useState, useRef, useEffect } from 'react';
import { logger } from '../../utils/logger';
import {
  Loader2,
  Mail,
  User,
  Globe,
  Briefcase,
  Phone,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// TODO: Connect to your backend for countries/business types
interface DBCountry { id: string; name: string; code: string; currency: string; phone_code: string; country_name: string; country_code: string; currency_code: string; dialing_code: string; }
interface DBBusinessType { id: string; name: string; description?: string; business_type_name: string; }
const fetchCountries = async (): Promise<DBCountry[]> => [{ id: '1', name: 'India', code: 'IN', currency: 'INR', phone_code: '+91', country_name: 'India', country_code: 'IN', currency_code: 'INR', dialing_code: '+91' }, { id: '2', name: 'United States', code: 'US', currency: 'USD', phone_code: '+1', country_name: 'United States', country_code: 'US', currency_code: 'USD', dialing_code: '+1' }];
const fetchBusinessTypes = async (): Promise<DBBusinessType[]> => [{ id: '1', name: 'Individual', business_type_name: 'Individual' }, { id: '2', name: 'Brand', business_type_name: 'Brand' }, { id: '3', name: 'Freelancing', business_type_name: 'Freelancing' }];

type SignupStep = 'details' | 'otp' | 'success';

// Map database types to component types
interface Country {
  id: string;
  countryName: string;
  shortCode: string;
  currency: string;
  dialCode?: string;
}

interface BusinessType {
  id: string;
  typeName: string;
  description?: string;
}

const SellerSignup: React.FC = () => {
  const [step, setStep] = useState<SignupStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    countryId: '',
    businessTypeId: '',
    mobile: '',
    password: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { signUp, confirmSignUp } = useAuth();

  // Fetch countries and business types from Aurora PostgreSQL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesData, businessTypesData] = await Promise.all([
          fetchCountries(),
          fetchBusinessTypes(),
        ]);
        
        // Map Aurora PostgreSQL format to component format
        const mappedCountries: Country[] = countriesData.map((c: DBCountry) => ({
          id: c.id,
          countryName: c.country_name,
          shortCode: c.country_code,
          currency: c.currency_code,
          dialCode: c.dialing_code
        }));
        
        const mappedBusinessTypes: BusinessType[] = businessTypesData.map((b: DBBusinessType) => ({
          id: b.id,
          typeName: b.business_type_name,
          description: b.description
        }));
        
        if (mappedCountries.length > 0) {
          setCountries(mappedCountries);
          // Default to India if available, otherwise first country
          const india = mappedCountries.find(c => c.shortCode === 'IND');
          setFormData(prev => ({ ...prev, countryId: india?.id || mappedCountries[0].id }));
        }

        if (mappedBusinessTypes.length > 0) {
          setBusinessTypes(mappedBusinessTypes);
          setFormData(prev => ({ ...prev, businessTypeId: mappedBusinessTypes[0].id }));
        }
      } catch (error) {
        logger.error(error as Error, { context: 'Error fetching data for signup' });
        setError('Failed to load countries and business types');
      }
    };
    
    fetchData();
  }, []);

  const selectedCountry = countries.find((c) => c.id === formData.countryId);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password.length > 16) {
      errors.push('Password must not exceed 16 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Must contain at least one special character (!@#$%^&*...)');
    }
    
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    if (value) {
      setPasswordErrors(validatePassword(value));
    } else {
      setPasswordErrors([]);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate password
    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const selectedCountry = countries.find((c) => c.id === formData.countryId);
      const phoneNumber = selectedCountry?.dialCode 
        ? `${selectedCountry.dialCode}${formData.mobile}` 
        : formData.mobile;

      const result = await signUp(
        formData.email, 
        formData.password, 
        'seller', 
        formData.fullName, 
        selectedCountry?.currency,
        phoneNumber // Pass phone number for sellers
      );

      if (result.success) {
        // Store email for OTP verification
        sessionStorage.setItem('sellerSignupEmail', formData.email);
        setIsLoading(false);
        
        // Navigate to OTP verification page
        navigate('/seller/otp-verification', {
          state: {
            email: formData.email,
            purpose: 'seller-signup',
            role: 'seller'
          }
        });
      } else {
        setError(result.error?.message || 'Failed to sign up');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup');
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const signupEmail = sessionStorage.getItem('sellerSignupEmail') || formData.email;
      const result = await confirmSignUp(signupEmail, otpValue);

      if (result.success) {
        setIsLoading(false);
        // Clear signup data
        sessionStorage.removeItem('sellerSignupEmail');
        setStep('success');
        
        // Auto-redirect after 2 seconds since user is now logged in
        setTimeout(() => {
          navigate('/seller/dashboard');
        }, 2000);
      } else {
        setError(result.error?.message || 'Failed to verify OTP');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/95 text-black rounded-2xl shadow-2xl border border-white/40 p-8 md:p-10 relative">
        <Link
          to="/"
          className="absolute top-4 left-4 text-xs font-semibold text-gray-500 hover:text-black"
        >
          Back to Home
        </Link>

        {step === 'details' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold mb-3 text-black">
                Create My Store
              </h1>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Register as a seller and start building your business.
              </p>
            </div>

            <div className="bg-transparent p-0">
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Business Country</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-yellow-500 transition-colors">
                      <Globe size={18} />
                    </div>
                    <select
                      value={formData.countryId}
                      onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                      className="w-full bg-black border-2 border-gray-900 text-white rounded-xl pl-12 pr-10 py-3.5 text-sm focus:outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer"
                      disabled={countries.length === 0}
                    >
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.countryName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Full Name</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-yellow-500 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Enter legal name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-black border-2 border-gray-900 text-white rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 transition-all placeholder:text-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Business Type</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-yellow-500 transition-colors">
                      <Briefcase size={18} />
                    </div>
                    <select
                      value={formData.businessTypeId}
                      onChange={(e) => setFormData({ ...formData, businessTypeId: e.target.value })}
                      className="w-full bg-black border-2 border-gray-900 text-white rounded-xl pl-12 pr-10 py-3.5 text-sm focus:outline-none focus:border-yellow-500 transition-all appearance-none cursor-pointer"
                      disabled={businessTypes.length === 0}
                    >
                      {businessTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.typeName}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Business Email</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-yellow-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="merchant@beauzead.store"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black border-2 border-gray-900 text-white rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 transition-all placeholder:text-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="w-24 bg-[#1a1a1a] border-2 border-gray-900 text-gray-500 rounded-xl px-4 py-3.5 text-sm font-semibold flex items-center justify-center select-none">
                      {selectedCountry?.dialCode || '+0'}
                    </div>
                    <div className="relative group flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-yellow-500 transition-colors">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="Mobile number"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full bg-black border-2 border-gray-900 text-white rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-yellow-500 transition-all placeholder:text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-yellow-500 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 chars, mix of upper/lower, number, special char"
                      value={formData.password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`w-full bg-black border-2 text-white rounded-xl pl-12 pr-12 py-3.5 text-sm focus:outline-none transition-all placeholder:text-gray-800 ${
                        passwordErrors.length > 0 ? 'border-red-500 focus:border-red-500' : 'border-gray-900 focus:border-yellow-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-yellow-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {passwordErrors.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {passwordErrors.map((error, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-red-400">
                          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || passwordErrors.length > 0}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-semibold transition-all shadow-[0_15px_30px_rgba(234,179,8,0.15)] active:scale-95 flex items-center justify-center h-14 disabled:opacity-50 mt-4"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send OTP'}
                </button>
                
                <div className="text-center mt-6">
                  <p className="text-gray-400 text-xs font-medium">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/seller/login')}
                      className="text-yellow-500 hover:text-yellow-400 font-semibold transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold mb-3 text-black">
                Verify Your Email
              </h1>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                We've sent a verification code to {formData.email}
              </p>
            </div>

            <div className="bg-transparent p-0">
              <form onSubmit={handleVerifyOtp} className="space-y-8">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        if (el) otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-full py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-center text-xl font-semibold"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isLoading || otp.join('').length < 6}
                    className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify OTP'}
                  </button>
                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-gray-500 hover:text-black transition-colors"
                    >
                      Resend Code
                    </button>
                    <div>
                      <button
                        type="button"
                        onClick={() => setStep('details')}
                        className="text-xs font-semibold text-gray-500 hover:text-black transition-colors"
                      >
                        Back to Details
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <p className="mt-8 text-center text-gray-700 text-[10px] font-semibold">
              Secure Merchant Verification <span className="mx-2">•</span> Encrypted Session
            </p>
          </>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                <CheckCircle2 size={36} className="animate-bounce" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold mb-4 text-black">
              Verification Successful
            </h1>
            <p className="text-gray-500 text-sm font-medium mb-12 leading-relaxed">
              Your seller account has been verified. Redirecting to seller dashboard...
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-yellow-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerSignup;
