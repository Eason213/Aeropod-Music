import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  videoId: string;
  isPlaying: boolean;
  volume: number;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onReady: () => void;
}

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({
  videoId,
  isPlaying,
  volume,
  onTimeUpdate,
  onEnded,
  onReady,
}, ref) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(seconds, true);
      }
    }
  }));

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (playerRef.current) {
         try {
            playerRef.current.destroy();
         } catch(e) { /* ignore */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Video ID Change
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      // FORCE STOP before loading new video to prevent state conflicts
      // playerRef.current.stopVideo(); 

      if (isPlaying) {
          // Use object syntax for tighter control
          // 'small' quality speeds up loading significantly (audio focus)
          playerRef.current.loadVideoById({
              videoId: videoId,
              startSeconds: 0,
              suggestedQuality: 'small' 
          });
      } else {
          playerRef.current.cueVideoById({
              videoId: videoId,
              startSeconds: 0,
              suggestedQuality: 'small'
          });
      }
    }
  }, [videoId]);

  // Handle Play/Pause
  useEffect(() => {
    if (playerRef.current && playerRef.current.getPlayerState) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  // Handle Volume
  useEffect(() => {
      if(playerRef.current && playerRef.current.setVolume) {
          playerRef.current.setVolume(volume);
      }
  }, [volume])

  const initializePlayer = () => {
    if (playerRef.current) return; // Already initialized

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'playsinline': 1,
        'controls': 0,
        'disablekb': 1,
        'fs': 0,
        'iv_load_policy': 3,
        'modestbranding': 1,
        'rel': 0, // No related videos at end
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange,
        'onError': onPlayerError,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    event.target.setVolume(volume);
    onReady();
    if (isPlaying) {
        event.target.playVideo();
    }
    
    // Start tracking time
    startProgressTracker();
  };

  const onPlayerStateChange = (event: any) => {
    // 0 = Ended
    if (event.data === 0) {
      onEnded();
    }
    
    // 5 = Video cued. 
    // If logic thinks we should be playing but video is just cued, force play.
    if (event.data === 5 && isPlaying) {
        event.target.playVideo();
    }
  };

  const onPlayerError = (event: any) => {
      // If error (e.g. unplayable video), skip to next automatically
      console.warn("Player Error:", event.data);
      onEnded();
  };

  const startProgressTracker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        onTimeUpdate(current, duration);
      }
    }, 1000);
  };

  return (
    <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden" style={{ zIndex: -1 }}>
      <div ref={containerRef}></div>
    </div>
  );
});

export default VideoPlayer;