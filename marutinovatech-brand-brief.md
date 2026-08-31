# Marutinovatech — Brand Brief for Website Generation

> Use this document as the design system reference when building the Marutinovatech website. Follow all tokens, colors, typography, and component specs exactly.

---

## 1. Business Overview

**Company Name:** Marutinovatech  
**Tagline:** Upskill · Accelerate · Get Hired  
**Industry:** EdTech / Career Acceleration  

**What we do:**
- Upskilling courses across Data Science, Data Engineering, ML, and more
- Expert trainers who solve real student problems to help them get jobs
- Job Acceleration Program: resume optimization, LinkedIn profile, job application support, and mock interviews

**Target Audience:** Gen Z and Millennials entering or transitioning into the tech workforce

**Design Direction:** Minimalist, dark-mode-first, electric accent, 2025 tech aesthetic

---

## 2. Logo

### Logo SVG (Primary — Dark Background)

```svg
<svg width="52" height="52" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Hexagon frame -->
  <path d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
        fill="rgba(0,229,200,0.08)"
        stroke="rgba(0,229,200,0.3)"
        stroke-width="1"/>
  <!-- M-form path -->
  <path d="M18 42V24L25 34L32 22L39 34L46 24V42"
        stroke="#00E5C8"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"/>
  <!-- Nova spark node at apex -->
  <circle cx="32" cy="18" r="3" fill="#00E5C8"/>
  <!-- M valley nodes -->
  <circle cx="25" cy="34" r="1.5" fill="rgba(0,229,200,0.5)"/>
  <circle cx="39" cy="34" r="1.5" fill="rgba(0,229,200,0.5)"/>
</svg>
```

### Logo Wordmark (HTML/CSS)

```html
<div class="logo-wordmark">
  <span style="font-family:'Sora',sans-serif; font-size:28px; font-weight:800; letter-spacing:-0.04em; color:#F4F4F0;">
    <span style="font-weight:300;">maruti</span><span style="color:#00E5C8;">nova</span>tech
  </span>
  <div style="font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(122,122,150,0.7); margin-top:4px;">
    Upskill · Accelerate · Get Hired
  </div>
</div>
```

### Logo Variants

| Variant | Background | Icon Color | Text Color |
|---------|-----------|------------|------------|
| Primary | `#0A0A10` (dark) | `#00E5C8` | `#F4F4F0` |
| Light | `#F4F4F0` (white) | `#009E8C` | `#0A0A10` |
| Brand Teal | `#00E5C8` | `#0A0A10` | `#0A0A10` |
| Icon Only | Any | `#00E5C8` | — |

### Logo Rules
- Always maintain clear space of 1× the cap-height of the wordmark on all sides
- Never stretch, distort, or change the aspect ratio
- Never recolor the icon — only Nova Teal, white, or black
- Never add shadows, glows, or 3D effects
- Wordmark weight split is always: 300 (maruti) / 800 (nova) / 400 (tech) — never change
- Never place on a busy background, gradient, or photography

---

## 3. Color System

### CSS Variables (copy into `:root`)

```css
:root {
  /* Core backgrounds */
  --color-bg-primary:    #0A0A10;   /* Page background */
  --color-bg-surface:    #12121A;   /* Card / section background */
  --color-bg-elevated:   #1A1A26;   /* Elevated cards */

  /* Brand colors */
  --color-teal:          #00E5C8;   /* Primary brand — CTAs, links, highlights */
  --color-teal-muted:    #009E8C;   /* Teal on light backgrounds */
  --color-teal-dim:      rgba(0, 229, 200, 0.12); /* Ghost buttons, tags */
  --color-teal-border:   rgba(0, 229, 200, 0.25); /* Teal-tinted borders */

  --color-coral:         #FF6B4A;   /* Job Acceleration — secondary accent */
  --color-coral-dim:     rgba(255, 107, 74, 0.12); /* Coral ghost elements */
  --color-coral-border:  rgba(255, 107, 74, 0.20); /* Coral-tinted borders */

  /* Text */
  --color-text-primary:  #F4F4F0;   /* Primary text */
  --color-text-secondary:#7A7A96;   /* Secondary / muted text */
  --color-text-hint:     rgba(122, 122, 150, 0.5); /* Disabled / placeholder */

  /* Borders */
  --color-border:        rgba(255, 255, 255, 0.08); /* Default border */
  --color-border-strong: rgba(255, 255, 255, 0.15); /* Hover / emphasis border */

  /* Grid background effect */
  --color-grid-line:     rgba(255, 255, 255, 0.02);
}
```

