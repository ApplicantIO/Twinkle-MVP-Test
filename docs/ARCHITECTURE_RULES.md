# Twinkle Frontend Architecture Constitution

This document defines the non-negotiable architectural rules for the Twinkle frontend codebase.
All development MUST comply with these rules.
Violations are considered bugs and MUST be fixed.

---

## 1. Global Architectural Principles

### 1.1 Architecture-First Mindset

All code changes MUST respect the existing architectural boundaries.
Components MUST NOT violate layer ownership or cross architectural boundaries without explicit architectural review.

### 1.2 Separation of Concerns

Each component MUST have a single, well-defined responsibility.
Layout components MUST NOT contain page-specific logic.
Page components MUST NOT manipulate global layout state directly.

### 1.3 Pages Adapt to Layout, Not Vice Versa

Pages MUST adapt to the global layout system.
The global layout MUST NOT be modified to accommodate individual pages.
If a page requires special layout behavior, it MUST use the provided layout APIs and context systems.

---

## 2. Global Layout Constitution

### 2.1 Global Components

The following components are considered global layout components and MUST be rendered in the root layout:

* Header (fixed top navigation)
* Sidebar (desktop navigation drawer)
* BottomNavbar (mobile navigation)
* MainContent (content wrapper with layout margins)
* CentralizedVideoPlayer (global video player instance)
* All modal components (ShareModal, ReportModal, PurchaseFlowModal, AuthModal)

### 2.2 Page Forbidden Actions

Pages MUST NOT:

* Modify global layout component state directly
* Render their own Header, Sidebar, or BottomNavbar
* Use fixed positioning that conflicts with global layout
* Manipulate z-index values outside their designated layer
* Create page-specific modal systems
* Override global scroll behavior without explicit exception

### 2.3 Ownership Boundaries

Layout Components Own:

* Global navigation state
* Sidebar collapse/expand state
* Global scroll container behavior
* Modal visibility state
* Video player state management

Pages Own:

* Page-specific content rendering
* Page-specific data fetching
* Page-specific UI interactions within content area
* Page-specific route parameters

---

## 3. Render Order Rules

### 3.1 Explicit Stacking Order

Components MUST render in the following order (from DOM bottom to top):

1. Base content (pages): z-0 to z-10
2. Interactive content (video players, interactive elements): z-20
3. Backdrops and dimming layers: z-40
4. Sidebar navigation: z-50
5. Header: z-60
6. Modals and dialogs: z-70 and above

### 3.2 Render Sequence

The root layout MUST render components in this exact logical sequence:

* AuthProvider

  * PurchaseProvider

    * SidebarProvider

      * MiniplayerProvider

        * ModalProvider

          * Header
          * Sidebar
          * MainContent

            * children (pages render here)
          * BottomNavbar
          * CentralizedVideoPlayer
          * ShareModal
          * ReportModal
          * PurchaseFlowModal
          * AuthModal

Provider order MUST NOT be changed.

---

## 4. Scroll Ownership Rules

### 4.1 Default Scroll Behavior

By default, the main content area (MainContent) owns scroll behavior.
Pages MUST render scrollable content within the MainContent container.

### 4.2 Watch Page Exception

The /watch/[id] route is EXPLICITLY permitted to have custom scroll behavior.
This is the ONLY exception to default scroll ownership.

### 4.3 Forbidden Scroll Patterns

Pages MUST NOT:

* Create fixed scroll containers that conflict with MainContent
* Use overflow hidden on body or html
* Implement custom scroll locking mechanisms
* Override global scroll behavior outside the watch page exception

---

## 5. Z-Index System

### 5.1 Strict Z-Index Scale

The application MUST use ONLY the following z-index values:

* L0 (Base Content): z-0 to z-10
* L1 (Interactive Content): z-20
* L2 (Backdrops / Dimming): z-40
* L3 (Sidebar Navigation): z-50
* L4 (Header / Global UI): z-60
* L5 (Modals / Dialogs): z-70, z-80, z-90, z-100

### 5.2 Forbidden Z-Index Values

The following are strictly forbidden:

* Arbitrary values such as z-[9999], z-[123]
* Values outside the defined scale
* Dynamic or computed z-index values
* State-based z-index manipulation

### 5.3 Z-Index Assignment Rules

