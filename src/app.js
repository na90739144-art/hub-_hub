/* ==========================================================================
   HUB HUB — APP LOGIC (auth, views, chat, history)
   منطق هوش مصنوعی جدا شده و در src/ai-service.js قرار دارد.
   ========================================================================== */

const SECTIONS = {
  idea: {
    title: "ایده → پرامپت",
    cat: "idea",
    catLabel: "💡 ایده → پرامپت",
    intro:
      "من Hub Hub هستم، دستیار هوش مصنوعی تو برای تبدیل ایده‌ها به پرامپت حرفه‌ای. کافیه ایده‌ات رو با متن یا میکروفون بگی تا برات یک پرامپت دقیق و حرفه‌ای به زبان انگلیسی بسازم.\nمثال: «یک سایت بساز که بتونم محصولاتم رو نمایش و بفروشم...»",
  },
  website: {
    title: "طراحی وب‌سایت",
    cat: "website",
    catLabel: "🌐 پروژه‌های وب‌سایت",
    intro:
      "من Hub Hub هستم، دستیار طراحی وب‌سایت. پرامپت کامل پروژه‌ات رو برام بفرست تا از صفر تا صد پیش ببریمش.",
  },
  android: {
    title: "طراحی اپلیکیشن اندروید",
    cat: "android",
    catLabel: "📱 پروژه‌های اندروید",
    intro:
      "من Hub Hub هستم، دستیار طراحی اپلیکیشن اندروید. پرامپت کامل اپلیکیشنت رو برام بفرست تا پروژه رو کامل بسازیم.",
  },
  consultant: {
    title: "مشاور پروژه",
    cat: "consultant",
    catLabel: "👨‍💻 مشاوره‌ها",
    intro:
      "من Hub Hub هستم، مشاور پروژه‌های برنامه‌نویسی‌ات. درباره‌ی ایده، معماری، تکنولوژی یا مشکل پروژه‌ات باهام صحبت کن.",
  },
};

let currentSection = null;
let currentMessages = [];

/* ---- Extract ===FILE: ...=== blocks and build a downloadable ZIP ---- */
function extractFiles(text) {
  const re = /===FILE:\s*(.+?)===\r?\n([\s\S]*?)===END===/g;
  const files = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    files.push({ path: m[1].trim(), content: m[2] });
  }
  if (files.length) return files;
  return extractFilesFallback(text);
}
/* Fallback: `filename.ext` heading followed by a ```code``` fence (in case the model used plain markdown) */
function extractFilesFallback(text) {
  const re = /`([\w./-]+\.\w{1,10})`[^\n]*\n+```[a-zA-Z0-9]*\n([\s\S]*?)```/g;
  const files = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    files.push({ path: m[1].trim(), content: m[2] });
  }
  return files;
}
function formatForDisplay(text) {
  return text
    .replace(/===FILE:\s*(.+?)===\r?\n/g, "📄 $1\n")
    .replace(/===END===\r?\n?/g, "\n");
}
async function downloadZip(i) {
  const files = extractFiles(currentMessages[i].text);
  if (!files.length || typeof JSZip === "undefined") return;
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.path, f.content));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hubhub-project.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function downloadTxt(i) {
  const blob = new Blob([currentMessages[i].text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hubhub-response.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function $(id) {
  return document.getElementById(id);
}
function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  $(name + "View").classList.add("active");
}
function goDashboard() {
  showView("dashboard");
}

/* ---- AUTH (local only — no backend, per current requirements) ---- */
function showForm(which) {
  $("loginForm").style.display = which === "login" ? "block" : "none";
  $("registerForm").style.display = which === "register" ? "block" : "none";
  $("loginErr").textContent = "";
  $("regErr").textContent = "";
}
function getUsers() {
  return JSON.parse(localStorage.getItem("hubhub_users") || "{}");
}

document.getElementById("registerForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = $("regName").value.trim();
  const email = $("regEmail").value.trim().toLowerCase();
  const pass = $("regPass").value;
  const pass2 = $("regPass2").value;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !email || !pass || !pass2) {
    $("regErr").textContent = "پر کردن همه‌ی فیلدها الزامی است.";
    return;
  }
  if (!emailOk) {
    $("regErr").textContent = "فرمت ایمیل معتبر نیست.";
    return;
  }
  if (pass !== pass2) {
    $("regErr").textContent = "رمز عبور و تکرار آن یکسان نیستند.";
    return;
  }
  const users = getUsers();
  if (users[email]) {
    $("regErr").textContent = "این ایمیل قبلاً ثبت شده است.";
    return;
  }
  users[email] = { name, pass };
  localStorage.setItem("hubhub_users", JSON.stringify(users));
  $("regErr").textContent = "";
  showForm("login");
});

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = $("loginEmail").value.trim().toLowerCase();
  const pass = $("loginPass").value;
  const users = getUsers();
  if (!users[email] || users[email].pass !== pass) {
    $("loginErr").textContent = "ایمیل یا رمز عبور اشتباه است.";
    return;
  }
  sessionStorage.setItem("hubhub_session", JSON.stringify({ email, name: users[email].name }));
  $("loginErr").textContent = "";
  enterApp();
});

