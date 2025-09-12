'use client'

import Footer from "../../components/footer";
import CommonHeader from "../../components/common-header";
import { NotificationProvider } from "../../contexts/notification-context";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NotificationProvider>
      <CommonHeader />
      <div className="pt-[8vh]">
        {children}
      </div>
      <Footer />
    </NotificationProvider>
  );
}
