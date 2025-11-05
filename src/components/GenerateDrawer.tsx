'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { PromptInput } from '@/components/PromptInput';
import { Settings, Palette, Zap, Download, Sparkles } from 'lucide-react';

export const GenerateDrawer: React.FC = () => {
  const [prompt, setPrompt] = React.useState('');
  const [style, setStyle] = React.useState('realistic');
  const [quality, setQuality] = React.useState([75]);
  const [seed, setSeed] = React.useState('');
  const [aspectRatio, setAspectRatio] = React.useState('1:1');
  const [activeMode, setActiveMode] = React.useState<'custom' | 'preset'>('custom');
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>(null);

  const models = [
    { value: 'flux-schnell', label: 'FLUX.1 Schnell', credits: 1 },
    { value: 'flux-pro', label: 'FLUX.1 Pro', credits: 2 },
    { value: 'flux-dev', label: 'FLUX.1 Dev', credits: 3 },
  ];

  const presetStyles = [
    { id: 'professional-portrait', name: 'Professional Portrait', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
    { id: 'casual', name: 'Casual', thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
    { id: 'park-outdoor', name: 'Out at a Park', thumbnail: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
    { id: 'business-casual', name: 'Business Casual', thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face' },
    { id: 'creative-artist', name: 'Creative Artist', thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
    { id: 'studio-lighting', name: 'Studio Lighting', thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
    { id: 'natural-outdoor', name: 'Natural Outdoor', thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
    { id: 'formal-event', name: 'Formal Event', thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
    { id: 'tech-startup', name: 'Tech Startup', thumbnail: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face' },
    { id: 'healthcare', name: 'Healthcare Professional', thumbnail: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face' },
    { id: 'academic', name: 'Academic', thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face' },
    { id: 'creative-freelancer', name: 'Creative Freelancer', thumbnail: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face' },
  ];

  const handleGenerate = () => {
    // Handle generation logic here
    console.log('Generating image with:', { prompt, style, quality, seed, aspectRatio, activeMode });
  };

  const handlePromptSubmit = (newPrompt: string) => {
    setPrompt(newPrompt);
    // Auto-trigger generation or show in form
    console.log('New prompt submitted:', newPrompt);
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Fixed Toggle Buttons */}
      <div className="px-4 py-4 border-b bg-transparent flex-shrink-0">
        <div className="flex gap-2">
          <Button
            variant={activeMode === 'custom' ? 'default' : 'outline'}
            className="w-1/2"
            onClick={() => setActiveMode('custom')}
          >
            Custom
          </Button>
          <Button
            variant={activeMode === 'preset' ? 'default' : 'outline'}
            className="w-1/2"
            onClick={() => setActiveMode('preset')}
          >
            Preset
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-6 py-4">
          {/* Preset Mode Content */}
          {activeMode === 'preset' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5" />
                  Choose a Style
                </CardTitle>
                <CardDescription>
                  Select a preset style for your professional headshot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {presetStyles.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`relative p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                        selectedPreset === preset.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30'
                      }`}
                    >
                      <div className="aspect-square rounded-md overflow-hidden mb-2">
                        <img
                          src={preset.thumbnail}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm font-medium text-center">{preset.name}</p>
                      {selectedPreset === preset.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {selectedPreset && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      onClick={handleGenerate} 
                      className="w-full" 
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate {presetStyles.find(p => p.id === selectedPreset)?.name}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom Mode Content */}
          {activeMode === 'custom' && (
            <>
              {/* Main Generation Form */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5" />
                Generate Image
              </CardTitle>
              <CardDescription>
                Create stunning AI images with advanced controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={style} onValueChange={setStyle} placeholder="Select a model">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label} ({model.credits} credit{model.credits !== 1 ? 's' : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aspect">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio} placeholder="Select aspect ratio">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                      <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                      <SelectItem value="4:3">Standard (4:3)</SelectItem>
                      <SelectItem value="3:4">Tall (3:4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full" size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Fine-tune your image generation parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="style">Art Style</Label>
                <Select value={style} onValueChange={setStyle} placeholder="Select style">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">Quality: {quality[0]}%</Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seed">Seed (optional)</Label>
                <Input
                  id="seed"
                  placeholder="Random seed for reproducibility"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="w-5 h-5" />
                Color Palette
              </CardTitle>
              <CardDescription>
                Choose your preferred color scheme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {['Warm', 'Cool', 'Neutral', 'Vibrant', 'Monochrome', 'Custom'].map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Model Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5" />
                Model Configuration
              </CardTitle>
              <CardDescription>
                Advanced model parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guidance">Guidance Scale</Label>
                <Slider
                  defaultValue={[7.5]}
                  max={20}
                  min={1}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher values follow the prompt more closely
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="steps">Inference Steps</Label>
                <Slider
                  defaultValue={[20]}
                  max={50}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  More steps = better quality, slower generation
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="font-medium">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Save as Template
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Reset to Defaults
              </Button>
            </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0">
        <PromptInput 
          onSubmit={handlePromptSubmit}
          placeholder="What do you want to generate..."
        />
      </div>
    </div>
  );
};