import Footer from "../../components/footer";
import { fontClassName } from "@/lib/fonts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={fontClassName}>
        {children}
        <Footer />
      </body>   
    </html>
  );
}
