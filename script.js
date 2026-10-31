// ==========================================
// 🔥 YAHAN APNI DETAILS DAALEIN 🔥
// ==========================================
const whatsappNumber = "919931009967"; // 1. Yahan apna WhatsApp Number daalein (91 ke sath)
const masterResetCode = "pAtwari@123@#++"; // 2. Yahan apna Secret Code daalein (Password bhoolne par kaam aayega)

const firebaseConfig = {
  apiKey: "AIzaSyCNgSH8dvJ7BHL6qmfyJYssvTTl6lo9KjQ",
  authDomain: "pwta-app.firebaseapp.com",
  databaseURL: "https://pwta-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pwta-app",
  storageBucket: "pwta-app.firebasestorage.app",
  messagingSenderId: "789685481938",
  appId: "1:789685481938:web:42e40b53be0407d704980b"
};
// ==========================================

let currentAdminPassword = "admin123";
let isAdmin = false;
let revenueChart = null;
let currentLang = 'en';

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

db.ref('pwta_config/adminPassword').on('value', (snapshot) => {
  if (snapshot.exists()) {
    currentAdminPassword = snapshot.val();
  } else {
    db.ref('pwta_config/adminPassword').set("admin123");
  }
});

const langToggle = document.getElementById('langToggle');
langToggle.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'hi' : 'en';
  langToggle.innerText = currentLang === 'en' ? '🌐 Hindi' : '🌐 English';
  document.querySelectorAll('[data-en]').forEach(el => {
    el.innerText = el.getAttribute(`data-${currentLang}`);
  });
});

const darkModeToggle = document.getElementById('darkModeToggle');
if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('dark-mode'); darkModeToggle.innerText = "☀️"; }
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  darkModeToggle.innerText = isDark ? "☀️" : "🌙";
});

const adminBtn = document.getElementById('adminBtn');
function toggleAdminUI() {
  document.querySelectorAll('.admin-only').forEach(form => form.style.display = isAdmin ? 'flex' : 'none');
  adminBtn.innerText = isAdmin ? "🔓 Logout" : "🔐 Admin";
  
  renderRevenues();
  renderExpenditures();
  renderNotices();
  renderDonors();
}

adminBtn.addEventListener('click', () => {
  if (isAdmin) { 
    isAdmin = false; 
    toggleAdminUI(); 
    alert("Logged out successfully.");
  } else {
    const pass = prompt("Enter Admin Password:\n(Agar password bhool gaye hain to 'forgot' likhein)");
    if (pass === null) return;

    if (pass.toLowerCase() === 'forgot') {
      const userCode = prompt("Password reset karne ke liye apna SECRET CODE enter karein:");
      if (userCode === masterResetCode) {
        const newPass = prompt("✅ Code Verified!\nAb apna NAYA Admin Password enter karein:");
        if (newPass !== null && newPass.trim() !== "") {
          db.ref('pwta_config/adminPassword').set(newPass).then(() => {
            alert("✅ Password successfully change ho gaya! Ab sabhi phones par naya password chalega.");
          });
        } else {
          alert("❌ Password khali nahi ho sakta.");
        }
      } else if (userCode !== null) {
        alert("❌ Galat Secret Code! Aap password reset nahi kar sakte.");
      }
    } 
    else if (pass === currentAdminPassword) {
      isAdmin = true; 
      toggleAdminUI();
    } else {
      alert("❌ Incorrect Password!");
    }
  }
});

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; installBtn.style.display = 'block'; });
installBtn.addEventListener('click', async () => {
  if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') installBtn.style.display = 'none'; deferredPrompt = null; }
});
document.getElementById('shareBtn').addEventListener('click', () => {
  if (navigator.share) { navigator.share({ title: 'PWTA App', text: 'Support our cause!', url: window.location.href }); } 
  else { alert("Link copied!"); navigator.clipboard.writeText(window.location.href); }
});

let revenues = [];
let expenditures = [];
let notices = [];
let donors = [];

db.ref('pwta_data/revenues').on('value', (snapshot) => { revenues = snapshot.val() || []; renderRevenues(); });
db.ref('pwta_data/expenditures').on('value', (snapshot) => { expenditures = snapshot.val() || []; renderExpenditures(); });
db.ref('pwta_data/notices').on('value', (snapshot) => { notices = snapshot.val() || []; renderNotices(); });
db.ref('pwta_data/donors').on('value', (snapshot) => { donors = snapshot.val() || []; renderDonors(); });
db.ref('pwta_last_update').on('value', (snapshot) => { updateLastUpdateTime(snapshot.val()); });

function saveDataToFirebase(type, dataArray) {
  db.ref(`pwta_data/${type}`).set(dataArray).then(() => {
    db.ref('pwta_last_update').set(Date.now());
  });
}

