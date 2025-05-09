---
title: Installation
sidebarTitle: Installation
description: Learn how to install and set up the platform on your system.
---

# Installation

Learn how to install and set up the platform on your system.

## Requirements

Before installing the platform, make sure your system meets the following requirements:

- Node.js version 14.0.0 or higher
- npm version 6.0.0 or higher (or yarn/pnpm)
- At least 1GB of free disk space
- Internet connection for downloading dependencies

## Installation Steps

You can install the platform using npm, yarn, or pnpm. Choose the method that suits your workflow.

```bash
# Install the CLI globally
npm install -g @platform/cli

# Create a new project
platform create my-project
cd my-project

# Start the development server
npm run dev
```

## Configuration

After installation, you can configure your project by editing the `platform.config.js` file in the root directory:

```javascript
// platform.config.js
module.exports = {
  // Project name
  name: 'my-awesome-project',
  
  // Development server settings
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  
  // Build settings
  build: {
    output: 'dist',
    minify: true,
    sourcemaps: true
  }
};
```