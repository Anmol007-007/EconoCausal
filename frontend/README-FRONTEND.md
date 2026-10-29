# EconoCausal — Frontend Component & Design System Architecture

EconoCausal v2.0 introduces an enterprise-grade quantitative UI system built on React 19, TypeScript, Tailwind CSS, Motion, and Plotly.js.

---

## 🎨 Design System & Theme Engine

### 1. Color Palette Tokens (`src/constants/theme.ts`)
- **Primary**: `#006481` (Deep Causal Teal)
- **Primary Container**: `#007ea2` (Interactive Accent)
- **Ocean**: `#2e94b9` (Secondary Vibrant Cyan)
- **Ice**: `#acdcee` (High-contrast Indicator Highlight)
- **Surface**: `#f1fbff` (Light Slate Canvas)
- **Dark Surface**: `#0d1b1e` (Night Operations Canvas)
- **Dark Surface Container**: `#1a2b30` (Night Elevated Card)

### 2. Theme Context (`src/context/ThemeContext.tsx`)
- System preference auto-detection via `prefers-color-scheme`
- Persistent localStorage state retention (`ec-theme`)
- Dynamic DOM root class mutation (`dark`)
- Instant CSS custom variable synchronization

---

## 🪝 Reusable Custom Hooks (`src/hooks/`)

| Hook | Purpose |
|:---|:---|
| `useTheme()` | Access current theme mode (`light` / `dark`) and toggle function |
| `useLocalStorage<T>(key, initialValue)` | Type-safe JSON serialization with fallback synchronization |
| `useDebounce<T>(value, delay)` | Debounces rapid user input across sliders and search fields |
| `useMediaQuery(query)` | Reactive media query breakpoint detector (`useIsMobile`, `useIsTablet`) |
| `usePageTitle(title)` | Dynamic document head title updater with automatic cleanup |
| `useOnlineStatus()` | Real-time browser network availability listener |

---

## 🧱 Component Library (`src/components/ui/`)

| Component | Description |
|:---|:---|
| `MetricCard` | Animated metric KPI display with trend percentage and status styling |
| `ChartContainer` | Plotly & SVG chart canvas wrapper with loading spinners and empty states |
| `Badge` | Variant-styled status indicators (`success`, `warning`, `danger`, `info`, `primary`) |
| `DataTable` | Filterable, sortable, paginated enterprise tabular component |
| `ProgressBar` | Multi-size animated percentage progression bar with status colors |
| `Tooltip` | Dynamic coordinate-aware floating portal tooltip |
| `HelpTooltip` | Inline statistical definition trigger for technical causal metrics |
| `Spinner` | Scalable SVG spinner with primary brand styling |
| `SkeletonCard` | Content placeholder loading skeleton with pulse effect |
| `ConfirmDialog` | Accessible modal dialog for critical destructive operations |
| `EmptyState` | Informative fallback view for empty datasets or uncomputed states |
| `ErrorBoundary` | Component-level fault isolation boundary with retry support |
| `ToastProvider` & `useToast` | Global reactive notification dispatch system |
| `AnimatedCounter` | Physics-eased numerical interpolation counter |
| `WelcomeBanner` | Dismissible onboarding guide for first-time operators |
| `OfflineBanner` | Global floating alert for network disconnection events |
| `Error404` | High-visibility missing route placeholder view |

---

## 🚀 Development & Build Workflow

```bash
# Type check TypeScript codebase
npm run lint

# Run Vite production distribution bundle
npm run build

# Start local development server
npm run dev
```