function updateLastUpdateTime(lastUpdate) {
  const el = document.getElementById('lastUpdateTime');
  if (!lastUpdate) { el.innerText = "No data yet"; return; }
  const diff = Date.now() - parseInt(lastUpdate);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) el.innerText = "Just now";
  else if (mins < 60) el.innerText = `${mins} mins ago`;
  else if (hours < 24) el.innerText = `${hours} hours ago`;
  else el.innerText = `${days} days ago`;
}
setInterval(() => { db.ref('pwta_last_update').once('value').then(s => updateLastUpdateTime(s.val())); }, 60000);

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
}

const noticeList = document.getElementById('noticeList');
function renderNotices() {
  noticeList.innerHTML = '';
  if(notices.length === 0) { noticeList.innerHTML = '<p style="text-align:center; color:gray;">No notices currently.</p>'; return; }
  notices.slice().reverse().forEach((notice, index) => {
    let deleteBtn = isAdmin ? `<button class="delete-btn" style="display:inline-block;" onclick="deleteNotice(${notices.length - 1 - index})">🗑️ Remove</button>` : '';
    noticeList.innerHTML += `<div class="notice-card"><div style="display:flex; justify-content:space-between;"><h4>${notice.title}</h4> ${deleteBtn}</div><p>${notice.message}</p><small>Posted: ${notice.date}</small></div>`;
  });
}
document.getElementById('noticeForm').addEventListener('submit', (e) => {
  e.preventDefault();
  notices.push({ title: document.getElementById('noticeTitle').value, message: document.getElementById('noticeMsg').value, date: new Date().toLocaleString() });
  saveDataToFirebase('notices', notices);
  e.target.reset(); alert("Notice Posted!");
});
function deleteNotice(index) { if(isAdmin && confirm('Delete this notice?')) { notices.splice(index, 1); saveDataToFirebase('notices', notices); } }

const bloodList = document.getElementById('bloodList');
const searchBlood = document.getElementById('searchBlood');
function renderDonors() {
  bloodList.innerHTML = '';
  const term = searchBlood.value.toLowerCase();
  const filtered = donors.filter(d => d.name.toLowerCase().includes(term) || d.group.toLowerCase().includes(term));
  if(filtered.length === 0) { bloodList.innerHTML = '<p style="color:gray; grid-column: span 2; text-align:center;">No donors found.</p>'; return; }
  filtered.forEach((donor) => {
    let deleteBtn = isAdmin ? `<button class="delete-btn" style="display:inline-block;" onclick="deleteDonor(${donors.indexOf(donor)})">🗑️</button>` : '';
    bloodList.innerHTML += `<li><div><b>${donor.name}</b><br><small>📞 ${donor.phone}</small> ${deleteBtn}</div><div class="blood-group-badge">${donor.group}</div></li>`;
  });
}
searchBlood.addEventListener('input', renderDonors);
document.getElementById('bloodForm').addEventListener('submit', (e) => {
  e.preventDefault();
  donors.push({ name: document.getElementById('bloodName').value, group: document.getElementById('bloodGroup').value, phone: document.getElementById('bloodPhone').value });
  saveDataToFirebase('donors', donors);
  e.target.reset(); alert("Donor Registered!");
});
function deleteDonor(index) { if(isAdmin && confirm('Remove this donor?')) { donors.splice(index, 1); saveDataToFirebase('donors', donors); } }

function renderRevenues() {
  const revList = document.getElementById('revenueList');
  revList.innerHTML = '';
  let total = 0;
  const term = document.getElementById('searchRev').value.toLowerCase();
  revenues.forEach((item, index) => {
    if(item.name.toLowerCase().includes(term) || item.date.includes(term)) {
      total += Number(item.amount);
      let receiptHTML = item.fileData ? `<a href="${item.fileData}" target="_blank" class="receipt-link">👁️ Receipt</a>` : '';
      let deleteBtnHTML = isAdmin ? `<button class="delete-btn" style="display:inline-block;" onclick="deleteRevenue(${index})">🗑️</button>` : '';
      revList.innerHTML += `<li><div class="record-top"><b>${item.name}</b><span>₹${item.amount}</span></div><div class="record-bottom"><span>${item.date}</span><div>${receiptHTML} ${deleteBtnHTML}</div></div></li>`;
    }
  });
  document.getElementById('totalRevenue').innerText = total;
  updateStats();
}

function renderExpenditures() {
  const expList = document.getElementById('expenditureList');
  expList.innerHTML = '';
  let total = 0;
  const term = document.getElementById('searchExp').value.toLowerCase();
  expenditures.forEach((item, index) => {
    if(item.name.toLowerCase().includes(term) || item.date.includes(term) || item.category.toLowerCase().includes(term)) {
      total += Number(item.amount);
      let receiptHTML = item.fileData ? `<a href="${item.fileData}" target="_blank" class="receipt-link">👁️ Receipt</a>` : '';
      let deleteBtnHTML = isAdmin ? `<button class="delete-btn" style="display:inline-block;" onclick="deleteExpenditure(${index})">🗑️</button>` : '';
      expList.innerHTML += `<li><div class="record-top"><b>${item.name} <small>(${item.category})</small></b><span>₹${item.amount}</span></div><div class="record-bottom"><span>${item.date}</span><div>${receiptHTML} ${deleteBtnHTML}</div></div></li>`;
    }
  });
  document.getElementById('totalExpenditure').innerText = total;
  updateStats();
}

