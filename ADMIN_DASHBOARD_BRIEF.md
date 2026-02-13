# ADMIN DASHBOARD SYSTEM BRIEF

> **Generated:** Comprehensive audit of the Bzeadstore Admin Dashboard  
> **Stack:** React 19.2 + TypeScript 5.9 + Vite 7.2 + Supabase + Tailwind CSS  
> **Entry Point:** `/admin` route (protected by role guard)

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Route Map](#2-route-map)
3. [Layout System](#3-layout-system)
4. [Sidebar Navigation](#4-sidebar-navigation)
5. [Dashboard Overview / Home](#5-dashboard-overview--home)
6. [User Management](#6-user-management)
7. [Seller Management](#7-seller-management)
8. [Seller KYC Submission Management](#8-seller-kyc-submission-management)
9. [Product Management](#9-product-management)
10. [Product Creation Wizard (6-Step)](#10-product-creation-wizard-6-step)
11. [Product Variant Management](#11-product-variant-management)
12. [Product Image Management](#12-product-image-management)
13. [Order Management](#13-order-management)
14. [Category Management](#14-category-management)
15. [Sub-Category Management](#15-sub-category-management)
16. [Banner Management](#16-banner-management)
17. [Promotion Management](#17-promotion-management)
18. [Review Management](#18-review-management)
19. [Complaint Management](#19-complaint-management)
20. [Accounts Management](#20-accounts-management)
21. [Reports Management](#21-reports-management)
22. [Admin Management](#22-admin-management)
23. [Profile Page](#23-profile-page)
24. [Settings Page](#24-settings-page)
25. [Search Management](#25-search-management)
26. [Audit Logs](#26-audit-logs)
27. [System Health](#27-system-health)
28. [Admin Address Management](#28-admin-address-management)
29. [KYC Requirement Management](#29-kyc-requirement-management)
30. [Business Type Management](#30-business-type-management)
31. [Dashboard Metrics & Country List](#31-dashboard-metrics--country-list)
32. [Shared Components](#32-shared-components)
33. [Admin Service Layer (adminService.ts)](#33-admin-service-layer-adminservicets)
34. [Known Bugs & Issues](#34-known-bugs--issues)
35. [Integration Status Matrix](#35-integration-status-matrix)
36. [File Map](#36-file-map)

---

## 1. ARCHITECTURE OVERVIEW

### Access Control
- Admin routes wrapped by `<AdminLayout />` which checks `effectiveRole !== 'admin'` → redirects to `/`
- `effectiveRole` = `user?.role || authRole` from `useAuth()` context
- All admin route components are lazy-loaded via `React.lazy()` in App.tsx
- Separate `RouteGuard` in App.tsx also gates `/admin` paths: requires `effectiveRole === 'admin'`

### Layout Pattern
```
AdminLayout (role guard)
├── AdminSidebar (left nav, 19 items)
├── AdminHeader (top bar with brand + logout)
└── <Outlet /> (child route content)
```

### Service Layer
- **Primary:** `src/lib/adminService.ts` (935 lines) — all Supabase CRUD for admin operations
- **Shared:** `src/lib/productService.ts` — product/category CRUD shared with seller dashboard
- **Shared:** `src/lib/kycService.ts` — KYC operations shared with seller dashboard
- **Context:** `src/contexts/ProductListingContext.tsx` — 6-step product creation state management

### Data Flow
```
Admin UI Component → adminService / productService / kycService → Supabase Client → PostgreSQL
```

---

## 2. ROUTE MAP

All routes nested under `<AdminLayout />` in `src/App.tsx`:

| Route | Component | Status |
|-------|-----------|--------|
| `/admin` | `AdminOverview` | ⚠️ Partial (metrics hardcoded) |
| `/admin/users` | `UserManagement` | ✅ Connected |
| `/admin/sellers` | `SellerManagement` | ⚠️ Badge bug |
| `/admin/products` | `ProductManagement` | ✅ Connected |
| `/admin/variants` | `ProductVariantManagement` | ❌ Local state only |
| `/admin/orders` | `OrderManagement` | ✅ Connected |
| `/admin/categories` | `CategoryManagement` | ✅ Connected |
| `/admin/banners` | `BannerManagement` | ✅ Connected |
| `/admin/promotions` | `PromotionManagement` | ⚠️ Read-only |
| `/admin/reviews` | `ReviewManagement` | ✅ Connected |
| `/admin/complaints` | `ComplaintManagement` | ✅ Connected |
| `/admin/accounts` | `AccountsManagement` | ⚠️ Partial |
| `/admin/reports` | `ReportsManagement` | ⚠️ CSV only |
| `/admin/admins` | `AdminManagement` | ❌ Placeholder |
| `/admin/profile` | `ProfilePage` | ✅ Connected (read-only) |
| `/admin/settings` | `SettingsPage` | ❌ Placeholder |
| `/admin/search` | `SearchManagement` | ✅ Connected |
| `/admin/audit-logs` | `AuditLogs` | ⚠️ Filters not wired |
| `/admin/health` | `SystemHealth` | ⚠️ Metrics hardcoded |
| `/admin/addresses` | `AdminAddressManagement` | ❌ Mock data only |
| `/admin/seller-kyc` | `SellerKYCSubmissionManagement` | ✅ Connected |
| `/admin/products/new` | `ProductListingLayout` | ✅ Connected |
| `/admin/products/new/step1-6` | `AdminListings1-6` | ✅ Connected |

**Redirect Routes:**
- `/admin/login` → `/login`
- `/admin/signup` → `/login`
- `/admin/dashboard` → `/admin`

**Routes in Sidebar but NOT registered in App.tsx:**
- Sub-Categories (no route registered — accessible only from Category Management page)
- KYC Requirements (no route registered — accessible through sidebar link may fail)
- Dashboard Metrics, Country List, Business Types (no routes — only accessible if linked internally)

---

## 3. LAYOUT SYSTEM

### AdminLayout.tsx (60 lines)
**File:** `src/pages/admin/AdminLayout.tsx`

**Responsibilities:**
- Role validation: `effectiveRole !== 'admin'` → `navigate('/')`
- Mobile detection: breakpoint at 1024px, sidebar toggle
- Renders `AdminSidebar` (left) + `AdminHeader` (top) + `<Outlet />` (content)

**Props passed:**
- `AdminSidebar`: `isOpen`, `onClose`, `isMobile`
- `AdminHeader`: `adminName` (user.full_name || email), `adminId` (user.id substring 0-8), `onMenuToggle`

**Mobile behavior:** Sidebar overlays content, toggled by hamburger icon in header

---

## 4. SIDEBAR NAVIGATION

### AdminSidebar.tsx (227 lines)
**File:** `src/pages/admin/components/AdminSidebar.tsx`

**19 Menu Items (in order):**

| # | Label | Route | Icon |
|---|-------|-------|------|
| 1 | Dashboard | `/admin` | LayoutDashboard |
| 2 | Users | `/admin/users` | Users |
| 3 | Sellers | `/admin/sellers` | Store |
| 4 | Seller KYC | `/admin/seller-kyc` | ShieldCheck |
| 5 | Products | `/admin/products` | Package |
| 6 | Add New Product | `/admin/products/new` | PlusCircle |
| 7 | Product Variants | `/admin/variants` | Layers |
| 8 | Orders | `/admin/orders` | ShoppingCart |
| 9 | Categories | `/admin/categories` | Grid |
| 10 | Banners | `/admin/banners` | Image |
| 11 | Promotions | `/admin/promotions` | Percent |
| 12 | Reviews | `/admin/reviews` | Star |
| 13 | Complaints | `/admin/complaints` | AlertCircle |
| 14 | Accounts | `/admin/accounts` | Calculator |
| 15 | Reports | `/admin/reports` | FileText |
| 16 | Admin Management | `/admin/admins` | UserCog |
| 17 | Profile | `/admin/profile` | UserCircle |
| 18 | Settings | `/admin/settings` | Settings |
| 19 | Search (in header) | `/admin/search` | Search |

**Active state:** Amber/yellow background highlight on current route  
**Mobile:** Overlay panel with close button, slides from left  
**Submenu support:** `ChevronDown` icon for expandable items (currently unused)

### AdminHeader.tsx (154 lines)
**File:** `src/pages/admin/components/AdminHeader.tsx`

**Elements:**
- Hamburger menu button (mobile only)
- Brand title: "BeauZead – Admin Panel"
- Admin name display + Admin ID badge
- Logout button with confirmation modal

**Logout flow:**
1. Click logout → confirmation modal appears
2. Confirm → `signOut()` from AuthContext → `navigate('/seller')`
3. **BUG:** Redirects to `/seller` instead of `/` or `/login`

---

## 5. DASHBOARD OVERVIEW / HOME

### AdminOverview.tsx (247 lines)
**File:** `src/pages/admin/modules/AdminOverview.tsx`  
**Route:** `/admin`

**Data Fetching:**
- `profiles` table: count users (role='user'), count sellers (role='seller')
- `fetchCategories()` from productService
- `fetchProducts({ limit: 1 })` for total product count

**8 Business Metric Cards:**

| Metric | Source | Status |
|--------|--------|--------|
| Total Sales | Hardcoded `$0` | ❌ Not calculated |
| Total Expenses | Hardcoded `$0` | ❌ Not calculated |
| Total Products | Real DB count | ✅ Working |
| Total Users | Real DB count | ✅ Working |
| Total Sellers | Real DB count | ✅ Working |
| Total Bookings | Hardcoded `0` | ❌ Not calculated |
| Ongoing Orders | Hardcoded `0` | ❌ Not calculated |
| Returns & Cancellations | Hardcoded `0` | ❌ Not calculated |

**3 Stat Cards:**
- User Registrations This Month → ✅ Real: filters by `created_at` this month
- Prime Members → ❌ Hardcoded `0`
- Seller Registrations This Month → ✅ Real: filters by `created_at` this month

**Top Movement Categories:** First 5 categories from DB, all show "Active" badge (no real activity data)

---

## 6. USER MANAGEMENT

### UserManagement.tsx (319 lines)
**File:** `src/pages/admin/modules/UserManagement.tsx`  
**Route:** `/admin/users`

**Table Columns:**
| Column | Source |
|--------|--------|
| Name | `full_name` |
| Email | `email` |
| Role | `role` |
| Purchases | Hardcoded `0` |
| Status | `is_banned` flag |
| Actions | Ban/Unban, Delete |

**Filters:**
- Search: by name or email (text input)
- Role: dropdown (All / user / seller / admin)

**Actions per row:**
- **Ban/Unban Toggle** → `adminService.banUser(id)` / `adminService.unbanUser(id)` — updates `profiles.is_banned`
- **Delete** → confirmation dialog → `adminService.deleteUser(id)` — deletes from `profiles` table

**Pagination:** Server-side, limit 20, offset-based

**Backend functions:**
- `getAllUsers(search, roleFilter, offset, limit)` → `profiles` WHERE role='user'
- `banUser(id)` → `profiles` SET is_banned=true
- `unbanUser(id)` → `profiles` SET is_banned=false
- `deleteUser(id)` → `profiles` DELETE

**Issues:**
- Purchase count always shows `0` — not calculated from `orders` table
- No confirmation for ban/unban actions

---

## 7. SELLER MANAGEMENT

### SellerManagement.tsx (359 lines)
**File:** `src/pages/admin/modules/SellerManagement.tsx`  
**Route:** `/admin/sellers`

**Table Columns:**
| Column | Source |
|--------|--------|
| Shop Name | `shop_name` or `full_name` |
| Email | `email` |
| KYC Status | From `seller_kyc` join |
| Badge | `role` field (misused) |
| Listings | Hardcoded `0` |
| Actions | View, Approve/Reject KYC, Badge update |

**Filters:**
- Search: by shop name or email
- KYC Status: All / pending / approved / rejected

**Actions:**
- **View Details:** Modal with full seller profile info
- **Approve KYC:** `adminService.updateSellerKYC(id, 'approved')` → updates `seller_kyc.status` + `profiles.is_verified`
- **Reject KYC:** `adminService.updateSellerKYC(id, 'rejected')` → updates `seller_kyc.status`
- **Update Badge:** Dropdown (silver / gold / platinum) → `adminService.updateSellerBadge(id, badge)`

**Backend functions:**
- `getAllSellers(search, kycFilter, offset, limit)` → `profiles` WHERE role='seller' with seller_kyc join
- `updateSellerKYC(id, status)` → updates `seller_kyc.status` + `profiles.is_verified` for 'approved'
- `updateSellerBadge(sellerId, badge)` → **BUG**: updates `profiles.role` to badge name

**CRITICAL BUG — updateSellerBadge:**
```typescript
// In adminService.ts:
const { error } = await supabase
  .from('profiles')
  .update({ role: badge })  // ← Overwrites 'seller' role with 'silver'/'gold'/'platinum'
  .eq('id', sellerId);
```
This breaks role-based access control. After badge update, the seller can no longer access `/seller` routes because their role is no longer 'seller'.

**Fix needed:** Use a separate `badge` or `seller_tier` column instead of `role`.

---

## 8. SELLER KYC SUBMISSION MANAGEMENT

### SellerKYCSubmissionManagement.tsx (293 lines)
**File:** `src/pages/admin/modules/SellerKYCSubmissionManagement.tsx`  
**Route:** `/admin/seller-kyc`

**Table Columns:**
| Column | Source |
|--------|--------|
| Seller | `full_name` + `email` |
| Country | `country` |
| PAN | `pan` |
| Status | `status` badge |
| Submitted | `submitted_at` |
| Actions | View, Edit, Approve, Reject, Delete |

**Filter Tabs:** All | Pending | Approved | Rejected (each with count badge)

**Search:** By name, email, or PAN

**Actions (per row):**

1. **View (Eye icon):** Modal displays:
   - Personal: full_name, email, phone, country
   - Tax: PAN, GSTIN
   - ID: id_type, id_number
   - Bank: bank_holder_name, account_number, account_type, ifsc_code
   - Compliance: pep_declaration, aml_agreement, compliance_declaration
   - Documents: id_document, address_proof, bank_statement (clickable links)
   - Status info: current status + rejection_reason if rejected

2. **Edit (Pencil icon):** Modal with editable fields:
   - pan, gstin, id_type, id_number
   - bank_holder_name, account_number, account_type, ifsc_code

3. **Approve (Green checkmark):** Visible only for status='pending'
   → `kycService.approveKYC(id)`

4. **Reject (Red X):** Visible only for status='pending'
   → Modal with required rejection reason textarea
   → `kycService.rejectKYC(id, reason)`

5. **Delete (Trash icon):**
   → Confirmation dialog → `kycService.deleteKYC(id)`

**Backend:** Uses `kycService` (not adminService):
- `fetchAllKYCSubmissions()` → `seller_kyc` table
- `approveKYC(id)` → updates status + profiles.is_verified
- `rejectKYC(id, reason)` → updates status + rejection_reason
- `deleteKYC(id)` → deletes from seller_kyc
- `updateKYC(id, data)` → partial update

---

## 9. PRODUCT MANAGEMENT

### ProductManagement.tsx (440 lines)
**File:** `src/pages/admin/modules/ProductManagement.tsx`  
**Route:** `/admin/products`

**Table Columns:**
| Column | Source |
|--------|--------|
| Product Name | `name` + thumbnail + `sku` |
| Category | `category_name` (from join) |
| Price | `price` + `discount_price` (strikethrough if discounted) |
| Stock | `stock` count |
| Approval Status | `approval_status` badge |
| Active Status | `is_active` toggle indicator |
| Actions | View, Approve, Reject, Toggle Status |

**Filters:**
- Search: by product name (text input)
- Approval Status: All / pending / approved / rejected
- Category: dropdown populated from DB

**Actions:**
1. **View Details:** Modal showing name, SKU, category, sub-category, price, stock, brand, discount price, description, images grid
2. **Approve:** Green checkmark, pending products only → `productService.approveProduct(id)`
3. **Reject:** Red X, pending products only → `productService.rejectProduct(id)`
4. **Toggle Status:** Power icon → `productService.toggleProductStatus(id, !current)`
5. **Add New Product:** Button → navigates to `/admin/products/new`

**Pagination:** Server-side, limit 50, offset-based

**Backend:** Uses `productService`:
- `fetchProducts({ search, approvalStatus, categoryId, offset, limit })`
- `approveProduct(id)` → updates approval_status='approved'
- `rejectProduct(id)` → updates approval_status='rejected'
- `toggleProductStatus(id, isActive)` → updates is_active
- `fetchCategories()` for category filter dropdown

---

## 10. PRODUCT CREATION WIZARD (6-STEP)

### ProductListingLayout.tsx (~110 lines)
**File:** `src/pages/admin/modules/ProductListingLayout.tsx`  
**Route:** `/admin/products/new`

**Architecture:**
- Wraps content in `<ProductListingProvider>` context
- Step indicator bar showing 6 steps with completion status (green checkmarks)
- Back button on step 1 → confirmation prompt → reset form → navigate to `/admin/products`
- Renders `<Outlet />` for step content

### Step 1 — Basic Info (AdminListings1.tsx, 529 lines)
**Route:** `/admin/products/new` or `/admin/products/new/step1`

**Fields:**
- Category (dropdown from DB via `fetchCategories()`)
- Sub-Category (dependent dropdown from selected category)
- Product Type (text)
- Product Name (text)
- Brand Name (text)
- Model Name / Number (text)
- Stock Quantity (number)
- Size Variants table: Size, Quantity, Stock, Price per variant
- Color Variants table: Color (from 20 predefined colors with hex), SKU, Price, Stock

**20 Predefined Colors:** Black, White, Red, Blue, Green, Yellow, Orange, Purple, Pink, Brown, Gray, Navy, Teal, Maroon, Olive, Coral, Turquoise, Lavender, Beige, Gold

**Context integration:** Uses `updateStep1()`, `goToNextStep()`, `isStepValid()` from ProductListingContext

### Step 2 — Photos & Videos (AdminListings2.tsx, 464 lines)
**Route:** `/admin/products/new/step2`

**Image Rules:**
- Minimum: 5 images (enforced)
- Maximum: 10 images
- Max size: 25MB per image
- Formats: JPEG, JPG, PNG only

**Video Rules:**
- Maximum: 2 videos
- Max size: 40MB per video
- Formats: MP4, WebM, MOV

**Features:**
- Drag-and-drop file upload
- Simulated upload progress bar (interval-based animation)
- Image preview grid with delete option
- Video preview with delete option

### Step 3 — Detailed Info (AdminListings3.tsx, 338 lines)
**Route:** `/admin/products/new/step3`

**Fields:**
- Product Highlights (text areas, multiple)
- Full Description (rich text — has bold, italic, list formatting buttons)
- Seller Notes (text area)
- Specifications (dynamic key-value pair list, add/remove)

### Step 4 — Pricing Plan (AdminListing4.tsx, 445 lines)
**Route:** `/admin/products/new/step4`

**Fields:**
- Currency (from selected country)
- MRP (Maximum Retail Price)
- Selling Price
- GST (auto-calculated by country)
- Platform Fee
- Commission

**GST Rates by Country:**
| Country | GST Rate |
|---------|----------|
| India (IN) | 18% |
| United States (US) | 0% |
| United Kingdom (GB) | 20% |
| Canada (CA) | 5% |
| Australia (AU) | 10% |
| UAE (AE) | 5% |
| Germany (DE) | 19% |
| France (FR) | 20% |
| Singapore (SG) | 8% |
| Japan (JP) | 10% |
| Default | 15% |

**Delivery Countries:** Dynamic list with:
- Country (from DB via `fetchCountries()`)
- Delivery Charge
- Minimum Order Quantity

### Step 5 — Shipping & Policies (AdminListing5.tsx, 387 lines)
**Route:** `/admin/products/new/step5`

**Courier Partners (12 options):**
Delhivery, Blue Dart, DTDC, FedEx, DHL, Ecom Express, XpressBees, Shadowfax, Gati, Professional Couriers, India Post, Other

**Weight Calculation:**
- Actual weight input
- Package dimensions: Length × Width × Height
- Volumetric weight = (L × W × H) / 5000
- Chargeable weight = max(actual, volumetric)

**Policy Fields:**
- Return policy days
- Cancellation policy days

### Step 6 — Offer Rules + Submit (AdminListing6.tsx, 538 lines)
**Route:** `/admin/products/new/step6`

**Offer Types:**
- `buy_x_get_y` — Buy X Get Y free
- `special_day` — Special day discount
- `hourly` — Time-limited deal
- `bundle` — Bundle discount

**13 Special Days:**
New Year, Republic Day, Valentine's Day, Holi, Independence Day, Raksha Bandhan, Diwali, Christmas, Black Friday, Cyber Monday, End of Season Sale, Anniversary Sale, Flash Sale

**Submit Flow:**
1. Calls `getSubmitData()` from ProductListingContext to assemble all 6 steps
2. `createProduct(data)` from productService → inserts into `products` table
3. For each image: `uploadProductImage(productId, file)` → uploads to `product-images` bucket
4. For each video: `uploadProductVideo(productId, file)` → uploads to `product-videos` bucket
5. On success → navigate to `/admin/products`

---

## 11. PRODUCT VARIANT MANAGEMENT

### ProductVariantManagement.tsx (547 lines)
**File:** `src/pages/admin/modules/ProductVariantManagement.tsx`  
**Route:** `/admin/variants`

**Status: ❌ NOT connected to Supabase — entirely local state with hardcoded mock data**

**Features:**
- Add/Edit/Delete variants (local state only)
- Add colors with hex picker
- Auto-generate SKU (`SKU-{timestamp}-{random}`)
- Copy SKU to clipboard

**10 Size Systems:**
| System | Values |
|--------|--------|
| INTL_ALPHA | XS, S, M, L, XL, XXL |
| EU_NUMERIC | 36, 38, 40, 42, 44, 46, 48 |
| US_NUMERIC | 0, 2, 4, 6, 8, 10, 12 |
| UK_NUMERIC | 6, 8, 10, 12, 14, 16, 18 |
| WAIST | 28, 30, 32, 34, 36, 38, 40 |
| SHOE_US | 5–13 |
| SHOE_UK | 3–11 |
| SHOE_EU | 35–45 |
| KIDS_AGE | 0-3M, 3-6M, 6-12M, 1Y–5Y |
| FREE_SIZE | FREE |

**4 Stat Cards:** Total Variants, Total Stock, Colors, SKU count (all from local state)

**Mock Data:** 2 hardcoded variants (Red M, Blue L) + 4 colors

**To make functional:** Needs a `product_variants` table in Supabase and corresponding service functions.

---

## 12. PRODUCT IMAGE MANAGEMENT

### ProductImageManagement.tsx (262 lines)
**File:** `src/pages/admin/modules/ProductImageManagement.tsx`  
**Route:** Not directly in sidebar (accessible via internal navigation)

**Status: ✅ Connected to Supabase**

**Features:**
1. **Product Selector:** Dropdown of all products (limit 50) from `products` table
2. **Upload:** File input for multiple images → `uploadProductImageFile()` → `product-images` bucket
3. **Image Grid:** Displays all images with drag-and-drop reordering
4. **Set Main Image:** Updates `products.image_url` to selected image
5. **Delete Image:** Removes URL from `products.images` array
6. **Reorder:** Drag-and-drop updates `products.images` array order

**Backend:**
- `adminService.getProductImages(productId)` → reads from `products.images` array
- `adminService.uploadProductImageFile(productId, file, userId)` → uploads to `product-images` bucket
- Direct Supabase queries for image array manipulation

---

## 13. ORDER MANAGEMENT

### OrderManagement.tsx (340 lines)
**File:** `src/pages/admin/modules/OrderManagement.tsx`  
**Route:** `/admin/orders`

**Table Columns:**
| Column | Source |
|--------|--------|
| Order ID | `id` (truncated) |
| User | `user_id` (should show name) |
| Amount | `total_amount` formatted |
| Status | `status` badge (color-coded) |
| Payment | `payment_status` |
| Date | `created_at` |
| Actions | View Details |

**Status Filter Dropdown:**
new, processing, shipped, delivered, cancelled, return_requested, returned

**Order Detail Modal:**
- Displays: Order ID, status, amount, date
- **Status Update:** Dropdown to change status to any value → `adminService.updateOrderStatus(id, status)`
- **Process Refund:** Button → opens refund dialog

**Refund Dialog:**
- Amount input (max = order total_amount)
- On submit: `adminService.processRefund(orderId, amount)` →
  1. Inserts into `payment_refunds` table (order_id, amount, status='processed', processed_at=now)
  2. Updates order status to 'refunded'

**Pagination:** Server-side, limit 10

**Backend:**
- `adminService.getAllOrders(status, offset, limit)` → `orders` + `order_items` join
- `adminService.updateOrderStatus(id, status)` → updates `orders.status`
- `adminService.processRefund(orderId, amount)` → inserts `payment_refunds` + updates order

**Issues:**
- User column shows `user_id` UUID instead of user name (no profiles join)
- No order items display in detail modal

---

## 14. CATEGORY MANAGEMENT

### CategoryManagement.tsx (467 lines)
**File:** `src/pages/admin/modules/CategoryManagement.tsx`  
**Route:** `/admin/categories`

**Features:**
1. **Category List:** Grid/table with name, image preview, sub-category count, expand/collapse
2. **Create Category:** Form with name + image (file upload or URL) + sub-categories list
3. **Edit Category:** Same form pre-filled with existing data
4. **Delete Category:** Confirmation dialog → `deleteCategory(id)`
5. **Add Sub-Category:** Inline from expanded category row
6. **Image Upload:** Max 5MB, image files only → `uploadCategoryImage()` to storage bucket

**Backend:** Uses `productService`:
- `fetchCategories(includeSubcategories)` → `categories` table with sub_categories join
- `createCategory({ name, image_url })` → inserts into `categories`
- `updateCategory(id, { name, image_url })` → updates `categories`
- `deleteCategory(id)` → deletes from `categories`
- `createSubCategory({ category_id, name })` → inserts into `sub_categories`
- `uploadCategoryImage(file)` → uploads to category image bucket

---

## 15. SUB-CATEGORY MANAGEMENT

### SubCategoryManagement.tsx (274 lines)
**File:** `src/pages/admin/modules/SubCategoryManagement.tsx`  
**Route:** Not registered in App.tsx (no direct route)

**Status: ✅ Fully connected to Supabase**

**Features:**
1. **Category Selector:** Dropdown to filter sub-categories by parent category
2. **CRUD Operations:** Create, Edit, Delete sub-categories
3. **Form Fields:** Name (required), Description (optional)

**Backend:** Uses `productService`:
- `fetchCategories()` → for parent category dropdown
- `fetchSubCategories(categoryId)` → `sub_categories` WHERE category_id
- `createSubCategory({ category_id, name, description })`
- `updateSubCategory(id, { name, description })`
- `deleteSubCategory(id)`

**Issue:** No route registered in App.tsx — this module is only accessible if linked internally.

---

## 16. BANNER MANAGEMENT

### BannerManagement.tsx (246 lines)
**File:** `src/pages/admin/modules/BannerManagement.tsx`  
**Route:** `/admin/banners`

**Grid Display:** Image preview, title, position, active status badge

**Form Fields:**
- Title (text input)
- Image URL (text input — **not** file upload)
- Link (optional URL)
- Is Active (toggle)
- Position (number)

**Actions:** Add, Edit, Delete (all wired to backend)

**Backend:**
- `adminService.getAllBanners()` → `banners` table
- `adminService.createBanner(data)` → inserts into `banners`
- `adminService.updateBanner(id, data)` → updates `banners`
- `adminService.deleteBanner(id)` → deletes from `banners`

**Issues:**
- Image uses URL text input instead of file upload — inconsistent with category/product image upload pattern
- No image preview validation before save

---

## 17. PROMOTION MANAGEMENT

### PromotionManagement.tsx (~200 lines)
**File:** `src/pages/admin/modules/PromotionManagement.tsx`  
**Route:** `/admin/promotions`

**Status: ⚠️ Read-only — Create/Edit/Delete buttons exist but Edit/Delete are NOT wired**

**Table Columns:** Title, Discount Percentage, Applicable To, Expiry Date, Status

**Buttons present:**
- "Create Promo" → exists but form **NOT implemented**
- Edit per row → button exists but **NOT connected** to `adminService.updatePromotion()`
- Delete per row → button exists but **NOT connected** to `adminService.deletePromotion()`

**Backend:**
- `adminService.getAllPromotions()` → `promotions` table (read only used)
- `adminService.createPromotion(data)` → EXISTS in service but not called from UI
- `adminService.updatePromotion(id, data)` → EXISTS in service but not called from UI
- `adminService.deletePromotion(id)` → EXISTS in service but not called from UI

**To fix:** Wire the existing service functions to the UI buttons.

---

## 18. REVIEW MANAGEMENT

### ReviewManagement.tsx (~200 lines)
**File:** `src/pages/admin/modules/ReviewManagement.tsx`  
**Route:** `/admin/reviews`

**Status: ✅ Connected**

**Table Columns:** Product, User, Rating (stars), Comment, Verified (badge), Actions

**Actions:**
- **Flag:** Toggle flagged status → `adminService.flagReview(id)`
- **Delete:** Confirmation → `adminService.deleteReview(id)`

**Pagination:** Server-side, limit 10

**Backend:**
- `adminService.getAllReviews(offset, limit, flaggedOnly)` → `reviews` with `profiles` join
- `adminService.flagReview(id)` → updates `reviews.is_flagged`
- `adminService.deleteReview(id)` → deletes from `reviews`

---

## 19. COMPLAINT MANAGEMENT

### ComplaintManagement.tsx (273 lines)
**File:** `src/pages/admin/modules/ComplaintManagement.tsx`  
**Route:** `/admin/complaints`

**Status: ✅ Connected**

**Table Columns:** ID, User, Subject, Status (badge), Date, Actions

**Status Filter Dropdown:** open, in_progress, resolved, closed

**Detail Modal:**
- Displays complaint info (subject, description, user, date)
- Status update dropdown (open / in_progress / resolved / closed)
- Resolution textarea (for entering resolution notes)
- Update button → `adminService.updateComplaintStatus(id, { status, resolution })`

**Backend:**
- `adminService.getAllComplaints(status, offset, limit)` → `complaints` table with pagination
- `adminService.updateComplaintStatus(id, { status, resolution, resolved_at })` → updates `complaints`

---

## 20. ACCOUNTS MANAGEMENT

### AccountsManagement.tsx (1419 lines — largest module)
**File:** `src/pages/admin/modules/AccountsManagement.tsx`  
**Route:** `/admin/accounts`

**Status: ⚠️ Partial — read operations connected, some write operations local-state only**

**6 Tabs:**

#### Tab 1: Overview
- Summary cards: Total Revenue, Total Expenses, Total Payouts, Net Profit
- Backend: `adminService.getAccountSummary()` → aggregates from orders/expense_entries/seller_payouts

#### Tab 2: Daybook
- Table: Date, Description, Type, Amount, Balance
- Date filter
- Pagination: server-side
- Backend: `adminService.getDaybook(offset, limit, startDate, endDate)` → `daybook_entries` table

#### Tab 3: Bank Book
- Table: Date, Description, Bank, Debit, Credit, Balance
- Pagination: server-side
- Backend: `adminService.getBankBook(offset, limit)` → `bank_book_entries` table

#### Tab 4: Expenses
- Table: Date, Description, Category, Amount, Vendor, Status
- **Add Expense Form:** date, amount, category, description, vendor, status
- Backend fetch: `adminService.getExpenses(offset, limit)` → `expense_entries` table
- **BUG:** `handleAddExpense` only pushes to local state array — does NOT call Supabase insert

#### Tab 5: Payouts
- Table: Seller, Amount, Status, Date
- Pagination: server-side
- Backend: `adminService.getSellerPayouts(offset, limit)` → `seller_payouts` table

#### Tab 6: Settings
- **Account Heads:** Name, Type (asset/liability/income/expense), Description
  - Add Account Head form exists
  - **BUG:** `handleAddAccountHead` only sets local state — does NOT persist to DB
- **Tax Rules:** Name, Percentage, Country
  - Add Tax Rule form exists
  - Backend: `adminService.getTaxRules()`
- **Membership Plans:** Name, Price, Currency, Duration
  - Add Plan form exists
  - Backend: `adminService.getMembershipPlans()`
- **Platform Costs:** Various platform cost entries
  - Backend: `adminService.getPlatformCosts()`

**Backend Functions:**
- `getAccountSummary()` → aggregates orders.total_amount, expense_entries.amount, seller_payouts.amount
- `getDaybook(offset, limit, startDate, endDate)` → `daybook_entries`
- `getBankBook(offset, limit)` → `bank_book_entries`
- `getAccountHeads()` → `account_heads` table
- `getExpenses(offset, limit)` → `expense_entries`
- `getSellerPayouts(offset, limit)` → `seller_payouts`
- `getMembershipPlans()` → `membership_plans` table
- `getTaxRules()` → `tax_rules` table
- `getPlatformCosts()` → `platform_costs` table

---

## 21. REPORTS MANAGEMENT

### ReportsManagement.tsx (~180 lines)
**File:** `src/pages/admin/modules/ReportsManagement.tsx`  
**Route:** `/admin/reports`

**Status: ⚠️ CSV only — Excel/PDF not implemented**

**Report Types:** Sales, Orders, Users, Sellers, Products, Finance

**Filter Fields:**
- Start Date (date picker)
- End Date (date picker)
- Category (dropdown)
- Country (dropdown)

**Format Options:** CSV, Excel, PDF

**Generate Flow:**
1. Select report type + filters + format
2. `adminService.generateReport(type, filters)` →
   - Fetches from `orders` (for sales/orders/finance) or `profiles` (for users/sellers)
   - Generates CSV string with headers
   - Returns as Blob
3. Creates download link and triggers browser download

**Issues:**
- Only CSV format actually works — Excel and PDF format options exist in UI but `generateReport` only generates CSV regardless
- Report data is basic — no advanced aggregations or analytics
- Category and Country filters are passed but not used in the query

---

## 22. ADMIN MANAGEMENT

### AdminManagement.tsx (~30 lines)
**File:** `src/pages/admin/modules/AdminManagement.tsx`  
**Route:** `/admin/admins`

**Status: ❌ Placeholder only**

- Displays: "Admin Management module coming soon..."
- "Add Admin" button exists but is non-functional
- No CRUD operations implemented
- No list of existing admins

---

## 23. PROFILE PAGE

### ProfilePage.tsx (~80 lines)
**File:** `src/pages/admin/modules/ProfilePage.tsx`  
**Route:** `/admin/profile`

**Status: ✅ Connected (read-only)**

**Displays:**
- Admin Name (`full_name`)
- Email
- Created Date
- UID (user.id)

**Backend:** `adminService.getAdminProfile(userId)` → reads from `profiles` table

**Issues:**
- Read-only — no ability to update profile fields
- No avatar/photo support

---

## 24. SETTINGS PAGE

### SettingsPage.tsx (~70 lines)
**File:** `src/pages/admin/modules/SettingsPage.tsx`  
**Route:** `/admin/settings`

**Status: ❌ Placeholder only**

**3 Card Groups (all buttons, no functionality):**

1. **Business Rules:**
   - Platform Charges → button (not wired)
   - Profit Calculation → button (not wired)
   - Tax Settings → button (not wired)

2. **Master Data:**
   - Country List → button (not wired)
   - Category List → button (not wired)
   - Sub Category List → button (not wired)

3. **System Settings:**
   - General Settings → button (not wired)
   - Email Settings → button (not wired)
   - API Keys → button (not wired)

**Footer message:** "All backend connections are properly configured" (misleading — nothing is connected)

---

## 25. SEARCH MANAGEMENT

### SearchManagement.tsx (~200 lines)
**File:** `src/pages/admin/modules/SearchManagement.tsx`  
**Route:** `/admin/search`

**Status: ✅ Connected**

**Search Filters (checkboxes):**
- Users
- Sellers
- Products
- Orders

**Search Behavior:**
- Text input → debounced search across selected entity types
- Uses `adminService.adminGlobalSearch(query, filters)`
- Results show type badge (color-coded by entity), title, description, metadata

**Backend:**
```typescript
// adminGlobalSearch searches across:
// - profiles (WHERE role='user' AND (full_name/email ilike query))
// - profiles (WHERE role='seller' AND (full_name/email/shop_name ilike query))
// - products (WHERE name/sku/description ilike query)
// - orders (WHERE id ilike query)
```

**Issues:**
- Export button exists but is NOT functional
- Order search only matches by ID, not by user name or product name

---

## 26. AUDIT LOGS

### AuditLogs.tsx (227 lines)
**File:** `src/pages/admin/modules/AuditLogs.tsx`  
**Route:** `/admin/audit-logs`

**Status: ⚠️ Partial — data fetching works, filters/export not wired**

**Table Columns:** Timestamp, Admin, Action, Resource, Status, IP Address, Details

**Filter Options:**
- Date Range: Today, Last 7 Days, Last 30 Days, Last 90 Days, All Time
- Action Type: text input
- Status: success / failed

**Buttons:**
- "Apply Filters" → exists but **NOT wired** (filters don't affect the query)
- "Export CSV" → exists but **NOT functional**

**Backend:** `adminService.getAuditLogs(offset, limit)` → reads from `audit_logs` table

**Issues:**
- Filters update local state but are never passed to the backend query
- Export CSV button has no handler
- No audit log writing — no admin actions are actually logged to the audit_logs table

---

## 27. SYSTEM HEALTH

### SystemHealth.tsx (251 lines)
**File:** `src/pages/admin/modules/SystemHealth.tsx`  
**Route:** `/admin/health`

**Status: ⚠️ Partial — counts are real, performance metrics are hardcoded**

**Health Status Cards (from backend):**
| Service | Source | Status |
|---------|--------|--------|
| Database Connection | `getSystemHealth()` | ✅ Real count data |
| API Server | Hardcoded "Operational" | ❌ Not real |
| Storage | Hardcoded "Operational" | ❌ Not real |

**Counts from `getSystemHealth()`:**
- Total Users (profiles WHERE role='user')
- Total Products (products count)
- Total Orders (orders count)
- Total Complaints (complaints count)

**Performance Metrics (ALL HARDCODED):**
| Metric | Value | Real? |
|--------|-------|-------|
| Avg Response Time | 45ms | ❌ |
| P95 Response Time | 128ms | ❌ |
| P99 Response Time | 245ms | ❌ |
| Error Rate | 0.05% | ❌ |

**Database Performance (ALL HARDCODED):**
| Metric | Value | Real? |
|--------|-------|-------|
| Connections | 245/500 | ❌ |
| CPU Usage | 32% | ❌ |
| Memory Usage | 58% | ❌ |
| Disk Usage | 72% | ❌ |

**Auto-refresh:** Every 30 seconds (toggleable via UI switch)

---

## 28. ADMIN ADDRESS MANAGEMENT

### AdminAddressManagement.tsx (313 lines)
**File:** `src/pages/admin/components/AdminAddressManagement.tsx`  
**Route:** `/admin/addresses`

**Status: ❌ Mock data only — NOT connected to Supabase**

**Features:**
- Search users by name/email
- View addresses per user (expand/collapse)
- Edit address (using AddressForm component)
- Delete address (local state only)

**Mock Data:** 1 hardcoded user (John Doe) with 1 address

**Address Fields:** fullName, phoneNumber, email, country, streetAddress1, streetAddress2, city, state, postalCode, addressType (home/work/other), deliveryNotes, isDefault

**Note:** `adminService.ts` has `getUserAddresses`, `createUserAddress`, `updateUserAddress`, `deleteUserAddress` functions that connect to `user_addresses` table — but this component doesn't use them. It uses local state instead.

**Layout inconsistency:** This component renders its own Header + Footer + MobileNav (the main site layout), not the admin layout. It shouldn't be nested under AdminLayout.

---

## 29. KYC REQUIREMENT MANAGEMENT

### KYCRequirementManagement.tsx (257 lines)
**File:** `src/pages/admin/modules/KYCRequirementManagement.tsx`  
**Route:** Not registered in App.tsx

**Status: ✅ Connected to Supabase (but no route)**

**Features:**
- List KYC requirements grouped by country
- Create new requirement
- Edit existing requirement
- Delete requirement

**Form Fields:**
- Country (text input)
- Registration Type (text input, e.g., "Individual")
- Required Documents (text input, e.g., "PAN, GST")
- Description (optional textarea)

**Backend:** Uses `adminService`:
- `getAllKYCRequirements()` → `seller_kyc_documents` table
- `createKYCRequirement(data)` → inserts
- `updateKYCRequirement(id, data)` → updates
- `deleteKYCRequirement(id)` → deletes

**Issue:** No route registered in App.tsx — not accessible from sidebar navigation.

---

## 30. BUSINESS TYPE MANAGEMENT

### BusinessTypeManagement.tsx (~50 lines)
**File:** `src/pages/admin/modules/BusinessTypeManagement.tsx`  
**Route:** Not registered in App.tsx

**Status: ❌ Hardcoded mock data using TableManager**

**Mock Data:**
- Individual — "Solo seller or freelancer"
- Partnership — "Business partnership"
- Company — "Registered company"

**CRUD callbacks:** Log to console via `logger.log()` — no Supabase integration

**Uses:** `TableManager` component (which itself is a minimal shell — renders "Table manager functionality...")

---

## 31. DASHBOARD METRICS & COUNTRY LIST

### DashboardMetricsManagement.tsx (~60 lines)
**File:** `src/pages/admin/modules/DashboardMetricsManagement.tsx`

**Status: ❌ Hardcoded mock data using TableManager**

Uses `TableManager` with hardcoded mock metrics data. Not connected to real analytics.

### CountryListManagement.tsx (~50 lines)
**File:** `src/pages/admin/modules/CountryListManagement.tsx`

**Status: ❌ Hardcoded mock data using TableManager**

Mock data: India, USA, UK. Not connected to the `countries` table in Supabase.

### TableManager.tsx (~30 lines)
**File:** `src/pages/admin/modules/TableManager.tsx`

**Status: ❌ Minimal shell**

Generic reusable table component. Exports `TableConfig` interface with name, fields, onFetch/onAdd/onEdit/onDelete callbacks. But the rendered output is just a heading + "Table manager functionality..." text. Not functional.

---

## 32. SHARED COMPONENTS

### StatusIndicators.tsx
**File:** `src/pages/admin/components/StatusIndicators.tsx`

Exports 3 utility components:
- `Loading` — spinning loader with optional message
- `ErrorMessage` — red alert box
- `SuccessMessage` — green alert box

Used across admin modules for loading states and feedback messages.

---

## 33. ADMIN SERVICE LAYER (adminService.ts)

**File:** `src/lib/adminService.ts` (935 lines)

### Complete Function Inventory

#### Seller Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAllSellers(search, kycFilter, offset, limit)` | profiles + seller_kyc | READ | SellerManagement |
| `updateSellerKYC(id, status)` | seller_kyc + profiles | UPDATE | SellerManagement |
| `updateSellerBadge(sellerId, badge)` | profiles.role | UPDATE | SellerManagement (**BUGGY**) |

#### User Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAllUsers(search, roleFilter, offset, limit)` | profiles | READ | UserManagement |
| `banUser(id)` | profiles | UPDATE | UserManagement |
| `unbanUser(id)` | profiles | UPDATE | UserManagement |
| `deleteUser(id)` | profiles | DELETE | UserManagement |

#### Order Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAllOrders(status, offset, limit)` | orders + order_items | READ | OrderManagement |
| `updateOrderStatus(id, status)` | orders | UPDATE | OrderManagement |
| `processRefund(orderId, amount)` | payment_refunds + orders | INSERT+UPDATE | OrderManagement |

#### Complaint Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAllComplaints(status, offset, limit)` | complaints | READ | ComplaintManagement |
| `updateComplaintStatus(id, data)` | complaints | UPDATE | ComplaintManagement |

#### Review Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAllReviews(offset, limit, flaggedOnly)` | reviews + profiles | READ | ReviewManagement |
| `flagReview(id)` | reviews | UPDATE | ReviewManagement |
| `deleteReview(id)` | reviews | DELETE | ReviewManagement |

#### Banner Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAllBanners()` | banners | READ | BannerManagement |
| `createBanner(data)` | banners | INSERT | BannerManagement |
| `updateBanner(id, data)` | banners | UPDATE | BannerManagement |
| `deleteBanner(id)` | banners | DELETE | BannerManagement |

#### Promotion Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAllPromotions()` | promotions | READ | PromotionManagement |
| `createPromotion(data)` | promotions | INSERT | **NOT USED** |
| `updatePromotion(id, data)` | promotions | UPDATE | **NOT USED** |
| `deletePromotion(id)` | promotions | DELETE | **NOT USED** |

#### Account Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAccountSummary()` | orders + expense_entries + seller_payouts | READ (aggregate) | AccountsManagement |
| `getDaybook(offset, limit, startDate, endDate)` | daybook_entries | READ | AccountsManagement |
| `getBankBook(offset, limit)` | bank_book_entries | READ | AccountsManagement |
| `getAccountHeads()` | account_heads | READ | AccountsManagement |
| `getExpenses(offset, limit)` | expense_entries | READ | AccountsManagement |
| `getSellerPayouts(offset, limit)` | seller_payouts | READ | AccountsManagement |
| `getMembershipPlans()` | membership_plans | READ | AccountsManagement |
| `getTaxRules()` | tax_rules | READ | AccountsManagement |
| `getPlatformCosts()` | platform_costs | READ | AccountsManagement |

#### Report Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `generateReport(type, filters)` | orders / profiles | READ + CSV blob | ReportsManagement |

#### Profile Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAdminProfile(userId)` | profiles | READ | ProfilePage |

#### Notification Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getNotifications(userId)` | notifications | READ | **NOT USED in admin UI** |
| `markNotificationRead(id)` | notifications | UPDATE | **NOT USED in admin UI** |
| `deleteNotification(id)` | notifications | DELETE | **NOT USED in admin UI** |

#### User Address Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getUserAddresses(userId)` | user_addresses | READ | **NOT USED** (component uses mock) |
| `createUserAddress(userId, data)` | user_addresses | INSERT | **NOT USED** |
| `updateUserAddress(id, data)` | user_addresses | UPDATE | **NOT USED** |
| `deleteUserAddress(id)` | user_addresses | DELETE | **NOT USED** |

#### Wishlist Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getWishlist(userId)` | wishlists + products | READ | User-side (not admin) |
| `addToWishlist(userId, productId)` | wishlists | UPSERT | User-side |
| `removeFromWishlist(userId, productId)` | wishlists | DELETE | User-side |

#### Cart Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getCartItems(userId)` | cart_items + products | READ | User-side (not admin) |
| `upsertCartItem(userId, productId, qty)` | cart_items | UPSERT | User-side |
| `removeCartItem(userId, productId)` | cart_items | DELETE | User-side |
| `clearCart(userId)` | cart_items | DELETE | User-side |

#### User Review Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `createReview(data)` | reviews | INSERT | User-side (not admin) |

#### Audit Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAuditLogs(offset, limit)` | audit_logs | READ | AuditLogs |

#### Search Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `adminGlobalSearch(query, filters)` | profiles + products + orders | READ (ilike) | SearchManagement |

#### Product Image Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getProductImages(productId)` | products.images | READ | ProductImageManagement |
| `uploadProductImageFile(productId, file, userId)` | product-images bucket | UPLOAD | ProductImageManagement |

#### KYC Requirement Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getAllKYCRequirements()` | seller_kyc_documents | READ | KYCRequirementManagement |
| `createKYCRequirement(data)` | seller_kyc_documents | INSERT | KYCRequirementManagement |
| `updateKYCRequirement(id, data)` | seller_kyc_documents | UPDATE | KYCRequirementManagement |
| `deleteKYCRequirement(id)` | seller_kyc_documents | DELETE | KYCRequirementManagement |

#### System Health Operations
| Function | Table | Type | Used By |
|----------|-------|------|---------|
| `getSystemHealth()` | profiles + products + orders + complaints | READ (count) | SystemHealth |

---

## 34. KNOWN BUGS & ISSUES

### CRITICAL

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 1 | **updateSellerBadge overwrites role** | adminService.ts `updateSellerBadge()` | Sets `profiles.role` to 'silver'/'gold'/'platinum' instead of 'seller'. Breaks seller access to `/seller` routes. |
| 2 | **Admin logout redirects to /seller** | AdminHeader.tsx line ~120 | After signOut(), navigates to `/seller` instead of `/` or `/login` |

### HIGH

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 3 | **AccountsManagement Add Expense not saved** | AccountsManagement.tsx `handleAddExpense` | Only updates local state array, never calls Supabase insert |
| 4 | **AccountsManagement Add Account Head not saved** | AccountsManagement.tsx `handleAddAccountHead` | Only updates local state, never persists to DB |
| 5 | **Product Variants entirely mock** | ProductVariantManagement.tsx | Full module with CRUD but no DB table or service — all local state with hardcoded data |
| 6 | **Admin Addresses entirely mock** | AdminAddressManagement.tsx | Has mock data, doesn't use existing `adminService` address functions |
| 7 | **Promotion Management Edit/Delete not wired** | PromotionManagement.tsx | Buttons exist, service functions exist, but not connected |
| 8 | **Audit log filters not functional** | AuditLogs.tsx | Apply Filters button updates local state but never passes filters to backend query |

### MEDIUM

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 9 | **Dashboard metrics hardcoded to 0** | AdminOverview.tsx | Total Sales, Expenses, Bookings, Ongoing Orders, Returns all show `$0` / `0` |
| 10 | **System Health metrics hardcoded** | SystemHealth.tsx | Response times, CPU, memory, disk usage are all static values |
| 11 | **Reports only generate CSV** | ReportsManagement.tsx + adminService.ts | Excel/PDF format options in UI but service only outputs CSV |
| 12 | **Order user shows UUID not name** | OrderManagement.tsx | User column displays raw `user_id` instead of joining with profiles for name |
| 13 | **Banner uses URL text input** | BannerManagement.tsx | Should use file upload like categories/products for consistency |
| 14 | **No audit log writing** | Entire admin system | No admin action is actually written to the `audit_logs` table — only reads |
| 15 | **AdminAddressManagement wrong layout** | AdminAddressManagement.tsx | Renders its own Header/Footer/MobileNav instead of using AdminLayout |
| 16 | **KYC Requirements no route** | App.tsx | Module exists and is connected to DB but has no route in the router |
| 17 | **Sub-Categories no independent route** | App.tsx | Module exists and works but no route registered |
| 18 | **TableManager is a shell** | TableManager.tsx | Generic component renders only "Table manager functionality..." text |
| 19 | **User purchases always 0** | UserManagement.tsx | Not calculated from orders table |
| 20 | **Seller listings always 0** | SellerManagement.tsx | Not counted from products table |
| 21 | **Platform fee inconsistency** | DB: 7.5%, Seller code: 10% | Different hardcoded platform fees across the codebase |

---

## 35. INTEGRATION STATUS MATRIX

### ✅ Fully Connected to Supabase
- UserManagement (CRUD on profiles)
- SellerKYCSubmissionManagement (CRUD via kycService)
- ProductManagement (list/approve/reject/toggle via productService)
- Product Creation Wizard Steps 1-6 (creates product + uploads media)
- Product Image Management (upload/delete/reorder via adminService + direct Supabase)
- CategoryManagement (CRUD + image upload via productService)
- SubCategoryManagement (CRUD via productService)
- BannerManagement (CRUD via adminService)
- ReviewManagement (list/flag/delete via adminService)
- ComplaintManagement (list/resolve via adminService)
- OrderManagement (list/status/refund via adminService)
- SearchManagement (cross-table search via adminService)
- ProfilePage (read-only via adminService)
- KYCRequirementManagement (CRUD via adminService — but no route)

### ⚠️ Partially Connected
- AdminOverview (user/seller/product counts real, financial metrics hardcoded)
- SellerManagement (connected but badge update has critical bug)
- AccountsManagement (read operations work, add expense/account head don't persist)
- ReportsManagement (CSV download works, Excel/PDF don't)
- AuditLogs (data loads, filters/export not functional)
- SystemHealth (entity counts real, performance metrics hardcoded)
- PromotionManagement (read works, create/edit/delete not wired to UI)

### ❌ Not Connected (Mock / Placeholder)
- ProductVariantManagement (entirely local state)
- AdminAddressManagement (mock data, ignores existing service functions)
- AdminManagement (placeholder text only)
- SettingsPage (placeholder buttons only)
- BusinessTypeManagement (mock data via TableManager)
- DashboardMetricsManagement (mock data via TableManager)
- CountryListManagement (mock data via TableManager)

### Service Functions Without UI
- Notification operations (getNotifications, markRead, delete)
- User address CRUD (exists in adminService but UI uses mock data instead)
- Promotion create/update/delete (exists in adminService but UI doesn't call them)

---

## 36. FILE MAP

```
src/pages/admin/
├── AdminLayout.tsx                          # Layout shell (60 lines)
├── components/
│   ├── AdminAddressManagement.tsx            # Address management (313 lines, mock data)
│   ├── AdminHeader.tsx                       # Top header bar (154 lines)
│   ├── AdminSidebar.tsx                      # Left navigation (227 lines)
│   └── StatusIndicators.tsx                  # Loading/Error/Success components
├── modules/
│   ├── AccountsManagement.tsx                # Financial management, 6 tabs (1419 lines)
│   ├── AdminListing4.tsx                     # Step 4: Pricing (445 lines)
│   ├── AdminListing5.tsx                     # Step 5: Shipping (387 lines)
│   ├── AdminListing6.tsx                     # Step 6: Offers + Submit (538 lines)
│   ├── AdminListings1.tsx                    # Step 1: Basic Info (529 lines)
│   ├── AdminListings2.tsx                    # Step 2: Photos & Videos (464 lines)
│   ├── AdminListings3.tsx                    # Step 3: Detailed Info (338 lines)
│   ├── AdminManagement.tsx                   # Placeholder (~30 lines)
│   ├── AdminOverview.tsx                     # Dashboard home (247 lines)
│   ├── AuditLogs.tsx                         # Audit log viewer (227 lines)
│   ├── BannerManagement.tsx                  # Banner CRUD (246 lines)
│   ├── BusinessTypeManagement.tsx            # Mock TableManager (~50 lines)
│   ├── CategoryManagement.tsx                # Category CRUD (467 lines)
│   ├── ComplaintManagement.tsx               # Complaint management (273 lines)
│   ├── CountryListManagement.tsx             # Mock TableManager (~50 lines)
│   ├── DashboardMetricsManagement.tsx        # Mock TableManager (~60 lines)
│   ├── KYCRequirementManagement.tsx          # KYC requirement CRUD (257 lines)
│   ├── OrderManagement.tsx                   # Order management (340 lines)
│   ├── ProductImageManagement.tsx            # Image upload/manage (262 lines)
│   ├── ProductListingLayout.tsx              # 6-step wizard layout (~110 lines)
│   ├── ProductManagement.tsx                 # Product list/approval (440 lines)
│   ├── ProductVariantManagement.tsx          # Variant management, mock (547 lines)
│   ├── ProfilePage.tsx                       # Admin profile view (~80 lines)
│   ├── PromotionManagement.tsx               # Promotions, read-only (~200 lines)
│   ├── ReportsManagement.tsx                 # Report generation (~180 lines)
│   ├── ReviewManagement.tsx                  # Review moderation (~200 lines)
│   ├── SearchManagement.tsx                  # Global search (~200 lines)
│   ├── SellerKYCSubmissionManagement.tsx      # KYC approval flow (293 lines)
│   ├── SellerManagement.tsx                  # Seller management (359 lines)
│   ├── SettingsPage.tsx                      # Placeholder (~70 lines)
│   ├── SubCategoryManagement.tsx             # Sub-category CRUD (274 lines)
│   ├── SystemHealth.tsx                      # System monitoring (251 lines)
│   ├── TableManager.tsx                      # Generic table shell (~30 lines)
│   └── UserManagement.tsx                    # User management (319 lines)

src/lib/
├── adminService.ts                           # Admin backend service (935 lines)
├── productService.ts                         # Product/category service (shared)
├── kycService.ts                             # KYC operations (shared)
└── supabase.ts                               # Supabase client init

src/contexts/
└── ProductListingContext.tsx                  # 6-step product wizard state
```

**Total admin module files:** 34 modules + 4 components + 1 layout = **39 files**  
**Total admin code lines:** ~9,500+ lines  
**Service layer:** ~935 lines (adminService) + shared services

---

## SUMMARY

The admin dashboard is a comprehensive panel with 22+ registered routes covering user/seller/product/order management, financial accounting, KYC verification, content moderation, and system monitoring. Approximately **60% of modules are fully connected** to Supabase with working CRUD operations. The remaining 40% are either partially connected (read-only, filters broken, or write operations only updating local state) or completely placeholder/mock implementations.

**Top priorities for completion:**
1. Fix the critical `updateSellerBadge` bug that overwrites seller roles
2. Fix admin logout redirect from `/seller` to `/login`
3. Wire AccountsManagement add operations to Supabase
4. Connect ProductVariantManagement to a real DB table
5. Wire PromotionManagement create/edit/delete to existing service functions
6. Calculate real dashboard metrics (sales, expenses, orders) from the orders table
7. Complete the Reports module with Excel/PDF support
8. Implement AdminManagement and SettingsPage
9. Add audit log writing for admin actions
10. Register missing routes (KYC Requirements, Sub-Categories)
