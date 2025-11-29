import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  CardSkeleton,
  TableRowSkeleton,
  ListItemSkeleton,
  StatsSkeleton,
  PageHeaderSkeleton,
} from './loading-skeleton';

describe('Loading Skeleton Components', () => {
  describe('CardSkeleton', () => {
    it('should render with correct structure', () => {
      const { container } = render(<CardSkeleton />);
      
      // Should render a card with header and content
      const card = container.querySelector('[class*="overflow-hidden"]');
      expect(card).toBeInTheDocument();
      
      // Should have skeleton elements
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should apply custom className when provided', () => {
      const { container } = render(<CardSkeleton className="custom-class" />);
      
      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('TableRowSkeleton', () => {
    it('should render with default 4 columns', () => {
      const { container } = render(<TableRowSkeleton />);
      
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons).toHaveLength(4);
    });

    it('should render with specified column count', () => {
      const { container } = render(<TableRowSkeleton columns={6} />);
      
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons).toHaveLength(6);
    });

    it('should apply custom className when provided', () => {
      const { container } = render(<TableRowSkeleton className="custom-row" />);
      
      const row = container.querySelector('.custom-row');
      expect(row).toBeInTheDocument();
    });
  });

  describe('ListItemSkeleton', () => {
    it('should render with correct structure', () => {
      const { container } = render(<ListItemSkeleton />);
      
      // Should have a circular skeleton (avatar)
      const circularSkeleton = container.querySelector('[class*="rounded-full"]');
      expect(circularSkeleton).toBeInTheDocument();
      
      // Should have multiple skeleton elements
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(1);
    });

    it('should apply custom className when provided', () => {
      const { container } = render(<ListItemSkeleton className="custom-item" />);
      
      const item = container.querySelector('.custom-item');
      expect(item).toBeInTheDocument();
    });
  });

  describe('StatsSkeleton', () => {
    it('should render with correct structure', () => {
      const { container } = render(<StatsSkeleton />);
      
      // Should have a rounded skeleton (icon)
      const roundedSkeleton = container.querySelector('[class*="rounded-lg"]');
      expect(roundedSkeleton).toBeInTheDocument();
      
      // Should have multiple skeleton elements
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(1);
    });

    it('should apply custom className when provided', () => {
      const { container } = render(<StatsSkeleton className="custom-stats" />);
      
      const stats = container.querySelector('.custom-stats');
      expect(stats).toBeInTheDocument();
    });
  });

  describe('PageHeaderSkeleton', () => {
    it('should render with correct structure', () => {
      const { container } = render(<PageHeaderSkeleton />);
      
      // Should have multiple skeleton elements (title, description, button)
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('should apply custom className when provided', () => {
      const { container } = render(<PageHeaderSkeleton className="custom-header" />);
      
      const header = container.querySelector('.custom-header');
      expect(header).toBeInTheDocument();
    });
  });
});

