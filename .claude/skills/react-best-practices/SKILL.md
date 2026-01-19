---
name: react-best-practices
description: |
  React and Next.js performance optimization guidelines from Vercel Engineering.
  Contains 45 rules across 8 categories, prioritized by impact.

  ALWAYS load when working with React/Next.js code:
  - Writing new React components or Next.js pages
  - Implementing data fetching (client or server-side)
  - Reviewing code for performance issues
  - Refactoring existing React/Next.js code
  - Optimizing bundle size or load times
  - Working with async operations and Promise handling
  - Implementing Suspense boundaries or streaming

  Keywords: React, Next.js, performance, optimization, bundle, async, Promise,
            waterfall, rerender, memo, useMemo, useCallback, Suspense, RSC,
            server components, client components, SWR, data fetching, cache

  Do NOT load for:
  - Non-React projects (Vue, Angular, Svelte, etc.)
  - Backend-only code without React integration
  - Pure CSS/styling work (use frontend-design-fundamentals)

  Works with other skills:
  - frontend-design-fundamentals: For UI/styling best practices
  - quality-code-check: For linting and type checking
---

# React Best Practices

Comprehensive performance optimization guide for React and Next.js applications.

---

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

---

## 1. Eliminating Waterfalls (CRITICAL)

Waterfalls are the #1 performance killer. Each sequential await adds full network latency.

### Promise.all() for Independent Operations

**Impact:** 2-10× improvement

When async operations have no interdependencies, execute them concurrently.

**❌ Incorrect (sequential execution, 3 round trips):**

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

**✅ Correct (parallel execution, 1 round trip):**

```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
```

### Strategic Suspense Boundaries

**Impact:** Faster initial paint

Instead of awaiting data before returning JSX, use Suspense to show wrapper UI faster.

**❌ Incorrect (wrapper blocked by data fetching):**

```tsx
async function Page() {
  const data = await fetchData() // Blocks entire page

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <DataDisplay data={data} />
      </div>
      <div>Footer</div>
    </div>
  )
}
```

**✅ Correct (wrapper shows immediately, data streams in):**

```tsx
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <Suspense fallback={<Skeleton />}>
          <DataDisplay />
        </Suspense>
      </div>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData() // Only blocks this component
  return <div>{data.content}</div>
}
```

**Alternative (share promise across components):**

```tsx
function Page() {
  const dataPromise = fetchData() // Start fetch immediately, don't await

  return (
    <div>
      <div>Sidebar</div>
      <Suspense fallback={<Skeleton />}>
        <DataDisplay dataPromise={dataPromise} />
        <DataSummary dataPromise={dataPromise} />
      </Suspense>
    </div>
  )
}

function DataDisplay({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // Unwraps the promise
  return <div>{data.content}</div>
}
```

---

## 2. Bundle Size Optimization (CRITICAL)

Reducing initial bundle size improves Time to Interactive and Largest Contentful Paint.

### Avoid Barrel File Imports

**Impact:** 200-800ms import cost, slow builds

Import directly from source files instead of barrel files.

**❌ Incorrect (imports entire library):**

```tsx
import { Check, X, Menu } from 'lucide-react'
// Loads 1,583 modules, takes ~2.8s extra in dev

import { Button, TextField } from '@mui/material'
// Loads 2,225 modules, takes ~4.2s extra in dev
```

**✅ Correct (imports only what you need):**

```tsx
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
```

**Alternative (Next.js 13.5+):**

```js
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@mui/material']
  }
}
```

**Commonly affected libraries:** `lucide-react`, `@mui/material`, `@mui/icons-material`, `@tabler/icons-react`, `react-icons`, `@headlessui/react`, `@radix-ui/react-*`, `lodash`, `date-fns`.

### Dynamic Imports for Heavy Components

**Impact:** Directly affects TTI and LCP

Use `next/dynamic` to lazy-load large components not needed on initial render.

**❌ Incorrect (Monaco bundles with main chunk ~300KB):**

```tsx
import { MonacoEditor } from './monaco-editor'

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**✅ Correct (Monaco loads on demand):**

```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

---

## 3. Server-Side Performance (HIGH)

Optimizing server-side rendering reduces response times.

### Per-Request Deduplication with React.cache()

**Impact:** Deduplicates within request

Use `React.cache()` for server-side request deduplication.

```typescript
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return await db.user.findUnique({
    where: { id: session.user.id }
  })
})
```

**Avoid inline objects as arguments** - use primitives for cache hits:

```typescript
// ❌ Always cache miss
const getUser = cache(async (params: { uid: number }) => {...})
getUser({ uid: 1 })
getUser({ uid: 1 }) // Cache miss, runs query again

// ✅ Cache hit
const getUser = cache(async (uid: number) => {...})
getUser(1)
getUser(1) // Cache hit, returns cached result
```

