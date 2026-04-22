import { redirect } from "next/navigation";

export default function AdminSettingsPage() {
  // Site-wide pricing/settings controls currently live here.
  redirect("/admin/pricing");
}

