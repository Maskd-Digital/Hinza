# Hinza Design System

Living reference for the current UI patterns and styling used across Hinza. Match these conventions when building or extending screens.

**Stack:** Next.js App Router · Tailwind CSS v4 · Plus Jakarta Sans · utility-first (no component library)

**Sources of truth:**

- Tokens & base styles: `app/globals.css`
- Fonts: `app/layout.tsx`
- Shared chrome: `components/` (`DashboardLayout`, `Sidebar`, `Modal`, `LandingHero`)
- Feature UI: `features/*/components/`

---

## Design principles

1. **Functional admin UI** — clear hierarchy, dense but readable, desktop-first.
2. **Strong blue brand** — primary chrome and CTAs use deep royal blue; page canvas is soft blue.
3. **White surfaces with blue-tinted shadows** — cards and buttons lift with blue-shadow language, not neutral gray.
4. **Copy existing literals** — most brand colors are hardcoded hex, not CSS variables. Prefer the same values over inventing new ones.
5. **Landing ≠ app** — marketing (`LandingHero`) uses slate + blue-600 gradients; authenticated dashboards use `#0108B8` / `#EFF4FF`.

---

## Color palette

### Core brand (app chrome)

| Role | Value | Usage |
|------|-------|--------|
| Primary / sidebar / CTA | `#0108B8` | Sidebars, primary buttons |
| Text / headings | `#081636` | Body, labels, table text (`--foreground`) |
| Page canvas | `#EFF4FF` | Dashboard, login, list backgrounds |
| Link / accent | `#2563EB` | Links, icons, progress bars, some titles |
| Surface | `#FFFFFF` | Cards, modals, inputs |
| Border | `gray-200` / `gray-300` | Cards, tables, form fields |

### Formal CSS tokens (`globals.css`)

| Variable | Light | Dark (`prefers-color-scheme`) |
|----------|-------|-------------------------------|
| `--background` | `#ffffff` | `#0a0a0a` |
| `--foreground` | `#081636` | `#ededed` |

Mapped in `@theme inline` as `--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`.

Most screens override the canvas with `#EFF4FF` inline or via utility classes and do not rely on dark mode.

### Role accent

| Role | Sidebar / chrome |
|------|------------------|
| System, company admin, QA | `#0108B8` |
| Facility manager | `#0f766e` (teal-700) |

### Semantic / status

| Meaning | Value / classes |
|---------|-----------------|
| Open / pending / in progress | `#FF9742` or `bg-yellow-100` / `bg-blue-100 text-blue-700` |
| Resolved | `#0FB200` or `bg-green-100 text-green-800` |
| Overdue / alert | `#FF4242` |
| Error panels | `bg-red-50` + `text-red-800` |
| Chart series | `#f59e0b`, `#3b82f6`, `#10b981`, `#6b7280`, `#ef4444`, `#8b5cf6` |

### Landing (marketing only)

| Role | Value |
|------|-------|
| Heading text | `#0f172a`, `#020617` |
| Muted text | `#64748b`, `#94a3b8` |
| CTA gradient | `#1d4ed8` → `#2563eb` |
| Soft panel | `#eef4fb` |
| Footer | `#1e293b` |

Do not mix landing slate/gradient tokens into dashboard chrome.

---

## Typography

### Families

- **Plus Jakarta Sans** — primary UI (`--font-plus-jakarta-sans`), weights 200–800
- **Geist Mono** — available (`--font-geist-mono`), little UI use

Body default:

```css
font-family: var(--font-plus-jakarta-sans), ui-sans-serif, system-ui, sans-serif;
```

### Scale & patterns

| Role | Classes / color |
|------|-----------------|
| Page H1 | `text-2xl font-bold text-[#081636]` (some dashboards use `#2563EB`) |
| Section H2 | `text-xl font-semibold text-[#081636]` |
| Section H3 | `text-lg font-semibold text-[#081636]` |
| Body / labels | `text-sm` + `#081636` or `text-gray-700` / `text-gray-600` |
| Table headers | `text-xs font-medium uppercase tracking-wider text-[#081636]` |
| Stat values | `text-2xl`–`text-3xl font-semibold` / `font-bold` |
| Sidebar title | `text-sm font-semibold text-white` + `text-xs text-white/80` |
| Landing H1 | `text-3xl sm:text-4xl font-bold tracking-tight text-[#0f172a]` |

