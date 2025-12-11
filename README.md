# Lumina Bookshelf

**Lumina Bookshelf** is a modern, minimalist, and local-first digital library application. It is designed to help you organize, manage, and read your ebook collection with elegance and privacy.

Unlike traditional cloud services, Lumina runs entirely in your browser using **IndexedDB**. Your books never leave your device, ensuring 100% privacy and zero storage costs. It leverages Google's **Gemini AI** to automatically extract metadata, organize series, and suggest groups for your library.

![Lumina Bookshelf](https://via.placeholder.com/1200x600?text=Lumina+Bookshelf+Preview)

## ✨ Key Features

### 📚 Library Management
- **Local-First Architecture**: Stores EPUB, PDF, AZW3, and MOBI files directly in the browser. Works offline.
- **Formats Supported**: EPUB, PDF, AZW3, MOBI.
- **Views**: Toggle between a visual **Grid View** (with 3D cover effects) and a detailed **List View**.
- **Filtering & Sorting**: Sort by Title, Author, Series Order, or Group. Filter by custom collections.

### 🤖 AI-Powered Intelligence (Gemini)
- **Metadata Extraction**: Automatically infers Title, Author, Genre, Release Date, and Language from filenames.
- **Auto-Organization**: Detects Series and Volume numbers automatically.
- **Smart Grouping**: Suggests collection names (e.g., "Fantasy", "Cooking") based on book analysis.

### 🎨 Customization & Editing
- **Metadata Editor**: Manually refine details, descriptions, and cover colors.
- **Bulk Editing**: Select multiple books to batch-update Series, Groups, or Authors.
- **Color Coding**: Assign specific colors to Series or Groups for visual organization.

### 🔒 Security
- **Local Authentication**: Protects your library with a Master Password (hashed via SHA-256).
- **API Key Management**: Securely stores your Gemini API key in the local database.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gen AI SDK (`@google/genai`)
- **Database**: Native IndexedDB (Custom Wrapper)

---

## 🚀 Installation & Build Guide

Follow these steps to set up Lumina Bookshelf on your local machine.

### Prerequisites
1.  **Node.js** (v18 or higher) installed.
2.  A **Google Gemini API Key** (Get one for free at [Google AI Studio](https://aistudio.google.com/)).

### Step 1: Scaffold the Project
We will use Vite to create a fast React + TypeScript environment.

```bash
# Create the project directory
npm create vite@latest lumina-bookshelf -- --template react-ts

# Navigate into the folder
cd lumina-bookshelf

# Install dependencies
npm install
```

### Step 2: Install Required Libraries
Install the Google GenAI SDK and Tailwind CSS dependencies.

```bash
# Install GenAI SDK
npm install @google/genai

# Install Tailwind CSS dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Configure Tailwind
Open `tailwind.config.js` and update the `content` array to include your source files:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        background: '#fdfbf7', // Warm Beige
        surface: '#ffffff',
        primary: '#d97706', // Amber 600
        secondary: '#78716c', // Stone 500
        border: '#e7e5e4', // Stone 200
        'text-main': '#1c1917', // Stone 900
        'text-muted': '#57534e', // Stone 600
      },
      // ... (Paste the animation config from the provided index.html here if desired)
    },
  },
  plugins: [],
}
```

### Step 4: Add the Code
1.  Copy the provided `.tsx` and `.ts` files into the `src/` folder.
2.  Ensure your folder structure looks like this:
    ```
    src/
    ├── components/
    │   ├── BookCard.tsx
    │   ├── BookDetail.tsx
    │   ├── BulkEditModal.tsx
    │   ├── Icons.tsx
    │   ├── LoginScreen.tsx
    │   ├── SettingsModal.tsx
    │   └── UploadModal.tsx
    ├── services/
    │   ├── auth.ts
    │   ├── db.ts
    │   ├── gemini.ts
    │   └── organizer.ts
    ├── App.tsx
    ├── index.tsx (or main.tsx)
    └── types.ts
    ```

### Step 5: Environment Setup
Create a `.env` file in the root directory to set a default API Key (Optional, as users can set it via UI).

```env
VITE_API_KEY=your_actual_api_key_here
```

*Note: In `services/gemini.ts`, ensure you access the variable via `import.meta.env.VITE_API_KEY` instead of `process.env` when using Vite.*

### Step 6: Run Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:5173`.

### Step 7: Build for Production

To create an optimized build for deployment (e.g., to Vercel, Netlify, or GitHub Pages):

```bash
npm run build
```

The output will be in the `dist/` folder.

---

## 📖 How to Use

1.  **First Login**: The default Master Password is `anhpham14079`. You can change this in Settings.
2.  **Add Books**: Click the **"+ Add Book"** button. You can select files or upload an entire folder.
3.  **Organize**:
    *   **Edit**: Click a book to view details, then click "Edit".
    *   **Bulk Edit**: Click the "Select" (Check circle) icon in the top nav, select multiple books, then click "Edit" at the bottom.
    *   **Auto-Organize**: Click the Magic Wand icon in the nav to let AI sort your library.
4.  **Settings**: Click the User icon to update your Password or input your own Gemini API Key.