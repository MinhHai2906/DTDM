# 🚀 Deploy Scripts Guide

## 📋 Tệp deployment có sẵn

### **1. `deploy.bat`** ✅ (Recommended)
**Tác dụng:** Copy frontend + Deploy Hosting

```
frontend/project → public → Firebase Hosting
```

**Cách dùng:**
1. Double-click `deploy.bat`
2. Chờ quá trình hoàn thành
3. Website sẽ live tại: https://web-dienthoai0-dtdm.firebaseapp.com

---

### **2. `deploy-full.bat`** 
**Tác dụng:** Copy frontend + Deploy tất cả (Hosting + Firestore Rules + Indexes)

```
frontend/project → public → Firebase Hosting
                        ↓
              Firestore Rules & Indexes
```

**Cách dùng:**
1. Double-click `deploy-full.bat`
2. Chờ quá trình hoàn thành
3. Website + Firestore sẽ được deploy

**Khi nào dùng:**
- Lần đầu deploy
- Có thay đổi Firestore rules
- Cần deploy tất cả components

---

### **3. `deploy-copy-only.bat`**
**Tác dụng:** Chỉ copy, không deploy

```
frontend/project → public (check trước khi deploy)
```

**Cách dùng:**
1. Double-click `deploy-copy-only.bat`
2. Kiểm tra file trong `public/` folder
3. Nếu okii, chạy `deploy.bat`

**Khi nào dùng:**
- Muốn xem trước file sẽ deploy
- Debug trước khi publish

---

## 🎯 Quy trình sử dụng

### **Lần đầu (Initial Deploy)**
```
1. Sửa code ở frontend/project/
2. Chạy deploy-full.bat
   ↓
   ✅ Website & Firestore live
```

### **Cập nhật sau này (Updates)**
```
1. Sửa code ở frontend/project/
2. Chạy deploy.bat
   ↓
   ✅ Website updated
```

---

## ✅ Kiểm tra trước deploy

```
✓ Frontend code ở: frontend/project/
✓ Đã login Firebase: firebase login
✓ Đã set project: firebase use web-dienthoai0-dtdm
```

---

## 🔧 Customize Project ID

Nếu project ID của bạn khác `web-dienthoai0-dtdm`, sửa các file:
- `deploy.bat`
- `deploy-full.bat`  
- `firebase.json`

Thay đổi: `web-dienthoai0-dtdm` → `your-project-id`

---

## 🆘 Troubleshooting

### Error: "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### Error: "Not logged in"
```bash
firebase login
firebase use web-dienthoai0-dtdm
```

### Deployment failed
1. Kiểm tra kết nối Internet
2. Xem log: `firebase deploy --debug`
3. Kiểm tra Firebase Project settings

---

## 📞 Hỗ trợ

- 📚 Docs: https://firebase.google.com/docs/hosting
- 🐛 Report issues: Check Firebase Console logs
- 💡 Ask: `firebase help`

---

**Generated:** 2026-04-16  
**Project:** PhoneStore  
**Status:** Ready to Deploy ✅
