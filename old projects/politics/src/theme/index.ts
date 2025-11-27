// src/theme/index.ts
// Custom Chakra theme for AAA-quality UI

import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const colors = {
  night: {
    900: "#0B0B0B",
    800: "#0F0F0F",
    700: "#111111",
    600: "#121212",
    500: "#141414", // used as app background
    400: "#1A1A1A", // used as card background
    300: "#202020",
    200: "#242424",
    100: "#2A2A2A",
  },
  ash_gray: {
    900: "#6E727B",
    800: "#30333A",
    700: "#9AA0A6",
    600: "#8B8F98",
    500: "#B0B5BD",
    400: "#C6CBD2",
  },
  picton_blue: {
    900: "#002C40",
    800: "#004B6A",
    700: "#007DB0",
    600: "#0098D6",
    500: "#00AEF3",
    400: "#4BC6FF",
    300: "#87D9FF",
  },
  gold: {
    900: "#7A5A00",
    800: "#8F6A00",
    700: "#B38600",
    600: "#D1A000",
    500: "#FFD700",
    400: "#FFE36B",
  },
  red_cmyk: {
    900: "#6B0012",
    800: "#8B0017",
    700: "#B3001E",
    600: "#D10024",
    500: "#FF0030",
    400: "#FF527B",
  },
};

const semanticTokens = {
  colors: {
    bg: { default: "night.500" },
    bgElevated: { default: "night.400" },
    text: { default: "whiteAlpha.900" },
    subtext: { default: "ash_gray.600" },
    border: { default: "ash_gray.800" },
    brand: { default: "picton_blue.500" },
    accent: { default: "gold.500" },
    danger: { default: "red_cmyk.500" },
  },
  radii: {
    card: "16px",
  },
  shadows: {
    card: "0 10px 30px rgba(0, 0, 0, 0.35)",
    glow: "0 0 0 2px rgba(0, 174, 243, 0.35)",
  },
};

const fonts = {
  heading: `var(--font-inter), Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  body: `var(--font-inter), Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  mono: `var(--font-jbmono), "JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
};

const styles = {
  global: {
    html: {
      scrollBehavior: "smooth",
    },
    body: {
      bg: "bg",
      color: "text",
    },
    "*::selection": {
      background: "picton_blue.700",
      color: "white",
    },
  },
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 600,
      borderRadius: "12px",
      _focusVisible: { boxShadow: "0 0 0 2px var(--chakra-colors-picton_blue-500)" },
    },
    sizes: {
      md: { px: 5, py: 3 },
      lg: { px: 6, py: 4, fontSize: "lg" },
    },
    variants: {
      primary: {
        bg: "picton_blue.500",
        color: "white",
        _hover: { bg: "picton_blue.600" },
        _active: { bg: "picton_blue.700" },
      },
      subtle: {
        bg: "night.500",
        color: "subtext",
        borderWidth: 1,
        borderColor: "border",
        _hover: { bg: "night.400", color: "white" },
        _active: { bg: "night.300" },
      },
      danger: {
        bg: "red_cmyk.500",
        color: "white",
        _hover: { bg: "red_cmyk.600" },
        _active: { bg: "red_cmyk.700" },
      },
      ghost: {
        color: "subtext",
        _hover: { bg: "night.500", color: "brand" },
      },
      outline: {
        color: "white",
        borderWidth: 1,
        borderColor: "border",
        _hover: { borderColor: "brand", color: "brand", bg: "night.500" },
      },
    },
    defaultProps: { variant: "subtle", size: "md" },
  },
  Heading: {
    baseStyle: {
      color: "white",
      letterSpacing: "-0.02em",
    },
  },
  Text: {
    baseStyle: {
      color: "subtext",
    },
  },
  Container: {
    baseStyle: {
      maxW: "container.xl",
    },
  },
};

const layerStyles = {
  card: {
    bg: "bgElevated",
    borderWidth: 1,
    borderColor: "border",
    borderRadius: "2xl",
    boxShadow: "card",
  },
  glass: {
    bg: "rgba(20,20,20,0.65)",
    backdropFilter: "blur(10px)",
    borderWidth: 1,
    borderColor: "border",
    borderRadius: "2xl",
  },
};

const textStyles = {
  kicker: {
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    fontSize: "xs",
    color: "ash_gray.600",
  },
};

export const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  fonts,
  styles,
  components,
  layerStyles,
  textStyles,
});

export default theme;
