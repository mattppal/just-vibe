interface DocPage {
  title: string;
  path: string;
  section?: string;
  content: string;
}

const docs: DocPage[] = [
  {
    title: "Introduction",
    path: "/",
    section: "Getting Started",
    content: "This documentation covers everything you need to know to use our platform efficiently. Whether you're a beginner or an advanced user, you'll find all the information you need to get started and make the most of our features. Our platform is designed to be intuitive and powerful, allowing you to build complex applications without the complexity typically associated with such tasks."
  },
  {
    title: "Installation",
    path: "/installation",
    section: "Getting Started",
    content: "Learn how to install and set up the platform on your system. Before installing the platform, make sure your system meets the following requirements: Node.js version 14.0.0 or higher, npm version 6.0.0 or higher (or yarn/pnpm), at least 1GB of free disk space, and internet connection for downloading dependencies."
  },
  {
    title: "Quick Start",
    path: "/quick-start",
    section: "Getting Started",
    content: "Get started with the platform in just a few minutes. The easiest way to get started is to create a new project using the CLI. This will create a new directory with the project name and set up all the necessary files and dependencies."
  }
];

export function getAllDocs(): DocPage[] {
  return docs;
}

export function getDocByPath(path: string): DocPage | undefined {
  return docs.find((doc) => doc.path === path);
}