* Base content MUST use z-0 to z-10
* Video players MUST use z-20
* Backdrops MUST use z-40
* Sidebar MUST use z-50
* Header MUST use z-60
* Modals MUST use z-70 or higher

### 5.4 Watch Page Special Rule

On /watch routes:

* Sidebar backdrop MUST NOT block the video player
* Sidebar MUST behave as a non-modal navigation element

### 5.5 UI Primitive Z-Index Rules (Clarification)

Generic UI primitives such as Dialog, Drawer, or Popover are NOT modal systems.

Rules:

* All generic overlays or backdrops MUST use z-40
* All dialog or popup content MUST use z-70 or higher
* UI primitives MUST align with the global z-index scale
* UI primitives MUST NOT introduce new layers

---

## 6. Modal System Rules

### 6.1 Single Modal System

The application MUST use ONLY the centralized ModalProvider.
Pages MUST NOT create page-specific modal systems.

### 6.2 Portal-Based Rendering

All modals MUST render via React portals to the document body.
Inline modal rendering inside pages is forbidden.

### 6.3 Global Modal Components

The following are global modals:

* ShareModal
* ReportModal
* PurchaseFlowModal
* AuthModal

### 6.4 Forbidden Modal Patterns

Pages MUST NOT:

* Render inline modals
* Conditionally render modal components
* Override modal z-index values
* Implement custom modal overlays

### 6.5 UI Primitives vs Modal System (Clarification)

* Pages MUST NOT import Dialog or Drawer primitives
* Dialog MAY be used only inside global modal components
* ModalProvider is the single source of truth for modal lifecycle

---

## 7. Video Player Architecture

### 7.1 Single Owner Principle

CentralizedVideoPlayer is the single owner of global video state.

### 7.2 Portal Behavior

Miniplayer mode MUST render via portal and remain at z-20.

### 7.3 State Ownership Rules

* MiniplayerProvider owns video state
* Pages may trigger playback via context APIs
* Pages MUST NOT manipulate video DOM directly

### 7.4 Watch Page Video Player

Watch page MAY render a page-specific player at z-20
without conflicting with the global player.

---

## 8. Sidebar Rules

### 8.1 Route-Agnostic Requirement

Sidebar MUST be route-agnostic.
It MUST NOT detect or react to routes.

### 8.2 Layout Component Restriction

Header, Sidebar, and MainContent MUST NOT access route info
via routing hooks such as usePathname.

### 8.3 Sidebar State Management

Sidebar state MUST be managed exclusively by SidebarProvider.

### 8.4 Watch Page Sidebar Behavior

On watch pages:

* Sidebar is non-modal
* Sidebar backdrop MUST NOT be rendered

---

## 9. State Management Rules

Each domain MUST have a single owner:

* Auth → AuthContext
* Sidebar → SidebarContext
* Modal → ModalContext
* Video → MiniplayerContext
* Purchase → PurchaseContext

Duplicated sources of truth are forbidden.

---

## 10. Page Development Rules

### 10.1 Pages MAY

* Fetch page-specific data
* Render page-specific content
* Use page-local state
* Trigger modals via useModal

### 10.2 Pages MUST NOT

* Render layout components
* Modify global layout state
* Create modal systems
* Manipulate body or html styles

### 10.3 Page-Level UI Primitive Restrictions

Pages MUST NOT:

* Import Dialog, Drawer, or modal-like primitives
* Render overlays or backdrops
* Control modal visibility locally

---

## 11. Cursor-Specific Instructions

### 11.1 Mandatory File Reading

Cursor MUST read this document before making any change.

### 11.2 Task Refusal

Cursor MUST refuse tasks that violate this architecture.

### 11.3 Change Validation

Cursor MUST verify:

* Z-index scale compliance
* Modal system compliance
* Route-agnostic layout
* Single-owner state management

### 11.4 UI Primitive Compliance Check

Cursor MUST ensure:

* No Dialog imports in pages
* All overlays use z-40
* All modals use z-70 or higher

---

## 12. Change Policy

### 12.1 Document Evolution

Changes require architectural review and explicit approval.

### 12.2 Silent Violations Are Bugs

Any violation is a bug, regardless of visual correctness.

### 12.3 Enforcement

All code reviews MUST enforce this document.

### 12.4 Version Control

This document MUST be version controlled.

---

Document Version: 1.1
Last Updated: 2026-01-17
Status: Active and Enforceable
