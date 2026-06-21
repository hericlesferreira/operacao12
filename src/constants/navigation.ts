import {
  BarChart3,
  ClipboardList,
  Home,
  Route,
  ShieldCheck,
  Utensils
} from "lucide-react";

export const participantNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Trilha", href: "/trilha", icon: Route },
  { label: "Plano alimentar", href: "/plano-alimentar", icon: Utensils },
  { label: "Avaliações", href: "/avaliacoes", icon: BarChart3 }
];

export const adminNavigation = [
  { label: "Painel", href: "/admin", icon: ShieldCheck },
  { label: "Participantes", href: "/admin/participantes", icon: ClipboardList }
];
