import { Volume2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { supabase, user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header 
      className="bg-[#1D4ED8] overflow-auto py-2 lg:py-4 px-6 lg:px-12 shadow-md sticky top-0 z-50" 
      role="banner"
    >
      <div className="container mx-auto max-w-[1200px]">
        <div className="flex items-center justify-between">
          {/* Left spacer for balance */}
          <div className="w-24 lg:w-32"></div>
          
          {/* Center content */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-3 lg:gap-4 mb-3">
              <Volume2 className="w-10 h-10 lg:w-14 lg:h-14 text-white" aria-hidden="true" />
              <h1 className="text-4xl lg:text-5xl text-white">
                STEMVoice
              </h1>
            </div>
            <p className="text-xl lg:text-2xl text-blue-100 px-4">
              See it. Hear it. Learn it — your way.
            </p>
          </div>
          
          {/* Right - Logout button */}
          <div className="w-24 lg:w-32 flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 text-sm lg:text-base"
              title={`Logout (${user?.email})`}
            >
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}