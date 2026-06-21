# CONTRIBUTING

## Getting Started

1. **Fork and Clone**
```bash
git clone <your-fork>
cd member-mgmt-system
```

2. **Setup Development Environment**
```bash
make setup
cp .env.example .env.local
```

3. **Start Services**
```bash
make docker-up
```

## Development Workflow

### Backend Development

1. **Create a new feature branch**
```bash
git checkout -b feature/my-feature
```

2. **Make changes to Go code**
- Follow existing patterns in `internal/handlers`, `internal/service`, `internal/repository`
- Add tests in `backend/tests/`

3. **Run tests**
```bash
make backend-test
```

4. **Format code**
```bash
make format
```

### Frontend Development

1. **Create a new feature branch**
```bash
git checkout -b feature/my-feature
```

2. **Make changes to React/TypeScript code**
- Components go in `frontend/components/`
- Pages go in `frontend/app/`
- Hooks go in `frontend/hooks/`

3. **Run linter**
```bash
cd frontend && npm run lint
```

4. **Format code**
```bash
make format
```

5. **Type check**
```bash
cd frontend && npm run type-check
```

## Code Standards

### Backend (Go)

- Use meaningful variable and function names
- Write comments for exported functions
- Follow Go idioms: `if err != nil` patterns
- Use `fmt.Sprintf` for string formatting
- Organize imports: standard library, then third-party, then local

Example:
```go
func (h *MemberHandler) GetMember(c *gin.Context) {
    // Get ID from URL parameter
    id := c.Param("id")
    
    // Fetch member
    member, err := h.memberService.GetMemberByID(id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
        return
    }
    
    c.JSON(http.StatusOK, member)
}
```

### Frontend (TypeScript/React)

- Use TypeScript for type safety
- Create interfaces for all data types
- Use React hooks instead of class components
- Extract reusable logic into custom hooks
- Use React Query for server state
- Use Zustand for client state

Example:
```typescript
interface MemberCardProps {
  member: Member;
  onEdit: (id: string) => void;
}

export function MemberCard({ member, onEdit }: MemberCardProps) {
  return (
    <div className="p-4 border rounded">
      <h3>{member.firstName} {member.lastName}</h3>
      <p>{member.email}</p>
      <button onClick={() => onEdit(member.id)}>Edit</button>
    </div>
  );
}
```

## Commit Messages

Follow conventional commits:

```
feat: add member search functionality
fix: resolve member update API error
docs: update API documentation
test: add member service tests
style: format code with prettier
chore: update dependencies
```

## Pull Request Process

1. **Create PR with description**
   - What does it do?
   - Why is it needed?
   - How to test it?

2. **Request review**
   - At least one approval required

3. **Run all checks**
   - Tests pass
   - No linting errors
   - No TypeScript errors

4. **Merge to main**
   - Delete feature branch after merge

## Testing

### Backend Tests

```bash
cd backend
go test ./... -v
go test ./... -cover
```

### Frontend Tests (TODO)

```bash
cd frontend
npm test
npm run test:coverage
```

## Database Migrations

When adding new tables:

1. **Create migration file**
```bash
# migrations/XXX_description.sql
```

2. **Update models**
```go
// internal/models/models.go
type NewModel struct { ... }
```

3. **Update migration runner**
```go
// migrations/migrate.go
db.AutoMigrate(&models.NewModel{})
```

## Documentation

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for system changes
- Update API.md for API changes
- Add comments to complex logic

## Questions?

Open an issue or start a discussion in the repository.
