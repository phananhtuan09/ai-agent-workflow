---
name: theme-factory
description: |
  Interactive UI theme generation when user needs help choosing colors/fonts.
  Generates cohesive themes based on brand personality using color harmony theory.

  Use when user explicitly asks for theme help:
  - "What theme should I use?" or "Help me pick colors"
  - "Generate a theme" or "What colors work well together?"
  - User uncertain about design direction and asks for suggestions
  - Building UI with no design specs AND needs guidance on aesthetic choices

  Interactive workflow: Ask personality → Present options → Generate custom theme.
  References pre-defined themes in .claude/themes/ (professional-blue, minimal-monochrome, etc.).

  Do NOT load for:
  - User building UI with clear aesthetic in mind (let design-fundamentals guide)
  - Figma/design file provided (use figma-design-extraction)
  - User already chose colors/fonts (just apply them)

  Integrates with design-fundamentals: Uses color harmony methods to generate themes
  that follow fundamentals' principles (spacing, contrast, typography).
---

# Theme Factory

## Purpose
Generate cohesive, beautiful UI themes when no design specifications provided, preventing generic monotone interfaces.

---

## Core Principle

**Brand personality drives design decisions.**

Every UI communicates personality through color, typography, and style. Rather than defaulting to arbitrary colors (like purple everywhere), ask about brand personality first, then generate cohesive themes that match.

**Good theme = Intentional, cohesive, personality-aligned**
**Bad theme = Random colors, inconsistent, no personality**

---

## When to Use Theme Factory

**Use theme factory when user EXPLICITLY asks for theme help:**
- "What theme should I use?"
- "Help me pick colors"
- "Generate a theme for [personality]"
- "What colors work well together?"
- User uncertain about aesthetic choices

**Don't use if:**
- User has clear aesthetic in mind → design-fundamentals handles it
- Figma file/URL provided → use figma-design-extraction
- User says "tạo page login" without asking for theme help → design-fundamentals applies principles directly
- User already chose colors/fonts → just apply them

**Key distinction:**
- **design-fundamentals**: Default for all UI creation (applies aesthetic principles directly)
- **theme-factory**: Only when user asks "what theme?" or needs help choosing

---

## Theme Selection Process

### Step 1: Understand Brand Personality

**Ask user** (concise, 1-2 questions max):

**Question 1: "What personality should this UI have?"**
Options:
- **Professional** - Corporate, trustworthy, business-focused
- **Creative** - Bold, artistic, unique, expressive
- **Minimal** - Clean, sophisticated, simple, timeless
- **Bold/Tech** - Modern, eye-catching, innovative
- **Warm/Organic** - Natural, welcoming, friendly
- **Playful** - Fun, colorful, approachable, energetic

**Question 2: "Any color preferences or inspirations?"**
- Specific colors they like
- Competitor/inspiration URLs
- Or: "Auto-generate based on personality"

---

### Step 2: Present Theme Options

**If user picked personality:**

Show 2-3 pre-defined themes from `.claude/themes/` matching personality:

```
I have these themes matching "[personality]":

1. Professional Blue - Corporate, trustworthy, clean
   Primary: Blue, Neutral grays, Professional

2. Minimal Monochrome - Sophisticated, timeless
   Primary: Neutrals with purple accent, Clean

3. Generate custom theme based on your preferences

Which would you like? (1, 2, or 3)
```

**If user wants custom:**
- Generate based on personality + color preferences
- Present 2-3 variations
- User picks favorite

---

## Theme Anatomy

### Complete Theme Structure

**1. Colors - Must include:**

**Primary Palette** (shades 50-900):
- Used for: Main actions, links, buttons, key UI elements
- Principle: Consistent hue with varying lightness
- Scale: 50 (lightest) → 900 (darkest)

**Secondary Palette** (optional):
- Used for: Supporting actions, accents
- Principle: Complements primary (analogous or complementary)

**Accent Palette**:
- Used for: Highlights, calls-to-action, focus states
- Principle: High contrast with primary for attention

