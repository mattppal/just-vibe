import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    console.log("Seeding database...");
    
    // Seed sections
    const sections = [
      { name: "Getting Started", slug: "getting-started", order: 1 },
      { name: "Core Concepts", slug: "core-concepts", order: 2 },
      { name: "API Reference", slug: "api-reference", order: 3 },
    ];
    
    for (const section of sections) {
      const existingSection = await db.query.sections.findFirst({
        where: (sections, { eq }) => eq(sections.slug, section.slug)
      });
      
      if (!existingSection) {
        console.log(`Creating section: ${section.name}`);
        await db.insert(schema.sections).values(section);
      }
    }
    
    // Seed documentation pages
    const documentations = [
      {
        title: "Introduction",
        slug: "introduction",
        section: "getting-started",
        order: 1,
        content: `
          <h1>Introduction</h1>
          <p>Welcome to our documentation site. Learn everything you need to know to get started quickly.</p>
          
          <h2 id="what-is">What is this?</h2>
          <p>This documentation covers everything you need to know to use our platform efficiently. Whether you're a beginner or an advanced user, you'll find all the information you need to get started and make the most of our features.</p>
          <p>Our platform is designed to be intuitive and powerful, allowing you to build complex applications without the complexity typically associated with such tasks.</p>
          
          <h2 id="key-features">Key Features</h2>
          <ul>
            <li>Easy to understand architecture with minimal boilerplate</li>
            <li>Excellent performance through optimized static generation</li>
            <li>Comprehensive tooling for development workflows</li>
            <li>Flexible configuration options for customization</li>
            <li>Built-in security features and best practices</li>
          </ul>
        `
      },
      {
        title: "Installation",
        slug: "installation",
        section: "getting-started",
        order: 2,
        content: `
          <h1>Installation</h1>
          <p>Learn how to install and set up the platform on your system.</p>
          
          <h2 id="requirements">Requirements</h2>
          <p>Before installing the platform, make sure your system meets the following requirements:</p>
          <ul>
            <li>Node.js version 14.0.0 or higher</li>
            <li>npm version 6.0.0 or higher (or yarn/pnpm)</li>
            <li>At least 1GB of free disk space</li>
            <li>Internet connection for downloading dependencies</li>
          </ul>
          
          <h2 id="installation-steps">Installation Steps</h2>
          <p>You can install the platform using npm, yarn, or pnpm. Choose the method that suits your workflow.</p>
        `
      },
      {
        title: "Quick Start",
        slug: "quick-start",
        section: "getting-started",
        order: 3,
        content: `
          <h1>Quick Start</h1>
          <p>Get started with the platform in just a few minutes.</p>
          
          <h2 id="create-project">Create a New Project</h2>
          <p>The easiest way to get started is to create a new project using the CLI.</p>
          
          <h2 id="project-structure">Project Structure</h2>
          <p>Here's the structure of a newly created project.</p>
        `
      }
    ];
    
    for (const doc of documentations) {
      const existingDoc = await db.query.docs.findFirst({
        where: (docs, { eq }) => eq(docs.slug, doc.slug)
      });
      
      if (!existingDoc) {
        console.log(`Creating documentation: ${doc.title}`);
        await db.insert(schema.docs).values(doc);
      }
    }
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
