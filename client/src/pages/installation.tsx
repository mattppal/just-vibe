import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CodeBlock from "@/components/CodeBlock";
import TableOfContents from "@/components/TableOfContents";

export default function Installation() {
  const tocItems = [
    { id: "requirements", title: "Requirements" },
    { id: "installation-steps", title: "Installation Steps" },
    { id: "verify-installation", title: "Verify Installation" },
    { id: "troubleshooting", title: "Troubleshooting" },
  ];
  
  const npmInstallCode = `npm install @platform/core @platform/cli --save`;
  const yarnInstallCode = `yarn add @platform/core @platform/cli`;
  const pnpmInstallCode = `pnpm add @platform/core @platform/cli`;
  
  const verifyCode = `platform --version
# Should output something like: 2.4.0

# Verify the installation is working
platform verify`;

  return (
    <div className="flex md:gap-6 lg:gap-10 px-4 md:px-6 pb-16">
      <div className="w-full min-w-0 max-w-3xl mx-auto">
        <div className="space-y-10 pt-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Installation</h1>
            <p className="mt-4 text-secondary text-lg">
              Learn how to install and set up the platform on your system.
            </p>
          </div>
          
          <section id="requirements" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Requirements</h2>
            <p>
              Before installing the platform, make sure your system meets the following requirements:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Node.js version 14.0.0 or higher</li>
              <li>npm version a6.0.0 or higher (or yarn/pnpm)</li>
              <li>At least 1GB of free disk space</li>
              <li>Internet connection for downloading dependencies</li>
            </ul>
          </section>
          
          <section id="installation-steps" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Installation Steps</h2>
            <p>
              You can install the platform using npm, yarn, or pnpm. Choose the method that suits your workflow:
            </p>
            
            <h3 className="text-xl font-medium mt-6 mb-2">Using npm</h3>
            <CodeBlock code={npmInstallCode} language="bash" />
            
            <h3 className="text-xl font-medium mt-6 mb-2">Using yarn</h3>
            <CodeBlock code={yarnInstallCode} language="bash" />
            
            <h3 className="text-xl font-medium mt-6 mb-2">Using pnpm</h3>
            <CodeBlock code={pnpmInstallCode} language="bash" />
            
            <p className="mt-4">
              After installation, the platform CLI will be available globally on your system.
            </p>
          </section>
          
          <section id="verify-installation" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Verify Installation</h2>
            <p>
              You can verify that the installation was successful by running the following commands:
            </p>
            <CodeBlock code={verifyCode} language="bash" />
            <p>
              If you see the version number and a success message, you've installed the platform correctly.
            </p>
          </section>
          
          <section id="troubleshooting" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Troubleshooting</h2>
            <p>
              If you encounter any issues during installation, try the following:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Clear npm cache: <code className="bg-[hsl(var(--code))] px-1 py-0.5 rounded text-sm">npm cache clean --force</code></li>
              <li>Make sure your Node.js version is up-to-date</li>
              <li>Try installing with the <code className="bg-[hsl(var(--code))] px-1 py-0.5 rounded text-sm">--verbose</code> flag to see more detailed error messages</li>
              <li>Check your network connection and firewall settings</li>
            </ul>
            <p className="mt-4">
              If you're still having issues, please refer to our <a href="#" className="text-primary hover:underline">troubleshooting guide</a> or <a href="#" className="text-primary hover:underline">get help from the community</a>.
            </p>
          </section>
          
          <nav className="flex items-center justify-between border-t border-border pt-6">
            <Link href="/" className="inline-flex items-center gap-1 text-primary">
              <ChevronLeft className="mr-1 w-4 h-4" />
              Introduction
            </Link>
            <Link href="/quick-start" className="inline-flex items-center gap-1 text-primary">
              Quick Start
              <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
          </nav>
        </div>
      </div>
      
      <TableOfContents items={tocItems} />
    </div>
  );
}