### Color Usage Rules

- **Nova Teal** → learning, skill building, course cards, primary CTAs, progress
- **Ignite Coral** → Job Acceleration Program ONLY — resume, mock interviews, hiring CTAs
- **Never** use both Teal and Coral at equal visual weight on the same surface
- All backgrounds must be dark (`#0A0A10`, `#12121A`, or `#1A1A26`)
- Light mode is NOT supported — this is a dark-first brand

### Color Palette Reference

| Name | Hex | Role |
|------|-----|------|
| Deep Space | `#0A0A10` | Page background |
| Surface | `#12121A` | Card / section bg |
| Card Dark | `#1A1A26` | Elevated cards |
| Nova Teal | `#00E5C8` | Primary brand, CTAs |
| Ignite Coral | `#FF6B4A` | Job Acceleration accent |
| Cloud White | `#F4F4F0` | Primary text |
| Nebula Gray | `#7A7A96` | Secondary text |
| Border | `rgba(255,255,255,0.08)` | Dividers, card borders |

---

## 4. Typography

### Font Stack

```css
/* Import in <head> */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');

:root {
  --font-display: 'Sora', sans-serif;      /* Headings, logo wordmark */
  --font-body:    'DM Sans', sans-serif;   /* Body copy, UI text */
  --font-mono:    'DM Mono', monospace;    /* Labels, tags, code, metadata */
}
```

### Type Scale

```css
/* Display / Hero */
.text-hero    { font-family: var(--font-display); font-size: clamp(40px, 7vw, 80px); font-weight: 800; letter-spacing: -0.04em; line-height: 1.0; }

/* Headings */
.text-h1      { font-family: var(--font-display); font-size: clamp(28px, 4vw, 48px); font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
.text-h2      { font-family: var(--font-display); font-size: clamp(22px, 3vw, 36px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
.text-h3      { font-family: var(--font-display); font-size: clamp(18px, 2.5vw, 24px); font-weight: 600; letter-spacing: -0.01em; line-height: 1.2; }
.text-h4      { font-family: var(--font-display); font-size: 18px; font-weight: 600; line-height: 1.3; }

/* Body */
.text-body-lg { font-family: var(--font-body); font-size: 18px; font-weight: 300; line-height: 1.75; color: var(--color-text-secondary); }
.text-body    { font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.7;  color: var(--color-text-secondary); }
.text-sm      { font-family: var(--font-body); font-size: 14px; font-weight: 400; line-height: 1.6; color: var(--color-text-secondary); }
.text-caption { font-family: var(--font-body); font-size: 13px; font-weight: 300; line-height: 1.5; color: var(--color-text-secondary); }

/* Mono / Labels */
.text-label   { font-family: var(--font-mono); font-size: 11px; font-weight: 400; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-teal); opacity: 0.8; }
.text-mono    { font-family: var(--font-mono); font-size: 13px; color: var(--color-teal); }
```

### Typography Rules
- Headings always use `font-family: var(--font-display)` (Sora)
- Body text always uses `font-family: var(--font-body)` (DM Sans)
- Section labels / metadata always use `font-family: var(--font-mono)` (DM Mono)
- Never use font-weight below 300
- Minimum body font size: 14px
- Minimum line-height for body: 1.6

---

## 5. Spacing System

