// lib/fbpixel.ts
// Facebook Pixel client-side library (client only)

"use client";

// Track initialized pixel IDs to prevent double init
const initializedPixels = new Set<string>();
let scriptLoading = false;
let scriptLoadPromise: Promise<void> | null = null;

// Initialize fbq queue immediately (before script loads)
if (typeof window !== "undefined") {
  const w = window as any;
  if (!w.fbq) {
    (function (f: any, b: Document, e: string, n?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        (n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments));
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = false;
      n.version = "2.0";
      n.queue = [];
    })(window, document, "script");
  }
}

/**
 * Load Facebook Pixel script and wait for it to be ready
 */
const loadPixelScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is undefined"));
  }

  const w = window as any;

  // If already loaded, resolve immediately
  if (w.fbq && w.fbq.loaded) {
    return Promise.resolve();
  }

  // If script is already loading, return the existing promise
  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  // If fbq function exists but script not loaded yet, check if script is in DOM
  if (w.fbq && !w.fbq.loaded) {
    // Check if script is already in DOM (might be loading)
    const existingScript = document.querySelector('script[src*="fbevents.js"]');
    if (existingScript) {
      // Script is loading, wait for it
      scriptLoadPromise = new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 40; // 4 seconds max wait
        const checkLoaded = () => {
          attempts++;
          if (w.fbq && (w.fbq.loaded || w.fbq.callMethod)) {
            if (!w.fbq.loaded) {
              w.fbq.loaded = true;
            }
            resolve();
          } else if (attempts < maxAttempts) {
            setTimeout(checkLoaded, 100);
          } else {
            // Timeout - proceed anyway if script is in DOM
            console.warn("[FB Pixel] Script in DOM but not ready, proceeding");
            if (w.fbq) {
              w.fbq.loaded = true;
            }
            resolve();
          }
        };
        checkLoaded();
      });
      return scriptLoadPromise;
    }
    // Script not in DOM, will be loaded below
  }

  // Start loading the script
  scriptLoading = true;
  scriptLoadPromise = new Promise((resolve, reject) => {
    // fbq should already be initialized at module load, but ensure it exists
    if (!w.fbq) {
      (function (f: any, b: Document, e: string, n?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          (n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments));
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = false;
        n.version = "2.0";
        n.queue = [];
      })(window, document, "script");
    }

    // Create and load the script
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    
    script.onload = () => {
      console.log("[FB Pixel] Script fbevents.js loaded successfully");
      // Facebook sets fbq.loaded automatically, but we wait a bit to ensure it's ready
      let attempts = 0;
      const maxAttempts = 20; // 2 seconds max wait
      
      const checkLoaded = () => {
        attempts++;
        // Check if Facebook has set loaded, or if callMethod exists (indicates script is ready)
        if (w.fbq && (w.fbq.loaded || w.fbq.callMethod)) {
          if (!w.fbq.loaded) {
            w.fbq.loaded = true;
          }
          console.log("[FB Pixel] fbq.loaded set to true, script ready");
          scriptLoading = false;
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(checkLoaded, 100);
        } else {
          // Even if loaded flag isn't set, resolve if script is in DOM
          console.warn("[FB Pixel] Script loaded but fbq.loaded not set, proceeding anyway");
          if (w.fbq) {
            w.fbq.loaded = true;
          }
          scriptLoading = false;
          resolve();
        }
      };
      
      checkLoaded();
    };

    script.onerror = (error) => {
      console.error("[FB Pixel] Failed to load fbevents.js script", error);
      scriptLoading = false;
      scriptLoadPromise = null;
      reject(new Error("Failed to load Facebook Pixel script"));
    };

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  });

  return scriptLoadPromise;
};

/**
 * Initialize Facebook Pixel for a given pixel ID
 * Prevents double initialization on Next.js navigation
 */
