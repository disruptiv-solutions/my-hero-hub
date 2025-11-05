'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockGallery, GalleryImage } from '@/lib/mockData';
import { ImageModal } from './ImageModal';
import { Download, RefreshCw, Eye, Calendar, Zap } from 'lucide-react';

interface ImageCardProps {
  image: GalleryImage;
  onView: (image: GalleryImage) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onView }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.image;
    link.download = `ai-maven-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReuse = () => {
    // In a real app, this would copy the prompt to the generate form
    navigator.clipboard.writeText(image.prompt);
    // Show toast notification
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={image.image}
            alt={image.prompt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onView(image)}
              className="mr-2"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </div>
        </div>

        <div className="p-4">
          <p className="text-sm font-medium line-clamp-2 mb-2">
            {image.prompt}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {image.model}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {image.date}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReuse}
              className="flex-1"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reuse
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ImageGrid: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [images, setImages] = useState<GalleryImage[]>(mockGallery);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onView={setSelectedImage}
          />
        ))}
      </div>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};
