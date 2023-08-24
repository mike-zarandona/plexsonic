import "./globals.css";
import { Rubik } from "next/font/google";

const bodyFont = Rubik({ subsets: ["latin"] });

export const metadata = {
  title: "PlexSonic",
  description:
    "Lightweight, modern fullstack app for beautifully displaying Plex Now Playing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={bodyFont.className}>{children}</body>
    </html>
  );
}
