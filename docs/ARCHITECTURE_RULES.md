# Twinkle Frontend Architecture Constitution

This document defines the non-negotiable architectural rules for the Twinkle frontend codebase. All development MUST comply with these rules. Violations are considered bugs and MUST be fixed.

## 1. Global Architectural Principles

### 1.1 Architecture-First Mindset

All code changes MUST respect the existing architectural boundaries. Components MUST NOT violate layer ownership or cross architectural boundaries without explicit architectural review.

### 1.2 Separation of Concerns

Each component MUST have a single, well-defined responsibility. Layout components MUST NOT contain page-specific logic. Page components MUST NOT manipulate global layout state directly.

### 1.3 Pages Adapt to Layout, Not Vice Versa

Pages MUST adapt to the global layout system. The global layout MUST NOT be modified to accommodate individual pages. If a page requires special layout behavior, it MUST use the provided layout APIs and context systems.

## 2. Global Layout Constitution

### 2.1 Global Components

The following components are considered global layout components and MUST be rendered in the root layout:

- Header (fixed top navigation)
- Sidebar (desktop navigation drawer)
- BottomNavbar (mobile navigation)
- MainContent (content wrapper with layout margins)
- CentralizedVideoPlayer (global video player instance)
- All modal components (ShareModal, ReportModal, PurchaseFlowModal, AuthModal)

### 2.2 Page Forbidden Actions

Pages MUST NOT:

- Modify global layout component state directly
- Render their own Header, Sidebar, or BottomNavbar
- Use fixed positioning that conflicts with global layout
- Manipulate z-index values outside their designated layer
- Create page-specific modal systems
- Override global scroll behavior without explicit exception

### 2.3 Ownership Boundaries

**Layout Components Own:**
- Global navigation state
- Sidebar collapse/expand state
- Global scroll container behavior
- Modal visibility state
- Video player state management

**Pages Own:**
- Page-specific content rendering
- Page-specific data fetching
- Page-specific UI interactions within content area
- Page-specific route parameters

## 3. Render Order Rules

### 3.1 Explicit Stacking Order

Components MUST render in the following order (from DOM bottom to top):

1. Base content (pages) - z-0 to z-10
2. Interactive content (video players, interactive elements) - z-20
3. Backdrops and dimming layers - z-40
4. Sidebar navigation - z-50
5. Header - z-60
6. Modals and dialogs - z-70 and above

### 3.2 Render Sequence

The root layout MUST render components in this sequence:

```
<AuthProvider>
  <PurchaseProvider>
    <SidebarProvider>
      <MiniplayerProvider>
        <ModalProvider>
          <Header />
          <Sidebar />
          <MainContent>
            {children} <!-- Pages render here -->
          </MainContent>
          <BottomNavbar />
          <CentralizedVideoPlayer />
          <ShareModal />
          <ReportModal />
          <PurchaseFlowModal />
        </ModalProvider>
      </MiniplayerProvider>
    </SidebarProvider>
  </PurchaseProvider>
</AuthProvider>
```

## 4. Scroll Ownership Rules

### 4.1 Default Scroll Behavior

By default, the main content area (MainContent) owns scroll behavior. Pages MUST render scrollable content within the MainContent container.

### 4.2 Watch Page Exception

The `/watch/[id]` route is EXPLICITLY permitted to have custom scroll behavior. This is the ONLY exception to default scroll ownership.

### 4.3 Forbidden Scroll Patterns

Pages MUST NOT:

- Create fixed scroll containers that conflict with MainContent
- Use `overflow: hidden` on body or html elements
- Implement custom scroll locking mechanisms
- Override global scroll behavior except for the watch page exception

## 5. Z-Index System

### 5.1 Strict Z-Index Scale

The application MUST use ONLY the following z-index values:

- **L0 (Base Content)**: z-0 to z-10
- **L1 (Interactive Content)**: z-20
- **L2 (Backdrops/Dimming)**: z-40
- **L3 (Sidebar Navigation)**: z-50
- **L4 (Header/Global UI)**: z-60
- **L5 (Modals/Dialogs)**: z-70, z-80, z-90, z-100 (for nested modals only)

### 5.2 Forbidden Z-Index Values

The following patterns are EXPLICITLY FORBIDDEN:

- Arbitrary z-index values: `z-[9999]`, `z-[123]`, `z-[456]`
- Values outside the defined scale
- Dynamic z-index calculations
- Z-index values based on component state unless explicitly defined in this document

### 5.3 Z-Index Assignment Rules

- **Base content**: MUST use z-0 to z-10
- **Video players**: MUST use z-20 (L1)
- **Sidebar backdrop**: MUST use z-40 (L2) and MUST NOT block video players on watch pages
- **Sidebar**: MUST use z-50 (L3)
- **Header**: MUST use z-60 (L4)
- **Modals**: MUST use z-70 or higher (L5)

### 5.4 Watch Page Special Rule

On `/watch/*` routes, the sidebar backdrop MUST NOT be rendered if it would block the video player. The sidebar MUST function as a non-modal navigation element on watch pages.

## 6. Modal System Rules

