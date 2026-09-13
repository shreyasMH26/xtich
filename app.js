/**
 * XTICH Digital Editorial — Cinematic Engine v4.0
 * ─────────────────────────────────────────────────────────────────────────
 * Stack:
 *   Lenis        – physical-weight smooth scroll (feels like Shopify Editions)
 *   GSAP         – professional animation timeline engine
 *   ScrollTrigger– pixel-precise scroll-pinning and scene choreography
 *   WebGL canvas – scroll-velocity reactive noise overlay (GPU rendered)
 *   Split-text   – vanilla character/word reveal system (no SplitText plugin)
 *
 * Brand Rules enforced:
 *   – XTICH logo: monochrome only, zero red marks
 *   – Founders: Rathan (Founder) / Shreyas (Founder) — equal stature
 *   – No polo shirts, no confidential financial data
 * ─────────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* =========================================================================
     UTILITIES
     ========================================================================= */
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp  = (a, b, t) => a + (b - a) * t;
  const mapR  = (v, iA, iB, oA, oB) => {
    const t = clamp((v - iA) / (iB - iA), 0, 1);
    return lerp(oA, oB, t);
  };
  const easeOut3 = t => 1 - Math.pow(1 - t, 3);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.innerWidth > 860;

  /* =========================================================================
     PRODUCT DATA
     ========================================================================= */
  const PRODUCTS = {
    hoodie: {
      id: 'hoodie', title: 'The Heavyweight Hoodie', series: 'Versity Series',
      spec: '450 GSM Cotton-Poly Fleece · Obsidian Black',
      image: 'assets/hoodie-black-front-hr.jpg', imageBack: 'assets/hoodie-black-back.jpg',
      desc: 'Engineered to solve the institutional uniform crisis. High-density long-staple cotton-poly blend tested across 300 consecutive days of daily wear and 180+ laundry cycles.',
      specs: ['450 GSM heavyweight brushed fleece','Long-staple cotton blended with high-tensile poly fibers','Double-layered structured hood with drawstring elimination','Elastic-ribbed cuffs and waistband engineered against sagging'],
      testing: '300+ days continuous prototype wear test, 180+ machine wash cycles.'
    },
    sweatshirt: {
      id: 'sweatshirt', title: 'The Versity Sweatshirt', series: 'Versity Series',
      spec: '450 GSM Cotton-Poly Fleece · Obsidian Black',
      image: 'assets/sweatshirt-black-front-hr.jpg', imageBack: 'assets/sweatshirt-black-front-hr.jpg',
      desc: 'Architectural crewneck silhouette with heavy-ribbed collar, relaxed drop-shoulder drape, and breathable thermal retention.',
      specs: ['450 GSM heavyweight thermal fleece knit','Thick 2x2 ribbed collar, cuffs, and bottom waistband','Ergonomic drop-shoulder patterning','Reinforced twin-needle stitching'],
      testing: 'Built under the same Delhi manufacturing and fabric testing protocol as the flagship 300-day prototype.'
    }
  };

  /* =========================================================================
     APP STATE
     ========================================================================= */
  const state = {
    bag: [], selectedSizes: { hoodie: 'S', sweatshirt: 'S' },
    quantities: { hoodie: 1, sweatshirt: 1 },
    lenisScrollY: 0, scrollVelocity: 0, prevLenisY: 0,
    countedTelemetry: false, loaderDone: false,
    activeNavSection: ''
  };

  /* =========================================================================
     1. CINEMATIC LOADING SCREEN
     ========================================================================= */
  const loader     = document.getElementById('xtich-loader');
  const loaderLogo = document.getElementById('loaderLogoImg');
  const loaderFill = document.getElementById('loaderProgressFill');
  const loaderMeta = document.getElementById('loaderMeta');
  const loaderCanvas = document.getElementById('loader-canvas');

  // Animated loader canvas — falling dots like Shopify Spring '26
  function initLoaderCanvas() {
    if (!loaderCanvas || prefersReduced) return;
    const ctx = loaderCanvas.getContext('2d');
    let W = loaderCanvas.width  = window.innerWidth;
    let H = loaderCanvas.height = window.innerHeight;

    const dots = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1.1 + Math.random() * 1.2,
      speed: 1.2 + Math.random() * 3.5,
      alpha: 0.15 + Math.random() * 0.55,
      drift: (Math.random() - 0.5) * 0.5
    }));

    let rafId;
    function drawDots() {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,250,246,${d.alpha})`;
        ctx.fill();
        d.y -= d.speed * 0.5;
        d.x += d.drift;
        if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W; }
      });
      rafId = requestAnimationFrame(drawDots);
    }
    drawDots();
    return () => { cancelAnimationFrame(rafId); };
  }

  // Simulated progress fill
  function runLoaderProgress(onComplete) {
    if (!loaderFill) { onComplete(); return; }
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 14 + 4;
      if (p >= 100) { p = 100; clearInterval(interval); }
      loaderFill.style.width = p + '%';
      if (p >= 100) {
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, 80);
  }

  function dismissLoader() {
    if (!loader) return;
    if (loaderLogo) {
      loaderLogo.style.transition = 'transform 1.2s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease 0.3s';
      loaderLogo.style.transform  = 'scale(1.08) translateY(-10px)';
      loaderLogo.style.opacity    = '0';
    }
    if (loaderMeta) {
      loaderMeta.style.transition = 'opacity 0.4s ease';
      loaderMeta.style.opacity    = '0';
    }
    setTimeout(() => {
      loader.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1)';
      loader.style.opacity    = '0';
      loader.style.pointerEvents = 'none';
      setTimeout(() => {
        loader.style.display = 'none';
        state.loaderDone = true;
        document.body.classList.add('loader-complete');
        initHeroReveal();
      }, 900);
    }, 400);
  }

  // Start loader
  const stopLoaderCanvas = initLoaderCanvas();
  if (loaderLogo) {
    loaderLogo.style.opacity   = '0';
    loaderLogo.style.transform = 'scale(0.9)';
    setTimeout(() => {
      loaderLogo.style.transition = 'opacity 0.8s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1)';
      loaderLogo.style.opacity    = '1';
      loaderLogo.style.transform  = 'scale(1)';
    }, 200);
  }

  function startApp() {
    if (stopLoaderCanvas) stopLoaderCanvas();
    runLoaderProgress(dismissLoader);
  }

  if (document.readyState === 'complete') {
    setTimeout(startApp, 400);
  } else {
    window.addEventListener('load', () => setTimeout(startApp, 400));
    // Fallback — dismiss after max 4s even if fonts/images stall
    setTimeout(() => { if (!state.loaderDone) startApp(); }, 4000);
  }

  /* =========================================================================
     2. LENIS SMOOTH SCROLL (physical-weight virtual scroll)
     ========================================================================= */
  let lenis;

  function initLenis() {
    if (prefersReduced || typeof Lenis === 'undefined') return;

    const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    lenis = new Lenis({
      duration: isTouch ? 0.85 : 1.25,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo easing
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: isTouch ? 1.05 : 1.8,
      infinite: false,
      autoResize: true,
    });

    // Feed Lenis into GSAP ticker for perfect sync
    if (typeof gsap !== 'undefined') {
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // Track velocity for WebGL effect
    lenis.on('scroll', ({ scroll, velocity }) => {
      state.lenisScrollY   = scroll;
      state.scrollVelocity = velocity;
    });

    // Feed ScrollTrigger with Lenis scroll position
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }
  }

  /* =========================================================================
     3. SPLIT-TEXT ENGINE (vanilla — no GSAP SplitText plugin needed)
     ========================================================================= */
  function splitWords(el) {
    if (!el) return [];
    const text   = el.textContent || '';
    const words  = text.split(' ');
    el.innerHTML = words.map(w =>
      `<span class="split-word" style="overflow:hidden;display:inline-block;vertical-align:bottom;margin-right:0.25em"><span class="split-inner" style="display:inline-block;transform:translateY(100%);opacity:0">${w}</span></span>`
    ).join('');
    return el.querySelectorAll('.split-inner');
  }

  function splitLines(el) {
    if (!el) return [];
    // Wrap each word, then re-group by line after layout
    const words = (el.textContent || '').split(' ');
    el.innerHTML = words.map(w =>
      `<span class="lw" style="display:inline-block;margin-right:0.28em">${w}</span>`
    ).join('');
    // Detect lines by y-position
    const spans  = Array.from(el.querySelectorAll('.lw'));
    const lines  = [];
    let curY     = -1;
    let curLine  = [];
    spans.forEach(span => {
      const y = span.getBoundingClientRect().top;
      if (Math.abs(y - curY) > 4) {
        if (curLine.length) lines.push(curLine);
        curLine = [];
        curY = y;
      }
      curLine.push(span);
    });
    if (curLine.length) lines.push(curLine);

    // Wrap each detected line in a clip container
    el.innerHTML = '';
    const lineEls = lines.map(lineSpans => {
      const clip = document.createElement('span');
      clip.style.cssText = 'overflow:hidden;display:block;';
      const inner = document.createElement('span');
      inner.style.cssText = 'display:block;transform:translateY(105%);opacity:0;';
      inner.className = 'split-line-inner';
      inner.textContent = lineSpans.map(s => s.textContent).join(' ');
      clip.appendChild(inner);
      el.appendChild(clip);
      return inner;
    });

    return lineEls;
  }

  function initSplitText() {
    if (prefersReduced) return;

    // Word splits — hero metadata
    document.querySelectorAll('[data-split-word]').forEach(el => {
      const inners = splitWords(el);
      // Animate on init (hero elements) with stagger
      if (el.closest('#heroTopMeta, #heroBrandBlock')) {
        // Will be animated in initHeroReveal after loader
        el._splitInners = inners;
      }
    });

    // Line splits — headings animated by ScrollTrigger
    document.querySelectorAll('[data-split-line]').forEach(el => {
      if (el.closest('#hero')) {
        // Hero heading — animate after loader
        el._lineInners = splitLines(el);
        return;
      }

      // All other sections — ScrollTrigger reveal
      const lineInners = splitLines(el);
      if (!lineInners.length) return;

      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.from(lineInners, {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
          yPercent: 105,
          opacity: 0,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.09,
        });
      }
    });
  }

  /* =========================================================================
     4. HERO REVEAL — runs after loader dismisses
     ========================================================================= */
  function initHeroReveal() {
    if (prefersReduced) return;

    const seq = [
      { el: document.getElementById('heroTopMeta'),        delay: 0    },
      { el: document.getElementById('heroEditorialLabel'), delay: 0.18 },
      { el: document.getElementById('heroLogoImg'),        delay: 0.34 },
      { el: document.getElementById('heroNarrativeBlock'), delay: 0.55 },
      { el: document.getElementById('heroScrollCue'),      delay: 0.78 },
    ];

    seq.forEach(({ el, delay }) => {
      if (!el) return;
      if (typeof gsap !== 'undefined') {
        gsap.from(el, {
          y: 30, opacity: 0,
          duration: 1.2, ease: 'expo.out', delay,
          clearProps: 'all'
        });
      } else {
        // fallback
        setTimeout(() => {
          el.style.transition = 'opacity 1.1s cubic-bezier(0.16,1,0.3,1), transform 1.1s cubic-bezier(0.16,1,0.3,1)';
          el.style.opacity    = '1';
          el.style.transform  = 'none';
        }, delay * 1000);
      }
    });

    // Hero heading word reveal
    const heroH2 = document.querySelector('.hero-statement-title');
    if (heroH2 && heroH2._lineInners) {
      if (typeof gsap !== 'undefined') {
        gsap.from(heroH2._lineInners, {
          yPercent: 105, opacity: 0,
          duration: 1.2, ease: 'expo.out', stagger: 0.1,
          delay: 0.6
        });
      }
    }

    // Split-word reveals in meta/label
    document.querySelectorAll('[data-split-word]').forEach(el => {
      if (!el.closest('#heroTopMeta, #heroBrandBlock')) return;
      const inners = el._splitInners || el.querySelectorAll('.split-inner');
      if (!inners.length) return;
      if (typeof gsap !== 'undefined') {
        gsap.from(inners, {
          yPercent: 100, opacity: 0,
          duration: 0.9, ease: 'expo.out', stagger: 0.04,
          delay: 0.15
        });
      }
    });
  }

  /* =========================================================================
     5. GSAP SCROLLTRIGGER SCENE CHOREOGRAPHY (DESKTOP & MOBILE MATCHMEDIA)
     ========================================================================= */
  function initScrollTriggerScenes() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const mm = gsap.matchMedia();

    const heroStage       = document.getElementById('hero');
    const heroVisualLayer = document.getElementById('heroVisualLayer');
    const heroVisualScrim = document.getElementById('heroVisualScrim');
    const heroBrandBlock  = document.getElementById('heroBrandBlock');
    const heroTopMeta     = document.getElementById('heroTopMeta');
    const heroNarrBlock   = document.getElementById('heroNarrativeBlock');
    const heroScrollCue   = document.getElementById('heroScrollCue');

    const mangaStage  = document.getElementById('story');
    const mangaPanels = [0,1,2,3,4].map(n => document.getElementById(`mangaPanel${n}`));
    const storyPhases = [0,1,2,3,4].map(n => document.getElementById(`storyPhase${n}`));
    const mangaCard   = document.getElementById('mangaViewportCard');

    const proofStage    = document.getElementById('proof');
    const proofHeroText = document.getElementById('proofHeroText');
    const telePods      = [1,2,3].map(n => document.getElementById(`telePod${n}`));

    const garmentStage  = document.getElementById('garment');
    const cinemaVisual  = document.getElementById('cinemaVisualStage');
    const callouts      = document.querySelectorAll('.anatomy-callout-item');

    // Universal MatchMedia Choreography for Desktop & Mobile
    mm.add({
      isDesktop: "(min-width: 861px)",
      isMobile:  "(max-width: 860px)"
    }, (context) => {
      const { isMobile } = context.conditions;

      // ── HERO SCENE ──────────────────────────────────────────────────────────
      if (heroStage) {
        gsap.timeline({
          scrollTrigger: {
            trigger: heroStage,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2,
          }
        })
        .fromTo(heroVisualLayer,
          { clipPath: isMobile ? 'inset(8% 6% 8% 6%)' : 'inset(14% 20% 14% 20%)', opacity: 0.88 },
          { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, ease: 'none' }, 0
        )
        .fromTo('.hero-visual-media',
          { scale: 1.0, y: 0 },
          { scale: isMobile ? 1.14 : 1.22, y: isMobile ? 35 : 70, ease: 'none' }, 0
        )
        .fromTo(heroVisualScrim,
          { opacity: 0.1 },
          { opacity: 0.9, ease: 'none' }, 0.7
        )
        .fromTo(heroBrandBlock,
          { y: 0, scale: 1, opacity: 1 },
          { y: isMobile ? -80 : -150, scale: isMobile ? 0.78 : 0.68, opacity: 0, ease: 'none' }, 0
        )
        .fromTo(heroTopMeta,
          { y: 0, opacity: 1 },
          { y: -22, opacity: 0, ease: 'none' }, 0
        )
        .fromTo(heroNarrBlock,
          { y: isMobile ? 32 : 55, opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' }, 0.33
        )
        .fromTo(heroNarrBlock,
          { y: 0, opacity: 1 },
          { y: isMobile ? -18 : -30, opacity: 0.1, ease: 'none' }, 0.8
        )
        .fromTo(heroScrollCue,
          { opacity: 1 },
          { opacity: 0, ease: 'none' }, 0
        );
      }

      // ── MANGA / STORY SCENE (ORIGIN → ACT I → ACT II → ACT III → ACT IV) ──────
      if (mangaStage) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: mangaStage,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.1,
          }
        });

        tl.fromTo(mangaCard,
          { scale: 0.94, opacity: 0.4 },
          { scale: 1.0, opacity: 1, ease: 'none', duration: 0.1 }
        );

        const totalActs = 5;
        const actDur = 0.88 / totalActs;

        mangaPanels.forEach((panel, idx) => {
          if (!panel) return;
          const start = 0.12 + idx * actDur;
          const mid   = start + actDur * 0.5;
          const img   = panel.querySelector('img');

          if (idx === 0) {
            gsap.set(panel, { autoAlpha: 1, y: 0, scale: 1 });
          } else {
            tl.fromTo(panel,
              { autoAlpha: 0, y: isMobile ? 18 : 30, scale: 0.95 },
              { autoAlpha: 1, y: 0, scale: 1, ease: 'none', duration: actDur * 0.4 },
              start
            );
          }

          if (img) {
            tl.fromTo(img, { scale: 1.0 }, { scale: 1.06, ease: 'none', duration: actDur }, start);
          }

          if (idx < totalActs - 1) {
            tl.to(panel,
              { autoAlpha: 0, y: isMobile ? -12 : -20, scale: 0.94, ease: 'none', duration: actDur * 0.35 },
              mid
            );
          }

          const phase = storyPhases[idx];
          if (phase) {
            if (idx === 0) {
              gsap.set(phase, { autoAlpha: 1, y: 0 });
            } else {
              tl.fromTo(phase,
                { autoAlpha: 0, y: isMobile ? 16 : 25 },
                { autoAlpha: 1, y: 0, ease: 'none', duration: actDur * 0.4 },
                start
              );
            }

            if (idx < totalActs - 1) {
              tl.to(phase,
                { autoAlpha: 0, y: isMobile ? -10 : -15, ease: 'none', duration: actDur * 0.35 },
                mid
              );
            }
          }
        });
      }

      // ── PROOF / TELEMETRY ────────────────────────────────────────────────────
      if (proofStage) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: proofStage,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.1,
            onEnter: triggerCount,
          }
        });

        tl.fromTo(proofHeroText,
          { y: isMobile ? 24 : 38, opacity: 0.25 },
          { y: 0, opacity: 1, ease: 'none', duration: 0.3 }
        );

        telePods.forEach((pod, idx) => {
          if (!pod) return;
          const start = 0.08 + idx * 0.12;
          tl.fromTo(pod,
            { scale: 0.9, y: isMobile ? 30 : 50, opacity: 0.12 },
            { scale: 1, y: 0, opacity: 1, ease: 'none', duration: 0.3 },
            start
          );
        });
      }

      // ── GARMENT CINEMA ───────────────────────────────────────────────────────
      if (garmentStage) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: garmentStage,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.0,
          }
        });

        tl.fromTo(cinemaVisual,
          { scale: 0.88 },
          { scale: 1.02, ease: 'none', duration: 0.45 }
        );

        tl.add(() => setGarmentView('back'), 0.48);
        tl.add(() => setGarmentView('front'), 0.05);

        callouts.forEach((c, idx) => {
          const st = 0.14 + idx * 0.17;
          tl.fromTo(c,
            { x: isMobile ? 12 : 38, opacity: isMobile ? 0.75 : 0.08 },
            { x: 0, opacity: 1, ease: 'none', duration: 0.24 },
            st
          );
        });
      }

      // ── SCENE 6: SHOPIFY EDITIONS-STYLE PINNED LOOKBOOK HORIZONTAL SCROLL ──────
      const lookbookStage  = document.getElementById('lookbook');
      const lookbookTrack  = document.getElementById('lookbookRunwayTrack');
      const lookbookSlides = document.querySelectorAll('.lookbook-slide');

      if (lookbookStage && lookbookTrack && lookbookSlides.length) {
        const getScrollDistance = () => {
          const trackWidth = lookbookTrack.scrollWidth;
          const containerWidth = lookbookTrack.parentElement ? lookbookTrack.parentElement.clientWidth : window.innerWidth;
          return -(trackWidth - containerWidth + (isMobile ? 32 : 80));
        };

        const lookbookTl = gsap.timeline({
          scrollTrigger: {
            trigger: lookbookStage,
            start: 'top top',
            end: 'bottom bottom',
            scrub: isMobile ? 1.0 : 1.25,
            invalidateOnRefresh: true,
          }
        });

        // 1. Scrub horizontal track translation driven by vertical scroll
        lookbookTl.to(lookbookTrack, {
          x: getScrollDistance,
          ease: 'none',
          duration: 1.0,
        });

        // 2. Individual slide scale and depth choreography
        const totalSlides = lookbookSlides.length;
        lookbookSlides.forEach((slide, idx) => {
          const img = slide.querySelector('.slide-media-box img');
          const progressStep = idx / (totalSlides - 1);
          const dur = 0.28;
          const startAt = Math.max(0, progressStep * 0.72 - 0.04);

          lookbookTl.fromTo(slide,
            { scale: 0.93, opacity: 0.85 },
            { scale: 1.0, opacity: 1, ease: 'sine.out', duration: dur },
            startAt
          );

          if (img) {
            lookbookTl.fromTo(img,
              { scale: 1.0 },
              { scale: 1.08, ease: 'none', duration: dur * 1.4 },
              startAt
            );
          }
        });

        // 3. Arrow navigation buttons (← / →)
        const trackPrevBtn = document.getElementById('trackPrevBtn');
        const trackNextBtn = document.getElementById('trackNextBtn');

        if (trackPrevBtn && trackNextBtn) {
          const stepPercent = 1 / (totalSlides - 1);

          trackPrevBtn.onclick = (e) => {
            e.preventDefault();
            const st = lookbookTl.scrollTrigger;
            if (!st) return;
            const targetProg = Math.max(0, st.progress - stepPercent);
            const targetY    = st.start + targetProg * (st.end - st.start);

            if (window.gsap && gsap.plugins && gsap.plugins.scrollTo) {
              gsap.to(window, { scrollTo: targetY, duration: 0.7, ease: 'power2.out' });
            } else if (window.lenis) {
              window.lenis.scrollTo(targetY, { duration: 0.7 });
            } else {
              window.scrollTo({ top: targetY, behavior: 'smooth' });
            }
          };

          trackNextBtn.onclick = (e) => {
            e.preventDefault();
            const st = lookbookTl.scrollTrigger;
            if (!st) return;
            const targetProg = Math.min(1, st.progress + stepPercent);
            const targetY    = st.start + targetProg * (st.end - st.start);

            if (window.gsap && gsap.plugins && gsap.plugins.scrollTo) {
              gsap.to(window, { scrollTo: targetY, duration: 0.7, ease: 'power2.out' });
            } else if (window.lenis) {
              window.lenis.scrollTo(targetY, { duration: 0.7 });
            } else {
              window.scrollTo({ top: targetY, behavior: 'smooth' });
            }
          };
        }
      }
    });

    // ── GENERAL VIEWPORT STAGGER REVEALS (FOR NON-PINNED SECTIONS) ───────────
    const revealItems = document.querySelectorAll(
      '.garment-card, .shop-item-card, .section-label, .lookbook-header-bar'
    );
    revealItems.forEach(item => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 86%',
          once: true,
        },
        y: 28,
        opacity: 0,
        duration: 0.95,
        ease: 'expo.out'
      });
    });

    const finaleStage = document.getElementById('finale');
    if (finaleStage) {
      const finaleItems = [
        '#finaleLogoImg', '.finale-grand-title', '.finale-lead-text',
        '.finale-founders-duo', '.finale-action-row'
      ].map(s => document.querySelector(s)).filter(Boolean);

      gsap.from(finaleItems, {
        scrollTrigger: {
          trigger: finaleStage,
          start: 'top 78%',
          once: true,
        },
        y: 28,
        opacity: 0,
        duration: 1.0,
        ease: 'expo.out',
        stagger: 0.1
      });
    }
  }

  /* =========================================================================
     6. WEBGL VELOCITY-REACTIVE CANVAS OVERLAY (scroll-speed fluid noise)
     ========================================================================= */
  function initWebGLCanvas() {
    const canvas = document.getElementById('hero-webgl-canvas');
    if (!canvas || prefersReduced) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false });
    if (!gl) return;

    // Resize
    function resize() {
      const scale = isDesktop() ? 1.0 : 0.65;
      canvas.width  = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Minimal vertex + fragment shader producing scroll-velocity reactive noise
    const vert = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;

    const frag = `
      precision mediump float;
      uniform float u_time;
      uniform float u_velocity;
      uniform vec2  u_resolution;

      // Smooth hash noise
      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(dot(hash2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
              dot(hash2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
          mix(dot(hash2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
              dot(hash2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float vel = clamp(abs(u_velocity) * 0.004, 0.0, 1.0);

        // Layered noise
        float n  = noise(uv * 3.5 + u_time * 0.08);
        float n2 = noise(uv * 7.0 - u_time * 0.05 + vec2(n * 0.3));
        float n3 = noise(uv * 2.0 + u_time * 0.03 + vec2(n2 * 0.2, n * 0.1));

        float val = n * 0.5 + n2 * 0.3 + n3 * 0.2;

        // Edge vignette (stronger at corners)
        float vign = 1.0 - smoothstep(0.3, 0.95, length(uv - 0.5) * 1.8);

        // Velocity-reactive intensity
        float intensity = 0.022 + vel * 0.055;

        float alpha = val * intensity * vign;
        gl_FragColor = vec4(1.0, 1.0, 1.0, max(0.0, alpha));
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uVel  = gl.getUniformLocation(prog, 'u_velocity');
    const uRes  = gl.getUniformLocation(prog, 'u_resolution');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let t0 = performance.now();
    function frame(now) {
      const t = (now - t0) * 0.001;
      gl.uniform1f(uTime, t);
      gl.uniform1f(uVel,  state.scrollVelocity);
      gl.uniform2f(uRes,  canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* =========================================================================
     7. SCROLL-VELOCITY PARALLAX (elements accelerate with scroll speed)
     ========================================================================= */
  function initVelocityParallax() {
    if (prefersReduced) return;

    const targets = document.querySelectorAll(
      '.manga-viewport-card, .telemetry-pod, .cinema-visual-stage'
    );

    let rafId;
    function tick() {
      const vel = state.scrollVelocity;
      targets.forEach(el => {
        const shift = vel * 0.08;
        el.style.transform = `translateY(${shift}px)`;
      });
      rafId = requestAnimationFrame(tick);
    }
    tick();
  }

  /* =========================================================================
     8. NAVIGATION
     ========================================================================= */
  const siteNav    = document.getElementById('siteNav');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu    = document.getElementById('navMenu');
  const navItems   = document.querySelectorAll('.nav-item');
  const sections   = document.querySelectorAll('[data-scene], section[id]');
  let   lastScrollY = 0;

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    if (siteNav) {
      siteNav.classList.toggle('nav--scrolled', sy > 80);
      siteNav.classList.toggle('nav--hidden', sy > lastScrollY && sy > 280);
    }
    lastScrollY = sy;

    // Active section indicator
    let active = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 140) active = sec.id;
    });
    if (active !== state.activeNavSection) {
      state.activeNavSection = active;
      navItems.forEach(a => {
        const href = a.getAttribute('href')?.replace('#', '');
        a.classList.toggle('active', href === active);
      });
    }
  }, { passive: true });

  // Mobile menu
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.classList.toggle('is-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // Contact Popover Toggle
  const contactDropdownWrap = document.getElementById('contactDropdownWrap');
  const contactTriggerBtn = document.getElementById('contactTriggerBtn');
  if (contactDropdownWrap && contactTriggerBtn) {
    contactTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = contactDropdownWrap.classList.toggle('is-open');
      contactTriggerBtn.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!contactDropdownWrap.contains(e.target)) {
        contactDropdownWrap.classList.remove('is-open');
        contactTriggerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Magnetic nav links
  navItems.forEach(item => {
    item.addEventListener('mousemove', e => {
      const r = item.getBoundingClientRect();
      item.style.transform = `translate(${(e.clientX - r.left - r.width/2)*0.22}px,${(e.clientY - r.top - r.height/2)*0.22}px)`;
    });
    item.addEventListener('mouseleave', () => { item.style.transform = ''; });
  });

  /* =========================================================================
     9. CUSTOM CURSOR
     ========================================================================= */
  function initCursor() {
    if (prefersReduced || !isDesktop()) return;

    const cur = document.createElement('div');
    cur.id = 'xtich-cursor';
    cur.innerHTML = '<div class="cursor-dot"></div><div class="cursor-ring"></div>';
    document.body.appendChild(cur);

    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    document.querySelectorAll('button, a, [data-open-product], .size-chip, .garment-card-media, .slide-media-box, .panel-img-box').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('cursor--hover'));
      el.addEventListener('mouseleave', () => cur.classList.remove('cursor--hover'));
    });

    function tickCursor() {
      cx = lerp(cx, mx, 0.12); cy = lerp(cy, my, 0.12);
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(tickCursor);
    }
    requestAnimationFrame(tickCursor);
  }

  /* =========================================================================
     10. SCROLL PROGRESS LINE
     ========================================================================= */
  function initProgressLine() {
    const line = document.createElement('div');
    line.id = 'xtich-progress-line';
    document.body.appendChild(line);
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      line.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* =========================================================================
     11. TELEMETRY COUNT-UP
     ========================================================================= */
  function animateCount(elem, target, suffix, dur) {
    if (!elem) return;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      elem.textContent = `${Math.floor(easeOut3(p) * target)}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function triggerCount() {
    if (state.countedTelemetry) return;
    state.countedTelemetry = true;
    animateCount(document.querySelector('#telePod1 .pod-number'), 300, '+', 1500);
    animateCount(document.querySelector('#telePod2 .pod-number'), 180, '+', 1500);
    animateCount(document.querySelector('#telePod3 .pod-number'), 0,   '%', 900);
  }

  // Fallback IntersectionObserver for count-up if GSAP not available
  const proofEl = document.getElementById('proof');
  if (proofEl) {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { triggerCount(); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(proofEl);
  }

  /* =========================================================================
     12. INTERSECTION OBSERVER REVEALS (fallback for non-GSAP elements)
     ========================================================================= */
  function initRevealFallbacks() {
    const targets = document.querySelectorAll(
      '.collection-section-header, .shop-header-row, .finale-lead-text'
    );
    targets.forEach(el => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(26px)';
      el.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';
    });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity   = '1';
          e.target.style.transform = 'none';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    targets.forEach(el => obs.observe(el));
  }

  /* =========================================================================
     13. GARMENT CINEMA VIEW TOGGLE
     ========================================================================= */
  const btnCinemaFront = document.getElementById('btnCinemaFront');
  const btnCinemaBack  = document.getElementById('btnCinemaBack');
  const cinemaFrontImg = document.getElementById('cinemaFrontImg');
  const cinemaBackImg  = document.getElementById('cinemaBackImg');

  function setGarmentView(view) {
    const isFront = view === 'front';
    btnCinemaFront?.classList.toggle('active',  isFront);
    btnCinemaBack?.classList.toggle('active',  !isFront);
    cinemaFrontImg?.classList.toggle('active',  isFront);
    cinemaBackImg?.classList.toggle('active',  !isFront);
  }

  btnCinemaFront?.addEventListener('click', () => setGarmentView('front'));
  btnCinemaBack?.addEventListener('click',  () => setGarmentView('back'));



  /* =========================================================================
     15. MANGA LIGHTBOX
     ========================================================================= */
  const mangaLightbox    = document.getElementById('mangaLightbox');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxImg      = document.getElementById('lightboxImg');
  const lightboxCaption  = document.getElementById('lightboxCaption');

  function openLightbox(src, cap) {
    if (!mangaLightbox) return;
    if (lightboxImg)     lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = cap || '';
    mangaLightbox.classList.add('open');
    mangaLightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    mangaLightbox?.classList.remove('open');
    mangaLightbox?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-expand-manga]').forEach(t => {
    t.addEventListener('click', () => openLightbox(t.dataset.expandManga, t.dataset.caption));
  });
  lightboxCloseBtn?.addEventListener('click', closeLightbox);
  mangaLightbox?.addEventListener('click', e => { if (e.target === mangaLightbox) closeLightbox(); });

  /* =========================================================================
     16. SIZE SELECTORS & QUANTITY PICKERS
     ========================================================================= */
  document.querySelectorAll('[data-size-group], [data-shop-size]').forEach(group => {
    group.addEventListener('click', e => {
      const btn = e.target.closest('.size-chip');
      if (!btn) return;
      group.querySelectorAll('.size-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = group.dataset.sizeGroup || group.dataset.shopSize;
      if (key) state.selectedSizes[key] = btn.textContent.trim();
    });
  });

  document.querySelectorAll('[data-qty-picker]').forEach(picker => {
    const display = picker.querySelector('[data-qty-display]');
    const key     = picker.dataset.qtyPicker;
    picker.addEventListener('click', e => {
      const btn = e.target.closest('[data-qty-act]');
      if (!btn || !display) return;
      let cur = state.quantities[key] || 1;
      cur = btn.dataset.qtyAct === 'inc' ? cur + 1 : Math.max(1, cur - 1);
      state.quantities[key] = cur;
      display.textContent   = cur;
    });
  });

  /* =========================================================================
     17. TOAST
     ========================================================================= */
  const siteToast = document.getElementById('siteToast');
  let toastTimer;
  function showToast(msg) {
    if (!siteToast) return;
    siteToast.textContent = msg;
    siteToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => siteToast.classList.remove('show'), 3600);
  }

  /* =========================================================================
     18. PRODUCT MODAL
     ========================================================================= */
  const productModal      = document.getElementById('productModal');
  const modalCloseBtn     = document.getElementById('modalCloseBtn');
  const modalProductImg   = document.getElementById('modalProductImg');
  const modalProductSeries= document.getElementById('modalProductSeries');
  const modalProductTitle = document.getElementById('modalProductTitle');
  const modalProductSpec  = document.getElementById('modalProductSpec');
  const modalProductDesc  = document.getElementById('modalProductDesc');
  const modalSizeGroup    = document.getElementById('modalSizeGroup');
  const modalReserveBtn   = document.getElementById('modalReserveBtn');
  let   activeModalProduct= 'hoodie';

  function openProductModal(id) {
    const p = PRODUCTS[id] || PRODUCTS.hoodie;
    activeModalProduct = id;
    if (modalProductImg)     modalProductImg.src          = p.image;
    if (modalProductSeries)  modalProductSeries.textContent= p.series;
    if (modalProductTitle)   modalProductTitle.textContent = p.title;
    if (modalProductSpec)    modalProductSpec.textContent  = p.spec;
    if (modalProductDesc)    modalProductDesc.textContent  = p.desc;
    modalSizeGroup?.querySelectorAll('.size-chip').forEach((b, i) => b.classList.toggle('active', i === 0));
    productModal?.classList.add('open');
    productModal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }
  function closeProductModal() {
    productModal?.classList.remove('open');
    productModal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  modalCloseBtn?.addEventListener('click', closeProductModal);
  productModal?.addEventListener('click', e => { if (e.target === productModal) closeProductModal(); });
  document.querySelectorAll('[data-open-product]').forEach(t => {
    t.addEventListener('click', e => { e.preventDefault(); openProductModal(t.dataset.openProduct); });
  });
  modalSizeGroup?.addEventListener('click', e => {
    const b = e.target.closest('.size-chip');
    if (!b) return;
    modalSizeGroup.querySelectorAll('.size-chip').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
  modalReserveBtn?.addEventListener('click', () => {
    const sz = modalSizeGroup?.querySelector('.size-chip.active')?.textContent.trim() || 'S';
    addToBag(activeModalProduct, sz, 1);
    closeProductModal();
    openBag();
  });

  /* =========================================================================
     19. RESERVATION BAG
     ========================================================================= */
  const bagDrawer       = document.getElementById('bagDrawer');
  const bagOverlay      = document.getElementById('bagOverlay');
  const openBagBtn      = document.getElementById('openBagBtn');
  const bagCloseBtn     = document.getElementById('bagCloseBtn');
  const bagItemsContainer = document.getElementById('bagItemsContainer');
  const navBagCount     = document.getElementById('navBagCount');
  const bagCheckoutBtn  = document.getElementById('bagCheckoutBtn');

  function openBag() {
    bagDrawer?.classList.add('open');
    bagOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
  }
  function closeBag() {
    bagDrawer?.classList.remove('open');
    bagOverlay?.classList.remove('open');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
  }

  openBagBtn?.addEventListener('click', openBag);
  bagCloseBtn?.addEventListener('click', closeBag);
  bagOverlay?.addEventListener('click', closeBag);

  function addToBag(id, size, qty = 1) {
    const p = PRODUCTS[id]; if (!p) return;
    const i = state.bag.findIndex(x => x.id === id && x.size === size);
    if (i > -1) state.bag[i].qty += qty;
    else state.bag.push({ id, title: p.title, spec: p.spec, image: p.image, size, qty });
    renderBag();
    showToast(`${p.title} (Size ${size}) added to reservation bag.`);
  }

  function removeFromBag(idx) { state.bag.splice(idx, 1); renderBag(); }

  function renderBag() {
    const total = state.bag.reduce((s, x) => s + x.qty, 0);
    if (navBagCount) navBagCount.textContent = total;
    if (!bagItemsContainer) return;
    if (!state.bag.length) {
      bagItemsContainer.innerHTML = `<div class="empty-bag-state"><p>Your reservation bag is empty.</p><p style="margin-top:0.5rem;font-size:0.82rem;color:var(--graphite-400)">Select a piece from the collection to reserve your allocation.</p></div>`;
      return;
    }
    bagItemsContainer.innerHTML = state.bag.map((item, idx) => `
      <div class="bag-item-card">
        <img src="${item.image}" alt="${item.title}">
        <div class="bag-item-info">
          <span class="bag-item-title">${item.title}</span>
          <span class="bag-item-meta">Size: ${item.size} · Qty: ${item.qty}</span>
          <button class="bag-item-remove" data-remove-item="${idx}">Remove</button>
        </div>
      </div>`).join('');
    bagItemsContainer.querySelectorAll('[data-remove-item]').forEach(btn => {
      btn.addEventListener('click', () => removeFromBag(parseInt(btn.dataset.removeItem, 10)));
    });
  }

  document.querySelectorAll('[data-reserve-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      addToBag(btn.dataset.reserveBtn, state.selectedSizes[btn.dataset.reserveBtn] || 'S', 1);
      openBag();
    });
  });
  document.querySelectorAll('[data-add-to-bag]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.addToBag;
      addToBag(id, state.selectedSizes[id] || 'S', state.quantities[id] || 1);
      openBag();
    });
  });
  bagCheckoutBtn?.addEventListener('click', () => {
    if (!state.bag.length) { showToast('Your reservation bag is empty.'); return; }
    showToast('Priority Reservation Confirmed! You are first in line for the batch drop.');
    setTimeout(closeBag, 1200);
  });

  /* =========================================================================
     20. KEYBOARD ESC
     ========================================================================= */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeProductModal(); closeLightbox(); closeBag();
    if (navMenu?.classList.contains('open')) {
      navMenu.classList.remove('open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      menuToggle?.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    }
  });

  /* =========================================================================
     INIT — Wait for GSAP/Lenis to be ready (deferred scripts)
     ========================================================================= */
  function boot() {
    initLenis();
    initSplitText();
    initScrollTriggerScenes();
    initWebGLCanvas();
    initVelocityParallax();
    initCursor();
    initProgressLine();
    initRevealFallbacks();
    renderBag();
  }

  // Scripts are deferred — poll until GSAP and Lenis are available
  let bootAttempts = 0;
  function waitForLibraries() {
    bootAttempts++;
    const gsapReady  = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    const lenisReady = typeof Lenis !== 'undefined';
    if ((gsapReady && lenisReady) || bootAttempts > 60) {
      boot();
    } else {
      setTimeout(waitForLibraries, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForLibraries);
  } else {
    waitForLibraries();
  }

})();
