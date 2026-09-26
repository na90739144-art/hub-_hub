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
    .map(
      (m, i) => `
    <div class="msg ${m.role === "user" ? "user" : "ai"}">${escapeHtml(m.text)}
      ${
        m.role === "ai"
          ? `<div class="msg-actions">
        <button onclick="copyMsg(${i})">📋 کپی</button>
        <button onclick="speakMsg(${i})">🔊 پخش صوتی</button>
      </div>`
          : ""
      }
    </div>`
    )
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
function speakMsg(i) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(currentMessages[i].text);
  u.lang = currentSection === "idea" ? "en-US" : "fa-IR";
  speechSynthesis.speak(u);
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
