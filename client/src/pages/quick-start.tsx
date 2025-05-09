import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CodeBlock from "@/components/CodeBlock";
import TableOfContents from "@/components/TableOfContents";

export default function QuickStart() {
  const tocItems = [
    { id: "create-project", title: "Create a New Project" },
    { id: "project-structure", title: "Project Structure" },
    { id: "development", title: "Development" },
    { id: "configuration", title: "Configuration" },
    { id: "deployment", title: "Deployment" },
  ];
  
  const createProjectCode = `# Create a new project
platform create my-awesome-project

# Navigate to the project directory
cd my-awesome-project`;

  const projectStructureCode = `my-awesome-project/
├── public/
│   ├── index.html
│   └── assets/
├── src/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── config.js
├── package.json
└── README.md`;

  const startDevCode = `# Install dependencies
npm install

# Start the development server
npm run dev

# The server will start on http://localhost:3000`;

  const configCode = `// config.js
module.exports = {
  name: 'my-awesome-project',
  version: '1.0.0',
  routes: {
    dynamic: true,
    cache: true
  },
  build: {
    optimize: true,
    sourceMaps: true
  }
}`;

  const deployCode = `# Build the project for production
npm run build

# Deploy to your hosting service
platform deploy --target=production`;

  return (
    <div className="flex md:gap-6 lg:gap-10 px-4 md:px-6 pb-16">
      <div className="w-full min-w-0 max-w-3xl mx-auto">
        <div className="space-y-10 pt-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quick Start</h1>
            <p className="mt-4 text-secondary text-lg">
              Get started with the platform in just a few minutes.
            </p>
          </div>
          
          <section id="create-project" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Create a New Project</h2>
            <p>
              The easiest way to get started is to create a new project using the CLI:
            </p>
            <CodeBlock code={createProjectCode} language="bash" />
            <p>
              This will create a new directory with the project name and set up all the necessary files and dependencies.
            </p>
          </section>
          
          <section id="project-structure" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Project Structure</h2>
            <p>
              Here's the structure of a newly created project:
            </p>
            <CodeBlock code={projectStructureCode} language="bash" />
            <p>
              This structure follows best practices for organizing your code and assets. You'll spend most of your time working in the <code className="bg-[hsl(var(--code))] px-1 py-0.5 rounded text-sm">src</code> directory.
            </p>
          </section>
          
          <section id="development" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Development</h2>
            <p>
              To start the development server:
            </p>
            <CodeBlock code={startDevCode} language="bash" />
            <p>
              The development server includes features like hot reloading, error reporting, and debugging tools to make your development experience smooth.
            </p>
          </section>
          
          <section id="configuration" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Configuration</h2>
            <p>
              You can customize your project by editing the <code className="bg-[hsl(var(--code))] px-1 py-0.5 rounded text-sm">config.js</code> file:
            </p>
            <CodeBlock code={configCode} language="javascript" />
            <p>
              This configuration file allows you to control various aspects of your project, from routing to build optimization.
            </p>
          </section>
          
          <section id="deployment" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Deployment</h2>
            <p>
              When you're ready to deploy your project to production:
            </p>
            <CodeBlock code={deployCode} language="bash" />
            <p>
              The platform will build an optimized version of your project and deploy it to your configured hosting service. You can specify different deployment targets (development, staging, production) based on your workflow.
            </p>
          </section>
          
          <nav className="flex items-center justify-between border-t border-border pt-6">
            <Link href="/installation" className="inline-flex items-center gap-1 text-primary">
              <ChevronLeft className="mr-1 w-4 h-4" />
              Installation
            </Link>
            <div></div>
          </nav>
        </div>
      </div>
      
      <TableOfContents items={tocItems} />
    </div>
  );
}
