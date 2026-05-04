import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id           = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:    { label: "Correo",     type: "email"    },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
            select: { id: true, name: true, email: true, password: true, role: true, image: true },
          });

          if (!user?.password) return null;

          const valid = await bcrypt.compare(parsed.data.password, user.password);
          if (!valid) return null;

          // Retornar solo los campos que NextAuth necesita
          return {
            id:    user.id,
            name:  user.name,
            email: user.email,
            image: user.image,
            role:  user.role,
          };
        } catch (error) {
          console.error("[Auth] Error en authorize:", error);
          return null;
        }
      },
    }),
  ],
});
