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
  const [videoDuration, setVideoDuration] = useState(10);
  const [isControlledByEarlySplash, setIsControlledByEarlySplash] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>(() => animationVideo || '/animation.mp4');

  // Transition into app after 1-second brand hold
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
      }, 450);
    }

    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 400);
  }, [isFadingOut, onComplete]);

  // Video finished playing to the very end -> Hold final frame for 1.0 second, then cross-dissolve
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

    // Exactly 1000ms pause on the final logo lockup after video completion
    setTimeout(() => {
      triggerTransition();
    }, 1000);
  }, [hasEnded, triggerTransition]);

  // Hook into 0ms early HTML video if present on initial app boot
  useEffect(() => {
    setSplashStatusBar();

    const earlyVideo = document.getElementById('wepsun-splash-video') as HTMLVideoElement | null;
    const earlyWrapper = document.getElementById('wepsun-splash-wrapper');

    if (earlyVideo && earlyWrapper) {
      setIsControlledByEarlySplash(true);
      earlyVideo.muted = true;
      earlyVideo.defaultMuted = true;
      earlyVideo.playsInline = true;

      const p = earlyVideo.play();
      if (p !== undefined) {
        p.catch(() => {});
      }

      const handleTimeUpdate = () => {
        const d = earlyVideo.duration;
        const cur = earlyVideo.currentTime;
        if (d && !isNaN(d) && d > 2) {
          setVideoDuration(d);
        }
        if (d > 2 && cur > 2 && cur >= d - 0.08) {
          handleVideoEnded();
        }
      };

      const handleEnded = () => {
        handleVideoEnded();
      };

      earlyVideo.addEventListener('timeupdate', handleTimeUpdate);
      earlyVideo.addEventListener('ended', handleEnded);

      // Mobile touch trigger in case of extreme battery saver
      const handleUserTouch = () => {
        if (!hasEnded && earlyVideo.paused) {
          earlyVideo.play().catch(() => {});
        }
      };

      window.addEventListener('touchstart', handleUserTouch, { passive: true });
      window.addEventListener('pointerdown', handleUserTouch, { passive: true });
      window.addEventListener('click', handleUserTouch, { passive: true });

      return () => {
        earlyVideo.removeEventListener('timeupdate', handleTimeUpdate);
        earlyVideo.removeEventListener('ended', handleEnded);
        window.removeEventListener('touchstart', handleUserTouch);
        window.removeEventListener('pointerdown', handleUserTouch);
        window.removeEventListener('click', handleUserTouch);
      };
    }
  }, [handleVideoEnded, hasEnded]);

  // Reliable play trigger for React-rendered video fallback (e.g. hash navigation #splash)
  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasEnded) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsStartedPlaying(true);
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
        p.then(() => setIsStartedPlaying(true)).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    if (!isControlledByEarlySplash) {
      startPlayback();
    }
  }, [isControlledByEarlySplash, startPlayback]);

  // Safety fallback timer: if video hangs past its duration + 4s, transition gracefully
  useEffect(() => {
    const safetyMs = (videoDuration + 4) * 1000;
    const safetyTimer = setTimeout(() => {
      if (!hasEnded && !isFadingOut) {
        handleVideoEnded();
      }
    }, safetyMs);

    return () => clearTimeout(safetyTimer);
  }, [videoDuration, hasEnded, isFadingOut, handleVideoEnded]);

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
          const d = e.currentTarget.duration;
          if (d && !isNaN(d) && d > 2) {
            setVideoDuration(d);
          }
          startPlayback();
        }}
        onCanPlay={() => {
          startPlayback();
        }}
        onCanPlayThrough={() => {
          startPlayback();
        }}
        onPlaying={() => {
          setIsStartedPlaying(true);
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.currentTime > 0.01 && !isStartedPlaying) {
            setIsStartedPlaying(true);
          }
          if (v.duration > 2 && v.currentTime > 2 && v.currentTime >= v.duration - 0.08) {
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
