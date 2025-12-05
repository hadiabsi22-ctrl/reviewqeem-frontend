// js/reviews-list.js
// قائمة المراجعات - متكامل مع API + متوافق مع review-view و review-management

(function () {
  const API_BASE = window.API_BASE || "http://localhost:5000/api";

  // نخزن المراجعات هنا عشان تقدر تستخدمها صفحات ثانية
  window.allReviews = window.allReviews || [];

  // مساعد للحصول على أول عنصر موجود من قائمة IDs
  function getByIds(ids = []) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  const els = {
    container: null,
    count: null,
    searchInput: null,
    sortSelect: null,
    loading: null,
    empty: null,
  };

  function initElements() {
    els.container = getByIds(["reviews-list", "reviews-grid", "reviews-cards"]);
    els.count = getByIds(["reviews-count", "reviews-total"]);
    els.searchInput = getByIds(["reviews-search", "search-reviews"]);
    els.sortSelect = getByIds(["reviews-sort", "sort-reviews"]);
    els.loading = getByIds(["reviews-loading"]);
    els.empty = getByIds(["reviews-empty-state"]);

    // لو ما في كونتينر، نخلي الملف بس يوفر window.allReviews للباقي ونطلع
    if (!els.container) {
      console.warn(
        "⚠ reviews-list.js: لم يتم العثور على حاوية عرض المراجعات (reviews-list / reviews-grid / reviews-cards)"
      );
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  }

  function calcReadTime(text = "") {
    const words = text.trim().split(/\s+/).length || 0;
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} دقيقة قراءة تقريباً`;
  }

  function normalizeReview(raw) {
    if (!raw) return null;
    const id = raw._id || raw.id || raw.slug || "";
    const title = raw.title || raw.game_title || raw.gameName || "مراجعة بدون عنوان";
    const gameName = raw.gameName || raw.game_title || title;
    const rating =
      typeof raw.rating === "number"
        ? raw.rating
        : Number.parseFloat(raw.rating || "0") || 0;
    const summary = raw.summary || raw.quickSummary || "";
    const content = raw.content || "";
    const developer = raw.developer || "";
    const publisher = raw.publisher || "";
    const genre = raw.genre || "";
    const releaseDate = raw.releaseDate || raw.release_date || "";
    const tags = Array.isArray(raw.tags)
      ? raw.tags
      : typeof raw.tags === "string"
      ? raw.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const mainImage = raw.mainImage || raw.main_image || "";
    const coverImage = raw.coverImage || raw.cover_image || "";
    const screenshots = Array.isArray(raw.screenshots) ? raw.screenshots : [];
    const createdAt = raw.createdAt || raw.date || raw.publishedAt || "";

    return {
      ...raw,
      id,
      title,
      gameName,
      rating,
      summary,
      content,
      developer,
      publisher,
      genre,
      releaseDate,
      tags,
      mainImage,
      coverImage,
      screenshots,
      createdAt,
    };
  }

  function showLoading(show) {
    if (els.loading) {
      els.loading.style.display = show ? "flex" : "none";
    }
  }

  function showEmpty(show) {
    if (els.empty) {
      els.empty.style.display = show ? "block" : "none";
    } else if (els.container && show) {
      els.container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>لا توجد مراجعات بعد</h3>
          <p>ابدأ بإضافة أول مراجعة من لوحة التحكم.</p>
        </div>
      `;
    }
  }

  function updateCount(count) {
    if (els.count) {
      els.count.textContent = count;
    }
  }

  function getImageUrl(review) {
    if (review.coverImage) return review.coverImage;
    if (review.mainImage) return review.mainImage;
    if (review.screenshots && review.screenshots.length > 0)
      return review.screenshots[0];

    // صورة افتراضية
    return "images/default-review-cover.jpg";
  }

  function buildTagHtml(tags = []) {
    if (!tags.length) return "";
    return `
      <div class="card-tags">
        ${tags
          .map(
            (tag) => `
          <span class="tag">
            <i class="fas fa-hashtag"></i>
            ${tag}
          </span>
        `
          )
          .join("")}
      </div>
    `;
  }

  function buildCardHtml(review) {
    const imgUrl = getImageUrl(review);
    const dateText = formatDate(review.createdAt || review.releaseDate);
    const readTimeText = calcReadTime(review.content || review.summary || "");
    const ratingText = review.rating ? `${review.rating.toFixed(1)}/10` : "غير مقيم";

    const shortSummary =
      review.summary && review.summary.trim().length > 0
        ? review.summary.trim()
        : (review.content || "").split(/\s+/).slice(0, 35).join(" ") +
          (review.content && review.content.length > 0 ? "..." : "");

    const tagsHtml = buildTagHtml(review.tags);

    return `
      <article class="review-card" data-review-id="${review.id}">
        <div class="review-card-image" onclick="openReview('${review.id}')">
          <img src="${imgUrl}" alt="${review.gameName}" loading="lazy">
          <div class="review-card-rating-badge">
            <span class="rating-number">${review.rating.toFixed(1)}</span>
            <span class="rating-text">/10</span>
          </div>
        </div>
        <div class="review-card-body">
          <h2 class="review-card-title" onclick="openReview('${review.id}')">
            ${review.title}
          </h2>
          <p class="review-card-game">
            <i class="fas fa-gamepad"></i>
            ${review.gameName}
          </p>
          <div class="review-card-meta">
            <span>
              <i class="fas fa-calendar"></i>
              ${dateText}
            </span>
            <span>
              <i class="fas fa-clock"></i>
              ${readTimeText}
            </span>
          </div>
          <p class="review-card-summary">
            ${shortSummary}
          </p>
          ${tagsHtml}
          <div class="review-card-footer">
            <button class="btn btn-primary btn-sm" onclick="openReview('${review.id}')">
              <i class="fas fa-book-open"></i>
              قراءة المراجعة
            </button>
            <div class="review-card-rating-inline">
              <i class="fas fa-star"></i>
              <span>${ratingText}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderReviews(list) {
    if (!els.container) return;

    if (!list || list.length === 0) {
      els.container.innerHTML = "";
      showEmpty(true);
      updateCount(0);
      return;
    }

    showEmpty(false);
    updateCount(list.length);

    els.container.innerHTML = list.map(buildCardHtml).join("");
  }

  function applyFilters() {
    let filtered = [...window.allReviews];

    // بحث
    if (els.searchInput && els.searchInput.value.trim()) {
      const q = els.searchInput.value.trim().toLowerCase();
      filtered = filtered.filter((r) => {
        return (
          r.title.toLowerCase().includes(q) ||
          r.gameName.toLowerCase().includes(q) ||
          (r.genre && r.genre.toLowerCase().includes(q)) ||
          (r.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    // ترتيب
    if (els.sortSelect) {
      const sortValue = els.sortSelect.value;
      if (sortValue === "rating-desc") {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (sortValue === "rating-asc") {
        filtered.sort((a, b) => a.rating - b.rating);
      } else if (sortValue === "date-desc") {
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || b.releaseDate || 0) -
            new Date(a.createdAt || a.releaseDate || 0)
        );
      } else if (sortValue === "date-asc") {
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt || a.releaseDate || 0) -
            new Date(b.createdAt || b.releaseDate || 0)
        );
      }
    }

    renderReviews(filtered);
  }

  function setupFilters() {
    if (els.searchInput) {
      els.searchInput.addEventListener("input", () => {
        applyFilters();
      });
    }

    if (els.sortSelect) {
      els.sortSelect.addEventListener("change", () => {
        applyFilters();
      });
    }
  }

  async function fetchReviews() {
    showLoading(true);
    showEmpty(false);

    try {
      const res = await fetch(`${API_BASE}/reviews`);
      if (!res.ok) {
        throw new Error("فشل في جلب المراجعات من الخادم");
      }

      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map(normalizeReview).filter(Boolean)
        : [];

      // نخزنها بشكل عام
      window.allReviews = normalized;

      // افتراضي: ترتيب الأحدث أولاً
      normalized.sort(
        (a, b) =>
          new Date(b.createdAt || b.releaseDate || 0) -
          new Date(a.createdAt || a.releaseDate || 0)
      );

      renderReviews(normalized);
    } catch (err) {
      console.error("❌ خطأ في تحميل المراجعات:", err);
      if (els.container) {
        els.container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>خطأ في تحميل المراجعات</h3>
            <p>تأكد من تشغيل الخادم الخلفي ثم أعد تحميل الصفحة.</p>
          </div>
        `;
      }
      updateCount(0);
    } finally {
      showLoading(false);
    }
  }

  // دالة عامة لفتح المراجعة
  window.openReview = function (reviewId) {
    if (!reviewId) return;
    // اسم صفحة المراجعة: راعينا أن تكون review.html (مثل ما استخدمته قبل)
    window.location.href = `review.html?id=${encodeURIComponent(reviewId)}`;
  };

  // دالة عامة لإعادة تحميل القائمة من أي مكان
  window.reloadReviewsList = function () {
    fetchReviews();
  };

  document.addEventListener("DOMContentLoaded", () => {
    initElements();
    setupFilters();
    fetchReviews();
  });
})();
