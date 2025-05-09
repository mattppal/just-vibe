import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import DocLayout from "@/layouts/DocLayout";
import Home from "@/pages/home";
import Installation from "@/pages/installation";
import QuickStart from "@/pages/quick-start";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/installation" component={Installation} />
      <Route path="/quick-start" component={QuickStart} />
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
