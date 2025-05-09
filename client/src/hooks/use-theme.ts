import { useEffect, useState } from "react";

export function useTheme() {
  const [mounted, setMounted] = useState(false);

  // Always dark theme by default
  useEffect(() => {
    setMounted(true);
    // Add dark class to HTML element
    document.documentElement.classList.add("dark");
  }, []);

  return { mounted };
}
