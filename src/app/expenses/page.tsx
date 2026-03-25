'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Expense, ExpenseType } from '@/types';
import { getAllExpenses, createExpense, deleteExpense, getFinancialSummary } from '@/lib/dataService';
import { useAuth } from '@/lib/authContext';
import { Header } from '@/components/Header';

const PRIMARY = '#A855F7';
const PRIMARY_LIGHT = '#EC4899';

export default function ExpensesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financial, setFinancial] = useState({ totalRevenue: 0, totalExpenses: 0, profit: 0, roiFromAds: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    type: ExpenseType.META_ADS,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  const loadData = () => {
    setExpenses(getAllExpenses());
    setFinancial(getFinancialSummary());
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const handleAdd = () => {
    if (!formData.amount || formData.amount <= 0) return;
    createExpense(formData);
    loadData();
    setFormData({ type: ExpenseType.META_ADS, amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this expense?')) { deleteExpense(id); loadData(); }
  };

  const getTypeColor = (type: ExpenseType) => ({
    [ExpenseType.META_ADS]: '#3B82F6', [ExpenseType.TOOLS]: '#F59E0B', [ExpenseType.OTHER]: PRIMARY,
  }[type] || '#6B7280');

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: PRIMARY, borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Revenue', value: `$${financial.totalRevenue.toFixed(0)}`, color: '#10B981' },
            { label: 'Expenses', value: `$${financial.totalExpenses.toFixed(0)}`, color: '#EF4444' },
            { label: 'Profit', value: `$${financial.profit.toFixed(0)}`, color: financial.profit >= 0 ? '#10B981' : '#EF4444' },
            { label: 'Ad ROI', value: `${financial.roiFromAds.toFixed(0)}%`, color: '#F59E0B' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#6B6B7B' }}>{stat.label}</p>
              <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#E4E4E7' }}>Expenses</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}
          >
            + Add Expense
          </button>
        </div>

        {/* List */}
        {expenses.length === 0 ? (
          <div className="text-center py-12 rounded-xl border" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
            <p className="text-lg font-medium mb-2" style={{ color: '#E4E4E7' }}>No expenses yet</p>
            <p className="text-sm" style={{ color: '#6B6B7B' }}>Click &quot;Add Expense&quot; to track spending</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map(expense => (
              <div key={expense.id} className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: '#14141B', borderColor: '#1C1C26' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: getTypeColor(expense.type) + '20' }}>
                    <span className="text-sm" style={{ color: getTypeColor(expense.type) }}>$</span>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#E4E4E7' }}>{expense.type}</p>
                    <p className="text-sm" style={{ color: '#6B6B7B' }}>{expense.description || 'No description'} • {new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold" style={{ color: '#EF4444' }}>-${expense.amount.toFixed(2)}</span>
                  <button onClick={() => handleDelete(expense.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: '#EF4444' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#14141B', border: '1px solid #1C1C26' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6" style={{ color: '#E4E4E7' }}>Add Expense</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Type</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ExpenseType })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }}>
                  {Object.values(ExpenseType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Amount ($)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: '#8B8B9E' }}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none resize-none" style={{ backgroundColor: '#1C1C26', border: '1px solid #2A2A35', color: '#E4E4E7' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1C1C26', color: '#8B8B9E' }}>Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_LIGHT} 100%)`, color: 'white' }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
