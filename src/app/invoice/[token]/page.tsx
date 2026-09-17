import { API_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const src = `${API_URL}/invoices/public/${encodeURIComponent(token)}`;

  return (
    <iframe
      title="Vee Jain tax invoice"
      src={src}
      className="min-h-screen w-full border-0 bg-white"
    />
  );
}
