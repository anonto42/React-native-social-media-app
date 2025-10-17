# React Native Expo Best Practices

This document outlines the best practices followed in this project to ensure maintainability, scalability, and easy migration to React Native CLI.

## 1. Project Structure

### ✅ Organized Directory Structure
```
app/          - Routes and screens (file-based routing)
contexts/     - React Context providers
lib/          - Utilities, configurations, and clients
components/   - Reusable UI components
hooks/        - Custom React hooks
assets/       - Static files (images, fonts)
types/        - TypeScript type definitions
```

**Why:** Clear separation of concerns makes code easier to maintain and test.

### ✅ Feature-Based Organization
Each feature (auth, friends, posts) is self-contained with its own:
- UI components
- Data fetching logic
- State management
- Type definitions

**Why:** Makes features easier to refactor, test, or remove.

## 2. TypeScript Usage

### ✅ Full TypeScript Implementation
```typescript
interface Post {
  id: string;
  content: string;
  media_url: string | null;
  // ... other fields
}
```

**Why:** Catches errors at compile-time, improves IDE support, makes refactoring safer.

### ✅ Type Definitions for API Responses
All Supabase responses are properly typed.

**Why:** Prevents runtime errors from unexpected data shapes.

## 3. Navigation

### ✅ File-Based Routing with expo-router
```
app/(tabs)/home.tsx    → /home
app/(auth)/login.tsx   → /login
app/user/[id].tsx      → /user/:id
```

**Why:** Intuitive, easy to understand, automatic route generation.

**Migration Note:** Can be converted to React Navigation with minimal changes.

## 4. State Management

### ✅ Context API for Global State
```typescript
const { user, session, signIn, signOut } = useAuth();
```

**Why:** Built-in, no extra dependencies, works in React Native CLI.

### ✅ Local State for Component-Specific Data
```typescript
const [posts, setPosts] = useState<Post[]>([]);
```

**Why:** Keeps state close to where it's used, easier to debug.

## 5. Data Fetching

### ✅ Async/Await Pattern
```typescript
const loadPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*');

    if (error) throw error;
    setPosts(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Why:** Clean, readable async code with proper error handling.

### ✅ Error Handling
All API calls have try-catch blocks and error states.

**Why:** Prevents app crashes, provides user feedback.

## 6. Styling

### ✅ StyleSheet API
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
```

**Why:** Optimized for React Native, works everywhere, type-safe.

### ✅ Consistent Design System
- Color palette defined
- Spacing system (8px grid)
- Typography hierarchy
- Reusable style patterns

**Why:** Consistent UI, easier to make global changes.

## 7. Component Patterns

### ✅ Functional Components with Hooks
```typescript
export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadPosts();
  }, []);

  return <View>...</View>;
}
```

**Why:** Modern React pattern, better performance, cleaner code.

### ✅ Custom Hooks for Reusable Logic
```typescript
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('...');
  return context;
};
```

**Why:** Encapsulates logic, promotes reusability.

## 8. Performance

### ✅ FlatList for Long Lists
```typescript
<FlatList
  data={posts}
  renderItem={renderPost}
  keyExtractor={(item) => item.id}
/>
```

**Why:** Virtualized rendering, handles thousands of items efficiently.

### ✅ Optimistic UI Updates
Update UI immediately, sync with server later.

**Why:** Feels faster, better user experience.

### ✅ Image Optimization
```typescript
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
/>
```

**Why:** Lazy loading, automatic caching.

## 9. Database Design

### ✅ Normalized Schema
- No data duplication
- Proper foreign key relationships
- Indexes on frequently queried columns

**Why:** Efficient queries, easier to maintain.

### ✅ Row Level Security (RLS)
Every table has RLS enabled with appropriate policies.

**Why:** Security by default, prevents unauthorized access.

### ✅ Database Functions for Complex Operations
```sql
CREATE FUNCTION increment_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
```

**Why:** Atomic operations, prevents race conditions.

## 10. Authentication

### ✅ Centralized Auth Logic
All auth operations go through AuthContext.

