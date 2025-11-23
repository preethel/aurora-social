import { AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { PLATFORM_COLORS } from "../constants";
import { Platform } from "../types";

interface SafeEmbedProps {
  content: string;
  platform: Platform;
  variant?: "default" | "minimal";
}

export const SafeEmbed: React.FC<SafeEmbedProps> = ({
  content,
  platform,
  variant = "default",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLinkOnly, setIsLinkOnly] = useState(false);
  const [safeUrl, setSafeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [iframelyHtml, setIframelyHtml] = useState<string | null>(null);

  // Helper to extract YouTube Video ID (Enhanced Regex for Shorts/Live/Embeds)
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    // Robust regex for ID extraction
    const regExp =
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})(?:[\?&].*)?$/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Helper to re-execute scripts in injected HTML
  const executeScripts = (container: HTMLElement) => {
    // Standard script tag re-injection (for raw HTML embeds)
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    // Instagram Process (if available globally)
    if ((window as any).instgrm) {
      try {
        (window as any).instgrm.Embeds.process();
      } catch (e) {}
    }
  };

  useEffect(() => {
    const trimmed = content.trim();
    const isUrl = /^(http|https):\/\/[^ "]+$/.test(trimmed);

    const strictLinkPlatforms = [
      Platform.WhatsApp,
      Platform.IMO,
      Platform.Telegram,
    ];

    // Always attempt proxy-based Iframely fetch for non-strict platforms when content is a URL.
    const shouldTryIframely = isUrl && !strictLinkPlatforms.includes(platform);

    setIframelyHtml(null);
    setIsLinkOnly(false);
    setSafeUrl("");
    setIsLoading(false);

    // 1. YouTube (Manual Override)
    // We handle this first and synchronously to ensure the specific responsive layout
    // and avoid API latency/errors for this common platform.
    if (getYouTubeId(trimmed)) {
      handleManualEmbed(trimmed, isUrl, strictLinkPlatforms);
      return;
    }

    // 2. API Fetch (Strategy 1)
    if (shouldTryIframely) {
      setIsLoading(true);
      const apiUrl = `/api/iframely?url=${encodeURIComponent(trimmed)}`;
      console.log("[SafeEmbed] Fetching from backend:", apiUrl);
      fetch(apiUrl)
        .then((res) => {
          console.log("[SafeEmbed] Backend response status:", res.status);
          if (!res.ok) throw new Error(`API Error: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log("[SafeEmbed] Got data from backend:", {
            hasHtml: !!data.html,
          });
          if (data.html) {
            setIframelyHtml(data.html);
          } else {
            // API returned valid JSON but no HTML (e.g. link not supported)
            throw new Error("No HTML in response");
          }
        })
        .catch((err) => {
          console.warn(
            "[SafeEmbed] Iframely API failed, falling back to link-only view:",
            err
          );
          // When API fails, show the link directly instead of attempting client-side discovery
          setIsLinkOnly(true);
          setSafeUrl(trimmed);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // 3. Manual Strategy (Strategy 2)
      handleManualEmbed(trimmed, isUrl, strictLinkPlatforms);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, platform]);

  // Inject HTML from API when available
  useEffect(() => {
    if (iframelyHtml && containerRef.current) {
      // Clear container first
      containerRef.current.innerHTML = "";
      // Create a wrapper div to contain the API-provided HTML
      const wrapper = document.createElement("div");
      wrapper.innerHTML = iframelyHtml;
      containerRef.current.appendChild(wrapper);
      executeScripts(containerRef.current);
    }
  }, [iframelyHtml]);

  const handleManualEmbed = (
    trimmed: string,
    isUrl: boolean,
    strictLinkPlatforms: Platform[]
  ) => {
    const container = containerRef.current;
    if (!container) return;

    // 1. YouTube Manual Embed
    const youTubeId = getYouTubeId(trimmed);
    if (youTubeId) {
      setIsLinkOnly(false);
      // Simplified attributes to reduce 'Error 153' (removed strict-origin policy, simplified allow list)
      container.innerHTML = `
        <div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
          <iframe 
            src="https://www.youtube.com/embed/${youTubeId}" 
            style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;" 
            allowfullscreen 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
      `;
      return;
    }

    // 2. Strict Link Platforms
    if (strictLinkPlatforms.includes(platform)) {
      setIsLinkOnly(true);
      setSafeUrl(trimmed);
      return;
    }

    // 3. Generic URL Fallback
    // If no specific handler is available, show as link-only
    if (isUrl) {
      setIsLinkOnly(true);
      setSafeUrl(trimmed);
      return;
    }

    // 4. Raw HTML Embed Code
    // User pasted an <iframe> or <blockquote class="instagram-media"> etc.
    setIsLinkOnly(false);
    container.innerHTML = trimmed;

    // Sanitize: Ensure iframes don't break layout
    const iframes = container.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      iframe.style.maxWidth = "100%";
    });

    executeScripts(container);
  };

  const isMinimal = variant === "minimal";

  if (isLoading) {
    return (
      <div
        className={`w-full flex items-center justify-center text-gray-400 ${
          isMinimal
            ? "h-[50px]"
            : "h-[200px] bg-white border border-gray-200 rounded-lg"
        }`}
      >
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (isLinkOnly) {
    const color = PLATFORM_COLORS[platform];
    return (
      <div
        className={`flex flex-col items-center justify-center text-center ${
          isMinimal
            ? "p-6 bg-gray-50 border-t border-b border-gray-100"
            : "p-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"
        }`}
      >
        <div
          className={`${
            isMinimal ? "w-10 h-10" : "w-12 h-12"
          } rounded-full flex items-center justify-center mb-3 text-white`}
          style={{ backgroundColor: color }}
        >
          <ExternalLink size={isMinimal ? 18 : 20} />
        </div>
        {!isMinimal && (
          <h3 className="text-gray-900 font-medium mb-1">
            Preview Not Available
          </h3>
        )}
        <p className="text-gray-500 text-sm mb-4">
          {platform === Platform.WhatsApp || platform === Platform.IMO
            ? "Platform does not support embeds."
            : "Direct link provided."}
        </p>
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-md text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          style={{ backgroundColor: color }}
        >
          View on {platform} <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div
      className={`w-full overflow-hidden ${
        isMinimal ? "" : "bg-white rounded-lg border border-gray-200"
      }`}
    >
      <div
        ref={containerRef}
        className={`w-full flex justify-center items-center ${
          isMinimal ? "min-h-[50px]" : "min-h-[200px] p-2"
        }`}
        style={{ maxWidth: "100%", overflowX: "auto" }}
      />
      {!isMinimal && (
        <div className="bg-gray-50 text-gray-500 text-xs p-2 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-1">
            <AlertCircle size={12} />
            <span>
              {iframelyHtml ? "Powered by Iframely" : "Local Preview"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