### 6.1 Single Modal System

The application MUST use ONLY the centralized modal system provided by ModalProvider. Pages MUST NOT create page-specific modal implementations.

### 6.2 Portal-Based Rendering

All modals MUST render via React portals to the document body. Modals MUST NOT be rendered inline within page components.

### 6.3 Modal Components

The following modal components are defined as global:

- ShareModal
- ReportModal
- PurchaseFlowModal
- AuthModal

### 6.4 Forbidden Modal Patterns

Pages MUST NOT:

- Create inline modal dialogs
- Use conditional rendering for modals within page components
- Implement custom modal overlay systems
- Override modal z-index values

## 7. Video Player Architecture

### 7.1 Single Owner Principle

The CentralizedVideoPlayer component is the SINGLE owner of global video player state. Pages MUST NOT create independent video player instances for global playback.

### 7.2 Portal Behavior

The video player MUST render via portal when in miniplayer mode. The player MUST maintain its layer (z-20) regardless of portal rendering.

### 7.3 State Ownership Rules

- MiniplayerProvider owns miniplayer state
- Pages may trigger video playback via context APIs
- Pages MUST NOT directly manipulate video player DOM
- Video player controls MUST remain within z-20 layer

### 7.4 Watch Page Video Player

The watch page (`/watch/[id]`) MAY render a page-specific video player for the primary video content. This player MUST use z-20 and MUST NOT conflict with the global player system.

## 8. Sidebar Rules

### 8.1 Route-Agnostic Requirement

The Sidebar component MUST be route-agnostic. The sidebar MUST NOT contain route detection logic or conditional rendering based on current route.

### 8.2 Layout Component Restriction

Layout components (Header, Sidebar, MainContent) MUST NOT access route information via usePathname or similar hooks for conditional behavior. Route-specific behavior MUST be handled by pages or dedicated route-aware components.

### 8.3 Sidebar State Management

Sidebar collapse/expand state MUST be managed exclusively by SidebarProvider. Pages MUST NOT directly manipulate sidebar state.

### 8.4 Watch Page Sidebar Behavior

On watch pages, the sidebar MUST function as a non-modal navigation element. The sidebar backdrop MUST NOT be rendered on watch pages to preserve video player interactivity.

## 9. State Management Rules

### 9.1 One Domain, One Context Owner

Each domain of application state MUST have a single context owner:

- Authentication: AuthContext
- Sidebar state: SidebarContext
- Modal state: ModalContext
- Video player state: MiniplayerContext
- Purchase state: PurchaseContext

### 9.2 No Duplicated Source of Truth

Components MUST NOT duplicate state that is already managed by a context provider. If state is needed across multiple components, it MUST be lifted to the appropriate context.

### 9.3 Context Provider Hierarchy

Context providers MUST be nested in the order defined in section 3.2. Providers MUST NOT be reordered or nested differently.

## 10. Page Development Rules

### 10.1 What Pages MAY Do

Pages MAY:

- Fetch page-specific data
- Render page-specific content
- Handle page-specific user interactions
- Use page-specific state management (useState, useReducer)
- Access route parameters
- Conditionally render content based on route
- Use the provided context APIs (useAuth, useSidebar, useModal, etc.)

### 10.2 What Pages MUST NOT Do

Pages MUST NOT:

- Modify global layout component props or state
- Render global layout components (Header, Sidebar, BottomNavbar)
- Create page-specific modal systems
- Override global z-index values
- Use fixed positioning that conflicts with Header or Sidebar
- Manipulate body or html styles
- Create custom scroll locking mechanisms
- Access or modify other pages' state
- Render components outside the MainContent container

## 11. Cursor-Specific Instructions

### 11.1 Mandatory File Reading

Before making ANY changes to the codebase, Cursor MUST read this architecture document. Cursor MUST verify that proposed changes comply with all rules defined in this document.

### 11.2 Task Refusal

Cursor MUST refuse to implement tasks that violate this architecture document. If a user request conflicts with these rules, Cursor MUST:

1. Identify the specific rule violation
2. Explain why the request cannot be fulfilled
3. Suggest alternative approaches that comply with the architecture

### 11.3 Change Validation

After making changes, Cursor MUST verify:

- Z-index values comply with section 5
- No new modal systems are created (section 6)
- Layout components remain route-agnostic (section 8)
- State management follows single-owner principle (section 9)
- Pages do not violate forbidden actions (section 10.2)

## 12. Change Policy

### 12.1 Document Evolution

This document MAY be modified only through:

1. Architectural review process
2. Explicit approval from project architects
3. Documentation of the rationale for changes
4. Update of all affected code to comply with new rules

### 12.2 Silent Violations Are Bugs

Any code that violates this document is considered a bug, regardless of whether it "works" or "looks correct." Violations MUST be fixed, not worked around.

### 12.3 Enforcement

All code reviews MUST verify compliance with this document. Automated checks SHOULD be implemented where possible to prevent violations.

### 12.4 Version Control

This document MUST be version controlled. Changes to this document MUST be tracked in git history with clear commit messages explaining the architectural rationale.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-04  
**Status**: Active and Enforceable