**Why:** Single source of truth, easier to debug.

### ✅ Secure Session Management
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state changes
});
```

**Why:** Automatic token refresh, secure session handling.

### ✅ Protected Routes
```typescript
if (!session) {
  router.replace('/(auth)/login');
}
```

**Why:** Ensures authenticated-only access.

## 11. Error Handling

### ✅ User-Friendly Error Messages
```typescript
setError(err.message || 'Failed to sign in');
```

**Why:** Users understand what went wrong.

### ✅ Error States in UI
```typescript
{error && (
  <Text style={styles.error}>{error}</Text>
)}
```

**Why:** Visible feedback, better UX.

## 12. Code Quality

### ✅ Consistent Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case or PascalCase

**Why:** Easy to navigate, professional codebase.

### ✅ TypeScript Strict Mode
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

**Why:** Catches more potential errors.

### ✅ No Console Errors in Production
All console.logs should be removed or conditional.

**Why:** Clean console, better debugging.

## 13. Testing Considerations

### ✅ Testable Component Structure
- Pure functions where possible
- Separated business logic from UI
- Minimal dependencies

**Why:** Makes unit testing easier.

### ✅ Mock-Friendly API Calls
All API calls go through a client abstraction.

**Why:** Easy to mock in tests.

## 14. Environment Configuration

### ✅ Environment Variables
```typescript
process.env.EXPO_PUBLIC_SUPABASE_URL
```

**Why:** Separates config from code, supports multiple environments.

### ✅ Type-Safe Environment Access
Create types for environment variables.

**Why:** Prevents typos, better IDE support.

## 15. Migration-Ready Code

### ✅ Minimal Expo-Specific Code
- Use standard React Native components
- Avoid Expo-only APIs when possible
- Document Expo dependencies

**Why:** Easier to migrate to React Native CLI.

### ✅ Abstraction Layers
```typescript
// lib/supabase.ts
export const supabase = createClient(...);
```

**Why:** Easy to swap implementations.

## 16. User Experience

### ✅ Loading States
```typescript
if (loading) return <ActivityIndicator />;
```

**Why:** Users know something is happening.

### ✅ Empty States
```typescript
<ListEmptyComponent>
  <Text>No posts yet</Text>
</ListEmptyComponent>
```

**Why:** Better than blank screens.

### ✅ Pull-to-Refresh
```typescript
<RefreshControl
  refreshing={refreshing}
  onRefresh={onRefresh}
/>
```

**Why:** Standard mobile pattern, feels native.

## 17. Security Best Practices

### ✅ No Secrets in Code
All sensitive data in environment variables.

**Why:** Prevents credential leaks.

### ✅ Input Validation
Validate all user inputs before sending to server.

**Why:** Prevents invalid data, security vulnerabilities.

### ✅ HTTPS Only
All API calls use HTTPS.

**Why:** Encrypted communication.

## 18. Accessibility

### ✅ Semantic Component Usage
Use appropriate components for their purpose.

**Why:** Better screen reader support.

### ✅ Touch Targets
All touchable elements are at least 44x44 pixels.

**Why:** Easier to tap, better UX.

## 19. Documentation

### ✅ Code Comments for Complex Logic
```typescript
// Prevent race conditions during concurrent likes
await supabase.rpc('increment_likes', { post_id });
```

**Why:** Helps future developers (including yourself).

### ✅ README Files
Project overview, setup instructions, migration guide.

**Why:** New team members can get started quickly.

## 20. Version Control

### ✅ Meaningful Commit Messages
"Add friend request functionality" instead of "update"

**Why:** Clear history, easier to track changes.

### ✅ .gitignore Configuration
Ignore node_modules, .env, build artifacts.

**Why:** Keeps repository clean.

---

Following these best practices ensures:
- ✅ Maintainable codebase
- ✅ Easy to onboard new developers
- ✅ Smooth migration to React Native CLI
- ✅ Scalable architecture
- ✅ Professional code quality
- ✅ Better user experience
- ✅ Secure application
