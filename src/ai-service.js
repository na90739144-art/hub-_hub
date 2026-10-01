/* ==========================================================================
   HUB HUB — AI SERVICE LAYER (فرانت‌اند)
   کلید هوش مصنوعی اینجا نیست؛ فقط روی سرور (Render) نگهداری می‌شود.
   فقط آدرس سرور را پایین قرار بده.
   ========================================================================== */

/** آدرس سرور Render بعد از دیپلوی، مثلاً: https://hub-hub-api.onrender.com/api/ai */
const AI_BACKEND_URL = "https://hub-hub.onrender.com/api/ai";

async function getAIResponse(userText, section) {
  if (!AI_BACKEND_URL || AI_BACKEND_URL.includes("YOUR-SERVICE-NAME")) {
    await new Promise((r) => setTimeout(r, 600));
    return (
      "پیام شما دریافت شد: «" + userText + "»\n\n" +
      "[سرور هوش مصنوعی هنوز وصل نشده. آدرس Render را در src/ai-service.js قرار بده.]"
    );
  }

  try {
    const res = await fetch(AI_BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText, section }),
    });

    if (res.status === 429) {
      return "تعداد درخواست‌ها زیاد بود. یک دقیقه صبر کن و دوباره تلاش کن.";
    }
    if (!res.ok) {
      return "در حال حاضر امکان اتصال به هوش مصنوعی نیست (کد " + res.status + "). لطفاً دوباره تلاش کن.";
    }

    const data = await res.json();
    let out = (data.reply || "").trim() || "پاسخی دریافت نشد. لطفاً دوباره امتحان کن.";
    if (data.finishReason === "length") {
      out += "\n\n⚠️ پاسخ به‌خاطر طولانی بودن ناتمام مونده. برای پروژه‌های بزرگ، ایده رو در چند پیام کوچک‌تر بفرست.";
    }
    return out;
  } catch (err) {
    return "اتصال به سرور برقرار نشد. اگر سرور چند دقیقه بیکار بوده، بار اول ممکن است تا یک دقیقه طول بکشد؛ دوباره تلاش کن.";
  }
}
