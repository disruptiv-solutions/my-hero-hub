'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockGeneration } from '@/lib/mockData';
import { useCredits } from '@/lib/mockAuth';
import { Loader2, Download, RefreshCw } from 'lucide-react';

interface GeneratedImage {
  url: string;
  prompt: string;
  model: string;
}

export const GenerateForm: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('FLUX.1 Schnell');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState('');

  const models = [
    { value: 'FLUX.1 Schnell', label: 'FLUX.1 Schnell (Fast)', credits: 1 },
    { value: 'FLUX.1 Pro', label: 'FLUX.1 Pro (Quality)', credits: 2 },
    { value: 'FLUX.1 Dev', label: 'FLUX.1 Dev (Experimental)', credits: 3 }
  ];

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Photo (3:4)' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError('');
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Use credits based on selected model
      const selectedModel = models.find(m => m.value === model);
      if (selectedModel) {
        useCredits(selectedModel.credits);
      }

      const imageUrl = await mockGeneration(prompt, model);
      setGeneratedImage({
        url: imageUrl,
        prompt,
        model
      });
    } catch (err) {
      setError('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage.url;
      link.download = `ai-maven-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReuse = () => {
    if (generatedImage) {
      setPrompt(generatedImage.prompt);
      setGeneratedImage(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate New Image
          </CardTitle>
          <CardDescription>
            Describe what you want to create and watch the magic happen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Prompt
            </label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate... (e.g., 'A majestic lion in golden hour lighting with dramatic shadows')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Be specific and descriptive for better results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <Select value={model} onValueChange={setModel} placeholder="Select a model">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((modelOption) => (
                    <SelectItem key={modelOption.value} value={modelOption.value}>
                      {modelOption.label} ({modelOption.credits} credit{modelOption.credits !== 1 ? 's' : ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={setAspectRatio} placeholder="Select aspect ratio">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating... (3 seconds)
              </>
            ) : (
              'Generate Image'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Image Result */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generation Complete!
            </CardTitle>
            <CardDescription>
              Your AI image has been generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <img
                src={generatedImage.url}
                alt={generatedImage.prompt}
                className="w-full max-w-lg mx-auto rounded-lg shadow-lg"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Prompt:</p>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {generatedImage.prompt}
              </p>
              <p className="text-sm font-medium">Model: {generatedImage.model}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleReuse} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reuse Prompt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
