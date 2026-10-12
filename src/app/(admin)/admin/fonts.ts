import { Bricolage_Grotesque, Outfit, Space_Mono } from "next/font/google";

export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

export const bodyFont = Outfit({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});

export const monoFont = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const adminFontClassName = `${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} admin-fonts`;
