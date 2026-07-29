import { useEffect, useRef, useState } from 'react';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260715_090628_7052d8a6-a094-4341-a4a2-ad58493a67a9.mp4';

const CAPTURE_MAX_WIDTH = 960;
const PLAYBACK_FPS = 30;
const PLAYBACK_INTERVAL = 1000 / PLAYBACK_FPS;

/**
 * Ceiling on retained frames.
 *
 * Each frame is a 960×540-ish canvas, roughly 2MB of backing store. Capturing
 * an unbounded number of them is how this technique runs a phone out of memory:
 * ten seconds at 30fps is already ~600MB. 240 frames is eight seconds of
 * boomerang, which is far longer than the loop needs to read as continuous.
 */
const MAX_FRAMES = 240;

/**
 * Boomerang hero background.
 *
 * Plays the source video once while capturing every frame to offscreen
 * (detached, never-appended-to-DOM) canvases. Once the video ends, the
 * `<video>` element is hidden and a display `<canvas>` ping-pongs through the
 * captured frames forward-then-reverse forever at 30fps, producing a smooth
 * "boomerang" loop instead of an abrupt native video restart.
 *
 * The video is cross-origin (CloudFront) with crossOrigin="anonymous". If the
 * CDN does not send CORS headers, the canvas becomes tainted and reading its
 * pixel data throws a SecurityError. That is caught, capture is abandoned,
 * and the native <video> is left to loop on its own instead.
 */
export default function BoomerangVideoBg() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const lastCapturedTimeRef = useRef<number | null>(null);
  const captureHandleRef = useRef<number | null>(null);
  const usingRvfcRef = useRef(false);
  const taintedRef = useRef(false);
  const taintProbedRef = useRef(false);

  const [framesReady, setFramesReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const frames: HTMLCanvasElement[] = [];

    const stopCapture = () => {
      if (captureHandleRef.current == null) return;
      if (usingRvfcRef.current && 'cancelVideoFrameCallback' in video) {
        (video as any).cancelVideoFrameCallback(captureHandleRef.current);
      } else {
        cancelAnimationFrame(captureHandleRef.current);
      }
      captureHandleRef.current = null;
    };

    const captureFrame = () => {
      if (cancelled || taintedRef.current) return;
      if (frames.length >= MAX_FRAMES) {
        stopCapture();
        return;
      }

      const time = video.currentTime;
      if (lastCapturedTimeRef.current === time) return;
      lastCapturedTimeRef.current = time;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      const width = Math.min(CAPTURE_MAX_WIDTH, vw);
      const height = Math.round((vh / vw) * width);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, width, height);

        // Taint probe, first frame only. getImageData forces a synchronous
        // GPU→CPU readback; running it on every frame would throttle capture
        // badly. One frame is enough — a cross-origin source taints the very
        // first draw, not some later one.
        if (!taintProbedRef.current) {
          taintProbedRef.current = true;
          ctx.getImageData(0, 0, 1, 1);
        }

        frames.push(canvas);
      } catch {
        taintedRef.current = true;
        video.loop = true;
        video.play().catch(() => {});
        stopCapture();
      }
    };

    const scheduleNext = () => {
      if (cancelled || taintedRef.current || video.ended || video.paused) return;
      if ('requestVideoFrameCallback' in video) {
        usingRvfcRef.current = true;
        captureHandleRef.current = (video as any).requestVideoFrameCallback(() => {
          captureFrame();
          scheduleNext();
        });
      } else {
        usingRvfcRef.current = false;
        captureHandleRef.current = requestAnimationFrame(() => {
          captureFrame();
          scheduleNext();
        });
      }
    };

    // 'play' fires again on every resume. Without this guard a second loop
    // stacks on the first and both capture into the same array.
    const handlePlay = () => {
      if (captureHandleRef.current != null) return;
      scheduleNext();
    };

    const handleEnded = () => {
      stopCapture();

      if (!taintedRef.current && frames.length > 0) {
        framesRef.current = frames;
        setFramesReady(true);
        return;
      }

      // Capture produced nothing usable. Without this the video sits on its
      // final frame forever and the hero reads as a broken still image, so
      // hand playback back to the element and let it loop natively.
      video.loop = true;
      video.play().catch(() => {});
    };

    const handleLoadedData = () => {
      video.play().catch(() => {
        // Autoplay blocked by the browser: the plain <video> stays visible
        // and users can still interact with the page normally.
      });
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      cancelled = true;
      stopCapture();
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Ping-pong (boomerang) playback of the captured frames once ready.
  useEffect(() => {
    if (!framesReady) return;

    const canvas = displayCanvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = frames[0].width;
    canvas.height = frames[0].height;

    let index = 0;
    let direction: 1 | -1 = 1;
    let lastTime = 0;
    let rafId: number;

    const draw = (time: number) => {
      rafId = requestAnimationFrame(draw);
      if (time - lastTime < PLAYBACK_INTERVAL) return;
      lastTime = time;

      const frame = frames[index];
      if (frame) {
        ctx.drawImage(frame, 0, 0);
      }

      if (direction === 1) {
        if (index >= frames.length - 1) {
          direction = -1;
        } else {
          index += 1;
        }
      } else if (index <= 0) {
        direction = 1;
      } else {
        index -= 1;
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [framesReady]);

  return (
    <div className="absolute inset-0 z-0">
      <div className="scale-[1.15] origin-top overflow-hidden w-full h-full">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover object-top"
          style={{ display: framesReady ? 'none' : 'block' }}
        />
        <canvas
          ref={displayCanvasRef}
          className="w-full h-full object-cover object-top"
          style={{ display: framesReady ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}
