# 📱 SAPRA Mobile View Design Documentation

## نمای کلی
این سند شامل تمام منطق و طراحی نمای موبایل SAPRA و تفاوت‌های آن با نمای دسکتاپ است.

---

## 🎯 فلسفه طراحی موبایل

### اصول اولیه
- **Mobile-First Approach**: طراحی با تمرکز بر تجربه موبایل
- **Touch-Friendly**: تمام المان‌ها حداقل 44px ارتفاع
- **Material Design**: پیروی از اصول Material Design گوگل
- **Performance**: بهینه‌سازی برای سرعت و مصرف کم باتری

---

## 📐 Layout Structure

### Desktop View
```
┌─────────────────────────────────────┐
│  Sidebar (280px) │   Main Content   │
│  - Fixed Left    │   - Margin Left  │
│  - Full Height   │   - Full Width   │
└─────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────────────────────────┐
│         Fixed Header (56px)         │
├─────────────────────────────────────┤
│                                     │
│         Scrollable Content          │
│         (padding: 60px top/bottom)  │
│                                     │
├─────────────────────────────────────┤
│      Bottom Navigation (56px)       │
└─────────────────────────────────────┘
```

---

## 🔄 تفاوت‌های کلیدی Desktop vs Mobile

### 1. Navigation

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Sidebar** | Fixed Left (280px) | Drawer (Slide from left) |
| **Top Nav** | Tabs در Header | Hidden |
| **Bottom Nav** | ❌ | ✅ Fixed (56px) |
| **Menu Toggle** | ❌ | ✅ Hamburger Icon |

### 2. Header

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Height** | Variable | 56px Fixed |
| **Position** | Relative | Fixed Top |
| **Content** | Logo + Tabs + Actions | Logo + Title + Menu |
| **Z-Index** | 1000 | 1050 |

### 3. Content Area

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Margin** | Left: 280px | 0 |
| **Padding** | 1.5rem | 0.75rem |
| **Body Padding** | 0 | Top: 60px, Bottom: 60px |

### 4. Cards

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Layout** | Grid (5 columns) | Horizontal Scroll |
| **Min Height** | 120px | 85px |
| **Padding** | 1rem | 0.75rem |
| **Font Size** | 2.3rem | 1.6rem |
| **Gap** | 1rem | 0.5rem |

### 5. Tables

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Display** | Table | Mobile Cards |
| **Font Size** | 0.85rem | 0.75rem |
| **Padding** | 0.75rem | 0.3rem |
| **Scroll** | Vertical | Horizontal + Vertical |

### 6. Modals

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Size** | 95% width | 100% (Fullscreen) |
| **Border Radius** | 12px | 0 |
| **Header** | White | Primary Gradient |
| **Footer** | Horizontal | Vertical Stack |

---

## 📏 Breakpoints

```css
/* Small Mobile */
@media (max-width: 375px)

/* Mobile */
@media (max-width: 768px)

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px)

/* Desktop */
@media (min-width: 992px)

/* Large Desktop */
@media (min-width: 1200px)
```

---

## 🎨 Spacing System

### Desktop
- Container: `padding: 1.5rem`
- Card Gap: `1rem`
- Element Margin: `1rem`

### Mobile
- Container: `padding: 0.75rem`
- Card Gap: `0.5rem`
- Element Margin: `0.75rem`

---

## 📝 Typography

### Desktop
```css
H1: 2.5rem
H2: 2rem
Body: 1rem
Small: 0.875rem
Card Title: 1.035rem
Card Count: 2.3rem
```

### Mobile
```css
H1: 1.5rem
H2: 1.25rem
Body: 0.875rem
Small: 0.75rem
Card Title: 0.75rem
Card Count: 1.6rem
```

---

## 🎯 Touch Targets

### استاندارد Material Design
- **Minimum**: 44px × 44px
- **Recommended**: 48px × 48px

### پیاده‌سازی در SAPRA
```css
.btn { min-height: 44px; }
.nav-link { min-height: 44px; }
.tree-node { min-height: 44px; }
.bottom-nav-item { min-height: 56px; }
.form-control { min-height: 44px; }
```

---

## 🔧 Component Behavior

### 1. Sidebar
**Desktop:**
- Always visible
- Fixed position
- 280px width

**Mobile:**
- Hidden by default
- Drawer (slide from left)
- 280px width (max 85vw)
- Overlay backdrop

