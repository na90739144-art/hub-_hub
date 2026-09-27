/* ==========================================================================
   HUB HUB — AI SERVICE LAYER
   این فایل تنها جایی است که باید برای وصل کردن هوش مصنوعی واقعی تغییر بدی.
   ========================================================================== */

/**
 * کلید API هوش مصنوعی (Groq).
 * توجه امنیتی: این کلید در کد سمت مرورگر قرار دارد، یعنی هر کسی که سایت را
 * باز کند و View Source بزند می‌تواند آن را ببیند و از سهمیه‌ی رایگانت استفاده کند.
 * فعلاً برای تست/استفاده‌ی شخصی مشکلی ندارد؛ برای یک سایت عمومی، بهتر است این
 * تماس از طریق یک بک‌اند ساده انجام شود تا کلید مخفی بماند.
 */
const AI_API_KEY = "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";

/** مدل Groq مورد استفاده (رایگان، فعال در رده‌ی رایگان) */
const GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * دستورالعمل هر بخش، برای اینکه هوش مصنوعی متناسب با همون نقش جواب بده.
 */
const SECTION_INSTRUCTIONS = {
  idea:
    "You are Hub Hub's Idea-to-Prompt assistant. The user will describe an idea in Persian or English. " +
    "Turn it into one detailed, professional AI prompt written in English, ready to paste into another AI tool. " +
    "Return ONLY the final prompt text, no extra commentary.",
  website:
    "تو دستیار طراحی وب‌سایت Hub Hub هستی. ایده‌ی سایت کاربر را تحلیل کن، اگر اطلاعات مهمی کم بود سوال بپرس، " +
    "و در نهایت یک برنامه‌ی فنی و ساختار پروژه‌ی پیشنهادی ارائه بده. به فارسی پاسخ بده.",
  android:
    "تو دستیار طراحی اپلیکیشن اندروید Hub Hub هستی. ایده‌ی اپلیکیشن کاربر را تحلیل کن، در صورت نیاز سوال بپرس، " +
    "تکنولوژی مناسب (Kotlin, Flutter, React Native و ...) را پیشنهاد بده و ساختار پروژه را توضیح بده. به فارسی پاسخ بده.",
  consultant:
    "تو مشاور پروژه‌های برنامه‌نویسی Hub Hub هستی. فقط مشاوره بده (معماری، تکنولوژی، دیباگ، مسیر توسعه)، " +
    "هیچ‌وقت فایل یا ZIP تولید نکن. به فارسی و مختصر و مفید پاسخ بده.",
};

/**
 * تولید پاسخ هوش مصنوعی برای یک بخش مشخص (idea | website | android | consultant).
 * اگر AI_API_KEY خالی باشد، پاسخ نمونه (mock) برگردانده می‌شود.
 */
async function getAIResponse(userText, section) {
  if (!AI_API_KEY) {
    await new Promise((r) => setTimeout(r, 600));
    return (
      "پیام شما دریافت شد: «" + userText + "»\n\n" +
      "[این پاسخ نمونه است. کلید AI هنوز تنظیم نشده.]"
    );
  }

  try {
    const instruction = SECTION_INSTRUCTIONS[section] || SECTION_INSTRUCTIONS.consultant;
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + AI_API_KEY,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: instruction },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Groq API error:", res.status, errText);
      return "خطای سرور Groq (کد " + res.status + "):\n" + errText.slice(0, 500);
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    return reply.trim() || "پاسخی دریافت نشد. لطفاً دوباره امتحان کن.";
  } catch (err) {
    console.error("Groq fetch failed:", err);
    return "خطای شبکه در اتصال به Groq:\n" + (err && err.message ? err.message : String(err));
  }
}
