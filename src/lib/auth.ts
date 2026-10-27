import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { getDb } from "./db";
import type { Role, SessionUser } from "./types";

const demoMode = process.env.AUTH_DEMO_MODE !== "false";

const DEMO_USERS: SessionUser[] = [
  {
    id: "segreteria-demo",
    email: "segreteria@demo.local",
    name: "Segreteria Demo",
    role: "segreteria",
  },
  {
    id: "dirigente-demo",
    email: "dirigente@demo.local",
    name: "Dirigente Demo",
    role: "dirigente",
  },
  {
    id: "maria-rossi",
    email: "maria.rossi@demo.local",
    name: "Maria Rossi",
    role: "docente",
  },
  {
    id: "luca-bianchi",
    email: "luca.bianchi@demo.local",
    name: "Luca Bianchi",
    role: "docente",
  },
];

function findOrCreateGoogleUser(email: string, name: string): SessionUser {
  const db = getDb();
  const existing = db
    .prepare(`SELECT id, email, name, role FROM users WHERE email = ?`)
    .get(email) as SessionUser | undefined;
  if (existing) return existing;

  const id = `google-${Buffer.from(email).toString("base64url").slice(0, 24)}`;
  db.prepare(
    `INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, 'docente')`
  ).run(id, email, name || email);
  return { id, email, name: name || email, role: "docente" };
}

const providers = [];

if (demoMode) {
  providers.push(
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {
        userId: { label: "Utente", type: "text" },
      },
      async authorize(credentials) {
        const userId = credentials?.userId as string | undefined;
        if (!userId) return null;
        getDb(); // ensure seed
        const demo = DEMO_USERS.find((u) => u.id === userId);
        if (!demo) return null;
        return {
          id: demo.id,
          email: demo.email,
          name: demo.name,
          role: demo.role,
        };
      },
    })
  );
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const row = findOrCreateGoogleUser(user.email, user.name || user.email);
        user.id = row.id;
        (user as { role?: Role }).role = row.role;
        user.name = row.name;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
        token.name = user.name;
        token.email = user.email;
      }
      if (!token.role && token.email) {
        const db = getDb();
        const row = db
          .prepare(`SELECT id, role, name FROM users WHERE email = ?`)
          .get(token.email as string) as
          | { id: string; role: Role; name: string }
          | undefined;
        if (row) {
          token.id = row.id;
          token.role = row.role;
          token.name = row.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = (token.name as string) || session.user.name;
        session.user.email = (token.email as string) || session.user.email;
      }
      return session;
    },
  },
  trustHost: true,
});

export function getDemoUsers() {
  return DEMO_USERS;
}

export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    throw new Error("Non autenticato");
  }
  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    role: session.user.role,
  };
}