---

## Elevation & shadows

Blue-tinted shadows are part of the brand language. Prefer these over default Tailwind `shadow-*` gray shadows on cards and primary actions.

| Use | Value |
|-----|-------|
| Card / button | `0 4px 6px rgba(37, 99, 235, 0.25)` |
| Stronger card (stats) | `0 4px 14px 0 rgba(37, 99, 235, 0.25), 0 2px 6px -2px rgba(37, 99, 235, 0.25)` |
| Login card | `0 4px 6px rgba(37, 99, 235, 0.35)` |
| Input inset | `inset 0 2px 4px rgba(37, 99, 235, 0.25)` or `rgba(1, 8, 184, 0.35)` |
| Active nav inset | `inset 0 2px 4px rgba(1, 8, 184, 0.25\|0.35)` (teal variant for facility manager) |
| Landing CTA | `shadow-lg shadow-blue-500/30` |

Tailwind twin for cards:

```
shadow-[0_4px_6px_-1px_rgba(37,99,235,0.25),0_2px_4px_-2px_rgba(37,99,235,0.25)]
```

---

## Spacing & radii

| Token | Pattern |
|-------|---------|
| Page padding | `p-6` or `px-[20px] pt-[20px]` |
| Section stack | `space-y-6` |
| Form stack | `space-y-4`–`space-y-6` |
| Sidebar width | `w-64` |
| Nav gaps | `gap-6` / `gap-[25px]` |
| Form / button radius | `rounded-md` |
| Card / modal radius | `rounded-lg` |
| Landing / soft surfaces | `rounded-xl` / `rounded-2xl` |
| Badges | `rounded-full` |

---

## Layout patterns

### App shell

All authenticated roles share:

```
flex h-screen [overflow-hidden]
  aside.w-64          ← colored sidebar
  main.flex-1         ← overflow-y-auto / overflow-auto
```

| Shell | Notes |
|-------|--------|
| Superadmin (`DashboardLayout`) | Shell `bg-gray-50`; page fill `#EFF4FF` |
| Company admin | Shell `#EFF4FF`; main `px-[20px] pt-[20px]` |
| QA Manager | Shell `bg-gray-50` |
| Content pages | `p-6` + `space-y-6` |

### Page header

Title left, primary action(s) right:

```
flex items-center justify-between
```

### Grids

- Stats: `grid grid-cols-1 gap-6 sm:grid-cols-3` (or `md:grid-cols-3`)
- Analytics: multi-column with `sm:` / `lg:` breakpoints
- Forms: `max-w-4xl` (wizards) or `max-w-md` (login)

### Modals

Centered overlay, size via `max-w-*`, `max-h-[90vh]`, mobile gutter `mx-4`. See `components/Modal.tsx`.

### Landing

Split `lg:flex-row` (~42% CTA / ~58% testimonials), full-bleed WebGL background, dark footer. Not used inside dashboards.

---

## Component patterns

### Buttons

**Primary (canonical):**

```tsx
className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
style={{
  backgroundColor: '#0108B8',
  boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)',
}}
```

**Secondary:**

```
border border-gray-300 bg-white text-[#081636] hover:bg-gray-50
```

**Destructive / alt:** `bg-red-600` or occasional `bg-blue-600` in modals/analytics.

**Landing CTA:** `rounded-xl bg-gradient-to-r from-[#1d4ed8] to-[#2563eb]` + blue glow shadow.

### Cards

White surface, `rounded-lg` (or `rounded-xl` for mini stats), blue-tinted box-shadow, often `border border-gray-200`. Padding `p-4`–`p-6`.

### Tables

```
overflow-hidden rounded-lg border border-gray-200 bg-white + blue shadow
thead: bg-gray-50
th: text-xs font-medium uppercase tracking-wider text-[#081636]
tbody: divide-y
tr: hover:bg-gray-50
td: text-sm text-[#081636]
actions: color #2563EB, hover:opacity-80, "|" separators
```

