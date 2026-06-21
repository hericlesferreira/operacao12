import { AuthCard } from "@/components/forms/auth-card";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <AuthCard mode="signup" />
    </main>
  );
}
