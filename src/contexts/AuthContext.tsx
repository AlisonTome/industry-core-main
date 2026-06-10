import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { ensureSupplierProfile, K, seedIfEmpty } from "@/lib/store";

export type Role = "buyer" | "supplier";
export type User = { email: string; name: string; company: string; role: Role };
type Stored = User & { password: string };

type AuthCtx = {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  signup: (data: User & { password: string }) => { ok: boolean; error?: string };
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const legacyDemoEmails = new Set(["metal@ind.com", "carlos@ind.com"]);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    seedIfEmpty();
    // Keep a local demo account available during prototyping.
    let users = JSON.parse(localStorage.getItem(K.users) || "[]") as Stored[];
    users = users.filter((u) => !legacyDemoEmails.has(u.email.toLowerCase()));
    if (!users.find((u) => u.email === "demo@nexforge.com")) {
      users.push({ email: "demo@nexforge.com", password: "demo1234", name: "Usuário Demo", company: "NexForge Demo", role: "buyer" });
    }
    localStorage.setItem(K.users, JSON.stringify(users));
    const session = localStorage.getItem(K.session);
    if (session) {
      const currentSession = JSON.parse(session) as User;
      if (legacyDemoEmails.has(currentSession.email.toLowerCase())) {
        localStorage.removeItem(K.session);
        return;
      }
      setUser(currentSession);
    }
  }, []);

  const api = useMemo<AuthCtx>(
    () => ({
      user,
      login(email, password) {
        const users = JSON.parse(localStorage.getItem(K.users) || "[]") as Stored[];
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!found) return { ok: false, error: "E-mail ou senha inválidos." };
        if (found.role === "supplier") ensureSupplierProfile(found.company);
        const u: User = { email: found.email, name: found.name, company: found.company, role: found.role };
        localStorage.setItem(K.session, JSON.stringify(u));
        setUser(u);
        return { ok: true };
      },
      signup(data) {
        const users = JSON.parse(localStorage.getItem(K.users) || "[]") as Stored[];
        if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
          return { ok: false, error: "E-mail já cadastrado." };
        }
        users.push(data);
        localStorage.setItem(K.users, JSON.stringify(users));
        if (data.role === "supplier") ensureSupplierProfile(data.company);
        const u: User = { email: data.email, name: data.name, company: data.company, role: data.role };
        localStorage.setItem(K.session, JSON.stringify(u));
        setUser(u);
        return { ok: true };
      },
      logout() {
        localStorage.removeItem(K.session);
        setUser(null);
      },
    }),
    [user],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
