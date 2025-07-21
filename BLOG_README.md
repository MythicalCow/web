# Blog System Documentation

This documentation covers how to use and manage the blog system for your Next.js website.

## Overview

Your website now includes a fully-featured blog system with:

- 🌙 **Dark Mode Support** - Matches your website's theme
- 📝 **Markdown Support** - Write posts in markdown with frontmatter
- 🚀 **Static Generation** - Fast loading and SEO optimized
- 🎨 **Responsive Design** - Looks great on all devices
- 🏷️ **Tagging System** - Organize posts with tags
- 📊 **Post Statistics** - Reading time estimation and post counts
- 🔍 **SEO Optimized** - Meta tags and Open Graph support

## Quick Start

### Viewing Your Blog

- Visit `/blog` to see all blog posts
- Visit `/blog/[slug]` to read individual posts
- The blog automatically inherits your site's dark theme

### Creating Your First Post

1. Create a new markdown file in `src/posts/`
2. Add frontmatter with post metadata
3. Write your content in markdown
4. Build and deploy

Example:
```markdown
---
title: My First Blog Post
date: 2024-01-20
description: This is my first blog post using the new system
tags: ['welcome', 'blog', 'first-post']
author: Your Name
readTime: 3 min read
featured: false
draft: false
---

# My First Blog Post

Welcome to my blog! This is my first post.

## Getting Started

Here's how I set up my blog...
```

## File Structure

```
src/
├── posts/                    # Your blog posts (markdown files)
│   ├── hello-world.md
│   └── building-modern-blog.md
├── app/
│   └── blog/
│       ├── layout.tsx        # Blog layout component
│       ├── page.tsx          # Blog listing page
│       └── [slug]/
│           └── page.tsx      # Individual post page
└── lib/
    └── blog.ts               # Blog utilities and functions
```

## Frontmatter Fields

Each blog post should include frontmatter with these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Post title |
| `date` | string | ✅ | Publication date (YYYY-MM-DD) |
| `description` | string | ✅ | SEO description |
| `tags` | array | ✅ | Post categories/tags |
| `author` | string | ✅ | Post author |
| `readTime` | string | ❌ | Estimated reading time (auto-calculated if not provided) |
| `featured` | boolean | ❌ | Whether this is a featured post |
| `draft` | boolean | ❌ | Whether this post is a draft |

## Migration Tool

Use the migration script to port existing blog posts:

### Migrate Existing Posts
```bash
node scripts/migrate-blog.js
```

Follow the interactive prompts to:
- Select your existing blog directory
- Convert frontmatter to the new format
- Generate proper slugs
- Add missing metadata

### Create New Posts
```bash
node scripts/migrate-blog.js --new
```

This creates a new post template with:
- Interactive metadata input
- Auto-generated slug
- Proper frontmatter structure
- Content template

## Writing Posts

### Markdown Support

The blog supports standard markdown with these features:

#### Headers
```markdown
# H1 Header
## H2 Header
### H3 Header
```

#### Text Formatting
```markdown
**Bold text**
*Italic text*
`Inline code`
```

#### Lists
```markdown
- Bullet point 1
- Bullet point 2
- **Bold bullet point**
```

#### Blockquotes
```markdown
> This is a blockquote for important notes
```

#### Code Blocks
```markdown
```javascript
function example() {
  return "Hello World"
}
```
```

#### Horizontal Rules
```markdown
---
```

### Best Practices

1. **Use descriptive titles** - Clear, SEO-friendly titles
2. **Write compelling descriptions** - Used for SEO and social sharing
3. **Tag appropriately** - Use relevant tags for organization
4. **Structure content** - Use headers to organize your content
5. **Add reading time** - Helps readers know what to expect
6. **Optimize for mobile** - Content is automatically responsive

## Customization

### Styling

The blog uses Tailwind CSS classes and inherits your site's dark theme. Key styles:

- `bg-gray-800/50` - Card backgrounds
- `border-gray-700` - Card borders
- `text-blue-400` - Link colors
- `text-gray-300` - Body text
- `text-gray-400` - Meta text

### Adding Features

#### Search Functionality
```typescript
import { searchPosts } from '@/lib/blog'

const results = searchPosts('react')
```

#### Tag-based Filtering
```typescript
import { getPostsByTag } from '@/lib/blog'

const reactPosts = getPostsByTag('react')
```

#### Featured Posts
```typescript
import { getFeaturedPosts } from '@/lib/blog'

const featured = getFeaturedPosts()
```

### Custom Components

You can extend the blog with custom React components by modifying the content formatter in `src/app/blog/[slug]/page.tsx`.

## SEO and Performance

### Automatic SEO
- Meta titles and descriptions from frontmatter
- Open Graph tags for social sharing
- Twitter Card support
- Structured data for search engines

### Performance Features
- Static generation for fast loading
- Automatic image optimization (when using Next.js Image)
- Minimal JavaScript for content pages
- Efficient code splitting

## Deployment

### Build Process
```bash
npm run build
```

This generates static pages for all blog posts.

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Vercel automatically detects Next.js configuration
3. Every push triggers a new deployment
4. Blog posts are statically generated for maximum performance

### Manual Deployment
1. Run `npm run build`
2. Upload the `.next` directory to your hosting provider
3. Configure your server to serve static files

## Content Management

### Directory Organization

Consider organizing posts by date:
```
src/posts/
├── 2024/
│   ├── 01-january/
│   │   ├── post-1.md
│   │   └── post-2.md
│   └── 02-february/
│       └── post-3.md
└── drafts/
    └── work-in-progress.md
```

### Draft Posts

Set `draft: true` in frontmatter to exclude posts from the public blog while working on them.

### Featured Posts

Set `featured: true` to highlight important posts in your blog listing.

## API Reference

### Blog Utilities (`src/lib/blog.ts`)

#### `getAllPosts(): BlogPostMeta[]`
Returns all published posts sorted by date (newest first).

#### `getPostBySlug(slug: string): BlogPost | null`
Returns a specific post by its slug, including full content.

#### `getAllPostSlugs(): string[]`
Returns array of all post slugs for static generation.

#### `getPostsByTag(tag: string): BlogPostMeta[]`
Returns posts filtered by a specific tag.

#### `getAllTags(): string[]`
Returns all unique tags used across posts.

#### `getFeaturedPosts(): BlogPostMeta[]`
Returns only featured posts.

#### `searchPosts(query: string): BlogPostMeta[]`
Search posts by title, description, tags, or author.

#### `formatDate(dateString: string): string`
Formats dates in a readable format.

## Troubleshooting

### Common Issues

**Posts not showing up:**
- Check that frontmatter is properly formatted
- Ensure `draft: false` or remove the draft field
- Verify the file is in `src/posts/` with `.md` extension

**Build errors:**
- Check frontmatter syntax (YAML format)
- Ensure all required fields are present
- Verify markdown syntax

**Styling issues:**
- Check Tailwind CSS is properly configured
- Ensure dark mode classes are applied
- Verify component structure matches expectations

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run build and start production server
npm run start

# Lint code
npm run lint
```

## Future Enhancements

Consider adding these features as your blog grows:

- **RSS Feed** - For blog subscribers
- **Comments** - Integration with services like Disqus
- **Newsletter** - Email subscription functionality
- **Analytics** - Track popular posts and user engagement
- **Full-text Search** - Client-side or server-side search
- **Related Posts** - Suggest similar content
- **Series/Collections** - Group related posts together

## Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the Next.js documentation
3. Check the Tailwind CSS documentation for styling questions
4. Refer to the markdown specification for content formatting

Happy blogging! 🚀