# LaTeX to Quiz Converter

Ứng dụng web chuyển đổi LaTeX format ex-test thành quiz online tương tác với đầy đủ tính năng quản lý và thi online.

## 🌟 Tính năng chính

### 📝 Dashboard Admin
- **LaTeX Parser**: Chuyển đổi format `\begin{ex}...\end{ex}` thành quiz
- **Live Preview**: Xem trước câu hỏi được convert real-time
- **Validation**: Kiểm tra cú pháp LaTeX và báo lỗi chi tiết
- **Quiz Management**: Quản lý danh sách quiz đã tạo
- **Math Rendering**: Hỗ trợ hiển thị công thức toán học với MathJax

### 🎯 Thi Online
- **Timer**: Đếm ngược thời gian thi với cảnh báo
- **Navigation**: Di chuyển giữa các câu hỏi dễ dàng
- **Question Grid**: Xem tổng quan tiến độ làm bài
- **Auto-save**: Lưu đáp án tự động
- **Pause/Resume**: Tạm dừng và tiếp tục bài thi
- **Submit Confirmation**: Xác nhận trước khi nộp bài

### 📊 Kết quả & Thống kê
- **Detailed Results**: Xem chi tiết từng câu trả lời
- **Performance Chart**: Biểu đồ tiến bộ theo thời gian
- **Statistics**: Thống kê tổng quan về điểm số
- **Export Data**: Xuất kết quả ra JSON, CSV, TXT
- **Grade System**: Hệ thống xếp loại A-F

## 🚀 Cách sử dụng

### 1. Tạo Quiz từ LaTeX

1. Mở trang **Dashboard** (`index.html`)
2. Dán LaTeX code vào khung bên trái
3. Nhấn **Convert** để chuyển đổi
4. Xem preview ở khung bên phải
5. Nhấn **Lưu Quiz** để lưu

### 2. Format LaTeX hỗ trợ

```latex
\begin{ex} % Câu 1
Cho khối chóp $O.ABC$ có $OA$ vuông góc với mặt phẳng $\left( {ABC} \right)$, tam giác $ABC$ vuông tại $A$ và $OA = 2$, $AB = 3$, $AC = 6$. Thể tích của khối chóp $O.ABC$ bằng.
\choice
    {$36$}
    {\True $6$}
    {$12$}
    {$18$}
\loigiai{$V = \dfrac{1}{3}OA.{S_{ABC}}$ $= \dfrac{1}{3}OA.\dfrac{1}{2}.AB.AC$ $= \dfrac{1}{6}.2.3.6 = 6$}
\end{ex}
```

**Cú pháp:**
- `\begin{ex}...\end{ex}`: Bao quanh mỗi câu hỏi
- `\choice`: Bắt đầu danh sách đáp án
- `{\True đáp án}`: Đánh dấu đáp án đúng
- `\loigiai{...}`: Lời giải (tùy chọn)
- `$...$`: Công thức toán học LaTeX

### 3. Thi Online

1. Vào trang **Thi Online** (`quiz.html`)
2. Chọn quiz từ danh sách
3. Làm bài trong thời gian quy định
4. Sử dụng phím tắt:
   - `←/→`: Chuyển câu hỏi
   - `1-6`: Chọn đáp án
   - `Esc`: Tạm dừng
5. Nộp bài và xem kết quả

### 4. Xem Kết quả

1. Vào trang **Kết Quả** (`results.html`)
2. Xem thống kê tổng quan
3. Lọc theo quiz hoặc sắp xếp
4. Click vào kết quả để xem chi tiết
5. Xuất dữ liệu nếu cần

## 🛠️ Cài đặt

### Yêu cầu
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)
- Không cần server, chạy trực tiếp từ file

### Cách chạy
1. Tải toàn bộ thư mục `latex-quiz-converter`
2. Mở file `index.html` bằng trình duyệt
3. Hoặc chạy local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

