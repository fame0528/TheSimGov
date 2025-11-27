# HeroUI Theme & Design System Proposal

**Document Type:** Design System Specification  
**Created:** 2025-11-27  
**Status:** PROPOSED  
**Priority:** HIGH (P0 Foundation)  
**Scope:** Complete visual design, motion, and sound system for TheSimGov  

---

## Philosophy

TheSimGov's design system balances **serious simulation depth** with **engaging MMO gameplay**. The visual language should feel:
- **Professional** - Government/business simulation aesthetic
- **Modern** - Clean, minimal UI with subtle animations
- **Engaging** - Vibrant domain colors, satisfying interactions
- **Consistent** - Shared components across all domains

**Design Principles:**
1. **Clarity over Decoration** - Information-dense UI remains readable
2. **Motion with Purpose** - Animations enhance UX, never distract
3. **Domain Identity** - Each domain has distinct color palette
4. **Accessibility First** - WCAG 2.1 AA compliance baseline

---

## Color System

### Brand Colors (Global)

**Primary Palette:**
```
brandPrimary: #2563EB (blue-600)     - Main brand, Politics domain
brandSecondary: #059669 (emerald-600) - Business, growth, success
brandAccent: #9333EA (purple-600)     - Premium features, achievements
```

**Semantic Colors:**
```
success: #16A34A (green-600)   - Positive actions, wins, profits
warning: #F59E0B (amber-500)   - Alerts, caution, pending
danger: #DC2626 (red-600)      - Errors, losses, critical
info: #3B82F6 (blue-500)       - Information, tooltips, help
```

---

### Domain Color Palettes

#### Crime Domain
**Primary:** Crimson Red (`#B91C1C` - red-700)  
**Secondary:** Deep Purple (`#7C2D12` - purple-900)  
**Accent:** Gold (`#D97706` - amber-600)  

**Use Cases:**
- Headers, navigation in Crime dashboard
- Territory map colors (gang control)
- Heat level indicators (red = high heat)
- Illegal status badges

**Rationale:** Bold reds convey danger/illicit activity; golds suggest profit/reward from risk

---

#### Politics Domain
**Primary:** Royal Blue (`#2563EB` - blue-600)  
**Secondary:** Navy (`#1E3A8A` - blue-900)  
**Accent:** White/Light Blue (`#DBEAFE` - blue-100)  

**Party Colors:**
```
democrat: #2563EB (blue-600)
republican: #DC2626 (red-600)
independent: #9333EA (purple-500)
```

**Competitiveness Scale:**
```
safeDem: #1D4ED8 (blue-700)
leanDem: #3B82F6 (blue-500)
tossup: #F59E0B (amber-400)
leanGOP: #F87171 (red-400)
safeGOP: #B91C1C (red-700)
```

**Use Cases:**
- Campaign dashboards (blue headers)
- District maps (party colors)
- Bill status badges (introduced → signed progression)
- Election night graphics

**Rationale:** Blue = trust, civic duty; party colors reflect real US politics for familiarity

---

#### Business Domain
**Primary:** Forest Green (`#059669` - emerald-600)  
**Secondary:** Teal (`#0D9488` - teal-600)  
**Accent:** Lime (`#84CC16` - lime-500)  

**Use Cases:**
- Revenue charts (green = profit)
- Business health indicators
- Compliance status (green = good standing)
- Growth metrics

**Rationale:** Green = money, growth, sustainability; professional yet optimistic

---

#### Employees Domain
**Primary:** Golden Yellow (`#F59E0B` - amber-500)  
**Secondary:** Orange (`#EA580C` - orange-600)  
**Accent:** Slate (`#64748B` - slate-500)  

**Use Cases:**
- Payroll dashboards
- Labor union badges
- Skill level indicators
- Employee satisfaction metrics

**Rationale:** Yellow/orange = energy, labor, human capital; slate grounds vibrant colors

---

### Neutral Palette (All Domains)

