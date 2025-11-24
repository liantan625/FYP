# Internationalization (i18n) Setup

## What's Been Done

### 1. Dependencies Installed
- `i18next` - Core i18n framework
- `react-i18next` - React Native bindings

### 2. Files Created
- `i18n/config.ts` - i18n configuration
- `i18n/locales/en.json` - English translations
- `i18n/locales/ms.json` - Malay translations (default)

### 3. Files Updated

#### `context/settings-context.tsx`
- Added language state management
- Added `setLanguage()` function
- Language preference saved to AsyncStorage
- Integrated with i18next

#### `app/(tabs)/profile.tsx`
- Connected language picker to settings context
- Language changes now persist and apply app-wide

#### `app/(tabs)/home.tsx`
- Replaced hardcoded Malay text with translation keys
- Uses `useTranslation()` hook
- All text dynamically updates based on selected language

#### `app/_layout.tsx`
- Imported i18n config to initialize on app start

## How It Works

1. **User selects language in Profile tab**
2. **Language is saved to AsyncStorage**
3. **i18next changes language immediately**
4. **All screens using `t()` function update automatically**

## Current Language Support

✅ **Malay (ms)** - Default, fully implemented  
✅ **English (en)** - Fully implemented  
⏳ **Chinese (zh)** - Picker ready, translations pending  
⏳ **Tamil (ta)** - Picker ready, translations pending

## Testing

1. Open the app
2. Go to Profile tab
3. Change language from dropdown
4. Navigate to Home tab
5. All text should update to selected language

## Adding More Translations

To add translations for other screens:

1. Add keys to `i18n/locales/en.json` and `i18n/locales/ms.json`
2. In your component:
   ```typescript
   import { useTranslation } from 'react-i18next';
   
   const { t } = useTranslation();
   
   <Text>{t('your.translation.key')}</Text>
   ```

## Example Translation Keys

```json
{
  "home": {
    "welcome": "Welcome, {{name}}!",
    "savingsGoal": "🎯 Savings Goal",
    "progress": "📈 Progress: {{percentage}}%"
  }
}
```

## Next Steps

To complete internationalization:
1. Add Chinese translations to `i18n/locales/zh.json`
2. Add Tamil translations to `i18n/locales/ta.json`
3. Translate other screens (transactions, analysis, category, etc.)
4. Add profile screen translations
