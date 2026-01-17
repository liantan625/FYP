/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Standard app colors for consistent branding
export const AppColors = {
  // Primary green - use for main actions, headers, and accents
  primary: '#48BB78',
  primaryLight: '#68D391',
  primaryDark: '#38A169',

  // Success/positive indicators
  success: '#48BB78',
  successLight: '#C6F6D5',

  // Error/danger
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Warning
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const FontSizes = {
  // Base font sizes (at 1.0 scale) - REFINED for Layout Stability & Senior Accessibility
  small: 14,     // Minimum for senior legibility (was 13)
  body: 16,      // Minimum for reading (was 16)
  medium: 18,    // Card Titles
  large: 22,     // Section Headers
  xlarge: 26,    // Key Stats
  title: 32,     // Screen Titles (Increased for impact)
  heading: 38,   // Big Money Display
};

export const FontScaleOptions = {
  small: { label: 'Kecil', value: 1.0 },       // Bump base to 1.0 since base sizes are larger
  medium: { label: 'Sederhana', value: 1.15 }, // Increase medium slightly
  large: { label: 'Besar', value: 1.4 },       // Large is now significantly larger for visual impairment
};
