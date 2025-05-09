import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import DocLayout from "@/layouts/DocLayout";

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
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/introduction" component={DocPage} />
      <Route path="/:slug" component={DocPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DocLayout>
        <Router />
      </DocLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
