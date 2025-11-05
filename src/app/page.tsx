import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to sign-in page for unauthenticated users
  // This ensures the homepage is accessible for verification
  redirect('/auth/signin');
}
