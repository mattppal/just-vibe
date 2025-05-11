import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import DocLayout from "@/layouts/DocLayout";
import { EmojiProvider } from "@/components/EmojiProvider";

// Import directly for now, we'll use better code splitting approaches
import DocPage from "@/pages/DocPage";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

// Loading fallback for suspense
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 border-t-2 border-b-2 border-primary rounded-full animate-spin mb-4"></div>
    <p className="text-white text-opacity-80">Loading content...</p>
  </div>
);

function Router() {
  // Regex to detect file extensions - helps differentiate between routes and static assets
  const isFileExtension = (path: string) => /\.(png|jpe?g|gif|svg|mp4|webm|pdf|css|js)$/i.test(path);
  
  // Check if the current URL is for a file asset and bypass routing if so
  const currentPath = window.location.pathname;
  if (isFileExtension(currentPath)) {
    return null; // Return null to let the server handle file requests
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Handle all doc pages with section-prefixed routes */}
      <Route path="/:section/:page" component={DocPage} />
      {/* Legacy path support for old URLs */}
      <Route path="/:slug" component={DocPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <EmojiProvider>
      <QueryClientProvider client={queryClient}>
        <DocLayout>
          <Router />
        </DocLayout>
        <Toaster />
      </QueryClientProvider>
    </EmojiProvider>
  );
}

export default App;
