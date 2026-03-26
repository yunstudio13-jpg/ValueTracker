import React, { useMemo } from 'react';
import { Item } from '../types';
import { calculateDailyCost, formatCurrency } from '../utils/calculations';
import { TrendingDown, TrendingUp, Package, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

export function Dashboard({ items, onItemClick }: DashboardProps) {
  const stats = useMemo(() => {
    const activeItems = items.filter(i => i.status === 'active' || i.status === 'idle');
    const totalValue = activeItems.reduce((sum, item) => sum + item.price, 0);
    
    const itemsWithCost = activeItems.map(item => ({
      ...item,
      dailyCost: calculateDailyCost(item)
    }));

    const globalDailyCost = itemsWithCost.reduce((sum, item) => sum + item.dailyCost, 0);

    const superValueItems = [...itemsWithCost]
      .sort((a, b) => a.dailyCost - b.dailyCost)
      .slice(0, 5);

    const dustyItems = [...itemsWithCost]
      .sort((a, b) => b.dailyCost - a.dailyCost)
      .slice(0, 5);

    return {
      totalItems: activeItems.length,
      totalValue,
      globalDailyCost,
      superValueItems,
      dustyItems
    };
  }, [items]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center gap-2 sm:gap-3 text-gray-400 mb-1 sm:mb-2">
            <Package size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-[10px] sm:text-sm font-medium uppercase tracking-wider truncate">总资产规模</span>
          </div>
          <div className="text-lg sm:text-3xl font-light tracking-tight truncate">
            {formatCurrency(stats.totalValue)}
          </div>
          <div className="text-[9px] sm:text-xs text-gray-500 mt-1 truncate">
            共 {stats.totalItems} 件物品
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center gap-2 sm:gap-3 text-gray-400 mb-1 sm:mb-2">
            <DollarSign size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-[10px] sm:text-sm font-medium uppercase tracking-wider truncate">全局日均成本</span>
          </div>
          <div className="text-lg sm:text-3xl font-light tracking-tight truncate">
            {formatCurrency(stats.globalDailyCost)}
          </div>
          <div className="text-[9px] sm:text-xs text-gray-500 mt-1 truncate">
            每日消耗
          </div>
        </motion.div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Super Value List */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="text-green-500" size={20} />
            <h2 className="text-lg font-semibold italic serif">超值榜 (Top 5)</h2>
          </div>
          <div className="space-y-3">
            {stats.superValueItems.map((item, idx) => (
              <ItemRow key={item.id} item={item} index={idx} onClick={() => onItemClick(item)} />
            ))}
            {stats.superValueItems.length === 0 && <EmptyState />}
          </div>
        </section>

        {/* Dusty List */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-orange-500" size={20} />
            <h2 className="text-lg font-semibold italic serif">吃灰榜 (Top 5)</h2>
          </div>
          <div className="space-y-3">
            {stats.dustyItems.map((item, idx) => (
              <ItemRow key={item.id} item={item} index={idx} onClick={() => onItemClick(item)} />
            ))}
            {stats.dustyItems.length === 0 && <EmptyState />}
          </div>
        </section>
      </div>
    </div>
  );
}

function ItemRow({ item, index, onClick }: { item: Item & { dailyCost: number }, index: number, onClick: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl shadow-sm">
          {item.emoji || '📦'}
        </div>
        <div>
          <h3 className="font-medium text-sm">{item.name}</h3>
          <p className="text-xs text-gray-500">{item.brand || '未知品牌'}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-mono font-medium">
          {formatCurrency(item.dailyCost)}
          <span className="text-[10px] text-gray-400 ml-1">/日</span>
        </div>
        <div className="text-[10px] uppercase tracking-tighter text-gray-400">
          购入: {formatCurrency(item.price)}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-400 text-sm">
      暂无数据，请先录入物品
    </div>
  );
}
