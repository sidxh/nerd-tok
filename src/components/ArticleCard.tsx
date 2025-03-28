import { Article } from '@/hooks/useArticles';
import { Share2, Heart, FileText, Tag } from 'lucide-react';
import { useLikedPapers } from '@/context/LikedPapersContext';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const { toggleLike, isLiked } = useLikedPapers();
  
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'YouTube':
        return 'from-red-500 to-red-600';
      case 'Blog':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'YouTube':
        return '🎥';
      case 'Blog':
        return '📝';
      default:
        return '📄';
    }
  };

  // Calculate estimated reading time (1 minute per 200 words)
  // const getReadingTime = (text: string) => {
  //   const words = text.split(/\s+/).length;
  //   const minutes = Math.ceil(words / 200);
  //   return `${minutes} min read`;
  // };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.link
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(article.link);
      alert('Link copied to clipboard!');
    }
  };

  // const readingTime = getReadingTime(article.description);

  return (
    <div className="h-screen w-full flex items-center justify-center snap-start relative">
      <div className="h-full w-full relative">
        {/* Background with enhanced gradient and subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black opacity-95" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        {/* Content container with improved spacing and organization */}
        <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-center text-white z-10 overflow-y-auto">
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="flex-1">
              {/* Title with enhanced typography */}
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-lg mb-3 sm:mb-4 leading-tight">
                {article.title}
              </h2>
              
              {/* Source badge and metadata with improved styling */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r ${getSourceColor(article.source)} 
                  flex items-center gap-2 shadow-lg transform hover:scale-105 transition-all`}>
                  {getSourceIcon(article.source)} {article.source}
                </span>
                {/* <span className="px-4 py-2 rounded-full text-sm bg-white/10 backdrop-blur-sm 
                  flex items-center gap-2 hover:bg-white/20 transition-all">
                  <Clock className="w-4 h-4" />
                  {readingTime}
                </span> */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 sm:px-3 sm:py-2 rounded-full text-xs sm:text-sm bg-white/10 backdrop-blur-sm 
                          hover:bg-white/20 transition-all flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons with enhanced styling */}
            <div className="flex gap-2 sm:gap-3 ml-3 sm:ml-4">
              <button
                onClick={() => toggleLike({
                  id: article.id,
                  title: article.title,
                  abstract: article.description,
                  pdfUrl: article.link,
                  authors: [],
                  publishedDate: new Date().toISOString(),
                  categories: [],
                  source: article.source
                })}
                className={`p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all transform hover:scale-110 
                  ${isLiked(article.id) ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
                aria-label="Like article"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked(article.id) ? 'fill-white' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 sm:p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 
                  transition-all transform hover:scale-110"
                aria-label="Share article"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          
          {/* Description with enhanced card styling */}
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 backdrop-blur-sm 
            shadow-lg hover:bg-white/10 transition-all">
            <p className="text-gray-100 leading-relaxed text-base sm:text-lg line-clamp-8 sm:line-clamp-6">
              {article.description}
            </p>
          </div>
          
          {/* Action button with improved styling */}
          <div className="flex items-center gap-4">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 
                px-4 py-2 sm:px-6 sm:py-3 rounded-lg transition-all transform hover:scale-105 hover:from-blue-600 
                hover:to-blue-700 shadow-lg text-sm sm:text-base"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              View {article.source === 'YouTube' ? 'Video' : 'Article'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}; 