**Background:**
```
bgPrimary: #FFFFFF (white)         - Light mode primary background
bgSecondary: #F9FAFB (gray-50)     - Light mode secondary background
bgTertiary: #F3F4F6 (gray-100)     - Cards, panels

bgPrimaryDark: #0F172A (slate-900) - Dark mode primary background
bgSecondaryDark: #1E293B (slate-800) - Dark mode secondary background
bgTertiaryDark: #334155 (slate-700)  - Dark mode cards, panels
```

**Text:**
```
textPrimary: #0F172A (slate-900)      - Primary text (light mode)
textSecondary: #475569 (slate-600)    - Secondary text
textTertiary: #94A3B8 (slate-400)     - Tertiary text, disabled

textPrimaryDark: #F1F5F9 (slate-100)  - Primary text (dark mode)
textSecondaryDark: #CBD5E1 (slate-300) - Secondary text (dark)
textTertiaryDark: #64748B (slate-500)  - Tertiary text (dark)
```

**Borders:**
```
border: #E2E8F0 (slate-200)      - Light mode borders
borderDark: #475569 (slate-600)  - Dark mode borders
```

---

## Typography

### Font Families

**Primary (UI):** Inter (Google Font)  
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Extrabold)
- Use: All headings, body text, UI elements
- Rationale: Excellent readability, modern, professional

**Monospace (Data):** JetBrains Mono (Google Font)  
- Weights: 400 (Regular), 600 (Semibold)
- Use: Code snippets, data tables, numerical displays
- Rationale: Clear distinction between numbers, tabular data readability

**Display (Optional):** Poppins (Google Font)  
- Weights: 600 (Semibold), 700 (Bold)
- Use: Marketing pages, hero sections (not in-app)
- Rationale: More personality for landing pages vs. functional UI

---

### Type Scale

**Headings:**
```
h1: 2.5rem (40px)   - Page titles, hero headings
h2: 2rem (32px)     - Section headings
h3: 1.5rem (24px)   - Subsection headings
h4: 1.25rem (20px)  - Card titles
h5: 1.125rem (18px) - Component headings
h6: 1rem (16px)     - Small headings
```

**Body:**
```
bodyLarge: 1.125rem (18px)  - Lead paragraphs
bodyRegular: 1rem (16px)    - Default body text
bodySmall: 0.875rem (14px)  - Secondary text, captions
bodyTiny: 0.75rem (12px)    - Labels, metadata
```

**Weights:**
```
Headings: font-weight-600 (Semibold)
Body: font-weight-400 (Regular)
Emphasis: font-weight-500 (Medium)
Strong: font-weight-700 (Bold)
```

**Line Heights:**
```
Tight: 1.2  - Headings
Normal: 1.5 - Body text
Relaxed: 1.75 - Long-form content
```

---

## Component Variants (HeroUI)

### Cards
```
default: White background, subtle border, no shadow
elevated: White background, shadow-md, hover:shadow-lg
bordered: Thick border (2px), no shadow
interactive: Hover state (shadow + border color), cursor pointer
domain-themed: Header colored by domain (Crime: red, Politics: blue, etc.)
```

**Usage:**
- `default`: General content containers
- `elevated`: Feature highlights, important info
- `bordered`: Data tables, comparison views
- `interactive`: Clickable cards (navigate to detail)
- `domain-themed`: Domain-specific dashboards

---

### Buttons

**Variants:**
```
primary: Filled, brand color, white text - Primary actions (Submit, Save, Vote)
secondary: Filled, secondary color - Secondary actions (Cancel, Back)
outline: Border only, transparent bg - Tertiary actions (View Details)
ghost: No border/bg, hover state only - Minimal actions (Close, Dismiss)
danger: Filled, red color - Destructive actions (Delete, Remove)
success: Filled, green color - Positive actions (Approve, Accept)
```

