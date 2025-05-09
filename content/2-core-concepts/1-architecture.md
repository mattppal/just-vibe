---
title: Architecture Overview
sidebarTitle: Architecture
description: Learn about the system architecture. This is a protected page that requires authentication.
---

# Architecture Overview

This is a protected documentation page that requires authentication to view.

## Protected Content

This page demonstrates a protected section of the documentation. Users must be logged in to view this content.

## System Components

Our system architecture consists of several key components:

1. **Frontend Application** - React-based SPA
2. **Backend API** - Express.js server
3. **Database** - PostgreSQL database
4. **Authentication** - Replit Auth (OpenID Connect)

## Authentication Flow

The authentication flow used in this application follows the standard OpenID Connect protocol:

1. User clicks the login button
2. Application redirects to the Replit identity provider
3. User authenticates with Replit
4. User is redirected back to the application with auth tokens
5. Application verifies tokens and creates a session

## Secure Content Access

Protected content (like this page) is secured through several layers:

- Server-side route protection
- Client-side redirection
- Visual indication in the UI (greyed out with lock icon)

## Advanced Code Sample

```typescript
// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired, try to refresh
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, user.refresh_token);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};
```
