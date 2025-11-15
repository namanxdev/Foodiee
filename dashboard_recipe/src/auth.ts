import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { API_CONFIG } from "@/constants"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Get image from profile.picture (Google) or user.image as fallback
      const userImage = (profile as any)?.picture || user.image || (profile as any)?.image;

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
      } catch (error) {
        return true; // Still allow sign in even if sync fails
      }
    },
    async jwt({ token, user, account, profile }) {
      // Persist user data to token on sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        
        // Get image from profile.picture (Google) or user.image as fallback
        const userImage = (profile as any)?.picture || user.image || (profile as any)?.image;
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