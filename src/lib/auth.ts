import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        uid: { label: "ID", type: "text" },
        password: { label: "비밀번호", type: "password" },
        loginType: { label: "로그인 유형", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.uid || !credentials?.password) return null;
        const { uid, password, loginType } = credentials;

        // User 테이블 먼저 조회
        const user = await prisma.user.findUnique({ where: { uid } });
        if (user) {
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
          return {
            id: user.uid,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
          };
        }

        // Student 테이블 조회
        const student = await prisma.student.findUnique({
          where: { studentId: uid },
        });
        if (!student) return null;
        const ok = await bcrypt.compare(password, student.pw);
        if (!ok) return null;
        return {
          id: student.studentId,
          name: student.name,
          email: "",
          role: "student",
          department: student.department,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.department = (user as any).department;
      }
      // 설정에서 이름·소속을 바꾼 뒤 useSession().update(...) 로 사이드바에 바로 반영
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.department !== undefined) token.department = session.department;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).department = token.department;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
