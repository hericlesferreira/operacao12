import { AdminShell } from "@/components/layout/admin-shell";
import { ParticipantDetail } from "@/components/admin/participant-detail";

type AdminParticipantDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminParticipantDetailPage({
  params
}: AdminParticipantDetailPageProps) {
  const { id } = await params;

  return (
    <AdminShell title="Detalhe do participante">
      <ParticipantDetail participantId={id} />
    </AdminShell>
  );
}
