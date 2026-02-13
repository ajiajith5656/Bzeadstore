# BeauZead — Authentication System Brief

> Complete technical breakdown of Signup, Login, Forgot Password for **User**, **Seller**, and **Admin** roles.
> Covers: flow logic, role assignment, database tables, backend triggers, route guards, and pending integrations.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Database Tables Involved](#2-database-tables-involved)
3. [User Signup Flow](#3-user-signup-flow)
4. [Seller Signup Flow](#4-seller-signup-flow)
5. [Admin Account Creation](#5-admin-account-creation)
6. [Login Flow (All Roles)](#6-login-flow-all-roles)
7. [Forgot Password Flow](#7-forgot-password-flow)
8. [Role Assignment & Update Logic](#8-role-assignment--update-logic)
9. [Route Guard & Access Control](#9-route-guard--access-control)
10. [Session Management](#10-session-management)
11. [Password Validation Rules](#11-password-validation-rules)
12. [Issues & Integrations Left To Do](#12-issues--integrations-left-to-do)

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Auth Provider** | Supabase Auth (email + password) |
| **Frontend** | React 19 + React Router 7 |
| **State Management** | `AuthContext` (React Context API) |
| **Database** | Supabase PostgreSQL |
| **OTP Delivery** | Supabase built-in email (configured in Supabase Dashboard) |
| **Client SDK** | `@supabase/supabase-js` v2.95 |

---

## 2. Database Tables Involved

### 2.1 `auth.users` (Supabase managed)
- Auto-managed by Supabase Auth SDK
- Stores: `id (uuid)`, `email`, `encrypted_password`, `raw_user_meta_data (jsonb)`, `email_confirmed_at`, `created_at`
- The `raw_user_meta_data` field stores signup metadata: `{ role, full_name, currency, phone }`

### 2.2 `public.profiles` (Custom table)
```sql
CREATE TABLE public.profiles (
  id            uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email         text NOT NULL,
  role          text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
  full_name     text,
  phone         text,
  avatar_url    text,
  country_id    uuid REFERENCES public.countries(id),
  business_type_id uuid REFERENCES public.business_types(id),
  currency      text DEFAULT 'INR',
  is_verified   boolean DEFAULT false,
  approved      boolean DEFAULT false,
  is_banned     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
```

### 2.3 `public.countries` (Referenced during signup)
```sql
CREATE TABLE public.countries (
  id            uuid PRIMARY KEY,
  country_name  text NOT NULL UNIQUE,
  country_code  char(2) NOT NULL UNIQUE,
  short_code    char(3) NOT NULL UNIQUE,
  currency_code char(3) NOT NULL,
  dialing_code  text NOT NULL,
  is_active     boolean DEFAULT true
);
```
- 10 countries seeded: India, US, UK, Canada, Australia, Germany, France, Japan, Singapore, UAE

### 2.4 `public.business_types` (Referenced for seller signup)
```sql
CREATE TABLE public.business_types (
  id        uuid PRIMARY KEY,
  type_name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true
);
```
- 3 types seeded: Individual, Brand, Freelancing

---

## 3. User Signup Flow

### 3.1 Frontend Files
- **Component:** `src/components/auth/Signup.tsx` — renders with `role="user"`
- **Route:** `/signup`
- **OTP Page:** `src/pages/OTPVerification.tsx` — shared for user & seller

### 3.2 Step-by-Step Flow

```
User fills form → signUp() → Supabase sends OTP email → Navigate to /otp-verification
→ User enters 6-digit OTP → confirmSignUp() → Profile auto-created by DB trigger
→ country_id updated → Redirect to /
```

**Step 1: Form Submission** (`Signup.tsx → handleDetailsSubmit`)
1. User enters: **Country** (dropdown from `countries` table), **Full Name**, **Email**, **Password**
2. Frontend validates:
   - Full name starts with capital letter
   - Password: 8-16 chars, uppercase, lowercase, number, special char
3. Calls `signUp(email, password, 'user', fullName, currency)`

**Step 2: AuthContext.signUp()** (`AuthContext.tsx`)
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {             // ← stored in auth.users.raw_user_meta_data
      full_name: fullName,
      role: 'user',     // ← This is how the role is passed
      currency: 'INR',
      phone: '',
    },
  },
});
```
- Supabase creates the user in `auth.users` with `email_confirmed_at = NULL`
- Supabase automatically sends a **6-digit OTP** to the email
- Returns `{ success: true, isSignUpComplete: false }`

**Step 3: OTP Verification** (`OTPVerification.tsx`)
1. User enters 6-digit code
2. Calls `confirmSignUp(email, otpCode)` which runs:
```typescript
await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
```
3. On success → Supabase sets `email_confirmed_at`, creates a session, user is now logged in
4. The `onAuthStateChange` listener fires → `fetchProfile()` reads from `profiles` table

**Step 4: Profile Auto-Creation** (DB Trigger — `04_profiles.sql`)
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone, currency)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'user'),  -- ← Role from metadata
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'phone', ''),
    COALESCE(new.raw_user_meta_data ->> 'currency', 'INR')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
- **This is the critical piece**: The trigger fires IMMEDIATELY when a row is inserted into `auth.users` (at signup time, NOT at OTP confirmation)
- Role is extracted from `raw_user_meta_data.role` — whatever was passed in `signUp()`

**Step 5: Country Update** (OTPVerification.tsx, post-OTP)
```typescript
// After OTP confirmed, update the country_id that was stored in sessionStorage
const pendingCountryId = sessionStorage.getItem('signupCountryId');
if (pendingCountryId) {
  await supabase.from('profiles').update({ country_id: pendingCountryId }).eq('id', currentUser.id);
  sessionStorage.removeItem('signupCountryId');
}
```
- `country_id` can't be set during signup because the user doesn't have an active session yet (OTP not confirmed). So it's stored in `sessionStorage` and applied after verification.

**Step 6: Redirect**
- User role → Redirects to `/` (home page)
- Seller role → Redirects to `/seller/dashboard`

---

## 4. Seller Signup Flow

### 4.1 Frontend Files
- **Component:** `src/pages/seller/SellerSignup.tsx` — separate standalone component
- **Route:** `/seller/signup`
- **OTP Page:** `src/pages/OTPVerification.tsx` (shared, receives `purpose='seller-signup'`)

### 4.2 Step-by-Step Flow

```
Seller fills form → signUp() with role='seller' → OTP email sent → Navigate to /seller/otp-verification
→ Seller enters OTP → confirmSignUp() → Profile created with role='seller' → Redirect to /seller/dashboard
```

**Step 1: Form Submission** (`SellerSignup.tsx → handleDetailsSubmit`)
1. Seller enters: **Country**, **Full Name**, **Business Type**, **Email**, **Mobile Number** (with country dial code), **Password**
2. Countries and business types loaded from **hardcoded local arrays** (NOT from Supabase — see Issues section)
3. Phone number constructed as `${dialCode}${mobile}`
4. Calls `signUp(email, password, 'seller', fullName, currency, phoneNumber)`

**Step 2: Same as User** — `supabase.auth.signUp()` with `role: 'seller'` in metadata

**Step 3: OTP sent to `/seller/otp-verification`** with navigation state:
```typescript
navigate('/seller/otp-verification', {
  state: { email, purpose: 'seller-signup', role: 'seller' }
});
```

**Step 4: OTP Verification** — Same shared `OTPVerification.tsx` component with seller-specific redirect

**Step 5: DB Trigger creates profile** with `role = 'seller'` from metadata

**Step 6: Redirect to `/seller/dashboard`**

### 4.3 Key Differences from User Signup
| Aspect | User | Seller |
|--------|------|--------|
| Route | `/signup` | `/seller/signup` |
| Component | `Signup.tsx` (shared) | `SellerSignup.tsx` (standalone) |
| Extra Fields | — | Business Type, Mobile Number |
| Countries Source | Supabase `countries` table | **Hardcoded local array** |
| Default State | Active user | Needs KYC verification later |
| Theme | White minimal | Black + Yellow theme |
| OTP Route | `/otp-verification` | `/seller/otp-verification` |
| Post-signup Redirect | `/` (home) | `/seller/dashboard` |

---

## 5. Admin Account Creation

### 5.1 There is NO Admin Signup UI

Admin accounts are **NOT** created through the frontend. The routes `/admin/login` and `/admin/signup` both redirect to `/login`:

```tsx
<Route path="/admin/login" element={<Navigate to="/login" replace />} />
<Route path="/admin/signup" element={<Navigate to="/login" replace />} />
```

### 5.2 How to Create an Admin

Documented in `supabase/07_admin_setup.sql`:

**Method 1: Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users → Add User
2. Set Email: `admin@beauzead.store`, Password, Auto Confirm: ON
3. Get the UUID from dashboard
4. Run SQL: `UPDATE public.profiles SET role = 'admin' WHERE id = 'UUID_HERE';`

**Method 2: Supabase Admin API**
```typescript
const { data } = await supabase.auth.admin.createUser({
  email: 'admin@beauzead.store',
  password: 'YourSecurePassword123!',
  email_confirm: true,
  user_metadata: { role: 'admin', full_name: 'Admin' }
});
```
- If `user_metadata.role = 'admin'`, the DB trigger will create a profile with `role = 'admin'` automatically

### 5.3 Admin Login
- Admin logs in through the **same `/login` page** as users (the `Login.tsx` component)
- OR through `/seller/login` (`SellerLogin.tsx` — titled "Seller & Admin Login")
- After login, `signIn()` fetches the profile and gets `role = 'admin'`
- The frontend redirects to `/admin` based on the role:
```typescript
if (userRole === 'admin') {
  navigate('/admin');
} else if (userRole === 'seller') {
  navigate('/seller/dashboard');
} else {
  navigate('/');
}
```

---

## 6. Login Flow (All Roles)

### 6.1 Frontend Files
| Role | Route | Component |
|------|-------|-----------|
| User | `/login` | `src/components/auth/Login.tsx` (with `role="user"`) |
| Seller | `/seller/login` | `src/pages/seller/SellerLogin.tsx` |
| Admin | `/login` (redirected from `/admin/login`) | `src/components/auth/Login.tsx` |

### 6.2 Unified Sign-In Logic

All login forms call the **same** `signIn()` function from `AuthContext`:

```typescript
const signIn = async (email: string, password: string) => {
  // 1. Call Supabase
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // 2. Handle errors (wrong credentials, email not confirmed)

  // 3. Fetch profile from profiles table
  const profile = await fetchProfile(data.user);

  // 4. Set state: user, authRole, currentAuthUser
  setUser(profile);
  setAuthRole(profile.role);  // ← This determines routing

  // 5. Return role to the calling component
  return { success: true, isSignedIn: true, role: profile.role };
};
```

### 6.3 fetchProfile() Logic (with retry)
```
Attempt 1: SELECT * FROM profiles WHERE id = supabaseUser.id
  → If error (e.g., profile not created yet) → wait 1s → retry (up to 3 times)
  → If all retries fail → fallback to user_metadata: { role: metadata.role, ... }
  → If success → return profile data with role
```

### 6.4 Post-Login Redirect Logic
Every login component reads the `role` from the `signIn()` response and redirects:

```typescript
if (userRole === 'admin')  → navigate('/admin')
if (userRole === 'seller') → navigate('/seller/dashboard')
if (userRole === 'user')   → navigate('/')
```

### 6.5 Important: No Role Validation at Login
- There is **NO check** that a user logging in at `/seller/login` actually has `role='seller'`
- A regular user can log in via `/seller/login` — they'll just be redirected to `/` by the route guard
- Similarly, an admin can log in via `/login` and will be redirected to `/admin`
- The **role comes from the database**, not from which login page was used

---

## 7. Forgot Password Flow

### 7.1 Frontend Files
| Role | Route | Component |
|------|-------|-----------|
| User | `/forgot-password` | `src/pages/user/ForgotPassword.tsx` |
| Seller | `/seller/forgot-password` | `src/pages/seller/SellerForgotPassword.tsx` |
| Admin | No separate page — uses user forgot password | `ForgotPassword.tsx` |

### 7.2 Step-by-Step Flow

```
Enter email → resetPassword() → Supabase sends recovery email → Navigate to OTP page
→ Enter 6-digit OTP → Navigate to /new-password with OTP in state
→ Enter new password → confirmPasswordReset() → verifyOtp + updateUser → Redirect to login
```

**Step 1: Request Reset** (`ForgotPassword.tsx → handleEmailSubmit`)
```typescript
const result = await resetPassword(email);
// If success → navigate to OTP verification
navigate('/otp-verification', {
  state: { email, purpose: 'password-reset', role: 'user' }
});
```

**Step 2: AuthContext.resetPassword()**
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/new-password`,
});
```
- Supabase sends a recovery OTP email

**Step 3: OTP Verification** (`OTPVerification.tsx`)
- User enters 6-digit code
- For password reset, the code is **NOT verified here** — it's just passed to the next page
- Navigate to `/new-password` with `{ email, otpCode, role }` in state

**Step 4: Set New Password** (`NewPassword.tsx`)
```typescript
const result = await confirmPasswordReset(email, otpCode, newPassword);
```

**Step 5: AuthContext.confirmPasswordReset()**
```typescript
// 1. Verify OTP
await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });

// 2. Update password (user is now authenticated via the recovery token)
await supabase.auth.updateUser({ password: newPassword });
```

**Step 6: Redirect to login** with success message:
```typescript
navigate('/login', {
  state: { message: 'Password reset successfully! Please login with your new password.' }
});
```

### 7.3 Seller Forgot Password
- **Separate component** (`SellerForgotPassword.tsx`) but **identical logic**
- The only differences:
  - Navigates to `/seller/otp-verification` instead of `/otp-verification`
  - Back link goes to `/seller/login` instead of `/login`
  - Success redirects to `/seller/login`
- `SellerForgotPassword.tsx` also has an **embedded multi-step flow** (email → OTP → password → success) inside the same component, but the primary flow navigates to the shared OTP page

---

## 8. Role Assignment & Update Logic

### 8.1 Where is the Role Set?

| Step | Where | How |
|------|-------|-----|
| **Signup** | `supabase.auth.signUp()` | Passed as `options.data.role` → stored in `auth.users.raw_user_meta_data` |
| **Profile Creation** | DB trigger `handle_new_user()` | Reads `raw_user_meta_data.role` → inserts into `profiles.role` |
| **Login** | `fetchProfile()` | Reads `profiles.role` → sets `authRole` state |
| **Fallback** | `fetchProfile()` retry failure | Falls back to `user_metadata.role` from Supabase auth |

### 8.2 Can the Role Be Changed?

- **By the user themselves**: NO. There is no frontend UI for users to change their role.
- **By admin**: YES. Admin can update `profiles.role` via `adminService.updateSellerBadge()` (though this function incorrectly updates `role` column instead of a badge field — see Issues).
- **By SQL**: YES. Direct SQL: `UPDATE profiles SET role = 'admin' WHERE id = '...'`
- **Supabase Dashboard**: The `raw_user_meta_data.role` in `auth.users` is **NOT synced** back to `profiles.role`. If you change metadata, the profile stays the same.

### 8.3 Role Hierarchy

```
admin  → Full access to everything (admin panel, seller dashboard, all data)
seller → Access to seller dashboard, own products/orders/wallet, KYC
user   → Access to shopping, cart, wishlist, orders, profile, reviews
guest  → Home page, product browsing, categories, legal pages only
```

### 8.4 RLS (Row Level Security) by Role

The `profiles` table RLS uses a helper function to check roles:

```sql
CREATE FUNCTION public.get_my_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;
```

This function is used across ALL tables for admin-level policies:
```sql
-- Example: Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'admin');
```

---

## 9. Route Guard & Access Control

### 9.1 RouteGuard Component (`App.tsx`)

The `RouteGuard` wraps ALL routes and runs on every navigation:

```typescript
// Simplified logic:

// 1. Public routes — always accessible
const publicPaths = ['/', '/login', '/signup', '/seller', '/seller/login', ...];

// 2. If NOT authenticated:
//    - /admin/* → redirect to /login
//    - /seller/* → redirect to /seller/login
//    - anything else → redirect to /login

// 3. If authenticated:
//    - /admin/*   → ONLY admin role allowed (others → /)
//    - /seller/*  → seller OR admin allowed (others → /seller/login)
//    - /orders, /profile, /cart, etc. → ONLY user role allowed (others → /login)
```

### 9.2 Admin Layout Double-Check

The `AdminLayout.tsx` has its own role check:
```typescript
const effectiveRole = user?.role || authRole;
if (effectiveRole !== 'admin') {
  return <Navigate to="/" replace />;
}
```

### 9.3 Access Matrix

| Route | Guest | User | Seller | Admin |
|-------|-------|------|--------|-------|
| `/` (home) | ✅ | ✅ | ✅ | ✅ |
| `/login`, `/signup` | ✅ | ✅ | ✅ | ✅ |
| `/products/*` | ✅ | ✅ | ✅ | ✅ |
| `/category/*` | ✅ | ✅ | ✅ | ✅ |
| `/orders`, `/cart`, `/wishlist`, `/profile`, `/settings` | ❌ → `/login` | ✅ | ❌ → `/login` | ❌ → `/login` |
| `/checkout/*` | ❌ → `/login` | ✅ | ❌ → `/login` | ❌ → `/login` |
| `/seller/dashboard`, `/seller/products`, etc. | ❌ → `/seller/login` | ❌ → `/seller/login` | ✅ | ✅ |
| `/admin`, `/admin/*` | ❌ → `/login` | ❌ → `/` | ❌ → `/` | ✅ |
| `/seller` (landing) | ✅ | ✅ | ✅ | ✅ |
| `/seller/login`, `/seller/signup` | ✅ | ✅ | ✅ | ✅ |

---

## 10. Session Management

### 10.1 Token Storage
- Supabase stores the JWT in `localStorage` under key: `sb-parladtqltuorczapzfm-auth-token`
- Contains: `access_token`, `refresh_token`, `expires_at`

### 10.2 Stale Token Cleanup
Before the SDK initializes, `clearStaleToken()` runs:
```typescript
function clearStaleToken(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = JSON.parse(raw);
  if (parsed.expires_at * 1000 < Date.now()) {
    localStorage.removeItem(STORAGE_KEY);
  }
}
```
This prevents the SDK from attempting a slow token refresh that blocks login.

### 10.3 Auth State Listener
A single `onAuthStateChange` listener handles all events:
- `INITIAL_SESSION` → Load existing session on app start
- `SIGNED_IN` → After login or OTP verification
- `SIGNED_OUT` → Clear all state
- `TOKEN_REFRESHED` → Re-fetch profile (ensures stale data is refreshed)

### 10.4 Safety Nets
- **10-second timeout**: If `INITIAL_SESSION` doesn't fire, user continues as guest
- **15-second fetch timeout**: Per-request timeout on all Supabase API calls
- **120-second timeout**: For storage uploads (images/documents)
- **3 retries**: `fetchProfile()` retries 3 times with 1-second delays (profile may not be created instantly by trigger)

---

## 11. Password Validation Rules

Consistent across ALL signup and password reset forms:

| Rule | Requirement |
|------|-------------|
| Min Length | 8 characters |
| Max Length | 16 characters |
| Uppercase | At least 1 uppercase letter (A-Z) |
| Lowercase | At least 1 lowercase letter (a-z) |
| Number | At least 1 digit (0-9) |
| Special Char | At least 1 of: `!@#$%^&*()_+-=[]{};\|,.<>?/` |

Validated in real-time with error messages shown per-rule.

---

## 12. Issues & Integrations Left To Do

### 12.1 CRITICAL Issues

| # | Issue | Impact | Where |
|---|-------|--------|-------|
| 1 | **Resend OTP is NOT implemented** | User can't resend if email doesn't arrive | `OTPVerification.tsx` line 152 — has `// TODO: Connect to your backend resend OTP API` |
| 2 | **Seller Signup uses hardcoded countries/business types** | Not loading from Supabase `countries` and `business_types` tables | `SellerSignup.tsx` — `fetchCountries()` and `fetchBusinessTypes()` return static arrays |
| 3 | **No role validation at login boundary** | A user can log in at `/seller/login` (they'll be route-guarded, but the UX is confusing — no error message saying "you're not a seller") | `SellerLogin.tsx`, `Login.tsx` |
| 4 | **`updateSellerBadge()` overwrites `role` column** | Calling this function to set a seller badge actually changes the user's role, potentially breaking their access | `adminService.ts` — `UPDATE profiles SET role = badge WHERE id = sellerId` |

### 12.2 MODERATE Issues

| # | Issue | Impact | Where |
|---|-------|--------|-------|
| 5 | **Seller Signup doesn't save `business_type_id` or `country_id`** | The `signUp()` function doesn't pass `businessTypeId` to Supabase. The DB trigger doesn't set `business_type_id`. The OTP page only sets `country_id` for user signup, NOT for seller signup. | `SellerSignup.tsx`, `AuthContext.tsx`, `OTPVerification.tsx` |
| 6 | **User Settings page is fully mocked** | All save operations use `setTimeout` simulation — no actual Supabase calls | `src/pages/user/Settings.tsx` |
| 7 | **ForgotPassword.tsx has duplicate flow** | Has both inline multi-step (email/OTP/password/success) AND navigation to shared OTP page. Both exist but only the navigation path is actually used. Dead code in the inline OTP/password steps. | `src/pages/user/ForgotPassword.tsx` |
| 8 | **No email uniqueness check before signup** | If a user tries to sign up with an existing email, they get a Supabase error, but there's no pre-check for a better UX | `Signup.tsx`, `SellerSignup.tsx` |

### 12.3 MINOR / Nice-to-Have

| # | Issue | Recommendation |
|---|-------|----------------|
| 9 | **No "Remember Me" option** | Supabase sessions persist by default (localStorage), so this is cosmetic |
| 10 | **No social auth (Google, GitHub, etc.)** | Only email+password is implemented |
| 11 | **No account deletion flow** | User cannot delete their own account from the UI |
| 12 | **No email change confirmation** | `Profile.tsx` calls `supabase.auth.updateUser({ email })` but Supabase requires email confirmation for changes — this may silently fail |
| 13 | **Admin login UX** | Admin must use the regular `/login` page — there's no visual indication which portal they're logging into |
| 14 | **No rate limiting on frontend** | Login/signup forms don't implement client-side rate limiting (Supabase has server-side limits) |

### 12.4 Integration Checklist

| Task | Status | Priority |
|------|--------|----------|
| Implement Resend OTP (call `supabase.auth.resend()`) | ❌ Not Done | **HIGH** |
| Connect SellerSignup to Supabase `countries` + `business_types` tables | ❌ Not Done | **HIGH** |
| Fix `updateSellerBadge()` to use a `badge` column instead of `role` | ❌ Not Done | **HIGH** |
| Save `business_type_id` and `country_id` for sellers during signup | ❌ Not Done | **MEDIUM** |
| Add role mismatch warning on login (e.g., user logging at seller portal) | ❌ Not Done | **MEDIUM** |
| Wire up User Settings to Supabase (currently all mocked) | ❌ Not Done | **MEDIUM** |
| Remove dead code in ForgotPassword.tsx inline multi-step flow | ❌ Not Done | **LOW** |
| Add social auth providers (Google, etc.) | ❌ Not Done | **LOW** |
| Add account deletion flow | ❌ Not Done | **LOW** |

---

## Appendix: File Map

```
src/
├── contexts/
│   └── AuthContext.tsx          ← Central auth logic (signUp, signIn, signOut, resetPassword, confirmPasswordReset, confirmSignUp)
├── lib/
│   └── supabase.ts             ← Supabase client with custom fetch timeout
├── components/auth/
│   ├── Login.tsx                ← Shared login component (user + admin)
│   └── Signup.tsx               ← Shared signup component (user only)
├── pages/
│   ├── OTPVerification.tsx      ← Shared OTP verification (signup + password reset, user + seller)
│   ├── NewPassword.tsx          ← Shared new password form (user + seller)
│   ├── user/
│   │   └── ForgotPassword.tsx   ← User forgot password
│   └── seller/
│       ├── SellerLogin.tsx      ← Seller + Admin login
│       ├── SellerSignup.tsx     ← Seller signup (standalone)
│       └── SellerForgotPassword.tsx ← Seller forgot password
├── App.tsx                      ← RouteGuard + all route definitions
supabase/
├── 03_functions.sql             ← get_my_role() helper
├── 04_profiles.sql              ← profiles table + handle_new_user() trigger
└── 07_admin_setup.sql           ← Admin creation instructions
```