**Sizes:**
```
sm: px-3 py-1.5, text-sm (14px)   - Compact UIs, tables
md: px-4 py-2, text-base (16px)   - Default size
lg: px-6 py-3, text-lg (18px)     - Prominent CTAs
xl: px-8 py-4, text-xl (20px)     - Hero sections
```

**States:**
```
default: Base styling
hover: Darken 10%, shadow-sm
active: Darken 20%, shadow-none
disabled: Opacity 50%, cursor not-allowed
loading: Spinner icon, disabled state
```

---

### Badges

**Variants:**
```
default: Gray background, dark text
success: Green background, white text
warning: Amber background, dark text
danger: Red background, white text
info: Blue background, white text
pill: Fully rounded borders (rounded-full)
dot: Small colored dot + text (status indicators)
```

**Sizes:**
```
sm: px-2 py-0.5, text-xs (12px)
md: px-2.5 py-1, text-sm (14px)
lg: px-3 py-1.5, text-base (16px)
```

**Use Cases:**
- Status indicators (Election: Upcoming, In Progress, Completed)
- Bill stages (Introduced, Committee, Floor, Signed)
- Heat levels (Low, Medium, High, Critical)
- Competitiveness (Safe, Lean, Tossup)

---

### Tables (DataTable Component)

**Variants:**
```
default: White background, bordered cells
striped: Alternating row colors (gray-50)
hoverable: Row hover state (gray-100)
compact: Reduced padding (py-2 vs py-3)
bordered: Full borders (cell + row + table)
```

**Features:**
- Sortable columns (click header to sort)
- Pagination (50, 100, 200 rows per page)
- Filters (search, date range, status)
- Selection (checkboxes for bulk actions)
- Responsive (horizontal scroll on mobile)

---

### Modals

**Sizes:**
```
sm: 400px width  - Confirmations, simple forms
md: 600px width  - Default size, most forms
lg: 800px width  - Complex forms, wizards
xl: 1000px width - Data-heavy content
full: 100% viewport - Immersive experiences
```

**Variants:**
```
default: White background, rounded corners, shadow-xl
centered: Vertically + horizontally centered
slideOver: Slide from right (drawer pattern)
bottomSheet: Slide from bottom (mobile)
```

---

### Progress Indicators

**Linear Progress:**
```
default: Full-width bar, colored fill
labeled: Percentage text above/inside
segments: Multiple colored segments (budget allocation)
striped: Animated stripes (loading states)
```

**Circular Progress:**
```
spinner: Rotating circle (indeterminate)
gauge: Partial circle with percentage (determinate)
ring: Thin ring with animated fill
```

**Use Cases:**
- Campaign fundraising goals
- Vote counts (yeas vs needed)
- Election countdown
- Bill progress (introduced → signed)

---

### Tooltips

**Variants:**
```
default: Dark background, white text
light: White background, dark text, border
arrow: Includes arrow pointer
```

**Positions:**
```
top, bottom, left, right
Automatically repositions if overflows viewport
```

**Behavior:**
- Hover delay: 300ms (prevent accidental triggers)
- Max width: 320px (wrap long text)
- z-index: 9999 (above all content)

---

## Motion & Animations (Framer Motion)

### Transition Presets

**Page Transitions:**
```typescript
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  duration: 0.3,
  ease: 'easeOut'
};
```

**Card Entrance:**
```typescript
const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 }
};

const cardTransition = {
  duration: 0.2,
  ease: 'easeOut'
};
```

**Modal:**
```typescript
const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalContentVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 }
};

const modalTransition = {
  type: 'spring',
  damping: 25,
  stiffness: 300
};
```

**List Items (Stagger):**
```typescript
const listVariants = {
  animate: {
    transition: {
      staggerChildren: 0.05 // 50ms between each child
    }
  }
};

const listItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 }
};
```

---

### Special Animations

**Success Celebration (Election Win):**
```typescript
import confetti from 'canvas-confetti';

const celebrateWin = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#2563EB', '#FFFFFF', '#DC2626'] // USA colors
  });
};
```

