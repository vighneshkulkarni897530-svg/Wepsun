import React, { useEffect, useRef, useState, useCallback } from 'react';
import animationVideo from '../../assets/animation.mp4';
import { setSplashStatusBar, setAppStatusBar } from '../../services/nativeApp';

export interface WepsunSplashAnimationProps {
  onComplete?: () => void;
  className?: string;
}

/**
 * Native In-App Splash Experience for WEPSUN ENGINEERING SOLUTION
 * 
 * 0ms Instant Playback Architecture:
 * - Hooks directly into the pre-loaded early video element in index.html (starts playing at 0ms).
 * - React runs in the background without blocking or delaying video playback.
 * - Zero logos, zero posters, zero video player symbols.
 * - Plays the full 10-second animation, pauses and holds final logo frame for exactly 1.0s.
 * - Smoothly cross-dissolves into the Home Page.
 */
export const WepsunSplashAnimation: React.FC<WepsunSplashAnimationProps> = ({
  onComplete,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isStartedPlaying, setIsStartedPlaying] = useState(false);
  const [isControlledByEarlySplash, setIsControlledByEarlySplash] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>(() => animationVideo || '/animation.mp4');

  // Transition into app after 5-second complete animation
  const triggerTransition = useCallback(() => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setAppStatusBar();

    const earlyWrapper = document.getElementById('wepsun-splash-wrapper');
    if (earlyWrapper) {
      earlyWrapper.style.transition = 'opacity 0.4s ease-out';
      earlyWrapper.style.opacity = '0';
      earlyWrapper.style.pointerEvents = 'none';
      setTimeout(() => {
        try {
          earlyWrapper.remove();
        } catch (e) {}
      }, 420);
    }

    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 400);
  }, [isFadingOut, onComplete]);

  // Video finished playing to the very end
  const handleVideoEnded = useCallback(() => {
    if (hasEnded) return;
    setHasEnded(true);

    const earlyVideo = document.getElementById('wepsun-splash-video') as HTMLVideoElement | null;
    const v = earlyVideo || videoRef.current;
    if (v) {
      try {
        v.pause();
      } catch (e) {}
    }

    triggerTransition();
  }, [hasEnded, triggerTransition]);

  // Hook into 0ms early HTML video if present on initial app boot
  useEffect(() => {
    setSplashStatusBar();

    // Register global bridge callback
    (window as any).__WEPSUN_ON_SPLASH_COMPLETE = triggerTransition;

    const earlyVideo = document.getElementById('wepsun-splash-video') as HTMLVideoElement | null;
    const earlyWrapper = document.getElementById('wepsun-splash-wrapper');

    if (earlyVideo && earlyWrapper) {
      setIsControlledByEarlySplash(true);
      earlyVideo.muted = true;
      earlyVideo.defaultMuted = true;
      earlyVideo.playsInline = true;
      try {
        earlyVideo.playbackRate = 2.0;
      } catch(e) {}

      const p = earlyVideo.play();
      if (p !== undefined) {
        p.catch(() => {});
      }

      const handleTimeUpdate = () => {
        try {
          if (earlyVideo.playbackRate !== 2.0) {
            earlyVideo.playbackRate = 2.0;
          }
        } catch(e) {}
        const cur = earlyVideo.currentTime;
        const d = earlyVideo.duration;
        if (d && d > 2 && cur >= d - 0.08) {
          handleVideoEnded();
        }
      };

      const handleEnded = () => {
        handleVideoEnded();
      };

      earlyVideo.addEventListener('timeupdate', handleTimeUpdate);
      earlyVideo.addEventListener('ended', handleEnded);

      return () => {
        earlyVideo.removeEventListener('timeupdate', handleTimeUpdate);
        earlyVideo.removeEventListener('ended', handleEnded);
      };
    }
  }, [handleVideoEnded, triggerTransition]);

  // Reliable play trigger for React-rendered video (e.g. hash navigation #splash or fallback)
  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasEnded) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    try {
      video.playbackRate = 2.0;
    } catch(e) {}

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsStartedPlaying(true);
          try {
            video.playbackRate = 2.0;
          } catch(e) {}
        })
        .catch(() => {});
    }
  }, [hasEnded]);

  const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      videoRef.current = node;
      node.muted = true;
      node.defaultMuted = true;
      node.playsInline = true;
      try {
        node.playbackRate = 2.0;
      } catch(e) {}
      node.setAttribute('muted', '');
      node.setAttribute('playsinline', '');
      node.setAttribute('webkit-playsinline', 'true');
      node.setAttribute('x5-playsinline', 'true');
      node.setAttribute('x5-video-player-type', 'h5-page');
      node.setAttribute('x-webkit-airplay', 'deny');
      node.setAttribute('autoplay', '');
      node.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback noplaybackrate');
      
      const p = node.play();
      if (p !== undefined) {
        p.then(() => {
          setIsStartedPlaying(true);
          try {
            node.playbackRate = 2.0;
          } catch(e) {}
        }).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (!isControlledByEarlySplash) {
      startPlayback();
    }
  }, [isControlledByEarlySplash, startPlayback]);

  // Safety fallback timer: complete 5-second animation + 0.5s margin
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!hasEnded && !isFadingOut) {
        handleVideoEnded();
      }
    }, 5500);

    return () => clearTimeout(safetyTimer);
  }, [hasEnded, isFadingOut, handleVideoEnded]);

  // If early HTML splash is active on launch, let it handle playback directly at 0ms
  if (isControlledByEarlySplash) {
    return null;
  }

  const isFullscreen = !className || !className.includes('relative');

  return (
    <div
      onClick={startPlayback}
      className={`fixed inset-0 w-full h-full min-h-screen z-[99999] bg-white flex items-center justify-center overflow-hidden select-none transition-opacity duration-400 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${className}`}
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <video
        ref={handleVideoRef}
        src={videoSrc}
        playsInline
        autoPlay
        muted
        loop={false}
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        controls={false}
        tabIndex={-1}
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        onLoadedMetadata={(e) => {
          try {
            e.currentTarget.playbackRate = 2.0;
          } catch(err) {}
          startPlayback();
        }}
        onCanPlay={(e) => {
          try {
            e.currentTarget.playbackRate = 2.0;
          } catch(err) {}
          startPlayback();
        }}
        onCanPlayThrough={(e) => {
          try {
            e.currentTarget.playbackRate = 2.0;
          } catch(err) {}
          startPlayback();
        }}
        onPlaying={(e) => {
          setIsStartedPlaying(true);
          try {
            e.currentTarget.playbackRate = 2.0;
          } catch(err) {}
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.currentTime > 0.01 && !isStartedPlaying) {
            setIsStartedPlaying(true);
          }
          if (v.duration > 2 && v.currentTime >= v.duration - 0.08) {
            handleVideoEnded();
          }
        }}
        onEnded={handleVideoEnded}
        onError={() => {
          if (videoSrc === '/animation.mp4' && animationVideo && animationVideo !== '/animation.mp4') {
            setVideoSrc(animationVideo);
          } else if (videoSrc !== '/animation.mp4') {
            setVideoSrc('/animation.mp4');
          }
        }}
        className={`w-full h-full max-w-none max-h-none object-contain pointer-events-none select-none outline-none border-0 shadow-none z-20 transition-opacity duration-150 ${
          isFullscreen ? 'wepsun-splash-video-fullscreen' : ''
        } ${isStartedPlaying ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backfaceVisibility: 'hidden',
          backgroundColor: '#ffffff',
        }}
      />
    </div>
  );
};

export default WepsunSplashAnimation;
