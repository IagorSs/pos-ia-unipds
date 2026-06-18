import "@/styles/globals.css";

export const metadata = {
  title: "Better Auth Demo",
  description: "Demo Next.js + Better Auth + GitHub + SQLite",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
