"use client"

import { useState, useCallback, useRef, useEffect } from "react";
import { ArxivPaper } from '@/types/ArxivPaper';

// Constants for configuration
const BATCH_SIZE = 20;
const SUB_BATCH_SIZE = 5; // Each batch will have 4 sub-batches of 5 papers
const API_DELAY = 3000;

// Date windows for temporal diversity (YYYYMMDD format)
const DATE_WINDOWS = [
  { start: "2023", end: "2024" },    // Current papers
  { start: "2021", end: "2022" },    // 2-3 years old
  { start: "2018", end: "2020" },    // 3-5 years old
  { start: "2015", end: "2017" },    // 5-8 years old
  { start: "2010", end: "2014" }     // Classic papers
];

// Category combinations for subject diversity
const CATEGORY_GROUPS = [
  ['cs.AI', 'cs.SE'],      // AI + Software Engineering
  ['cs.PL', 'cs.LG'],      // Programming Languages + Machine Learning
  ['cs.SE', 'cs.DC'],      // Software Engineering + Distributed Computing
  ['cs.AI', 'cs.CV'],      // AI + Computer Vision
  ['cs.PL', 'cs.DB']       // Programming Languages + Databases
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useArxivPapers() {
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefetchedBatch, setPrefetchedBatch] = useState<ArxivPaper[]>([]);
  const [isInitialPhase, setIsInitialPhase] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  // Track shown papers to avoid duplicates
  const shownPapers = useRef(new Set<string>());
  // Track used date windows to ensure even distribution
  const usedDateWindows = useRef(new Map<string, number>());
  const isFetching = useRef(false);
  const isPrefetching = useRef(false);
  const fetchAttempts = useRef(0);

  // Maximum number of papers to fetch (3 batches of 20)
  const MAX_PAPERS = 60;

  const getRandomDateWindow = () => {
    // Sort date windows by usage count (prefer less used windows)
    const sortedWindows = DATE_WINDOWS.sort((a, b) => {
      const aCount = usedDateWindows.current.get(a.start) || 0;
      const bCount = usedDateWindows.current.get(b.start) || 0;
      return aCount - bCount;
    });
    
    // Select from least used windows with some randomness
    const windowIndex = Math.floor(Math.random() * Math.min(3, sortedWindows.length));
    const selectedWindow = sortedWindows[windowIndex];
    
    // Update usage count
    usedDateWindows.current.set(
      selectedWindow.start,
      (usedDateWindows.current.get(selectedWindow.start) || 0) + 1
    );
    
    return selectedWindow;
  };

  const fetchSubBatch = async (dateWindow: typeof DATE_WINDOWS[0]) => {
    // console.log(`[ArXiv] Fetching sub-batch for date window: ${dateWindow.start}-${dateWindow.end}`);
    
    const categories = CATEGORY_GROUPS[Math.floor(Math.random() * CATEGORY_GROUPS.length)];
    // console.log(`[ArXiv] Selected categories:`, categories);
    
    const dateQuery = `submittedDate:[${dateWindow.start} TO ${dateWindow.end}]`;
    const categoryQuery = categories.map(cat => `cat:${cat}`).join(' OR ');
    const searchQuery = `(${categoryQuery}) AND ${dateQuery}`;
    
    const baseUrl = 'https://export.arxiv.org/api/query';
    const params = new URLSearchParams({
      search_query: searchQuery,
      sortBy: 'submittedDate',
      max_results: '50',
      start: Math.floor(Math.random() * 1000).toString()
    });

    // console.log(`[ArXiv] Making API request with query:`, searchQuery);
    
    try {
      const response = await fetch(`${baseUrl}?${params}`);
      // console.log(`[ArXiv] Response status:`, response.status);
      // console.log(`[ArXiv] Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");
      const entries = xmlDoc.getElementsByTagName("entry");
      // console.log(`[ArXiv] Found ${entries.length} entries in response`);

      const papers = Array.from(entries)
        .map(entry => ({
          id: entry.querySelector("id")?.textContent || "",
          title: entry.querySelector("title")?.textContent || "",
          abstract: entry.querySelector("summary")?.textContent || "",
          authors: Array.from(entry.getElementsByTagName("author"))
            .map(author => author.querySelector("name")?.textContent || ""),
          pdfUrl: entry.querySelector("link[title='pdf']")?.getAttribute("href") || "",
          publishedDate: entry.querySelector("published")?.textContent || "",
          categories: Array.from(entry.getElementsByTagName("category"))
            .map((cat, index) => ({
              term: cat.getAttribute("term") || "",
              id: `${entry.querySelector("id")?.textContent || ""}_cat_${index}`
            }))
        }))
        .filter(paper => {
          if (shownPapers.current.has(paper.id)) {
            // console.log(`[ArXiv] Skipping duplicate paper:`, paper.id);
            return false;
          }
          if (paper.abstract.length < 500) {
            // console.log(`[ArXiv] Skipping paper with short abstract:`, paper.id);
            return false;
          }
          if (!paper.pdfUrl) {
            // console.log(`[ArXiv] Skipping paper without PDF:`, paper.id);
            return false;
          }
          if (paper.authors.length < 2) {
            // console.log(`[ArXiv] Skipping paper with too few authors:`, paper.id);
            return false;
          }
          
          shownPapers.current.add(paper.id);
          return true;
        });

      // console.log(`[ArXiv] Filtered to ${papers.length} valid papers`);
      return papers;
      
    } catch (error) {
      // console.error(`[ArXiv] Error in fetchSubBatch:`, error);
      // console.error(`[ArXiv] Failed request URL:`, `${baseUrl}?${params}`);
      throw error;
    }
  };

  const fetchPapers = useCallback(async () => {
    if (isFetching.current || papers.length >= MAX_PAPERS) {
      // console.log('[ArXiv] Fetch skipped - either in progress or reached max papers');
      return;
    }
    
    // console.log(`[ArXiv] Starting paper fetch. Attempt ${fetchAttempts.current + 1}`);
    isFetching.current = true;
    setLoading(true);
    fetchAttempts.current++;
    
    try {
      const newBatch: ArxivPaper[] = [];
      const usedWindows = new Set();
      
      // console.log('[ArXiv] Beginning batch collection...');
      
      while (newBatch.length < BATCH_SIZE) {
        let dateWindow;
        do {
          dateWindow = getRandomDateWindow();
        } while (usedWindows.has(dateWindow.start) && usedWindows.size < DATE_WINDOWS.length);
        
        usedWindows.add(dateWindow.start);
        
        // console.log(`[ArXiv] Waiting ${API_DELAY}ms before next request...`);
        await delay(API_DELAY);
        
        try {
          const subBatch = await fetchSubBatch(dateWindow);
          const shuffledSubBatch = subBatch
            .sort(() => Math.random() - 0.5)
            .slice(0, SUB_BATCH_SIZE);
          
          // console.log(`[ArXiv] Added ${shuffledSubBatch.length} papers from sub-batch`);
          newBatch.push(...shuffledSubBatch);
          
        } catch (subError) {
          // console.error('[ArXiv] Sub-batch fetch failed:', subError);
          continue;
        }
      }

      // console.log(`[ArXiv] Completed batch collection. Total papers: ${newBatch.length}`);
      
      const shuffledBatch = newBatch
        .sort(() => Math.random() - 0.5)
        .slice(0, BATCH_SIZE);

      setPapers(prev => {
        const newPapers = [...prev, ...shuffledBatch];
        // console.log(`[ArXiv] Updated papers. Total count: ${newPapers.length}`);
        
        // Check if we've reached the maximum papers
        if (newPapers.length >= MAX_PAPERS) {
          // console.log('[ArXiv] Reached maximum papers limit');
          setHasMore(false);
        }
        
        return newPapers;
      });
      
      setLoading(false);
      
    } catch (err) {
      // console.error("[ArXiv] Critical error in fetchPapers:", err);
      setLoading(false);
    } finally {
      // console.log('[ArXiv] Fetch complete. Resetting fetch state...');
      isFetching.current = false;
    }
  }, [papers.length]);

  const prefetchNextBatch = useCallback(async () => {
    if (isPrefetching.current || !isInitialPhase || papers.length >= MAX_PAPERS) return;
    isPrefetching.current = true;

    try {
      // console.log('[ArXiv] Starting initial prefetch...');
      const newBatch: ArxivPaper[] = [];
      const usedWindows = new Set();
      
      while (newBatch.length < BATCH_SIZE) {
        let dateWindow;
        do {
          dateWindow = getRandomDateWindow();
        } while (usedWindows.has(dateWindow.start) && usedWindows.size < DATE_WINDOWS.length);
        
        usedWindows.add(dateWindow.start);
        
        await delay(API_DELAY);
        const subBatch = await fetchSubBatch(dateWindow);
        const shuffledSubBatch = subBatch
          .sort(() => Math.random() - 0.5)
          .slice(0, SUB_BATCH_SIZE);
        
        newBatch.push(...shuffledSubBatch);
      }

      const shuffledBatch = newBatch
        .sort(() => Math.random() - 0.5)
        .slice(0, BATCH_SIZE);

      setPrefetchedBatch(shuffledBatch);
      setIsInitialPhase(false);
      // console.log('[ArXiv] Initial prefetch complete');
    } catch (error) {
      // console.error("[ArXiv] Error prefetching papers:", error);
    } finally {
      isPrefetching.current = false;
    }
  }, [isInitialPhase, papers.length]);

  // Initial load effect
  useEffect(() => {
    if (isInitialPhase && papers.length === 0) {
      // console.log('[ArXiv] Starting initial phase...');
      fetchPapers().then(() => {
        if (papers.length < MAX_PAPERS) {
          // console.log('[ArXiv] Initial fetch complete, starting prefetch...');
          prefetchNextBatch();
        }
      });
    }
  }, [isInitialPhase, papers.length, fetchPapers, prefetchNextBatch]);

  const getMorePapers = useCallback(() => {
    if (isFetching.current || papers.length >= MAX_PAPERS) {
      // console.log('[ArXiv] Not fetching more papers - either in progress or reached limit');
      return;
    }
    
    if (prefetchedBatch.length >= BATCH_SIZE) {
      // console.log('[ArXiv] Using prefetched batch');
      setPapers(prev => {
        const newPapers = [...prev, ...prefetchedBatch];
        if (newPapers.length >= MAX_PAPERS) {
          // console.log('[ArXiv] Reached maximum papers limit');
          setHasMore(false);
        }
        return newPapers;
      });
      setPrefetchedBatch([]);
    } else {
      // console.log('[ArXiv] No prefetched batch available, fetching new batch');
      fetchPapers();
    }
  }, [prefetchedBatch, papers.length, fetchPapers]);

  return { 
    papers, 
    loading, 
    fetchPapers: getMorePapers,
    hasMore // Will be false after reaching 60 papers
  };
}