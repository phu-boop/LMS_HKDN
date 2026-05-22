# LMS_HKDN: Frontend Engineering Standards (Next.js / TypeScript)

## 1. Directory Structure (Feature-First)
- Store logic in `src/features/[feature-name]`.
- Each feature should have:
  - `components/`: UI components.
  - `hooks/`: Custom hooks.
  - `services/`: API call functions.
  - `types/`: TypeScript definitions.
  - `store/`: Zustand slice (if needed).

## 2. Component Guidelines
- Use **Functional Components** with arrow functions.
- **Naming**: PascalCase for files and components (e.g., `CourseCard.tsx`).
- **Props**: Define props using `interface` above the component.
- **Client vs Server**: Use `"use client"` only when necessary (hooks, interactivity).

## 3. State Management
- **Server State**: Use **TanStack Query** (`useQuery`, `useMutation`).
- **Global UI State**: Use **Zustand**. Keep it minimal.
- **Local State**: Use `useState` or `useReducer`.

## 4. Form Handling & Validation
- Use **React Hook Form** with **Zod** resolver.
- Define schemas in `types/schema.ts` for reuse between frontend and backend validation.

## 5. Styling
- Use **Tailwind CSS** for layout and styling.
- Follow the design system (colors, spacing) defined in `tailwind.config.ts`.
- Use `clsx` and `tailwind-merge` for dynamic classes.

## 6. API Integration
- Use a central `axios` or `fetch` instance in `src/lib/api-client.ts`.
- Ensure the `tenant-id` is included in headers for all requests.
