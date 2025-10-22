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
            <h1 className="text-3xl font-bold text-gray-800 mb-4 border-b-2 border-orange-300 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-gray-800 mb-3 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-orange-700 mb-2 mt-4">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-gray-700 mb-2 mt-3">
              {children}
            </h4>
          ),
          
          // Style paragraphs
          p: ({ children }) => (
            <p className="text-gray-700 mb-3 leading-relaxed">
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
            <li className="text-gray-700 leading-relaxed">
              {children}
            </li>
          ),
          
          // Style emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-gray-800">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          ),
          
          // Style code
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono text-sm">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                {children}
              </code>
            );
          },
          
          // Style blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-orange-400 pl-4 py-2 mb-4 bg-orange-50 italic text-gray-700">
              {children}
            </blockquote>
          ),
          
          // Style horizontal rules
          hr: () => (
            <hr className="my-6 border-t-2 border-gray-200" />
          ),
          
          // Style links
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-orange-600 hover:text-orange-800 underline font-medium"
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Style tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-orange-100">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-gray-800 border-b border-gray-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-gray-700 border-b border-gray-100">
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