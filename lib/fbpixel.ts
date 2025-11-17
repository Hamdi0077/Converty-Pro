/**
 * Extend the Window interface to include the fbq property for Facebook Pixel.
 */
declare global {
  interface Window {
    fbq: {
      (command: string, ...args: any[]): void;
      callMethod?: (...args: any[]) => void;
      queue: any[];
      version: string;
      loaded: boolean;
    };
  }
}

// Facebook Pixel initialization
export function initPixel(pixelId: string): void {
  if (!pixelId) {
    console.error("Pixel ID is required to initialize Facebook Pixel.");
    return;
  }

  if (!document.getElementById("fb-pixel-script")) {
    const script = document.createElement("script");
    script.id = "fb-pixel-script";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onload = () => {
      console.log("Facebook Pixel script loaded successfully.");
      window.fbq = window.fbq || function () {
        (window.fbq as any).q = (window.fbq as any).q || [];
        (window.fbq as any).q.push(arguments);
      };
      (window.fbq as any).l = +new Date();
      window.fbq("init", pixelId);
      console.log(`Facebook Pixel initialized with ID: ${pixelId}`);
      window.fbq("track", "PageView");
    };
    script.onerror = () => {
      console.error("Failed to load Facebook Pixel script.");
    };
    document.head.appendChild(script);
  } else {
    console.log("Facebook Pixel script already loaded.");
    if (typeof window.fbq === "function") {
      window.fbq("init", pixelId);
      console.log(`Facebook Pixel initialized with ID: ${pixelId}`);
      window.fbq("track", "PageView");
    } else {
      console.error("Facebook Pixel function (fbq) is not available.");
    }
  }
}

// Facebook Pixel event tracking
export function track(event: string, data?: Record<string, any>): void {
  if (!event) {
    console.error("Event name is required to track an event.");
    return;
  }

  if (typeof window.fbq !== "function") {
    console.warn("Facebook Pixel is not initialized. Event tracking skipped.");
    return;
  }

  console.log(`Tracking event: ${event}`, data);
  window.fbq("track", event, data);
}
