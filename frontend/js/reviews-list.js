/* ============================================================
   ReviewQeem – REVIEWS LIST PAGE
   عرض قائمة المراجعات بالكامل
============================================================ */

console.log("📌 reviews-list.js Loaded");

const API_BASE = "https://reviewqeem-backend.onrender.com/api";
 
    ? 'http://localhost:5000' 
    : window.location.origin);

// عناصر الصفحة
const reviewsContainer = document.getElementById("reviews-list");
const loadingBox = document.getElementById("loading-box");
const emptyBox = document.getElementById("empty-box");

// ============================================================
// 📌 تحميل كل المراجعات
// ============================================================
async function loadAllReviews() {
    try {
        const res = await fetch(`${API_BASE}/api/reviews/published`);
        if (!res.ok) {
            throw new Error("فشل في جلب المراجعات من الخادم");
        }
        
        const data = await res.json();
        
        // Handle both response formats: { success, reviews } or { success, data } or direct array
        const reviewsArray = data.reviews || data.data || (Array.isArray(data) ? data : []);

        if (!Array.isArray(reviewsArray) || reviewsArray.length === 0) {
            showEmpty();
            return;
        }

        renderReviews(reviewsArray);
    } catch (err) {
        console.log("❌ Error loading reviews:", err);
        showEmpty();
    }
}

// ============================================================
// 📌 عرض حالة عدم وجود مراجعات
// ============================================================
function showEmpty() {
    loadingBox.style.display = "none";
    emptyBox.style.display = "block";
}

// ============================================================
// 📌 عرض المراجعات
// ============================================================
function renderReviews(list) {
    loadingBox.style.display = "none";
    reviewsContainer.innerHTML = "";

    // ترتيب الأحدث
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.forEach((r) => {
        const card = document.createElement("div");
        card.className = "review-card";
        card.onclick = () => openReview(r.id);

        let img = r.cover_image || r.coverImage || r.mainImage || "";
        if (!img || img.includes("undefined") || img.includes("null") || img === "") {
            img = "/uploads/images/default/default-game.jpg"; // صورة افتراضية
        }
        // Ensure full URL if relative path
        if (img && !img.startsWith("http") && !img.startsWith("/")) {
            img = "/" + img;
        }

        card.innerHTML = `
            <div class="review-card-image">
                <img src="${img}" alt="${r.title}">
                <span class="review-rating">${r.rating}/10</span>
            </div>

            <div class="review-card-content">
                <h3 class="review-title">${r.title}</h3>

                <p class="review-game-name">
                    <i class="fas fa-gamepad"></i> ${r.gameName || "غير معروف"}
                </p>

                <p class="review-summary">
                    ${r.summary || r.content?.slice(0, 120) + "..." || ""}
                </p>

                <div class="review-info">
                    <span><i class="fas fa-calendar"></i> ${new Date(r.createdAt).toLocaleDateString("ar-SA")}</span>
                    <span><i class="fas fa-tag"></i> ${r.genre || "بدون نوع"}</span>
                </div>

                <div class="review-platforms">
                    ${renderPlatforms(r.platforms)}
                </div>
            </div>
        `;

        reviewsContainer.appendChild(card);
    });
}

// ============================================================
// 📌 عرض منصات الشراء كأيقونات
// ============================================================
function renderPlatforms(platforms = []) {
    if (!platforms || platforms.length === 0) return "";

    return platforms
        .map((p) => {
            const name = p.name.toLowerCase();
            let icon = "fa-store";

            if (name.includes("steam")) icon = "fa-steam";
            if (name.includes("playstation") || name.includes("ps")) icon = "fa-playstation";
            if (name.includes("xbox")) icon = "fa-xbox";
            if (name.includes("nintendo") || name.includes("switch")) icon = "fa-nintendo-switch";

            return `
                <span class="platform-icon">
                    <i class="fab ${icon}"></i>
                </span>
            `;
        })
        .join("");
}

// ============================================================
// 📌 فتح المراجعة
// ============================================================
function openReview(id) {
    window.location.href = `review.html?id=${id}`;
}

// ============================================================
// 📌 بدأ التشغيل
// ============================================================
document.addEventListener("DOMContentLoaded", loadAllReviews);

