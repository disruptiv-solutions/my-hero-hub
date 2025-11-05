export interface GalleryImage {
  id: string;
  image: string;
  prompt: string;
  model: string;
  date: string;
  creditsUsed?: number;
}

export const mockGallery: GalleryImage[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    prompt: 'A majestic lion in golden hour lighting',
    model: 'FLUX.1 Schnell',
    date: '2 hours ago',
    creditsUsed: 1
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop',
    prompt: 'Futuristic cityscape at night with neon lights',
    model: 'FLUX.1 Schnell',
    date: '4 hours ago',
    creditsUsed: 1
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop',
    prompt: 'Abstract geometric patterns in vibrant colors',
    model: 'FLUX.1 Pro',
    date: '1 day ago',
    creditsUsed: 2
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    prompt: 'Portrait of a woman in golden hour',
    model: 'FLUX.1 Schnell',
    date: '2 days ago',
    creditsUsed: 1
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=400&fit=crop',
    prompt: 'Underwater coral reef with tropical fish',
    model: 'FLUX.1 Pro',
    date: '3 days ago',
    creditsUsed: 2
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=400&fit=crop',
    prompt: 'Steampunk robot in Victorian era setting',
    model: 'FLUX.1 Schnell',
    date: '4 days ago',
    creditsUsed: 1
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop',
    prompt: 'Cherry blossoms in a Japanese garden',
    model: 'FLUX.1 Pro',
    date: '5 days ago',
    creditsUsed: 2
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
    prompt: 'Dragon flying over medieval castle',
    model: 'FLUX.1 Schnell',
    date: '6 days ago',
    creditsUsed: 1
  }
];

export const mockGeneration = async (prompt: string, model: string): Promise<string> => {
  // Show loading for 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Return random image from array
  const mockImages = [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=512&h=512&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=512&h=512&fit=crop'
  ];

  return mockImages[Math.floor(Math.random() * mockImages.length)];
};