**Note:** Next.js `fetch` has automatic memoization. Use `React.cache()` for:
- Database queries (Prisma, Drizzle, etc.)
- Heavy computations
- Authentication checks
- File system operations

### Parallel Data Fetching with Component Composition

**Impact:** Eliminates server-side waterfalls

React Server Components execute sequentially within a tree. Restructure with composition to parallelize.

**❌ Incorrect (Sidebar waits for Page's fetch):**

```tsx
export default async function Page() {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}</div>
      <Sidebar />
    </div>
  )
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}
```

**✅ Correct (both fetch simultaneously):**

```tsx
async function Header() {
  const data = await fetchHeader()
  return <div>{data}</div>
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

export default function Page() {
  return (
    <div>
      <Header />
      <Sidebar />
    </div>
  )
}
```

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### Use SWR for Automatic Deduplication

**Impact:** Automatic deduplication and caching

**❌ Incorrect (no deduplication, each instance fetches):**

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
  }, [])
}
```

**✅ Correct (multiple instances share one request):**

```tsx
import useSWR from 'swr'

function UserList() {
  const { data: users } = useSWR('/api/users', fetcher)
}
```

---

## 5. Re-render Optimization (MEDIUM)

Reducing unnecessary re-renders minimizes wasted computation.

### Extract to Memoized Components

**Impact:** Enables early returns

**❌ Incorrect (computes avatar even when loading):**

```tsx
function Profile({ user, loading }: Props) {
  const avatar = useMemo(() => {
    const id = computeAvatarId(user)
    return <Avatar id={id} />
  }, [user])

  if (loading) return <Skeleton />
  return <div>{avatar}</div>
}
```

**✅ Correct (skips computation when loading):**

```tsx
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }: Props) {
  if (loading) return <Skeleton />
  return (
    <div>
      <UserAvatar user={user} />
    </div>
  )
}
```

**Note:** If React Compiler is enabled, manual memoization is not necessary.

### Subscribe to Derived State

**Impact:** Reduces re-render frequency

**❌ Incorrect (re-renders on every pixel change):**

```tsx
function Sidebar() {
  const width = useWindowWidth() // updates continuously
  const isMobile = width < 768
  return <nav className={isMobile ? 'mobile' : 'desktop'} />
}
```

**✅ Correct (re-renders only when boolean changes):**

```tsx
function Sidebar() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  return <nav className={isMobile ? 'mobile' : 'desktop'} />
}
```

---

## 6. Rendering Performance (MEDIUM)

### Use Explicit Conditional Rendering

**Impact:** Prevents rendering 0 or NaN

**❌ Incorrect (renders "0" when count is 0):**

```tsx
function Badge({ count }: { count: number }) {
  return (
    <div>
      {count && <span className="badge">{count}</span>}
    </div>
  )
}
// When count = 0, renders: <div>0</div>
```

**✅ Correct (renders nothing when count is 0):**

```tsx
function Badge({ count }: { count: number }) {
  return (
    <div>
      {count > 0 ? <span className="badge">{count}</span> : null}
    </div>
  )
}
```

---

## 7. JavaScript Performance (LOW-MEDIUM)

Micro-optimizations for hot paths.

### Build Index Maps for Repeated Lookups

**Impact:** 1M ops → 2K ops

**❌ Incorrect (O(n) per lookup):**

```typescript
function processOrders(orders: Order[], users: User[]) {
  return orders.map(order => ({
    ...order,
    user: users.find(u => u.id === order.userId)
  }))
}
```

**✅ Correct (O(1) per lookup):**

```typescript
function processOrders(orders: Order[], users: User[]) {
  const userById = new Map(users.map(u => [u.id, u]))

  return orders.map(order => ({
    ...order,
    user: userById.get(order.userId)
  }))
}
```

---

## Quick Reference Checklist

### CRITICAL Priority
- [ ] Use `Promise.all()` for independent async operations
- [ ] Avoid barrel file imports (or use `optimizePackageImports`)
- [ ] Use `next/dynamic` for heavy components
- [ ] Defer third-party scripts (analytics, logging)

### HIGH Priority
- [ ] Use `React.cache()` for server-side deduplication
- [ ] Structure RSC for parallel data fetching
- [ ] Use Suspense boundaries strategically

### MEDIUM Priority
- [ ] Use SWR for client-side data fetching
- [ ] Extract expensive work to memoized components
- [ ] Subscribe to derived booleans, not raw values
- [ ] Use explicit ternary for conditionals with numbers

### LOW Priority
- [ ] Build Maps for repeated lookups
- [ ] Cache property access in loops
- [ ] Use Set/Map for O(1) lookups

---

## References

- [Vercel React Best Practices Repository](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
- [React.cache documentation](https://react.dev/reference/react/cache)
- [SWR documentation](https://swr.vercel.app)
- [Next.js Package Imports Optimization](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [React Compiler](https://react.dev/learn/react-compiler)
