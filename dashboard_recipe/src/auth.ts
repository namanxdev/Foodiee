import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { API_CONFIG } from "@/constants"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Required for Vercel deployments
  providers: [Google],
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Get image from user.image
      const userImage = user.image;

      // Sync user with backend database
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: userImage,
            google_id: account?.providerAccountId,
          }),
        });
        
        await response.json();
        
        return true; // Allow sign in
      } catch {
        return true; // Still allow sign in even if sync fails
      }
    },
    async jwt({ token, user }) {
      // Persist user data to token on sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        
        // Get image from user.image
        const userImage = user.image;
        token.image = userImage;
      }
      return token;
    },
    async session({ session, token }) {
      // Send user properties to the client
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
})