import { useSettings } from '@/context/settings-context';
import { FontSizes } from '@/constants/theme';

export function useScaledFontSize() {
  const { fontScale } = useSettings();

  return {
    fontScale,
    scaled: (size: number) => size * fontScale,
    // Pre-defined scaled sizes from theme
    small: FontSizes.small * fontScale,
    body: FontSizes.body * fontScale,
    medium: FontSizes.medium * fontScale,
    large: FontSizes.large * fontScale,
    xlarge: FontSizes.xlarge * fontScale,
    title: FontSizes.title * fontScale,
    heading: FontSizes.heading * fontScale,
  };
}
