import React, { useState } from 'react';
import { Item, ItemStatus } from '../types';
import { calculateDailyCost, formatCurrency, getDaysUsed } from '../utils/calculations';
import { supabase } from '../lib/supabaseClient';
import { X, Calendar, DollarSign, Clock, Tag, Edit2, Trash2, ArrowRight, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ItemDetailProps {
  item: Item;
  onClose: () => void;
  onEdit: (item: Item) => void;
  onUpdate: () => void;
}

export function ItemDetail({ item, onClose, onEdit, onUpdate }: ItemDetailProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resaleValue, setResaleValue] = useState('');

  const dailyCost = calculateDailyCost(item);
  const daysUsed = getDaysUsed(item);

  // Generate chart data (inverse proportional curve)
  const chartData = Array.from({ length: 10 }, (_, i) => {
    const days = Math.max(1, Math.floor(daysUsed * (i + 1) / 10));
    const cost = (item.price - (item.resale_value || 0)) / days;
    return {
      days,
      cost: parseFloat(cost.toFixed(2))
    };
  });

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);
      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('删除失败，请稍后重试');
    }
  };

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (newStatus === 'resold' && !resaleValue) {
      setShowStatusModal(true);
      return;
    }

    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'resold') {
        payload.resale_value = parseFloat(resaleValue) || 0;
        payload.end_date = new Date().toISOString();
      } else if (newStatus === 'scrapped') {
        payload.end_date = new Date().toISOString();
        payload.resale_value = 0;
      } else {
        payload.end_date = null;
        payload.resale_value = 0;
      }

      const { error } = await supabase
        .from('items')
        .update(payload)
        .eq('id', item.id);
      if (error) throw error;
      setShowStatusModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('状态更新失败，请稍后重试');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]"
      >
        {/* Header Image */}
        <div className="relative h-48 sm:h-64 flex-shrink-0">
          <img 
            src={item.cover_image || `https://picsum.photos/seed/${item.name}/800/600`} 
            alt={item.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-6 left-6 text-white flex items-end gap-3">
            <div className="text-4xl bg-white/20 backdrop-blur-md p-3 rounded-2xl">
              {item.emoji || '📦'}
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{item.name}</h2>
              <p className="text-white/80 font-medium">{item.brand || '未知品牌'}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard 
              label="日均成本" 
              value={formatCurrency(dailyCost)} 
              subValue="当前消耗"
              icon={<TrendingDown size={14} className="text-green-500" />}
            />
            <StatCard 
              label="已使用天数" 
              value={`${daysUsed} 天`} 
              subValue={`自 ${format(parseISO(item.purchase_date), 'yyyy-MM-dd')}`}
              icon={<Clock size={14} className="text-blue-500" />}
            />
            <StatCard 
              label="购入价格" 
              value={formatCurrency(item.price)} 
              subValue={item.status === 'resold' ? `回血: ${formatCurrency(item.resale_value || 0)}` : '原始资产'}
              icon={<DollarSign size={14} className="text-orange-500" />}
            />
          </div>

          {/* Chart */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">日均成本趋势</h3>
            <div className="h-48 w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                  <XAxis dataKey="days" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    labelFormatter={(label) => `使用 ${label} 天`}
                    formatter={(value: number) => [formatCurrency(value), '日均成本']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#000" 
                    strokeWidth={2} 
                    dot={false} 
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">基本信息</h3>
              <DetailRow icon={<Tag size={14} />} label="分类" value={item.category_name || '未分类'} />
              <DetailRow icon={<Calendar size={14} />} label="保修至" value={item.warranty_expiry ? format(parseISO(item.warranty_expiry), 'yyyy-MM-dd') : '未记录'} />
            </section>
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">备注</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.notes || '暂无详细备注信息。'}
              </p>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
          <button 
            onClick={() => onEdit(item)}
            className="flex-1 min-w-[120px] py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={16} /> 编辑
          </button>
          <button 
            onClick={() => setShowStatusModal(true)}
            className="flex-[2] min-w-[160px] py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <ArrowRight size={16} /> 变更状态
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-lg font-bold mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 mb-6">确定要删除这件物品吗？此操作不可撤销。</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold"
              >
                取消
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold"
              >
                确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 w-full max-w-xs rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-lg font-bold mb-4">变更物品状态</h3>
            <div className="space-y-2">
              <StatusOption active={item.status === 'active'} onClick={() => handleStatusChange('active')}>在用</StatusOption>
              <StatusOption active={item.status === 'idle'} onClick={() => handleStatusChange('idle')}>闲置</StatusOption>
              <StatusOption active={item.status === 'scrapped'} onClick={() => handleStatusChange('scrapped')}>已报废</StatusOption>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">转手回血</p>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="金额" 
                    value={resaleValue}
                    onChange={e => setResaleValue(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-3 py-2 text-sm"
                  />
                  <button 
                    onClick={() => handleStatusChange('resold')}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowStatusModal(false)}
              className="w-full mt-6 text-sm text-gray-400 font-medium"
            >
              取消
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ label, value, subValue, icon }: { label: string, value: string, subValue: string, icon: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex sm:block items-center justify-between sm:justify-start gap-4 sm:gap-0">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0 sm:mb-1">
        {icon} {label}
      </div>
      <div className="flex flex-col items-end sm:items-start">
        <div className="text-base sm:text-lg font-mono font-bold leading-tight">{value}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{subValue}</div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-400">
        {icon} <span>{label}</span>
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatusOption({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-black text-white dark:bg-white dark:text-black' 
          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
