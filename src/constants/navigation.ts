import {
  BarChart3,
  ClipboardList,
  Home,
  Route,
  ShieldCheck,
  User,
  Utensils
} from "lucide-react";

export const participantNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Mapa", href: "/trilha", icon: Route },
  { label: "Plano", href: "/plano-alimentar", icon: Utensils },
  { label: "Avaliações", href: "/avaliacoes", icon: BarChart3 },
  { label: "Perfil", href: "/perfil", icon: User }
];

export const adminNavigation = [
  { label: "Painel", href: "/admin", icon: ShieldCheck },
  { label: "Participantes", href: "/admin/participantes", icon: ClipboardList }
];
