

const GOOGLE_AUTH_CONFIG = {
    
    CLIENT_ID: '0338403318954-48gt9k0aqcq6mr6phjfe7qfes26hjcgb.apps.googleusercontent.com', // ⚠️ Thay đổi this với Client ID của bạn
    SCOPE: 'profile email',
    DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/plus/v1/rest'],
    APIKEY: '', // Tuỳ chọn: API Key từ Google Cloud Console
};

// Kiểm tra xem Google API Library đã tải chưa
let googleScriptLoaded = false;

/**
 * Load Google API Script từ CDN
 * @returns {Promise<void>}
 */
function loadGoogleScript() {
    return new Promise((resolve, reject) => {
        if (googleScriptLoaded) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            googleScriptLoaded = true;
            resolve();
        };
        
        script.onerror = () => {
            console.error('❌ Lỗi: Không thể tải Google API Script');
            reject(new Error('Failed to load Google Script'));
        };
        
        document.head.appendChild(script);
    });
}
