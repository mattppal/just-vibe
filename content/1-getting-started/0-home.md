---
title: Home
sidebarTitle: Home
description: Welcome to the documentation site home page
authenticated: false
path: /
---

# Documentation Home

Welcome to our documentation site. This is the home page that serves as an overview of the available content.

## Available Sections

### Getting Started
Basic information to help you get started with our platform.

### Core Concepts
Deeper dives into the key concepts and architecture.

## Authentication

Some pages in this documentation require authentication to access. These pages are indicated with a 🔒 lock icon in the sidebar.

- Public pages (like this one) can be viewed by anyone
- Protected pages require you to log in

## Sample Code

```javascript
// Simple example of how to access our API
async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}
```
