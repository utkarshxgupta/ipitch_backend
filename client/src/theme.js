import { extendTheme } from "@chakra-ui/react";

const customTheme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: true,
  },
  colors: {
    brand: {
      50: "#fff5eb",
      100: "#fee1c7",
      200: "#fdd3a3",
      300: "#fcb57f",
      400: "#F06321", // main brand color
      500: "#d9521e",
      600: "#b8441a",
      700: "#973418",
      800: "#762312",
      900: "#52190e",
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "#121212" : "#ffffff",
        color: props.colorMode === "dark" ? "#e2e8f0" : "#1a202c",
      },
    }),
  },
  fonts: {
    body: '"Segoe UI", sans-serif',
    heading: '"Segoe UI", serif',
    mono: "SFMono-Regular, monospace",
  },
  // components: {
  //   Button: {
  //     baseStyle: {
  //       _hover: {
  //         bg: "brand.500",
  //       },
  //     },
  //     variants: {
  //       solid: (props) => ({
  //         bg: props.colorMode === "dark" ? "brand.400" : "brand.500",
  //         color: "white",
  //         _hover: {
  //           bg: props.colorMode === "dark" ? "brand.300" : "brand.600",
  //         },
  //       }),
  //     },
  //   },
  //   Link: {
  //     baseStyle: {
  //       color: "brand.500",
  //       _hover: {
  //         textDecoration: "underline",
  //         color: "brand.600",
  //       },
  //     },
  //   },
  // },
});

export default customTheme;
