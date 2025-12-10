// js/review-editor.js
BASE_URL: "https://reviewqeem.online/api",



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

    // رفع الصور داخل محتوى المراجعة إلى Upload Server
    images_upload_handler: async (blobInfo, success, failure) => {
        try {
            const file = blobInfo.blob();
            const filename = `${Date.now()}_${blobInfo.filename()}`;
            
            // إنشاء FormData
            const formData = new FormData();
            formData.append('file', file, filename);
            
            // رفع الملف لـ Upload Server
            const response = await fetch('http://84.247.170.23:3001/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success && result.url) {
                success(result.url); // http://84.247.170.23/api/uploads/filename.jpg
            } else {
                failure(result.message || 'فشل رفع الصورة');
            }
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


