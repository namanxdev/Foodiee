// "use client";

// import { useEffect } from 'react';

// export default function DarkModeProvider() {
//   useEffect(() => {
//     // Force dark mode detection and application
//     const applyDarkMode = () => {
//       const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       const html = document.documentElement;
//       const body = document.body;
      
//       if (isDark) {
//         html.classList.add('dark');
//         body.classList.add('dark');
//         body.setAttribute('data-theme', 'dark');
        
//         // Only style form elements, let Tailwind handle all button styling
//         const selects = document.querySelectorAll('select');
//         selects.forEach(select => {
//           const sel = select as HTMLElement;
//           sel.style.backgroundColor = '#1e293b';
//           sel.style.color = '#f1f5f9';
//           sel.style.borderColor = '#334155';
//         });
        
//         const inputs = document.querySelectorAll('input');
//         inputs.forEach(input => {
//           const inp = input as HTMLElement;
//           inp.style.backgroundColor = '#1e293b';
//           inp.style.color = '#f1f5f9';
//           inp.style.borderColor = '#334155';
//         });
        
//       } else {
//         html.classList.remove('dark');
//         body.classList.remove('dark');
//         body.removeAttribute('data-theme');
        
//         // Reset styles
//         const elements = document.querySelectorAll('button, select, input');
//         elements.forEach(el => {
//           const element = el as HTMLElement;
//           element.style.backgroundColor = '';
//           element.style.color = '';
//           element.style.borderColor = '';
//         });
//       }
//     };

//     // Apply immediately
//     applyDarkMode();

//     // Apply again after a short delay to catch dynamically rendered elements
//     setTimeout(applyDarkMode, 100);

//     // Listen for changes
//     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//     mediaQuery.addEventListener('change', applyDarkMode);

//     return () => {
//       mediaQuery.removeEventListener('change', applyDarkMode);
//     };
//   }, []);

//   return null;
// }