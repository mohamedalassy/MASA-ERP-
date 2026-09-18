import {
  Search,
  Plus,
  Hash,
  Users,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Send,
  Smile,
  Phone,
  Video,
  Circle,
} from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "أحمد خالد",
    role: "قسم المبيعات",
    initials: "AK",
    message: "تم إرسال عرض السعر للعميل",
    time: "10:42",
    unread: 3,
    online: true,
  },
  {
    id: 2,
    name: "سارة محمد",
    role: "قسم التسعير",
    initials: "SM",
    message: "تم تحديث تكلفة المشروع",
    time: "10:18",
    unread: 1,
    online: true,
  },
  {
    id: 3,
    name: "محمود علي",
    role: "قسم المشاريع",
    initials: "MA",
    message: "سأرسل تقرير الموقع اليوم",
    time: "09:50",
    unread: 0,
    online: false,
  },
];

const channels = [
  {
    id: 1,
    name: "المبيعات",
    icon: Hash,
    unread: 8,
  },
  {
    id: 2,
    name: "قسم التسعير",
    icon: Hash,
    unread: 2,
  },
  {
    id: 3,
    name: "مشروع أنظمة المراقبة",
    icon: Users,
    unread: 4,
  },
];

const messages = [
  {
    id: 1,
    sender: "أحمد خالد",
    initials: "AK",
    text: "صباح الخير، العميل طلب تحديث عرض السعر وإضافة الكاميرات الجديدة.",
    time: "10:31",
    mine: false,
  },
  {
    id: 2,
    sender: "محمد العاصي",
    initials: "MA",
    text: "تمام، حول الطلب لقسم التسعير وخليهم يراجعوا تكلفة المنتجات قبل الإرسال.",
    time: "10:34",
    mine: true,
  },
  {
    id: 3,
    sender: "أحمد خالد",
    initials: "AK",
    text: "تم التحويل، وقسم التسعير بدأ المراجعة.",
    time: "10:38",
    mine: false,
  },
  {
    id: 4,
    sender: "محمد العاصي",
    initials: "MA",
    text: "ممتاز. أول ما يتم اعتماد السعر اربطه بملف العميل والمشروع.",
    time: "10:40",
    mine: true,
  },
];

export default function ChatPanel() {
  return (
    <section className="chat-page">

      {/* قائمة المحادثات */}
      <aside className="chat-sidebar">

        <div className="chat-sidebar-header">
          <div>
            <span className="section-kicker">MASA CHAT</span>
            <h2>الدردشة</h2>
          </div>

          <button className="chat-add-button">
            <Plus size={19} />
          </button>
        </div>

        <div className="chat-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="ابحث في المحادثات..."
          />
        </div>

        <div className="chat-section-header">
          <span>الرسائل المباشرة</span>

          <button>
            <Plus size={15} />
          </button>
        </div>

        <div className="conversation-list">
          {conversations.map((conversation) => (
            <button
              className={`conversation-item ${
                conversation.id === 1 ? "active" : ""
              }`}
              key={conversation.id}
            >
              <div className="chat-avatar-wrapper">

                <div className="chat-avatar">
                  {conversation.initials}
                </div>

                {conversation.online && (
                  <span className="online-indicator" />
                )}

              </div>

              <div className="conversation-content">
                <div className="conversation-top">
                  <strong>{conversation.name}</strong>
                  <span>{conversation.time}</span>
                </div>

                <div className="conversation-bottom">
                  <span>{conversation.message}</span>

                  {conversation.unread > 0 && (
                    <b>{conversation.unread}</b>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="chat-section-header channel-header">
          <span>القنوات والأقسام</span>

          <button>
            <Plus size={15} />
          </button>
        </div>

        <div className="channel-list">
          {channels.map((channel) => {
            const Icon = channel.icon;

            return (
              <button className="channel-item" key={channel.id}>
                <Icon size={17} />

                <span>{channel.name}</span>

                {channel.unread > 0 && (
                  <b>{channel.unread}</b>
                )}
              </button>
            );
          })}
        </div>

      </aside>

      {/* المحادثة */}
      <main className="chat-main">

        <header className="chat-main-header">

          <div className="chat-contact">

            <div className="chat-avatar-wrapper">
              <div className="chat-avatar large">AK</div>
              <span className="online-indicator" />
            </div>

            <div>
              <strong>أحمد خالد</strong>

              <span className="chat-status">
                <Circle size={7} fill="currentColor" />
                متصل الآن · قسم المبيعات
              </span>
            </div>

          </div>

          <div className="chat-header-actions">

            <button>
              <Phone size={18} />
            </button>

            <button>
              <Video size={19} />
            </button>

            <button>
              <Search size={18} />
            </button>

            <button>
              <MoreHorizontal size={20} />
            </button>

          </div>

        </header>

        {/* Context */}
        <div className="chat-context-bar">

          <div>
            <MessageSquare size={17} />

            <span>
              المحادثة مرتبطة بـ
            </span>

            <strong>
              العميل: شركة البناء الحديث
            </strong>
          </div>

          <button>
            فتح ملف العميل
          </button>

        </div>

        {/* الرسائل */}
        <div className="messages-area">

          <div className="chat-date-divider">
            <span>اليوم</span>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-row ${
                message.mine ? "mine" : ""
              }`}
            >

              {!message.mine && (
                <div className="message-avatar">
                  {message.initials}
                </div>
              )}

              <div className="message-wrapper">

                {!message.mine && (
                  <span className="message-sender">
                    {message.sender}
                  </span>
                )}

                <div className="message-bubble">
                  <p>{message.text}</p>
                  <span>{message.time}</span>
                </div>

              </div>

            </div>
          ))}

        </div>

        {/* كتابة رسالة */}
        <footer className="message-composer">

          <button className="composer-tool">
            <Paperclip size={19} />
          </button>

          <button className="composer-tool">
            <Smile size={19} />
          </button>

          <input
            type="text"
            placeholder="اكتب رسالة..."
          />

          <button className="send-message">
            <Send size={18} />
          </button>

        </footer>

      </main>

    </section>
  );
}