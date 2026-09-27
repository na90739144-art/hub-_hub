/* ==========================================================================
   HUB HUB — AI SERVICE LAYER
   این فایل تنها جایی است که باید برای وصل کردن هوش مصنوعی واقعی تغییر بدی.
   ========================================================================== */

const AI_API_KEY = "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";

const GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * فرمت مخصوص خروجی فایل‌های پروژه، که فرانت‌اند از رویش فایل‌ها را برای ساخت ZIP استخراج می‌کند:
 * ===FILE: path/name.ext===
 * <محتوای فایل>
 * ===END===
 */
const FILE_FORMAT_RULE =
  "If the user gives you a complete build prompt for a full project, generate the necessary project files. " +
  "Output each file using EXACTLY this format, one block per file:\n" +
  "===FILE: path/filename.ext===\n<full file content>\n===END===\n" +
  "Include as many files as the project needs (index.html, package.json, README.md, source files, etc). " +
  "You may add a short explanation in Persian before or after the file blocks, but the file blocks themselves must follow the exact format above so they can be packaged into a ZIP. " +
  "If the user is just chatting, asking questions, or the idea is not complete yet, respond normally in Persian and do NOT use the file format — ask clarifying questions if needed.";

const SECTION_INSTRUCTIONS = {
  idea:
    "You are Hub Hub's Idea-to-Prompt assistant. The user will describe an idea in Persian or English. " +
    "Turn it into one detailed, professional AI prompt written in English, ready to paste into another AI tool. " +
    "Return ONLY the final prompt text, no extra commentary.",
  website:
    "تو دستیار طراحی وب‌سایت Hub Hub هستی و مثل یک هوش مصنوعی کامل عمل می‌کنی — به هر سوالی که کاربر بپرسد جواب بده. " +
    FILE_FORMAT_RULE,
  android:
    "تو دستیار طراحی اپلیکیشن اندروید Hub Hub هستی و مثل یک هوش مصنوعی کامل عمل می‌کنی — به هر سوالی که کاربر بپرسد جواب بده. " +
    "تکنولوژی مناسب (Kotlin, Flutter, React Native و ...) را بر اساس نیاز پروژه انتخاب کن. " +
    FILE_FORMAT_RULE,
  consultant:
    "تو مشاور پروژه‌های برنامه‌نویسی Hub Hub هستی و مثل یک هوش مصنوعی کامل عمل می‌کنی — به هر سوالی که کاربر بپرسد جواب بده. " +
    "وقتی کاربر یک ایده‌ی پروژه را کامل برایت تعریف کرد، نقاط ضعف، کمبودها و ابهامات ایده را خودت شناسایی و برطرف کن " +
    "(بدون اینکه لزوماً هر بار از کاربر سوال بپرسی) و در پایان یک نسخه‌ی کامل، منسجم و حرفه‌ای از ایده را ارائه بده " +
    "که کاربر بتواند مستقیماً آن را در بخش «ایده‌ات را وارد کن، پرامپت بگیر» استفاده کند. " +
    "فقط هیچ‌وقت از فرمت فایل/ZIP استفاده نکن، این بخش فایل پروژه تولید نمی‌کند. به فارسی پاسخ بده.",
};

async function getAIResponse(userText, section) {
  if (!AI_API_KEY) {
    await new Promise((r) => setTimeout(r, 600));
    return "پیام شما دریافت شد: «" + userText + "»\n\n[این پاسخ نمونه است. کلید AI هنوز تنظیم نشده.]";
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
