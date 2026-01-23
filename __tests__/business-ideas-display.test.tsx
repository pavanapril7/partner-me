import React from 'react';
import { render, screen } from '@testing-library/react';
import { BusinessIdeasList } from '@/components/business-ideas/BusinessIdeasList';
import { BusinessIdeaDetail } from '@/components/business-ideas/BusinessIdeaDetail';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Business Ideas Display Components', () => {
  describe('BusinessIdeasList', () => {
    it('should render with uploaded images', () => {
      const businessIdeas = [
        {
          id: '1',
          title: 'Test Business Idea',
          description: 'Test description',
          images: [],
          uploadedImages: [
            {
              id: 'img1',
              filename: 'test.jpg',
              order: 0,
              variants: [
                {
                  id: 'var1',
                  variant: 'THUMBNAIL' as const,
                  storagePath: 'path/to/thumbnail',
                  width: 300,
                  height: 300,
                  size: 10000,
                },
              ],
            },
          ],
          budgetMin: 10000,
          budgetMax: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(<BusinessIdeasList businessIdeas={businessIdeas} />);
      
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
      const image = screen.getByAltText('Test Business Idea');
      expect(image).toHaveAttribute('src', '/api/images/img1?variant=thumbnail');
    });

    it('should render with legacy images array', () => {
      const businessIdeas = [
        {
          id: '1',
          title: 'Legacy Business Idea',
          description: 'Test description',
          images: ['https://example.com/image.jpg'],
          budgetMin: 10000,
          budgetMax: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(<BusinessIdeasList businessIdeas={businessIdeas} />);
      
      expect(screen.getByText('Legacy Business Idea')).toBeInTheDocument();
      const image = screen.getByAltText('Legacy Business Idea');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should render placeholder when no images', () => {
      const businessIdeas = [
        {
          id: '1',
          title: 'No Image Business Idea',
          description: 'Test description',
          images: [],
          budgetMin: 10000,
          budgetMax: 50000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(<BusinessIdeasList businessIdeas={businessIdeas} />);
      
      expect(screen.getByText('No Image Business Idea')).toBeInTheDocument();
      const placeholder = screen.getByAltText('No image available');
      expect(placeholder).toHaveAttribute('src', '/placeholder-image.svg');
    });

    it('should render empty state when no business ideas', () => {
      render(<BusinessIdeasList businessIdeas={[]} />);
      
      expect(screen.getByText('No business ideas available at the moment.')).toBeInTheDocument();
    });
  });

  describe('BusinessIdeaDetail', () => {
    it('should render with uploaded images', () => {
      const businessIdea = {
        id: '1',
        title: 'Test Business Idea',
        description: '<p>Test description</p>',
        images: [],
        uploadedImages: [
          {
            id: 'img1',
            filename: 'test.jpg',
            order: 0,
            variants: [
              {
                id: 'var1',
                variant: 'THUMBNAIL' as const,
                storagePath: 'path/to/thumbnail',
                width: 300,
                height: 300,
                size: 10000,
              },
              {
                id: 'var2',
                variant: 'MEDIUM' as const,
                storagePath: 'path/to/medium',
                width: 800,
                height: 800,
                size: 50000,
              },
            ],
          },
        ],
        budgetMin: 10000,
        budgetMax: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<BusinessIdeaDetail businessIdea={businessIdea} />);
      
      expect(screen.getByText('Test Business Idea')).toBeInTheDocument();
      expect(screen.getByText('Partner Me')).toBeInTheDocument();
      const image = screen.getByAltText('Test Business Idea - Image 1');
      expect(image).toHaveAttribute('src', '/api/images/img1?variant=medium');
    });

    it('should render with legacy images array', () => {
      const businessIdea = {
        id: '1',
        title: 'Legacy Business Idea',
        description: '<p>Test description</p>',
        images: ['https://example.com/image.jpg'],
        budgetMin: 10000,
        budgetMax: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<BusinessIdeaDetail businessIdea={businessIdea} />);
      
      expect(screen.getByText('Legacy Business Idea')).toBeInTheDocument();
      const image = screen.getByAltText('Legacy Business Idea - Image 1');
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should render without images', () => {
      const businessIdea = {
        id: '1',
        title: 'No Image Business Idea',
        description: '<p>Test description</p>',
        images: [],
        budgetMin: 10000,
        budgetMax: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<BusinessIdeaDetail businessIdea={businessIdea} />);
      
      expect(screen.getByText('No Image Business Idea')).toBeInTheDocument();
      expect(screen.getByText('Partner Me')).toBeInTheDocument();
      // Should not render image gallery when no images
      expect(screen.queryByAltText(/Image 1/)).not.toBeInTheDocument();
    });

    it('should display budget range correctly', () => {
      const businessIdea = {
        id: '1',
        title: 'Test Business Idea',
        description: '<p>Test description</p>',
        images: [],
        budgetMin: 10000,
        budgetMax: 50000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<BusinessIdeaDetail businessIdea={businessIdea} />);
      
      expect(screen.getByText('Investment Range')).toBeInTheDocument();
      expect(screen.getByText('$10,000')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });
  });
});
