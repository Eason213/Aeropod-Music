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

  // Refs to hold latest props to avoid stale closures in event listeners
  const onEndedRef = useRef(onEnded);
  const isPlayingRef = useRef(isPlaying);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onReadyRef = useRef(onReady);

  // Update refs whenever props change
  useEffect(() => {
    onEndedRef.current = onEnded;
    isPlayingRef.current = isPlaying;
    onTimeUpdateRef.current = onTimeUpdate;
    onReadyRef.current = onReady;
  }, [onEnded, isPlaying, onTimeUpdate, onReady]);

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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Video ID Change
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      // Clear interval temporarily while loading
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      if (isPlaying) {
          // 'small' quality loads fastest for audio
          playerRef.current.loadVideoById(videoId, 0, 'small');
      } else {
          playerRef.current.cueVideoById(videoId, 0, 'small');
      }
    }
  }, [videoId]); // isPlaying is intentionally omitted here to avoid reloading on pause/play toggle

  // Handle Play/Pause State
  useEffect(() => {
    if (playerRef.current && playerRef.current.getPlayerState) {
      const state = playerRef.current.getPlayerState();
      if (isPlaying) {
        // If state is not playing (1) or buffering (3)
        if (state !== 1 && state !== 3) {
            playerRef.current.playVideo();
        }
      } else {
        if (state === 1) {
            playerRef.current.pauseVideo();
        }
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
        'rel': 0,
        'origin': window.location.origin, // Helps with embedding restrictions
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
    onReadyRef.current();
    
    if (isPlayingRef.current) {
        event.target.playVideo();
    }
    
    startProgressTracker();
  };

  const onPlayerStateChange = (event: any) => {
    // Data: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    
    // 0 = Ended
    if (event.data === 0) {
      onEndedRef.current();
    }
    
    // 1 = Playing
    if (event.data === 1) {
        startProgressTracker();
    }

    // Force Play Safety Check
    // If we expect to be playing, but player is Cued (5) or Unstarted (-1), force play.
    if ((event.data === 5 || event.data === -1) && isPlayingRef.current) {
        setTimeout(() => {
           if (playerRef.current && isPlayingRef.current) {
               playerRef.current.playVideo();
           }
        }, 200);
    }
  };

  const onPlayerError = (event: any) => {
      console.warn("Player Error:", event.data);
      // If video cannot be played (e.g. 150 restricted), skip to next
      // We use the Ref ensuring we call the LATEST onEnded function (with correct queue index)
      onEndedRef.current();
  };

  const startProgressTracker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        onTimeUpdateRef.current(current, duration);
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