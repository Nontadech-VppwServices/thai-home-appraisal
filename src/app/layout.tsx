import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "เรือนราคา | ระบบประเมินบ้าน",
  description: "Prototype ระบบบันทึกการประเมินราคาบ้าน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