**Neutral Palette** (50-900):
- Used for: Text, backgrounds, borders, subtle UI
- Principle: True grays or slightly tinted toward primary

**Semantic Colors**:
- Success: Green tones (growth, positive, confirmation)
- Warning: Yellow/orange tones (caution, attention needed)
- Error: Red tones (danger, mistakes, destructive actions)
- Info: Blue tones (information, neutral notifications)

**Why this structure:**
- Full palette enables light/dark modes
- Semantic colors ensure accessibility
- Neutrals provide visual breathing room

---

### 2. Typography

**See design-fundamentals for typography pairing principles.**

Theme should define:
- Font families (heading + body)
- Type scale values
- Font weights available
- Line heights

**Reference fundamentals for:**
- Font pairing rules (contrast vs harmonic)
- Typography hierarchy
- Readability guidelines

---

### 3. Spacing System

**See design-fundamentals for spacing scale principles.**

Theme should define:
- Base unit (4px or 8px)
- Scale values

**Reference fundamentals for:**
- Base-4 vs base-8 choice
- Application guidelines

---

### 4. Visual Properties

**Border Radius** (roundness):
- **Minimal themes:** Small or none (sharp, clean edges)
- **Friendly themes:** Medium roundness (approachable, soft)
- **Playful themes:** Large roundness or full pill shapes (fun, organic)
- Choose values that match personality - avoid arbitrary numbers

**Shadows** (elevation):
- Subtle shadows for depth (professional, minimal)
- Stronger shadows for cards/modals (modern, bold)
- No shadows for flat design (minimalist)
- Define elevation system with multiple levels (e.g., subtle/medium/strong)

**Why shadows matter:**
- Create visual hierarchy
- Indicate interactivity (hover elevates)
- Separate layers (modal above content)

---

## Color Theory Foundations

### Color Harmony Methods

**Complementary** - Opposites on color wheel:
- High contrast, energetic, bold
- Concept: Choose two colors directly opposite each other (e.g., Blue + Orange, Red + Green)
- Use for: Bold, tech, creative personalities
- Creates maximum contrast and visual impact

**Analogous** - Adjacent on color wheel:
- Harmonious, calm, cohesive
- Concept: Choose 2-3 colors next to each other (e.g., Blue + Purple + Teal)
- Use for: Professional, minimal, warm personalities
- Creates smooth, natural color transitions

**Triadic** - Three evenly spaced:
- Balanced, vibrant, dynamic
- Concept: Three colors evenly spaced on color wheel (e.g., Red + Yellow + Blue)
- Use for: Playful, creative personalities
- Creates balanced vibrancy

**Monochromatic** - Single hue, varying lightness:
- Clean, sophisticated, minimal
- Concept: Single color with variations in lightness/saturation
- Use for: Minimal, professional personalities
- Creates cohesive, elegant feel

---

### Color Psychology

**See design-fundamentals for detailed color psychology.**

Quick reference:
- Blue = Trust, professional
- Green = Growth, health
- Purple = Creativity, luxury
- Red = Energy, urgency
- Orange = Friendly, energetic
- Yellow = Optimism, playfulness
- Neutral = Sophisticated, minimal

**When choosing colors:**
- Consider brand personality from fundamentals
- Use color harmony methods (above) for cohesive palettes
- Verify contrast ratios meet WCAG AA accessibility standards

---

## Theme Documentation Format

**In planning doc (use actual values from your generated theme):**

```markdown
## Theme Specification

### Selected Theme
- Name: [Theme Name]
- Source: .claude/themes/[filename].theme.json OR "Custom generated theme"
- Personality: [personality traits]

### Color Palette
**Primary ([Color Name])**:
- Base shade: [hex] (buttons, links, primary actions)
- Hover shade: [hex] (hover states)
- Active shade: [hex] (active states)
- Additional shades: [hex values for 50-900 scale]

**Neutral**:
- Lightest: [hex] (backgrounds, subtle elements)
- Medium: [hex] (body text, secondary elements)
- Darkest: [hex] (headings, emphasis)
- Additional shades: [hex values for full scale]

**Semantic**:
- Success: [hex] (confirmations, success states)
- Error: [hex] (errors, destructive actions)
- Warning: [hex] (warnings, caution)
- Info: [hex] (information, neutral notifications)

### Typography
- Heading: [Font family], [weight descriptor], [line-height descriptor]
- Body: [Font family], [weight descriptor], [line-height descriptor]
- Scale: [List chosen scale values matching your system]

### Spacing
- Scale: [List scale values - base-4 or base-8 system]

### Visual Style
- Border radius: [Descriptor] (small/medium/large matching personality)
- Shadows: [Descriptor] (subtle/medium/strong elevation)
```

