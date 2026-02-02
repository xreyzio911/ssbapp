import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "HR") {
    redirect("/hr");
  }
  redirect("/employee");
}
