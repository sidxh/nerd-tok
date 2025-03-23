# NerdTok 🧠

A TikTok-style interface for exploring Computer Science Research Papers and Technical Content. Swipe through curated research papers from ArXiv and high-quality technical content from around the web!

## Features 🚀

- **Research Papers**: Browse through computer science research papers from ArXiv
- **Tech Articles**: Discover curated technical blogs and engineering articles
- **Video Content**: Access hand-picked technical talks and tutorials
- **Like & Save**: Save your favorite papers and articles for later reference
- **Export**: Export your liked items in JSON format
- **Mobile-First**: Responsive design that works great on all devices
- **Smart Feed**: Temporally and categorically diverse content selection

## Tech Stack 💻

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- ArXiv API Integration

## Getting Started 🏁

1. Clone the repository:
```bash
git clone https://github.com/sidxh/nerd-tok.git
cd nerd-tok
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Contributing 🤝

### Adding Technical Articles

You can contribute by adding high-quality technical articles to `src/data/curated_blog.json`. Follow this schema:

```json
{
  "id": "blog{number}",
  "title": "Article Title",
  "link": "https://link-to-article",
  "description": "Detailed technical description of the article content",
  "source": "Blog",
  "tags": ["Tag1", "Tag2", "Tag3"]
}
```

Guidelines for blog entries:
- Ensure articles are technical and in-depth
- Focus on system design, architecture, or engineering practices
- Include articles from reputable tech blogs (company engineering blogs preferred)
- Write detailed, technical descriptions
- Use relevant tags for categorization

### Adding YouTube Content

Contribute educational technical videos to `src/data/curated_youtube.json` using this schema:

```json
{
  "id": "yt{number}",
  "title": "Video Title",
  "link": "https://youtube.com/watch?v={video-id}",
  "description": "Detailed description of the video content",
  "source": "YouTube",
  "tags": ["Tag1", "Tag2", "Tag3"]
}
```

Guidelines for video entries:
- Focus on educational content (lectures, tutorials, conference talks)
- Prefer content from reputable sources (universities, conferences, known experts)
- Include comprehensive technical descriptions
- Ensure videos are high-quality and in-depth
- Use appropriate technical tags

### Contribution Process

1. Fork the repository
2. Add your entries to the respective JSON files
3. Ensure your entries follow the schema and guidelines
4. Submit a pull request with your additions
5. Include a brief description of the added content in your PR

## Technical Details 🔧

### ArXiv Integration

The platform fetches papers from ArXiv with:
- Diverse temporal distribution (from recent to classic papers)
- Category combinations (AI, SE, PL, ML, etc.)
- Quality filters (abstract length, author count)
- Rate limiting and error handling

### Content Delivery

- Batch loading with prefetching
- Infinite scroll implementation
- Smart content mixing (papers, blogs, videos)
- Optimized for mobile viewing

## Acknowledgments 🙏

- ArXiv for providing access to research papers
- All contributors who help curate high-quality technical content
- The open-source community for various tools and libraries used

## Contact 📧

For questions, suggestions, or issues, please:
1. Open an issue in this repository
2. Reach out on Twitter [@siddhantxh](https://x.com/siddhantxh)

---

Built with 💙 by [siddhant](https://x.com/siddhantxh)