// frontend/js/review-editor.js
const API = "https://reviewqeem-backend.onrender.com/api";


/* ======================================================
   1) TinyMCE + رفع الصور إلى Firebase
====================================================== */
tinymce.init({
    selector: "#review-content",
    plugins: "image media link lists table code fullscreen autoresize",
    toolbar:
        "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | image media link | code fullscreen",
    menubar: false,
    height: 480,
    directionality: "rtl",
    language: "ar",
    content_style: "body { background:#222; color:#ddd; font-size:16px; }",

    // رفع الصور داخل محتوى المراجعة إلى Firebase Storage
    images_upload_handler: async (blobInfo, success, failure) => {
        try {
            const file = blobInfo.blob();
            const name = `reviews/${Date.now()}_${file.name}`;
            const ref = storage.ref().child(name);

            await ref.put(file);
            const url = await ref.getDownloadURL();
            success(url);
        } catch (err) {
            console.error(err);
            failure("فشل رفع الصورة");
        }
    },
});

/* ======================================================
   2) إرسال المراجعة الجديدة
====================================================== */
document.getElementById("submit-review").addEventListener("click", async () => {
    const title = document.getElementById("review-title").value.trim();
    const gameName = document.getElementById("review-game").value.trim(); // اسم اللعبة
    const summary = document.getElementById("review-summary").value.trim();

    const coverImage = document.getElementById("review-image").value.trim();
    const youtube = document.getElementById("review-youtube").value.trim();

    const pros = document.getElementById("review-pros").value.trim();
    const cons = document.getElementById("review-cons").value.trim();
    const rating = parseInt(document.getElementById("review-rating").value, 10);

    const content = tinymce.get("review-content").getContent();

    if (!title || !content || !gameName) {
        alert("العنوان + اسم اللعبة + محتوى المراجعة مطلوب");
        return;
    }

    const review = {
        title,
        gameName,
        summary,
        coverImage,   // يتم تحويله في الباك إند إلى imgSmall / imgLarge
        youtube,
        content,
        pros,
        cons,
        rating,
        createdAt: Date.now(),
    };

    try {
        // جلب توكن الأدمن من localStorage
        const token = localStorage.getItem("ADMIN_TOKEN");
        if (!token) {
            alert("يجب تسجيل الدخول كأدمن أولاً.");
            return;
        }

        const res = await fetch(`${API}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // مهم للحماية (protect, adminOnly)
            },
            body: JSON.stringify(review),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "خطأ أثناء الحفظ");
            return;
        }

        alert("✔️ تم نشر المراجعة بنجاح");
        window.location.href = "reviews-list.html";
    } catch (err) {
        console.error(err);
        alert("خطأ في الاتصال بالسيرفر");
    }
});

