# Settings Migration Instructions

After deploying the new settings feature, run this migration to add default settings to existing users:

## Option 1: Simple Node.js Script (Recommended)

```bash
cd server
node src/migrations/add-default-settings.mjs
```

## Option 2: TypeScript with ts-node

```bash
cd server
set TS_NODE_EXPERIMENTAL_RESOLVER=true&& npx ts-node --esm src/migrations/add-default-settings.ts
```

## Option 3: Import in existing migration script

```typescript
import { addDefaultSettings } from './migrations/add-default-settings.js';

// Add to your migration runner
await addDefaultSettings();
```

## What this migration does:

- Adds `theme: "light"` to users without theme setting
- Adds `density: "comfortable"` to users without density setting  
- Adds default notification preferences to users without notifications
- Only updates users that are missing these fields (safe to run multiple times)

## Verification:

After running, check a few user documents in MongoDB to ensure they have:
- `theme` field
- `density` field
- `notifications` object with email, projectUpdates, taskReminders, teamInvites

## New Features Enabled:

✅ **Theme Settings** - Light/Dark/System theme that persists across sessions
✅ **Density Settings** - Compact/Comfortable spacing that affects entire app
✅ **Notification Preferences** - Per-user notification toggles saved to database
✅ **Backend Persistence** - All settings survive logout/login and page refresh
✅ **Clean UI** - Removed all account/security placeholder sections
✅ **Modern Design** - Clean SaaS-style settings interface

All settings are now fully functional with proper MongoDB persistence!