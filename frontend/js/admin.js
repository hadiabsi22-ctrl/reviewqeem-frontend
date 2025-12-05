/* ===============================================================
   admin.js - نظام الإدارة (الإصدار النهائي)
   =============================================================== */

// API Base URL
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : (window.location.origin + '/api');

/* ===============================================================
   نظام المصادقة
   =============================================================== */

class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // تسجيل الدخول
    async login(email, password) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/admin/auth/login`, {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.admin;
                this.isAuthenticated = true;

                // حفظ الجلسة
                localStorage.setItem(
                    "admin_session_reviewqeem",
                    JSON.stringify({
                        data: data.admin,
                        expires: Date.now() + (24 * 60 * 60 * 1000)
                    })
                );

                return { success: true, admin: data.admin };
            } else {
                return { success: false, message: data.message || 'فشل تسجيل الدخول' };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: "خطأ بالاتصال" };
        }
    }

    // التحقق من الجلسة
    async checkSession() {
        try {
            const sessionRaw = localStorage.getItem("admin_session_reviewqeem");
            if (!sessionRaw) return { success: false };

            const session = JSON.parse(sessionRaw);
            if (!session.data || Date.now() > session.expires) {
                localStorage.removeItem("admin_session_reviewqeem");
                return { success: false };
            }

            this.currentUser = session.data;
            this.isAuthenticated = true;
            return { success: true, admin: session.data };

        } catch (e) {
            console.error("Session check error:", e);
            return { success: false };
        }
    }

    // تسجيل الخروج
    logout() {
        localStorage.removeItem("admin_session_reviewqeem");
        this.currentUser = null;
        this.isAuthenticated = false;
        window.location.href = "admin-login.html";
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }
}

const adminAuth = new AdminAuth();

/* ===============================================================
   واجهة المستخدم
   =============================================================== */

class AdminUI {
    showLoginPage() {
        window.location.href = "admin-login.html";
    }

    showDashboard() {
        const main = document.querySelector(".main-content");
        const sidebar = document.querySelector(".sidebar");

        if (main) main.style.display = "block";
        if (sidebar) sidebar.style.display = "block";

        this.updateUserInfo();
    }

    updateUserInfo() {
        const admin = adminAuth.getCurrentUser();
        const emailEl = document.getElementById("adminEmail");

        if (emailEl && admin) {
            emailEl.textContent = admin.email;
        }
    }

    showMessage(msg, type = "info") {
        alert(msg);
    }
}

const adminUI = new AdminUI();

/* ===============================================================
   أحداث الواجهة
   =============================================================== */

class AdminEvents {
    init() {
        const loginForm = document.getElementById("admin-login-form");
        if (loginForm) loginForm.addEventListener("submit", this.handleLogin.bind(this));

        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.addEventListener("click", this.handleLogout.bind(this));

        const togglePass = document.getElementById("togglePassword");
        if (togglePass) togglePass.addEventListener("click", this.togglePasswordVisibility.bind(this));
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const btn = document.getElementById("loginBtn");
        btn.classList.add("loading");

        const result = await adminAuth.login(email, password);

        btn.classList.remove("loading");

        if (result.success) {
            this.showStatus("تم تسجيل الدخول بنجاح ✔", "success");
            setTimeout(() => {
                window.location.href = "admin.html";
            }, 800);
        } else {
            this.showStatus(result.message, "error");
        }
    }

    handleLogout() {
        adminAuth.logout();
    }

    togglePasswordVisibility() {
        const pass = document.getElementById("password");
        pass.type = pass.type === "password" ? "text" : "password";
    }

    showStatus(msg, type) {
        const box = document.getElementById("status");
        box.textContent = msg;
        box.className = `status status-${type}`;
        box.style.display = "block";
    }
}

/* ===============================================================
   بدء التطبيق
   =============================================================== */

class AdminApp {
    async init() {
        const events = new AdminEvents();
        events.init();

        if (window.location.pathname.includes("admin.html")) {
            const check = await adminAuth.checkSession();
            if (check.success) {
                adminUI.showDashboard();
            } else {
                adminUI.showLoginPage();
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const app = new AdminApp();
    app.init();
});

console.log("✅ Admin system loaded successfully");

