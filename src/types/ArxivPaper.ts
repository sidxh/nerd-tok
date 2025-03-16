export interface ArxivPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  pdfUrl: string;
  publishedDate: string;
  categories: { term: string; id: string; }[];
  source?: string;  // Optional source field for articles
} 