import { fontClassName } from "@/lib/fonts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={fontClassName}>{children}</div>
  );
}
