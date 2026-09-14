import "./globals.css";
export const metadata = {
  title: "Libbie Lab · by TextValue",
  description: "Local property broker simulation workspace",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
