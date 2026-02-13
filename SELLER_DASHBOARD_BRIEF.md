# BeauZead — Seller Dashboard System Brief

> Complete technical breakdown of the Seller Dashboard: features, UI, KYC verification, product listing, order management, wallet & payouts, analytics, and backend integration status.

---

## Table of Contents

1. [Dashboard Architecture](#1-dashboard-architecture)
2. [Dashboard Entry & Sidebar Navigation](#2-dashboard-entry--sidebar-navigation)
3. [KYC Verification System](#3-kyc-verification-system)
4. [Product Listing & Management](#4-product-listing--management)
5. [Order Management](#5-order-management)
6. [Wallet & Payout System](#6-wallet--payout-system)
7. [Analytics Dashboard](#7-analytics-dashboard)
8. [Seller Profile](#8-seller-profile)
9. [Product Image Management](#9-product-image-management)
10. [Backend Database Tables](#10-backend-database-tables)
11. [Backend Services (Supabase)](#11-backend-services-supabase)
12. [Stripe Payment Integration](#12-stripe-payment-integration)
13. [RLS (Row Level Security) Rules](#13-rls-row-level-security-rules)
14. [Integration Status — Completed vs Pending](#14-integration-status--completed-vs-pending)
15. [File Map](#15-file-map)

---

## 1. Dashboard Architecture

### 1.1 Flow Overview

```
Seller Login (/seller/login)
  → SellerDashboardWrapper (fetches KYC status from Supabase)
    → Maps kyc_status: 'approved' → 'verified' | 'pending' → 'pending' | else → 'unverified'
    → SellerDashboard (main shell with sidebar + content area)
      → If unverified: shows verification banner, locks Products/Orders/Sales/Payouts nav items
      → If pending: shows "Under Review" banner, same locks
      → If verified: unlocks all sections, fetches orders for stats
```

### 1.2 Wrapper Pattern

Every seller page uses a **Wrapper** component that:
1. Gets `user` from `AuthContext`
2. Extracts `sellerId` from `user.id` or `currentAuthUser`
3. Fetches relevant data (KYC status, orders, products)
4. Handles loading/error states
5. Renders the presentational component with props

| Page | Wrapper | Presentational |
|------|---------|----------------|
| Dashboard | `SellerDashboardWrapper.tsx` | `SellerDashboard.tsx` |
| Verification | `SellerVerificationWrapper.tsx` | `SellerVerificationPage.tsx` → `SellerKYCVerification.tsx` |
| Products | `SellerProductListingWrapper.tsx` | `SellerProductListing.tsx` |
| Orders | `SellerOrderManagementWrapper.tsx` | `SellerOrderManagement.tsx` |
| Wallet | `SellerWalletWrapper.tsx` | `SellerWallet.tsx` |

### 1.3 Routes (from App.tsx)

```tsx
/seller/dashboard        → SellerDashboardWrapper
/seller/verify           → SellerVerificationWrapper
/seller/products         → SellerProductListingWrapper
/seller/orders           → SellerOrderManagementWrapper
/seller/wallet           → SellerWalletWrapper
/seller/analytics        → AnalyticsDashboard
/seller/profile          → SellerProfile
/seller/product-images   → SellerProductImageManagement
```

All `/seller/*` dashboard routes require **seller** OR **admin** role (enforced by `RouteGuard`).

---

## 2. Dashboard Entry & Sidebar Navigation

### 2.1 Sidebar Menu Items

| # | Label | Icon | Section | Requires KYC Verified? | Backend Connected? |
|---|-------|------|---------|----------------------|-------------------|
| 1 | **Overview** | `LayoutDashboard` | `overview` | No | ✅ Yes (orders fetched for stats) |
| 2 | **Verification** | `Shield` | `verification` | No (only shown when NOT verified) | ✅ Yes (KYC service) |
| 3 | **My Products** | `Package` | Navigates to `/seller/products` | **Yes** | ✅ Yes (productService) |
| 4 | **Order Tracking** | `ShoppingBag` | `orders` | **Yes** | ✅ Yes (orderService) |
| 5 | **Sales Reports** | `BarChart2` | `sales` | **Yes** | ✅ Yes (orders-based analytics) |
| 6 | **Payout Info** | `DollarSign` | `payouts` | **Yes** | ✅ Yes (orderService + withdrawals) |
| 7 | **Store Settings** | `Settings` | `settings` | No | ❌ Not implemented (placeholder) |

### 2.2 Header Buttons & Elements

| Element | Type | Function | Backend? |
|---------|------|----------|----------|
| **"Verify My Store"** | Yellow pulsing button | Navigates to `/seller/verify` | ✅ |
| **"Pending" badge** | Blue info badge | Shows when KYC status is pending | ✅ |
| **Bell icon** | Notification bell with yellow dot | Placeholder — no notification system wired | ❌ |
| **"Merchant Elite" label** | Status text | Shows verification status (Verified/Pending/Unverified) | ✅ |
| **"BZ" avatar** | Brand badge | Static, no profile image | ❌ |
| **"End Session"** | Logout button | Calls `signOut()` → redirects to `/seller` | ✅ |

### 2.3 Overview Section — Stat Cards

When verified, dashboard fetches up to 50 orders via `fetchOrdersBySeller()` and computes:

| Card | Metric | Calculation |
|------|--------|-------------|
| **Total Payouts** | `₹X.XX` | Sum of `(order.total_amount * 0.90)` for all delivered orders (10% platform fee deducted) |
| **Active Orders** | Count | Orders with status `new`, `processing`, or `shipped` |
| **Total Orders** | Count | All orders count |
| **Conversion Rate** | `X%` | `(delivered ÷ total) × 100` |

**Note:** Trend percentages (+14.2%, +5.1%, etc.) are **hardcoded** — not calculated from real data.

### 2.4 Overview Section — Other Widgets

| Widget | Content | Backend? |
|--------|---------|----------|
| **Performance Analytics** | Placeholder card ("insights will be available once store is active") | ❌ |
| **Recent Orders** | Last 5 orders with order number, date, amount, status | ✅ Real data |
| **"Manage Inventory" button** | Navigates to product listing | ✅ |

---

## 3. KYC Verification System

### 3.1 Overall Flow

```
Seller clicks "Verify My Store"
  → SellerVerificationPage checks existing KYC status (getSellerKYCStatus)
  → Renders status card: Not Started / Draft / Pending / Approved / Rejected
  → If (none / draft / rejected): show "Start KYC Verification" button
    → Opens SellerKYCVerification (5-step form)
    → Step 1: Tax Information → Step 2: Identity → Step 3: Address
    → Step 4: Bank Details → Step 5: Compliance
    → Submit → submitCompleteKYC() → Upload docs to 'kyc-documents' bucket
    → Upsert row in seller_kyc table with status='pending'
  → If approved: show verified badge + approval date
  → If rejected: show rejection reason + "Resubmit" button
```

### 3.2 KYC Form — 5 Steps

#### Step 1: Tax Information
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| **PAN** | Text (uppercase) | Regex: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` | ✅ Yes |
| **GSTIN** | Text (uppercase) | Regex: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}$` | ❌ Optional (required if annual turnover > ₹40L) |

#### Step 2: Identity Verification
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| **Document Type** | Dropdown | Options: Aadhar Card, Passport, Voter ID, Driver's License | ✅ Yes |
| **Document Number** | Text | Must not be empty | ✅ Yes |
| **Upload Document** | File (PDF/JPG/PNG) | Max 5MB | ✅ Yes |

#### Step 3: Business Address
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| **Street Address Line 1** | Text | Not empty | ✅ Yes |
| **Street Address Line 2** | Text | — | ❌ Optional |
| **City** | Text | Not empty | ✅ Yes |
| **State** | Text | Not empty | ✅ Yes |
| **Postal Code** | Text | Not empty | ✅ Yes |
| **Upload Address Proof** | File (PDF/JPG/PNG) | Max 5MB | ✅ Yes |

Pre-filled from signup: seller name, email, phone.

#### Step 4: Bank Details
| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| **Account Holder Name** | Text | Not empty | ✅ Yes |
| **Account Number** | Text | 9-18 digits, numbers only | ✅ Yes |
| **IFSC Code** | Text (uppercase) | Regex: `^[A-Z]{4}0[A-Z0-9]{6}$` | ✅ Yes |
| **Account Type** | Dropdown | Options: Checking, Savings, Current | ✅ Yes |
| **Bank Statement** | File (PDF only) | Max 10MB | ✅ Yes |

#### Step 5: Compliance & Legal
| Checkbox | Description | Required |
|----------|-------------|----------|
| **PEP Declaration** | Confirm not a Politically Exposed Person | ✅ Yes |
| **Sanctions Check** | Confirm not on any sanctions list | ✅ Yes |
| **AML Compliance** | Agree to Anti-Money Laundering regulations | ✅ Yes |
| **Tax Compliance** | Confirm accurate info, comply with tax laws | ✅ Yes |
| **Terms & Conditions** | Accept seller terms, KYC policy, privacy policy | ✅ Yes |

### 3.3 KYC Backend Flow (submitCompleteKYC)

```
1. Upload ID document → 'kyc-documents/{sellerId}/id_document_{timestamp}.ext'
2. Upload address proof → 'kyc-documents/{sellerId}/address_proof_{timestamp}.ext'
3. Upload bank statement → 'kyc-documents/{sellerId}/bank_statement_{timestamp}.ext'
4. Upsert seller_kyc row with all form data + doc URLs + kyc_status='pending'
```

Upload uses **direct fetch** (bypasses Supabase SDK abort signals) with:
- Session token refresh before upload
- File validation: MIME types (JPEG, PNG, PDF, DOC/DOCX), max 10MB
- Auto-retry: up to 2 retries with exponential backoff

### 3.4 Admin KYC Actions (via kycService)

| Function | Action | DB Effect |
|----------|--------|-----------|
| `approveKYC(kycId, sellerId, adminId)` | Approves KYC | Sets `kyc_status='approved'`, `verified_by_admin`, `verified_at`. Updates `profiles.is_verified=true, approved=true` |
| `rejectKYC(kycId, sellerId, reason)` | Rejects KYC | Sets `kyc_status='rejected'`, `rejection_reason`. Updates `profiles.is_verified=false, approved=false` |
| `deleteKYC(kycId)` | Deletes KYC record | Removes row from `seller_kyc` |
| `fetchAllKYCSubmissions()` | Lists all KYC (admin only) | `SELECT * FROM seller_kyc ORDER BY submitted_at DESC` |

### 3.5 KYC Status Impact on Dashboard

| Status | Products | Orders | Sales | Payouts | Verification Nav |
|--------|----------|--------|-------|---------|-----------------|
| `unverified` | 🔒 Locked | 🔒 Locked | 🔒 Locked | 🔒 Locked | ✅ Shown (badge: "Required") |
| `pending` | 🔒 Locked | 🔒 Locked | 🔒 Locked | 🔒 Locked | ✅ Shown (badge: "Pending") |
| `verified` | ✅ Open | ✅ Open | ✅ Open | ✅ Open | ❌ Hidden |

---

## 4. Product Listing & Management

### 4.1 Product List View

**Route:** `/seller/products`  
**Component:** `SellerProductListing.tsx` (1945 lines)

#### Stats Cards (top of page)
| Card | Data | Backend |
|------|------|---------|
| Total Revenue | Sum of product revenues | ✅ Fetched from products table (but revenue=0 — not calculated from orders) |
| Total Orders | Sum of product order counts | ✅ Same issue — always 0 |
| Product Views | Sum of product views | ✅ Same issue — always 0 |
| Active Items | Count where `approved && inStock` | ✅ |
| Critical Stock | Count where `stock < 10` | ✅ |
| Pending Approval | Count where `!approved` | ✅ |

**Note:** Revenue, orders, and views per product are always 0 because the `products` table doesn't track these — they'd need to be calculated from `orders`/`order_items`. This is a **known gap**.

#### Filters & Search
| Filter | Options | Backend |
|--------|---------|---------|
| Search | By name or SKU | ✅ Client-side filter |
| Category | Dropdown: All + detected categories | ✅ Client-side filter |
| Status | All, Active, Pending, Out of Stock | ✅ Client-side filter |

#### Product Cards
Each product displays: Image, Name, Category, Brand, Price, Stock count, Approval status badge (Approved/Pending/Rejected), Rating, Discount %.

#### Buttons on Product List
| Button | Action | Backend |
|--------|--------|---------|
| **"+ New Listing"** | Opens multi-step create product modal | ✅ |
| **"Refine List"** | Placeholder filter button | ❌ Not wired |

### 4.2 Create Product Modal (6 Sections)

The create product form is a **comprehensive** multi-section modal:

#### Section 1: Basic Info
| Field | Type | Required | Backend Column |
|-------|------|----------|---------------|
| Product Name | Text | ✅ | `products.name` |
| Category | Dropdown (from Supabase `categories`) | ✅ | `products.category` |
| Sub-Category | Text | ❌ | `products.sub_category` |
| Brand Name | Text | ❌ | `products.brand` |
| Model Number | Text | ❌ | `products.model_number` |
| Short Description | Textarea | ❌ | `products.short_description` |
| Stock Quantity | Number | ✅ | `products.stock` |
| Size Variants | Dynamic list (size, qty, stock, price) | ❌ | `product_variants` table |
| Color Variants | Dynamic list (color, SKU, price, stock) | ❌ | `product_variants` table |

#### Section 2: Media
| Field | Type | Required | Backend |
|-------|------|----------|---------|
| Images | File upload (5-10 images) | ✅ Min 5 | Uploaded to `product-images` Supabase storage bucket → URLs stored in `products.images` array |
| Videos | File upload (0-2 videos) | ❌ | Uploaded to `product-images` bucket → URLs stored in `products.videos` array |

#### Section 3: Details
| Field | Type | Required | Backend |
|-------|------|----------|---------|
| Highlights | Dynamic text list | ❌ | `products.highlights` array |
| Full Description | Textarea | ❌ | `products.description` |
| Technical Specifications | Dynamic key-value pairs | ✅ At least 1 | `products.specifications` JSONB |

#### Section 4: Pricing
| Field | Type | Required | Backend Column |
|-------|------|----------|---------------|
| Currency | Dropdown (default INR) | ✅ | `products.currency` |
| MRP | Number | ✅ | `products.mrp` |
| Selling Price | Number (must ≤ MRP) | ✅ | `products.price` |
| GST Rate | Number (default 18) | ✅ | `products.gst_rate` |
| Platform Fee | Number (default 10%) | Display only | `products.platform_fee` |
| Commission | Number (default 10%) | Display only | `products.commission` |
| Delivery Countries | Dynamic list (country, charge, min qty) | ❌ | `delivery_countries` table |

#### Section 5: Shipping
| Field | Type | Required | Backend Column |
|-------|------|----------|---------------|
| Package Weight | Number (kg) | ✅ | `products.package_weight` |
| Package Length | Number (cm) | ✅ | `products.package_length` |
| Package Width | Number (cm) | ✅ | `products.package_width` |
| Package Height | Number (cm) | ✅ | `products.package_height` |
| Shipping Type | Radio: Self / Platform | ✅ | `products.shipping_type` |
| Manufacturer | Text | ❌ | `products.manufacturer_name` |
| Return Policy | Number (days, default 7) | ✅ | `products.return_policy_days` |
| Cancellation Policy | Number (days, default 7) | ✅ | `products.cancellation_policy_days` |

#### Section 6: Offers
| Field | Type | Backend |
|-------|------|---------|
| Offer Type | Dropdown: Buy X Get Y, Special Day, Hourly, Bundle | `offer_rules.offer_type` |
| Buy/Get Quantities | Numbers | `offer_rules.buy_quantity`, `get_quantity` |
| Special Day | Dropdown: Diwali, Christmas, Black Friday, etc. | `offer_rules.special_day_name` |
| Discount % | Number | `offer_rules.discount_percent` |
| Start/End Time | Datetime | `offer_rules.start_time`, `end_time` |
| Bundle Min Qty | Number | `offer_rules.bundle_min_qty` |

#### Available Offer Types
- **Buy X Get Y** — e.g., Buy 2 Get 1
- **Special Day** — New Year, Valentine's Day, Holi, Diwali, Christmas, Black Friday, Cyber Monday, Flash Sale
- **Hourly** — Time-limited discounts
- **Bundle** — Bulk purchase discounts

### 4.3 Create Product Backend Flow

```
1. Validate: name, category, MRP, price, stock, specs (≥1), package dims, images (≥5)
2. Upload images → supabase.storage('product-images').upload('{sellerId}/{uuid}.ext')
3. Upload videos → supabase.storage('product-images').upload('{sellerId}/videos/{uuid}.ext')
4. INSERT into products (approval_status='pending', is_active=false)
5. INSERT size variants into product_variants (variant_type='size')
6. INSERT color variants into product_variants (variant_type='color')
7. INSERT delivery countries into delivery_countries
8. INSERT offer rules into offer_rules
9. Return success → "Product created! Will be visible after admin approval."
```

**Important:** Products are created with `approval_status = 'pending'` and `is_active = false`. They become visible to buyers ONLY when admin sets `approval_status = 'approved'` AND `is_active = true`.

---

## 5. Order Management

### 5.1 Overview

**Route:** `/seller/orders`  
**Component:** `SellerOrderManagement.tsx` (565 lines)

### 5.2 Order Status Tabs

| Tab | Status | Color | Count Badge |
|-----|--------|-------|-------------|
| **New Orders** | `new` | Blue | ✅ |
| **Processing** | `processing` | Yellow | ✅ |
| **Shipped** | `shipped` | Purple | ✅ |
| **Delivered** | `delivered` | Green | ✅ |
| **Cancelled** | `cancelled` + `returned` | Red | ✅ |

### 5.3 Order Card Information

Each order card displays:
- **Order ID** (order_number)
- **Date** (created_at)
- **Status badge** (color-coded)
- **Payment status badge** (Paid/Pending/Failed/Refunded)
- **First product** image, name, quantity
- **"+N more items"** if multiple items
- **Buyer info**: Name, city, phone (from shipping_address)
- **Order Amount** (total_amount formatted with currency)
- **Tracking ID** (if shipped — shown in blue banner)

### 5.4 Order Action Buttons

| Order Status | Available Actions | Backend Call |
|-------------|-------------------|-------------|
| `new` | **Accept Order** ✅, **Reject Order** ❌ | `updateOrderStatus(id, { status: 'processing' })` / `updateOrderStatus(id, { status: 'cancelled' })` |
| `processing` | **Mark as Shipped** 📦 | `updateOrderStatus(id, { status: 'shipped', tracking_number })` |
| `shipped` | **Mark as Delivered** ✔️ | `updateOrderStatus(id, { status: 'delivered', completed_at })` |
| `delivered` | — (no actions) | — |
| `cancelled` | — (no actions) | — |
| All | **View Details** 👁️ | — (no detail modal implemented yet) |

### 5.5 Action Modals

| Action | Modal Content | Required Input |
|--------|--------------|----------------|
| Accept | Confirmation dialog with order ID | None |
| Reject | Rejection reason textarea | **Rejection reason** (required) |
| Ship | Tracking ID input | **Tracking number** (required) |
| Deliver | Confirmation dialog | None |

### 5.6 Other Buttons

| Button | Action | Backend |
|--------|--------|---------|
| **Export** | Download button | ❌ Not implemented (placeholder) |
| **Filter** | Filter button | ❌ Not implemented (placeholder) |
| **Search** | Search by order ID or product name | ✅ Client-side filter |

### 5.7 Order Lifecycle

```
new → processing (seller accepts)
  → shipped (seller adds tracking ID)
    → delivered (seller confirms delivery)
      → payout released (wallet balance calculates from delivered orders)

new → cancelled (seller rejects with reason)
```

---

## 6. Wallet & Payout System

### 6.1 Overview

**Route:** `/seller/wallet`  
**Component:** `SellerWallet.tsx` (660 lines)

### 6.2 Balance Cards

| Card | Calculation | Backend |
|------|-------------|---------|
| **Available Balance** | Sum of `(total_amount - 10% fee)` for `delivered` orders | ✅ Calculated from orders |
| **Pending Balance** | Sum of `(total_amount - 10% fee)` for `processing` + `shipped` orders | ✅ Calculated from orders |
| **Total Withdrawn** | Currently always `₹0.00` | ❌ Not calculated from `withdrawals` table |
| **Total Earnings** | Sum of `total_amount` for all non-cancelled/returned orders | ✅ Calculated from orders |

**Platform Fee:** 10% deducted from every order (`PLATFORM_FEE = 0.10`)

### 6.3 Transaction History

Transactions are **generated programmatically** from orders — NOT stored in a separate table:

| Transaction Type | Source | Amount |
|-----------------|--------|--------|
| `credit` | Order payment received | `order.total_amount - (10% fee)` → status: `completed` (delivered) or `pending` (processing/shipped) |
| `commission` | Platform fee deduction | `-order.total_amount × 10%` → status: `completed` |
| `refund` | Cancelled/returned order | `-(order.total_amount - 10% fee)` → status: `completed` |
| `withdrawal` | — | Not yet generated from actual `withdrawals` data |
| `debit` | — | Not yet generated |

### 6.4 Filter Options

| Filter | Values |
|--------|--------|
| All | All transaction types |
| Credits | Credit transactions only |
| Debits | Debits, commissions, withdrawals, refunds |
| Pending | Transactions with `status = 'pending'` |
| Search | By order ID or description |

### 6.5 Withdrawal System

**"Withdraw" button** on Available Balance card → opens Withdrawal Modal:

| Modal Element | Details |
|---------------|---------|
| Available Balance display | Shows current available amount |
| Withdrawal Amount input | Number field |
| Quick amount buttons | 25%, 50%, 75%, Max |
| Bank Account selection | Radio: "Primary Account ••••4589" (hardcoded display) |
| Processing info | "Withdrawals processed daily at 6:00 PM, 1-2 business days" |
| Confirm button | Calls `createWithdrawal()` |

#### Withdrawal Backend (`orderService.ts → createWithdrawal`)

```typescript
await supabase.from('withdrawals').insert({
  seller_id: sellerId,
  amount: amount,
  currency: 'INR',
  bank_details: null,  // NOTE: bank details are NOT passed from KYC data
});
```

**Issues:**
- Bank details from KYC are not linked to withdrawal — `bank_details` is always `null`
- The "Primary Account ••••4589" in the modal is hardcoded, not from actual bank data
- No actual money transfer happens — just creates a `withdrawals` record with `status='pending'`
- Total Withdrawn card doesn't read from `withdrawals` table — always shows ₹0

### 6.6 Payout Logic Summary

```
Customer pays → Order created (payment_status: 'pending'/'completed')
  → Seller accepts (status: 'processing')
    → Net amount = total_amount × 0.90 enters PENDING balance
  → Seller ships → PENDING balance continues
  → Seller marks delivered → amount moves from PENDING to AVAILABLE balance
  → Seller clicks Withdraw → creates withdrawals row (status: 'pending')
  → Admin manually processes withdrawal (no automation exists)
```

**There is NO automated payout system.** The entire balance is calculated client-side from order data. The `seller_payouts` table exists in the DB but is never written to by the seller dashboard.

### 6.7 Other Buttons

| Button | Action | Backend |
|--------|--------|---------|
| **Download Statement** | Header button | ❌ Not implemented |
| **Load More Transactions** | Pagination button | ❌ Not implemented (all loaded at once) |

---

## 7. Analytics Dashboard

### 7.1 Overview

**Route:** `/seller/analytics`  
**Component:** `AnalyticsDashboard.tsx` (326 lines)

### 7.2 Data Source

All analytics are calculated from `fetchOrdersBySeller()` (up to 100 orders). **No separate analytics tables or aggregated data.**

### 7.3 Metrics Cards

| Metric | Calculation |
|--------|-------------|
| Total Sales | Sum of `total_amount` for delivered + processing + shipped + new orders |
| Orders | Total order count |
| Avg Order Value | `totalSales ÷ totalOrderCount` |
| Conversion Rate | `(delivered ÷ total) × 100` |

**Note:** Trend percentages (+12.5%, +8.2%, etc.) are **hardcoded**, not real.

### 7.4 Charts & Tables

| Widget | Data | Backend |
|--------|------|---------|
| **Date Range Filter** | Dropdown: This Week, Month, Quarter, Year | ❌ Filter changes state but doesn't re-query — ALL data is always loaded |
| **Top Products** | Table: Product Name, Sales count, Revenue — derived from `order_items` | ✅ Real data |
| **Sales by Category** | Progress bars: Category name, amount, percentage | ✅ Real data |
| **Recent Deliveries** | List: Order number, items count, date, amount, status | ✅ Real data |

---

## 8. Seller Profile

### 8.1 Overview

**Route:** `/seller/profile`  
**Component:** `SellerProfile.tsx` (399 lines)

### 8.2 Features

| Feature | Backend |
|---------|---------|
| View profile: business name, email, phone, website, address | ✅ `fetchSellerProfile()` reads from `profiles` table |
| Edit profile: toggle edit mode | ✅ |
| Save profile: business name, email, phone | ✅ `updateSellerProfile()` updates `profiles` table |
| Shop logo upload | ❌ Preview only — not uploaded to Supabase storage |
| Website, address, bank details fields | ❌ Displayed in form but NOT saved (only `full_name`, `email`, `phone` are saved) |

---

## 9. Product Image Management

### 9.1 Overview

**Route:** `/seller/product-images`  
**Component:** `SellerProductImageManagement.tsx` (277 lines)

### 9.2 Features

| Feature | Backend |
|---------|---------|
| Select product (dropdown of seller's products) | ✅ `supabase.from('products').select('id, name').eq('seller_id', sellerId)` |
| Upload images (multi-file, max 10MB, JPEG/PNG/WebP) | ✅ Uses `adminService.uploadProductImageFile()` → Supabase storage |
| Delete images | ✅ Updates `products.images` array |
| Set main image | ✅ Updates `products.image_url` |
| Drag & drop reorder | ✅ Updates image order in products JSONB |
| Preview images | ✅ Full-size view button |

---

## 10. Backend Database Tables

### 10.1 Seller KYC Table (`seller_kyc`)

```sql
seller_kyc:
  id                    uuid (PK)
  seller_id             uuid (FK → auth.users, UNIQUE)
  email, phone, full_name, country   text
  pan, gstin            text
  id_type               'aadhar' | 'passport' | 'voter' | 'driver_license'
  id_number             text
  id_document_url       text (storage path)
  business_address      jsonb
  address_proof_url     text (storage path)
  bank_holder_name, account_number, ifsc_code  text
  account_type          'checking' | 'savings' | 'current'
  bank_statement_url    text (storage path)
  pep_declaration, sanctions_check, aml_compliance, tax_compliance, terms_accepted  boolean
  kyc_status            'draft' | 'pending' | 'approved' | 'rejected'
  kyc_tier              integer (default 2)
  rejection_reason      text
  verified_by_admin     uuid (FK → auth.users)
  verified_at           timestamptz
  submitted_at          timestamptz
```

### 10.2 Products Table (`products`)

```sql
products:
  id, seller_id (FK → profiles)
  name, slug (UNIQUE), description, short_description
  category, sub_category, brand, model_number, sku
  price, mrp, discount_price, currency, stock
  image_url, images[], videos[], highlights[]
  specifications (jsonb), seller_notes[]
  gst_rate, platform_fee (default 7.5), commission (default 0.5)
  package_weight/length/width/height, shipping_type
  manufacturer_name, cancellation_policy_days, return_policy_days
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected'
  is_active (default false), is_featured, tags[]
  rating, review_count
```

### 10.3 Related Tables

| Table | Purpose | FK |
|-------|---------|-----|
| `product_variants` | Size/color variants | `product_id → products` |
| `delivery_countries` | Per-product shipping countries | `product_id → products` |
| `offer_rules` | Offer types (buy X get Y, special day, hourly, bundle) | `product_id → products` |
| `reviews` | Customer reviews (1-5 stars, heading, comment, images) | `product_id → products`, `user_id → profiles` |
| `orders` | Customer orders | `user_id → profiles`, `seller_id → profiles` |
| `order_items` | Line items per order | `order_id → orders`, `product_id → products` |
| `seller_payouts` | Payout records (per order) | `seller_id → profiles`, `order_id → orders` |
| `withdrawals` | Seller withdrawal requests | `seller_id → profiles` |

### 10.4 Orders Table (`orders`)

```sql
orders:
  id, order_number (UNIQUE, auto-generated 'ORD-XXXXXXXX')
  user_id (FK), seller_id (FK)
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'returned'
  total_amount, currency
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_intent_id, tracking_number
  shipping_address (jsonb), billing_address (jsonb)
  phone, notes
  completed_at
```

### 10.5 Withdrawals Table (`withdrawals`)

```sql
withdrawals:
  id, seller_id (FK)
  amount (CHECK > 0), currency
  status: 'pending' | 'approved' | 'completed' | 'failed' | 'cancelled'
  bank_details (jsonb), admin_notes
  requested_at, processed_at
```

### 10.6 Seller Payouts Table (`seller_payouts`)

```sql
seller_payouts:
  id, seller_id (FK), order_id (FK)
  amount, platform_fee, net_amount, currency
  status: 'pending' | 'approved' | 'completed' | 'failed'
  payout_method (default 'bank_transfer')
  bank_reference, scheduled_at, processed_at
```

---

## 11. Backend Services (Supabase)

### 11.1 kycService.ts — Functions

| Function | Connected | Description |
|----------|-----------|-------------|
| `uploadKYCDocument()` | ✅ | Upload to `kyc-documents` bucket via direct fetch with retry |
| `submitCompleteKYC()` | ✅ | Upload docs + upsert `seller_kyc` row |
| `getSellerKYCStatus()` | ✅ | `SELECT * FROM seller_kyc WHERE seller_id = ?` |
| `uploadVerificationDocument()` | ✅ | Upload via SDK (used by SellerVerifyUploads) |
| `finalizeVerificationSubmission()` | ✅ | Update KYC record with doc URLs, set `kyc_status='pending'` |
| `getKYCRequirementsByCountry()` | ✅ | Returns standard document requirements (7 items) |
| `fetchAllKYCSubmissions()` | ✅ | Admin: list all KYC submissions |
| `approveKYC()` | ✅ | Admin: approve + update `profiles.is_verified` |
| `rejectKYC()` | ✅ | Admin: reject with reason |
| `deleteKYC()` | ✅ | Admin: remove KYC record |
| `updateKYC()` | ✅ | Admin: update any KYC field |

### 11.2 orderService.ts — Functions

| Function | Connected | Description |
|----------|-----------|-------------|
| `fetchOrdersBySeller()` | ✅ | `SELECT *, order_items(*) FROM orders WHERE seller_id = ? ORDER BY created_at DESC` |
| `fetchOrdersByUser()` | ✅ | Same but for user_id |
| `fetchOrderById()` | ✅ | Single order with items |
| `createOrder()` | ✅ | INSERT order + order_items |
| `updateOrderStatus()` | ✅ | UPDATE status, tracking_number, payment_status, completed_at |
| `fetchSellerProfile()` | ✅ | `SELECT * FROM profiles WHERE id = ?` |
| `updateSellerProfile()` | ✅ | `UPDATE profiles SET ... WHERE id = ?` |
| `createWithdrawal()` | ✅ | INSERT into `withdrawals` |
| `fetchWithdrawals()` | ✅ | `SELECT * FROM withdrawals WHERE seller_id = ?` |
| `fetchSellerPayouts()` | ✅ | `SELECT * FROM seller_payouts WHERE seller_id = ?` |

### 11.3 productService.ts — Functions

| Function | Connected | Description |
|----------|-----------|-------------|
| `fetchProducts()` | ✅ | With filters (sellerId, category, approvalStatus, search, pagination) |
| `fetchProductById()` | ✅ | With joins: product_variants, delivery_countries, offer_rules |
| `fetchProductReviews()` | ✅ | Reviews with user profile info |
| `fetchSimilarProducts()` | ✅ | Same category, approved+active, limit 8 |
| `fetchCategories()` | ✅ | With sub_categories join |
| `createProduct()` | ✅ | Full product + variants + delivery + offers |
| `approveProduct()` | ✅ | Admin: set `approved` + `is_active=true` |
| `rejectProduct()` | ✅ | Admin: set `rejected` + `is_active=false` |
| `toggleProductStatus()` | ✅ | Toggle `is_active` |
| `deleteProduct()` | ✅ | DELETE from products (cascades) |
| `uploadProductImage()` | ✅ | Upload to `product-images` bucket |
| `uploadProductVideo()` | ✅ | Upload to `product-images` bucket |
| `submitReview()` | ✅ | Insert review + recalculate product rating |

---

## 12. Stripe Payment Integration

### 12.1 Architecture

```
Customer → Checkout → createPaymentIntent() → Stripe PaymentIntent
  → Dev: Vite middleware (/api/create-payment-intent)
  → Prod: Supabase Edge Function (create-payment-intent)
    → Uses Stripe secret key server-side
    → Returns clientSecret + paymentIntentId
  → Frontend: @stripe/react-stripe-js Elements renders card form
  → On success: createOrder() saves order to Supabase
```

### 12.2 Helper Functions

| Function | Purpose |
|----------|---------|
| `getStripe()` | Singleton Stripe.js loader using `VITE_STRIPE_PUBLISHABLE_KEY` |
| `createPaymentIntent()` | Creates PaymentIntent (dev middleware or Supabase edge function) |
| `toStripeAmount()` | Convert display amount to smallest unit (e.g., ₹100 → 10000 paise) |
| `fromStripeAmount()` | Reverse conversion |

### 12.3 Integration Status

| Piece | Status |
|-------|--------|
| Stripe.js loading | ✅ Implemented |
| Payment Intent creation (dev) | ✅ Via Vite middleware |
| Payment Intent creation (prod) | ✅ Via Supabase Edge Function |
| Card element UI | ✅ `@stripe/react-stripe-js` |
| Zero-decimal currency handling | ✅ 16 currencies supported |
| Payment → Order creation | ✅ `createOrder()` with `payment_intent_id` |
| Webhook for payment confirmation | ❌ **NOT implemented** |
| Stripe Connect for seller payouts | ❌ **NOT implemented** (example hook exists but unused) |
| Refund processing via Stripe | ❌ **NOT implemented** (DB table exists, no Stripe API calls) |

---

## 13. RLS (Row Level Security) Rules

### 13.1 seller_kyc

| Policy | Role | Action |
|--------|------|--------|
| Sellers can read own KYC | Seller | SELECT where `seller_id = auth.uid()` |
| Sellers can insert own KYC | Seller | INSERT where `seller_id = auth.uid()` |
| Sellers can update own KYC | Seller | UPDATE where `seller_id = auth.uid()` AND `kyc_status IN ('draft', 'rejected')` |
| Admins can read all KYC | Admin | SELECT all |
| Admins can update all KYC | Admin | UPDATE all |

**Key rule:** Sellers can only update their KYC when status is `draft` or `rejected` (not when `pending` or `approved`).

### 13.2 products

| Policy | Who | What |
|--------|-----|------|
| Public read | Anyone | SELECT where `approved` AND `is_active` |
| Seller read own | Seller | SELECT where `seller_id = auth.uid()` |
| Seller insert | Seller | INSERT where `seller_id = auth.uid()` |
| Seller update | Seller | UPDATE where `seller_id = auth.uid()` |
| Admin all | Admin | Full CRUD |

### 13.3 orders

| Policy | Who | What |
|--------|-----|------|
| Users view own | Buyer | SELECT where `user_id = auth.uid()` |
| Sellers view their orders | Seller | SELECT where `seller_id = auth.uid()` |
| Sellers update their orders | Seller | UPDATE where `seller_id = auth.uid()` |
| Users create | Buyer | INSERT where `user_id = auth.uid()` |
| Admin all | Admin | Full CRUD |

### 13.4 withdrawals

| Policy | Who | What |
|--------|-----|------|
| Sellers manage own | Seller | ALL where `seller_id = auth.uid()` |
| Admin all | Admin | Full CRUD |

---

## 14. Integration Status — Completed vs Pending

### 14.1 ✅ COMPLETED Integrations

| Feature | Service | Status |
|---------|---------|--------|
| KYC form submission (5 steps) | `kycService.submitCompleteKYC()` | ✅ Full flow |
| KYC document upload (3 docs) | `kycService.uploadKYCDocument()` | ✅ With retry |
| KYC status fetching | `kycService.getSellerKYCStatus()` | ✅ |
| Admin KYC approve/reject/delete | `kycService.approveKYC/rejectKYC/deleteKYC` | ✅ |
| Product creation (full form) | `productService.createProduct()` | ✅ With variants, delivery, offers |
| Product image/video upload | `productService.uploadProductImage/Video()` | ✅ Supabase storage |
| Product listing fetch (seller's products) | `productService.fetchProducts({sellerId})` | ✅ |
| Category loading | `productService.fetchCategories()` | ✅ From Supabase |
| Order fetching (seller's orders) | `orderService.fetchOrdersBySeller()` | ✅ With order_items join |
| Order status updates | `orderService.updateOrderStatus()` | ✅ |
| Withdrawal request creation | `orderService.createWithdrawal()` | ✅ Inserts to DB |
| Seller profile read/update | `orderService.fetchSellerProfile/updateSellerProfile` | ✅ |
| Product image management (upload/delete/reorder) | `adminService` + direct Supabase | ✅ |
| Stripe PaymentIntent creation | `stripeService.createPaymentIntent()` | ✅ |
| Auth session management | `AuthContext` | ✅ |
| Route guards for seller role | `App.tsx RouteGuard` | ✅ |

### 14.2 ❌ PENDING / NOT IMPLEMENTED

| # | Feature | Priority | Details |
|---|---------|----------|---------|
| 1 | **Automated payout system** | 🔴 HIGH | No auto-payout after delivery. Wallet balance is calculated client-side from orders. `seller_payouts` table is never written to. No Stripe Connect integration. |
| 2 | **Stripe Connect for seller payouts** | 🔴 HIGH | An example hook exists (`useStripeConnectExample.tsx.example`) but is NOT used. Sellers don't have Stripe accounts linked. |
| 3 | **Stripe webhook for payment confirmation** | 🔴 HIGH | No webhook endpoint. Payment status is set manually. Orders could be marked as paid without actual payment. |
| 4 | **Withdrawal processing** | 🔴 HIGH | `createWithdrawal()` creates a DB row but no money is actually transferred. No admin UI to process withdrawals. Bank details from KYC not linked. |
| 5 | **Product edit/update** | 🟡 MEDIUM | Sellers can create products but cannot edit existing ones from the dashboard. No edit button/modal. |
| 6 | **Product delete by seller** | 🟡 MEDIUM | No delete button on seller product cards. `deleteProduct()` exists in service but isn't wired to seller UI. |
| 7 | **Revenue/orders/views per product** | 🟡 MEDIUM | Product cards show 0 for revenue, orders, views — need to aggregate from `order_items` table. |
| 8 | **Export orders/transactions** | 🟡 MEDIUM | Export/Download buttons exist but are placeholders — no CSV/PDF generation. |
| 9 | **Notifications system** | 🟡 MEDIUM | Bell icon in header but no notification fetch/display. `notifications` table exists in DB but unused. |
| 10 | **Store Settings page** | 🟡 MEDIUM | Placeholder with "being updated for production" message. No store name, policies, logo configuration. |
| 11 | **Shop logo upload to Supabase** | 🟡 MEDIUM | File picker works but only shows preview — never uploads to storage. |
| 12 | **Date range filtering in Analytics** | 🟢 LOW | Dropdown exists but changing it doesn't filter data — all orders always displayed. |
| 13 | **Trend percentages from real data** | 🟢 LOW | All +X% values on stat cards are hardcoded. |
| 14 | **Seller profile: website, address, bank_details** | 🟢 LOW | Fields exist in form but only `full_name`, `email`, `phone` are saved. |
| 15 | **View Order Details modal** | 🟢 LOW | "View Details" button exists on every order card but opens nothing. |
| 16 | **Order search server-side** | 🟢 LOW | Currently client-side filter. All 100 orders loaded at once. |
| 17 | **Total Withdrawn display** | 🟢 LOW | Should fetch from `withdrawals` table but always shows ₹0. |
| 18 | **Transaction pagination** | 🟢 LOW | "Load More" button exists but isn't wired. |

---

## 15. File Map

```
src/
├── pages/seller/
│   ├── SellerDashboard.tsx              ← Main dashboard (sidebar + overview + sections)
│   ├── SellerDashboardWrapper.tsx        ← Wrapper: auth + KYC status fetch
│   ├── SellerVerificationPage.tsx        ← KYC status card + form launcher
│   ├── SellerVerificationWrapper.tsx     ← Wrapper for /seller/verify route
│   ├── SellerKYCVerification.tsx         ← 5-step KYC form (1184 lines)
│   ├── SellerVerifyUploads.tsx           ← Alternative verify-by-upload flow
│   ├── SellersVerifications.tsx          ← Additional verification component
│   ├── SellerProductListing.tsx          ← Product list + create modal (1945 lines)
│   ├── SellerProductListingWrapper.tsx   ← Wrapper for products page
│   ├── SellerProductImageManagement.tsx  ← Image upload/reorder/delete
│   ├── SellerOrderManagement.tsx         ← Order tabs + actions (565 lines)
│   ├── SellerOrderManagementWrapper.tsx  ← Wrapper for orders page
│   ├── SellerWallet.tsx                  ← Wallet balance + transactions (660 lines)
│   ├── SellerWalletWrapper.tsx           ← Wrapper for wallet page
│   ├── AnalyticsDashboard.tsx            ← Sales analytics (326 lines)
│   ├── SellerProfile.tsx                 ← Seller profile edit (399 lines)
│   ├── SellerLanding.tsx                 ← Public landing page (/seller)
│   ├── SellerLogin.tsx                   ← Login page
│   ├── SellerSignup.tsx                  ← Signup page
│   └── SellerForgotPassword.tsx          ← Password reset
├── lib/
│   ├── kycService.ts                     ← KYC CRUD + document uploads (550 lines)
│   ├── orderService.ts                   ← Orders + withdrawals + seller profile
│   ├── productService.ts                 ← Products + categories + reviews (373 lines)
│   ├── stripeService.ts                  ← Stripe PaymentIntent + helpers
│   └── supabase.ts                       ← Supabase client
supabase/
├── 05_seller_kyc.sql                     ← seller_kyc table + RLS
├── 09_products.sql                       ← products + variants + offers + reviews tables + RLS
└── 10_remaining_tables.sql               ← orders + withdrawals + payouts + all other tables
```
