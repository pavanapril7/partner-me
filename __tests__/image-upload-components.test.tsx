import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploadInput } from '../src/components/admin/ImageUploadInput';
import { ImageUploadProgress } from '../src/components/admin/ImageUploadProgress';
import { ImagePreviewList } from '../src/components/admin/ImagePreviewList';

describe('ImageUploadInput Component', () => {
  it('should render upload zone with instructions', () => {
    const mockOnFilesSelected = jest.fn();
    render(<ImageUploadInput onFilesSelected={mockOnFilesSelected} />);
    
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('should display file type and size constraints', () => {
    const mockOnFilesSelected = jest.fn();
    render(<ImageUploadInput onFilesSelected={mockOnFilesSelected} />);
    
    expect(screen.getByText(/JPEG, PNG, WebP, or GIF/i)).toBeInTheDocument();
    expect(screen.getByText(/max 5MB/i)).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnFilesSelected = jest.fn();
    render(<ImageUploadInput onFilesSelected={mockOnFilesSelected} disabled />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDisabled();
  });

  it('should accept multiple files', () => {
    const mockOnFilesSelected = jest.fn();
    render(<ImageUploadInput onFilesSelected={mockOnFilesSelected} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('multiple');
  });
});

describe('ImageUploadProgress Component', () => {
  it('should render nothing when no uploads', () => {
    const { container } = render(<ImageUploadProgress uploads={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display uploading file with progress', () => {
    const uploads = [
      {
        id: '1',
        fileName: 'test.jpg',
        fileSize: 1024000,
        status: 'uploading' as const,
        progress: 50,
      },
    ];
    
    render(<ImageUploadProgress uploads={uploads} />);
    
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should display success indicator for completed upload', () => {
    const uploads = [
      {
        id: '1',
        fileName: 'test.jpg',
        fileSize: 1024000,
        status: 'success' as const,
        progress: 100,
      },
    ];
    
    render(<ImageUploadProgress uploads={uploads} />);
    
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('should display error message for failed upload', () => {
    const uploads = [
      {
        id: '1',
        fileName: 'test.jpg',
        fileSize: 1024000,
        status: 'error' as const,
        progress: 0,
        error: 'Upload failed',
      },
    ];
    
    render(<ImageUploadProgress uploads={uploads} />);
    
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('should show retry button for failed uploads', () => {
    const mockOnRetry = jest.fn();
    const uploads = [
      {
        id: '1',
        fileName: 'test.jpg',
        fileSize: 1024000,
        status: 'error' as const,
        progress: 0,
        error: 'Upload failed',
      },
    ];
    
    render(<ImageUploadProgress uploads={uploads} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledWith('1');
  });

  it('should format file sizes correctly', () => {
    const uploads = [
      {
        id: '1',
        fileName: 'test.jpg',
        fileSize: 1024,
        status: 'uploading' as const,
        progress: 50,
      },
    ];
    
    render(<ImageUploadProgress uploads={uploads} />);
    
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });
});

describe('ImagePreviewList Component', () => {
  const mockImages = [
    {
      id: '1',
      url: '/test1.jpg',
      thumbnailUrl: '/test1-thumb.jpg',
      filename: 'test1.jpg',
      order: 0,
    },
    {
      id: '2',
      url: '/test2.jpg',
      thumbnailUrl: '/test2-thumb.jpg',
      filename: 'test2.jpg',
      order: 1,
    },
  ];

  it('should render nothing when no images', () => {
    const mockOnReorder = jest.fn();
    const mockOnDelete = jest.fn();
    const { container } = render(
      <ImagePreviewList images={[]} onReorder={mockOnReorder} onDelete={mockOnDelete} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should display all images', () => {
    const mockOnReorder = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <ImagePreviewList images={mockImages} onReorder={mockOnReorder} onDelete={mockOnDelete} />
    );
    
    expect(screen.getByText('2 images uploaded • Drag to reorder')).toBeInTheDocument();
  });

  it('should mark first image as primary', () => {
    const mockOnReorder = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <ImagePreviewList images={mockImages} onReorder={mockOnReorder} onDelete={mockOnDelete} />
    );
    
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked and confirmed', async () => {
    const mockOnReorder = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <ImagePreviewList images={mockImages} onReorder={mockOnReorder} onDelete={mockOnDelete} />
    );
    
    // Click the delete button to open the confirmation dialog
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    // Wait for the confirmation dialog to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Image')).toBeInTheDocument();
    });
    
    // Find and click the confirm delete button in the dialog footer
    const dialogButtons = screen.getAllByRole('button', { name: /delete/i });
    // The last delete button should be the one in the dialog
    const confirmButton = dialogButtons[dialogButtons.length - 1];
    fireEvent.click(confirmButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('should not show delete buttons in read-only mode', () => {
    const mockOnReorder = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <ImagePreviewList 
        images={mockImages} 
        onReorder={mockOnReorder} 
        onDelete={mockOnDelete}
        readOnly
      />
    );
    
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.getByText('2 images uploaded')).toBeInTheDocument();
  });

  it('should sort images by order property', () => {
    const unorderedImages = [
      { ...mockImages[1], order: 0 },
      { ...mockImages[0], order: 1 },
    ];
    
    const mockOnReorder = jest.fn();
    const mockOnDelete = jest.fn();
    
    render(
      <ImagePreviewList images={unorderedImages} onReorder={mockOnReorder} onDelete={mockOnDelete} />
    );
    
    // The first image in the DOM should be the one with order: 0
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('alt', 'test2.jpg');
  });
});