function logout() {
  sessionStorage.removeItem("hubhub_session");
  closeDrawer();
  showView("auth");
  showForm("login");
}

function enterApp() {
  const s = JSON.parse(sessionStorage.getItem("hubhub_session") || "null");
  $("greetName").textContent = s ? "سلام " + s.name + "، خوش اومدی" : "خوش اومدی";
  if (!localStorage.getItem("hubhub_onboarding_seen")) {
    onbIndex = 0;
    renderOnboarding();
    showView("onboarding");
  } else {
    showView("dashboard");
  }
}

/* ---- ONBOARDING SLIDES ---- */
const ONB_SLIDES = [
  { emoji: "💡", title: "مشاور پروژه", body: "ایده‌ای برای یک پروژه دارید؟\nدر بخش «مشاور پروژه» می‌توانید تمام جزئیات ایده، اهداف و امکانات موردنظرتان را با ما در میان بگذارید." },
  { emoji: "🧠", title: "بررسی و تکمیل ایده", body: "ایده شما بررسی می‌شود و نقاط ضعف، کمبودها و بخش‌هایی که نیاز به بهبود دارند، شناسایی می‌شوند.\nسپس پیشنهادهای لازم برای کامل‌تر و حرفه‌ای‌تر شدن پروژه ارائه خواهد شد." },
  { emoji: "🚀", title: "آماده‌سازی پروژه", body: "پس از بررسی، ایده شما به یک طرح کامل و منسجم تبدیل می‌شود تا برای مرحله اجرا آماده باشد." },
  { emoji: "✍️", title: "دریافت پرامپت حرفه‌ای", body: "پس از تکمیل ایده، می‌توانید به بخش «ایده‌ات را وارد کن، پرامپت بگیر» بروید و یک پرامپت حرفه‌ای و دقیق برای اجرای پروژه دریافت کنید." },
  { emoji: "📱💻", title: "طراحی سایت یا اپلیکیشن", body: "در مرحله بعد، می‌توانید پروژه خود را در بخش «طراحی سایت» یا «طراحی اپلیکیشن اندروید» وارد کنید و از پرامپت آماده‌شده برای شروع طراحی و توسعه استفاده کنید." },
  { emoji: "✨", title: "از ایده تا اجرا", body: "ایده خود را وارد کنید، آن را کامل و حرفه‌ای کنید، پرامپت مناسب دریافت کنید و سپس وارد مرحله طراحی شوید؛\nهمه‌چیز برای تبدیل ایده شما به یک پروژه واقعی آماده است." },
];
let onbIndex = 0;
function renderOnboarding() {
  const s = ONB_SLIDES[onbIndex];
  $("onbCard").innerHTML =
    `<div class="onb-emoji">${s.emoji}</div><h3>${s.title}</h3><p>${escapeHtml(s.body).replace(/\n/g, "<br>")}</p>`;
  $("onbDots").innerHTML = ONB_SLIDES.map((_, i) => `<span class="${i === onbIndex ? "active" : ""}"></span>`).join("");
  $("onbPrevBtn").style.visibility = onbIndex === 0 ? "hidden" : "visible";
  $("onbNextBtn").textContent = onbIndex === ONB_SLIDES.length - 1 ? "شروع کنید" : "بعدی";
}
function onbNext() {
  if (onbIndex < ONB_SLIDES.length - 1) {
    onbIndex++;
    renderOnboarding();
  } else {
    onbFinish();
  }
}
function onbPrev() {
  if (onbIndex > 0) {
    onbIndex--;
    renderOnboarding();
  }
}
function onbFinish() {
  localStorage.setItem("hubhub_onboarding_seen", "1");
  showView("dashboard");
}
(function init() {
  if (sessionStorage.getItem("hubhub_session")) enterApp();
})();

/* ---- DRAWER ---- */
function openDrawer() {
  $("drawer").classList.add("show");
  $("overlay").classList.add("show");
}
function closeDrawer() {
  $("drawer").classList.remove("show");
  $("overlay").classList.remove("show");
}
function openHistory() {
  renderHistory();
  showView("history");
}

/* ---- HISTORY ---- */
function getHistory() {
  return JSON.parse(localStorage.getItem("hubhub_history") || "{}");
}
function saveHistory(h) {
  localStorage.setItem("hubhub_history", JSON.stringify(h));
}