**Number Count-Up (Vote Totals, Revenue):**
```typescript
const countUp = {
  initial: { value: 0 },
  animate: { value: finalValue },
  transition: { duration: 2, ease: 'easeOut' }
};
```

**Achievement Unlock:**
```typescript
const achievementVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: [0, 1.2, 1],
    rotate: 0
  }
};

const achievementTransition = {
  duration: 0.6,
  times: [0, 0.7, 1],
  ease: 'backOut'
};
```

**Loading Skeleton:**
```typescript
const skeletonVariants = {
  animate: {
    opacity: [0.4, 1, 0.4]
  }
};

const skeletonTransition = {
  duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut'
};
```

---

## Sound Effects (Licensed Free SFX)

### Sound Libraries (Royalty-Free)

**Recommended Sources:**
- **Zapsplat** (free with attribution): https://www.zapsplat.com
- **Freesound** (Creative Commons): https://freesound.org
- **BBC Sound Effects** (free, public domain): https://sound-effects.bbcrewind.co.uk

---

### Action Sounds (Volume: 0.3-0.4)

```
click.mp3        - Button clicks, UI interactions
success.mp3      - Achievement unlocks, task completions
error.mp3        - Invalid actions, errors
notification.mp3 - Alerts, new messages, feed updates
```

**Use Cases:**
- `click`: All button clicks, tab switches
- `success`: Achievement badge appears, quest complete
- `error`: Form validation failure, insufficient funds
- `notification`: Activity feed update, new election result

---

### Domain-Specific Sounds (Volume: 0.4-0.5)

**Crime:**
```
cash-register.mp3 - Sale completed (P2P marketplace)
siren.mp3         - DEA raid event (subtle, not jarring)
```

**Politics:**
```
vote-cast.mp3     - Casting vote on bill (ballot drop sound)
gavel.mp3         - Bill passage, executive signing
applause.mp3      - Election win, endorsement received
```

**Business:**
```
coin-drop.mp3     - Revenue milestone hit
cha-ching.mp3     - Large transaction completed
```

**Engagement:**
```
level-up.mp3      - Player levels up (fanfare)
achievement.mp3   - Badge unlock (chime)
```

---

### Victory/Celebration Sounds (Volume: 0.5-0.6)

```
election-win.mp3  - Winning election (triumphant fanfare, 3-5s)
bill-passed.mp3   - Major bill passage (gavel + applause, 2-3s)
jackpot.mp3       - Huge profit/milestone (celebratory, 2-3s)
```

---

### Ambient Sounds (Volume: 0.1-0.2, Optional Toggle)

```
city-ambience.mp3  - Background city sounds (subtle traffic, distant sirens)
office-ambience.mp3 - Office sounds (keyboard typing, phone rings)
```

**Implementation:**
- User preference: On/Off toggle in settings
- Default: Off (opt-in for ambient sounds)
- Loop seamlessly if enabled

---

### Sound System Implementation

**Hook:** `src/hooks/useSound.ts`
```typescript
import { useCallback, useRef } from 'react';

const soundCache = new Map<string, HTMLAudioElement>();

export function useSound(src: string, volume: number = 0.4) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!soundCache.has(src)) {
      const audio = new Audio(src);
      audio.volume = volume;
      soundCache.set(src, audio);
    }
    
    const audio = soundCache.get(src)!;
    audio.currentTime = 0; // Reset to start
    audio.play().catch(err => console.warn('Sound play failed:', err));
  }, [src, volume]);

  return { play };
}
```

**Usage:**
```typescript
import { useSound } from '@/hooks/useSound';

export function VoteButton({ billId }: { billId: string }) {
  const { play: playVoteSound } = useSound('/sounds/vote-cast.mp3', 0.4);

  const handleVote = async () => {
    await castVote(billId);
    playVoteSound(); // Play sound on successful vote
  };

  return <Button onClick={handleVote}>Cast Vote</Button>;
}
```

