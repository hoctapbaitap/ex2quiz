# 🚀 Hướng dẫn Deploy LaTeX Quiz Converter

## 📋 Tổng quan
LaTeX Quiz Converter là ứng dụng web tĩnh (static web app) có thể deploy lên nhiều platform khác nhau.

## 🌐 Các tùy chọn Hosting

### 1. 📁 **GitHub Pages** (Miễn phí)

#### Bước 1: Tạo Repository
```bash
# Tạo repo mới trên GitHub
# Upload toàn bộ thư mục latex-quiz-converter
```

#### Bước 2: Cấu hình GitHub Pages
1. Vào **Settings** > **Pages**
2. Chọn **Source**: Deploy from a branch
3. Chọn **Branch**: main
4. Chọn **Folder**: / (root)
5. Click **Save**

#### Bước 3: Truy cập
- URL: `https://username.github.io/repository-name`
- Ví dụ: `https://thaydonet.github.io/latex-quiz-converter`

### 2. 🔥 **Firebase Hosting** (Miễn phí)

#### Bước 1: Cài đặt Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### Bước 2: Khởi tạo project
```bash
cd latex-quiz-converter
firebase init hosting
```

#### Bước 3: Cấu hình firebase.json
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### Bước 4: Deploy
```bash
firebase deploy
```

### 3. ⚡ **Vercel** (Miễn phí)

#### Bước 1: Cài đặt Vercel CLI
```bash
npm install -g vercel
```

#### Bước 2: Deploy
```bash
cd latex-quiz-converter
vercel
```

#### Bước 3: Cấu hình vercel.json (tùy chọn)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4. 🌊 **Netlify** (Miễn phí)

#### Cách 1: Drag & Drop
1. Vào [netlify.com](https://netlify.com)
2. Kéo thả thư mục `latex-quiz-converter`
3. Tự động deploy

#### Cách 2: Git Integration
1. Push code lên GitHub
2. Connect repository với Netlify
3. Auto deploy khi có commit mới

### 5. 🏠 **Self-hosted** (VPS/Server)

#### Với Apache
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/latex-quiz-converter
    
    <Directory /var/www/latex-quiz-converter>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Với Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/latex-quiz-converter;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔧 Cấu hình cho Production

### 1. Tối ưu hóa
- Minify CSS/JS (tùy chọn)
- Optimize images
- Enable GZIP compression

### 2. HTTPS
- Sử dụng Let's Encrypt (miễn phí)
- Hoặc CloudFlare (miễn phí)

### 3. CDN
- CloudFlare
- AWS CloudFront
- Google Cloud CDN

## 📱 PWA (Progressive Web App)

### Thêm Service Worker
Tạo file `sw.js`:
```javascript
const CACHE_NAME = 'latex-quiz-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/quiz.html',
  '/results.html',
  '/css/style.css',
  '/js/dashboard.js',
  '/js/quiz.js',
  '/js/results.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### Thêm Web App Manifest
Tạo file `manifest.json`:
```json
{
  "name": "LaTeX Quiz Converter",
  "short_name": "Quiz Converter",
  "description": "Convert LaTeX to interactive quizzes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🔒 Bảo mật

### Content Security Policy
Thêm vào `<head>`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; 
               img-src 'self' data: https:;">
```

### Headers bảo mật
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## 📊 Analytics (tùy chọn)

### Google Analytics
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🚀 Khuyến nghị

### Cho người mới bắt đầu:
1. **GitHub Pages** - Miễn phí, dễ sử dụng
2. **Netlify** - Drag & drop, auto deploy

### Cho production:
1. **Vercel** - Performance cao, CDN global
2. **Firebase Hosting** - Tích hợp Google services
3. **Self-hosted** - Kiểm soát hoàn toàn

## 🔧 Troubleshooting

### Lỗi thường gặp:
1. **404 Error**: Kiểm tra routing configuration
2. **CORS Error**: Đảm bảo serve từ HTTP server
3. **MathJax không load**: Kiểm tra CSP headers

### Debug:
```bash
# Test local
python -m http.server 8000
# hoặc
npx serve .
```

## 📞 Hỗ trợ

- GitHub Issues: [Repository Issues](https://github.com/username/latex-quiz-converter/issues)
- Documentation: [Wiki](https://github.com/username/latex-quiz-converter/wiki)
