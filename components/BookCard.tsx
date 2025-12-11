import React, { useRef, useState } from 'react';
import { Book, ViewMode } from '../types';
import { BookOpenIcon, CheckCircleIcon, SquareIcon } from './Icons';

interface BookCardProps {
  book: Book;
  variants?: Book[]; // All versions of this book (e.g. EPUB, PDF)
  viewMode: ViewMode;
  onClick: (book: Book) => void;
  index?: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  variants = [],
  viewMode, 
  onClick, 
  index = 0,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  
  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onToggleSelect) {
        e.stopPropagation();
        onToggleSelect(book);
    } else {
        onClick(book);
    }
  };

  // Get unique file types from variants or fallback to current book
  const fileTypes = variants.length > 0 
    ? Array.from(new Set(variants.map(v => v.fileType))).sort()
    : [book.fileType];
  
  const hasMultipleVersions = variants.length > 1;

  // 3D Tilt Logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSelectionMode || viewMode === ViewMode.LIST || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (limit to +/- 15 degrees)
    const rotateY = ((x - centerX) / centerX) * 15;
    const rotateX = ((centerY - y) / centerY) * 15; // Invert Y for natural tilt

    // Calculate glare position (opposite to mouse)
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({ x: glareX, y: glareY, opacity: 0.4 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  // Selection Overlay Component
  const SelectOverlay = () => {
    if (!isSelectionMode) return null;
    return (
        <div className={`absolute top-2 right-2 z-30 transition-transform duration-200 ${isSelected ? 'scale-110' : 'scale-100 hover:scale-110'}`}>
            {isSelected ? (
                <div className="bg-primary text-white rounded-full p-1 shadow-md">
                    <CheckCircleIcon className="w-5 h-5" />
                </div>
            ) : (
                <div className="bg-black/30 text-white/80 rounded-full p-1 shadow-sm backdrop-blur-sm border border-white/40">
                     <SquareIcon className="w-5 h-5" />
                </div>
            )}
        </div>
    );
  };

  // CSS-only realistic 3D book cover
  const Cover = () => (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full aspect-[2/3] transition-transform duration-200 ease-out`}
      style={{
        transformStyle: 'preserve-3d',
        transform: viewMode === ViewMode.GRID && !isSelectionMode 
            ? `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1.02, 1.02, 1.02)` 
            : 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'
      }}
    >
      <SelectOverlay />

      {/* Book Shadow/Depth */}
      <div 
        className="absolute top-4 left-4 w-full h-full bg-stone-900/20 dark:bg-black/60 rounded-r-md blur-xl transform transition-all duration-300" 
        style={{ 
            transform: `translateZ(-20px) translateX(${rotate.y * -0.5}px) translateY(${rotate.x * -0.5}px)`,
            opacity: isSelectionMode ? 0 : 1
        }}
      />

      {/* Pages Effect (Right Side) */}
      <div 
        className="absolute top-[2px] right-[2px] bottom-[2px] w-4 bg-[#fdfbf7] border-l border-stone-200 dark:border-stone-700 rounded-r-sm transform translate-x-2 z-0"
        style={{ transform: 'translateX(8px) translateZ(-5px) rotateY(5deg)' }}
      >
        <div className="w-full h-full opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, #e5e5e5 2px)' }}></div>
      </div>
      
      {/* Pages Effect (Bottom) */}
      <div 
        className="absolute bottom-0 left-1 right-2 h-3 bg-[#fdfbf7] border-t border-stone-200 dark:border-stone-700 transform translate-y-2 z-0 rounded-bl-sm rounded-br-sm"
        style={{ transform: 'translateY(8px) translateZ(-5px) rotateX(5deg)' }}
      >
        <div className="w-full h-full opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, #e5e5e5 2px)' }}></div>
      </div>

      {/* Main Cover */}
      <div 
        className={`relative h-full w-full rounded-l-[2px] rounded-r-md overflow-hidden z-10 flex flex-col justify-between shadow-inner transition-all duration-300 ${isSelected ? 'ring-4 ring-primary ring-offset-2' : 'dark:border dark:border-white/10'}`}
        style={{ 
          backgroundColor: book.coverColor,
          borderBottomWidth: book.groupColor ? '6px' : '0px',
          borderBottomColor: book.groupColor || 'transparent',
          transform: 'translateZ(10px)',
        }}
      >
        {/* Dynamic Glare Effect */}
        <div 
            className="absolute inset-0 pointer-events-none z-30 mix-blend-overlay transition-opacity duration-200"
            style={{
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
                opacity: glare.opacity
            }}
        />

        {/* Spine Shadow / Crease */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 via-black/5 to-transparent z-20 pointer-events-none mix-blend-multiply"></div>
        <div className="absolute left-1 top-0 bottom-0 w-[1px] bg-white/20 z-20 pointer-events-none"></div>

        {/* Content */}
        <div className="p-5 h-full flex flex-col relative z-10">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/80 mix-blend-screen">{book.author}</p>
            <h3 className="text-xl font-serif font-bold text-white leading-tight line-clamp-4 drop-shadow-md">{book.title}</h3>
            {book.seriesTitle && (
              <div className="flex items-center gap-1.5 mt-2 text-white/90">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {book.seriesIndex ? `#${book.seriesIndex}` : 'Vol.'}
                </span>
                <span className="text-xs font-medium truncate opacity-90">{book.seriesTitle}</span>
              </div>
            )}
             {book.group && !book.seriesTitle && (
              <div className="flex items-center gap-1.5 mt-2 text-white/90">
                 <span 
                    className="text-[9px] font-bold uppercase tracking-wider border border-white/30 px-1.5 py-0.5 rounded backdrop-blur-sm"
                    style={{ backgroundColor: book.groupColor, borderColor: book.groupColor ? 'transparent' : '' }}
                 >
                   Group
                 </span>
                 <span className="text-xs font-medium truncate opacity-90">{book.group}</span>
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-4 border-t border-white/20 flex flex-wrap gap-1">
            {fileTypes.map(ft => (
                <span key={ft} className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white backdrop-blur-sm">
                    {ft}
                </span>
            ))}
            {hasMultipleVersions && (
                <span className="text-[9px] font-bold bg-black/20 px-1.5 py-0.5 rounded text-white/80" title={`${variants.length} files`}>
                    +{variants.length - 1}
                </span>
            )}
          </div>
        </div>
        
        {/* Texture Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10 pointer-events-none mix-blend-overlay"></div>
      </div>
    </div>
  );

  if (viewMode === ViewMode.LIST) {
    return (
      <div 
        onClick={handleClick}
        className={`group flex items-center gap-6 p-4 rounded-xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg animate-slide-up backdrop-blur-md
            ${isSelected 
                ? 'bg-primary/5 border-primary dark:bg-primary/20' 
                : 'bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-stone-200/50 dark:border-white/5'
            }
        `}
        style={{ 
            animationDelay: `${index * 50}ms`,
            borderLeftWidth: book.groupColor ? '4px' : '1px',
            borderLeftColor: book.groupColor || (isSelected ? '' : 'transparent')
        }}
      >
        <div className="relative">
             <div className="w-12 h-16 shrink-0 rounded shadow-md overflow-hidden relative transform transition-transform group-hover:scale-105" style={{ backgroundColor: book.coverColor }}>
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white/40">
                    <BookOpenIcon className="w-6 h-6" />
                </div>
             </div>
             {hasMultipleVersions && (
                <div className="absolute -bottom-2 -right-2 bg-stone-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white z-10">
                    {variants.length}
                </div>
             )}
             {isSelectionMode && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full z-20">
                     {isSelected ? <CheckCircleIcon className="w-5 h-5 text-primary fill-white" /> : <SquareIcon className="w-5 h-5 text-stone-300" />}
                </div>
             )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h3 className="text-stone-900 dark:text-stone-100 font-serif font-semibold text-lg truncate group-hover:text-primary transition-colors">{book.title}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
                {book.seriesTitle && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{book.seriesTitle} #{book.seriesIndex}</span>
                )}
                {book.group && (
                    <span 
                        className="text-xs font-medium text-stone-500 bg-stone-100 dark:bg-white/10 dark:text-stone-300 px-1.5 py-0.5 rounded flex items-center gap-1"
                        style={{ 
                            backgroundColor: book.groupColor ? `${book.groupColor}20` : '', 
                            color: book.groupColor 
                        }}
                    >
                        {book.group}
                    </span>
                )}
            </div>
          </div>
          <p className="text-stone-600 dark:text-stone-400 text-sm truncate">{book.author}</p>
        </div>
        
        {/* Formats in List View */}
        <div className="flex gap-1">
             {fileTypes.map(ft => (
                <span key={ft} className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/10 px-2 py-1 rounded">
                    {ft}
                </span>
            ))}
        </div>

        <div className="hidden sm:block text-stone-600 dark:text-stone-400 text-xs font-medium uppercase tracking-wider px-3 py-1 bg-stone-100 dark:bg-white/10 rounded-full">{book.genre}</div>
        <div className="hidden sm:block text-stone-500 dark:text-stone-500 text-sm font-mono opacity-60">{book.releaseDate}</div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick} 
      className={`group cursor-pointer flex flex-col gap-4 animate-slide-up ${isSelectionMode ? 'scale-95 opacity-80' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative perspective-1000 p-2">
        <Cover />
      </div>
      <div className="space-y-1 px-1">
        <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">{book.title}</h3>
        <p className="text-stone-500 dark:text-stone-400 text-sm line-clamp-1">{book.author}</p>
      </div>
    </div>
  );
};