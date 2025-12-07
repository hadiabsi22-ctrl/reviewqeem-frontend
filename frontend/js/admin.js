/* ===============================================================
   admin.js - Final Version (FIXED FOR MASTER + NEW BACKEND)
   =============================================================== */

const API_BASE = "https://reviewqeem-backend-1.onrender.com/api";

/* ===============================================================
   Auth System
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
                credentials: "include", // مهم جدًا للكوكيز
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            console.log("LOGIN RESPONSE:", data);

            if (response.ok && data.success) {
                // السيرفر يرجّع user وليس admin
                const user = data.user;

                this.currentUser = user;
                this.isAuthenticated = true;

                // حفظ الجلسة
                localStorage.setItem(
                    "admin_session_reviewqeem",
                    JSON.stringify({
                        data: user,
                        expires: Date.now() + 24 * 60 * 60 * 1000
                    })
                );

                return { success: true, admin: user };
            } else {
                return { success: false, message: data.message || "فشل تسجيل الدخول" };
            }

        } catch (error) {
            console.error("Login error:", error);
            return { success: false, message: "خطأ بالاتصال بالسيرفر" };
        }
    }

    // التحقق من الجلسة
    async checkSession() {
        try {
            // 1) تحقق من وجود جلسة محليًا
            const sessionRaw = localStorage.getItem("admin_session_reviewqeem");
            if (!sessionRaw) return { success: false };

            const session = JSON.parse(sessionRaw);
            if (!session.data || Date.now() > session.expires) {
                localStorage.removeItem("admin_session_reviewqeem");
                return { success: false };
            }

            // 2) تحقق من الجلسة عبر السيرفر
            const verifyReq = await fetch(`${API_BASE}/admin/auth/verify`, {
                method: "GET",
                credentials: "include"
            });

            const verifyData = await verifyReq.json();

            if (!verifyReq.ok || !verifyData.success) {
                localStorage.removeItem("admin_session_reviewqeem");
                return { success: false };
            }

            // السيرفر يرجّع user
            this.currentUser = verifyData.user;
            this.isAuthenticated = true;

            return { success: true, admin: verifyData.user };

        } catch (error) {
            console.error("Session verify error:", error);
            return { success: false };
        }
    }

    // تسجيل الخروج
    logout() {
        localStorage.removeItem("admin_session_reviewqeem");
        fetch(`${API_BASE}/admin/auth/logout`, { method: "POST", credentials: "include" });
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
   UI Handling
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
        const el = document.getElementById("adminEmail");

        if (el && admin) {
            el.textContent = admin.email;
        }
    }

    showMessage(msg, type = "info") {
        alert(msg);
    }
}

const adminUI = new AdminUI();

/* ===============================================================
   Event System
   =============================================================== */

class AdminEvents {
    init() {
        const form = document.getElementById("admin-login-form");
        if (form) form.addEventListener("submit", this.handleLogin.bind(this));

        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) logoutBtn.addEventListener("click", this.handleLogout.bind(this));

        const togglePass = document.getElementById("togglePassword");
        if (togglePass) togglePass.addEventListener("click", this.togglePasswordVisibility);
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const result = await adminAuth.login(email, password);

        if (result.success) {
            this.showStatus("تم تسجيل الدخول بنجاح ✔", "success");
            setTimeout(() => window.location.href = "admin.html", 800);
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
   Application Start
   =============================================================== */

class AdminApp {
    async init() {
        const events = new AdminEvents();
        events.init();

        // إذا كنا داخل admin.html → تحقق الجلسة
        if (window.location.pathname.includes("admin.html")) {
            const session = await adminAuth.checkSession();
            if (session.success) {
                adminUI.showDashboard();
            } else {
                adminUI.showLoginPage();
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new AdminApp().init();
});

console.log("✅ Admin system patched and running correctly");
