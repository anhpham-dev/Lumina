import React, { useState } from 'react';
import { XIcon, GroupIcon, LayersIcon, MagicWandIcon, SaveIcon, CheckIcon, ActivityIcon } from './Icons';
import { Book } from '../types';

interface BulkEditModalProps {
  isOpen: boolean;
  selectedBooks: Book[];
  onClose: () => void;
  onSave: (data: BulkUpdateData) => void;
  onSuggestGroup: (books: Book[]) => Promise<string>;
}

export interface BulkUpdateData {
  groupMode: 'keep' | 'set' | 'clear';
  groupName: string;
  groupColor: string;
  seriesMode: 'keep' | 'set' | 'clear';
  seriesTitle: string;
  seriesIndexMode: 'keep' | 'auto' | 'same';
  seriesIndexStart: number;
  seriesIndexValue: string;
  statusMode: 'keep' | 'set' | 'clear';
  statusValue: string;
}

const GROUP_COLORS = [
  '#78716c', '#ef4444', '#f97316', '#f59e0b', 
  '#84cc16', '#10b981', '#06b6d4', '#3b82f6', 
  '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
];

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ 
  isOpen, 
  selectedBooks, 
  onClose, 
  onSave,
  onSuggestGroup
}) => {
  const [groupMode, setGroupMode] = useState<'keep' | 'set' | 'clear'>('keep');
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState(GROUP_COLORS[0]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const [seriesMode, setSeriesMode] = useState<'keep' | 'set' | 'clear'>('keep');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesIndexMode, setSeriesIndexMode] = useState<'keep' | 'auto' | 'same'>('keep');
  const [seriesIndexStart, setSeriesIndexStart] = useState(1);
  const [seriesIndexValue, setSeriesIndexValue] = useState('');

  const [statusMode, setStatusMode] = useState<'keep' | 'set' | 'clear'>('keep');
  const [statusValue, setStatusValue] = useState('Ongoing');

  if (!isOpen) return null;

  const handleSuggestGroup = async () => {
    setIsSuggesting(true);
    try {
        const suggestion = await onSuggestGroup(selectedBooks);
        if (suggestion) {
            setGroupName(suggestion);
            setGroupMode('set');
        }
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleSave = () => {
    onSave({
        groupMode,
        groupName,
        groupColor,
        seriesMode,
        seriesTitle,
        seriesIndexMode,
        seriesIndexStart,
        seriesIndexValue,
        statusMode,
        statusValue
    });
    onClose();
  };

  const Segment = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            active 
            ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm ring-1 ring-stone-200 dark:ring-stone-600' 
            : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5'
        }`}
    >
        {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-white/10 flex justify-between items-center">
            <div>
                <h2 className="font-serif font-bold text-xl text-stone-900 dark:text-white">Edit {selectedBooks.length} Books</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Apply changes to selection</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-stone-100 dark:hover:bg-white/10 rounded-full transition-colors">
                <XIcon className="w-5 h-5 text-stone-500 dark:text-stone-400" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8">
            
            {/* Group Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                    <GroupIcon className="w-4 h-4" />
                    <span>Collection / Group</span>
                </div>
                
                <div className="bg-stone-100/50 dark:bg-black/20 p-1 rounded-xl flex">
                    <Segment label="Keep Existing" active={groupMode === 'keep'} onClick={() => setGroupMode('keep')} />
                    <Segment label="Set New" active={groupMode === 'set'} onClick={() => setGroupMode('set')} />
                    <Segment label="Clear" active={groupMode === 'clear'} onClick={() => setGroupMode('clear')} />
                </div>

                {groupMode === 'set' && (
                    <div className="animate-fade-in space-y-3 bg-white dark:bg-white/5 p-4 rounded-xl border border-stone-100 dark:border-white/5 shadow-sm">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Group Name (e.g. Fantasy)"
                                className="flex-1 bg-stone-50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                            <button 
                                onClick={handleSuggestGroup}
                                disabled={isSuggesting}
                                className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                                title="AI Suggestion"
                            >
                                <MagicWandIcon className={`w-5 h-5 ${isSuggesting ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        
                        <div>
                            <label className="text-xs text-stone-400 font-bold mb-2 block">Color Tag</label>
                            <div className="flex flex-wrap gap-2">
                                {GROUP_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setGroupColor(c)}
                                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${groupColor === c ? 'ring-2 ring-stone-400 ring-offset-1 scale-110' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <hr className="border-stone-100 dark:border-white/10" />

            {/* Series Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-sm uppercase tracking-wider">
                    <LayersIcon className="w-4 h-4" />
                    <span>Series</span>
                </div>

                <div className="bg-stone-100/50 dark:bg-black/20 p-1 rounded-xl flex">
                    <Segment label="Keep Existing" active={seriesMode === 'keep'} onClick={() => setSeriesMode('keep')} />
                    <Segment label="Set Series" active={seriesMode === 'set'} onClick={() => setSeriesMode('set')} />
                    <Segment label="Clear" active={seriesMode === 'clear'} onClick={() => setSeriesMode('clear')} />
                </div>

                {seriesMode === 'set' && (
                    <div className="animate-fade-in space-y-4 bg-white dark:bg-white/5 p-4 rounded-xl border border-stone-100 dark:border-white/5 shadow-sm">
                        <input 
                            type="text" 
                            value={seriesTitle}
                            onChange={(e) => setSeriesTitle(e.target.value)}
                            placeholder="Series Title"
                            className="w-full bg-stone-50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                        />

                        <div className="space-y-2">
                            <label className="text-xs text-stone-400 font-bold block">Numbering</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setSeriesIndexMode('keep')}
                                    className={`px-2 py-2 text-xs border rounded-lg transition-colors ${seriesIndexMode === 'keep' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5'}`}
                                >
                                    Don't Change
                                </button>
                                <button 
                                    onClick={() => setSeriesIndexMode('auto')}
                                    className={`px-2 py-2 text-xs border rounded-lg transition-colors ${seriesIndexMode === 'auto' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5'}`}
                                >
                                    Auto (1, 2...)
                                </button>
                                <button 
                                    onClick={() => setSeriesIndexMode('same')}
                                    className={`px-2 py-2 text-xs border rounded-lg transition-colors ${seriesIndexMode === 'same' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5'}`}
                                >
                                    Set Same
                                </button>
                            </div>
                        </div>

                        {seriesIndexMode === 'auto' && (
                            <div className="flex items-center gap-2 animate-fade-in">
                                <span className="text-xs text-stone-500 dark:text-stone-400">Start from:</span>
                                <input 
                                    type="number" 
                                    value={seriesIndexStart}
                                    onChange={(e) => setSeriesIndexStart(parseInt(e.target.value) || 1)}
                                    className="w-16 bg-stone-50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-sm text-stone-900 dark:text-white focus:border-purple-500 outline-none"
                                />
                                <span className="text-xs text-stone-400 italic ml-auto">
                                    Applied in current sort order
                                </span>
                            </div>
                        )}

                        {seriesIndexMode === 'same' && (
                             <div className="flex items-center gap-2 animate-fade-in">
                                <span className="text-xs text-stone-500 dark:text-stone-400">Set all to:</span>
                                <input 
                                    type="text" 
                                    value={seriesIndexValue}
                                    onChange={(e) => setSeriesIndexValue(e.target.value)}
                                    placeholder="#"
                                    className="flex-1 bg-stone-50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-sm text-stone-900 dark:text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                        )}
                    </div>
                )}
            </section>

             <hr className="border-stone-100 dark:border-white/10" />

            {/* Status Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                    <ActivityIcon className="w-4 h-4" />
                    <span>Publication Status</span>
                </div>

                <div className="bg-stone-100/50 dark:bg-black/20 p-1 rounded-xl flex">
                    <Segment label="Keep" active={statusMode === 'keep'} onClick={() => setStatusMode('keep')} />
                    <Segment label="Set Status" active={statusMode === 'set'} onClick={() => setStatusMode('set')} />
                    <Segment label="Clear" active={statusMode === 'clear'} onClick={() => setStatusMode('clear')} />
                </div>

                {statusMode === 'set' && (
                    <div className="animate-fade-in bg-white dark:bg-white/5 p-4 rounded-xl border border-stone-100 dark:border-white/5 shadow-sm">
                        <select 
                             value={statusValue}
                             onChange={(e) => setStatusValue(e.target.value)}
                             className="w-full bg-stone-50 dark:bg-black/20 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none [&>option]:text-black"
                           >
                              <option value="Ongoing">Ongoing</option>
                              <option value="Completed">Completed</option>
                              <option value="Hiatus">Hiatus</option>
                              <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                )}
            </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 dark:bg-white/5 border-t border-stone-200 dark:border-white/10 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-semibold rounded-xl shadow-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
                <SaveIcon className="w-4 h-4" />
                Apply Changes
            </button>
        </div>

      </div>
    </div>
  );
};