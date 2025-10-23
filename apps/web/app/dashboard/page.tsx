import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Dashboard</h1>
      <p className="text-gray-300">Email: {user?.email}</p>
      <p className="text-gray-300">User ID: {user?.id}</p>
      
      <form action="/auth/signout" method="post" className="mt-4">
        <button 
          type="submit"
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}
