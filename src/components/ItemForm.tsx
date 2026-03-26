import React, { useState } from 'react';
import { Item, ItemStatus } from '../types';
import { supabase } from '../lib/supabaseClient';
import { X, Camera, Calendar, Tag, DollarSign, Package, Smile } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { CATEGORIES } from '../constants';

interface ItemFormProps {
  item?: Item;
  onClose: () => void;
  onSuccess: () => void;
}

export function ItemForm({ item, onClose, onSuccess }: ItemFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    price: item?.price?.toString() || '',
    purchase_date: item?.purchase_date ? format(new Date(item.purchase_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    brand: item?.brand || '',
    status: item?.status || 'active' as ItemStatus,
    notes: item?.notes || '',
    cover_image: item?.cover_image || '',
    warranty_expiry: item?.warranty_expiry ? format(new Date(item.warranty_expiry), 'yyyy-MM-dd') : '',
    category_id: item?.category_id || CATEGORIES[0].id,
    emoji: item?.emoji || CATEGORIES[0].emoji,
  });

  const handleCategoryChange = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat) {
      setFormData({ ...formData, category_id: catId, emoji: cat.emoji });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setLoading(true);

    const payload: any = {
      user_id: session.user.id,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      purchase_date: new Date(formData.purchase_date).toISOString(),
      brand: formData.brand,
      status: formData.status,
      notes: formData.notes,
      cover_image: formData.cover_image || `https://picsum.photos/seed/${formData.name}/800/600`,
      category_id: formData.category_id,
      category_name: CATEGORIES.find(c => c.id === formData.category_id)?.name || '',
      emoji: formData.emoji,
    };

    if (formData.warranty_expiry) {
      payload.warranty_expiry = new Date(formData.warranty_expiry).toISOString();
    }

    try {
      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update(payload)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('items')
          .insert(payload);
        if (error) throw error;
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{item ? '编辑物品' : '新增物品'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Package size={14} /> 物品名称
            </label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
              placeholder="例如: MacBook Pro"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <DollarSign size={14} /> 购入价格
              </label>
              <input 
                required
                type="number"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                placeholder="0.00"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Calendar size={14} /> 购入日期
              </label>
              <input 
                required
                type="date"
                value={formData.purchase_date}
                onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Tag size={14} /> 物品分类
              </label>
              <select 
                value={formData.category_id}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Smile size={14} /> 图标 (Emoji)
              </label>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <span className="text-xl">{formData.emoji}</span>
                <select 
                  value={formData.emoji}
                  onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm appearance-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.emoji}>{cat.emoji} {cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Tag size={14} /> 品牌
              </label>
              <input 
                type="text"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                placeholder="例如: Apple"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">状态</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as ItemStatus })}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
              >
                <option value="active">在用</option>
                <option value="idle">闲置</option>
                <option value="resold">已转手</option>
                <option value="scrapped">已报废</option>
              </select>
            </div>
          </div>

          {/* Warranty Expiry */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Calendar size={14} /> 保修至 (可选)
            </label>
            <input 
              type="date"
              value={formData.warranty_expiry}
              onChange={e => setFormData({ ...formData, warranty_expiry: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">备注</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all min-h-[100px]"
              placeholder="记录一些细节..."
            />
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <button 
            disabled={loading}
            onClick={handleSubmit}
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-semibold text-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存物品'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
