import { AdminShell } from "@/components/layout/admin-shell";
import { ParticipantsList } from "@/components/admin/participants-list";

export default function AdminParticipantsPage() {
  return (
    <AdminShell title="Participantes">
      <ParticipantsList />
    </AdminShell>
  );
}
