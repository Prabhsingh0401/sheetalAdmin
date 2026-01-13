import { Providers } from "@/store/Providers";
import "./globals.css";
import ClientOnlyFeatures from "./ClientOnlyFeatures";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Providers>
          {children}
          <ClientOnlyFeatures />
        </Providers>
      </body>
    </html>
  );
}
