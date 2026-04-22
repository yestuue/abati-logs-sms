import { redirect } from "next/navigation";

export default function AdminTransactionsPage() {
  // Transaction analytics and history currently live under revenue.
  redirect("/admin/revenue");
}

