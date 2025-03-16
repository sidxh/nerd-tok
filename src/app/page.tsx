"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { Loader2, Search, X, Download, Menu } from 'lucide-react'
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
  .modal-animation {
    animation: modalFade 0.2s ease-out;
  }
  @keyframes modalFade {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

// Loader configuration for different tabs
const LOADER_CONFIG = {
  papers: {
    title: "Curating the best feed of papers for you",
    emoji: "📚🛠️",
    loadingTime: "30 seconds",
  },
  articles: {
    title: "Finding high-quality tech articles for you",
    emoji: "📱💡",
    loadingTime: "3 seconds",
  }
} as const;

type Tab = 'papers' | 'articles';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('papers');
  const [showAbout, setShowAbout] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { papers, loading: arxivLoading, fetchPapers } = useArxivPapers()
  const { articles, loading: articlesLoading, fetchArticles, hasMore, resetArticles } = useArticles()
  const { likedPapers, toggleLike } = useLikedPapers()
  const observerTarget = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Determine if we're in the initial loading state
  const isInitialLoading = activeTab === 'papers' ? (arxivLoading && papers.length === 0) : (articlesLoading && articles.length === 0);

  // Get current loader config based on active tab
  const currentLoader = LOADER_CONFIG[activeTab];

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
      <div className="h-screen w-full bg-gradient-to-b from-blue-950 to-black text-white overflow-y-scroll snap-y snap-mandatory relative mx-auto hide-scrollbar">
        {/* Navigation Bar Container */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-md border-b border-white/10 z-40 px-4">
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => window.location.reload()}
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hover:opacity-90 transition-all flex items-center gap-2"
            >
              NerdTok
            </button>

            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex gap-2 bg-white/5 backdrop-blur-sm p-1 rounded-full border border-white/10">
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

            {/* Desktop Right Navigation */}
            <div className="hidden md:flex gap-2 bg-white/5 backdrop-blur-sm p-1 rounded-full border border-white/10">
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Add top padding to content to account for fixed navbar */}
        <div className="pt-16">
          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="fixed inset-x-4 top-20 z-50 md:hidden">
              <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-2 space-y-2 modal-animation">
                <button
                  onClick={() => {
                    handleTabChange('papers');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-2 rounded-lg transition-all text-left ${
                    activeTab === 'papers'
                      ? 'bg-white text-black font-medium'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Research Papers
                </button>
                <button
                  onClick={() => {
                    handleTabChange('articles');
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-4 py-2 rounded-lg transition-all text-left ${
                    activeTab === 'articles'
                      ? 'bg-white text-black font-medium'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Articles
                </button>
                <div className="h-px bg-white/10 my-2" />
                <button
                  onClick={() => {
                    setShowAbout(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all text-left"
                >
                  About
                </button>
                <button
                  onClick={() => {
                    setShowLikes(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all text-left"
                >
                  Likes
                </button>
              </div>
            </div>
          )}

          {isInitialLoading ? (
            <div className="h-screen w-full flex items-center justify-center bg-gray-950 p-4">
              <div className="bg-gray-900/40 backdrop-blur-lg rounded-xl border border-white/5 p-6 shadow-xl max-w-md w-full transition-all duration-300 hover:shadow-indigo-500/10">
                
                {/* Refined, minimal loader */}
                <div className="relative mb-6 mx-auto w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full opacity-10 animate-pulse"></div>
                  <div className="absolute inset-1 border-2 border-indigo-300/10 border-t-indigo-400/90 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Dynamic text container */}
                <div className="space-y-3 text-center">
                  <h3 className="text-lg font-medium text-white/90 mb-4">
                    {currentLoader.title}
                    <span className="ml-1 opacity-90">{currentLoader.emoji}</span>
                  </h3>
                  
                  {/* Progress indicator */}
                  <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1 rounded-full animate-progress"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-white/40">
                      This might take up to {currentLoader.loadingTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
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
          )}

          {/* About Modal */}
          {showAbout && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900/90 p-8 rounded-2xl max-w-md relative border border-white/10 shadow-2xl modal-animation">
                <button
                  onClick={() => setShowAbout(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5 text-white/70 hover:text-white" />
                </button>
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">About NerdTok</h2>
                <p className="text-lg text-white/90 leading-relaxed mb-6">
                🧠 A TikTok-style interface for exploring Computer Science Research Papers and Interesting Articles (Blogs + Youtube Videos)
                </p>
                <p className="text-lg text-white/90 leading-relaxed mb-6">👆🏻 Swipe through the papers, save your favorites, and discover new research in an engaging way</p>
                <p className="text-lg text-white/90 leading-relaxed mb-6">🔄 You can always refresh the entire feed by clicking on the NerdTok icon in the leftmost corner.</p>
              </div>
            </div>
          )}

          {/* Likes Modal */}
          {showLikes && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900/90 p-6 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col relative border border-white/10 shadow-2xl modal-animation">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                      Liked Items
                    </h2>
                    {likedPapers.length > 0 && (
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all text-sm"
                        title="Export liked items"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowLikes(false)}
                    className="p-2 rounded-full hover:bg-white/10 transition-all"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-white/70 hover:text-white" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search liked items..."
                    className="w-full bg-white/5 text-white px-4 py-3 pl-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/10 transition-all"
                  />
                  <Search className="w-5 h-5 text-white/50 absolute left-4 top-1/2 transform -translate-y-1/2" />
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 hide-scrollbar">
                  {filteredLikedPapers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-white/70 text-lg">
                        {searchQuery ? "No matches found." : "No liked items yet."}
                      </p>
                      {!searchQuery && (
                        <p className="text-white/50 mt-2">
                          Start exploring and like some items!
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredLikedPapers.map((paper) => {
                        const isArticle = !paper.categories || paper.categories.length === 0;
                        return (
                          <div key={paper.id} className="flex gap-4 items-start group p-4 rounded-xl hover:bg-white/5 transition-all">
                            <div className="flex-1">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isArticle ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                    }`}>
                                      {isArticle ? 'Article' : 'Paper'}
                                    </span>
                                    {isArticle ? (
                                      <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/70">
                                        {paper.source || ''}
                                      </span>
                                    ) : (
                                      paper.categories?.slice(0, 2).map((cat) => (
                                        <span 
                                          key={cat.id}
                                          className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/70"
                                        >
                                          {cat.term}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                  <a
                                    href={paper.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold hover:text-blue-400 transition-colors"
                                  >
                                    {paper.title}
                                  </a>
                                </div>
                                <button
                                  onClick={() => toggleLike(paper)}
                                  className="text-white/50 hover:text-white/90 p-2 rounded-full hover:bg-white/10 transition-all flex-shrink-0"
                                  aria-label="Remove from likes"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-sm text-white/70 line-clamp-2 mt-2">
                                {paper.abstract}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App