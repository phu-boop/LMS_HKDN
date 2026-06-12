import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface ChartPaletteOptions {
    violet: string[];
    blue: string[];
    green: string[];
    yellow: string[];
    red: string[];
  }

  interface GradientsPaletteOptions {
    primary: string;
    info: string;
    success: string;
    warning: string;
    error: string;
  }

  interface TypeBackground {
    neutral: string;
  }

  interface PaletteColor {
    lighter: string;
    light?: string;
    main: string;
    dark?: string;
    darker: string;
  }

  interface SimplePaletteColorOptions {
    lighter: string;
    light?: string;
    main: string;
    dark?: string;
    darker: string;
  }

  interface Palette {
    gradients: GradientsPaletteOptions;
    chart: ChartPaletteOptions;
  }

  interface PaletteOptions {
    gradients: GradientsPaletteOptions;
    chart: ChartPaletteOptions;
  }
}