---

## Theme Application Guidelines

**See design-fundamentals for complete application guidelines.**

### Consistency Rules

**Do:**
- Use only colors from theme palette (no random hex codes)
- Apply spacing scale consistently (no arbitrary margins)
- Follow typography scale (no font sizes outside scale)
- Use semantic colors for their intended purpose (green = success)

**Don't:**
- Mix colors from multiple themes
- Use arbitrary values (random spacing, slight color variants)
- Override theme for one-off styles
- Ignore semantic color meanings

### Component Theming

**Buttons:**
- Primary: Primary color background, contrasting text
- Secondary: Secondary/neutral background, readable text
- Outline: Transparent background, primary border
- Ghost: Transparent, primary text only

**States consistently:**
- Hover: Slightly darker/more saturated than default
- Active: Noticeably darker/more saturated than hover
- Disabled: Muted neutral shades with reduced contrast
- Focus: Primary color ring or outline

**Text hierarchy:**
- H1: Largest scale, heading font, bold weight, darkest neutral
- H2-H6: Descending scale, heading font, semibold/bold weight
- Body: Base size, body font, regular weight, medium-dark neutral
- Caption: Smaller scale, body font, regular weight, medium neutral

---

## Common Theme Mistakes

**See design-fundamentals for foundational mistakes. Theme-specific issues:**

1. **No personality** - Generic theme, could be any site
   → Fix: Choose personality first (professional/creative/minimal/etc.), theme follows

2. **Arbitrary tweaks** - Modifying theme colors slightly "to see how it looks"
   → Fix: Use theme palette exactly as defined - trust the color harmony

3. **Semantic color abuse** - Green button for delete action
   → Fix: Red (error) for destructive, green (success) for positive

4. **Ignoring color harmony** - Random color combinations without harmony method
   → Fix: Use color harmony methods (complementary, analogous, etc.)

5. **Theme mixing** - Using colors from multiple themes
   → Fix: Commit to one theme, apply consistently

6. **Copying examples literally** - Using exact values from documentation examples
   → Fix: Generate unique values that match personality and harmony method

---

## Validation Checklist

**See design-fundamentals for complete validation. Theme-specific checks:**

- [ ] Brand personality identified (professional/creative/minimal/etc.)
- [ ] Color harmony method used (complementary, analogous, triadic, or monochromatic)
- [ ] Primary color palette complete (50-900 shades)
- [ ] Neutral palette defined (50-900 shades)
- [ ] Semantic colors defined (success, warning, error, info)
- [ ] Typography pairing chosen (heading + body fonts)
- [ ] Type scale defined (consistent multiplier)
- [ ] Spacing scale defined (base-4 or base-8)
- [ ] Border radius values chosen
- [ ] Shadow system defined (if applicable)
- [ ] Theme documented in planning doc
- [ ] Theme file saved in `.claude/themes/` (if custom)
- [ ] All colors pass WCAG AA contrast requirements (verify with contrast checker)

---

## Key Takeaway

**Color harmony + brand personality = cohesive themes.**

When users need help choosing colors/fonts:
1. Ask brand personality (professional/creative/minimal/etc.)
2. Apply color harmony methods (complementary, analogous, triadic, monochromatic)
3. Generate complete theme specification
4. Apply using design-fundamentals principles

Theme-factory provides the **interactive selection process** and **color theory methods**.
Design-fundamentals provides the **application principles** and **technical foundation**.

Together: Distinctive, cohesive, accessible UI themes.
