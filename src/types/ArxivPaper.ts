export interface ArxivPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  pdfUrl: string;
  publishedDate: string;
  categories: { term: string; id: string; }[];
} 