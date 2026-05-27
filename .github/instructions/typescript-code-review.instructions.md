---
name: TypeScript/JavaScript Code Review
description: Use when: analyzing TypeScript or JavaScript code for security, performance, and quality issues
applyTo: "**/*.{ts,tsx,js,jsx}"
---

# TypeScript/JavaScript Code Review Guidelines

When reviewing TypeScript/JavaScript code, focus on these language-specific issues:

## Security Issues

- **Unsafe string concatenation** in SQL/shell commands → use parameterized queries or escape properly
- **eval() usage** → always flag, find alternative (Function constructor, vm module for sandboxing)
- **Missing type annotations** that could hide logic errors
- **Unvalidated user input** passed to APIs, queries, or DOM
- **Prototype pollution** in object merging (use Object.create(null), Object.assign carefully)
- **Dependency vulnerabilities** — check for known exploits in npm packages
- **Exposed secrets** in environment handling (using process.env carelessly)

## Performance Issues in Node.js/TypeScript

- **Synchronous I/O** in async contexts (fs.readFileSync, blocking calls)
- **Unbound event listeners** causing memory leaks
- **Missing connection pooling** in database clients
- **Synchronous JSON.parse/stringify** on large payloads
- **Inefficient array operations** (filter + map that could combine, multiple iterations)
- **Unbounded arrays/objects** growing without cleanup (memory leaks)
- **Regex DoS** (catastrophic backtracking in regex patterns)

## TypeScript-Specific Issues

- **any type usage** without justification → use unknown or proper types
- **Non-null assertions (!)** that bypass type safety
- **Loose module boundaries** → enforce internal vs. public APIs
- **Untyped third-party imports** → use @types packages or d.ts files
- **Implicit any** from untyped function parameters

## Clean Code Violations

- **Naming**: Variables named `data`, `temp`, `result` without context
- **Functions**: Mixing business logic with side effects
- **Complexity**: Functions > 20 lines doing multiple things
- **Error handling**: Catching exceptions silently without logging
- **Testing**: Code paths impossible to test due to tight coupling

## Async/Promise Patterns

- **Unhandled promise rejections** → always `.catch()` or use try/catch with await
- **Callback hell** → suggest Promise chains or async/await
- **Missing await** on async operations
- **Promise.all() misuse** → using when sequential execution needed
- **Forgotten Promise.finally()** for cleanup

## Common Refactoring Examples

```typescript
// ❌ Security: SQL injection risk
db.query(`SELECT * FROM users WHERE id = ${userId}`)

// ✅ Refactored
db.query('SELECT * FROM users WHERE id = ?', [userId])
```

```typescript
// ❌ Performance: Multiple iterations
data.filter(x => x.active).map(x => x.name).sort()

// ✅ Refactored
data.reduce((acc, x) => {
  if (x.active) acc.push(x.name)
  return acc
}, []).sort()
```

```typescript
// ❌ Memory leak: listener never removed
emitter.on('data', handler)

// ✅ Refactored
const listener = handler
emitter.on('data', listener)
// Later: emitter.off('data', listener)
```
