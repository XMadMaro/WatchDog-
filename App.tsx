import React, { useState, useRef } from 'react';
import { Icons } from './components/ui/Icons';
import { AppState, SocialPost, ScandalStrategy, GroundingChunk } from './types';
import { simulateScraping, getContextualData, generateScandalCampaign, analyzeCityImage } from './services/gemini';
import { ProcessingStep } from './components/ProcessingStep';
import { GroundingView } from './components/GroundingView';
import { ScandalResult } from './components/ScandalResult';
import { SentimentChart } from './components/SentimentChart';

export default function App() {
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('Warszawa');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Image State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data State
  const [scrapedPosts, setScrapedPosts] = useState<SocialPost[]>([]);
  const [mapText, setMapText] = useState('');
  const [mapChunks, setMapChunks] = useState<GroundingChunk[]>([]);
  const [imageAnalysisText, setImageAnalysisText] = useState('');
  const [strategy, setStrategy] = useState<ScandalStrategy | null>(null);

  // Filter State
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'negative' | 'neutral' | 'positive'>('all');
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'twitter' | 'facebook' | 'instagram'>('all');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data url prefix for Gemini API if using raw parts, 
          // but for @google/genai inlineData we generally send base64 data. 
          // The inlineData.data expects base64 encoded string.
          // result format is "data:image/jpeg;base64,....."
          const base64 = reader.result.split(',')[1]; 
          resolve(base64);
        } else {
            reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic && !selectedImage) return;

    setAppState(AppState.SCRAPING);
    setScrapedPosts([]);
    setMapChunks([]);
    setStrategy(null);
    setImageAnalysisText('');
    setFilterSentiment('all');
    setFilterPlatform('all');

    // Use image description as topic if topic is empty
    let effectiveTopic = topic;

    try {
      // Step 0: Image Analysis (if present)
      let analysisResult = '';
      if (selectedImage) {
        setAppState(AppState.ANALYZING_IMAGE);
        const base64 = await getBase64(selectedImage);
        analysisResult = await analyzeCityImage(base64);
        setImageAnalysisText(analysisResult);
        if (!effectiveTopic) {
            effectiveTopic = "Zgłoszenie problemu miejskiego na podstawie zdjęcia";
        }
      }

      // Step 1: Simulate Scraping (Gemini Flash-Lite)
      setAppState(AppState.SCRAPING);
      const posts = await simulateScraping(effectiveTopic, location);
      setScrapedPosts(posts);
      
      // Step 2: Maps Context (Gemini Flash + Maps)
      setAppState(AppState.ANALYZING_MAP);
      const { text, chunks } = await getContextualData(`${effectiveTopic} w ${location}`);
      setMapText(text);
      setMapChunks(chunks);
      
      // Step 3: Thinking Strategy (Gemini Pro Thinking)
      setAppState(AppState.GENERATING);
      const generatedStrategy = await generateScandalCampaign(effectiveTopic, posts, text, analysisResult);
      setStrategy(generatedStrategy);
      
      setAppState(AppState.FINISHED);

    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  // Filter Logic
  const filteredPosts = scrapedPosts.filter(post => {
    const matchesSentiment = filterSentiment === 'all' || post.sentiment === filterSentiment;
    const matchesPlatform = filterPlatform === 'all' || post.platform === filterPlatform;
    return matchesSentiment && matchesPlatform;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-red-500/30 selection:text-red-200">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 mb-6 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            System Monitorowania Nastrojów Społecznych
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
            WATCHDOG <span className="text-red-600">AI</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Wgraj zdjęcie dziury w drodze lub śmieci, a AI zrobi z tego aferę, wygeneruje skargi do urzędu i posty do social mediów.
          </p>
        </header>

        {/* Input Section - Only visible if not finished */}
        {appState !== AppState.FINISHED && (
          <div className="bg-slate-900/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-700 shadow-2xl mb-12">
            <form onSubmit={handleStart} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Topic Input */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Temat Zgłoszenia (Opcjonalne)</label>
                  <div className="relative group">
                    <Icons.Alert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="np. Dziura w asfalcie"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium"
                      disabled={appState !== AppState.IDLE}
                    />
                  </div>
                </div>

                {/* Location Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Lokalizacja</label>
                  <div className="relative group">
                    <Icons.Map className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Miasto"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                      disabled={appState !== AppState.IDLE}
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Area */}
              <div 
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${selectedImage ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-950'}`}
              >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    disabled={appState !== AppState.IDLE}
                  />
                  
                  {imagePreview ? (
                      <div className="flex items-center gap-6">
                          <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg shadow-lg border border-slate-600" />
                          <div className="flex-1">
                              <div className="text-green-400 font-bold flex items-center gap-2 mb-1">
                                  <Icons.Check className="w-5 h-5" /> Zdjęcie dodane
                              </div>
                              <p className="text-slate-500 text-sm mb-2">{selectedImage?.name}</p>
                              <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs font-bold uppercase text-slate-400 hover:text-white"
                                disabled={appState !== AppState.IDLE}
                              >
                                  Zmień zdjęcie
                              </button>
                          </div>
                      </div>
                  ) : (
                    <div 
                        onClick={() => appState === AppState.IDLE && fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center gap-3 cursor-pointer ${appState !== AppState.IDLE ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="p-3 bg-slate-900 rounded-full border border-slate-800">
                            <Icons.Camera className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-300">Dodaj zdjęcie problemu (Opcjonalne)</p>
                            <p className="text-xs text-slate-500 mt-1">AI zdiagnozuje problem i dołączy dowody do skargi</p>
                        </div>
                    </div>
                  )}
              </div>

              {appState === AppState.IDLE ? (
                <button
                  type="submit"
                  disabled={!topic && !selectedImage}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black uppercase tracking-widest py-5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 flex items-center justify-center gap-3 text-lg"
                >
                  <Icons.Siren className="w-6 h-6 animate-pulse" />
                  Uruchom Protokół Eskalacji
                </button>
              ) : (
                 /* Progress Indicators */
                <div className="space-y-3 pt-2">
                   {selectedImage && (
                    <ProcessingStep 
                        status={appState === AppState.ANALYZING_IMAGE ? 'active' : appState > AppState.ANALYZING_IMAGE ? 'completed' : 'pending'}
                        label="Analiza Wizualna Dowodów (Gemini Vision)"
                        icon={Icons.Image}
                    />
                   )}
                  <ProcessingStep 
                    status={appState === AppState.SCRAPING ? 'active' : appState > AppState.SCRAPING ? 'completed' : 'pending'}
                    label="Skrapowanie Mediów Społecznościowych"
                    icon={Icons.Search}
                  />
                  <ProcessingStep 
                    status={appState === AppState.ANALYZING_MAP ? 'active' : appState > AppState.ANALYZING_MAP ? 'completed' : 'pending'}
                    label="Weryfikacja Geoprzestrzenna"
                    icon={Icons.Map}
                  />
                  <ProcessingStep 
                    status={appState === AppState.GENERATING ? 'active' : appState > AppState.GENERATING ? 'completed' : 'pending'}
                    label="Generowanie Skarg i Strategii (Deep Thinking)"
                    icon={Icons.Fast}
                  />
                </div>
              )}
            </form>
          </div>
        )}

        {/* Live Processing Data View (Before Finished) */}
        {appState > AppState.IDLE && appState < AppState.FINISHED && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
             {/* Simulated Posts Feed */}
             <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl max-h-[300px] overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 sticky top-0 bg-slate-900/90 backdrop-blur pb-2">
                   Log Analizy
                </h3>
                <div className="space-y-4">
                    {imageAnalysisText && (
                        <div className="bg-green-900/20 border border-green-900/30 p-3 rounded text-sm text-green-300">
                            <div className="font-bold text-xs uppercase mb-1 opacity-70">Wykryto na zdjęciu:</div>
                            {imageAnalysisText}
                        </div>
                    )}
                    {scrapedPosts.map((post, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-300">@{post.author}</span>
                        </div>
                        <p className="text-slate-400 text-xs">"{post.content}"</p>
                      </div>
                    ))}
                    {scrapedPosts.length === 0 && !imageAnalysisText && (
                        <div className="text-center py-8 text-slate-600 italic flex flex-col items-center gap-2">
                            <Icons.Loader className="w-5 h-5 animate-spin" />
                            Przetwarzanie danych...
                        </div>
                    )}
                </div>
             </div>

             {/* Map Data Feed */}
             <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl max-h-[300px] overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 sticky top-0 bg-slate-900/90 backdrop-blur pb-2">
                   Dane Lokalizacyjne
                </h3>
                {mapChunks.length === 0 && appState <= AppState.ANALYZING_MAP ? (
                   <div className="text-center py-8 text-slate-600 italic">Oczekiwanie na analizę terenu...</div>
                ) : (
                   <div className="space-y-2">
                      <p className="text-xs text-slate-400 mb-2 leading-relaxed">{mapText}</p>
                      {mapChunks.map((chunk, i) => (
                        chunk.maps?.uri && (
                          <div key={i} className="flex items-center gap-2 text-xs text-blue-400 bg-blue-900/10 p-2 rounded border border-blue-900/20">
                            <Icons.Map className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{chunk.maps.title}</span>
                          </div>
                        )
                      ))}
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Final Result */}
        {appState === AppState.FINISHED && strategy && (
          <div className="space-y-8">
            <ScandalResult 
              strategy={strategy} 
              onReset={() => setAppState(AppState.IDLE)} 
            />
            
            {/* Context Data Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-800">
               <div className="space-y-6">
                   <GroundingView text={mapText} chunks={mapChunks} />
                   {imagePreview && (
                       <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                            <div className="flex items-center gap-2 mb-3 text-green-400">
                                <Icons.Image className="w-5 h-5" />
                                <h3 className="font-semibold text-sm uppercase tracking-widest">Analiza Dowodu</h3>
                            </div>
                            <div className="flex gap-4">
                                <img src={imagePreview} alt="Evidence" className="w-20 h-20 object-cover rounded border border-slate-600" />
                                <p className="text-sm text-slate-300">{imageAnalysisText}</p>
                            </div>
                       </div>
                   )}
               </div>

               <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                  <h3 className="font-semibold text-sm uppercase tracking-widest text-slate-500 mb-4">Dowody Społeczne (Źródła)</h3>
                  
                  <SentimentChart posts={scrapedPosts} />

                  {/* Filters */}
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 space-y-2">
                    {/* Platform Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase text-slate-500 font-bold min-w-[60px]">Platforma:</span>
                        <div className="flex flex-wrap gap-1">
                            {[
                                { id: 'all', label: 'Wszystkie' }, 
                                { id: 'twitter', label: 'Twitter' }, 
                                { id: 'facebook', label: 'Facebook' }, 
                                { id: 'instagram', label: 'Instagram' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilterPlatform(f.id as any)}
                                    className={`text-[10px] uppercase px-2 py-1 rounded border transition-all ${
                                        filterPlatform === f.id 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Sentiment Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase text-slate-500 font-bold min-w-[60px]">Sentyment:</span>
                        <div className="flex flex-wrap gap-1">
                             {[
                                { id: 'all', label: 'Wszystkie' }, 
                                { id: 'negative', label: 'Negatywne' }, 
                                { id: 'neutral', label: 'Neutralne' }, 
                                { id: 'positive', label: 'Pozytywne' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilterSentiment(f.id as any)}
                                    className={`text-[10px] uppercase px-2 py-1 rounded border transition-all ${
                                        filterSentiment === f.id 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                     {filteredPosts.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-sm italic">Brak wpisów spełniających kryteria.</div>
                     ) : (
                         filteredPosts.map((post) => (
                           <div key={post.id} className="text-sm text-slate-400 pb-2 border-b border-slate-800/50 last:border-0 animate-in fade-in duration-300">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-slate-500 font-mono text-xs">@{post.author}</span>
                                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                                    post.sentiment === 'negative' ? 'border-red-900/50 text-red-400 bg-red-900/20' :
                                    post.sentiment === 'positive' ? 'border-green-900/50 text-green-400 bg-green-900/20' :
                                    'border-slate-700 text-slate-400 bg-slate-800'
                                }`}>
                                    {post.platform}
                                </span>
                             </div>
                             {post.content}
                           </div>
                         ))
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {appState === AppState.ERROR && (
          <div className="mt-8 p-6 bg-red-900/20 border border-red-800/50 rounded-xl text-center">
            <Icons.Alert className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Błąd Systemu</h3>
            <p className="text-red-300 mb-4">Nie udało się wygenerować kampanii. Sprawdź klucz API lub spróbuj ponownie.</p>
            <button 
              onClick={() => setAppState(AppState.IDLE)}
              className="text-sm font-bold uppercase text-red-400 hover:text-red-300 underline decoration-2 underline-offset-4"
            >
              Spróbuj Ponownie
            </button>
          </div>
        )}

      </div>
    </div>
  );
}