## 0. Read to Go

- **PDS Flexibility:** The app must be ready to swap the Personal Data Server (PDS) with minimal friction. If Bluesky ceases operation, switching to a new PDS should require changing only a single configuration string, without breaking other modules or features.  


## 1. Modular App Structure
Follow the predefined folder structure exactly:

app/
core/
api/ // API client wrappers
state/ // global state slices
ui/ // primitive reusable UI
utils/ // helper functions
hooks/ // app-wide hooks
modules/
auth/
feed/
post/
profile/
search/
settings/
layout/ // shared layouts and containers
Header.tsx
Footer.tsx
NavContainer.tsx
SharedButton.tsx
Card.tsx
FormControls/
themes/
theme.ts // global design tokens
assets/ // fonts, images, svgs
tests/ // testing setup
scripts/
README.md

---

## 2. Coding & Naming Conventions
- Always use consistent coding patterns.  
- Follow **bluesky-social** naming conventions when possible.  
- All comments and commit messages must be in **English**.  

**Conventions:**
- Folders → kebab-case (e.g., `modules/feed`)  
- Components → PascalCase.tsx (e.g., `Header.tsx`)  
- Screens → PascalCase.tsx (e.g., `FeedScreen.tsx`)  
- Hooks → useCamelCase.ts (e.g., `useAuth.ts`)  
- Types → PascalCase (e.g., `UserProfile`)  
- Constants → SCREAMING_SNAKE_CASE  
- Files → must match the exported default  

---

## 3. Modularity First
- All new features must be created as **independent modules** under `/modules`.  
- Each module must include:
  - `index.tsx`
  - `screens/`
  - `components/`
  - `hooks/`
  - `api.ts`
  - `types.ts`
  - `styles.ts`
  - `tests/`

- Components and modules must be **replaceable and extensible**.  
- Layouts, UI components, and features must be **shareable across modules**.  

---

## 4. UI/UX Consistency

Use material guidelines: https://m3.material.io/ 
Use material components: https://m3.material.io/components 

- Always use shared components from `/layout` and primitives from `/core/ui`.  
- Never hardcode styling values; always use **theme.ts tokens**.  
- UI must be **reusable** and **universal** (works across Web, iOS, Android).  
- Components must be consistent with layouts and user interactions.  

**Theme Tokens:**
- Radius → `theme.radius.small`, `theme.radius.medium`, `theme.radius.large`  
- Border → `theme.border.hairline`, `theme.border.small`  
- Spacing → `theme.spacing.xs`, `theme.spacing.sm`, `theme.spacing.md`, `theme.spacing.lg`  
- Colors → `theme.colors.primary`, `theme.colors.background`, `theme.colors.surface`, `theme.colors.text`, `theme.colors.muted`  
- Typography → `theme.font.family`, `theme.font.size.sm`, `theme.font.size.md`, `theme.font.size.lg`  

---

## 5. Scalability & Maintainability
- Architecture must remain **scalable** for future modules (e.g., notifications, custom feeds).  
- Use **lazy-loading** for screens and modules where possible.  
- Keep module boundaries small and clean.  
- Store secrets securely:
  - **SecureStore** (mobile)  
  - **localStorage** (web)  
- Validate and sanitize all input and API responses.  

---

## 6. State Management
- Keep single source of truth in `/core/state`.  
- Expose typed selectors and actions.  
- Prefer slices per domain (e.g., `authSlice`, `feedSlice`).  
- Persist minimal auth/session info securely.  
- Keep ephemeral UI state local to components.  

---

## 7. API Guidelines
- Create thin typed clients in `/core/api`.  
- Centralize:
  - Auth token injection  
  - Refresh logic  
  - Error normalization  
- Handle network retries and offline gracefully.  

---

## 8. Security Guidelines
- Store tokens securely.  
- Do not log sensitive data.  
- Validate all user input.  
- Use HTTPS for all requests.  
- Avoid exposing internal APIs directly to the client.  

---

## 9. Testing & CI (for future)
- Use **Jest** + **react-native-testing-library** for unit tests.  
- Add **E2E tests** (Detox for mobile, Playwright for web).  
- Enforce tests + lint checks in CI (e.g., GitHub Actions).  

---

## 10. Linting & Formatting
- Use **ESLint** (with TypeScript rules).  
- Use **Prettier** for formatting.  
- Share the same config across web and mobile.  

---

## 11. Documentation
- Write clear, concise comments.  
- Document API endpoints, request/response schemas.  
- Update `README.md` for each module.  
- Use **JSDoc** for complex types and functions.  

---

## 12. Performance
- Bundle size must be **optimized** (e.g., code-splitting, lazy-loading).  
- Use **React.memo** and **useCallback** where appropriate.  
- Avoid unnecessary re-renders.  

---

## 13. Accessibility
- Follow **WCAG** guidelines.  
- Use **ARIA roles** and **labels** where necessary.  
- Test with screen readers.  

---

## 14. Future Considerations
- Plan for **scalability** (e.g., notifications, custom feeds).  
- Plan for **multi-language** support.  

---

## 15. Conclusion
- This document is a **living guide**.  
- Adhere to it as much as possible.  
- Seek feedback from peers and stakeholders.  

---