export const initPixel = async (pixelId: string): Promise<void> => {
  if (!pixelId || typeof window === "undefined") {
    console.warn("[FB Pixel] initPixel called with invalid pixelId or window undefined");
    return;
  }

  // Prevent double init for the same pixel
  if (initializedPixels.has(pixelId)) {
    console.log("[FB Pixel] Pixel already initialized for ID:", pixelId);
    return;
  }

  try {
    console.log("[FB Pixel] Loading pixel script...");
    // Wait for script to load
    await loadPixelScript();
    console.log("[FB Pixel] Script loaded, initializing pixel...");

    const w = window as any;

    // Initialize this specific pixel
    if (w.fbq) {
      console.log("[FB Pixel] Calling fbq('init', pixelId)");
      w.fbq("init", pixelId);
      initializedPixels.add(pixelId);
      
      // Ensure loaded flag is set
      if (!w.fbq.loaded) {
        w.fbq.loaded = true;
      }
      
      // Verify initialization and process queue
      setTimeout(() => {
        const queueLength = w.fbq.queue?.length || 0;
        console.log("[FB Pixel] Pixel initialized. Queue length:", queueLength);
        console.log("[FB Pixel] fbq.loaded:", w.fbq.loaded);
        console.log("[FB Pixel] fbq.callMethod exists:", !!w.fbq.callMethod);
        
        // If script is loaded, process any queued events
        if (w.fbq.callMethod && queueLength > 0) {
          console.log("[FB Pixel] Processing", queueLength, "queued events...");
          // Events will be processed automatically by Facebook's script
        }
        
        // Force a PageView to test
        if (w.fbq.callMethod) {
          console.log("[FB Pixel] Pixel is ready and tracking events");
        } else {
          console.warn("[FB Pixel] Pixel initialized but script may not be fully loaded");
        }
      }, 300);
    } else {
      throw new Error("fbq function not available after script load");
    }
  } catch (error) {
    console.error("[FB Pixel] Error initializing Facebook Pixel:", error);
    throw error;
  }
};

/**
 * Check if Facebook Pixel is ready to track events
 */
export const isPixelReady = (): boolean => {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!(w.fbq && initializedPixels.size > 0);
};

/**
 * Track a custom Facebook Pixel event
 * Will queue events if pixel is not yet loaded (fbq queue handles this)
 */
export const track = (event: string, data?: Record<string, any>): void => {
  if (typeof window === "undefined") return;
  const w = window as any;
  
  // If fbq exists, it will queue the event even if script not fully loaded
  // The fbq queue is initialized before script loads, so this is safe
  if (w.fbq) {
    w.fbq("track", event, data || {});
  } else {
    console.warn("Facebook Pixel not initialized. Call initPixel first.");
  }
};

/**
 * Track a PageView event
 */
export const trackPageView = (): void => {
  track("PageView");
};

/**
 * Force initialize pixel if script is loaded but not initialized
 * Useful for debugging
 */
export const forceInitPixel = async (pixelId: string): Promise<void> => {
  if (typeof window === "undefined") return;
  
  const w = window as any;
  if (!w.fbq) {
    console.error("[FB Pixel] fbq not available");
    return;
  }
  
  // Check if script is in DOM
  const script = document.querySelector('script[src*="fbevents.js"]');
  if (!script) {
    console.error("[FB Pixel] Script not in DOM, cannot force init");
    return;
  }
  
  // Force set loaded if script exists
  if (!w.fbq.loaded) {
    w.fbq.loaded = true;
    console.log("[FB Pixel] Forced fbq.loaded to true");
  }
  
  // Initialize pixel
  if (!initializedPixels.has(pixelId)) {
    console.log("[FB Pixel] Force initializing pixel:", pixelId);
    w.fbq("init", pixelId);
    initializedPixels.add(pixelId);
    console.log("[FB Pixel] Pixel force initialized");
  } else {
    console.log("[FB Pixel] Pixel already initialized");
  }
};

/**
 * Debug function to check pixel status
 * Call this from console: window.fbPixelDebug()
 */
if (typeof window !== "undefined") {
  (window as any).fbPixelDebug = () => {
    const w = window as any;
    console.log("=== Facebook Pixel Debug ===");
    console.log("fbq exists:", !!w.fbq);
    console.log("fbq.loaded:", w.fbq?.loaded);
    console.log("fbq.callMethod exists:", !!w.fbq?.callMethod);
    console.log("Script in DOM:", !!document.querySelector('script[src*="fbevents.js"]'));
    console.log("Initialized pixels:", Array.from(initializedPixels));
    console.log("Queue length:", w.fbq?.queue?.length || 0);
    console.log("Queue contents:", w.fbq?.queue);
    console.log("Script loading:", scriptLoading);
    return {
      fbqExists: !!w.fbq,
      loaded: w.fbq?.loaded,
      callMethodExists: !!w.fbq?.callMethod,
      scriptInDOM: !!document.querySelector('script[src*="fbevents.js"]'),
      initializedPixels: Array.from(initializedPixels),
      queueLength: w.fbq?.queue?.length || 0,
      queue: w.fbq?.queue,
    };
  };
  
  // Add force init function to window for debugging
  (window as any).fbPixelForceInit = (pixelId: string) => {
    forceInitPixel(pixelId).catch(console.error);
  };
}
