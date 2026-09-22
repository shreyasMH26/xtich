'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Globe, ArrowRight, Instagram, Phone } from 'lucide-react';

const XTICH_HERO_VIDEO = 'assets/hero-ambient.mp4';

export interface XTICHHeroProps {
  title?: string;
  subtitle?: string;
  videoSrc?: string;
}

export function XTICHHero({
  title = 'Built for the curious',
  subtitle = 'Tested across 300 days of daily wear and 180+ wash cycles. Subscribe to our newsletter today for priority academic batch allocation.',
  videoSrc = XTICH_HERO_VIDEO,
}: XTICHHeroProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const fadingOutRef = useRef<boolean>(false);
  const currentOpacityRef = useRef<number>(0);

  // Custom requestAnimationFrame-based fade without CSS transitions
  const fadeTo = useCallback(
    (targetOpacity: number, duration: number, onComplete?: () => void) => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      const video = videoRef.current;
      if (!video) return;

      const startOpacity = currentOpacityRef.current;
      const delta = targetOpacity - startOpacity;

      if (Math.abs(delta) < 0.001 || duration <= 0) {
        currentOpacityRef.current = targetOpacity;
        video.style.opacity = `${targetOpacity}`;
        onComplete?.();
        return;
      }

      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const newOpacity = startOpacity + delta * progress;
        currentOpacityRef.current = newOpacity;

        if (videoRef.current) {
          videoRef.current.style.opacity = `${newOpacity}`;
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          animFrameRef.current = null;
          onComplete?.();
        }
      };

      animFrameRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  const fadeIn = useCallback(() => {
    fadingOutRef.current = false;
    fadeTo(1, 500);
  }, [fadeTo]);

  const fadeOut = useCallback(() => {
    fadingOutRef.current = true;
    fadeTo(0, 500);
  }, [fadeTo]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= 0.55 && !fadingOutRef.current) {
      fadeOut();
    }
  };

  const handleEnded = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      currentOpacityRef.current = 0;
      video.style.opacity = '0';
    }

    setTimeout(() => {
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        v.play()
          .then(() => {
            fadeIn();
          })
          .catch((err) => {
            console.error('XTICH video autoplay error:', err);
          });
      }
    }, 100);
  };

  const handleLoadedData = () => {
    const video = videoRef.current;
    if (video) {
      video
        .play()
        .then(() => {
          fadeIn();
        })
        .catch((err) => {
          console.error('XTICH video autoplay error:', err);
        });
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      video
        .play()
        .then(() => {
          fadeIn();
        })
        .catch(() => {});
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [fadeIn]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setEmail('');
  };

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col justify-between select-none">
      {/* Background XTICH Video shifted down by 17% */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster="assets/editorial_hoodie_campaign.jpg"
        muted
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedData={handleLoadedData}
        className="absolute inset-0 w-full h-full object-cover translate-y-[17%] pointer-events-none"
        style={{ opacity: 0 }}
      />

      {/* Subtle Atmospheric Vignette Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-[5]" />

      {/* Liquid Glass Navigation Bar */}
      <header className="relative z-20 pl-6 pr-6 py-6 w-full">
        <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto w-full">
          {/* Left: XTICH Logo & Nav Links */}
          <div className="flex items-center gap-8">
            <a
              href="#hero"
              className="flex items-center gap-2.5 text-white font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              <img
                src="assets/xtich-logo.png"
                alt="XTICH"
                className="h-6 w-auto object-contain brightness-0 invert"
              />
              <span className="font-mono tracking-widest text-sm font-bold uppercase">
                XTICH
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#story"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Story
              </a>
              <a
                href="#proof"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Proof
              </a>
              <a
                href="#garment"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                The Hoodie
              </a>
              <a
                href="#collection"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Versity
              </a>
              <a
                href="#bespoke"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Bespoke
              </a>
              <a
                href="#shop"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Archive
              </a>
            </nav>
          </div>

          {/* Right: Auth / Reservation Actions */}
          <div className="flex items-center gap-4">
            <a
              href="#bespoke"
              className="text-white hover:text-white/80 transition-colors text-sm font-medium"
            >
              Commission
            </a>
            <a
              href="#shop"
              className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Reserve
            </a>
          </div>
        </div>
      </header>

      {/* Hero Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[20%]">
        <h1
          className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {title}
        </h1>

        <div className="max-w-xl w-full space-y-4">
          {/* Email input bar */}
          <form
            onSubmit={handleEmailSubmit}
            className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3 w-full"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for allocation drops"
              className="w-full bg-transparent outline-none border-none text-white placeholder:text-white/40 text-base"
              required
            />
            <button
              type="submit"
              aria-label="Submit allocation request"
              className="bg-white rounded-full p-3 text-black hover:bg-white/90 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            >
              <ArrowRight size={20} />
            </button>
          </form>

          {/* Subtitle text */}
          <p className="text-white text-sm leading-relaxed px-4 text-shadow">
            {submitted ? '✓ Priority allocation confirmed. We will reach out.' : subtitle}
          </p>

          {/* Manifesto button */}
          <div className="flex justify-center pt-2">
            <a
              href="#story"
              className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/10 transition-colors inline-block"
            >
              Manifesto ↓
            </a>
          </div>
        </div>
      </main>

      {/* Social Icons Footer */}
      <footer className="relative z-10 flex justify-center gap-4 pb-12">
        <a
          href="https://www.instagram.com/xtich.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
          aria-label="Instagram"
        >
          <Instagram size={20} />
        </a>
        <a
          href="tel:+919535344175"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
          aria-label="Direct Phone & WhatsApp"
        >
          <Phone size={20} />
        </a>
        <a
          href="#shop"
          className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
          aria-label="Archive"
        >
          <Globe size={20} />
        </a>
      </footer>
    </div>
  );
}

export default XTICHHero;
