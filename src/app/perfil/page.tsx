import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <AppShell title="Meu Perfil">
      <ProfileForm />
    </AppShell>
  );
}
