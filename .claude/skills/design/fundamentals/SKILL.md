---
name: design-fundamentals
description: |
  Core design principles for creating distinctive, beautiful UIs with technical excellence.
  Combines creative direction with practical foundation for memorable, accessible interfaces.

  Use when building any UI without specific design specs:
  - Creating pages, components, or layouts from scratch
  - Choosing typography, colors, spacing for projects
  - Establishing visual hierarchy and design systems
  - Building distinctive UIs that avoid generic AI aesthetics

  Two-part approach:
  1. Creative Direction: Choose aesthetic tone (minimal, bold, elegant, playful, etc.)
     Avoid generic purple gradients, system fonts, predictable layouts
  2. Technical Foundation: Spacing scales, typography specs, WCAG contrast (4.5:1),
     visual hierarchy, consistent systems

  Goal: Create UIs that are BOTH beautiful (distinctive, memorable) AND correct
  (accessible, consistent, professional). Intentional aesthetic + solid foundation.

  Apply to: Web apps, landing pages, dashboards, marketing sites, any frontend UI
  Do NOT load for: Implementing from Figma designs (use figma-extraction),
  responsive-specific questions (use responsive), or backend work.
---

# Design Fundamentals

## Purpose
Create distinctive, beautiful UIs through intentional aesthetic choices backed by solid technical foundation. Avoid generic AI aesthetics while maintaining accessibility and consistency.

---

## Design Thinking

### Choose Aesthetic Direction

**Before coding, commit to clear aesthetic tone:**

**Minimal/Refined:**
- Generous whitespace, restrained color palette
- Elegant serif or geometric sans-serif fonts
- Subtle interactions, high contrast
- Example: Luxury brands, portfolio sites, editorial

**Bold/Vibrant:**
- Saturated colors, strong contrasts
- Display fonts with personality
- Energetic interactions, dynamic layouts
- Example: Startups, creative agencies, entertainment

**Playful/Friendly:**
- Rounded shapes, warm color palette
- Approachable fonts, comfortable spacing
- Delightful micro-interactions
- Example: Consumer apps, education, lifestyle

**Retro/Nostalgic:**
- Period-specific typography (70s, 80s, 90s)
- Vintage color schemes, textured backgrounds
- Bold geometric or organic shapes
- Example: Branding, campaigns, art projects

**Organic/Natural:**
- Earthy tones, soft shapes, flowing layouts
- Natural imagery, gentle transitions
- Warm, inviting atmosphere
- Example: Wellness, eco-brands, lifestyle

**Principle:** Intentionality > intensity. Well-executed minimalism beats unfocused maximalism. Commit fully to chosen direction.

---

### Avoid Generic AI Aesthetics

**Never use these clichés:**

❌ Purple gradients on white backgrounds
❌ System fonts everywhere (Inter, Roboto, Arial, -apple-system)
❌ Predictable 12-column grid layouts with no variation
❌ Safe, evenly-distributed color palettes
❌ Cookie-cutter card layouts (white cards, subtle shadows, centered content)
❌ Rounded corners on everything (8px border-radius everywhere)

**Instead, be distinctive:**

✅ Choose beautiful, characterful fonts (not defaults)
✅ Commit to bold colors OR refined neutrals (not timid middle)
✅ Create unexpected layouts (asymmetry, overlap, diagonal flow)
✅ Use dominant colors with sharp accents
✅ Add visual details (textures, gradients, patterns, depth)
✅ Break the grid intentionally for emphasis

---

## Technical Foundation

### Spacing System

**Principle:** Consistent scale creates visual rhythm and professionalism.

**Choose ONE base unit and multiply:**
- **Smaller base** (e.g., 4-based): Finer control, more granular spacing options
- **Larger base** (e.g., 8-based): Simpler system, faster decisions, bolder spacing

**Build your scale:**
- Start with base unit (4, 6, 8, or whatever fits your aesthetic)
- Create scale: base × 1, 2, 3, 4, 6, 8, 12, 16, 24
- Stick to scale values consistently (avoid arbitrary in-between values)

**Guidelines:**
- Tighter spacing for related items (closer relationship)
- Generous spacing separates major sections (hierarchy)
- Whitespace = breathing room and perceived importance
- Choose scale that matches your aesthetic (minimal = more space, dense = less space)

---

### Typography

**Creative Direction:**
- Choose distinctive, characterful fonts (not system fonts)
- Pair display font (headings) with refined body font
- Font conveys personality: geometric = modern, serif = elegant, rounded = friendly
- Avoid overused fonts: Inter, Roboto, Arial, Helvetica

**Technical Specs:**
- **Body text**: Readable size for your font (typically 16px+, adjust based on font characteristics)
- **Line height**: 1.5-1.6 for body (readability research), 1.2-1.3 for headings
- **Line length**: 50-75 characters optimal (readability research), adjust to design
- **Type scale**: Choose ratio for consistent hierarchy based on personality
  - Subtle/refined: Smaller ratio (e.g., 1.2)
  - Balanced: Medium ratio (e.g., 1.25)
  - Bold/dramatic: Larger ratio (e.g., 1.333+)

