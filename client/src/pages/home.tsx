import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CodeBlock from "@/components/CodeBlock";
import TableOfContents from "@/components/TableOfContents";

export default function Home() {
  const tocItems = [
    { id: "what-is", title: "What is this?" },
    { id: "key-features", title: "Key Features" },
    { id: "code-example", title: "Code Example" },
    { id: "getting-started", title: "Getting Started" },
    { id: "resources", title: "Resources" },
  ];
  
  const exampleCode = `import { createApp } from '@platform/core';

// Initialize the application
const app = createApp({
  name: 'my-awesome-app',
  version: '1.0.0',
  config: {
    staticGeneration: true,
    optimizeAssets: true
  }
});

// Register routes
app.route('/', {
  get(req, res) {
    return res.render('home', {
      title: 'Welcome to My App'
    });
  }
});

// Start the application
app.start();`;
  
  const shellCode = `# Install the CLI globally
npm install -g @platform/cli

# Create a new project
platform create my-project
cd my-project

# Start the development server
npm run dev`;

  return (
    <div className="flex md:gap-6 lg:gap-10 px-4 md:px-6 pb-16">
      <div className="w-full min-w-0 max-w-3xl mx-auto">
        <div className="space-y-10 pt-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Introduction</h1>
            <p className="mt-4 text-secondary text-lg">
              Welcome to our documentation site. Learn everything you need to know to get started quickly.
            </p>
          </div>
          
          <section id="what-is" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">What is this?</h2>
            <p>
              This documentation covers everything you need to know to use our platform efficiently. Whether you're a beginner or an advanced user, you'll find all the information you need to get started and make the most of our features.
            </p>
            <p>
              Our platform is designed to be intuitive and powerful, allowing you to build complex applications without the complexity typically associated with such tasks.
            </p>
          </section>
          
          <section id="key-features" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Easy to understand architecture with minimal boilerplate</li>
              <li>Excellent performance through optimized static generation</li>
              <li>Comprehensive tooling for development workflows</li>
              <li>Flexible configuration options for customization</li>
              <li>Built-in security features and best practices</li>
            </ul>
          </section>
          
          <section id="code-example" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Code Example</h2>
            <p>
              Here's a simple example of how to use our main API:
            </p>
            <CodeBlock code={exampleCode} />
            <p>
              The example above demonstrates the basic structure of an application using our platform. You can easily extend this with more routes, components, and features.
            </p>
          </section>
          
          <section id="getting-started" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Getting Started</h2>
            <p>
              The quickest way to get started is to install our CLI tool and create a new project:
            </p>
            <CodeBlock code={shellCode} language="bash" />
            <p>
              This will set up a new project with all the necessary dependencies and configuration. You can then start building your application right away.
            </p>
          </section>
          
          <section id="resources" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-md border border-border">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">GitHub Repository</h3>
                  <p className="text-secondary text-sm mb-3">Explore the source code and contribute to the project</p>
                  <a href="#" className="text-primary inline-flex items-center text-sm">
                    View Repository
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
              <Card className="rounded-md border border-border">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Community Forum</h3>
                  <p className="text-secondary text-sm mb-3">Join discussions and get help from the community</p>
                  <a href="#" className="text-primary inline-flex items-center text-sm">
                    Visit Forum
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </section>
          
          <nav className="flex items-center justify-between border-t border-border pt-6">
            <div></div>
            <Link href="/installation" className="inline-flex items-center gap-1 text-primary">
              Installation
              <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
          </nav>
        </div>
      </div>
      
      <TableOfContents items={tocItems} />
    </div>
  );
}
