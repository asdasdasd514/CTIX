import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MailOpen,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { feedbacksApi, type FeedbackRecord } from '../../services/api';
import { formatDate } from '../../lib/incidents';

type FilterTab = 'unread' | 'read' | 'all';

export const AdminFeedbacksPage: React.FC = () => {
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>('unread');
  const [query, setQuery] = useState<string>('');

  const loadFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await feedbacksApi.list();
      setItems(res.feedbacks || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tải danh sách góp ý.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  const unreadCount = useMemo(() => items.filter((f) => !f.isRead).length, [items]);
  const readCount = useMemo(() => items.filter((f) => f.isRead).length, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((f) => {
      if (tab === 'unread' && f.isRead) return false;
      if (tab === 'read' && !f.isRead) return false;
      if (q) {
        const hay = `${f.senderName} ${f.senderPhone} ${f.content}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, tab, query]);

  const handleToggleRead = async (fb: FeedbackRecord) => {
    const nextRead = !fb.isRead;
    setItems((prev) =>
      prev.map((x) => (x.id === fb.id ? { ...x, isRead: nextRead } : x))
    );
    try {
      await feedbacksApi.toggleRead(fb.id, nextRead);
    } catch {
      void loadFeedbacks();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa góp ý này khỏi hệ thống?')) return;
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await feedbacksApi.remove(id);
    } catch {
      void loadFeedbacks();
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. 3 THẺ KPI GỌN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <button
          type="button"
          onClick={() => setTab('unread')}
          className={`text-left bg-white rounded-[5px] border border-l-4 border-l-blue-600 p-4 shadow-sm flex items-center justify-between transition ${
            tab === 'unread' ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200'
          }`}
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Chưa đọc</div>
            <div className="text-2xl font-black text-blue-800 mt-0.5">{unreadCount}</div>
          </div>
          <div className="w-10 h-10 rounded-[5px] bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTab('read')}
          className={`text-left bg-white rounded-[5px] border border-l-4 border-l-emerald-600 p-4 shadow-sm flex items-center justify-between transition ${
            tab === 'read' ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-slate-200'
          }`}
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Đã đọc</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">{readCount}</div>
          </div>
          <div className="w-10 h-10 rounded-[5px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MailOpen className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTab('all')}
          className={`text-left bg-white rounded-[5px] border border-l-4 border-l-slate-700 p-4 shadow-sm flex items-center justify-between transition ${
            tab === 'all' ? 'border-slate-400 ring-1 ring-slate-400' : 'border-slate-200'
          }`}
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Tổng góp ý</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{items.length}</div>
          </div>
          <div className="w-10 h-10 rounded-[5px] bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* 2. THANH LỌC & TÌM KIẾM */}
      <div className="bg-white rounded-[5px] border border-slate-200 shadow-sm p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-[5px] border border-slate-200">
          {[
            { id: 'unread' as const, label: `Chưa đọc (${unreadCount})` },
            { id: 'read' as const, label: `Đã đọc (${readCount})` },
            { id: 'all' as const, label: `Tất cả (${items.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-bold transition whitespace-nowrap ${
                tab === t.id
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm nội dung, người gửi, SĐT..."
              className="w-full h-9 pl-9 pr-3 rounded-[5px] border border-slate-300 bg-slate-50 focus:bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadFeedbacks()}
            disabled={loading}
            className="h-9 px-3 rounded-[5px] bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-[5px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {error}
        </div>
      )}

      {/* 3. DANH SÁCH GÓP Ý */}
      {loading && items.length === 0 ? (
        <div className="bg-white rounded-[5px] border border-slate-200 p-10 text-center text-xs text-slate-400">
          Đang tải danh sách góp ý...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[5px] border border-slate-200 p-10 text-center space-y-2 shadow-sm">
          <MessageSquare className="w-9 h-9 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">Chưa có góp ý nào</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb) => (
            <article
              key={fb.id}
              className={`bg-white rounded-[5px] border shadow-sm p-4 sm:p-5 space-y-3 transition ${
                fb.isRead ? 'border-slate-200' : 'border-blue-300 border-l-4 border-l-blue-600'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-extrabold text-slate-900 inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    {fb.senderName}
                  </span>
                  {fb.senderPhone && (
                    <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {fb.senderPhone}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-[4px] border ${
                      fb.isRead
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {fb.isRead ? 'Đã đọc' : 'Mới'}
                  </span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(fb.createdAt)}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {fb.content}
              </p>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void handleToggleRead(fb)}
                  className={`px-3 py-1.5 rounded-[5px] text-xs font-bold inline-flex items-center gap-1.5 border transition ${
                    fb.isRead
                      ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{fb.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(fb.id)}
                  className="px-3 py-1.5 rounded-[5px] bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 text-xs font-bold inline-flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
