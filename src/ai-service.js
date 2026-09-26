/* ==========================================================================
   HUB HUB — AI SERVICE LAYER
   این فایل تنها جایی است که باید برای وصل کردن هوش مصنوعی واقعی تغییر بدی.
   ========================================================================== */

/**
 * کلید API هوش مصنوعی.
 * فعلاً خالی است — وقتی کاملاً مطمئن شدی که رابط کاربری درست کار می‌کند،
 * کلید را همینجا قرار بده (یا بهتر: از طریق بک‌اند/متغیر محیطی AI_API_KEY بخوان
 * تا کلید در کد فرانت‌اند و مخزن گیت‌هاب قرار نگیرد).
 */
const AI_API_KEY = "";

/**
 * نقطه‌ی پایانی بک‌اند برای فراخوانی امن هوش مصنوعی.
 * وقتی بک‌اند واقعی ساختی، این آدرس را با آدرس API خودت جایگزین کن.
 */
const AI_BACKEND_ENDPOINT = "/api/ai";

/**
 * تولید پاسخ هوش مصنوعی برای یک بخش مشخص (idea | website | android | consultant).
 * تا وقتی AI_API_KEY خالی است، پاسخ نمونه (mock) برگردانده می‌شود
 * تا کل رابط کاربری بدون نیاز به کلید واقعی قابل تست باشد.
 */
async function getAIResponse(userText, section) {
  if (!AI_API_KEY) {
    await new Promise((r) => setTimeout(r, 600));
    if (section === "idea") {
      return (
        "Professional prompt (sample):\n\n" +
        "Build a responsive web application that " + userText + ". " +
        "Include a clean UI, clear navigation, and production-ready code structure.\n\n" +
        "[این یک پاسخ نمونه است — بعد از وصل شدن کلید هوش مصنوعی، پرامپت واقعی و دقیق‌تر ساخته می‌شود.]"
      );
    }
    return (
      "پیام شما دریافت شد: «" + userText + "»\n\n" +
      "[این پاسخ نمونه است. برای دریافت پاسخ واقعی، کلید AI باید در بک‌اند تنظیم شده باشد.]"
    );
  }

  try {
    const res = await fetch(AI_BACKEND_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText, section }),
    });
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    return data.reply || "خطا در دریافت پاسخ.";
  } catch (err) {
    return "در حال حاضر امکان اتصال به هوش مصنوعی نیست. لطفاً دوباره تلاش کن.";
  }
}
