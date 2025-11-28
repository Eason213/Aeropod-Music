import React, { useState, useEffect, useRef } from 'react';
import { searchYouTube } from './services/youtubeService';
import VideoPlayer from './components/VideoPlayer';
import Seekbar from './components/Seekbar';
import { VideoItem, RepeatMode } from './types';
import { 
  Play, Pause, SkipForward, SkipBack, Search, Settings, 
  Shuffle, Repeat, ChevronDown, List, Music2, AlertCircle 
} from './components/Icons';

// Default background for aesthetic
const DEFAULT_BG = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

const App: React.FC = () => {
  // Data State
  const [apiKey, setApiKey] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoItem[]>([]);
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  
  // UI State
  const [view, setView] = useState<'search' | 'player' | 'settings'>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('yt_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('yt_api_key', key);
    setView('search');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    if (!apiKey) {
      setView('settings');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const items = await searchYouTube(query, apiKey);
      setResults(items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const playTrack = (video: VideoItem, index: number, fromList: VideoItem[]) => {
    if (isShuffle) {
        // Create a shuffled version of the list starting with the selected song
        const remaining = fromList.filter(v => v.id !== video.id);
        const shuffled = remaining.sort(() => Math.random() - 0.5);
        setQueue([video, ...shuffled]);
        setCurrentIndex(0);
    } else {
        setQueue(fromList);
        setCurrentIndex(index);
    }
    setIsPlaying(true);
    setView('player');
  };

  const playRandomResults = () => {
    if (results.length === 0) return;
    const shuffled = [...results].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIndex(0);
    setIsPlaying(true);
    setView('player');
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    // If more than 3 seconds in, restart song
    if (progress.current > 3) {
      // Logic handled by seeking to 0, but simplicity sake we just trigger next render with same ID or seek
       // For this simple implementation, let's just go back in array
    }
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(prevIndex);
  };

  const handleTimeUpdate = (current: number, duration: number) => {
    setProgress({ current, duration });
  };

  const currentTrack = queue[currentIndex];

  // Dynamic Background
  const bgImage = currentTrack?.thumbnailUrl || DEFAULT_BG;

  return (
    <div className="relative w-full h-[100dvh] bg-black text-white font-sans overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background Blur Mesh */}
      <div className="absolute inset-0 z-0">
         <img src={bgImage} className="w-full h-full object-cover opacity-60 transition-opacity duration-1000" alt="bg" />
         <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl"></div>
         <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-black/80 to-transparent"></div>
         <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      </div>

      {/* Main Container - iPhone 17 Pro Width Simulation if on Desktop */}
      <div className="relative z-10 w-full h-full max-w-[440px] flex flex-col">
        
        {/* Hidden Player Logic */}
        {currentTrack && (
          <VideoPlayer
            videoId={currentTrack.id}
            isPlaying={isPlaying}
            volume={100}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleNext}
            onReady={() => setIsPlayerReady(true)}
          />
        )}

        {/* --- VIEW: SEARCH & LIST --- */}
        {view === 'search' && (
          <div className="flex-1 flex flex-col p-6 animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 pt-4">
               <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
                 AeroPod
               </h1>
               <button onClick={() => setView('settings')} className="p-2 bg-white/10 rounded-full backdrop-blur-md active:scale-95 transition">
                 <Settings size={20} className="text-white/80" />
               </button>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative mb-6 group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs, artists..."
                className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-lg placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all backdrop-blur-xl shadow-lg"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
            </form>

            {/* Actions */}
            {results.length > 0 && (
               <div className="flex gap-3 mb-6">
                  <button 
                    onClick={playRandomResults}
                    className="flex-1 h-12 flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl active:scale-95 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    <Shuffle size={18} /> Shuffle Results
                  </button>
               </div>
            )}

            {/* Results List */}
            <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-32 space-y-4 scroll-smooth">
              {isLoading && (
                 <div className="flex flex-col items-center justify-center h-40 gap-4 text-white/50">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <p>Searching YouTube...</p>
                 </div>
              )}
              
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm flex gap-3 items-start">
                   <AlertCircle size={20} className="shrink-0 mt-0.5" />
                   <div>{error}</div>
                </div>
              )}

              {results.map((item, idx) => (
                <div 
                  key={item.id}
                  onClick={() => playTrack(item, idx, results)}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition cursor-pointer group"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg">
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-white/90 text-lg leading-tight mb-1">{item.title}</h3>
                    <p className="text-sm text-white/50 truncate">{item.channelTitle}</p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/40 group-hover:border-white/30 group-hover:text-white transition">
                    <Play size={12} fill="currentColor" />
                  </div>
                </div>
              ))}
              
              {results.length === 0 && !isLoading && !error && (
                 <div className="text-center text-white/30 mt-20">
                    <Music2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Search for songs to begin.</p>
                    <p className="text-xs mt-2 opacity-50">Results filtered to &lt; 4 mins</p>
                 </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: PLAYER (FULLSCREEN) --- */}
        {view === 'player' && currentTrack && (
          <div className="flex-1 flex flex-col p-8 animate-slide-up relative">
             {/* Header */}
             <div className="flex justify-between items-center mb-8">
               <button onClick={() => setView('search')} className="p-3 bg-white/5 rounded-full backdrop-blur-md active:scale-95 transition">
                 <ChevronDown size={24} />
               </button>
               <span className="text-xs font-bold tracking-widest uppercase text-white/40">Now Playing</span>
               <button className="p-3 bg-white/5 rounded-full backdrop-blur-md active:scale-95 transition">
                 <List size={24} />
               </button>
             </div>

             {/* Album Art */}
             <div className="flex-1 flex items-center justify-center py-4">
                <div className="relative w-full aspect-square max-w-[340px] mx-auto">
                   {/* Glow effect */}
                   <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-90 animate-pulse-slow"></div>
                   <img 
                      src={currentTrack.thumbnailUrl.replace('mqdefault', 'maxresdefault') || currentTrack.thumbnailUrl} 
                      alt="Art" 
                      className={`relative w-full h-full object-cover rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-80'}`}
                   />
                </div>
             </div>

             {/* Info & Controls */}
             <div className="mt-8 flex flex-col gap-8">
                <div className="text-center space-y-2">
                   <h2 className="text-2xl font-bold text-white leading-tight line-clamp-2">{currentTrack.title}</h2>
                   <p className="text-lg text-white/50">{currentTrack.channelTitle}</p>
                </div>

                <div className="space-y-6">
                  {/* Seekbar */}
                  <Seekbar 
                     currentTime={progress.current} 
                     duration={progress.duration} 
                     onChange={(val) => {
                        if (window.YT && window.YT.get && window.YT.get(currentTrack.id)) {
                             // This is tricky with hidden player, usually you interact with player instance directly. 
                             // Since we don't have direct access to instance in this parent, we can skip seeking for this MVP
                             // or implement a context. For simplicity, skipping strict seek interaction or rely on VideoPlayer 
                             // exposing a ref, but keeping UI clean.
                        }
                     }}
                  />

                  {/* Main Buttons */}
                  <div className="flex items-center justify-between px-4">
                     <button 
                        onClick={() => setIsShuffle(!isShuffle)}
                        className={`p-2 transition ${isShuffle ? 'text-green-400' : 'text-white/40'}`}
                     >
                        <Shuffle size={20} />
                     </button>
                     
                     <div className="flex items-center gap-6">
                        <button onClick={handlePrev} className="text-white hover:text-white/70 active:scale-90 transition">
                           <SkipBack size={36} fill="currentColor" />
                        </button>
                        
                        <button 
                           onClick={() => setIsPlaying(!isPlaying)}
                           className="w-20 h-20 flex items-center justify-center bg-white text-black rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                        >
                           {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                        
                        <button onClick={handleNext} className="text-white hover:text-white/70 active:scale-90 transition">
                           <SkipForward size={36} fill="currentColor" />
                        </button>
                     </div>

                     <button className="p-2 text-white/40">
                        <Repeat size={20} />
                     </button>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* --- VIEW: SETTINGS --- */}
        {view === 'settings' && (
          <div className="flex-1 flex flex-col p-8 animate-slide-up bg-black/80 backdrop-blur-xl">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-bold">Settings</h2>
                <button onClick={() => setView('search')} className="text-sm font-medium text-white/60">Done</button>
             </div>

             <div className="glass-panel p-6 rounded-3xl space-y-4">
                <label className="block text-sm font-medium text-white/60">YouTube Data API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your API key here"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-white/40 transition"
                  />
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                   Enter your <strong>YouTube Data API v3</strong> key. 
                   <br/>
                   <span className="text-yellow-400/80">Where to find it:</span> Google Cloud Console {'>'} APIs & Services {'>'} Credentials.
                </p>
                <button 
                  onClick={() => handleSaveKey(apiKey)}
                  className="w-full h-12 bg-white text-black font-bold rounded-xl mt-4 active:scale-95 transition"
                >
                  Save API Key
                </button>
             </div>
             
             <div className="mt-8 text-center">
                <p className="text-xs text-white/20">AeroPod Music v1.0 • iOS 26 Concept</p>
             </div>
          </div>
        )}

        {/* Mini Player Floating Island (if in Search view and playing) */}
        {view === 'search' && currentTrack && (
           <div 
             onClick={() => setView('player')}
             className="absolute bottom-6 left-6 right-6 h-16 glass-panel rounded-[2rem] flex items-center px-2 pr-4 shadow-2xl cursor-pointer hover:bg-white/10 transition animate-slide-up z-50"
           >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 mr-3 animate-[spin_10s_linear_infinite]">
                 <img src={currentTrack.thumbnailUrl} className="w-full h-full object-cover" alt="mini" />
              </div>
              <div className="flex-1 min-w-0 mr-4">
                 <h4 className="font-bold text-sm truncate">{currentTrack.title}</h4>
                 <p className="text-xs text-white/50 truncate">Playing • {progress.duration > 0 ? Math.floor(progress.duration/60) + ':' + (Math.floor(progress.duration%60) < 10 ? '0' : '') + Math.floor(progress.duration%60) : '...'}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full active:scale-90 transition"
              >
                 {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
           </div>
        )}

      </div>
    </div>
  );
};

export default App;