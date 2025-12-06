/**
 * Types Tests
 * Tests for type exports and type guards
 */

import { describe, it, expect } from 'vitest';
import * as types from '../index';
import { ORG_ROLES, type OrgRole } from '../roles';
import type { 
  PaginationParams, 
  FindAllOptions, 
  PaginatedResponse,
  CursorPaginatedResponse 
} from '../pagination';
import type {
  BaseOrganization,
  OrganizationWithRole,
  CreateOrganizationInput,
} from '../organization';

describe('Types', () => {
  describe('Module exports', () => {
    it('should export all type modules', () => {
      expect(types).toBeDefined();
      expect(typeof types).toBe('object');
    });

    it('should export ORG_ROLES constant', () => {
      expect(types.ORG_ROLES).toBeDefined();
      expect(types.ORG_ROLES).toEqual(ORG_ROLES);
    });
  });

  describe('ORG_ROLES', () => {
    it('should have OWNER and MEMBER roles', () => {
      expect(ORG_ROLES.OWNER).toBe('OWNER');
      expect(ORG_ROLES.MEMBER).toBe('MEMBER');
    });

    it('should be an object', () => {
      expect(typeof ORG_ROLES).toBe('object');
      expect(ORG_ROLES).not.toBeNull();
    });

    it('should only have two roles', () => {
      expect(Object.keys(ORG_ROLES)).toHaveLength(2);
    });
  });

  describe('OrgRole type', () => {
    it('should accept valid role values', () => {
      const ownerRole: OrgRole = ORG_ROLES.OWNER;
      const memberRole: OrgRole = ORG_ROLES.MEMBER;

      expect(ownerRole).toBe('OWNER');
      expect(memberRole).toBe('MEMBER');
    });
  });

  describe('Pagination types', () => {
    it('should define PaginationParams interface', () => {
      const params: PaginationParams = {
        page: 1,
        limit: 10,
      };

      expect(params.page).toBe(1);
      expect(params.limit).toBe(10);
    });

    it('should allow optional pagination params', () => {
      const params: PaginationParams = {};
      
      expect(params).toBeDefined();
    });

    it('should define FindAllOptions interface', () => {
      const options: FindAllOptions = {
        search: 'test',
        page: 1,
        limit: 20,
      };

      expect(options.search).toBe('test');
      expect(options.page).toBe(1);
      expect(options.limit).toBe(20);
    });

    it('should define PaginatedResponse interface', () => {
      const response: PaginatedResponse<string> = {
        items: ['item1', 'item2'],
        total: 2,
        page: 1,
        limit: 10,
        hasMore: false,
      };

      expect(response.items).toHaveLength(2);
      expect(response.total).toBe(2);
    });

    it('should define CursorPaginatedResponse interface', () => {
      const response: CursorPaginatedResponse<number> = {
        data: [1, 2, 3],
        nextCursor: 'cursor-123',
        hasMore: true,
      };

      expect(response.data).toHaveLength(3);
      expect(response.nextCursor).toBe('cursor-123');
      expect(response.hasMore).toBe(true);
    });
  });

  describe('Organization types', () => {
    it('should define BaseOrganization interface', () => {
      const org: BaseOrganization = {
        id: '123',
        name: 'Test Org',
        logo: null,
        timezone: 'UTC',
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(org.id).toBe('123');
      expect(org.name).toBe('Test Org');
    });

    it('should define OrganizationWithRole interface', () => {
      const org: OrganizationWithRole = {
        id: '123',
        name: 'Test Org',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        role: ORG_ROLES.OWNER,
        memberCount: 5,
        effectivePermissions: ['read', 'write'],
      };

      expect(org.role).toBe('OWNER');
      expect(org.memberCount).toBe(5);
    });

    it('should define CreateOrganizationInput interface', () => {
      const input: CreateOrganizationInput = {
        name: 'New Org',
      };

      expect(input.name).toBe('New Org');
    });
  });
});

