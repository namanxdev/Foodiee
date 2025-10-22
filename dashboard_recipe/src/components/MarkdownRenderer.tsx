import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Style headings
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-black dark:text-white mb-4 border-b-2 border-orange-300 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-black dark:text-white mb-3 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-orange-700 dark:text-orange-400 mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-black dark:text-gray-200 mb-2 mt-3">
              {children}
            </h4>
          ),
          
          // Style paragraphs
          p: ({ children }) => (
            <p className="text-black dark:text-gray-200 mb-3 leading-relaxed">
              {children}
            </p>
          ),
          
          // Style lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 ml-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 ml-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-black dark:text-gray-200 leading-relaxed">
              {children}
            </li>
          ),
          
          // Style emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-black dark:text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-black dark:text-gray-200">
              {children}
            </em>
          ),
          
          // Style code
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded font-mono text-sm">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-gray-100 dark:bg-gray-800 text-black dark:text-gray-200 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                {children}
              </code>
            );
          },
          
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-orange-400 pl-4 py-2 mb-4 bg-orange-50 dark:bg-orange-900/20 italic text-black dark:text-gray-200">
              {children}
            </blockquote>
          ),
          
          // Style horizontal rules
          hr: () => (
            <hr className="my-6 border-t-2 border-gray-200 dark:border-gray-600" />
          ),
          
          // Style links
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline font-medium"
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Style tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-orange-100 dark:bg-orange-900/30">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-black dark:text-white border-b border-gray-200 dark:border-gray-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-black dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}