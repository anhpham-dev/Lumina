import React, { useRef, useState, useEffect } from 'react';
import { UploadIcon, XIcon, BookOpenIcon, FolderIcon, MagicWandIcon, CheckIcon, SaveIcon } from './Icons';
import { extractMetadata } from '../services/gemini';
import { suggestGroupName } from '../services/organizer';
import { Book, BookMetadata } from '../types';
import { dbService } from '../services/db';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const PASTEL_COLORS = [
  '#475569', '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a', 
  '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#57534e',
];

type UploadStep = 'idle' | 'analyzing' | 'review' | 'saving';

interface PendingBook {
  file: File;
  metadata: BookMetadata;
  tempId: string;
  coverColor: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<UploadStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  
  // Progress State
  const [currentProgress, setCurrentProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // Data State
  const [pendingBooks, setPendingBooks] = useState<PendingBook[]>([]);
  const [suggestedGroup, setSuggestedGroup] = useState('');
  const [applyGroup, setApplyGroup] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setIsVisible(true);
        setError(null);
        setStatus('');
        setStep('idle');
        setPendingBooks([]);
        setSuggestedGroup('');
    } else {
        setIsVisible(false);
    }
  }, [isOpen]);

  const processFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => 
        ['.epub', '.pdf', '.azw3', '.mobi'].some(ext => f.name.toLowerCase().endsWith(ext))
    );

    if (validFiles.length === 0) {
        setError("No compatible ebook files found in selection.");
        return;
    }

    setStep('analyzing');
    setTotalItems(validFiles.length);
    setCurrentProgress(0);
    setError(null);
    const tempQueue: PendingBook[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setCurrentProgress(i + 1);
        setStatus(`Analyzing metadata for ${file.name}...`);
        
        const metadata = await extractMetadata(file.name);
        
        tempQueue.push({
            file,
            metadata,
            tempId: crypto.randomUUID(),
            coverColor: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)]
        });
      }

      setPendingBooks(tempQueue);

      if (tempQueue.length > 1) {
          setStatus("Checking for collections...");
          const suggestion = await suggestGroupName(tempQueue.map(b => ({ 
              title: b.metadata.title, 
              author: b.metadata.author, 
              fileName: b.file.name 
          } as any)));

          if (suggestion && suggestion.trim().length > 0) {
              setSuggestedGroup(suggestion);
              setApplyGroup(true);
              setStep('review');
              return;
          }
      }

      saveBooks(tempQueue);

    } catch (err) {
      console.error(err);
      setError('An error occurred during analysis.');
      setStep('idle');
    }
  };

  const saveBooks = async (booksToSave: PendingBook[], groupName?: string) => {
      setStep('saving');
      setTotalItems(booksToSave.length);
      setCurrentProgress(0);
      
      const groupColor = groupName ? PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)] : undefined;

      try {
          for (let i = 0; i < booksToSave.length; i++) {
              const item = booksToSave[i];
              setCurrentProgress(i + 1);
              setStatus(`Saving ${item.metadata.title}...`);

              const arrayBuffer = await item.file.arrayBuffer();

              const newBook: Book = {
                  ...item.metadata,
                  id: item.tempId,
                  fileName: item.file.name,
                  fileType: item.file.name.split('.').pop()?.toLowerCase() || 'unknown',
                  fileSize: item.file.size,
                  addedAt: Date.now() - (booksToSave.length - i), 
                  coverColor: item.coverColor,
                  fileData: arrayBuffer,
                  group: groupName || item.metadata.group,
                  groupColor: groupName ? groupColor : (item.metadata.group ? groupColor : undefined)
              };

              await dbService.addBook(newBook);
          }

          onUploadSuccess();
          onClose();
      } catch (err) {
          console.error(err);
          setError('Failed to save books to database.');
          setStep('idle');
      }
  };

  const handleReviewConfirm = () => {
      saveBooks(pendingBooks, applyGroup ? suggestedGroup : undefined);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <div 
        className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={step === 'idle' ? onClose : undefined}
      ></div>
      
      <div className={`bg-white/80 dark:bg-stone-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {step === 'idle' && (
            <button 
                onClick={onClose}
                className="absolute right-6 top-6 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full"
            >
                <XIcon className="w-5 h-5" />
            </button>
        )}

        {/* Title Section */}
        <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-2">
                {step === 'review' ? 'Organize Upload' : 'Import Books'}
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm">
                {step === 'review' 
                    ? `We found ${pendingBooks.length} books.` 
                    : step === 'analyzing' || step === 'saving' 
                        ? 'Please wait while we process your library.' 
                        : 'Add stories to your local library.'}
            </p>
        </div>

        {/* Review Step UI */}
        {step === 'review' ? (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                            <MagicWandIcon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-stone-900 dark:text-white">AI Suggestion</h3>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                It looks like these books belong to a collection. Would you like to group them?
                            </p>
                        </div>
                    </div>

                    <div className="bg-stone-50 dark:bg-white/5 p-4 rounded-xl border border-stone-100 dark:border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <button 
                                onClick={() => setApplyGroup(!applyGroup)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${applyGroup ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-black/20 border-stone-300 dark:border-stone-600'}`}
                            >
                                {applyGroup && <CheckIcon className="w-3 h-3" />}
                            </button>
                            <label className="text-sm font-medium text-stone-900 dark:text-white cursor-pointer" onClick={() => setApplyGroup(!applyGroup)}>
                                Add to Group
                            </label>
                        </div>
                        
                        <input 
                            type="text" 
                            value={suggestedGroup}
                            onChange={(e) => setSuggestedGroup(e.target.value)}
                            disabled={!applyGroup}
                            className={`w-full px-4 py-2 rounded-lg border text-sm transition-all outline-none ${applyGroup ? 'bg-white dark:bg-black/20 border-stone-300 dark:border-stone-600 focus:border-primary focus:ring-2 focus:ring-primary/10 text-stone-900 dark:text-white' : 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/5 text-stone-400'}`}
                            placeholder="Group Name"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => saveBooks(pendingBooks, undefined)} 
                        className="flex-1 py-3 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        Skip Grouping
                    </button>
                    <button 
                        onClick={handleReviewConfirm}
                        className="flex-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-3 rounded-xl font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        <SaveIcon className="w-4 h-4" />
                        Save {pendingBooks.length} Books
                    </button>
                </div>
            </div>
        ) : (
            /* Upload & Progress UI */
            <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
                relative overflow-hidden group
                border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 min-h-[260px]
                ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-stone-200 dark:border-stone-700'}
                ${step !== 'idle' ? 'border-none bg-stone-50 dark:bg-white/5 cursor-wait' : ''}
            `}
            >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".epub,.pdf,.azw3,.mobi" 
                multiple 
            />
            <input 
                type="file" 
                ref={folderInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                {...({ webkitdirectory: "", directory: "" } as any)}
            />

            {step !== 'idle' ? (
                <div className="flex flex-col items-center animate-fade-in w-full">
                    <div className="w-16 h-16 relative mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-stone-200 dark:border-stone-700"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                        <BookOpenIcon className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <p className="text-lg font-medium text-stone-900 dark:text-white mb-1 text-center truncate w-full px-4">{status}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        {step === 'analyzing' ? 'Analyzing' : 'Saving'} {currentProgress} of {totalItems}...
                    </p>
                    {/* Progress Bar */}
                    <div className="w-full max-w-[200px] h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full mt-4 overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${(currentProgress / totalItems) * 100}%` }}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {/* File Upload Button */}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <UploadIcon className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <span className="block font-semibold text-stone-900 dark:text-white">Files</span>
                                <span className="text-xs text-stone-500 dark:text-stone-400">Single or Multiple</span>
                            </div>
                        </button>

                        {/* Folder Upload Button */}
                        <button 
                            onClick={() => folderInputRef.current?.click()}
                            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <FolderIcon className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <span className="block font-semibold text-stone-900 dark:text-white">Upload Folder</span>
                                <span className="text-xs text-stone-500 dark:text-stone-400">Series Batch</span>
                            </div>
                        </button>
                    </div>
                    
                    <p className="mt-8 text-sm text-stone-400 dark:text-stone-500 text-center">
                        or drop files anywhere here
                    </p>
                </>
            )}
            </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-fade-in">
             <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};