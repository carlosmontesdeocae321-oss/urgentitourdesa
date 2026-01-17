// No se requiere JS para el fondo dividido; placeholder.
document.addEventListener('DOMContentLoaded', () => {
  // Toggle background photo mode based on CSS variable
  function applyBgPhotoMode(){
    const root = document.documentElement;
    const url = getComputedStyle(root).getPropertyValue('--bg-photo-url').trim();
    const bgEl = document.querySelector('.bg-photo');
    const bgStyle = bgEl ? getComputedStyle(bgEl) : null;
    const imgVal = bgStyle ? bgStyle.backgroundImage : 'none';
    const opVal = bgStyle ? parseFloat(bgStyle.opacity || '0') : 0;
    const hasUrl = url && url !== 'none' && url.includes('url(');
    const hasImg = imgVal && imgVal !== 'none';
    const visible = (hasUrl || hasImg) && opVal > 0.02; // treat near-zero opacity as disabled
    document.body.classList.toggle('has-bg-photo', visible);
  }
  applyBgPhotoMode();
  // Map hotspots to buttons so hover and clicks work when buttons overlap
  // Map hotspots to icon images (buttons were replaced by plain images)
  const map = [
    {hot: '.hotspot-red', btn: '.icon-red'},
    {hot: '.hotspot-green', btn: '.icon-green'},
    {hot: '.hotspot-blue', btn: '.icon-blue'}
  ];

  // canvases used for pixel-perfect hit testing (keyed by button selector)
  const canvases = new Map();

  map.forEach(pair => {
    const hot = document.querySelector(pair.hot);
    const btn = document.querySelector(pair.btn); // now the image element
    if (!hot || !btn) return;

    const handleAction = (el) => {
      // If element is an anchor/image with an href or data-href, navigate to it.
      const href = (el && el.getAttribute) ? (el.getAttribute('href') || el.dataset.href) : null;
      if (!href || href === '#') return;
      window.location.href = href;
    };

    // Pixel-perfect hover: draw the button image into an offscreen canvas
    const img = (btn.tagName === 'IMG') ? btn : btn.querySelector && btn.querySelector('img');
    const canvas = document.createElement('canvas');
    canvases.set(pair.btn, canvas);
    if (img && !img.complete) {
      img.addEventListener('load', () => redrawCanvases && redrawCanvases(), {once:true});
    }

    // track hover state so we only add/remove class when it changes
    let isHovering = false;

    const isOpaqueAt = (clientX, clientY) => {
      // If we don't have the button image or canvas, fallback to a
      // conservative bounding-area test: only the top 30% of the image
      // is considered clickable. This prevents treating the whole
      // image as clickable when pixel testing is unavailable (eg. CORS).
      const rect = img ? img.getBoundingClientRect() : null;
      if (!img || !canvases.has(pair.btn) || !rect) {
        // Fallback: if we can't do pixel testing, consider the whole
        // bounding rect as active so clicks on visible portions work.
        if (!rect) return false;
        const xx = Math.floor(clientX - rect.left);
        const yy = Math.floor(clientY - rect.top);
        return (xx >= 0 && yy >= 0 && xx < rect.width && yy < rect.height);
      }
      const x = Math.floor(clientX - rect.left);
      const y = Math.floor(clientY - rect.top);
      const c = canvases.get(pair.btn);
      const ctx = c.getContext && c.getContext('2d', { willReadFrequently: true });
      // If we can't access canvas 2D context, fallback to top-30% hit test
      if (!ctx) {
        // If canvas is tainted or context unavailable, accept full bounding
        // box to avoid blocking clicks on visible parts of the icon.
        return (x >= 0 && y >= 0 && x < rect.width && y < rect.height);
      }
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) return false;
      try {
        const d = ctx.getImageData(x, y, 1, 1).data;
        return d[3] > 10; // alpha > ~4%
      } catch (err) {
        // If getImageData fails (tainted canvas), fallback to accepting the
        // full bounding box so visible parts of the icon remain clickable.
        return (x >= 0 && y >= 0 && x < rect.width && y < rect.height);
      }
    };

    hot.addEventListener('mousemove', (e) => {
      const ok = isOpaqueAt(e.clientX, e.clientY);
      if (ok && !isHovering) {
        isHovering = true;
        console.log('hotspot pixel enter ->', pair.hot);
        btn.classList.add('hover');
        // no vibration on hover: Chrome/Safari require a user gesture
      } else if (!ok && isHovering) {
        isHovering = false;
        console.log('hotspot pixel leave ->', pair.hot);
        btn.classList.remove('hover');
      }
    });

    hot.addEventListener('mouseleave', () => {
      if (isHovering) {
        isHovering = false;
        btn.classList.remove('hover');
      }
    });

    // Prevent default on both hotspot and button and handle navigation explicitly
    hot.addEventListener('click', (e) => {
      e.preventDefault();
      // vibrate only on explicit user gesture (click/tap)
      try{ if (navigator.vibrate) navigator.vibrate(20); }catch(e){}
      if (isOpaqueAt(e.clientX, e.clientY)) {
        console.log('hotspot clicked ->', pair.hot, '-> forwarding to hotspot href');
        // Use the hotspot's own href for navigation (anchors in the DOM)
        handleAction(hot);
      } else {
        console.log('hotspot click ignored (transparent) ->', pair.hot);
      }
    });
    btn.addEventListener('mouseenter', () => console.log('icon mouseenter ->', pair.btn));
    btn.addEventListener('mouseleave', () => console.log('icon mouseleave ->', pair.btn));
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // vibrate only on explicit user gesture (click/tap)
      try{ if (navigator.vibrate) navigator.vibrate(20); }catch(e){}
      const ok = isOpaqueAt(e.clientX, e.clientY);
      if (ok) {
        console.log('icon clicked ->', pair.btn);
        // Prefer hotspot href if present, otherwise use the icon's data-href
        const target = (hot && hot.getAttribute && hot.getAttribute('href') && hot.getAttribute('href') !== '#') ? hot : btn;
        handleAction(target);
      } else {
        console.log('icon click ignored (outside active area) ->', pair.btn);
      }
    });
  });

    // Draw each button image into its offscreen canvas at the displayed size.
    function redrawCanvases(){
      map.forEach(pair => {
        const btn = document.querySelector(pair.btn);
        if (!btn) return;
        const img = (btn && btn.tagName === 'IMG') ? btn : (btn.querySelector && btn.querySelector('img'));
        if (!img || !canvases.has(pair.btn)) return;
        const rect = img.getBoundingClientRect();
        const c = canvases.get(pair.btn);
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        const sizeKey = `${w}x${h}`;
        if (c.width !== w || c.height !== h) {
          c.width = w;
          c.height = h;
        }
        const ctx = c.getContext && c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        // Avoid redrawing if already drawn at this size
        if (c._lastSize === sizeKey) return;
        try{
          ctx.clearRect(0,0,c.width,c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          c._lastSize = sizeKey;
        }catch(err){
          // ignore cross-origin or other draw errors
        }
      });
    }

    // Position hotspots so they match the buttons. The blue hotspot
    // will be limited to the top 30% of its button image.
    function positionHotspots(){
      const hotspotsParent = document.querySelector('.hotspots');
      if (!hotspotsParent) return;
      const parentRect = hotspotsParent.getBoundingClientRect();
      map.forEach(pair => {
        const hot = document.querySelector(pair.hot);
        const btn = document.querySelector(pair.btn);
        if (!hot || !btn) return;
        const img = (btn.tagName === 'IMG') ? btn : (btn.querySelector && btn.querySelector('img'));
        const btnRect = img ? img.getBoundingClientRect() : btn.getBoundingClientRect();
        const top = Math.round(btnRect.top - parentRect.top);
        const left = Math.round(btnRect.left - parentRect.left);
        const width = Math.round(btnRect.width);
        let height = Math.round(btnRect.height);
        // Position hotspots relative to their container so they track layout changes
        hot.style.position = 'absolute';
        hot.style.top = `${top}px`;
        hot.style.left = `${left}px`;
        hot.style.width = `${width}px`;
        hot.style.height = `${height}px`;
        hot.style.transform = 'none';
        hot.style.marginLeft = '0';
      });
    }

    // initial draw, position hotspots, and on resize only (no scroll handler)
    redrawCanvases();
    positionHotspots();
    // Align gradient split with car position so the line sits below the car
    function alignSplitToCar(){
      const car = document.querySelector('.car');
      if (!car) return;
      const rect = car.getBoundingClientRect();
      // place the split a bit below the car bottom to keep the line between car and CTAs
      // use a smaller gap so the line sits closer to the car (raised)
      const gap = Math.max(6, Math.round(rect.height * 0.02));
      const split = Math.round(rect.bottom + gap);
      document.documentElement.style.setProperty('--split', `${split}px`);
    }
    alignSplitToCar();
    
    let resizeTick = false;
    window.addEventListener('resize', () => {
      if (resizeTick) return;
      resizeTick = true;
      requestAnimationFrame(() => {
        redrawCanvases();
        positionHotspots();
        alignSplitToCar();
        resizeTick = false;
      });
    }, {passive:true});

    // Keep split aligned when the page is scrolled or device orientation changes.
    let scrollTick = false;
    window.addEventListener('scroll', () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        positionHotspots();
        alignSplitToCar();
        scrollTick = false;
      });
    }, {passive:true});

    window.addEventListener('orientationchange', () => {
      requestAnimationFrame(() => {
        redrawCanvases();
        positionHotspots();
        alignSplitToCar();
      });
    });

    // Keep hotspots synced with animated icons at a throttled rate
    (function startHotspotSync(){
      let last = 0;
      function loop(now){
        if (!last || (now - last) > 80) { // ~12fps updates
          try{ positionHotspots(); }catch(e){}
          last = now;
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }());

    // Also ensure alignment after all images have loaded (car image may change layout)
    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        redrawCanvases();
        positionHotspots();
        alignSplitToCar();
        applyBgPhotoMode();
      });
    });

  // Claim removed — no claim image to check

});