## 📁 Cấu trúc thư mục

```
latex-quiz-converter/
├── index.html          # Dashboard admin
├── quiz.html           # Trang thi online  
├── results.html        # Trang kết quả
├── css/
│   └── style.css       # Styles chính
├── js/
│   ├── latex-parser.js # Parser LaTeX
│   ├── quiz-manager.js # Quản lý dữ liệu
│   ├── dashboard.js    # Logic dashboard
│   ├── quiz.js         # Logic thi online
│   ├── results.js      # Logic kết quả
│   └── utils.js        # Utilities
└── README.md           # Hướng dẫn này
```

## 🔧 Tính năng kỹ thuật

### Frontend
- **HTML5/CSS3/JavaScript**: Vanilla JS, không framework
- **Responsive Design**: Tương thích mobile/tablet
- **Local Storage**: Lưu trữ dữ liệu trên browser
- **MathJax**: Render công thức toán học
- **Progressive Web App**: Có thể cài đặt như app

### Parser LaTeX
- **Regex-based**: Phân tích cú pháp LaTeX
- **Error Handling**: Báo lỗi chi tiết
- **Validation**: Kiểm tra tính hợp lệ
- **Math Processing**: Xử lý công thức toán

### Data Management
- **JSON Storage**: Lưu trữ dạng JSON
- **Import/Export**: Sao lưu và khôi phục
- **Caching**: Cache để tăng hiệu suất
- **Compression**: Nén dữ liệu tiết kiệm bộ nhớ

## 🎨 Giao diện

### Design System
- **Color Palette**: Gradient xanh tím chuyên nghiệp
- **Typography**: Font Inter hiện đại
- **Icons**: Font Awesome 6
- **Animations**: Smooth transitions
- **Dark Mode**: Hỗ trợ chế độ tối (tùy chọn)

### Responsive
- **Desktop**: Layout 2 cột tối ưu
- **Tablet**: Layout adaptive
- **Mobile**: Single column, touch-friendly

## 🔒 Bảo mật & Riêng tư

- **Client-side Only**: Dữ liệu chỉ lưu trên máy người dùng
- **No Server**: Không gửi dữ liệu lên server
- **XSS Protection**: Sanitize input để tránh XSS
- **Local Storage**: Dữ liệu an toàn trong browser

## 🚀 Tối ưu hóa

### Performance
- **Lazy Loading**: Tải nội dung khi cần
- **Debouncing**: Giảm số lần xử lý
- **Caching**: Cache kết quả parser
- **Minification**: Code được tối ưu

### UX/UI
- **Loading States**: Hiển thị trạng thái loading
- **Error Handling**: Xử lý lỗi user-friendly
- **Keyboard Shortcuts**: Phím tắt tiện lợi
- **Toast Notifications**: Thông báo rõ ràng

## 🐛 Troubleshooting

### Lỗi thường gặp

1. **"Không tìm thấy \\begin{ex}"**
   - Kiểm tra cú pháp LaTeX
   - Đảm bảo có `\begin{ex}` và `\end{ex}`

2. **"Không thể phân tích choices"**
   - Kiểm tra format `\choice`
   - Đảm bảo có ít nhất 2 đáp án
   - Đánh dấu đáp án đúng bằng `\True`

3. **Math không hiển thị**
   - Kiểm tra kết nối internet (MathJax CDN)
   - Refresh trang
   - Kiểm tra cú pháp LaTeX math

4. **Dữ liệu bị mất**
   - Kiểm tra Local Storage của browser
   - Không xóa dữ liệu browser
   - Backup thường xuyên

### Browser Support
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📝 License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo issue hoặc pull request.

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra phần Troubleshooting
2. Xem console browser để debug
3. Tạo issue với thông tin chi tiết

---

**Phát triển bởi AI Assistant** 🤖  
*Ứng dụng được tối ưu cho giáo dục và đào tạo*