document.getElementById('searchRev').addEventListener('input', renderRevenues);
document.getElementById('searchExp').addEventListener('input', renderExpenditures);

document.getElementById('revenueForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileData = await readFileAsDataURL(document.getElementById('revFile').files[0]);
  revenues.push({ name: document.getElementById('revName').value, date: document.getElementById('revDate').value, amount: document.getElementById('revAmount').value, fileData });
  saveDataToFirebase('revenues', revenues);
  e.target.reset(); alert("Revenue Added!");
});

document.getElementById('expenditureForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileData = await readFileAsDataURL(document.getElementById('expFile').files[0]);
  expenditures.push({ name: document.getElementById('expName').value, category: document.getElementById('expCategory').value, date: document.getElementById('expDate').value, amount: document.getElementById('expAmount').value, fileData });
  saveDataToFirebase('expenditures', expenditures);
  e.target.reset(); alert("Expense Added!");
});

function deleteRevenue(index) { if(isAdmin && confirm('Delete this Revenue entry?')) { revenues.splice(index, 1); saveDataToFirebase('revenues', revenues); } }
function deleteExpenditure(index) { if(isAdmin && confirm('Delete this Expenditure entry?')) { expenditures.splice(index, 1); saveDataToFirebase('expenditures', expenditures); } }

function updateStats() {
  let rev = revenues.reduce((s, i) => s + Number(i.amount), 0);
  let exp = expenditures.reduce((s, i) => s + Number(i.amount), 0);
  let bal = rev - exp;
  document.getElementById('balanceAmount').innerText = bal;
  document.getElementById('balanceAmount').style.color = bal < 0 ? '#ffcccc' : 'white';
  updateChart(rev, exp);
}

function updateChart(rev, exp) {
  const ctx = document.getElementById('financeChart').getContext('2d');
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Revenue', 'Expenditure'], datasets: [{ data: [rev, exp], backgroundColor: ['#8cc63f', '#e53935'] }] }, options: { responsive: true } });
}

const idCardModal = document.getElementById('idCardModal');
document.getElementById('volunteerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('volName').value;
  const phone = document.getElementById('volPhone').value;
  const city = document.getElementById('volCity').value;
  document.getElementById('cardName').innerText = name;
  document.getElementById('cardPhone').innerText = phone;
  document.getElementById('cardCity').innerText = city;
  const randomId = Math.floor(1000 + Math.random() * 9000);
  document.getElementById('cardId').innerText = randomId;
  idCardModal.style.display = 'block';
  
  document.getElementById('closeCardBtn').onclick = () => {
    idCardModal.style.display = 'none';
    const whatsappMsg = `Hello PWTA, I have joined as a Volunteer.%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*City:* ${city}%0A*ID:* PWTA-VOL-${randomId}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`, '_blank');
    document.getElementById('volunteerForm').reset();
  };
});

document.getElementById('downloadCSV').addEventListener('click', () => {
  let csv = "Type,Name,Category,Date,Amount\n";
  revenues.forEach(r => csv += `Revenue,"${r.name}",-,${r.date},${r.amount}\n`);
  expenditures.forEach(ex => csv += `Expense,"${ex.name}",${ex.category},${ex.date},${ex.amount}\n`);
  const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'PWTA_Data.csv'; a.click();
});

document.getElementById('downloadPDF').addEventListener('click', () => {
  const element = document.getElementById('reportArea');
  const opt = { margin: 0.5, filename: 'PWTA_Report.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } };
  alert("Generating PDF..."); html2pdf().set(opt).from(element).save();
});

document.getElementById('backupBtn').addEventListener('click', () => {
  const data = { revenues, expenditures, notices, donors };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'PWTA_Backup.json'; a.click();
});

document.getElementById('restoreFile').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.revenues) { 
        saveDataToFirebase('revenues', data.revenues);
        saveDataToFirebase('expenditures', data.expenditures);
        saveDataToFirebase('notices', data.notices || []);
        saveDataToFirebase('donors', data.donors || []);
        alert("Data Restored to Cloud Successfully!"); 
      }
    } catch (err) { alert("Invalid Backup File!"); }
  };
  reader.readAsText(file);
});

toggleAdminUI();

// 🔥 AUTO UPDATE LOGIC (Isse app hamesha update rahegi) 🔥
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then((reg) => {
    reg.onupdatefound = () => {
      const installingWorker = reg.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            window.location.reload(); 
          }
        }
      };
    };
  });
}
