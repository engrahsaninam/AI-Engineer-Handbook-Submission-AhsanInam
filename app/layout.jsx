import "./globals.css";

export const metadata = {
  title: "SaaSQuatch Leads - AI Web Scanner",
  description: "AI-powered account intelligence scanner for lead prioritization.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
