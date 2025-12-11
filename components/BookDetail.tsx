import React, { useEffect, useState } from 'react';
import { Book } from '../types';
import { XIcon, DownloadIcon, TrashIcon, BookOpenIcon, EditIcon, SaveIcon, CalendarIcon, TagIcon, LayersIcon, GroupIcon, GlobeIcon, FolderIcon, ActivityIcon } from './Icons';

interface BookDetailProps {
  book: Book | null;
  variants?: Book[]; // Sibling files (e.g. PDF, EPUB)
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (book: Book) => void;
}

const COLORS = [
  '#78716c', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
];

export const BookDetail: React.FC<BookDetailProps> = ({ book, variants = [], onClose, onDelete, onUpdate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Book>>({});
  const [activeColorPicker, setActiveColorPicker] = useState<'group' | 'series' | null>(null);

  const allFiles = variants.length > 0 ? variants : (book ? [book] : []);

  useEffect(() => {
    if (book) {
      setIsVisible(true);
      setFormData({ ...book });
      setIsEditing(false);
      setActiveColorPicker(null);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [book]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSave = () => {
    if (book && formData) {
      const baseUpdate = { ...formData };
      
      allFiles.forEach(file => {
          const updatedBook = {
             ...file,
             title: baseUpdate.title || file.title,
             author: baseUpdate.author || file.author,
             description: baseUpdate.description || file.description,
             genre: baseUpdate.genre || file.genre,
             releaseDate: baseUpdate.releaseDate || file.releaseDate,
             language: baseUpdate.language || file.language,
             status: baseUpdate.status || file.status,
             seriesTitle: baseUpdate.seriesTitle !== undefined ? baseUpdate.seriesTitle : file.seriesTitle,
             seriesIndex: baseUpdate.seriesIndex !== undefined ? baseUpdate.seriesIndex : file.seriesIndex,
             seriesColor: baseUpdate.seriesColor !== undefined ? baseUpdate.seriesColor : file.seriesColor,
             group: baseUpdate.group !== undefined ? baseUpdate.group : file.group,
             groupColor: baseUpdate.groupColor !== undefined ? baseUpdate.groupColor : file.groupColor,
          } as Book;
          
          onUpdate(updatedBook);
      });

      setIsEditing(false);
      setActiveColorPicker(null);
    }
  };

  const handleChange = (field: keyof Book, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const downloadFile = (file: Book) => {
    if (!file.fileData) {
      alert("File data missing.");
      return;
    }
    const blob = new Blob([file.fileData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
     for (let i = 0; i < allFiles.length; i++) {
        downloadFile(allFiles[i]);
        await new Promise(resolve => setTimeout(resolve, 500));
     }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400';
    const s = status.toLowerCase();
    if (s === 'ongoing') return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    if (s === 'completed') return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    if (s === 'hiatus' || s === 'on hold') return 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    if (s === 'cancelled' || s === 'dropped') return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    return 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
  };

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div 
        className={`absolute inset-0 bg-stone-900/20 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-auto ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={handleClose}
      />

      {/* Glass Pane Panel */}
      <div 
        className={`relative w-full max-w-xl bg-white/80 dark:bg-stone-950/80 backdrop-blur-2xl h-full shadow-2xl overflow-y-auto transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto border-l border-white/50 dark:border-white/10 flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        
        {/* Sticky Header Actions */}
        <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center p-6 pointer-events-none">
          <div className="pointer-events-auto"></div>
          <button 
            onClick={handleClose}
            className="pointer-events-auto p-2 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md hover:bg-white dark:hover:bg-white/10 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-all shadow-sm border border-white/50 dark:border-white/10"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Section */}
        <div 
           className="relative w-full h-64 shrink-0 transition-all duration-700"
           style={{ backgroundColor: book.coverColor }}
        >
           <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white/90 dark:to-stone-950/90"></div>
           <div className="absolute -bottom-12 left-8 flex items-end gap-6">
              <div className="w-32 aspect-[2/3] rounded bg-white shadow-2xl transform rotate-3 border-l-4 border-black/5 relative overflow-hidden group">
                  <div className="absolute inset-0" style={{backgroundColor: book.coverColor}}></div>
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/20 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white/30">
                      <BookOpenIcon className="w-12 h-12" />
                  </div>
              </div>
           </div>
        </div>

        {/* Content Body */}
        <div className="px-8 pt-16 pb-24 flex-1 flex flex-col gap-8">
           
           <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                 <div className="flex-1 space-y-2">
                    {isEditing ? (
                        <input 
                           type="text"
                           value={formData.title}
                           onChange={(e) => handleChange('title', e.target.value)}
                           className="w-full font-serif font-bold text-3xl md:text-4xl text-stone-900 dark:text-white bg-transparent border-b-2 border-primary/30 focus:border-primary focus:outline-none placeholder-stone-300 pb-1"
                           placeholder="Book Title"
                        />
                    ) : (
                        <h1 className="font-serif font-bold text-3xl md:text-4xl text-stone-900 dark:text-white leading-tight">
                            {book.title}
                        </h1>
                    )}
                    
                    {isEditing ? (
                        <input 
                           type="text"
                           value={formData.author}
                           onChange={(e) => handleChange('author', e.target.value)}
                           className="w-full text-lg text-stone-600 dark:text-stone-400 bg-transparent border-b-2 border-primary/30 focus:border-primary focus:outline-none placeholder-stone-300 pb-1"
                           placeholder="Author Name"
                        />
                    ) : (
                        <p className="text-lg text-stone-600 dark:text-stone-400 font-medium flex items-center gap-2">
                           <span className="w-8 h-[1px] bg-primary/50 inline-block"></span>
                           {book.author}
                        </p>
                    )}
                 </div>
                 
                 <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className={`shrink-0 p-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm border border-transparent
                        ${isEditing 
                            ? 'bg-primary text-white shadow-lg hover:bg-amber-700' 
                            : 'bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/20 hover:text-stone-800 dark:hover:text-white'
                        }`}
                 >
                    {isEditing ? <><SaveIcon className="w-4 h-4"/> Save All</> : <><EditIcon className="w-4 h-4" /> Edit</>}
                 </button>
              </div>
           </div>

           {/* Metadata Grid */}
           <div className="grid grid-cols-2 gap-4 py-6 border-y border-stone-100 dark:border-white/10">
               {/* Genre */}
               <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                   <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                       <TagIcon className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 flex-1">
                       <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Genre</p>
                       {isEditing ? (
                           <input 
                             value={formData.genre}
                             onChange={(e) => handleChange('genre', e.target.value)}
                             className="w-full text-sm font-medium text-stone-900 dark:text-white bg-transparent border-b border-primary/30 focus:border-primary outline-none"
                           />
                       ) : (
                           <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{book.genre}</p>
                       )}
                   </div>
               </div>

                {/* Status */}
               <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isEditing ? 'bg-stone-100 dark:bg-white/10 text-stone-500 dark:text-stone-400' : getStatusColor(formData.status)}`}>
                       <ActivityIcon className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 flex-1">
                       <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Status</p>
                       {isEditing ? (
                           <select 
                             value={formData.status || ''}
                             onChange={(e) => handleChange('status', e.target.value)}
                             className="w-full text-sm font-medium text-stone-900 dark:text-white bg-transparent border-b border-primary/30 focus:border-primary outline-none py-0.5 [&>option]:text-black"
                           >
                              <option value="">Unknown</option>
                              <option value="Ongoing">Ongoing</option>
                              <option value="Completed">Completed</option>
                              <option value="Hiatus">Hiatus</option>
                              <option value="Cancelled">Cancelled</option>
                           </select>
                       ) : (
                           <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                              {book.status || 'Unknown'}
                           </p>
                       )}
                   </div>
               </div>

                {/* Language */}
               <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                   <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                       <GlobeIcon className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 flex-1">
                       <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Language</p>
                       {isEditing ? (
                           <input 
                             value={formData.language || ''}
                             onChange={(e) => handleChange('language', e.target.value)}
                             placeholder="en"
                             className="w-full text-sm font-medium text-stone-900 dark:text-white bg-transparent border-b border-primary/30 focus:border-primary outline-none uppercase"
                           />
                       ) : (
                           <p className="text-sm font-medium text-stone-900 dark:text-white truncate uppercase">{book.language || 'EN'}</p>
                       )}
                   </div>
               </div>

               {/* Release Date */}
               <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                   <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                       <CalendarIcon className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 flex-1">
                       <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Released</p>
                       {isEditing ? (
                           <input 
                             value={formData.releaseDate}
                             onChange={(e) => handleChange('releaseDate', e.target.value)}
                             className="w-full text-sm font-medium text-stone-900 dark:text-white bg-transparent border-b border-primary/30 focus:border-primary outline-none"
                           />
                       ) : (
                           <p className="text-sm font-medium text-stone-900 dark:text-white truncate">{book.releaseDate}</p>
                       )}
                   </div>
               </div>

               {/* File List */}
               <div className="col-span-2 p-3 rounded-lg bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10">
                   <div className="flex items-center gap-2 mb-3">
                       <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-stone-500 dark:text-stone-400">
                           <FolderIcon className="w-3 h-3" />
                       </div>
                       <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Available Files ({allFiles.length})</p>
                   </div>
                   
                   <div className="space-y-2">
                       {allFiles.map(file => (
                           <div key={file.id} className="flex items-center justify-between bg-white dark:bg-black/20 p-2 rounded border border-stone-200 dark:border-white/10 shadow-sm">
                               <div className="flex items-center gap-3">
                                   <span className="text-[10px] font-bold uppercase bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 px-2 py-1 rounded">
                                       {file.fileType}
                                   </span>
                                   <div className="flex flex-col">
                                       <span className="text-sm font-medium text-stone-900 dark:text-white truncate max-w-[150px]">{file.fileName}</span>
                                       <span className="text-xs text-stone-500 dark:text-stone-400">{(file.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                                   </div>
                               </div>
                               <div className="flex items-center gap-2">
                                   <button 
                                      onClick={() => downloadFile(file)}
                                      className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                      title="Download this file"
                                   >
                                       <DownloadIcon className="w-4 h-4" />
                                   </button>
                                   <button 
                                      onClick={() => {
                                          if (window.confirm(`Delete this ${file.fileType} file?`)) {
                                              onDelete(file.id);
                                              if (allFiles.length === 1) handleClose();
                                          }
                                      }}
                                      className="p-1.5 text-stone-400 dark:text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete this file"
                                   >
                                       <TrashIcon className="w-4 h-4" />
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
               
               {/* Series (Full Row) */}
               <div 
                   className="col-span-2 flex items-center gap-3 p-3 rounded-lg transition-colors border-t border-stone-100/50 dark:border-white/10"
                   style={{ backgroundColor: isEditing ? 'rgba(255,255,255,0.5)' : (formData.seriesColor ? `${formData.seriesColor}15` : 'rgba(150, 150, 150, 0.1)') }}
                >
                    <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
                        style={{ 
                            backgroundColor: formData.seriesColor ? `${formData.seriesColor}30` : 'rgba(147, 51, 234, 0.1)', 
                            color: formData.seriesColor || '#9333ea' 
                        }}
                    >
                        <LayersIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 grid grid-cols-4 gap-4 relative">
                        <div className="col-span-3">
                           <p className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: formData.seriesColor || '#a8a29e' }}>Series Name</p>
                           {isEditing ? (
                               <div className="flex items-center gap-2">
                                   <input 
                                     value={formData.seriesTitle || ''}
                                     onChange={(e) => handleChange('seriesTitle', e.target.value)}
                                     placeholder="Enter series name..."
                                     className="w-full text-sm font-medium text-stone-900 dark:text-white bg-transparent border-b border-purple-200 focus:border-purple-500 outline-none px-1 py-0.5 rounded"
                                   />
                                    <div className="relative">
                                       <button 
                                           onClick={() => setActiveColorPicker(activeColorPicker === 'series' ? null : 'series')}
                                           className="w-6 h-6 rounded-full border border-stone-300 dark:border-stone-600 shadow-sm hover:scale-110 transition-transform"
                                           style={{ backgroundColor: formData.seriesColor || '#9333ea' }}
                                       />
                                       
                                       {activeColorPicker === 'series' && (
                                           <div className="absolute right-0 top-8 bg-white dark:bg-stone-900 p-2 rounded-xl shadow-xl border border-stone-200 dark:border-white/10 grid grid-cols-4 gap-2 z-50 w-32 animate-scale-in">
                                               {COLORS.map(color => (
                                                   <button
                                                       key={color}
                                                       onClick={() => {
                                                           handleChange('seriesColor', color);
                                                           setActiveColorPicker(null);
                                                       }}
                                                       className={`w-5 h-5 rounded-full hover:scale-125 transition-transform ${formData.seriesColor === color ? 'ring-2 ring-stone-400 ring-offset-1' : ''}`}
                                                       style={{ backgroundColor: color }}
                                                   />
                                               ))}
                                           </div>
                                       )}
                                   </div>
                               </div>
                           ) : (
                               <p className="text-sm font-medium text-stone-900 dark:text-white truncate" style={{ color: formData.seriesColor }}>
                                   {book.seriesTitle || 'Not part of a series'}
                               </p>
                           )}
                        </div>
                        <div className="col-span-1">
                           <p className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: formData.seriesColor || '#a8a29e' }}>Vol #</p>
                           {isEditing ? (
                               <input 
                                 value={formData.seriesIndex || ''}
                                 onChange={(e) => handleChange('seriesIndex', e.target.value)}
                                 placeholder="#"
                                 className="w-full text-sm font-medium text-stone-900 dark:text-white bg-transparent border-b border-purple-200 focus:border-purple-500 outline-none px-1 py-0.5 rounded"
                               />
                           ) : (
                               <p className="text-sm font-medium text-stone-900 dark:text-white truncate" style={{ color: formData.seriesColor }}>
                                   {book.seriesIndex || '-'}
                               </p>
                           )}
                        </div>
                    </div>
               </div>

               {/* Group (Full Row) */}
               <div 
                    className="col-span-2 flex items-center gap-3 p-3 rounded-lg transition-colors border-t border-stone-100/50 dark:border-white/10 relative overflow-visible"
                    style={{ backgroundColor: isEditing ? 'rgba(255,255,255,0.5)' : (formData.groupColor ? `${formData.groupColor}15` : 'rgba(150, 150, 150, 0.1)') }}
               >
                    <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
                        style={{ 
                            backgroundColor: formData.groupColor ? `${formData.groupColor}30` : 'rgba(13, 148, 136, 0.1)', 
                            color: formData.groupColor || '#0d9488'
                        }}
                    >
                        <GroupIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 relative">
                       <p className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: formData.groupColor || '#a8a29e' }}>Group / Collection</p>
                       <div className="flex items-center gap-2">
                           {isEditing ? (
                               <>
                                   <input 
                                     value={formData.group || ''}
                                     onChange={(e) => handleChange('group', e.target.value)}
                                     placeholder="E.g. Favorites, Textbooks..."
                                     className="w-full text-sm font-medium text-stone-900 dark:text-white bg-transparent border-b border-teal-200 focus:border-teal-500 outline-none px-1 py-0.5 rounded"
                                   />
                                   
                                   <div className="relative">
                                       <button 
                                           onClick={() => setActiveColorPicker(activeColorPicker === 'group' ? null : 'group')}
                                           className="w-6 h-6 rounded-full border border-stone-300 dark:border-stone-600 shadow-sm hover:scale-110 transition-transform"
                                           style={{ backgroundColor: formData.groupColor || '#78716c' }}
                                       />
                                       
                                       {activeColorPicker === 'group' && (
                                           <div className="absolute right-0 top-8 bg-white dark:bg-stone-900 p-2 rounded-xl shadow-xl border border-stone-200 dark:border-white/10 grid grid-cols-4 gap-2 z-50 w-32 animate-scale-in">
                                               {COLORS.map(color => (
                                                   <button
                                                       key={color}
                                                       onClick={() => {
                                                           handleChange('groupColor', color);
                                                           setActiveColorPicker(null);
                                                       }}
                                                       className={`w-5 h-5 rounded-full hover:scale-125 transition-transform ${formData.groupColor === color ? 'ring-2 ring-stone-400 ring-offset-1' : ''}`}
                                                       style={{ backgroundColor: color }}
                                                   />
                                               ))}
                                           </div>
                                       )}
                                   </div>
                               </>
                           ) : (
                               <p className="text-sm font-medium text-stone-900 dark:text-white truncate" style={{ color: formData.groupColor }}>
                                   {formData.group || 'None'}
                               </p>
                           )}
                       </div>
                    </div>
               </div>
           </div>

           {/* Description */}
           <div className="space-y-3">
               <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white">About this book</h3>
               {isEditing ? (
                    <textarea 
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full min-h-[150px] p-4 text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none resize-none transition-all"
                        placeholder="Enter book description..."
                    />
               ) : (
                    <p className="text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                        {book.description}
                    </p>
               )}
           </div>

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 p-6 bg-white/70 dark:bg-black/40 backdrop-blur-md border-t border-stone-200 dark:border-white/10 flex items-center gap-4 z-20">
           <button 
             onClick={handleDownloadAll}
             className="flex-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-4 rounded-xl font-semibold text-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
           >
              <DownloadIcon className="w-5 h-5" />
              {allFiles.length > 1 ? `Download Both (${allFiles.length})` : 'Download / Read'}
           </button>
           
           <button 
             onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${allFiles.length > 1 ? 'ALL versions of' : ''} this book?`)) {
                    allFiles.forEach(f => onDelete(f.id));
                    onClose();
                }
             }}
             className="p-4 rounded-xl border border-stone-200 dark:border-white/10 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 transition-colors"
             title="Delete All Files"
           >
              <TrashIcon className="w-5 h-5" />
           </button>
        </div>

      </div>
    </div>
  );
};