All spacing is based on an **8px grid**. Use only these values:

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  24px;
  --space-6:  32px;
  --space-7:  48px;
  --space-8:  64px;
  --space-9:  80px;
  --space-10: 96px;
  --space-11: 120px;
  --space-12: 160px;

  /* Border radius */
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  20px;
  --radius-2xl: 24px;
  --radius-full: 9999px; /* Pills */
}
```

**Section padding:** `120px` top/bottom on desktop, `64px` on mobile  
**Container max-width:** `1100px` centered  
**Card padding:** `24px–32px` internal  
**Grid gap:** `16px` (tight), `24px` (standard), `32px` (loose)

---

## 6. Component Specifications

### Buttons

```css
/* Base button */
.btn {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  letter-spacing: -0.01em;
  transition: transform 0.15s ease, opacity 0.15s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn:hover { transform: translateY(-2px); }
.btn:active { transform: scale(0.98); }

/* Primary — main CTA */
.btn-primary {
  background: var(--color-teal);
  color: #0A0A10;
}

/* Secondary — outlined */
.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid rgba(255,255,255,0.2);
}
.btn-secondary:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.04); }

/* Accent — Job Acceleration only */
.btn-accent {
  background: var(--color-coral);
  color: #ffffff;
}

/* Ghost — subtle teal */
.btn-ghost {
  background: var(--color-teal-dim);
  color: var(--color-teal);
  border: 1px solid var(--color-teal-border);
}

/* Small variant */
.btn-sm { padding: 10px 20px; font-size: 13px; }
```

### Badges / Tags

```css
.badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.badge-teal    { background: var(--color-teal-dim);  color: var(--color-teal);  border: 1px solid var(--color-teal-border); }
.badge-coral   { background: var(--color-coral-dim); color: var(--color-coral); border: 1px solid var(--color-coral-border); }
.badge-neutral { background: rgba(255,255,255,0.06); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
```

### Cards

```css
/* Base card */
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  transition: border-color 0.2s ease;
}
.card:hover { border-color: var(--color-border-strong); }

/* Course card */
.card-course {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px;
}

/* Job Acceleration card — coral accent */
.card-job {
  background: rgba(255,107,74,0.05);
  border: 1px solid var(--color-coral-border);
  border-radius: var(--radius-lg);
  padding: 28px;
}

/* Feature card with teal left accent */
.card-feature {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-teal);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  padding: 24px;
}
```

### Section Label Pattern

Every section on the website should start with a mono label above the heading:

```html
<p class="section-label">01 — Courses</p>
<h2 class="text-h2">Learn From the Best</h2>
<p class="text-body-lg">Description text here...</p>
```

```css
.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-teal);
  opacity: 0.75;
  margin-bottom: 12px;
}
```

### Input Fields

```css
.input {
  font-family: var(--font-body);
  font-size: 15px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  padding: 14px 18px;
  width: 100%;
  outline: none;
  transition: border-color 0.2s ease;
}
.input::placeholder { color: var(--color-text-hint); }
.input:focus { border-color: var(--color-teal); }
```

---

## 7. Layout Patterns

### Hero Section

```css
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 40px;
  position: relative;
  overflow: hidden;
}

/* Grid background overlay */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--color-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-grid-line) 1px, transparent 1px);
  background-size: 60px 60px;
  z-index: 0;
}

