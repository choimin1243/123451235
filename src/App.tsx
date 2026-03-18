/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Download, Loader2, Image as ImageIcon, Send, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini AI
// Note: process.env.GEMINI_API_KEY is automatically injected by the platform
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const model = "gemini-2.5-flash-image";
      const response = await genAI.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setCurrentImage(imageUrl);
        const newImage: GeneratedImage = {
          id: Math.random().toString(36).substring(7),
          url: imageUrl,
          prompt: prompt,
          timestamp: Date.now(),
        };
        setHistory(prev => [newImage, ...prev]);
      } else {
        throw new Error("No image was generated. Please try a different prompt.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.slice(0, 20)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Visionary AI</h1>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-zinc-400">
            <span>Powered by Gemini 2.5</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generator */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              Create New Image
            </h2>
            <form onSubmit={generateImage} className="space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic city with neon lights and flying cars, digital art style..."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-zinc-500">
                  {prompt.length} characters
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Generate Image
                  </>
                )}
              </button>
            </form>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </section>

          {/* Preview Area */}
          <section className="aspect-square w-full bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden relative group">
            <AnimatePresence mode="wait">
              {currentImage ? (
                <motion.div
                  key={currentImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <img 
                    src={currentImage} 
                    alt="Generated" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => downloadImage(currentImage, prompt)}
                      className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl"
                      title="Download Image"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                  <p className="text-sm">Your masterpiece will appear here</p>
                </div>
              )}
            </AnimatePresence>
            
            {isGenerating && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                  <p className="text-emerald-500 font-medium animate-pulse">Dreaming...</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 h-[calc(100vh-160px)] flex flex-col shadow-xl">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2 shrink-0">
              <History className="w-5 h-5 text-emerald-400" />
              Recent Creations
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center px-4">
                  <p className="text-sm">No history yet. Start creating to see your past works here.</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.id}
                    className="bg-black/40 border border-white/5 rounded-xl p-3 flex gap-4 group cursor-pointer hover:border-emerald-500/30 transition-colors"
                    onClick={() => setCurrentImage(item.url)}
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <img 
                        src={item.url} 
                        alt={item.prompt} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <p className="text-sm text-zinc-300 line-clamp-2 italic">
                        "{item.prompt}"
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(item.url, item.prompt);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-emerald-400 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.3);
        }
      `}} />
    </div>
  );
}
