# ToGoStory Logo Assets

This folder contains the official ToGoStory brand logo assets in various formats.

## Files

### SVG Assets (Vector - Scalable)
- **icon.svg** - Icon only (blue, light background)
- **icon-white.svg** - Icon only (white, for dark backgrounds)
- **full-logo.svg** - Full logo with icon + wordmark (blue text with orange "y")
- **full-logo-dark.svg** - Full logo on dark background (white text with orange "y")
- **wordmark.svg** - Text wordmark only (blue with orange "y")

## Usage

### In React Components
Use the `Logo` component from `@/app/components/shared/Logo`:

```tsx
import Logo from '@/app/components/shared/Logo'

// Navigation/Header
<Logo variant="full" size="sm" href="/" />

// Landing Page
<Logo variant="full" size="md" />

// Dark Background
<Logo variant="icon" theme="dark" size="lg" />

// Email/Social (use SVG path directly)
<img src="/logos/full-logo.svg" alt="ToGoStory" />
<img src="/logos/full-logo-dark.svg" alt="ToGoStory" />
```

### Variants
- `icon` - Icon symbol only (128x128)
- `full` - Icon + Wordmark together (600x160)
- `wordmark` - Text wordmark only (500x100)

### Sizes
- `sm` - Small (for navigation bars)
- `md` - Medium (for landing pages, default)
- `lg` - Large (for hero sections, banners)

### Themes
- `light` - Blue text on light/transparent background (default)
- `dark` - White text on dark background

## Brand Colors
- **Primary Blue**: #2563eb
- **Accent Orange**: #f97316
- **White**: #ffffff

## Guidelines
1. Always maintain clear space around the logo (minimum 8px)
2. Do not distort or stretch the logo
3. Do not change the colors (unless using dark theme variant)
4. Do not rotate or flip the logo
5. For dark backgrounds, always use the `theme="dark"` variant

## Email Usage
For email templates, use the full SVG paths or embedded images:
- Light background: `/logos/full-logo.svg`
- Dark background: `/logos/full-logo-dark.svg`

## Social Media / OG Images
Use the full logo SVG in Open Graph meta tags:
```tsx
images: [
  {
    url: '/logos/full-logo.svg',
    width: 600,
    height: 160,
    alt: 'ToGoStory',
  }
]
```

## PNG/WebP Versions
For maximum browser compatibility, PNG and WebP versions can be generated from the SVG files using a tool like:
- ImageMagick
- Sharp
- SVGOMG
- Online converters

Generate at these sizes:
- 192x192 (app icon)
- 512x512 (splash screen)
- 1200x315 (social media)
