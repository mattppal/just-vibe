import { useState, useEffect } from "react";

interface YouTubeEmbedProps {
  id: string;
  title?: string;
  className?: string;
}

const YouTubeEmbed = ({ id, title = "YouTube video player", className = "" }: YouTubeEmbedProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Enhance performance by loading the iframe only when it comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 } // Start loading when 10% of the container is visible
    );

    const container = document.getElementById(`youtube-container-${id}`);
    if (container) {
      observer.observe(container);
    }

    return () => {
      observer.disconnect();
    };
  }, [id]);

  return (
    <div 
      id={`youtube-container-${id}`}
      className={`relative w-full pt-[56.25%] bg-[#0a0a0a] rounded-md overflow-hidden ${className}`}
    >
      {isLoaded ? (
        <iframe
          className="absolute top-0 left-0 w-full h-full border-0"
          src={`https://www.youtube.com/embed/${id}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        ></iframe>
      ) : (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
            <p className="text-white text-sm">Loading YouTube video...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeEmbed;
