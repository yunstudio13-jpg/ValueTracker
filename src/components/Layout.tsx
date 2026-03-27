import React from 'react';
import { auth, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogOut, Plus, Home, List, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'items' | 'profile';
  onTabChange: (tab: 'dashboard' | 'items' | 'profile') => void;
  onAddItem: () => void;
}

export function Layout({ children, activeTab, onTabChange, onAddItem }: LayoutProps) {
  const [user] = useAuthState(auth);

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0A0A0A] text-[#1A1A1A] dark:text-[#F5F5F5] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-lg">V</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">ValueTracker</h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <button 
                onClick={onAddItem}
                className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-full transition-transform active:scale-90"
              >
                <Plus size={20} />
              </button>
              <button 
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-6 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => onTabChange('dashboard')}
            icon={<Home size={24} />}
            label="首页"
          />
          <NavButton 
            active={activeTab === 'items'} 
            onClick={() => onTabChange('items')}
            icon={<List size={24} />}
            label="物品"
          />
          <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => onTabChange('profile')}
            icon={<User size={24} />}
            label="我的"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-600"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
