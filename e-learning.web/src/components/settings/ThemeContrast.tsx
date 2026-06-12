import { ReactNode, useMemo } from 'react';
// @mui
import { CssBaseline } from '@mui/material';
import { alpha, ThemeOptions, ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
// hooks
import useSettings from '../../hooks/useSettings';
//
import componentsOverride from '../../theme/overrides';

// ----------------------------------------------------------------------

type Props = {
  children: ReactNode;
};

export default function ThemeContrast({ children }: Props) {
  const defaultTheme = useTheme();

  const { themeContrast } = useSettings();

  const isLight = defaultTheme.palette.mode === 'light';

  const shadowColor = isLight ? defaultTheme.palette.grey[500] : defaultTheme.palette.common.black;

  const styles = {
    bgDefault: defaultTheme.palette.background.default,
    bgMedium: isLight ? '#f8fafc' : '#151e2c',
    bgBold: isLight ? '#f1f5f9' : '#0f172a',
    bgUltra: isLight ? '#e2e8f0' : '#020617',

    cardDefault: defaultTheme.components?.MuiCard?.styleOverrides?.root,
    cardMedium: {
      zIndex: 0,
      position: 'relative',
      borderRadius: Number(defaultTheme.shape.borderRadius) * 2,
      boxShadow: `0 0 1px 0 ${alpha(shadowColor, 0.4)}, 0 1px 3px -1px ${alpha(
        shadowColor,
        0.18
      )}`,
    },
    cardBold: {
      zIndex: 0,
      position: 'relative',
      borderRadius: Number(defaultTheme.shape.borderRadius) * 2,
      boxShadow: `0 0 1px 0 ${alpha(shadowColor, 0.48)}, 0 2px 4px -1px ${alpha(
        shadowColor,
        0.24
      )}`,
    },
    cardUltra: {
      zIndex: 0,
      position: 'relative',
      borderRadius: Number(defaultTheme.shape.borderRadius) * 2,
      boxShadow: `0 0 2px 0 ${alpha(shadowColor, 0.6)}, 0 4px 8px -2px ${alpha(
        shadowColor,
        0.32
      )}`,
      border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
    },
  } as const;

  const themeOptions: ThemeOptions = useMemo(
    () => ({
      ...defaultTheme,
      palette: {
        ...defaultTheme.palette,
        background: {
          ...defaultTheme.palette.background,
          default:
            themeContrast === 'ultra'
              ? styles.bgUltra
              : themeContrast === 'bold'
              ? styles.bgBold
              : themeContrast === 'medium'
              ? styles.bgMedium
              : styles.bgDefault,
        },
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root:
              themeContrast === 'ultra'
                ? styles.cardUltra
                : themeContrast === 'bold'
                ? styles.cardBold
                : themeContrast === 'medium'
                ? styles.cardMedium
                : styles.cardDefault,
          },
        },
      },
    }),

    [
      defaultTheme,
      themeContrast,
      styles.bgUltra,
      styles.bgBold,
      styles.bgMedium,
      styles.bgDefault,
      styles.cardUltra,
      styles.cardBold,
      styles.cardMedium,
      styles.cardDefault,
    ]
  );

  const theme = createTheme(themeOptions);

  theme.components = {
    ...componentsOverride(theme),
    MuiCard: themeOptions.components?.MuiCard,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
