import React, { useState, useEffect, useMemo, useRef } from 'react';
import { dbService } from './services/db';
import { authService } from './services/auth';
import { organizeLibrary, suggestGroupName } from './services/organizer';
import { Book, ViewMode, SortOption } from './types';
import { BookCard } from './components/BookCard';
import { UploadModal } from './components/UploadModal';
import { BookDetail } from './components/BookDetail';
import { LoginScreen } from './components/LoginScreen';
import { SettingsModal } from './components/SettingsModal';
import { BulkEditModal, BulkUpdateData } from './components/BulkEditModal';
import { PlusIcon, GridIcon, ListIcon, SearchIcon, SortIcon, CheckIcon, XIcon, UserIcon, LayersIcon, MagicWandIcon, CheckCircleIcon, TrashIcon, GroupIcon, EditIcon, SunIcon, MoonIcon } from './components/Icons';

// Toast Component for Notifications
const Toast = ({ message, visible, onClose }: { message: string, visible: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-slide-up border border-white/10 dark:border-black/10">
      <div className="bg-green-500 rounded-full p-1">
        <CheckIcon className="w-3 h-3 text-white" />
      </div>
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

// Skeleton Loader Component
const SkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12 pb-20 px-2 animate-fade-in">
        {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
                <div className="w-full aspect-[2/3] bg-stone-200 dark:bg-white/5 rounded-md animate-pulse"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-stone-200 dark:bg-white/5 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-stone-200 dark:bg-white/5 rounded w-1/2 animate-pulse"></div>
                </div>
            </div>
        ))}
    </div>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App State
  const [books, setBooks] = useState<Book[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Filtering
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  // Grouping & Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  // Security / Activity Monitor
  const activityTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const initApp = async () => {
        // Init auth service (create default user if needed)
        await authService.init();

        // Check active session
        if (authService.checkSession()) {
            setIsAuthenticated(true);
        }

        // Check Theme
        const storedTheme = localStorage.getItem('lumina_theme') as 'light' | 'dark' | null;
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }

        setIsAuthChecking(false);
    };
    initApp();
  }, []);

  // Monitor Activity for Auto-Lock
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
        if (activityTimerRef.current) {
            window.clearTimeout(activityTimerRef.current);
        }

        const settings = authService.getSettings();
        if (settings.autoLockMinutes > 0) {
            activityTimerRef.current = window.setTimeout(() => {
                console.log("Auto-locking due to inactivity...");
                handleLogout(true); // true = keep session data but lock screen? Actually logic is full logout
            }, settings.autoLockMinutes * 60 * 1000);
        }
    };

    // Events to track
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    
    // Initial start
    resetTimer();

    return () => {
        events.forEach(event => document.removeEventListener(event, resetTimer));
        if (activityTimerRef.current) window.clearTimeout(activityTimerRef.current);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lumina_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
        fetchBooks();
    }
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const allBooks = await dbService.getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error("Failed to fetch books", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    // Fetch handled by useEffect
  };

  const handleLogout = (isAutoLock = false) => {
    authService.logout();
    setIsAuthenticated(false);
    setIsSettingsOpen(false);
    setBooks([]); // Clear data from memory
    if (isAutoLock) {
        // Optional: Could set a state to show "Session timed out" on login screen
    }
  };

  const handleUploadSuccess = () => {
    fetchBooks();
    setToastMessage("Books added successfully");
  };

  const handleDelete = async (id: string) => {
    await dbService.deleteBook(id);
    // Optimistic update
    setBooks(prev => prev.filter(b => b.id !== id));
    setToastMessage("Book deleted");
    
    // If selected book was deleted, close detail view
    if (selectedBook && selectedBook.id === id) {
        setSelectedBook(null);
    }
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    await dbService.updateBook(updatedBook);
    
    // Check if group color changed and propagate to other books in the same group
    const updatePromises: Promise<void>[] = [];

    if (updatedBook.group && updatedBook.group.trim() !== '') {
        const groupBooks = books.filter(b => b.group === updatedBook.group && b.id !== updatedBook.id);
        
        if (groupBooks.length > 0 && updatedBook.groupColor) {
             groupBooks.forEach(b => {
                if (b.groupColor !== updatedBook.groupColor) {
                    updatePromises.push(dbService.updateBook({ ...b, groupColor: updatedBook.groupColor }));
                }
            });
        }
    }

    // Check if series color changed and propagate
    if (updatedBook.seriesTitle && updatedBook.seriesTitle.trim() !== '') {
        const seriesBooks = books.filter(b => b.seriesTitle === updatedBook.seriesTitle && b.id !== updatedBook.id);
        
        if (seriesBooks.length > 0 && updatedBook.seriesColor) {
            seriesBooks.forEach(b => {
                if (b.seriesColor !== updatedBook.seriesColor) {
                    updatePromises.push(dbService.updateBook({ ...b, seriesColor: updatedBook.seriesColor }));
                }
            });
        }
    }
    
    if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
    }
    
    // Refresh local state completely to ensure sync
    await fetchBooks();
    
    // Update selected book reference if it was the one updated
    if (selectedBook && selectedBook.id === updatedBook.id) {
        setSelectedBook(updatedBook);
    }
    setToastMessage("Metadata updated");
  };

  // --- Grouping Logic: Merge identical books with different formats ---
  const groupedLibrary = useMemo(() => {
    const groups = new Map<string, Book[]>();
    
    books.forEach(book => {
        // Create a unique key based on normalized Title and Author
        const key = `${book.title.trim().toLowerCase()}|${book.author.trim().toLowerCase()}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(book);
    });

    // Return an array of book arrays (each inner array is a group of versions)
    return Array.from(groups.values());
  }, [books]);

  // --- Filtering & Sorting on Groups ---
  
  // Extract Groups for Chips
  const uniqueGroups = useMemo(() => {
    const map = new Map<string, { color?: string, count: number }>();
    books.forEach(b => {
        if (b.group && b.group.trim()) {
            const existing = map.get(b.group);
            map.set(b.group, {
                color: b.groupColor || existing?.color,
                count: (existing?.count || 0) + 1
            });
        }
    });
    return Array.from(map.entries()).sort((a,b) => b[1].count - a[1].count);
  }, [books]);

  const filteredAndSortedGroups = useMemo(() => {
    let result = groupedLibrary.filter(group => {
      // Use the first book in the group as the representative for filtering
      const book = group[0];
      
      // 1. Text Search
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.seriesTitle && book.seriesTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (book.group && book.group.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 2. Group Filter
      const matchesGroup = filterGroup ? book.group === filterGroup : true;

      return matchesSearch && matchesGroup;
    });

    // Sort Logic
    switch (sortOption) {
      case 'title':
        result.sort((a, b) => a[0].title.localeCompare(b[0].title));
        break;
      case 'author':
        result.sort((a, b) => a[0].author.localeCompare(b[0].author));
        break;
      case 'series':
        result.sort((a, b) => {
            const bookA = a[0];
            const bookB = b[0];

            const sA = bookA.seriesTitle || '';
            const sB = bookB.seriesTitle || '';

            // Put items without series at the end
            if (!sA && sB) return 1;
            if (sA && !sB) return -1;
            if (!sA && !sB) return bookA.title.localeCompare(bookB.title);

            // Compare series titles (Natural sort)
            const titleCompare = sA.localeCompare(sB, undefined, { numeric: true, sensitivity: 'base' });
            if (titleCompare !== 0) return titleCompare;
            
            // Compare series indexes
            const iA = bookA.seriesIndex || '';
            const iB = bookB.seriesIndex || '';
            return iA.localeCompare(iB, undefined, { numeric: true, sensitivity: 'base' });
        });
        break;
      case 'group':
         // Sort by Group name
         result.sort((a, b) => {
            const gA = a[0].group || 'zzz';
            const gB = b[0].group || 'zzz';
            if (gA !== gB) return gA.localeCompare(gB);
            return a[0].title.localeCompare(b[0].title);
         });
         break;
      case 'recent':
      default:
        // Sort by the most recently added file within the group
        result.sort((a, b) => {
            const maxTimeA = Math.max(...a.map(x => x.addedAt));
            const maxTimeB = Math.max(...b.map(x => x.addedAt));
            return maxTimeB - maxTimeA;
        });
        break;
    }

    return result;
  }, [groupedLibrary, searchQuery, sortOption, filterGroup]);


  // --- Grouping logic for View Layout (Series/Collections sections) ---
  const viewLayoutGroups = useMemo(() => {
    if (sortOption !== 'series' && sortOption !== 'group') return null;

    const layoutGroups: Record<string, Book[][]> = {};
    filteredAndSortedGroups.forEach(group => {
      const book = group[0];
      let key = 'Other Stories';
      
      if (sortOption === 'series' && book.seriesTitle && book.seriesTitle.trim().length > 0) {
          key = book.seriesTitle;
      } else if (sortOption === 'group' && book.group && book.group.trim().length > 0) {
          key = book.group;
      }

      if (!layoutGroups[key]) layoutGroups[key] = [];
      layoutGroups[key].push(group);
    });

    return layoutGroups;
  }, [filteredAndSortedGroups, sortOption]);


  // --- Selection Logic ---
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
        // Exit mode
        setIsSelectionMode(false);
        setSelectedBookIds(new Set());
    } else {
        setIsSelectionMode(true);
    }
  };

  const toggleBookSelection = (book: Book) => {
    const newSet = new Set(selectedBookIds);
    if (newSet.has(book.id)) {
        newSet.delete(book.id);
    } else {
        newSet.add(book.id);
    }
    setSelectedBookIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedBookIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete selected items?`)) {
        // Find all variants for selected IDs to ensure clean deletion of groups
        const allIdsToDelete = new Set<string>();
        
        selectedBookIds.forEach(id => {
             // Find which group this ID belongs to
             const group = groupedLibrary.find(g => g.some(b => b.id === id));
             if (group) {
                 group.forEach(b => allIdsToDelete.add(b.id));
             } else {
                 allIdsToDelete.add(id);
             }
        });

        for (const id of allIdsToDelete) {
            await dbService.deleteBook(id);
        }
        
        fetchBooks();
        setToastMessage(`${allIdsToDelete.size} files deleted`);
        setIsSelectionMode(false);
        setSelectedBookIds(new Set());
    }
  };

  const handleBulkSave = async (data: BulkUpdateData) => {
     // Get representative books that are selected
     const selectedGroups = filteredAndSortedGroups.filter(g => selectedBookIds.has(g[0].id));
     const booksToUpdate = selectedGroups.flat();
     let updateCount = 0;
     
     for (let i = 0; i < selectedGroups.length; i++) {
        const group = selectedGroups[i];
        let changes: Partial<Book> = {};

        if (data.groupMode === 'clear') {
            changes.group = '';
            changes.groupColor = undefined;
        } else if (data.groupMode === 'set') {
            changes.group = data.groupName;
            changes.groupColor = data.groupColor;
        }

        if (data.seriesMode === 'clear') {
            changes.seriesTitle = '';
            changes.seriesIndex = '';
        } else if (data.seriesMode === 'set') {
            changes.seriesTitle = data.seriesTitle;
            if (data.seriesIndexMode === 'auto') {
                changes.seriesIndex = (data.seriesIndexStart + i).toString();
            } else if (data.seriesIndexMode === 'same') {
                changes.seriesIndex = data.seriesIndexValue;
            }
        }

        if (data.statusMode === 'clear') {
            changes.status = '';
        } else if (data.statusMode === 'set') {
            changes.status = data.statusValue;
        }

        if (Object.keys(changes).length > 0) {
            for (const book of group) {
                await dbService.updateBook({ ...book, ...changes });
                updateCount++;
            }
        }
     }

     if (updateCount > 0) {
         await fetchBooks();
         setToastMessage(`Updated ${updateCount} files`);
     }
     
     setIsSelectionMode(false);
     setSelectedBookIds(new Set());
  };

  const handleAutoOrganize = async () => {
    if (window.confirm("Lumina AI will analyze your library to suggest Groups and Series. This might take a moment. Continue?")) {
        setIsOrganizing(true);
        try {
            const updates = await organizeLibrary(books);
            if (updates.size > 0) {
                for (const [id, update] of updates.entries()) {
                    const book = books.find(b => b.id === id);
                    if (book) {
                        await dbService.updateBook({ ...book, ...update });
                    }
                }
                fetchBooks();
                setToastMessage(`Organized ${updates.size} books`);
            } else {
                setToastMessage("Library is already organized!");
            }
        } catch (e) {
            setToastMessage("Organization failed. Try again.");
        } finally {
            setIsOrganizing(false);
        }
    }
  };

  const selectedVariants = useMemo(() => {
    if (!selectedBook) return [];
    const group = groupedLibrary.find(g => g.some(b => b.id === selectedBook.id));
    return group || [selectedBook];
  }, [selectedBook, groupedLibrary]);


  if (isAuthChecking) return null;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen relative font-sans selection:bg-primary/20 bg-[#fdfbf7] dark:bg-[#0a0a0a] transition-colors duration-500 overflow-x-hidden">
      
      {/* Liquid Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/40 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[80px] opacity-70 animate-blob"></div>
         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-200/40 dark:bg-amber-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>
         <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-200/40 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[80px] opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <Toast 
        message={toastMessage || ''} 
        visible={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />

      {/* Navbar - Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/70 dark:bg-black/60 backdrop-blur-xl border-b border-white/30 dark:border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => {setSearchQuery(''); setFilterGroup(null); window.scrollTo({top:0, behavior:'smooth'})}}>
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-700 flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shadow-primary/20 transform hover:rotate-3 transition-transform">L</div>
             <div>
                <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-white tracking-tight leading-none">Lumina</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Local Library</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100/50 dark:hover:bg-white/10 transition-colors"
                title="Toggle Theme"
             >
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
             </button>

             {/* Auto Organize Button */}
             <button
                onClick={handleAutoOrganize}
                disabled={isOrganizing || books.length === 0}
                className={`p-2 rounded-full transition-all duration-500 ${isOrganizing ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 animate-pulse' : 'text-stone-500 dark:text-stone-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                title="Auto-Organize Library with AI"
             >
                <MagicWandIcon className={`w-5 h-5 ${isOrganizing ? 'animate-spin' : ''}`} />
             </button>

             {/* Select Mode Toggle */}
             <button
                onClick={toggleSelectionMode}
                className={`p-2 rounded-full transition-all ${isSelectionMode ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/50 dark:hover:bg-white/10'}`}
                title="Select Multiple"
             >
                <CheckCircleIcon className="w-5 h-5" />
             </button>

             <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/50 dark:hover:bg-white/10 rounded-full transition-colors"
             >
                <UserIcon className="w-5 h-5" />
             </button>
             <button 
                onClick={() => setIsUploadOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
             >
               <PlusIcon className="w-4 h-4" />
               <span>Add Book</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-end mb-8 animate-fade-in">
          
          <div className="w-full md:w-auto flex-1 max-w-lg">
             <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 block ml-1">Search Collection</label>
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 dark:text-stone-500 group-focus-within:text-primary transition-colors">
                  <SearchIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Find by title, series, or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-11 pr-10 py-3 bg-white/70 dark:bg-black/30 backdrop-blur-md border border-stone-200/50 dark:border-white/10 rounded-2xl text-sm placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-stone-900 dark:text-stone-100 shadow-sm hover:shadow-md"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
             </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div>
                 <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 block ml-1">Sort By</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                        <SortIcon className="w-4 h-4" />
                    </div>
                    <select 
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="appearance-none bg-white/70 dark:bg-black/30 backdrop-blur-md border border-stone-200/50 dark:border-white/10 text-stone-900 dark:text-stone-100 py-2.5 pl-9 pr-8 rounded-xl text-sm font-medium shadow-sm focus:outline-none focus:border-primary hover:border-stone-300 dark:hover:border-white/30 cursor-pointer"
                    >
                        <option value="recent">Recently Added</option>
                        <option value="title">Title (A-Z)</option>
                        <option value="author">Author (A-Z)</option>
                        <option value="series">Series Order</option>
                        <option value="group">Group / Collection</option>
                    </select>
                 </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 block ml-1 text-right">View</label>
                <div className="flex items-center bg-white/70 dark:bg-black/30 backdrop-blur-md p-1 rounded-xl border border-stone-200/50 dark:border-white/10 shadow-sm">
                    <button
                    onClick={() => setViewMode(ViewMode.GRID)}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === ViewMode.GRID ? 'bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white shadow-sm scale-105' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5'}`}
                    >
                    <GridIcon className="w-5 h-5" />
                    </button>
                    <button
                    onClick={() => setViewMode(ViewMode.LIST)}
                    className={`p-2 rounded-lg transition-all duration-200 ${viewMode === ViewMode.LIST ? 'bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white shadow-sm scale-105' : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5'}`}
                    >
                    <ListIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        {uniqueGroups.length > 0 && (
            <div className="mb-10 flex flex-wrap gap-2 animate-slide-up">
                 <button
                    onClick={() => setFilterGroup(null)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all backdrop-blur-md ${!filterGroup ? 'bg-stone-800 dark:bg-white text-white dark:text-stone-900 shadow-md' : 'bg-white/70 dark:bg-white/5 text-stone-500 dark:text-stone-400 border border-stone-200/50 dark:border-white/10 hover:border-stone-400 dark:hover:border-white/30'}`}
                 >
                    All Books
                 </button>
                 {uniqueGroups.map(([groupName, { color, count }]) => (
                     <button
                        key={groupName}
                        onClick={() => setFilterGroup(groupName === filterGroup ? null : groupName)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-md
                           ${filterGroup === groupName 
                              ? 'shadow-md ring-2 ring-offset-1' 
                              : 'bg-white/70 dark:bg-white/5 border border-stone-200/50 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/30'}
                        `}
                        style={{
                            backgroundColor: filterGroup === groupName ? (color || '#57534e') : undefined,
                            color: filterGroup === groupName ? '#ffffff' : undefined,
                            borderColor: filterGroup === groupName ? 'transparent' : undefined,
                            ['--tw-ring-color' as any]: color || '#57534e'
                        }}
                     >
                        {color && (
                            <span className={`w-2 h-2 rounded-full ${filterGroup === groupName ? 'bg-white' : ''}`} style={{ backgroundColor: filterGroup === groupName ? '' : color }}></span>
                        )}
                        <span className={filterGroup === groupName ? 'text-white' : 'text-stone-600 dark:text-stone-300'}>{groupName}</span>
                        <span className={`text-[10px] ml-1 px-1.5 rounded-full ${filterGroup === groupName ? 'bg-white/20' : 'bg-stone-100 dark:bg-white/10'}`}>
                            {count}
                        </span>
                     </button>
                 ))}
            </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <SkeletonGrid />
        ) : filteredAndSortedGroups.length === 0 ? (
          <div className="text-center py-40 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-[2rem] bg-white/20 dark:bg-white/5 backdrop-blur-sm animate-fade-in">
            {searchQuery || filterGroup ? (
                <>
                    <div className="w-16 h-16 bg-stone-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                        <SearchIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mb-2">No matches found</h3>
                    <p className="text-stone-500 dark:text-stone-400 mb-6">Try adjusting your filters.</p>
                    <button 
                        onClick={() => { setSearchQuery(''); setFilterGroup(null); }}
                        className="text-primary hover:text-amber-700 font-medium hover:underline"
                    >
                        Clear filters
                    </button>
                </>
            ) : (
                <>
                    <div className="w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-white/10 dark:to-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400 shadow-inner">
                        <PlusIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mb-3">Your local library awaits</h3>
                    <p className="text-stone-500 dark:text-stone-400 mb-8 max-w-md mx-auto leading-relaxed">
                        Upload your favorite EPUB, PDF, or AZW3 files. They will be stored securely in your browser.
                    </p>
                    <button 
                        onClick={() => setIsUploadOpen(true)}
                        className="inline-flex items-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-8 py-3 rounded-full font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Start Collection
                    </button>
                </>
            )}
          </div>
        ) : (sortOption === 'series' || sortOption === 'group') && viewLayoutGroups && !filterGroup ? (
          // Grouped Series/Collections View
          <div className="space-y-12 pb-20">
             {Object.keys(viewLayoutGroups).sort((a,b) => {
                 if(a === 'Other Stories') return 1;
                 if(b === 'Other Stories') return -1;
                 return a.localeCompare(b);
             }).map(groupName => {
               const firstBookWithColor = viewLayoutGroups[groupName].flat().find(b => b.groupColor || b.seriesColor);
               const groupColor = sortOption === 'series' ? firstBookWithColor?.seriesColor : firstBookWithColor?.groupColor;
               
               return (
               <div key={groupName} className="animate-fade-in">
                  <div 
                    className="flex items-center gap-4 mb-6 border-b border-stone-200/50 dark:border-white/10 pb-3 sticky top-20 bg-white/60 dark:bg-black/60 backdrop-blur-xl z-30 pt-4 transition-all rounded-t-xl px-2"
                    style={{ 
                        borderColor: groupColor ? `${groupColor}40` : ''
                    }}
                  >
                     <div 
                        className={`p-2 rounded-lg`}
                        style={{ 
                            backgroundColor: groupColor ? `${groupColor}20` : (sortOption === 'series' ? '#f3e8ff' : '#f0fdfa'), 
                            color: groupColor || (sortOption === 'series' ? '#9333ea' : '#0d9488') 
                        }}
                     >
                        {sortOption === 'series' ? <LayersIcon className="w-5 h-5" /> : <GroupIcon className="w-5 h-5" />}
                     </div>
                     <h3 className="font-serif font-bold text-2xl text-stone-900 dark:text-white" style={{ color: groupColor }}>{groupName}</h3>
                     <span 
                        className="text-xs font-bold px-2 py-1 rounded-full ml-auto"
                        style={{ 
                            backgroundColor: groupColor ? `${groupColor}20` : '#f5f5f4',
                            color: groupColor || '#78716c'
                        }}
                     >
                        {viewLayoutGroups[groupName].length} books
                     </span>
                  </div>
                  <div className={
                    viewMode === ViewMode.GRID 
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12 px-2" 
                      : "flex flex-col gap-4"
                  }>
                    {viewLayoutGroups[groupName].map((group) => (
                      <BookCard 
                        key={group[0].id} 
                        book={group[0]} 
                        variants={group}
                        viewMode={viewMode}
                        onClick={setSelectedBook}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedBookIds.has(group[0].id)}
                        onToggleSelect={toggleBookSelection}
                      />
                    ))}
                  </div>
               </div>
             )})}
          </div>
        ) : (
          // Standard View
          <div className={
            viewMode === ViewMode.GRID 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12 pb-20 px-2" 
              : "flex flex-col gap-4 pb-20"
          }>
            {filteredAndSortedGroups.map((group, index) => (
              <BookCard 
                key={group[0].id} 
                book={group[0]} 
                variants={group}
                viewMode={viewMode}
                onClick={setSelectedBook}
                index={index}
                isSelectionMode={isSelectionMode}
                isSelected={selectedBookIds.has(group[0].id)}
                onToggleSelect={toggleBookSelection}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bulk Action Bar */}
      {isSelectionMode && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-slide-up border border-stone-700/50 dark:border-stone-200/50 backdrop-blur-md">
             <span className="font-bold text-sm whitespace-nowrap">{selectedBookIds.size} Selected</span>
             
             <div className="h-6 w-[1px] bg-white/20 dark:bg-black/10"></div>

             <button 
               onClick={() => setIsBulkEditOpen(true)}
               disabled={selectedBookIds.size === 0}
               className="flex flex-col items-center gap-1 text-xs hover:text-primary transition-colors disabled:opacity-50"
             >
                <EditIcon className="w-5 h-5" />
                <span>Edit</span>
             </button>

             <button 
               onClick={handleBulkDelete}
               disabled={selectedBookIds.size === 0}
               className="flex flex-col items-center gap-1 text-xs hover:text-red-400 dark:hover:text-red-600 transition-colors disabled:opacity-50"
             >
                <TrashIcon className="w-5 h-5" />
                <span>Delete</span>
             </button>
             
             <div className="h-6 w-[1px] bg-white/20 dark:bg-black/10"></div>

             <button 
               onClick={toggleSelectionMode}
               className="text-white/60 hover:text-white dark:text-stone-500 dark:hover:text-stone-900"
             >
                <XIcon className="w-5 h-5" />
             </button>
          </div>
      )}

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={handleUploadSuccess}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={() => handleLogout()}
      />

      {isBulkEditOpen && (
        <BulkEditModal 
            isOpen={isBulkEditOpen}
            selectedBooks={filteredAndSortedGroups.filter(g => selectedBookIds.has(g[0].id)).map(g => g[0])}
            onClose={() => setIsBulkEditOpen(false)}
            onSave={handleBulkSave}
            onSuggestGroup={suggestGroupName}
        />
      )}

      {selectedBook && (
        <BookDetail 
          book={selectedBook} 
          variants={selectedVariants}
          onClose={() => setSelectedBook(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdateBook}
        />
      )}
    </div>
  );
}