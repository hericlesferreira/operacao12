import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        coal: "#171717",
        graphite: "#333333",
        paper: "#F7F5EF",
        linen: "#EFEAE1",
        lime: "#B8F23A",
        command: "#2563EB",
        cocoa: "#9E7F60"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(23, 23, 23, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
