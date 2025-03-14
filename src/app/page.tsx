"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { Loader2, Search, X, Download } from 'lucide-react'
import { ArxivCard } from '@/components/ArxivCard'
import { ArticleCard } from '@/components/ArticleCard'
import { useArxivPapers } from '@/hooks/useArxivPapers'
import { useArticles } from '@/hooks/useArticles'
import { useLikedPapers } from '@/context/LikedPapersContext'

const scrollbarHideStyles = `
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;     /* Firefox */
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
`;

type Tab = 'papers' | 'articles';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('papers');
  const [showAbout, setShowAbout] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const { papers, loading: arxivLoading, fetchPapers } = useArxivPapers()
  const { articles, loading: articlesLoading, fetchArticles, hasMore, resetArticles } = useArticles()
  const { likedPapers, toggleLike } = useLikedPapers()
  const observerTarget = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'articles') {
      resetArticles();
    }
  }, [resetArticles]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting) {
        if (activeTab === 'papers' && !arxivLoading) {
          fetchPapers();
        } else if (activeTab === 'articles' && !articlesLoading && hasMore) {
          fetchArticles();
        }
      }
    },
    [activeTab, arxivLoading, articlesLoading, fetchPapers, fetchArticles, hasMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    if (activeTab === 'papers') {
      fetchPapers();
    } else if (articles.length === 0) {
      fetchArticles();
    }
  }, [activeTab, fetchPapers, fetchArticles, articles.length]);

  const filteredLikedPapers = likedPapers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.abstract.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleExport = () => {
    const simplifiedPapers = likedPapers.map(paper => ({
      title: paper.title,
      url: paper.pdfUrl,
      abstract: paper.abstract,
      authors: paper.authors,
      categories: paper.categories
    }))

    const dataStr = JSON.stringify(simplifiedPapers, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `arxivtok-favorites-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <>
      <style jsx global>{scrollbarHideStyles}</style>
      <div className="h-screen w-full bg-black text-white overflow-y-scroll snap-y snap-mandatory relative mx-auto hide-scrollbar">
        {/* Logo */}
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => window.location.reload()}
            className="text-2xl font-bold text-white hover:text-white/90 transition-all flex items-center gap-2"
          >
            ArXivTok
          </button>
        </div>

        {/* Tab Navigation - Now fixed */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-black/20 backdrop-blur-sm p-1 rounded-full border border-white/10">
          <button
            onClick={() => handleTabChange('papers')}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === 'papers'
                ? 'bg-white text-black font-medium shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Research Papers
          </button>
          <button
            onClick={() => handleTabChange('articles')}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === 'articles'
                ? 'bg-white text-black font-medium shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Articles
          </button>
        </div>

        {/* Right Navigation */}
        <div className="fixed top-4 right-4 z-50 flex gap-2 bg-black/20 backdrop-blur-sm p-1 rounded-full border border-white/10">
          <button
            onClick={() => setShowAbout(!showAbout)}
            className={`px-4 py-1.5 rounded-full transition-all ${
              showAbout 
                ? 'bg-white text-black font-medium'
                : 'text-white hover:bg-white/10'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setShowLikes(!showLikes)}
            className={`px-4 py-1.5 rounded-full transition-all ${
              showLikes
                ? 'bg-white text-black font-medium'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Likes
          </button>
        </div>

        {showAbout && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 p-6 rounded-lg max-w-md relative">
              <button
                onClick={() => setShowAbout(false)}
                className="absolute top-2 right-2 text-white/70 hover:text-white"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4">About ArXivTok</h2>
              <p className="mb-4">
                A TikTok-style interface for exploring arXiv research papers.
              </p>
            </div>
          </div>
        )}

        {showLikes && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 p-6 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col relative">
              <button
                onClick={() => setShowLikes(false)}
                className="absolute top-2 right-2 text-white/70 hover:text-white"
              >
                ✕
              </button>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Liked Papers</h2>
                {likedPapers.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Export liked papers"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                )}
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search liked papers..."
                  className="w-full bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-5 h-5 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 hide-scrollbar">
                {filteredLikedPapers.length === 0 ? (
                  <p className="text-white/70">
                    {searchQuery ? "No matches found." : "No liked papers yet."}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredLikedPapers.map((paper) => (
                      <div key={paper.id} className="flex gap-4 items-start group">
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <a
                              href={paper.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold hover:text-gray-200"
                            >
                              {paper.title}
                            </a>
                            <button
                              onClick={() => toggleLike(paper)}
                              className="text-white/50 hover:text-white/90 p-1 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              aria-label="Remove from likes"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-white/70 line-clamp-2">
                            {paper.abstract}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'papers' ? (
          papers.map((paper) => (
            <ArxivCard key={paper.id} paper={paper} />
          ))
        ) : (
          articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        )}
        
        <div ref={observerTarget} className="h-10 -mt-1" />
        {(arxivLoading || articlesLoading) && (
          <div className="h-screen w-full flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>
    </>
  )
}

export default App