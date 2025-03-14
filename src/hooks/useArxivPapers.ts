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
  const [dateBuffers, setDateBuffers] = useState<Map<string, ArxivPaper[]>>(new Map());
  const [prefetchedBatch, setPrefetchedBatch] = useState<ArxivPaper[]>([]);
  
  // Track shown papers to avoid duplicates
  const shownPapers = useRef(new Set<string>());
  // Track used date windows to ensure even distribution
  const usedDateWindows = useRef(new Map<string, number>());
  const isFetching = useRef(false);
  const isPrefetching = useRef(false);

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
    const categories = CATEGORY_GROUPS[Math.floor(Math.random() * CATEGORY_GROUPS.length)];
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

    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "text/xml");
    const entries = xmlDoc.getElementsByTagName("entry");

    return Array.from(entries)
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
        if (shownPapers.current.has(paper.id)) return false;
        if (paper.abstract.length < 500) return false;
        if (!paper.pdfUrl) return false;
        if (paper.authors.length < 2) return false;
        
        shownPapers.current.add(paper.id);
        return true;
      });
  };

  const fetchPapers = useCallback(async (forBuffer = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      console.log('Fetching papers...');
      
      // Fetch papers from different time periods
      const newBatch: ArxivPaper[] = [];
      const usedWindows = new Set();
      
      // Get 4 sub-batches from different time periods
      while (newBatch.length < BATCH_SIZE) {
        // Get a random date window that hasn't been used in this batch
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

      // Shuffle the final batch for additional randomness
      const shuffledBatch = newBatch
        .sort(() => Math.random() - 0.5)
        .slice(0, BATCH_SIZE);

      if (forBuffer) {
        const newBuffers = new Map(dateBuffers);
        shuffledBatch.forEach(paper => {
          const year = new Date(paper.publishedDate).getFullYear().toString();
          const existing = newBuffers.get(year) || [];
          newBuffers.set(year, [...existing, paper]);
        });
        setDateBuffers(newBuffers);
      } else {
        setPapers(prev => [...prev, ...shuffledBatch]);
      }
    } catch (error) {
      console.error("Error fetching papers:", error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const prefetchNextBatch = useCallback(async () => {
    if (isPrefetching.current) return;
    isPrefetching.current = true;

    try {
      const newBatch: ArxivPaper[] = [];
      const usedWindows = new Set();
      
      for (let i = 0; i < 4; i++) {
        let dateWindow;
        do {
          dateWindow = getRandomDateWindow();
        } while (usedWindows.has(dateWindow.start) && usedWindows.size < DATE_WINDOWS.length);
        
        usedWindows.add(dateWindow.start);
        
        if (i > 0) await delay(API_DELAY);
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
    } catch (error) {
      console.error("Error prefetching papers:", error);
    } finally {
      isPrefetching.current = false;
    }
  }, []);

  useEffect(() => {
    prefetchNextBatch();
  }, [prefetchNextBatch]);

  const getMorePapers = useCallback(() => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);

    try {
      if (prefetchedBatch.length >= BATCH_SIZE) {
        setPapers(prev => [...prev, ...prefetchedBatch]);
        setPrefetchedBatch([]);
        prefetchNextBatch();
      } else {
        fetchPapers(false);
      }
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }, [prefetchedBatch, prefetchNextBatch, fetchPapers]);

  return { 
    papers, 
    loading, 
    fetchPapers: getMorePapers 
  };
} 