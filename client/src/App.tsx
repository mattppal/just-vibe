import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import DocLayout from "@/layouts/DocLayout";
import DocPage from "@/pages/DocPage";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

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
