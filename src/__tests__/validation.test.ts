/**
 * Tests for validation schemas.
 * @module __tests__/validation.test
 */

import { z } from 'zod';
import {
  propertySchema,
  unitSchema,
  tenantSchema,
  transactionSchema,
  financingSchema,
  paymentSchema,
  taskSchema,
  validateForm,
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('propertySchema', () => {
    it('should validate a valid property', () => {
      const validProperty = {
        name: 'Test Property',
        address: 'Test Street 123',
        city: 'Berlin',
        postalCode: '12345',
        purchasePrice: 100000,
        purchaseDate: '2020-01-15',
        totalArea: 100,
        unitsCount: 2,
        marketValue: 150000,
        propertyType: 'apartment' as const,
        yearBuilt: 1990,
      };

      const result = propertySchema.safeParse(validProperty);
      expect(result.success).toBe(true);
    });

    it('should reject invalid postal code', () => {
      const invalidProperty = {
        name: 'Test Property',
        address: 'Test Street 123',
        city: 'Berlin',
        postalCode: 'ABC', // Invalid
        purchasePrice: 100000,
        purchaseDate: '2020-01-15',
        totalArea: 100,
        unitsCount: 2,
        marketValue: 150000,
        propertyType: 'apartment' as const,
        yearBuilt: 1990,
      };

      const result = propertySchema.safeParse(invalidProperty);
      expect(result.success).toBe(false);
    });

    it('should reject negative purchase price', () => {
      const invalidProperty = {
        name: 'Test Property',
        address: 'Test Street 123',
        city: 'Berlin',
        postalCode: '12345',
        purchasePrice: -100000, // Invalid
        purchaseDate: '2020-01-15',
        totalArea: 100,
        unitsCount: 2,
        marketValue: 150000,
        propertyType: 'apartment' as const,
        yearBuilt: 1990,
      };

      const result = propertySchema.safeParse(invalidProperty);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalidProperty = {
        name: '', // Invalid
        address: 'Test Street 123',
        city: 'Berlin',
        postalCode: '12345',
        purchasePrice: 100000,
        purchaseDate: '2020-01-15',
        totalArea: 100,
        unitsCount: 2,
        marketValue: 150000,
        propertyType: 'apartment' as const,
        yearBuilt: 1990,
      };

      const result = propertySchema.safeParse(invalidProperty);
      expect(result.success).toBe(false);
    });
  });

  describe('unitSchema', () => {
    it('should validate a valid unit', () => {
      const validUnit = {
        propertyId: 'prop-1',
        unitNumber: '1A',
        floor: 1,
        area: 50,
        rooms: 2,
        baseRent: 500,
        additionalCosts: 100,
        totalRent: 600,
        status: 'rented' as const,
        description: '',
      };

      const result = unitSchema.safeParse(validUnit);
      expect(result.success).toBe(true);
    });

    it('should reject negative area', () => {
      const invalidUnit = {
        propertyId: 'prop-1',
        unitNumber: '1A',
        floor: 1,
        area: -50, // Invalid
        rooms: 2,
        baseRent: 500,
        additionalCosts: 100,
        totalRent: 600,
        status: 'rented' as const,
        description: '',
      };

      const result = unitSchema.safeParse(invalidUnit);
      expect(result.success).toBe(false);
    });
  });

  describe('tenantSchema', () => {
    it('should validate a valid tenant', () => {
      const validTenant = {
        unitId: 'unit-1',
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        phone: '+4912345678',
        street: 'Test Street 1',
        city: 'Berlin',
        postalCode: '12345',
        moveInDate: '2020-01-01',
        deposit: 1000,
        contractType: 'indefinite' as const,
        contractStartDate: '2020-01-01',
        notes: '',
      };

      const result = tenantSchema.safeParse(validTenant);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidTenant = {
        unitId: 'unit-1',
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'not-an-email', // Invalid
        phone: '+4912345678',
        street: 'Test Street 1',
        city: 'Berlin',
        postalCode: '12345',
        moveInDate: '2020-01-01',
        deposit: 1000,
        contractType: 'indefinite' as const,
        contractStartDate: '2020-01-01',
        notes: '',
      };

      const result = tenantSchema.safeParse(invalidTenant);
      expect(result.success).toBe(false);
    });
  });

  describe('transactionSchema', () => {
    it('should validate a valid income transaction', () => {
      const validTransaction = {
        propertyId: 'prop-1',
        type: 'income' as const,
        category: 'rent' as const,
        amount: 1000,
        date: '2024-01-15',
        description: 'Monthly rent',
        isRecurring: true,
        recurringInterval: 'monthly' as const,
      };

      const result = transactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const invalidTransaction = {
        propertyId: 'prop-1',
        type: 'income' as const,
        category: 'rent' as const,
        amount: -1000, // Invalid
        date: '2024-01-15',
        description: 'Monthly rent',
        isRecurring: true,
      };

      const result = transactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
    });
  });

  describe('financingSchema', () => {
    it('should validate valid financing', () => {
      const validFinancing = {
        propertyId: 'prop-1',
        bankName: 'Test Bank',
        loanNumber: 'LN12345',
        principalAmount: 100000,
        interestRate: 3.5,
        repaymentRate: 2.0,
        monthlyRate: 500,
        remainingDebt: 80000,
        startDate: '2020-01-01',
        endDate: '2050-01-01',
        notes: '',
      };

      const result = financingSchema.safeParse(validFinancing);
      expect(result.success).toBe(true);
    });
  });

  describe('paymentSchema', () => {
    it('should validate a valid payment', () => {
      const validPayment = {
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        propertyId: 'prop-1',
        expectedAmount: 500,
        receivedAmount: 500,
        expectedDate: '2024-01-03',
        status: 'paid' as const,
        paymentType: 'rent' as const,
        month: '2024-01',
        notes: '',
        reminderSent: false,
      };

      const result = paymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });
  });

  describe('taskSchema', () => {
    it('should validate a valid task', () => {
      const validTask = {
        title: 'Repair window',
        description: 'Fix broken window in unit 1A',
        dueDate: '2024-02-15',
        priority: 'medium' as const,
        status: 'pending' as const,
        category: 'maintenance' as const,
      };

      const result = taskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidTask = {
        title: '', // Invalid
        description: 'Fix broken window in unit 1A',
        dueDate: '2024-02-15',
        priority: 'medium' as const,
        status: 'pending' as const,
        category: 'maintenance' as const,
      };

      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });
  });

  describe('validateForm helper', () => {
    it('should return success for valid data', () => {
      const validTask = {
        title: 'Test task',
        description: 'Description',
        dueDate: '2024-02-15',
        priority: 'medium' as const,
        status: 'pending' as const,
        category: 'maintenance' as const,
      };

      const result = validateForm(taskSchema, validTask);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return errors for invalid data', () => {
      const invalidTask = {
        title: '',
        description: 'Description',
        dueDate: 'invalid-date',
        priority: 'medium' as const,
        status: 'pending' as const,
        category: 'maintenance' as const,
      };

      const result = validateForm(taskSchema, invalidTask);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
