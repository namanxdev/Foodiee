import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Sync user with backend database
      try {
        const response = await fetch('http://localhost:8000/api/user/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image,
            google_id: account?.providerAccountId,
          }),
        });
        
        const data = await response.json();
        console.log('User synced with backend:', data);
        
        return true; // Allow sign in
      } catch (error) {
        console.error('Error syncing user with backend:', error);
        return true; // Still allow sign in even if sync fails
      }
    },
    async session({ session, token }) {
      // Add any custom data to session if needed
      return session;
    },
  },
})