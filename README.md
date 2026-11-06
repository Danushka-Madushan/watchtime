<div align="center">
  <img src="./public/favicon.svg" width="72" height="72" alt="WatchTime Logo" />
  <h1>WatchTime</h1>
  <p><strong>Personal movie &amp; series watchlist synchronized to your GitHub repository</strong></p>
</div>

[![React 19](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict_Zero_Any-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, high-performance personal movie and series watchlist application. WatchTime synchronizes seamlessly with your private GitHub repository (`data/movies.json`) or operates completely offline in local storage mode, enriched with real-time movie metadata from the OMDb API.

Originally a single-file prototype, WatchTime has been re-architected into a modular, strictly typed Vite + React 19 single-page application with Tailwind CSS v4 design tokens, Lucide React iconography, and client-side security hardening.

---

## Table of Contents

1. [Key Features & Tour](#key-features--tour)
2. [Technology Stack](#technology-stack)
3. [Architecture & Directory Layout](#architecture--directory-layout)
4. [Getting Started](#getting-started)
5. [Available Scripts](#available-scripts)
6. [Credential Configuration Guide](#credential-configuration-guide)
   - [OMDb API Key](#1-omdb-api-key-setup)
   - [GitHub Personal Access Token (PAT)](#2-github-personal-access-token-pat-setup)
   - [Local Storage Fallback Mode](#3-local-storage-fallback-mode)
7. [Client-Side Security Hardening](#client-side-security-hardening)
8. [Type Safety & Zero-Any Policy](#type-safety--zero-any-policy)

---

## Key Features & Tour

### 🔍 Live OMDb Search & Smart Query Parsing
- **400ms Debounce**: Protects API rate limits while delivering fluid autocomplete as you type.
- **Year Extraction**: Automatically extracts release years wrapped in parentheses or trailing 4-digit numbers (e.g. typing `Inception 2010` queries title `Inception` with year filter `2010`).
- **Media Type Filtering**: Instant toggle between All Types, Movies, and Series directly in the search bar.
- **Incremental Pagination**: Search results feature an inline "Show more" loader that incrementally fetches additional pages from OMDb.
- **Duplicate Prevention**: Movie cards in search results detect titles already present in your watchlist and disable duplicate additions with clear visual badges.

### 🏷️ Status Filtering & Dynamic Genre Chips
- **Segmented Status Tabs**: Instant switching between `All`, `To watch`, and `Watched` views, featuring live dynamic counter badges computed from your library.
- **Wrap-Around Genre Pills**: Automatically compiles unique genres into clean, wrap-around pills with immediate access without horizontal scrolling.
- **Custom Styled Sorting Dropdown**: Modern select menu with `ArrowUpDown` and `ChevronDown` Lucide icons:
  - **Date Added** (newest first)
  - **Title A–Z** (alphabetical)
  - **Release Year** (most recent release first)

### 🎬 Responsive Movie Grid & Rich Card States
- **Fluid Layout**: 2-to-6 column responsive CSS grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`) with uniform 2:3 aspect-ratio poster containers.
- **Poster Fallback**: Custom inline SVG poster fallback with movie title and release year for missing or broken remote image URLs.
- **Single-Line Watch Toggle**: Guaranteed single-line **Mark watched** / **Undo** action button across all card dimensions.
- **Direct Poster Interaction**: Clicking anywhere on the movie poster opens the full Movie Details modal with high-res poster, synopsis, ratings, and cast.
- **Card Delete Action**: Convenient `w-8 h-8` delete button directly in the card action row with confirmation safety.
- **Contextual Empty States**: Helpful empty states distinguishing an empty library from active filter queries that return no matches.

### 🔍 Polished Movie Details Modal
- Accessible native HTML `<dialog>` modal with backdrop blur, focus trap, and Escape key handling.
- High-resolution poster art with safe `referrerPolicy="no-referrer"` handling.
- Full plot synopsis, IMDb rating with star rating score, Metascore, runtime, content age rating, director, and cast credits.
- Instant in-modal actions: toggle watched status, change poster, view on IMDb in a new tab, or remove movie.

### 🖼️ Poster Customization Modal
- Accessible native HTML `<dialog>` modal with keyboard escape handling and backdrop blur.
- Live URL preview with protocol validation.
- One-click **Refetch from IMDb** button that retrieves the latest official poster URL from OMDb.

### ⚙️ GitHub Synchronization & Settings Dialog
- **GitHub Contents API Integration**: Synchronizes your collection directly with `data/movies.json` in your chosen GitHub repository and branch.
- **Serialized Commit Queue (`saveChain`)**: Prevents race conditions and GitHub commit SHA collisions by serializing concurrent mutations through a Promise queue.
- **Masked Credentials UI**: Passwords and access tokens remain masked with `type="password"` inputs and interactive show/hide visibility toggles.
- **Test Connection Action**: Validates token permissions and repository access with informative feedback before saving.

### 🔔 Accessible Toast Feedback
- Transient, accessible notifications for operations including saving, synchronization, poster updates, deletions, and network errors.

### 🌓 Adaptive Light & Dark Theme
- Automatic detection of system color scheme (`prefers-color-scheme`).
- Instant manual toggle in the header persisted in local storage (`watchlist-theme`).
- Fully coordinated Tailwind CSS v4 design tokens and CSS custom properties.

---

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Runtime & UI** | [React 19](https://react.dev/) | Modern functional components, hooks, concurrent features |
| **Build Tool** | [Vite 6](https://vitejs.dev/) | Lightning-fast HMR and optimized Rollup production bundling |
| **Type System** | [TypeScript 5.7](https://www.typescriptlang.org/) | Strict mode with zero `any` types enforced |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | `@tailwindcss/vite` integration with `@theme` design tokens |
| **Iconography** | [Lucide React](https://lucide.dev/) | Consistent, accessible SVG icon primitives |
| **Sanitization** | [DOMPurify](https://github.com/cure53/DOMPurify) | Strict DOM sanitization preventing XSS attacks |

---

## Architecture & Directory Layout

### Modular Directory Tree

```
watchtime/
├── index.html                 # HTML entry with Content Security Policy & fonts
├── package.json               # Dependencies and build scripts
├── tsconfig.json              # Solution TypeScript config
├── tsconfig.app.json          # Strict TypeScript configuration for src/
├── tsconfig.node.json         # TypeScript configuration for Vite/tooling
├── vite.config.ts             # Vite configuration with React & Tailwind plugins
├── public/
│   └── favicon.svg            # Vector film icon
├── data/
│   └── movies.json            # Default 90-movie seed library
├── src/
│   ├── main.tsx               # Root DOM mount point
│   ├── App.tsx                # Master container integrating contexts and components
│   ├── index.css              # Tailwind v4 theme tokens and custom properties
│   ├── types/
│   │   ├── movie.ts           # Movie, MediaType, ViewFilter, SortOption
│   │   ├── config.ts          # AppConfig, RepoInfo, ConnectionTestResult
│   │   ├── omdb.ts            # OmdbSearchResponse, OmdbDetailResponse, SearchState
│   │   └── toast.ts           # ToastMessage, ToastType
│   ├── services/
│   │   ├── githubService.ts   # GitHub Contents API client, SHA tracking, serialized save queue
│   │   ├── omdbService.ts     # OMDb API client, search, getById, posterRefetch
│   │   └── storageService.ts  # LocalStorage wrapper for credentials, theme, and offline data
│   ├── utils/
│   │   ├── sanitize.ts        # DOMPurify wrapper and safe URL protocol validator
│   │   ├── queryParser.ts     # Search query and 4-digit release year extractor
│   │   └── base64.ts          # Unicode-safe Base64 encoder/decoder for GitHub payloads
│   ├── context/
│   │   ├── ConfigContext.tsx  # GitHub PAT & OMDb credential state provider
│   │   ├── MoviesContext.tsx  # Watchlist library, filtering, sorting, sync state provider
│   │   └── ToastContext.tsx   # Toast notification dispatch provider
│   └── components/
│       ├── Header/
│       │   └── Header.tsx     # Brand logo, sync status indicator, theme toggle, settings trigger
│       ├── SearchBar/
│       │   ├── SearchBar.tsx             # 400ms debounced input, type selector, clear action
│       │   ├── SearchResultsDropdown.tsx # Autocomplete panel with keyboard light dismiss
│       │   └── SearchResultCard.tsx      # Individual result item with metadata and Add button
│       ├── Filters/
│       │   ├── FilterSortBar.tsx         # Toolbar combining status, genre, and sort controls
│       │   ├── StatusFilter.tsx          # Segmented tabs (All, To watch, Watched) with counts
│       │   ├── GenreFilter.tsx           # Dynamic horizontal scrolling genre pill list
│       │   └── SortSelector.tsx          # Multi-criteria sorting dropdown
│       ├── MovieGrid/
│       │   ├── MovieGrid.tsx             # Responsive 2-to-6 column movie layout
│       │   ├── MovieCard.tsx             # Movie card with watch toggle, edit poster, delete
│       │   ├── MovieCardSkeleton.tsx     # Animated pulse placeholder skeleton
│       │   └── EmptyState.tsx            # Contextual empty library & filter state
│       ├── Modals/
│       │   ├── PosterModal.tsx           # Custom poster URL input, live preview, IMDb refetch
│       │   ├── SettingsModal.tsx         # GitHub & OMDb credential configuration dialog
│       │   └── ConfirmDialog.tsx         # Accessible movie removal confirmation dialog
│       └── Toast/
│           ├── ToastContainer.tsx        # Toast notification fixed stack container
│           └── ToastItem.tsx             # Animated toast notification item
└── tests/
    ├── unit/                  # Unit tests for services, contexts, and utils
    │   └── components/        # Component unit tests (Header, SearchBar, Filters, MovieGrid, Modals)
    └── stress/                # Concurrency, security, DOM sanitization, and adversarial stress tests
```

### Key Architectural Patterns

1. **Dual-Mode Component Pattern**:
   Components (such as `SearchBar`, `FilterSortBar`, `StatusFilter`, `GenreFilter`, and `SortSelector`) accept explicit props for pure, deterministic unit testing, while falling back gracefully to their respective React contexts (`MoviesContext`, `ConfigContext`, `ToastContext`) when rendered in production.
2. **Optimistic UI Synchronization**:
   Watchlist mutations (toggle status, delete movie, update poster, add movie) update local state immediately for instant feedback, then asynchronously synchronize with the GitHub repository via the serialized `saveChain` queue.
3. **Commit Queue & SHA Tracking**:
   `githubService.ts` maintains an in-memory Promise chain ensuring multiple rapid mutations are committed sequentially without `409 Conflict` errors from stale Git blob SHAs.

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher (Node 20+ recommended).
- **npm**: Version 9.0.0 or higher.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/watchtime.git
   cd watchtime
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite local development server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles TypeScript (`tsc`) and generates optimized production bundle in `dist/` |
| `npm run preview` | Locally serves the production build from `dist/` |
| `npm run lint` | Performs strict TypeScript type-checking across the entire codebase (`tsc --noEmit`) |

---

## Credential Configuration Guide

WatchTime requires no backend server. All credentials are stored securely in your browser's `localStorage` under the key `watchlist-cfg`.

### 1. OMDb API Key Setup

An OMDb API key is required to search for movies, fetch metadata, and download poster imagery.

1. Visit [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx).
2. Choose the **FREE (1,000 daily requests)** tier and enter your email address.
3. Check your inbox for the activation link and verification key.
4. Open WatchTime, click the **Settings (gear icon)** in the top right header.
5. Enter your key in the **OMDb API Key** field.
6. Click **Save Configuration**.

> **Note**: WatchTime also checks `localStorage['watchlist-omdb-key']` for backward compatibility with previous versions.

### 2. GitHub Personal Access Token (PAT) Setup

To sync your watchlist across devices using your own private or public GitHub repository:

1. Create a repository on GitHub (or use an existing one) containing a `data/movies.json` file.
2. Go to **GitHub Settings** > **Developer Settings** > **Personal Access Tokens** > **Fine-grained tokens** (or [click here](https://github.com/settings/tokens?type=beta)).
3. Click **Generate new token**:
   - **Token name**: `WatchTime Sync Token`
   - **Expiration**: Select desired lifespan (e.g. 90 days or 1 year)
   - **Repository access**: Select **Only select repositories** and pick your watchlist repository
   - **Permissions**: Under **Repository permissions**, find **Contents** and select **Read and write**
4. Click **Generate token** and copy the token starting with `github_pat_` (or classic `ghp_`).
5. In WatchTime, open **Settings** (gear icon) and configure:
   - **GitHub Personal Access Token**: Paste your token (input is masked for privacy)
   - **Repository Owner**: Your GitHub username or organization
   - **Repository Name**: The repository name (e.g. `watchtime`)
   - **Branch**: Target branch (default is `main`)
6. Click **Test Connection** to verify permissions before saving.
7. Click **Save Configuration**. WatchTime will fetch your `data/movies.json` and sync future additions.

### 3. Local Storage Fallback Mode

If no GitHub token is provided, WatchTime operates in **Local Storage Mode**. The sync indicator in the header will display **Local Mode**, and all watchlist modifications are persisted locally in `localStorage['watchlist-local-movies']`. You can add GitHub credentials at any time to upgrade to cloud sync.

---

## Client-Side Security Hardening

WatchTime implements comprehensive client-side security hardening to prevent Cross-Site Scripting (XSS), token theft, and untrusted protocol execution:

1. **DOMPurify Sanitization**:
   All user inputs, movie titles, genres, and text payloads are sanitized using [DOMPurify](https://github.com/cure53/DOMPurify) before rendering. HTML tags and malicious event handlers are stripped.
2. **Safe URL Protocol Validation**:
   Custom poster URLs and external links are strictly checked against `http:` and `https:` schemes via `sanitizeUrl()` in `src/utils/sanitize.ts`. Disallowed schemes (`javascript:`, `data:`, `vbscript:`, `file:`) are blocked and replaced with safe defaults.
3. **Safe External Links**:
   All outbound links to IMDb or GitHub use `target="_blank" rel="noopener noreferrer"` to prevent tab-nabbing and reverse window hijacking.
4. **Safe Poster Embeds & Fallbacks**:
   Movie posters specify `referrerpolicy="no-referrer"` to prevent leaking application referrers to external image hosts. On image load failure, an inline vector SVG fallback renders gracefully without throwing unhandled DOM exceptions.
5. **Credential Masking in UI**:
   The Settings dialog uses `type="password"` inputs with visibility toggles for the GitHub PAT and OMDb API key, preventing casual shoulder-surfing.
6. **Strict Content Security Policy (CSP)**:
   `index.html` includes a hardened `<meta>` Content Security Policy restricting resource execution:
   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://www.omdbapi.com https://api.github.com ws: http://localhost:*; object-src 'none'; base-uri 'self';"
   />
   ```

---

## Type Safety & Zero-Any Policy

WatchTime enforces strict mode TypeScript with zero tolerance for `any` types throughout the application.

### Verification Scripts

```bash
# Run strict TypeScript type checking across the codebase
npm run lint

# Verify clean production build compilation
npm run build
```

### Zero `any` Policy Verification

The TypeScript configuration (`tsconfig.app.json`) enforces strict mode:
- `strict: true`
- `noImplicitAny: true`
- `noUncheckedIndexedAccess: true`

You can independently verify that zero `any` declarations exist across the `src/` codebase:

```powershell
# PowerShell zero-any scan
Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | Select-String -Pattern ":\s*any\b|\bas\s+any\b|<any>|any\[\]"
```

The scan returns 0 matches, confirming complete type safety throughout the application.