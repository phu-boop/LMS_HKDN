import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Box, BoxProps } from '@mui/material';

export type HlsPlayerProps = {
  src: string;
  videoId?: string;
  poster?: string;
  /** Avoid clashing with DOM `Box` `onError`. */
  onStreamError?: (message: string) => void;
} & Omit<BoxProps, 'component' | 'children'>;

export default function HlsPlayer({ src, videoId, poster, onStreamError, sx, ...other }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onStreamErrorRef = useRef(onStreamError);
  onStreamErrorRef.current = onStreamError;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    let hls: Hls | null = null;
    let nativeSrc = false;

    const handleVideoError = () => {
      const err = video.error;
      const code = err ? ` (code ${err.code})` : '';
      onStreamErrorRef.current?.(`Không thể phát video${code}`);
    };

    const restoreProgress = () => {
      if (videoId) {
        try {
          const saved = localStorage.getItem(`video_progress_${videoId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.currentTime && parsed.duration && parsed.currentTime < parsed.duration - 2) {
              video.currentTime = parsed.currentTime;
            }
          }
        } catch (e) {
          console.error('Failed to restore video progress', e);
        }
      }
    };

    const handleTimeUpdate = () => {
      if (videoId && video.duration) {
        try {
          localStorage.setItem(`video_progress_${videoId}`, JSON.stringify({
            currentTime: video.currentTime,
            duration: video.duration,
            lastUpdated: Date.now()
          }));
        } catch (e) {
          // ignore localStorage errors
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls?.recoverMediaError();
            break;
          default:
            onStreamErrorRef.current?.(data.details || 'Lỗi HLS không khôi phục được');
            hls?.destroy();
            hls = null;
            break;
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        restoreProgress();
        video.play().catch((err) => {
          console.warn('Autoplay failed:', err);
        });
      });

      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      nativeSrc = true;
      video.addEventListener('error', handleVideoError);
      video.addEventListener('loadedmetadata', () => {
        restoreProgress();
        video.play().catch((err) => {
          console.warn('Autoplay failed:', err);
        });
      });
    } else {
      onStreamErrorRef.current?.('Trình duyệt không hỗ trợ HLS');
    }

    return () => {
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (hls) {
        hls.destroy();
      }
      if (nativeSrc) {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [src, videoId]);

  if (!src) {
    return (
      <Box
        sx={{
          width: 1,
          aspectRatio: '16 / 9',
          bgcolor: 'grey.900',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          overflow: 'hidden',
          ...sx,
        }}
        {...other}
      />
    );
  }

  return (
    <Box
      sx={{
        width: 1,
        position: 'relative',
        bgcolor: 'common.black',
        borderRadius: 2,
        overflow: 'hidden',
        aspectRatio: '16 / 9',
        ...sx,
      }}
      {...other}
    >
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        poster={poster}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
}
