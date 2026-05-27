---
name: NestJS Code Review
description: Use when: reviewing NestJS controllers, services, and modules for security, performance, and architectural issues
applyTo: "src/**/*.{controller,service,module}.ts"
---

# NestJS Code Review Guidelines

When reviewing NestJS code, check for framework-specific issues:

## Controller Issues

- **Missing validation pipes** → @Pipe(ValidationPipe) on all DTO inputs
- **Unvalidated path/query parameters** → use decorators not string parsing
- **Missing error handling** → use filter/exception handlers, not try/catch in controllers
- **Auth guards missing** → @UseGuards(AuthGuard) on protected routes
- **Direct database calls** in controllers → should delegate to services
- **Non-deterministic responses** → same input should produce same response

## Service Issues

- **Heavy lifting in service constructors** → defer to methods
- **Uninjected dependencies** → use @Inject(), don't hardcode require()
- **Circular dependencies** → refactor into separate services
- **Missing transactional boundaries** → group related DB ops
- **Incomplete error propagation** → catch, transform, and rethrow appropriately

## Security Issues in NestJS

- **Missing CSRF protection** → @UseGuards(CsrfGuard) on state-changing endpoints
- **Insecure password handling** → use bcrypt/argon2, never plain text
- **Exposed error details** → catch and sanitize error messages in responses
- **Missing rate limiting** → @Throttle() on public endpoints
- **Unvalidated file uploads** → check size, type, scan for malware
- **JWT secret hardcoded** → use environment variables
- **Missing CORS policy** → configure strictly, don't allow all origins

## Performance Issues in NestJS

- **N+1 queries** in service methods → use JOIN, not separate queries per item
- **Missing database indexing** → FK and filter columns should be indexed
- **Unoptimized eager loading** → use .select() and .relations() carefully
- **Synchronous operations in async context** → remove unnecessary await chains
- **Missing pagination** on list endpoints → default limits and offsets
- **Unoptimized typeORM queries** → check generated SQL

## Module & Injection Issues

- **Global modules without clear need** → prefer scoped exports
- **Service not exported** but used elsewhere → proper module exports
- **Duplicate providers** across modules → consolidate in shared module
- **Missing @Global() on utilities** that should be singleton

## Common NestJS Refactoring Examples

```typescript
// ❌ Missing validation
@Post('users')
createUser(body: any) { }

// ✅ Refactored
@Post('users')
@UsePipes(ValidationPipe)
createUser(@Body() createUserDto: CreateUserDto) { }
```

```typescript
// ❌ N+1 query
async getUsers() {
  const users = await this.userRepo.find()
  return users.map(u => ({ ...u, posts: this.postRepo.find({ userId: u.id }) }))
}

// ✅ Refactored
async getUsers() {
  return this.userRepo.find({ relations: ['posts'] })
}
```

```typescript
// ❌ Service constructor too heavy
constructor(private db: Database) {
  this.cache = new Map()
  this.initializeData() // Blocking initialization
}

// ✅ Refactored
constructor(private db: Database) { }

async onModuleInit() {
  await this.initializeData() // Non-blocking
}
```

```typescript
// ❌ Missing guard
@Get('admin/data')
getAdminData() { }

// ✅ Refactored
@Get('admin/data')
@UseGuards(AuthGuard, AdminGuard)
getAdminData() { }
```

## Testing Implications

- **Tight coupling to framework** makes unit testing hard → keep logic in services, not decorators
- **Missing spy/mock setup** → use jest.spyOn() for dependencies
- **Database in tests** → use test database or factories, not mocks
