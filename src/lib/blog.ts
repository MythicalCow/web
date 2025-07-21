import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface BlogPost {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  author: string
  readTime: string
  content: string
  featured?: boolean
  draft?: boolean
}

export interface BlogPostMeta {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  author: string
  readTime: string
  featured?: boolean
  draft?: boolean
}

const postsDirectory = path.join(process.cwd(), 'src/posts')

export function getAllPosts(): BlogPostMeta[] {
  try {
    const fileNames = fs.readdirSync(postsDirectory)
    const allPostsData = fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => {
        const slug = fileName.replace(/\.md$/, '')
        const fullPath = path.join(postsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data } = matter(fileContents)

        return {
          slug,
          title: data.title || 'Untitled',
          date: data.date ? new Date(data.date).toISOString().split('T')[0] : '2024-01-01',
          description: data.description || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          author: data.author || 'Anonymous',
          readTime: data.readTime || estimateReadTime(fileContents),
          featured: data.featured || false,
          draft: data.draft || false,
        }
      })
      .filter(post => !post.draft)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return allPostsData
  } catch (error) {
    console.error('Error reading posts:', error)
    return []
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : '2024-01-01',
      description: data.description || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      author: data.author || 'Anonymous',
      readTime: data.readTime || estimateReadTime(content),
      content,
      featured: data.featured || false,
      draft: data.draft || false,
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error)
    return null
  }
}

export function getAllPostSlugs(): string[] {
  try {
    const fileNames = fs.readdirSync(postsDirectory)
    return fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => fileName.replace(/\.md$/, ''))
  } catch (error) {
    console.error('Error reading post slugs:', error)
    return []
  }
}

function estimateReadTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
  const allPosts = getAllPosts()
  return allPosts.filter(post =>
    post.tags.some(postTag =>
      postTag.toLowerCase() === tag.toLowerCase()
    )
  )
}

export function getAllTags(): string[] {
  const allPosts = getAllPosts()
  const tags = new Set<string>()

  allPosts.forEach(post => {
    post.tags.forEach(tag => tags.add(tag))
  })

  return Array.from(tags).sort()
}

export function getFeaturedPosts(): BlogPostMeta[] {
  const allPosts = getAllPosts()
  return allPosts.filter(post => post.featured)
}

export function getRecentPosts(limit: number = 5): BlogPostMeta[] {
  const allPosts = getAllPosts()
  return allPosts.slice(0, limit)
}

// Utility function to help migrate existing blog posts
export function generateFrontmatter(title: string, description: string, tags: string[] = [], author: string = 'You'): string {
  const date = new Date().toISOString().split('T')[0]
  const frontmatter = `---
title: ${title}
date: ${date}
description: ${description}
tags: [${tags.map(tag => `'${tag}'`).join(', ')}]
author: ${author}
readTime: auto
featured: false
draft: false
---

`
  return frontmatter
}

// Search functionality
export function searchPosts(query: string): BlogPostMeta[] {
  const allPosts = getAllPosts()
  const searchTerm = query.toLowerCase()

  return allPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm) ||
    post.description.toLowerCase().includes(searchTerm) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    post.author.toLowerCase().includes(searchTerm)
  )
}
