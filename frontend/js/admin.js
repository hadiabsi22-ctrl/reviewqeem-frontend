/* ===============================================================
   admin.js - نظام الإدارة (نسخة الكوكيز النهائية)
   - تسجيل الدخول
   - التحقق من الجلسة في الصفحات الإدارية
   - تسجيل الخروج
   =============================================================== */

// =============================
// إعداد عنوان الـ API
// =============================
const API_BASE = "https://reviewqeem.online/api";



// اسم مسار صفحات لوحة التحكم
const ADMIN_DASHBOARD_PAGE = "admin.html";
const ADMIN_LOGIN_PAGE = "admin-login.html";

/* ===============================================================
   دوال مساعدة عامة
   =============================================================== */

// هل أنا الآن في صفحة تسجيل الدخول؟
function isLoginPage() {
    return window.location.pathname.endsWith(ADMIN_LOGIN_PAGE);
}

// هل أنا في صفحة من صفحات لوحة التحكم (غير صفحة تسجيل الدخول)؟
function isAdminPage() {
    return !isLoginPage();
}

// إظهار رسالة في صندوق الـ status (في صفحة تسجيل الدخول)
function showStatus(message, type = "info") {
    const box = document.getElementById("status");
    if (!box) return;

    box.textContent = message;
    box.className = `status status-${type}`;
    box.style.display = "block";
}

// تحديث الإيميل في الهيدر (لو موجود)
function updateAdminEmail(admin) {
    const emailEl = document.getElementById("adminEmail");
    if (emailEl && admin && admin.email) {
        emailEl.textContent = admin.email;
    }
}

/* ===============================================================
   API Calls (باستخدام Cookies)
   =============================================================== */

async function apiLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE}/admin/auth/login`, {
            method: "POST",
            credentials: "include", // مهم جداً لإرسال الكوكيز
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success) {
            return { success: true, admin: data.admin || null };
        }

        return {
            success: false,
            message: data.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        };
    } catch (error) {
        console.error("Login request error:", error);
        return { success: false, message: "تعذر الاتصال بالسيرفر" };
    }
}

async function apiVerifySession() {
    try {
        const response = await fetch(`${API_BASE}/admin/auth/verify`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success) {
            return { success: true, admin: data.admin || null };
        }

        // 401 أو أي رد آخر يعني الجلسة غير صالحة
        return { success: false };
    } catch (error) {
        console.error("Verify session error:", error);
        return { success: false };
    }
}

async function apiLogout() {
    try {
        const response = await fetch(`${API_BASE}/admin/auth/logout`, {
            method: "POST", // أو GET حسب ما عاملها في الباك اند
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        // حتى لو ما رجع success، بنعتبر الجلسة منتهية
        return true;
    } catch (error) {
        console.error("Logout error:", error);
        return false;
    }
}

/* ===============================================================
   منطق صفحة تسجيل الدخول
   =============================================================== */

function initLoginPage() {
    const form = document.getElementById("admin-login-form");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginBtn = document.getElementById("loginBtn");

    if (!form) return;

    // إظهار/إخفاء كلمة المرور
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            passwordInput.type =
                passwordInput.type === "password" ? "text" : "password";
        });
    }

    // حدث تسجيل الدخول
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showStatus("يرجى إدخال البريد الإلكتروني وكلمة المرور", "error");
            return;
        }

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = "جاري تسجيل الدخول...";
        }

        const result = await apiLogin(email, password);

        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = "تسجيل الدخول";
        }

        if (result.success) {
            showStatus("تم تسجيل الدخول بنجاح ✔", "success");

            // بعد نجاح تسجيل الدخول نذهب للوحة التحكم
            setTimeout(() => {
                window.location.href = ADMIN_DASHBOARD_PAGE;
            }, 800);
        } else {
            showStatus(result.message, "error");
        }
    });
}

/* ===============================================================
   منطق صفحات لوحة التحكم (admin.html وما يشبهها)
   =============================================================== */

async function initProtectedAdminPage() {
    // 1) تحقق من الجلسة
    const session = await apiVerifySession();

    if (!session.success) {
        // الجلسة غير صالحة → تحويل لصفحة تسجيل الدخول
        window.location.href = ADMIN_LOGIN_PAGE;
        return;
    }

    // 2) الجلسة صالحة → حدّث الإيميل في الهيدر (إن وجد)
    updateAdminEmail(session.admin);

    // 3) اربط زر تسجيل الخروج إن وجد
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            await apiLogout();
            window.location.href = ADMIN_LOGIN_PAGE;
        });
    }

    console.log("✅ admin session verified for:", session.admin?.email);
}

/* ===============================================================
   نقطة البداية
   =============================================================== */

document.addEventListener("DOMContentLoaded", () => {
    if (isLoginPage()) {
        // أنا في admin-login.html
        initLoginPage();
    } else {
        // أي صفحة إدارية أخرى (admin.html, comments-admin.html, ... إلخ)
        initProtectedAdminPage();
    }
});

console.log("✅ Admin JS (cookie-based) loaded");


