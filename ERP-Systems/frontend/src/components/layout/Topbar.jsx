import {
  Search,
  Bell,
  CalendarDays,
  Command,
  ChevronDown,
  Plus,
} from "lucide-react";

export default function Topbar() {
  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search">
        <Search size={18} strokeWidth={1.8} />

        <input
          type="text"
          placeholder="ابحث عن عميل، فاتورة، منتج، مشروع..."
        />

        <div className="topbar-shortcut">
          <Command size={12} />
          <span>K</span>
        </div>
      </div>

      {/* Center actions */}
      <div className="topbar-center-actions">
        <button
          type="button"
          className="topbar-add-button"
          title="إنشاء جديد"
        >
          <Plus size={20} strokeWidth={2} />
        </button>

        <button
          type="button"
          className="topbar-action-button notification-button"
          title="الإشعارات"
        >
          <Bell size={19} strokeWidth={1.8} />

          <span className="topbar-notification-badge">
            3
          </span>
        </button>

        <button
          type="button"
          className="topbar-action-button"
          title="التقويم"
        >
          <CalendarDays size={19} strokeWidth={1.8} />
        </button>
      </div>

      {/* User */}
      <button
        type="button"
        className="topbar-profile"
      >
        <div className="topbar-profile-avatar">
          MA
          <span className="profile-online-dot" />
        </div>

        <div className="topbar-profile-copy">
          <strong>محمد العاصي</strong>
          <span>المدير العام</span>
        </div>

        <ChevronDown
          size={15}
          strokeWidth={1.8}
          className="profile-chevron"
        />
      </button>
    </header>
  );
}