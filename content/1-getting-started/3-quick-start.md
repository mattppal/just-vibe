---
title: Quick Start
sidebarTitle: Quick Start
description: Get started with the platform in just a few minutes.
---

# Quick Start

Get started with the platform in just a few minutes.

## Create a New Project

The easiest way to get started is to create a new project using the CLI.

```bash
# Install the CLI globally if you haven't already
npm install -g @platform/cli

# Create a new project
platform create my-project --template basic
cd my-project
```

## Project Structure

Here's the structure of a newly created project:

```
my-project/
├── src/
│   ├── components/
│   │   ├── App.js
│   │   └── ...
│   ├── pages/
│   │   ├── index.js
│   │   └── ...
│   └── index.js
├── public/
│   ├── index.html
│   └── ...
├── platform.config.js
├── package.json
└── README.md
```

## Start Development Server

To start the development server, run:

```bash
npm run dev
```

This will start a local development server at `http://localhost:3000`.

## Build for Production

When you're ready to deploy your application, run:

```bash
npm run build
```

This will create an optimized production build in the `dist` directory.