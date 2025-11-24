import { ExternalLink, Play } from "lucide-react";
import React, { useEffect, useState } from "react";

interface YouTubeEmbedProps {
  videoId: string;
  autoplay?: boolean;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  autoplay = false,
}) => {
  const [embedError, setEmbedError] = useState(false);
  const [showPlayer, setShowPlayer] = useState(autoplay);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Try multiple thumbnail qualities
  const thumbnails = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, // Best quality
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, // High quality
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, // Medium quality
    `https://i.ytimg.com/vi/${videoId}/default.jpg`, // Default
  ];

  const [currentThumbnail, setCurrentThumbnail] = useState(thumbnails[0]);

  useEffect(() => {
    // Preload thumbnail with fallback
    const img = new Image();
    let thumbnailIndex = 0;

    const tryLoadThumbnail = () => {
      if (thumbnailIndex >= thumbnails.length) {
        setThumbnailLoaded(true);
        return;
      }

      img.src = thumbnails[thumbnailIndex];

      img.onload = () => {
        // Check if image is valid (not the default YouTube "no thumbnail" image)
        if (img.width > 120) {
          setCurrentThumbnail(thumbnails[thumbnailIndex]);
          setThumbnailLoaded(true);
        } else {
          thumbnailIndex++;
          tryLoadThumbnail();
        }
      };

      img.onerror = () => {
        thumbnailIndex++;
        tryLoadThumbnail();
      };
    };

    tryLoadThumbnail();
  }, [videoId]);

  const handlePlay = () => {
    setShowPlayer(true);
  };

  const handleIframeError = () => {
    console.warn(`[YouTube] Embed failed for video ${videoId}`);
    setEmbedError(true);
  };

  // If embed fails or region blocked, show fallback
  if (embedError) {
    return (
      <div
        className="relative w-full"
        style={{
          paddingBottom: "56.25%",
          background: "#000",
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="w-20 h-20 mb-4 rounded-full bg-red-600 flex items-center justify-center">
            <Play size={40} className="text-white ml-1" />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">
            Video Unavailable in This Region
          </h3>
          <p className="text-gray-400 text-sm mb-6 max-w-md">
            This video cannot be embedded due to regional restrictions. Click
            below to watch directly on YouTube.
          </p>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-lg"
          >
            <ExternalLink size={18} />
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  // Show thumbnail before player loads
  if (!showPlayer) {
    return (
      <div
        className="relative w-full cursor-pointer group"
        style={{
          paddingBottom: "56.25%",
          background: "#000",
        }}
        onClick={handlePlay}
      >
        {/* Thumbnail */}
        {thumbnailLoaded && (
          <img
            src={currentThumbnail}
            alt="YouTube video thumbnail"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all flex items-center justify-center">
          {/* Play button */}
          <div className="w-20 h-20 bg-red-600 group-hover:bg-red-700 rounded-full flex items-center justify-center transition-all transform group-hover:scale-110 shadow-2xl">
            <Play size={32} className="text-white ml-1" fill="white" />
          </div>
        </div>

        {/* Watch on YouTube button (always visible) */}
        <div className="absolute bottom-4 right-4 z-10">
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-black/80 hover:bg-red-600 text-white text-xs font-medium rounded transition-all backdrop-blur-sm"
          >
            <ExternalLink size={14} />
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  // Show iframe player
  return (
    <div
      className="relative w-full"
      style={{
        paddingBottom: "56.25%",
        background: "#000",
      }}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
        className="absolute inset-0 w-full h-full"
        style={{ border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onError={handleIframeError}
        loading="lazy"
      />

      {/* Fallback Watch on YouTube button */}
      <div className="absolute bottom-4 right-4 z-10 opacity-0 hover:opacity-100 transition-opacity">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 bg-black/80 hover:bg-red-600 text-white text-xs font-medium rounded transition-all backdrop-blur-sm"
        >
          <ExternalLink size={14} />
          Watch on YouTube
        </a>
      </div>
    </div>
  );
};
