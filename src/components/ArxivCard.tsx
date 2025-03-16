import { Share2, Heart, FileText } from 'lucide-react';
import { useLikedPapers } from '@/context/LikedPapersContext';
import { ArxivPaper } from '@/types/ArxivPaper';

interface ArxivCardProps {
    paper: ArxivPaper;
}

const CATEGORY_NAMES: Record<string, string> = {
  'cs.AI': 'Artificial Intelligence',
  'cs.SE': 'Software Engineering', 
  'cs.PL': 'Programming Languages',
  'cs.LG': 'Machine Learning',
  'cs.DC': 'Distributed Computing',
  'cs.CV': 'Computer Vision',
  'cs.DB': 'Databases'
};

export function ArxivCard({ paper }: ArxivCardProps) {
    const { toggleLike, isLiked } = useLikedPapers();

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: paper.title,
                    text: `${paper.title} by ${paper.authors.join(', ')}`,
                    url: paper.pdfUrl
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            await navigator.clipboard.writeText(paper.pdfUrl);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center snap-start relative">
            <div className="h-full w-full relative">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
                
                {/* Content container */}
                <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center text-white z-10 overflow-y-auto">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold drop-shadow-lg mb-2 sm:mb-3">{paper.title}</h2>
                            <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3">
                                {paper.authors.join(', ')}
                            </p>
                            <div className="flex gap-2 flex-wrap mb-2 sm:mb-3">
                                {paper.categories.map((category) => (
                                    <span 
                                        key={category.id}
                                        className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        {CATEGORY_NAMES[category.term] || category.term}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3 ml-3 sm:ml-4">
                            <button
                                onClick={() => toggleLike(paper)}
                                className={`p-2 sm:p-3 rounded-full backdrop-blur-sm transition-all transform hover:scale-110 ${
                                    isLiked(paper.id)
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-white/10 hover:bg-white/20'
                                }`}
                                aria-label="Like paper"
                            >
                                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked(paper.id) ? 'fill-white' : ''}`} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2 sm:p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all transform hover:scale-110"
                                aria-label="Share paper"
                            >
                                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <p className="text-gray-100 mb-4 sm:mb-6 drop-shadow-lg line-clamp-6 sm:line-clamp-6 leading-relaxed text-sm sm:text-base">
                        {paper.abstract}
                    </p>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                        <a
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all transform hover:scale-105 text-sm sm:text-base"
                        >
                            <FileText className="w-4 h-4" />
                            View PDF
                        </a>
                        <span className="text-gray-400 text-xs sm:text-sm">
                            Published: {new Date(paper.publishedDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
