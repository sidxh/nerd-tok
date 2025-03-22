"use client"

import { useState, useCallback } from 'react';
import youtubeResources from '@/data/curated_youtube.json';
import blogResources from '@/data/curated_blog.json';

export interface Article {
  id: string;
  title: string;
  link: string;
  description: string;
  source: string;
  tags?: string[];
}

const BLOG_COUNT = 8;
const YOUTUBE_COUNT = 2;
const LOADING_DELAY = 1000; // 1 second delay

export const useArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedIndices, setUsedIndices] = useState({
    youtube: new Set<number>(),
    blog: new Set<number>()
  });
  const [batchCount, setBatchCount] = useState(0);

  const resetArticles = useCallback(() => {
    setUsedIndices({
      youtube: new Set<number>(),
      blog: new Set<number>()
    });
    setBatchCount(0);
    setArticles([]);
  }, []);

  // Helper function to get random indices that haven't been used yet
  const getRandomIndices = useCallback((max: number, count: number, usedSet: Set<number>) => {
    const available = Array.from({ length: max }, (_, i) => i)
      .filter(i => !usedSet.has(i));
    
    const selected: number[] = [];
    while (selected.length < count && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      selected.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }
    return selected;
  }, []);

  const getNextBatchOfArticles = useCallback(() => {
    const newBatch: Article[] = [];
    
    // Get random blog articles
    const blogIndices = getRandomIndices(
      blogResources.length,
      BLOG_COUNT,
      usedIndices.blog
    );
    
    blogIndices.forEach(index => {
      const article = blogResources[index];
      newBatch.push({
        ...article,
        id: `blog-${batchCount}-${index}`
      });
    });

    // Get random YouTube articles
    const youtubeIndices = getRandomIndices(
      youtubeResources.resources.length,
      YOUTUBE_COUNT,
      usedIndices.youtube
    );
    
    youtubeIndices.forEach(index => {
      const article = youtubeResources.resources[index];
      newBatch.push({
        ...article,
        id: `youtube-${batchCount}-${index}`
      });
    });

    if (newBatch.length > 0) {
      // Update used indices
      setUsedIndices(prev => ({
        blog: new Set([...prev.blog, ...blogIndices]),
        youtube: new Set([...prev.youtube, ...youtubeIndices])
      }));
      setBatchCount(prev => prev + 1);
    }

    return newBatch;
  }, [batchCount, usedIndices, getRandomIndices]);

  const fetchArticles = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      const newBatch = getNextBatchOfArticles();
      
      if (newBatch.length === 0) {
        setLoading(false);
        return;
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, LOADING_DELAY));

      setArticles(prev => [...prev, ...newBatch]);
    } finally {
      setLoading(false);
    }
  }, [loading, getNextBatchOfArticles]);

  const hasMore = useCallback(() => {
    return usedIndices.blog.size < blogResources.length ||
           usedIndices.youtube.size < youtubeResources.resources.length;
  }, [usedIndices]);

  return {
    articles,
    loading,
    fetchArticles,
    resetArticles,
    hasMore: hasMore()
  };
}; 