### Forms / inputs

```
rounded-md border border-gray-300 px-3 py-2 text-[#081636]
focus:border-blue-500 focus:ring-blue-500
+ inset blue shadow
labels: text-sm font-medium (gray-700 or #081636)
required: text-red-500 *
errors: rounded-md bg-red-50 p-4 text-red-800
```

Search bars often use stronger inset shadow and `focus:border-[#0108B8]`.

### Sidebar / nav

- Fixed `w-64`, brand fill `#0108B8` (or `#0f766e` for facility manager)
- Inactive: `text-white hover:bg-white/10`
- Active: `#EFF4FF` / white pill, `rounded-r-lg`, navy text, inset brand shadow, often `-ml-4` flush to edge
- Header icon: `rounded-lg bg-white/10` or `/20`
- Logout: bottom `border-t border-white/10`

### Modal (`components/Modal.tsx`)

- Backdrop: `bg-gray-500/30 backdrop-blur-sm`
- Panel: white `rounded-lg shadow-xl`
- Sizes: `sm` → `max-w-md` … `full` → `max-w-7xl`
- Title: `text-xl font-semibold text-[#081636]`
- No enter/exit animation (instant mount)

### Status badges

```
inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium
```

Plus semantic bg/text pairs from the status palette.

### Loading

```
h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent
```

Teal / amber spinner variants appear by role context.

### Charts (`features/company-admin/components/charts/`)

`MiniStatCard` color map: `blue` | `green` | `red` | `purple` | `amber` | `gray` → Tailwind `*-100` / `*-600` pairs. Bars/donuts use the chart series hexes above; soft `transition-all duration-300` on hover.

---

## Motion

- No custom `@keyframes` in CSS
- Tailwind: `animate-spin`, `animate-pulse` (skeletons)
- Soft UX: `transition`, `transition-colors`, `hover:opacity-90|95`
- Landing: continuous WebGL shader + pointer halo; testimonial dots `scale-110`
- No Framer Motion

Keep motion minimal in admin surfaces; reserve richer motion for landing.

---

## Responsive

Default Tailwind breakpoints (`sm` / `md` / `lg`). No custom breakpoint theme.

| Pattern | Usage |
|---------|--------|
| `sm:flex-row` | Filter bars, toolbars |
| `sm:grid-cols-3` / `md:grid-cols-3` | Stat grids |
| `lg:flex-row` + width splits | Landing hero |
| `sm:px-10` / `sm:text-4xl` | Landing type/spacing |
| Modal `mx-4` | Mobile gutters |

Sidebars are fixed `w-64` with **no mobile drawer** — UI is desktop-first.

---

## Utilities

- `cn()` in `lib/utils.ts` (`clsx` + `tailwind-merge`) for conditional class merging
- Prefer Tailwind utilities; use inline `style={{}}` only for brand hex/shadows already used elsewhere

---

## Quick checklist for new UI

1. Page canvas `#EFF4FF`; content cards white + blue shadow
2. Primary actions / sidebar `#0108B8`; text `#081636`; links `#2563EB`
3. Plus Jakarta Sans; H1 `text-2xl font-bold`; body/labels `text-sm`
4. Radii: `rounded-md` forms, `rounded-lg` cards, `rounded-full` badges
5. Shell: `w-64` solid sidebar + scrollable main; active nav = light pill + inset shadow
6. Status colors: orange / green / red as documented — do not invent new status hues without reason
7. Keep landing slate/gradient styles out of dashboard screens

---

## File map

| Path | Role |
|------|------|
| `app/globals.css` | CSS variables, Tailwind v4 theme, body/placeholder |
| `app/layout.tsx` | Font loading |
| `components/DashboardLayout.tsx` | Superadmin shell |
| `components/Sidebar.tsx` | System sidebar |
| `components/Modal.tsx` | Shared modal |
| `components/LandingHero.tsx` | Marketing landing |
| `components/dashboard/StatCard.tsx` | Stat card elevation language |
| `features/*/components/*Sidebar.tsx` | Role-specific sidebars |
| `features/company-admin/components/charts/` | Analytics widgets |