function renderHistory() {
  const h = getHistory();
  let html = "";
  Object.values(SECTIONS).forEach((sec) => {
    const items = h[sec.cat] || [];
    html += `<div class="hist-section"><h3>${sec.catLabel}</h3>`;
    if (items.length === 0) {
      html += `<div class="empty-note">هنوز گفتگویی ثبت نشده.</div>`;
    } else {
      items
        .slice()
        .reverse()
        .forEach((it, idx) => {
          const realIdx = items.length - 1 - idx;
          html += `<div class="hist-item" onclick="reopenHistory('${sec.cat}',${realIdx})">
          <div class="hist-top"><span>${it.title}</span><span class="date">${it.date}</span></div>
          <div class="hist-prev">${it.preview}</div></div>`;
        });
    }
    html += `</div>`;
  });
  $("historyBody").innerHTML = html;
}
function reopenHistory(cat, idx) {
  const h = getHistory();
  const item = h[cat][idx];
  const key = Object.keys(SECTIONS).find((k) => SECTIONS[k].cat === cat);
  currentSection = key;
  currentMessages = item.messages.slice();
  $("chatTitle").textContent = SECTIONS[key].title;
  renderMessages();
  showView("chat");
}

/* ---- CHAT ---- */
function openChat(key) {
  currentSection = key;
  currentMessages = [{ role: "ai", text: SECTIONS[key].intro }];
  $("chatTitle").textContent = SECTIONS[key].title;
  renderMessages();
  showView("chat");
}
function clearChat() {
  currentMessages = [{ role: "ai", text: SECTIONS[currentSection].intro }];
  renderMessages();
}
function renderMessages() {
  const box = $("messages");
  box.innerHTML = currentMessages
    .map((m, i) => {
      const hasFiles = m.role === "ai" && extractFiles(m.text).length > 0;
      const isLong = m.role === "ai" && !hasFiles && m.text.length > 600;
      const shownText = m.role === "ai" ? formatForDisplay(m.text) : m.text;
      return `
    <div class="msg ${m.role === "user" ? "user" : "ai"}">${escapeHtml(shownText)}
      ${
        m.role === "ai"
          ? `<div class="msg-actions">
        <button onclick="copyMsg(${i})">📋 کپی</button>
        ${hasFiles ? `<button onclick="downloadZip(${i})">📦 دانلود ZIP پروژه</button>` : ""}
        ${isLong ? `<button onclick="downloadTxt(${i})">📄 دانلود TXT</button>` : ""}
      </div>`
          : ""
      }
    </div>`;
    })
    .join("");
  box.scrollTop = box.scrollHeight;
}
function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
function copyMsg(i) {
  navigator.clipboard && navigator.clipboard.writeText(currentMessages[i].text);
}

function sendMessage() {
  const input = $("chatInput");
  const text = input.value.trim();
  if (!text) return;
  currentMessages.push({ role: "user", text });
  input.value = "";
  renderMessages();
  const box = $("messages");
  const loadingEl = document.createElement("div");
  loadingEl.className = "loading-dots";
  loadingEl.textContent = "در حال فکر کردن...";
  box.appendChild(loadingEl);
  box.scrollTop = box.scrollHeight;

  getAIResponse(text, currentSection).then((reply) => {
    loadingEl.remove();
    currentMessages.push({ role: "ai", text: reply });
    renderMessages();
    persistToHistory();
  });
}

function persistToHistory() {
  const h = getHistory();
  const cat = SECTIONS[currentSection].cat;
  h[cat] = h[cat] || [];
  const firstUser = currentMessages.find((m) => m.role === "user");
  const title = firstUser ? firstUser.text.slice(0, 28) : SECTIONS[currentSection].title;
  const preview = currentMessages[currentMessages.length - 1].text.slice(0, 60);
  const date = new Date().toLocaleDateString("fa-IR");
  const entry = { title, date, preview, messages: currentMessages };
  if (h[cat].length && h[cat][h[cat].length - 1]._live) {
    h[cat][h[cat].length - 1] = { ...entry, _live: true };
  } else {
    entry._live = true;
    h[cat].push(entry);
  }
  saveHistory(h);
}

/* ---- MIC (Web Speech API) ---- */
let recognition = null,
  listening = false;
function toggleMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("میکروفون در این مرورگر پشتیبانی نمی‌شود.");
    return;
  }
  if (listening) {
    recognition && recognition.stop();
    return;
  }
  recognition = new SR();
  recognition.lang = "fa-IR";
  recognition.onresult = (e) => {
    $("chatInput").value = e.results[0][0].transcript;
  };
  recognition.onstart = () => {
    listening = true;
    $("micBtn").classList.add("active");
  };
  recognition.onend = () => {
    listening = false;
    $("micBtn").classList.remove("active");
  };
  recognition.start();
}
