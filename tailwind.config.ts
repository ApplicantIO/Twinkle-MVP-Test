import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F0F0F",
        surface: "#1A1A1A",
        "text-primary": "#FFFFFF",
        "text-secondary": "#CCCCCC",
        accent: "#947CF2",
        error: "#FF4D4D",
      },
    },
  },
  plugins: [],
};
export default config;
