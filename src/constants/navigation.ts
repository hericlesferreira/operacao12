import {
  BarChart3,
  ClipboardList,
  Home,
  ShieldCheck,
  Utensils
} from "lucide-react";

export const participantNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Plano alimentar", href: "/plano-alimentar", icon: Utensils },
  { label: "Avaliacoes", href: "/avaliacoes", icon: BarChart3 }
];

export const adminNavigation = [
  { label: "Painel", href: "/admin", icon: ShieldCheck },
  { label: "Participantes", href: "/admin/participantes", icon: ClipboardList }
];
