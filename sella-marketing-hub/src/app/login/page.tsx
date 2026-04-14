import { login } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    'use server';
    await login(formData);
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#09090b] text-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-[#09090b] border border-[#27272a] rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Sella</h1>
          <p className="mt-2 text-sm text-[#a1a1aa]">Marketing Command Center</p>
        </div>
        
        <form action={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa]">Username</label>
            <input
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa]">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    </main>
  );
}
