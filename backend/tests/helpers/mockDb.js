import { jest } from '@jest/globals';

class ChainableMockQuery {
  constructor(resolvedValue = null) {
    this._resolvedValue = resolvedValue;
  }

  setResolvedValue(value) {
    this._resolvedValue = value;
    return this;
  }

  include(arg) { return this; }
  select(arg) { return this; }
  where(arg) { return this; }
  orderBy(arg) { return this; }
  take(arg) { return this; }
  skip(arg) { return this; }
}

const createMockDelegate = () => {
  const delegate = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
  };

  // Helper to make each method chainable or return mock values easily
  Object.keys(delegate).forEach(key => {
    delegate[key].mockImplementation(() => {
      const query = new ChainableMockQuery();
      // Allow custom setups to override, or default to a promise resolving to undefined/null
      const promise = Promise.resolve(delegate[key]._mockValue !== undefined ? delegate[key]._mockValue : null);
      
      // Inject chainable helper functions onto the promise object
      promise.include = function() { return this; };
      promise.select = function() { return this; };
      promise.where = function() { return this; };
      promise.orderBy = function() { return this; };
      promise.take = function() { return this; };
      promise.skip = function() { return this; };
      
      return promise;
    });
    
    // Custom helper to quickly set return values
    delegate[key].mockSetValue = (val) => {
      delegate[key]._mockValue = val;
      delegate[key].mockImplementation(() => {
        const promise = Promise.resolve(val);
        promise.include = function() { return this; };
        promise.select = function() { return this; };
        promise.where = function() { return this; };
        promise.orderBy = function() { return this; };
        promise.take = function() { return this; };
        promise.skip = function() { return this; };
        return promise;
      });
    };
  };

  return delegate;
};

export const mockPrisma = {
  user: createMockDelegate(),
  address: createMockDelegate(),
  category: createMockDelegate(),
  collection: createMockDelegate(),
  product: createMockDelegate(),
  productCollection: createMockDelegate(),
  productVariant: createMockDelegate(),
  cart: createMockDelegate(),
  cartItem: createMockDelegate(),
  wishlist: createMockDelegate(),
  order: createMockDelegate(),
  orderItem: createMockDelegate(),
  review: createMockDelegate(),
  coupon: createMockDelegate(),
  notification: createMockDelegate(),
  $transaction: jest.fn(async (cb) => {
    if (typeof cb === 'function') {
      return cb(mockPrisma);
    }
    return cb;
  }),
  $queryRaw: jest.fn().mockResolvedValue([]),
  $connect: jest.fn().mockResolvedValue(),
  $disconnect: jest.fn().mockResolvedValue(),
};

export default mockPrisma;
