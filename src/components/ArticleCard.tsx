import { Article } from '@/hooks/useArticles';
import { ExternalLink } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  const getSourceColor = (source: string) => {
    const colors: { [key: string]: string } = {
      'YouTube': 'text-red-500',
      'Blog': 'text-green-500',
      'Course': 'text-blue-500',
      'Book': 'text-purple-500'
    };
    return colors[source] || 'text-gray-500';
  };

  return (
    <div className="h-screen w-full snap-start flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-xl font-bold flex-1">{article.title}</h2>
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors p-2"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        <p className="text-gray-300 text-lg leading-relaxed">
          {article.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className={`${getSourceColor(article.source)} font-medium`}>
            {article.source}
          </span>
        </div>
      </div>
    </div>
  );
}; 