---
title: YouTube Embed Example
sidebarTitle: YouTube Embed
description: Learn how to embed YouTube videos in your documentation pages.
authenticated: false
---

# Embedding YouTube Videos

This page demonstrates how to embed YouTube videos in your documentation using our custom component.

## Basic YouTube Embed

To embed a YouTube video, you can use the regular markdown syntax by adding an iframe with a YouTube URL. Here's a basic example:

```markdown
<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video example" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
```

This will automatically be enhanced with our YouTube embed component, providing a responsive, optimized video player.

## Live Example

Here's a real embedded YouTube video:

<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video example" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Features of the Embed Component

Our YouTube embed component provides several enhancements over a standard iframe:

1. **Lazy Loading** - Videos only load when they come into view
2. **Responsive Design** - Videos maintain proper aspect ratio on all screen sizes
3. **Loading State** - A nice spinner shows while the video is loading
4. **Optimized Performance** - Reduces impact on page load speed

## Using in Your Documentation

You can add a YouTube video to any markdown page by including the iframe with the YouTube video ID. The ID is the part of the YouTube URL after `v=` (for example, `dQw4w9WgXcQ` in `https://www.youtube.com/watch?v=dQw4w9WgXcQ`).

The system will automatically detect YouTube iframes and enhance them.

### Best Practices

- Use YouTube embeds sparingly - they add significant page weight
- Provide a text description of the video content for accessibility
- Consider adding a timestamp link to the relevant section of the video
- When possible, include a transcription of important video content