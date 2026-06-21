export type UserRole = "participant" | "admin";

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  role: UserRole;
};
