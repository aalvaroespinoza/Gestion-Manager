import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("gestion_session")?.value

  if (sessionToken) {
    redirect("/dashboard")
  } else {
    redirect("/dashboard")
  }
}