---

## Icons

### Primary Icon Set: Lucide React

**Why Lucide:**
- 1000+ icons (comprehensive coverage)
- Consistent design language
- Tree-shakeable (import only what you use)
- Accessible (ARIA labels)
- MIT license (free)

**Installation:**
```bash
npm install lucide-react
```

**Usage:**
```typescript
import { Users, TrendingUp, Gavel, Landmark } from 'lucide-react';

<Users className="w-5 h-5" />           // Employees icon
<TrendingUp className="w-5 h-5" />      // Business growth
<Gavel className="w-5 h-5" />           // Politics (legislation)
<Landmark className="w-5 h-5" />        // Government building
```

---

### Custom Icons (Domain-Specific)

**When to Create Custom:**
- Domain-specific concepts not in Lucide (e.g., drug flask, ballot box)
- Brand identity icons (logo, app icon)

**Implementation:**
- SVG format (scalable, small file size)
- 24x24px base size (matches Lucide)
- Same stroke width (2px) as Lucide for consistency

**Example Custom Icons:**
```
drug-flask.svg      - Crime manufacturing
territory-map.svg   - Gang territory control
campaign-flag.svg   - Political campaign
payroll.svg         - Employee payroll
```

---

## Illustrations

### Style: Minimalist Line Art with Domain Color Accents

**Characteristics:**
- Simple line drawings (2-3px stroke)
- Minimal detail (focus on recognizable shapes)
- Domain color accents (e.g., Crime illustrations use crimson red highlights)
- White/light gray backgrounds

**Use Cases:**
- **Empty States**: "No campaigns yet - create your first campaign"
- **Tutorial Screens**: Visual guides for workflows
- **Achievement Badges**: Icon-based badge designs
- **Error States**: Friendly error illustrations (404, 500)

**Tools:**
- **Figma** (design illustrations)
- **Export to SVG** (code-friendly)

**Example Illustrations Needed:**
```
empty-crime.svg       - Empty lab, "Build your first facility"
empty-campaign.svg    - Empty podium, "Run for office"
empty-business.svg    - Empty storefront, "Start your business"
tutorial-crime.svg    - Step-by-step lab setup
tutorial-politics.svg - Campaign creation flow
achievement-badge.svg - Template for achievement badges
```

---

## Dark Mode Support

### Color Adjustments

**Background:**
- Light mode: `#FFFFFF` → Dark mode: `#0F172A` (slate-900)
- Cards: `#F9FAFB` → `#1E293B` (slate-800)

**Text:**
- Light mode: `#0F172A` → Dark mode: `#F1F5F9` (slate-100)
- Secondary: `#475569` → `#CBD5E1` (slate-300)

**Borders:**
- Light mode: `#E2E8F0` → Dark mode: `#475569` (slate-600)

**Domain Colors:** Remain same (high contrast in both modes)

**Implementation (Tailwind CSS):**
```typescript
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
  {/* Content adapts to light/dark mode */}
</div>
```

---

## Accessibility (WCAG 2.1 AA)

### Color Contrast

**Minimum Ratios:**
- Normal text (16px): 4.5:1
- Large text (24px+): 3:1
- UI components: 3:1

**Verification:**
- Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- All brand/domain colors pass AA on white/dark backgrounds

---

### Keyboard Navigation

**Requirements:**
- All interactive elements focusable (buttons, links, inputs)
- Focus indicators visible (2px outline, brand color)
- Tab order logical (top-left → bottom-right)
- Escape closes modals
- Enter/Space activates buttons

**Implementation:**
```typescript
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  className="focus:outline-none focus:ring-2 focus:ring-blue-600"
>
  Vote
</Button>
```

---

### Screen Reader Support

**ARIA Labels:**
- All icons have `aria-label` or `aria-labelledby`
- Complex components have `role` attributes
- Live regions for dynamic updates (`aria-live="polite"`)

