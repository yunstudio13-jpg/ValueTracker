import React, { useState } from 'react';
import { Item, ItemStatus } from '../types';
import { calculateDailyCost, formatCurrency, getDaysUsed, getWarrantyStatus } from '../utils/calculations';
import { Search, Filter, ArrowUpDown, MoreVertical, Calendar, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ItemListProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

export function ItemList({ items, onItemClick }: ItemListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'dailyCost' | 'purchase_date'>('purchase_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                           item.brand?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'dailyCost') {
        valA = calculateDailyCost(a);
        valB = calculateDailyCost(b);
      } else if (sortBy === 'price') {
        valA = a.price;
        valB = b.price;
      } else {
        valA = new Date(a.purchase_date).getTime();
        valB = new Date(b.purchase_date).getTime();
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="搜索物品或品牌..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border-none rounded-2xl pl-10 pr-4 py-3 sm:py-4 shadow-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm sm:text-base"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
          <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>全部</FilterButton>
          <FilterButton active={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>在用</FilterButton>
          <FilterButton active={statusFilter === 'idle'} onClick={() => setStatusFilter('idle')}>闲置</FilterButton>
          <FilterButton active={statusFilter === 'resold'} onClick={() => setStatusFilter('resold')}>已转手</FilterButton>
          <FilterButton active={statusFilter === 'scrapped'} onClick={() => setStatusFilter('scrapped')}>已报废</FilterButton>
        </div>

        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400 px-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSortBy('purchase_date')}
              className={cn("transition-colors", sortBy === 'purchase_date' ? "text-black dark:text-white" : "hover:text-gray-600")}
            >
              时间
            </button>
            <button 
              onClick={() => setSortBy('price')}
              className={cn("transition-colors", sortBy === 'price' ? "text-black dark:text-white" : "hover:text-gray-600")}
            >
              价格
            </button>
            <button 
              onClick={() => setSortBy('dailyCost')}
              className={cn("transition-colors", sortBy === 'dailyCost' ? "text-black dark:text-white" : "hover:text-gray-600")}
            >
              日均成本
            </button>
          </div>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowUpDown size={14} />
            {sortOrder === 'asc' ? '升序' : '降序'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map((item, idx) => {
          const daysUsed = getDaysUsed(item);
          const warrantyStatus = getWarrantyStatus(item);
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onItemClick(item)}
              className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-100 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-gray-800 overflow-hidden flex-shrink-0 relative group">
                  <img 
                    src={item.cover_image || `https://picsum.photos/seed/${item.name}/200/200`} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 left-1 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-lg p-1 text-sm shadow-sm">
                    {item.emoji || '📦'}
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                      <span className="text-[10px] text-gray-400 truncate max-w-[60px] shrink-0">{item.brand || '未知品牌'}</span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5 shrink-0">
                        <Calendar size={10} /> {daysUsed}天
                      </span>
                      {item.warranty_expiry && (
                        <span className={`text-[10px] flex items-center gap-0.5 shrink-0 ${
                          warrantyStatus === '已过保' ? 'text-red-500' : 'text-blue-500'
                        }`}>
                          <Shield size={10} /> {warrantyStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div className="text-xs font-mono font-medium">
                      {formatCurrency(calculateDailyCost(item))}
                      <span className="text-[10px] text-gray-400 ml-0.5">/日</span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="py-20 text-center text-gray-400">
          没有找到符合条件的物品
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
        active 
          ? "bg-black text-white dark:bg-white dark:text-black" 
          : "bg-white dark:bg-gray-900 text-gray-400 hover:text-black dark:hover:text-white border border-gray-100 dark:border-gray-800"
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: ItemStatus }) {
  const colors = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    idle: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    resold: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    scrapped: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const labels = {
    active: "在用",
    idle: "闲置",
    resold: "已转手",
    scrapped: "已报废",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter", colors[status])}>
      {labels[status]}
    </span>
  );
}
