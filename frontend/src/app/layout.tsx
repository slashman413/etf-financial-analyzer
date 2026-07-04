export function generateMetadata() {
  return {
    title: "ETF 財報分析儀表板",
    description: "ETF 成分股財報自動分析",
  };
}

const CTA_TWSE = "https://slashman413.github.io/twse-backtests/?utm_source=etf-analyzer&utm_medium=web&utm_campaign=etf-financial-analyzer";
const CTA_SAAS = "https://slashman413.gumroad.com/l/saas-starter?utm_source=etf-analyzer&utm_medium=web&utm_campaign=etf-financial-analyzer";

function PromoBar() {
  return (
    <div
      style={{
        background: "#0e1e30",
        borderBottom: "1px solid rgba(3,134,244,0.25)",
        padding: "7px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "6px 18px",
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <a
        href={CTA_TWSE}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#4db8ff",
          textDecoration: "none",
          fontWeight: 600,
          letterSpacing: 0.2,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span style={{ fontSize: 14 }}>📈</span>
        台股大飆股 DNA 量化訊號（免費回測＋每日精選）
      </a>
      <span style={{ color: "rgba(255,255,255,0.18)", flexShrink: 0 }}>·</span>
      <a
        href={CTA_SAAS}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "rgba(255,255,255,0.45)",
          textDecoration: "none",
          fontWeight: 400,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span style={{ fontSize: 13 }}>🛠</span>
        SaaS Starter — ship a multi-tenant SaaS this weekend
      </a>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <PromoBar />
        {children}
      </body>
    </html>
  );
}
