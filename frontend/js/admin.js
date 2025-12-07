/* ===============================================================
   admin.js - Original Full Version (Working)
   =============================================================== */

const API_BASE = "https://reviewqeem-backend-1.onrender.com/api";

/* ===============================================================
   AUTH SYSTEM
   =============================================================== */
class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // تسجيل الدخول
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE}/admin/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.admin;

                // حفظ الجلسة 24 ساعة
                localStorage.setItem(
                    "admin_session_reviewqeem",
                    JSON.stringify({
                        data: data.admin,
                        token: data.token,
                        expires: Date.now() + 24 * 60 * 60 * 1000
                    })
                );

                return { success: true };
            }

            return { success: false, message: data.message };

        } catch (err) {
            console.error("Login error:", err);
            return { success: false, message: "خطأ في الاتصال بالسيرفر" };
        }
    }

    // التحقق من الجلسة
    async checkSession() {
        const raw = localStorage.getItem("admin_session_reviewqeem");
        if (!raw) return { success: false };

        const session = JSON.parse(raw);

        if (!session.data || Date.now() > session.expires) {
            localStorage.removeItem("admin_session_reviewqeem");
            return { success: false };
        }

        this.currentUser = session.data;
        this.isAuthenticated = true;

        return { success: true, admin: session.data };
    }

    logout() {
        localStorage.removeItem("admin_session_reviewqeem");
        this.currentUser = null;
        this.isAuthenticated = false;
        window.location.href = "admin-login.html";
    }

    getUser() {
        return this.currentUser;
    }
}

const adminAuth = new AdminAuth();

/* ===============================================================
   UI SYSTEM
   =============================================================== */
class AdminUI {
    updateAdminEmail() {
        const el = document.getElementById("adminEmail");
        if (el && adminAuth.currentUser) {
            el.textContent = adminAuth.currentUser.email;
        }
    }

    showStatus(msg, type = "info") {
        const box = document.getElementById("status");
        if (!box) return;

        box.textContent = msg;
        box.className = `status status-${type}`;
        box.style.display = "block";
    }
}

const adminUI = new AdminUI();

/* ===============================================================
   EVENTS SYSTEM
   =============================================================== */
class AdminEvents {
    init() {
        const loginForm = document.getElementById("admin-login-form");
        if (loginForm) {
            loginForm.addEventListener("submit", this.handleLogin.bind(this));
        }

        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", adminAuth.logout);
        }

        const togglePass = document.getElementById("togglePassword");
        if (togglePass) {
            togglePass.addEventListener("click", () => {
                const pass = document.getElementById("password");
                pass.type = pass.type === "password" ? "text" : "password";
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const pass = document.getElementById("password").value.trim();

        const result = await adminAuth.login(email, pass);

        if (result.success) {
            adminUI.showStatus("تم تسجيل الدخول بنجاح ✔", "success");

            setTimeout(() => {
                window.location.href = "admin.html";
            }, 700);
        } else {
            adminUI.showStatus(result.message, "error");
        }
    }
}

/* ===============================================================
   MAIN APP
   =============================================================== */
class AdminApp {
    async init() {
        const events = new AdminEvents();
        events.init();

        // إذا كان داخل admin.html
        if (window.location.pathname.includes("admin.html")) {
            const session = await adminAuth.checkSession();

            if (!session.success) {
                window.location.href = "admin-login.html";
                return;
            }

            adminUI.updateAdminEmail();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new AdminApp().init();
});
