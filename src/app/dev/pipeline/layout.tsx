import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export const metadata = { title: "Pipeline Inspector — PCFO Dev" };

export default async function DevPipelineLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <>{children}</>;
}
