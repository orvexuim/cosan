import { jest } from '@jest/globals';
import productService from '../../src/services/product.service.js';
import mockPrisma from '../helpers/mockDb.js';
import { mockProduct } from '../helpers/mockData.js';
import ApiError from '../../src/utils/ApiError.js';

describe('ProductService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should successfully list products with default pagination', async () => {
      const p1 = mockProduct({ id: 'p1', name: 'Product 1' });
      const p2 = mockProduct({ id: 'p2', name: 'Product 2' });

      mockPrisma.product.findMany.mockSetValue([p1, p2]);
      mockPrisma.product.count.mockSetValue(2);

      const result = await productService.getAll({});

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 })
      );
      expect(result.products).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });

    it('should filter by category and custom page/limit', async () => {
      mockPrisma.product.findMany.mockSetValue([]);
      mockPrisma.product.count.mockSetValue(0);

      await productService.getAll({ categoryId: 'cat-123', page: 2, limit: 5 });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-123' }),
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('getById', () => {
    it('should return product if it is found', async () => {
      const p = mockProduct();
      mockPrisma.product.findUnique.mockSetValue(p);

      const result = await productService.getById(p.id);

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: p.id },
        include: { variants: true },
      });
      expect(result.id).toBe(p.id);
    });

    it('should throw an ApiError if product is not found', async () => {
      mockPrisma.product.findUnique.mockSetValue(null);

      await expect(productService.getById('nonexistent')).rejects.toThrow(ApiError);
      await expect(productService.getById('nonexistent')).rejects.toHaveProperty('statusCode', 404);
    });
  });

  describe('create', () => {
    it('should successfully create a product with proper slugification', async () => {
      const input = {
        name: 'Royal Babouche Amber',
        description: 'Luxury slipper',
        price: 150.0,
        sku: 'RBA-001',
        variants: [{ size: '42', color: 'Amber', stock: 10, colorHex: '#FFA000' }],
      };

      const created = mockProduct({
        ...input,
        slug: 'royal-babouche-amber',
      });
      mockPrisma.product.create.mockSetValue(created);

      const result = await productService.create(input);

      expect(mockPrisma.product.create).toHaveBeenCalled();
      expect(result.slug).toBe('royal-babouche-amber');
      expect(result.name).toBe(input.name);
    });
  });

  describe('update', () => {
    it('should successfully update a product and return the result', async () => {
      const p = mockProduct();
      mockPrisma.product.findUnique.mockSetValue(p);
      
      const updatedMock = mockProduct({ name: 'New Name', slug: 'new-name' });
      mockPrisma.product.update.mockSetValue(updatedMock);

      const result = await productService.update(p.id, { name: 'New Name' });

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({ where: { id: p.id } });
      expect(mockPrisma.product.update).toHaveBeenCalled();
      expect(result.slug).toBe('new-name');
    });

    it('should throw an ApiError if the product to update is not found', async () => {
      mockPrisma.product.findUnique.mockSetValue(null);

      await expect(productService.update('nonexistent', { name: 'Oops' })).rejects.toThrow(ApiError);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should successfully delete a product if found', async () => {
      const p = mockProduct();
      mockPrisma.product.findUnique.mockSetValue(p);
      mockPrisma.product.delete.mockSetValue(p);

      const result = await productService.delete(p.id);

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({ where: { id: p.id } });
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: p.id } });
      expect(result.success).toBe(true);
    });

    it('should throw an ApiError if product to delete is not found', async () => {
      mockPrisma.product.findUnique.mockSetValue(null);

      await expect(productService.delete('nonexistent')).rejects.toThrow(ApiError);
      expect(mockPrisma.product.delete).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should return empty array if search query is empty', async () => {
      const result = await productService.search('');
      expect(result).toEqual([]);
      expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
    });

    it('should execute full-text search correctly', async () => {
      const p = mockProduct();
      mockPrisma.product.findMany.mockSetValue([p]);

      const result = await productService.search('amber');

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'amber', mode: 'insensitive' } },
            { description: { contains: 'amber', mode: 'insensitive' } },
            { tags: { has: 'amber' } },
          ],
        },
        include: { variants: true },
      });
      expect(result).toHaveLength(1);
    });
  });
});
