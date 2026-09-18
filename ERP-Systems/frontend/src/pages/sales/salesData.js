
export const leads = [
  { id: "LD-2401", name: "أحمد سعيد", company: "Al Noor Hospital", source: "Website", status: "جديد", owner: "محمد العاصي", date: "18 Sep 2026" },
  { id: "LD-2402", name: "سارة خالد", company: "Future Contracting", source: "Referral", status: "تم التواصل", owner: "محمد العاصي", date: "18 Sep 2026" },
  { id: "LD-2403", name: "عمر فهد", company: "Riyadh Schools", source: "Exhibition", status: "مؤهل", owner: "محمد العاصي", date: "17 Sep 2026" },
  { id: "LD-2404", name: "لينا ناصر", company: "Advanced Tech", source: "LinkedIn", status: "موعد", owner: "أحمد سعيد", date: "17 Sep 2026" },
  { id: "LD-2405", name: "خالد أحمد", company: "Build & More", source: "Website", status: "جديد", owner: "سارة أحمد", date: "16 Sep 2026" },
  { id: "LD-2406", name: "فاطمة علي", company: "Al Salam Clinic", source: "Call", status: "مؤهل", owner: "محمد العاصي", date: "16 Sep 2026" },
];

export const opportunities = [
  { id: "OP-3101", name: "CCTV & Security System", customer: "Al Noor Hospital", value: 610000, stage: "Proposal", probability: 70, close: "15 Oct 2026" },
  { id: "OP-3102", name: "Network Infrastructure", customer: "Future Contracting", value: 430000, stage: "Negotiation", probability: 60, close: "20 Oct 2026" },
  { id: "OP-3103", name: "Access Control Project", customer: "Riyadh Schools", value: 310000, stage: "Qualified", probability: 50, close: "10 Nov 2026" },
  { id: "OP-3104", name: "Fire Alarm System", customer: "Al Salam Clinic", value: 275000, stage: "Proposal", probability: 65, close: "25 Oct 2026" },
  { id: "OP-3105", name: "Full Low-Current Package", customer: "Golden Tower", value: 1200000, stage: "Negotiation", probability: 40, close: "05 Nov 2026" },
  { id: "OP-3106", name: "Maintenance Contract", customer: "Advanced Tech", value: 180000, stage: "Qualified", probability: 55, close: "08 Nov 2026" },
];

export const activities = [
  { id: 1, subject: "اتصال بمدير المشتريات", related: "Al Noor Hospital", type: "Call", due: "اليوم 10:00", owner: "محمد العاصي", status: "Pending" },
  { id: 2, subject: "زيارة موقع", related: "Future Contracting", type: "Meeting", due: "اليوم 14:00", owner: "سارة أحمد", status: "Confirmed" },
  { id: 3, subject: "إرسال العرض المعدل", related: "Riyadh Schools", type: "Email", due: "غدًا", owner: "عمر حسن", status: "Pending" },
  { id: 4, subject: "متابعة العرض", related: "Golden Tower", type: "Task", due: "متأخر", owner: "محمد علي", status: "Overdue" },
  { id: 5, subject: "مناقشة فنية", related: "Al Salam Clinic", type: "Meeting", due: "21 Oct", owner: "لينا ناصر", status: "Confirmed" },
];

export const quotations = [
  { id: "QT-2026-001", customer: "Al Noor Hospital", opportunity: "CCTV & Security", amount: 850000, status: "Sent", valid: "30 Oct 2026" },
  { id: "QT-2026-002", customer: "Future Contracting", opportunity: "Network Infra", amount: 430000, status: "Viewed", valid: "10 Nov 2026" },
  { id: "QT-2026-003", customer: "Riyadh Schools", opportunity: "Access Control", amount: 310000, status: "Draft", valid: "18 Nov 2026" },
  { id: "QT-2026-004", customer: "Al Salam Clinic", opportunity: "Fire Alarm", amount: 275000, status: "Accepted", valid: "25 Oct 2026" },
  { id: "QT-2026-005", customer: "Golden Tower", opportunity: "Low-Current", amount: 1200000, status: "Expired", valid: "15 Oct 2026" },
];

export const orders = [
  { id: "SO-2026-001", customer: "Al Noor Hospital", date: "01 Oct 2026", value: 780000, status: "Confirmed", delivery: "15 Nov 2026" },
  { id: "SO-2026-002", customer: "Future Contracting", date: "05 Oct 2026", value: 410000, status: "In Progress", delivery: "20 Nov 2026" },
  { id: "SO-2026-003", customer: "Al Salam Clinic", date: "10 Oct 2026", value: 275000, status: "Delivered", delivery: "25 Oct 2026" },
  { id: "SO-2026-004", customer: "Advanced Tech", date: "14 Oct 2026", value: 180000, status: "In Progress", delivery: "30 Nov 2026" },
];

export const contracts = [
  { id: "CT-2026-001", customer: "Al Noor Hospital", type: "Supply & Install", value: 780000, start: "01 Oct 2026", end: "01 Oct 2027", status: "Active" },
  { id: "CT-2026-002", customer: "Advanced Tech", type: "Maintenance", value: 120000, start: "15 Oct 2026", end: "14 Oct 2027", status: "Active" },
  { id: "CT-2026-003", customer: "Al Salam Clinic", type: "AMC", value: 96000, start: "01 Jan 2026", end: "31 Dec 2026", status: "Expiring" },
  { id: "CT-2026-004", customer: "Riyadh Schools", type: "Support", value: 150000, start: "12 Oct 2026", end: "11 Oct 2027", status: "Active" },
];

export const money = (value) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
