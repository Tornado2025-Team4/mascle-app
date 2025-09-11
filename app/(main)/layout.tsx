'use client'

import Footer from "../../components/footer";
import CommonHeader from "../../components/common-header";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <CommonHeader />
      {children}
      <Footer />
    </>
  );
}
