# Migration Guide: Expo to React Native CLI

This guide explains the best practices followed in this project to ensure a smooth migration from Expo to React Native CLI when you're ready for more stability and customization.

## Best Practices Implemented

### 1. **Modular Architecture**
- Code is organized into clear directories: `app/`, `contexts/`, `lib/`, `components/`
- Each feature is self-contained and follows single responsibility principle
- Easy to refactor and reorganize during migration

### 2. **Platform-Agnostic Code**
- No heavy reliance on Expo-specific APIs
- Uses standard React Native components
- Navigation uses `expo-router` which can be replaced with React Navigation
- Database client (`@supabase/supabase-js`) works identically in both environments

### 3. **Minimal Expo Dependencies**
- Core Expo packages used are standard and have alternatives:
  - `expo-router` → React Navigation
  - `expo-constants` → react-native-config
  - `expo-status-bar` → Built-in StatusBar
- Icon library (`lucide-react-native`) works in both Expo and React Native CLI

### 4. **TypeScript Throughout**
- Full TypeScript implementation makes refactoring safer
- Type definitions will work in React Native CLI
- Path aliases configured for easy import management

### 5. **External Service Integration**
- Authentication via Supabase (platform-agnostic)
- Database operations via Supabase client (works everywhere)
- No Expo-managed backend services used

### 6. **Styling Approach**
- Uses StyleSheet API (standard React Native)
- No custom styling libraries or Expo-specific styling
- Easy to migrate styles to any React Native project

## Migration Steps (When Ready)

### 1. Eject from Expo
```bash
npx expo prebuild
```

This generates `ios/` and `android/` directories with native code.

### 2. Replace expo-router with React Navigation
```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
```

Update navigation structure:
- Convert `app/(tabs)/_layout.tsx` to bottom tab navigator
- Convert `app/(auth)/_layout.tsx` to stack navigator
- Replace file-based routing with component-based routing

### 3. Replace Expo Constants
```bash
npm install react-native-config
```

Update environment variable usage:
- Replace `Constants.expoConfig?.extra` with `Config`
- Move environment variables to `.env`

### 4. Update Dependencies
- Remove Expo-specific packages
- Install React Native CLI equivalents
- Update `package.json` scripts

### 5. Test Native Features
- Test authentication flow
- Verify database connections
- Check navigation behavior
- Test on real devices

## Directory Structure
```
project/
├── app/                    # Screens (can convert to components)
│   ├── (auth)/            # Auth screens
│   ├── (tabs)/            # Tab screens
│   └── user/              # User profile screen
├── contexts/              # React contexts (stays same)
├── lib/                   # Utilities and clients (stays same)
├── components/            # Reusable components (stays same)
├── assets/                # Images and fonts (stays same)
└── package.json
```

## Key Files to Modify During Migration

1. **Navigation**: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
2. **Environment**: `lib/supabase.ts`
3. **Entry Point**: May need to create custom `index.js`
4. **Configuration**: `app.json` → `app.config.js`

## Features Ready for Migration

✅ Authentication system (Supabase)
✅ Database operations (Supabase)
✅ User profiles
✅ Posts and Reels
✅ Friends system
✅ Chat/Messages
✅ TypeScript configuration
✅ Component organization

## Testing Before Migration

Before migrating, ensure:
1. All features work in Expo
2. TypeScript compilation passes
3. No Expo-specific code in business logic
4. Environment variables are properly configured
5. Build completes successfully

## Additional Resources

- [React Native CLI Documentation](https://reactnative.dev/docs/environment-setup)
- [Expo to React Native CLI Guide](https://docs.expo.dev/bare/hello-world/)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/quickstarts/react-native)

## Notes

- This project uses **file-based routing** (expo-router) which needs manual conversion
- All business logic is **decoupled from routing** for easy migration
- **No native modules** are currently required, making migration simpler
- The **database schema** is independent and won't need changes
- **Authentication flow** will work the same way after migration
