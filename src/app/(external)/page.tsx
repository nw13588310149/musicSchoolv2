import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getTokenCookieName } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getTokenCookieName())?.value;

  redirect(token ? "/dashboard/overview" : "/login");
}
