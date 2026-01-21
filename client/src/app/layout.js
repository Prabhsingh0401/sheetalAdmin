import { Providers } from "@/store/Providers";
import "./globals.css";
import ClientOnlyFeatures from "./ClientOnlyFeatures";
import AuthInitializer from "@/components/AuthInitializer";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Providers>
          <AuthInitializer>{children}</AuthInitializer>
          <ClientOnlyFeatures />
        </Providers>
      </body>
    </html>
  );
}

