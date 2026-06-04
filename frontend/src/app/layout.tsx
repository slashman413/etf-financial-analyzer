export function generateMetadata() {
  return {
    title: "ETF 財報分析儀表板",
    description: "ETF 成分股財報自動分析",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
