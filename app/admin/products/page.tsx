import { redirect } from "next/navigation";

export default function AdminProductsPage() {
  // Product management currently lives under inventory.
  redirect("/admin/inventory");
}

