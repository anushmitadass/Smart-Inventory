# 📦 Smart Inventory Monitor- Stock & Store
### *Intelligent Stock Tracking & Demand Forecasting Platform*

> Never run out of stock unexpectedly again!

Stock & Store is a full-stack smart inventory monitor built for small businesses, clinics, cafes, and organizations who are tired of managing spreadsheets and waking up to empty shelves.

---

## 🚀 Features

### 📦 Stock Management
- Add items with category, unit, minimum threshold, price, expiry date, and supplier notes
- Log stock **IN** (restocked) and **OUT** (consumed/sold) with every movement tracked
- Bulk update multiple items at once — perfect after a large delivery
- Full transaction history per item

### 🔔 Smart Alerts
- 🔴 Critical · 🟡 Low Stock · 🟢 Healthy — live status on every item
- Expiry alerts for items expiring within 30 days
- Reorder reminders for everything below minimum stock

### ⚡ ML Forecasting
- Predicts days until stockout using **Linear Regression** on past consumption
- Suggests how much to reorder based on 30-day usage patterns

### 📊 Reports & Analytics
- Monthly report — total restocked vs consumed, top 5 most used items
- Consumption trends chart — daily IN vs OUT over the last 7 days
- Total inventory value in ₹ across all items
- Waste tracker — log expired, damaged, or lost stock with reasons

### 📱 QR Codes & Suppliers
- Generate a QR code per item — scan to see live stock, expiry, and supplier info
- Supplier directory with contact details, lead times, and item linking

### 🔐 Auth & Logs
- Email/password login via **Supabase Auth**
- Every action logged with user email and timestamp in the Activity Log

### 🎨 UI
- Warm nude tones, Times New Roman, carousel layout
- Dark / Light mode toggle
- Clean, minimal, no clutter

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript |
| Backend | FastAPI, Python |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| ML | Scikit-learn, Pandas, NumPy |
| QR | qrcode (npm) |

---

## 🎯 Project Goal

Small businesses often rely on spreadsheets to manage inventory, leading to stock shortages, overstocking, and inefficient planning. **Stock & Store** provides a centralized platform that helps organizations proactively manage inventory through automation, analytics, and predictive insights.

---

## 📌 Key Benefits

- ✅ Reduce stock shortages
- ✅ Improve inventory visibility
- ✅ Optimize purchasing decisions
- ✅ Minimize dead stock
- ✅ Enable data-driven inventory planning

---

## 📊 Future Enhancements

- Multi-Branch Inventory Management
- Supplier Performance Analytics
- Automated Purchase Order Generation
- Inventory Anomaly Detection
- Mobile App

---


