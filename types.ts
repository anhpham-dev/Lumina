
export interface BookMetadata {
  title: string;
  author: string;
  description: string;
  releaseDate: string;
  genre: string;
  language?: string; // ISO 639-1 code (e.g. 'en', 'fr')
  seriesTitle?: string;
  seriesIndex?: string;
  seriesColor?: string; // Hex color code for the series
  group?: string; // For arbitrary collections/shelves
  groupColor?: string; // Hex color code for the group
  status?: string; // 'Ongoing', 'Completed', 'Hiatus', etc.
}

export interface Book extends BookMetadata {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  addedAt: number;
  coverColor: string;
  fileData?: ArrayBuffer; // Storing the file content locally
}

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST'
}

export type SortOption = 'recent' | 'title' | 'author' | 'series' | 'group';