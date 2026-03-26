import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Item } from './types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ItemList } from './components/ItemList';
import { ItemForm } from './components/ItemForm';
import { ItemDetail } from './components/ItemDetail';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ShieldCheck, Sparkles, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'items' | 'profile'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // 监听用户认证状态
  useEffect(() => {
    const { data: { session } } = supabase.auth.getSession();
    setUser(session?.user || null);
    setLoading(false);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 获取用户物品数据
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }

    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching items:', error);
      } else {
        setItems(data || []);
      }
    };

    fetchItems();

    // 设置实时订阅
    const { data: { subscription } } = supabase
      .from('items')
      .on('*', (payload) => {
        fetchItems();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message.includes('popup')) {
        setLoginError('登录窗口被浏览器拦截，请允许本站弹出窗口。');
      } else {
        setLoginError('登录失败，请稍后重试。');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] dark:bg-[#0A0A0A]">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 bg-black dark:bg-white rounded-2xl"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F5F5F5] dark:bg-[#0A0A0A] text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full space-y-8"
        >
          <div className="space-y-4">
            <div className="w-20 h-20 bg-black dark:bg-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
              <span className="text-white dark:text-black font-bold text-4xl">V</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight italic serif">ValueTracker</h1>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              量化物品的长期价值，建立更理性的消费观，践行极简主义生活。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-8">
            <FeatureItem icon={<ShieldCheck size={18} />} text="资产透明化管理" />
            <FeatureItem icon={<Sparkles size={18} />} text="日均成本实时计算" />
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-xl disabled:opacity-50"
            >
              {loginLoading ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} /> 使用 Google 登录
                </>
              )}
            </button>
            
            {loginError && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-500 font-medium"
              >
                {loginError}
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddItem={() => setShowAddModal(true)}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Dashboard items={items} onItemClick={setSelectedItem} />
            </motion.div>
          )}

          {activeTab === 'items' && (
            <motion.div 
              key="items"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <ItemList items={items} onItemClick={setSelectedItem} />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 text-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto overflow-hidden">
                  <img src={user?.user_metadata?.avatar_url || ''} alt={user?.user_metadata?.full_name || ''} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user?.user_metadata?.full_name || user?.email}</h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl font-medium flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <LogOut size={18} /> 退出登录
                </button>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <ProfileLink label="数据导出" subLabel="CSV 格式" />
                <ProfileLink label="隐私设置" subLabel="管理您的数据" />
                <ProfileLink label="关于物值" subLabel="版本 1.0.0" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
          {showAddModal && (
            <ItemForm 
              onClose={() => setShowAddModal(false)} 
              onSuccess={() => setShowAddModal(false)} 
            />
          )}
          {editingItem && (
            <ItemForm 
              item={editingItem}
              onClose={() => setEditingItem(null)} 
              onSuccess={() => setEditingItem(null)} 
            />
          )}
          {selectedItem && (
            <ItemDetail 
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onEdit={(item) => {
                setSelectedItem(null);
                setEditingItem(item);
              }}
              onUpdate={() => {}} // Snapshot listener handles this
            />
          )}
        </AnimatePresence>
      </Layout>
    </ErrorBoundary>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900/50 py-3 px-4 rounded-2xl border border-gray-100 dark:border-gray-800">
      {icon} {text}
    </div>
  );
}

function ProfileLink({ label, subLabel }: { label: string, subLabel: string }) {
  return (
    <button className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="text-left">
        <div className="font-bold text-sm tracking-tight">{label}</div>
        <div className="text-xs text-gray-400">{subLabel}</div>
      </div>
      <div className="text-gray-300">→</div>
    </button>
  );
}
