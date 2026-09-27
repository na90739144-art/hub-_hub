/* ==========================================================================
   HUB HUB — AI SERVICE LAYER
   این فایل تنها جایی است که باید برای وصل کردن هوش مصنوعی واقعی تغییر بدی.
   ========================================================================== */

/**
 * کلید API هوش مصنوعی (Google Gemini).
 * توجه امنیتی: این کلید در کد سمت مرورگر قرار دارد، یعنی هر کسی که سایت را
 * باز کند و View Source بزند می‌تواند آن را ببیند و از سهمیه‌ی رایگانت استفاده کند.
 * فعلاً برای تست/استفاده‌ی شخصی مشکلی ندارد؛ برای یک سایت عمومی، بهتر است این
 * تماس از طریق یک بک‌اند ساده انجام شود تا کلید مخفی بماند.
 */
const AI_API_KEY = "AQ.Ab8RN6IIiQozTxVeng428uj7QfWp8CQhSCLwuRPUIwrUl5wA5w";

/** مدل Gemini مورد استفاده */
const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
    const res = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": AI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: instruction }] },
        contents: [{ parts: [{ text: userText }] }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Gemini API error:", res.status, errText);
      return "در حال حاضر امکان اتصال به هوش مصنوعی نیست (خطای سرور). لطفاً دوباره تلاش کن.";
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
    return reply.trim() || "پاسخی دریافت نشد. لطفاً دوباره امتحان کن.";
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return "در حال حاضر امکان اتصال به هوش مصنوعی نیست. لطفاً اتصال اینترنت را چک کن و دوباره تلاش کن.";
  }
}