**Font Weights:**
- Regular (400): Body text
- Semibold (600): Emphasis, subheadings
- Bold (700): Headings, strong emphasis
- Limit to 3-4 weights maximum

**Hierarchy Levels:**
- Primary: Page titles, main CTAs
- Secondary: Section headings, important actions
- Tertiary: Body text, labels
- Quaternary: Metadata, captions, helper text

---

### Color System

**Creative Direction:**
- Commit to aesthetic: bold OR refined (not timid middle)
- Use dominant colors with sharp accents (not evenly distributed)
- Color conveys mood: warm (energy), cool (calm), muted (sophistication)
- Consider color psychology for brand personality

**Technical Specs:**
- **Primary**: Main brand color for CTAs, key actions (1 color)
- **Neutrals**: Text, borders, backgrounds (5-7 shades from light to dark)
- **Semantic**: Success (green), error (red), warning (yellow), info (blue)
- **Limit**: 3-4 brand colors maximum (more = chaos)

**Contrast Requirements (WCAG AA standards - required for accessibility):**
- Normal text (smaller sizes): 4.5:1 minimum
- Large text (larger sizes or bold): 3:1 minimum
- UI components (buttons, borders): 3:1 minimum
- Use contrast checker tools to verify

**Guidelines:**
- Test all text/background combinations
- Don't rely on color alone (add icons, labels, patterns)
- Each color needs light/dark variants (not single shade)

---

### Visual Hierarchy

**Principle:** Guide attention through size, weight, contrast, and spacing.

**Create clear levels:**
- Use size differences (headings larger than body)
- Use weight differences (bold for emphasis)
- Use spacing (more space = more importance)
- Use color sparingly for hierarchy (not as primary method)

**Hierarchy Techniques:**
- **Size**: Primary elements significantly larger than tertiary (2-3x+ size difference)
- **Proximity**: Group related items close, separate groups with generous space
- **Contrast**: Important elements use stronger contrast (color, weight, or both)
- **Alignment**: Consistent alignment creates order and professionalism

---

## Spatial Composition

### Layout Patterns

**Create interest through:**
- **Asymmetry**: Break symmetry for dynamic feel
- **Overlap**: Layer elements for depth
- **Diagonal flow**: Guide eye with angled layouts
- **Whitespace**: Generous negative space OR controlled density (intentional)
- **Grid breaking**: Intentionally break grid for emphasis (not accidentally)

**Alignment:**
- Left-align text for readability (LTR languages)
- Center-align sparingly (titles, empty states)
- Right-align numbers in tables
- Be consistent within sections

---

## Visual Details

### Add Depth and Atmosphere

**Backgrounds:**
- Gradient meshes (soft, blended colors)
- Noise textures (subtle grain, paper texture)
- Geometric patterns (shapes, grids, dots)
- Layered transparencies (depth through layers)

**Details:**
- Shadows for elevation (subtle for cards, stronger for modals)
- Borders for definition (thin, subtle color difference)
- Subtle animations (hover states, quick transitions)
- Custom cursors for interactive elements (optional, for bold designs)

---

## Common Mistakes

**❌ Avoid:**
1. Generic AI aesthetics (purple gradients, system fonts, predictable layouts)
2. No aesthetic direction (mixing styles randomly)
3. Arbitrary spacing (values outside your chosen scale)
4. Poor contrast (insufficient difference for accessibility)
5. Too many colors (overwhelming palette, no focus)
6. Inconsistent font sizes (random values, no systematic scale)
7. No visual hierarchy (everything same size and weight)
8. Cramped layouts (insufficient breathing room and whitespace)

**✅ Do:**
1. Choose clear aesthetic and commit fully
2. Use distinctive fonts with personality
3. Follow spacing scale consistently
4. Test contrast ratios (4.5:1 minimum)
5. Limit to 3-4 brand colors
6. Use type scale for predictable hierarchy
7. Create clear levels (primary > secondary > tertiary)
8. Give content generous whitespace

---

## Validation Checklist

Before considering design complete:

**Creative:**
- [ ] Clear aesthetic direction chosen (minimal/bold/playful/etc.)
- [ ] Distinctive, characterful fonts (not generic)
- [ ] Cohesive color palette (bold OR refined, not timid)
- [ ] Unexpected layouts or intentional grid breaks
- [ ] Visual details add atmosphere (backgrounds, textures)

**Technical:**
- [ ] Spacing follows consistent scale (chosen base unit applied systematically)
- [ ] Font sizes use type scale (consistent ratio matching aesthetic)
- [ ] Color contrast meets WCAG AA standards (verify with checker tool)
- [ ] Line length readable (optimal range based on readability research)
- [ ] Visual hierarchy clear (multiple distinct levels)
- [ ] Alignment consistent and intentional
- [ ] Limited brand color palette (focused, not overwhelming)

---

## Key Takeaway

**Distinctive + Correct = Beautiful UI**

Technical correctness (spacing, contrast, hierarchy) ensures usability and professionalism.
Creative direction (aesthetic, fonts, colors, layouts) ensures memorability and distinctiveness.

Great design requires both: intentional aesthetic choices executed with technical precision.

Focus on intentionality - commit fully to chosen direction, then execute with consistency.
Avoid generic AI aesthetics through bold or refined choices, never timid middle ground.
