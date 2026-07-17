export const mockUser = (overrides = {}) => ({
  id: "user-123",
  email: "luxury@cosman.com",
  password: "$2a$12$xyzMockHashedPasswordHerePleaseVerySecure",
  firstName: "Karim",
  lastName: "Bennani",
  phone: "+212600000000",
  role: "CUSTOMER",
  isEmailVerified: true,
  avatar: "https://cosman.com/avatars/user-123.jpg",
  resetPasswordToken: null,
  resetPasswordExpiresAt: null,
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const mockProduct = (overrides = {}) => ({
  id: "prod-789",
  name: "Royal Babouche in Amber Suede",
  slug: "royal-babouche-amber-suede",
  description: "Handcrafted Moroccan luxury footwear made from finest suede with traditional embroidery details.",
  price: 249.99,
  compareAtPrice: 299.99,
  sku: "BAB-AMB-42",
  categoryId: "cat-111",
  brand: "COSMAN",
  isActive: true,
  isFeatured: true,
  mainImage: "https://cosman.com/products/babouche-amber.jpg",
  images: [
    "https://cosman.com/products/babouche-amber-side.jpg",
    "https://cosman.com/products/babouche-amber-sole.jpg"
  ],
  tags: ["traditional", "handmade", "suede", "amber"],
  rating: 4.8,
  reviewCount: 15,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const mockProductVariant = (overrides = {}) => ({
  id: "variant-222",
  productId: "prod-789",
  size: "42",
  color: "Amber Suede",
  colorHex: "#FFBF00",
  sku: "BAB-AMB-42",
  stock: 25,
  priceAdjustment: 0.0,
  isActive: true,
  ...overrides
});

export const mockCategory = (overrides = {}) => ({
  id: "cat-111",
  name: "Babouches",
  slug: "babouches",
  description: "Exquisite handmade Moroccan slippers for indoor and outdoor elegance.",
  image: "https://cosman.com/categories/babouches.jpg",
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const mockCollection = (overrides = {}) => ({
  id: "col-333",
  name: "Atlas Spring/Summer",
  slug: "atlas-spring-summer",
  description: "Inspired by the warm golden hues and rich textures of the Atlas mountains.",
  image: "https://cosman.com/collections/atlas.jpg",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const mockCartItem = (overrides = {}) => ({
  id: "cart-item-444",
  cartId: "cart-555",
  productId: "prod-789",
  productVariantId: "variant-222",
  quantity: 2,
  price: 249.99,
  ...overrides
});

export const mockCart = (overrides = {}) => ({
  id: "cart-555",
  userId: "user-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [mockCartItem()],
  ...overrides
});

export const mockCoupon = (overrides = {}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return {
    id: "coupon-666",
    code: "COSMANSPRING10",
    type: "PERCENTAGE",
    value: 10.0,
    minAmount: 150.0,
    maxDiscount: 50.0,
    usageLimit: 100,
    usedCount: 5,
    isActive: true,
    validFrom: yesterday,
    validUntil: tomorrow,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
};

export const mockAddress = (overrides = {}) => ({
  id: "addr-777",
  userId: "user-123",
  label: "Home Address",
  firstName: "Karim",
  lastName: "Bennani",
  street: "Rue de la Liberté, No. 45",
  city: "Marrakech",
  state: "Marrakech-Safi",
  postalCode: "40000",
  country: "Morocco",
  phone: "+212600000000",
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const mockOrderItem = (overrides = {}) => ({
  id: "order-item-888",
  orderId: "order-999",
  productId: "prod-789",
  productVariantId: "variant-222",
  productName: "Royal Babouche in Amber Suede",
  productImage: "https://cosman.com/products/babouche-amber.jpg",
  size: "42",
  color: "Amber Suede",
  quantity: 1,
  price: 249.99,
  ...overrides
});

export const mockOrder = (overrides = {}) => ({
  id: "order-999",
  userId: "user-123",
  orderNumber: "CSM-2026-0001",
  status: "PENDING",
  totalAmount: 264.99,
  subtotal: 249.99,
  discount: 0.0,
  taxAmount: 15.00,
  shippingCost: 0.0,
  couponId: null,
  shippingAddressId: "addr-777",
  paymentMethod: "STRIPE",
  paymentStatus: "PENDING",
  stripePaymentIntentId: "pi_mock_12345",
  paypalOrderId: null,
  trackingNumber: null,
  carrier: null,
  notes: "Gift packaging requested.",
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [mockOrderItem()],
  ...overrides
});

export const mockReview = (overrides = {}) => ({
  id: "review-000",
  productId: "prod-789",
  userId: "user-123",
  rating: 5,
  title: "Outstanding Craftsmanship",
  comment: "Exquisite details, perfect fit, absolute masterwork of Moroccan artisans. Truly a premium experience.",
  isVerifiedPurchase: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});
