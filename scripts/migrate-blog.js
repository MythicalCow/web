#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

function estimateReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (match) {
    const frontmatter = {};
    const frontmatterContent = match[1];
    const bodyContent = match[2];

    // Parse YAML-like frontmatter
    frontmatterContent.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Handle arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
        } else {
          // Remove quotes
          value = value.replace(/^['"]|['"]$/g, '');
        }

        frontmatter[key] = value;
      }
    });

    return { frontmatter, content: bodyContent };
  }

  return { frontmatter: {}, content };
}

function createStandardFrontmatter(data) {
  const {
    title,
    date = new Date().toISOString().split('T')[0],
    description = '',
    tags = [],
    author = 'You',
    readTime,
    featured = false,
    draft = false
  } = data;

  const tagsString = Array.isArray(tags)
    ? `[${tags.map(tag => `'${tag}'`).join(', ')}]`
    : `['${tags}']`;

  return `---
title: ${title}
date: ${date}
description: ${description}
tags: ${tagsString}
author: ${author}
readTime: ${readTime}
featured: ${featured}
draft: ${draft}
---

`;
}

async function migrateFile(inputPath, outputDir) {
  try {
    console.log(`\nProcessing: ${inputPath}`);

    const content = fs.readFileSync(inputPath, 'utf8');
    const { frontmatter, content: bodyContent } = extractFrontmatter(content);

    // Get missing information
    const title = frontmatter.title || await question('Enter post title: ');
    const description = frontmatter.description || await question('Enter post description: ');

    let tags = frontmatter.tags || [];
    if (!Array.isArray(tags) || tags.length === 0) {
      const tagsInput = await question('Enter tags (comma separated): ');
      tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    const author = frontmatter.author || await question('Enter author name (or press enter for "You"): ') || 'You';
    const featured = frontmatter.featured || (await question('Is this a featured post? (y/N): ')).toLowerCase() === 'y';
    const draft = frontmatter.draft || (await question('Is this a draft? (y/N): ')).toLowerCase() === 'y';

    const slug = frontmatter.slug || generateSlug(title);
    const readTime = frontmatter.readTime || estimateReadTime(bodyContent);

    const newFrontmatter = createStandardFrontmatter({
      title,
      date: frontmatter.date,
      description,
      tags,
      author,
      readTime,
      featured,
      draft
    });

    const outputContent = newFrontmatter + bodyContent;
    const outputPath = path.join(outputDir, `${slug}.md`);

    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      const overwrite = await question(`File ${slug}.md already exists. Overwrite? (y/N): `);
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Skipped.');
        return;
      }
    }

    fs.writeFileSync(outputPath, outputContent);
    console.log(`✅ Migrated to: ${outputPath}`);

  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message);
  }
}

async function migrateBlog() {
  console.log('🚀 Blog Migration Utility');
  console.log('This tool helps you migrate existing markdown blog posts to the new format.\n');

  const inputPath = await question('Enter the path to your existing blog posts directory (or single file): ');
  const outputDir = path.join(process.cwd(), 'src', 'posts');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
  }

  try {
    const stats = fs.statSync(inputPath);

    if (stats.isFile()) {
      if (path.extname(inputPath) === '.md') {
        await migrateFile(inputPath, outputDir);
      } else {
        console.log('❌ Please provide a markdown (.md) file.');
      }
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(inputPath)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(inputPath, file));

      if (files.length === 0) {
        console.log('❌ No markdown files found in the directory.');
        rl.close();
        return;
      }

      console.log(`Found ${files.length} markdown files.`);
      const migrateAll = await question('Migrate all files? (Y/n): ');

      if (migrateAll.toLowerCase() === 'n') {
        console.log('Migration cancelled.');
        rl.close();
        return;
      }

      for (const file of files) {
        await migrateFile(file, outputDir);
      }
    }

    console.log('\n✨ Migration completed!');
    console.log(`\nMigrated files are now in: ${outputDir}`);
    console.log('\nNext steps:');
    console.log('1. Review the migrated files');
    console.log('2. Update any file paths or image references');
    console.log('3. Run `npm run build` to test your blog');
    console.log('4. Start the dev server with `npm run dev`');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  rl.close();
}

// Interactive mode for creating new posts
async function createNewPost() {
  console.log('📝 Create New Blog Post\n');

  const title = await question('Post title: ');
  const description = await question('Post description: ');
  const tagsInput = await question('Tags (comma separated): ');
  const author = await question('Author (or press enter for "You"): ') || 'You';
  const featured = (await question('Featured post? (y/N): ')).toLowerCase() === 'y';
  const draft = (await question('Save as draft? (y/N): ')).toLowerCase() === 'y';

  const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
  const slug = generateSlug(title);

  const frontmatter = createStandardFrontmatter({
    title,
    description,
    tags,
    author,
    readTime: '1 min read', // Will be updated when content is added
    featured,
    draft
  });

  const content = frontmatter + `# ${title}

Write your blog post content here...

## Introduction

Start with an engaging introduction that hooks your readers.

## Main Content

Add your main content with proper headings and structure.

## Conclusion

Wrap up with a strong conclusion.

---

*Published on ${new Date().toLocaleDateString()}*
`;

  const outputDir = path.join(process.cwd(), 'src', 'posts');
  const outputPath = path.join(outputDir, `${slug}.md`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, content);
  console.log(`✅ Created new post: ${outputPath}`);
  console.log('\nEdit the file to add your content, then run `npm run dev` to preview.');

  rl.close();
}

// Command line argument handling
const args = process.argv.slice(2);
if (args.includes('--new') || args.includes('-n')) {
  createNewPost();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 Blog Migration and Creation Utility

Usage:
  node scripts/migrate-blog.js          # Migrate existing blog posts
  node scripts/migrate-blog.js --new    # Create a new blog post
  node scripts/migrate-blog.js --help   # Show this help

Migration features:
- Converts existing markdown files to the new format
- Standardizes frontmatter structure
- Generates slugs automatically
- Estimates reading time
- Supports batch migration

New post features:
- Interactive post creation
- Automatic slug generation
- Frontmatter template
- Content template
  `);
  process.exit(0);
} else {
  migrateBlog();
}