/* Radial glow */
.hero::after {
  content: '';
  position: absolute;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,229,200,0.06) 0%, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
}
```

### Navbar

```css
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 20px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(10, 10, 16, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.nav-link {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}
.nav-link:hover { color: var(--color-text-primary); }
```

### Stats / Metric Numbers

```css
.stat-number {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--color-teal);
}
.stat-label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-top: 8px;
}
```

---

## 8. Website Sections / Pages

### Required Pages

1. **Home** (Landing page)
2. **Courses** (All upskilling courses)
3. **Job Acceleration Program** (Dedicated program page — use coral accent throughout)
4. **About** (Trainers, mission)
5. **Contact / Enroll**

### Home Page Sections (in order)

1. **Navbar** — Logo + nav links + "Enroll Now" CTA button
2. **Hero** — Grid background + radial teal glow + headline + subtext + 2 CTA buttons
3. **Stats Bar** — 500+ Students, 92% Job Success, 10+ Courses, 4.9★ Rating
4. **Courses Section** — Course cards grid (teal-accented)
5. **Job Acceleration Section** — coral-accented feature section with 3 pillars: Resume Optimization, Mock Interviews, Job Applications
6. **How It Works** — 3-step process: Enroll → Learn with Expert → Get Hired
7. **Trainer Spotlight** — Expert trainer profiles
8. **Testimonials** — Student success stories
9. **CTA Banner** — Full-width section with primary CTA
10. **Footer** — Logo, links, social, copyright

### Key Courses to Feature

- Data Science with Python
- Data Engineering (Apache Spark, PySpark, Kafka)
- Machine Learning & AI
- SQL & Database Engineering
- Cloud Data Platforms (AWS/Azure/GCP)
- Business Intelligence & Analytics

### Job Acceleration Program Pillars

1. **Resume Optimization** — ATS-friendly, keyword-optimized, professional formatting
2. **Job Profile & LinkedIn** — Complete profile audit, headline, about section
3. **Job Application Strategy** — Targeted applications, job boards, outreach
4. **Mock Interviews** — 2 rounds, live feedback, confidence building

---

## 9. Brand Voice

### Tone
- **Empowering** — Frame every learner as capable. Solution-first language.
- **Precise** — Specific skills, specific outcomes, specific timelines. No vague promises.
- **Ambitious** — Job-outcome obsessed. Every message connects skill to career result.
- **Approachable** — No gatekeeping, no jargon walls. Make tech achievable.

### Copywriting Examples

| ❌ Don't | ✅ Do |
|----------|-------|
| "Comprehensive curriculum" | "Master Python, SQL & Spark in 12 weeks" |
| "Exposure to technologies" | "Build real pipelines. Get hired at real companies." |
| "Learning outcomes" | "500+ students placed. You're next." |
| "Career support services" | "We apply for jobs WITH you. Not just for you." |
| "Industry-relevant content" | "Trained by engineers from Flipkart, Amazon & Razorpay" |

### Headline Formulas
- `[Skill] → [Outcome]` e.g. "Learn Spark → Get Hired"
- `[Number] + [Result]` e.g. "500+ Students. 92% Placement Rate."
- `[Pain] → [Solution]` e.g. "Stuck in tutorials? Build real projects with an expert."

---

## 10. Animation Guidelines

```css
/* Page entrance — stagger children */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeUp 0.5s ease forwards;
}

/* Hover scale for cards */
.card-hover {
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.card-hover:hover {
  transform: translateY(-4px);
  border-color: var(--color-teal-border);
}

/* Teal underline on links */
.link-teal {
  position: relative;
  color: var(--color-text-primary);
  text-decoration: none;
}
.link-teal::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 0; height: 1px;
  background: var(--color-teal);
  transition: width 0.3s ease;
}
.link-teal:hover::after { width: 100%; }
```

---

## 11. Social Media Sizes Reference

| Platform | Size | Background |
|----------|------|------------|
| LinkedIn Banner | 1584×396px | `#0A0A10` with grid |
| LinkedIn Post | 1200×628px | `#12121A` |
| Instagram Post | 1080×1080px | `#0A0A10` |
| Instagram Story | 1080×1920px | `#0A0A10` |
| Twitter/X Header | 1500×500px | `#0A0A10` |
| Twitter/X Post | 1200×675px | `#12121A` |

---

## 12. Quick Reference Cheat Sheet

```
BRAND NAME:     marutinovatech
LOGO WEIGHTS:   maruti=300 | nova=800 | tech=400
TAGLINE:        Upskill · Accelerate · Get Hired

PRIMARY COLOR:  #00E5C8  (Nova Teal)
ACCENT COLOR:   #FF6B4A  (Ignite Coral — Job Acceleration only)
BACKGROUND:     #0A0A10  (Deep Space)
TEXT:           #F4F4F0  (Cloud White)
MUTED TEXT:     #7A7A96  (Nebula Gray)

DISPLAY FONT:   Sora (Google Fonts)
BODY FONT:      DM Sans (Google Fonts)
MONO FONT:      DM Mono (Google Fonts)

BASE UNIT:      8px
BORDER RADIUS:  8 / 12 / 16 / 20 / 24px
BORDER:         1px solid rgba(255,255,255,0.08)
```

---

*Brand Guidelines v1.0 — Marutinovatech*  
*For questions about usage, refer to the brand-guidelines.html file for visual references.*