**Example:**
```typescript
<TrendingUp 
  className="w-5 h-5" 
  aria-label="Revenue increasing"
/>

<div role="status" aria-live="polite">
  {voteCount} votes counted
</div>
```

---

## Design System Documentation

### Storybook Integration (Recommended)

**Install Storybook:**
```bash
npx sb init --type react
```

**Document Components:**
- All HeroUI components with variants
- Color palette swatches
- Typography scale
- Icon library
- Motion examples

**Benefits:**
- Visual component catalog
- Test variants in isolation
- Share with team/stakeholders
- Accessibility checks (Storybook a11y addon)

---

### Documentation Site (Alternative)

**Tech Stack:**
- Next.js page at `/design-system`
- Interactive component playground
- Copy-paste code snippets

**Sections:**
- Colors (swatches with hex codes)
- Typography (type scale examples)
- Components (all variants with props)
- Icons (searchable icon library)
- Motion (animated examples)
- Sounds (play sound previews)

---

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- ✅ HeroUI theme configuration (colors, typography)
- ✅ Component variants (buttons, badges, cards)
- ✅ Dark mode setup
- **Estimate:** 12-16 hours

### Phase 2: Motion & Sound (Week 2)
- ✅ Framer Motion presets
- ✅ Sound effects integration (licensed free SFX)
- ✅ Custom animations (celebration, count-up)
- **Estimate:** 10-14 hours

### Phase 3: Assets (Week 3)
- ✅ Icon library setup (Lucide + custom SVGs)
- ✅ Illustration creation (5-7 key illustrations)
- ✅ Achievement badge templates
- **Estimate:** 12-16 hours

### Phase 4: Documentation (Week 4)
- ✅ Storybook setup or design system page
- ✅ Component documentation
- ✅ Usage guidelines
- **Estimate:** 8-12 hours

**Total:** 42-58 hours (6-8 weeks at 8h/week)

---

## File Structure

```
/public/
  /sounds/
    /actions/
      click.mp3
      success.mp3
      error.mp3
      notification.mp3
    /crime/
      cash-register.mp3
      siren.mp3
    /politics/
      vote-cast.mp3
      gavel.mp3
      applause.mp3
    /business/
      coin-drop.mp3
      cha-ching.mp3
    /engagement/
      level-up.mp3
      achievement.mp3
    /victory/
      election-win.mp3
      bill-passed.mp3
      jackpot.mp3
  /icons/
    /custom/
      drug-flask.svg
      territory-map.svg
      campaign-flag.svg
      payroll.svg
  /illustrations/
    empty-crime.svg
    empty-campaign.svg
    empty-business.svg
    tutorial-crime.svg
    tutorial-politics.svg
    achievement-badge.svg

/src/
  /styles/
    globals.css          - Tailwind imports, global styles
    theme.ts             - HeroUI theme configuration
  /components/
    /ui/                 - Shared UI components
      Button.tsx
      Card.tsx
      Badge.tsx
      Modal.tsx
      DataTable.tsx
      Progress.tsx
      Tooltip.tsx
  /hooks/
    useSound.ts          - Sound playback hook
  /lib/
    animations.ts        - Framer Motion variants/presets
```

---

## Maintenance & Evolution

### Quarterly Reviews
- Evaluate new component needs
- Update color palette if domains expand
- Add new sound effects for new features
- Refine motion based on user feedback

### Version Control
- Design system versioned separately (e.g., v1.0, v1.1)
- Breaking changes (color updates) require major version bump
- Additions (new components) are minor version bumps

---

**Status:** PROPOSED - Ready for approval and implementation  
**Recommendation:** Start with Phase 1 (Foundation) in P0-Alpha to establish consistent UI across all domains  
**Next Steps:** Gather feedback on color palette, select sound effects, create custom icons  
**Created:** 2025-11-27