### 2. Cards Slider
**Desktop:**
- CSS Grid
- 5 columns (1200px+)
- 4 columns (992-1199px)
- 3 columns (769-991px)

**Mobile:**
- Flexbox horizontal scroll
- 50% width per card
- Snap scroll
- Hidden scrollbar

### 3. Bottom Navigation
**Desktop:**
- Hidden

**Mobile:**
- Fixed bottom
- 4 items (خانه، گردش کار، منابع، منو)
- Active indicator (top border)
- Icon + Label

### 4. Tables
**Desktop:**
- Standard table
- Sticky header
- Horizontal scroll if needed

**Mobile:**
- Card-based layout
- Vertical stack
- Touch-friendly spacing

---

## 🎭 Animations & Transitions

### Desktop
```css
transition: all 0.3s ease;
transform: translateY(-6px);
```

### Mobile
```css
transition: all 0.2s ease;
transform: scale(0.97);
-webkit-tap-highlight-color: rgba(0,0,0,0.05);
```

---

## 📱 Safe Area Insets

برای دستگاه‌های دارای Notch:

```css
@supports (padding: max(0px)) {
    body {
        padding-top: max(56px, env(safe-area-inset-top));
        padding-bottom: max(56px, env(safe-area-inset-bottom));
    }
}
```

---

## 🎨 Visual Hierarchy

### Desktop
- Shadow: `0 4px 6px rgba(0,0,0,0.1)`
- Border Radius: `8-12px`
- Hover Effects: Scale + Shadow

### Mobile
- Shadow: `0 2px 8px rgba(0,0,0,0.1)`
- Border Radius: `8px`
- Active Effects: Scale(0.97)

---

## 🔍 Scrollbar Styling

### Desktop
```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: #adb5bd; }
```

### Mobile
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); }
scrollbar-width: thin;
```

---

## 📊 Performance Optimizations

### Mobile-Specific
1. **Hardware Acceleration**
```css
transform: translateZ(0);
-webkit-backface-visibility: hidden;
will-change: transform;
```

2. **Smooth Scrolling**
```css
-webkit-overflow-scrolling: touch;
scroll-behavior: smooth;
```

3. **Font Size Prevention**
```css
input { font-size: 16px; } /* Prevents iOS zoom */
```

---

## 🎯 Z-Index Hierarchy

```
Modals: 1055
Bottom Nav: 1050
Header: 1050
Sidebar: 1050
Overlay: 1040
Sticky Elements: 10-12
Normal: 1
```

---

## 📱 Orientation Support

### Portrait (عمودی)
- Default layout
- Full features

### Landscape (افقی)
```css
@media (orientation: landscape) {
    .sapra-navbar-header { height: 48px; }
    .bottom-nav { height: 48px; }
    body { padding: 48px 0; }
}
```

---

## 🎨 Color Scheme

### Desktop & Mobile (یکسان)
- Primary: `#3b82f6`
- Success: `#10b981`
- Warning: `#f59e0b`
- Danger: `#ef4444`
- Background: `#f8fafc`

---

## 🔄 State Management

### Active States
**Desktop:**
- Hover: `background-color` change
- Active: Border highlight

**Mobile:**
- Touch: Scale(0.97)
- Active: Background + Border
- Ripple effect simulation

---

## 📋 Checklist تفاوت‌ها

- ✅ Sidebar → Drawer
- ✅ Top Tabs → Hidden
- ✅ Bottom Nav → Visible
- ✅ Grid → Horizontal Scroll
- ✅ Table → Cards
- ✅ Modal → Fullscreen
- ✅ Hover → Touch
- ✅ 8px Padding → 4px
- ✅ 1rem Gap → 0.5rem
- ✅ Fixed Header/Footer
- ✅ Safe Area Support
- ✅ Touch Targets 44px+
- ✅ Font Size 16px (inputs)

---

## 🚀 Best Practices

1. **همیشه از `!important` کمتر استفاده کنید**
2. **Media queries را از کوچک به بزرگ بنویسید**
3. **Touch targets حداقل 44px**
4. **Font size inputs حداقل 16px**
5. **Fixed elements با z-index مناسب**
6. **Smooth scrolling برای UX بهتر**
7. **Hardware acceleration برای performance**
8. **Safe area insets برای notch**

---

## 📚 منابع

- [Material Design Guidelines](https://material.io/design)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [Web.dev Mobile Best Practices](https://web.dev/mobile/)

---

**نسخه:** 1.0  
**تاریخ:** 2025  
**توسعه‌دهنده:** Amin Naseri
