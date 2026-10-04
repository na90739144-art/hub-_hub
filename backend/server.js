/* ==========================================================================
   HUB HUB — BACKEND (AI proxy)
   کلید هوش مصنوعی فقط اینجا (متغیر محیطی GROQ_API_KEY) نگهداری می‌شود.
   ========================================================================== */
const express = require("express");
const cors = require("cors");

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

app.use((req, res, next) => {
  console.log("Incoming request origin:", req.headers.origin, "| configured ALLOWED_ORIGIN:", ALLOWED_ORIGIN);
  next();
});
app.use(cors({ origin: ALLOWED_ORIGIN || false }));
app.use(express.json({ limit: "1mb" }));

/* ---- Prompts per section (kept server-side) ---- */
const FILE_FORMAT_RULE =
  "If the user gives you a complete build prompt for a full project, you MUST generate the project files. " +
  "This is MANDATORY: every single file you produce (code, gradle, manifest, README, etc.) must be wrapped EXACTLY like this, " +
  "with nothing else around the markers on their own lines:\n" +
  "===FILE: path/filename.ext===\n<full file content here>\n===END===\n" +
  "Do NOT use normal markdown code fences (```) or markdown tables for file content — ONLY the ===FILE:===/===END=== format above. " +
  "Example:\n===FILE: app/build.gradle===\napply plugin: 'com.android.application'\n===END===\n" +
  "Keep prose explanation SHORT (a few lines in Persian max) and prioritize outputting the actual files — the files are what matters most, not lengthy tables or architecture essays. " +
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

/* ---- Simple per-IP rate limit (protects the free quota) ---- */
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const rec = hits.get(req.ip) || { count: 0, start: now };
  if (now - rec.start > 60_000) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count++;
  hits.set(req.ip, rec);
  if (rec.count > 20) return res.status(429).json({ error: "too_many_requests" });
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of hits) if (now - rec.start > 120_000) hits.delete(ip);
}, 300_000);

/* ---- Routes ---- */
app.get("/", (req, res) => res.send("Hub Hub API is running"));

app.post("/api/ai", rateLimit, async (req, res) => {
  const { message, section } = req.body || {};

  if (typeof message !== "string" || !message.trim() || message.length > 20000) {
    return res.status(400).json({ error: "invalid_message" });
  }
  if (!Object.prototype.hasOwnProperty.call(SECTION_INSTRUCTIONS, section)) {
    return res.status(400).json({ error: "invalid_section" });
  }
  if (!GROQ_API_KEY) {
    console.error("GROQ_API_KEY is not set");
    return res.status(500).json({ error: "server_not_configured" });
  }

  try {
    const r = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 8000,
        messages: [
          { role: "system", content: SECTION_INSTRUCTIONS[section] },
          { role: "user", content: message },
        ],
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.error("Groq error:", r.status, errText.slice(0, 500));
      return res.status(502).json({ error: "ai_unavailable", status: r.status });
    }

    const data = await r.json();
    const choice = data?.choices?.[0];
    res.json({
      reply: choice?.message?.content || "",
      finishReason: choice?.finish_reason || null,
    });
  } catch (err) {
    console.error("Proxy failure:", err);
    res.status(502).json({ error: "ai_unavailable" });
  }
});

app.listen(PORT, () => console.log("Hub Hub API listening on port " + PORT));
