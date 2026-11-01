// ==========================================
// 🔥 YAHAN APNI DETAILS DAALEIN 🔥
// ==========================================
const whatsappNumber = "919931109967"; // Aapka WhatsApp Number
const masterResetCode = "PWTA-RESET-123"; // Admin Password reset code
const financialSecurityCode = "pAtwari@123@#++"; // Revenue/Expense Security Code

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
  if (snapshot.exists()) { currentAdminPassword = snapshot.val(); }
  else { db.ref('pwta_config/adminPassword').set("admin123"); }
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
  renderRevenues(); renderExpenditures(); renderNotices(); renderDonors(); renderStories(); renderCampaign(); renderGallery();
}

adminBtn.addEventListener('click', () => {
  if (isAdmin) { isAdmin = false; toggleAdminUI(); alert("Logged out successfully."); } 
  else {
    const pass = prompt("Enter Admin Password:\n(Agar password bhool gaye hain to 'forgot' likhein)");
    if (pass === null) return;

    if (pass.toLowerCase() === 'forgot') {
      const userCode = prompt("Password reset karne ke liye apna SECRET CODE enter karein:");
      if (userCode === masterResetCode) {
        const newPass = prompt("✅ Code Verified!\nAb apna NAYA Admin Password enter karein:");
        if (newPass !== null && newPass.trim() !== "") {
          db.ref('pwta_config/adminPassword').set(newPass).then(() => {
            alert("✅ Password successfully change ho gaya!");
          });
        }
      } else if (userCode !== null) { alert("❌ Galat Secret Code!"); }
    } 
    else if (pass === currentAdminPassword) { isAdmin = true; toggleAdminUI(); } 
    else { alert("❌ Incorrect Password!"); }
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

// --- DATA VARIABLES ---
let revenues = [], expenditures = [], notices = [], donors = [], stories = [], campaign = null, gallery = [];

// --- FIREBASE LISTENERS ---
db.ref('pwta_data/revenues').on('value', (s) => { revenues = s.val() || []; renderRevenues(); });
db.ref('pwta_data/expenditures').on('value', (s) => { expenditures = s.val() || []; renderExpenditures(); });
db.ref('pwta_data/notices').on('value', (s) => { notices = s.val() || []; renderNotices(); checkNotifications(); });
db.ref('pwta_data/donors').on('value', (s) => { donors = s.val() || []; renderDonors(); });
db.ref('pwta_data/stories').on('value', (s) => { stories = s.val() || []; renderStories(); checkNotifications(); });
db.ref('pwta_data/campaign').on('value', (s) => { campaign = s.val(); renderCampaign(); });
db.ref('pwta_data/gallery').on('value', (s) => { gallery = s.val() || []; renderGallery(); });
db.ref('pwta_last_update').on('value', (s) => { updateLastUpdateTime(s.val()); });

function saveDataToFirebase(type, dataArray) {
  db.ref(`pwta_data/${type}`).set(dataArray).then(() => { db.ref('pwta_last_update').set(Date.now()); });
}

function updateLastUpdateTime(lastUpdate) {
  const el = document.getElementById('lastUpdateTime');
  if (!lastUpdate) { el.innerText = "No data yet"; return; }
  const diff = Date.now() - parseInt(lastUpdate);
  const mins = Math.floor(diff / 60000), hours = Math.floor(mins / 60), days = Math.floor(hours / 24);
  if (mins < 1) el.innerText = "Just now"; else if (mins < 60) el.innerText = `${mins} mins ago`;
  else if (hours < 24) el.innerText = `${hours} hours ago`; else el.innerText = `${days} days ago`;
}
setInterval(() => { db.ref('pwta_last_update').once('value').then(s => updateLastUpdateTime(s.val())); }, 60000);

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
}

// --- GALLERY LOGIC ---
const galleryGrid = document.getElementById('galleryGrid');
function renderGallery() {
  galleryGrid.innerHTML = '';
  if(gallery.length === 0) {
    galleryGrid.innerHTML = '<p style="color:gray; width:100%;">No photos uploaded yet.</p>';
    return;
  }
  
  gallery.forEach((imgData, index) => {
    let deleteBtn = isAdmin ? `<button class="gallery-del-btn" onclick="deleteGalleryPhoto(${index})">✕</button>` : '';
    galleryGrid.innerHTML += `
      <div class="gallery-item">
        ${deleteBtn}
        <img src="${imgData}" class="gallery-img" alt="Activity">
      </div>
    `;
  });
}

document.getElementById('galleryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!isAdmin) return;
  const file = document.getElementById('galleryImg').files[0];
  if(!file) return;

  const fileData = await readFileAsDataURL(file);
  gallery.push(fileData);
  saveDataToFirebase('gallery', gallery);
  e.target.reset();
  alert("Photo Uploaded Successfully!");
});

function deleteGalleryPhoto(index) {
  if(isAdmin && confirm('Delete this photo?')) {
    gallery.splice(index, 1);
    saveDataToFirebase('gallery', gallery);
  }
}

// --- CAMPAIGN LOGIC ---
function renderCampaign() {
  const display = document.getElementById('campaignDisplay');
  const form = document.getElementById('campaignForm');
  display.innerHTML = '';
  
  if(!campaign) {
    display.innerHTML = '<p style="text-align:center; color:gray;">No active campaign right now.</p>';
    form.innerHTML = `<input type="text" id="campName" placeholder="Campaign Name" required><input type="number" id="campTarget" placeholder="Target Amount (₹)" required><button type="submit" class="btn-camp">Set Campaign</button>`;
    return;
  }

  let revTotal = revenues.reduce((sum, item) => sum + Number(item.amount), 0);
  let collected = revTotal; 
  let remaining = campaign.target - collected;
  if(remaining < 0) remaining = 0;
  let percent = Math.min((collected / campaign.target) * 100, 100).toFixed(1);

  display.innerHTML = `
    <div class="campaign-title"><span>${campaign.name}</span> <span>Target: ₹${campaign.target}</span></div>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" style="width: ${percent}%;">${percent}%</div>
    </div>
    <div class="campaign-stats">
      <span style="color: green;">Collected: ₹${collected}</span>
      <span style="color: red;">Remaining: ₹${remaining}</span>
    </div>
  `;

  if(isAdmin) {
    form.innerHTML = `<button type="button" class="btn-camp" style="background:#e53935;" onclick="deleteCampaign()">Delete Current Campaign</button>`;
  } else { form.innerHTML = ''; }
}

document.getElementById('campaignForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if(!isAdmin) return;
  const newCamp = { name: document.getElementById('campName').value, target: document.getElementById('campTarget').value };
  db.ref('pwta_data/campaign').set(newCamp).then(() => alert("Campaign Set!"));
});
function deleteCampaign() { if(isAdmin && confirm('Delete campaign?')) { db.ref('pwta_data/campaign').remove(); } }

// --- STORIES LOGIC ---
const storiesList = document.getElementById('storiesList');
function renderStories() {
  storiesList.innerHTML = '';
  if(stories.length === 0) { storiesList.innerHTML = '<p style="text-align:center; color:gray; grid-column:1/-1;">No stories added yet.</p>'; return; }
  stories.slice().reverse().forEach((story, index) => {
    let deleteBtn = isAdmin ? `<button class="delete-btn" style="display:inline-block; float:right;" onclick="deleteStory(${stories.length - 1 - index})">🗑️</button>` : '';
    let imgHTML = story.image ? `<img src="${story.image}" class="story-img">` : '';
    storiesList.innerHTML += `
      <div class="story-card">
        ${imgHTML}
        <div class="story-content">
          ${deleteBtn}
          <h4>${story.title}</h4>
          <p>${story.desc}</p>
          <small style="color:gray; font-size:10px;">${story.date}</small>
        </div>
      </div>`;
  });
}

document.getElementById('storiesForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!isAdmin) return;
  let imgData = null;
  const file = document.getElementById('storyImg').files[0];
  if(file) { imgData = await readFileAsDataURL(file); }
  
  stories.push({ title: document.getElementById('storyTitle').value, desc: document.getElementById('storyDesc').value, image: imgData, date: new Date().toLocaleDateString() });
  saveDataToFirebase('stories', stories);
  e.target.reset(); alert("Story Added!");
});
function deleteStory(index) { if(isAdmin && confirm('Delete this story?')) { stories.splice(index, 1); saveDataToFirebase('stories', stories); } }

// --- NOTIFICATIONS LOGIC ---
document.getElementById('notifBtn').addEventListener('click', () => {
  const notifModal = document.getElementById('notifModal');
  const notifList = document.getElementById('notifList');
  notifList.innerHTML = '';
  
  let latest = [];
  notices.slice(-3).forEach(n => latest.push({ type: '📢 Notice', title: n.title, msg: n.message, date: n.date }));
  stories.slice(-3).forEach(s => latest.push({ type: '📖 Story', title: s.title, msg: s.desc, date: s.date }));
  
  if(latest.length === 0) { notifList.innerHTML = '<p>No new updates.</p>'; }
  else {
    latest.reverse().forEach(item => {
      notifList.innerHTML += `
        <div style="background:var(--bg); padding:10px; margin-bottom:8px; border-radius:6px; border-left:3px solid var(--primary);">
          <b style="color:var(--primary); font-size:12px;">${item.type}</b><br>
          <b>${item.title}</b><br>
          <span style="font-size:12px;">${item.msg.substring(0, 50)}...</span><br>
          <small style="font-size:10px; color:gray;">${item.date}</small>
        </div>`;
    });
  }
  document.getElementById('notifBadge').style.display = 'none'; 
  notifModal.style.display = 'block';
});
document.getElementById('closeNotifBtn').onclick = () => document.getElementById('notifModal').style.display = 'none';

function checkNotifications() {
  const lastSeen = localStorage.getItem('pwta_last_seen') || 0;
  let latestDate = 0;
  if(notices.length > 0) latestDate = Math.max(latestDate, new Date(notices[notices.length-1].date).getTime() || 0);
  if(stories.length > 0) latestDate = Math.max(latestDate, new Date(stories[stories.length-1].date).getTime() || 0);
  
  if(latestDate > lastSeen) { document.getElementById('notifBadge').style.display = 'inline-block'; }
}
document.getElementById('notifBtn').addEventListener('click', () => {
  localStorage.setItem('pwta_last_seen', Date.now());
  document.getElementById('notifBadge').style.display = 'none';
});

// --- NOTICE & BLOOD LOGIC ---
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
  saveDataToFirebase('notices', notices); e.target.reset(); alert("Notice Posted!");
});
function deleteNotice(index) { if(isAdmin && confirm('Delete this notice?')) { notices.splice(index, 1); saveDataToFirebase('notices', notices); } }

const bloodList = document.getElementById('bloodList'), searchBlood = document.getElementById('searchBlood');
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
  saveDataToFirebase('donors', donors); e.target.reset(); alert("Donor Registered!");
});
function deleteDonor(index) { if(isAdmin && confirm('Remove this donor?')) { donors.splice(index, 1); saveDataToFirebase('donors', donors); } }

// --- FINANCE LOGIC ---
function renderRevenues() {
  const revList = document.getElementById('revenueList');
  revList.innerHTML = ''; let total = 0;
  const term = document.getElementById('searchRev').value.toLowerCase();
  revenues.forEach((item, index) => {
    if(item.name.toLowerCase().includes(term) || item.date.includes(term)) {
      total += Number(item.amount);
      let receiptHTML = item.fileData ? `<a href="${item.fileData}" target="_blank" class="receipt-link">👁️ Receipt</a>` : '';
      let deleteBtnHTML = isAdmin ? `<button class="delete-btn" style="display:inline-block;" onclick="deleteRevenue(${index})">🗑️</button>` : '';
      revList.innerHTML += `<li><div class="record-top"><b>${item.name}</b><span>₹${item.amount}</span></div><div class="record-bottom"><span>${item.date}</span><div>${receiptHTML} ${deleteBtnHTML}</div></div></li>`;
    }
  });
  document.getElementById('totalRevenue').innerText = total; updateStats();
}

function renderExpenditures() {
  const expList = document.getElementById('expenditureList');
  expList.innerHTML = ''; let total = 0;
  const term = document.getElementById('searchExp').value.toLowerCase();
  expenditures.forEach((item, index) => {
    if(item.name.toLowerCase().includes(term) || item.date.includes(term) || item.category.toLowerCase().includes(term)) {
      total += Number(item.amount);
      let receiptHTML = item.fileData ? `<a href="${item.fileData}" target="_blank" class="receipt-link">👁️ Receipt</a>` : '';
      let deleteBtnHTML = isAdmin ? `<button class="delete-btn" style="display:inline-block;" onclick="deleteExpenditure(${index})">🗑️</button>` : '';
      expList.innerHTML += `<li><div class="record-top"><b>${item.name} <small>(${item.category})</small></b><span>₹${item.amount}</span></div><div class="record-bottom"><span>${item.date}</span><div>${receiptHTML} ${deleteBtnHTML}</div></div></li>`;
    }
  });
  document.getElementById('totalExpenditure').innerText = total; updateStats();
}

document.getElementById('searchRev').addEventListener('input', renderRevenues);
document.getElementById('searchExp').addEventListener('input', renderExpenditures);

document.getElementById('revenueForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!isAdmin) return;
  const secCode = prompt("🔒 Security Check!\nEnter Financial Security Code to Add Revenue:");
  if(secCode !== financialSecurityCode) { alert("❌ Invalid Security Code! Revenue not added."); return; }

  const fileData = await readFileAsDataURL(document.getElementById('revFile').files[0]);
  revenues.push({ name: document.getElementById('revName').value, date: document.getElementById('revDate').value, amount: document.getElementById('revAmount').value, fileData });
  saveDataToFirebase('revenues', revenues); e.target.reset(); alert("✅ Revenue Added!");
});

document.getElementById('expenditureForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if(!isAdmin) return;
  const secCode = prompt("🔒 Security Check!\nEnter Financial Security Code to Add Expense:");
  if(secCode !== financialSecurityCode) { alert("❌ Invalid Security Code! Expense not added."); return; }

  const fileData = await readFileAsDataURL(document.getElementById('expFile').files[0]);
  expenditures.push({ name: document.getElementById('expName').value, category: document.getElementById('expCategory').value, date: document.getElementById('expDate').value, amount: document.getElementById('expAmount').value, fileData });
  saveDataToFirebase('expenditures', expenditures); e.target.reset(); alert("✅ Expense Added!");
});

function deleteRevenue(index) { 
  if(isAdmin) {
    const secCode = prompt("🔒 Security Check!\nEnter Financial Security Code to DELETE Revenue:");
    if(secCode !== financialSecurityCode) { alert("❌ Invalid Security Code! Not deleted."); return; }
    if(confirm('Are you sure you want to delete this Revenue entry?')) { revenues.splice(index, 1); saveDataToFirebase('revenues', revenues); }
  } 
}

function deleteExpenditure(index) { 
  if(isAdmin) {
    const secCode = prompt("🔒 Security Check!\nEnter Financial Security Code to DELETE Expense:");
    if(secCode !== financialSecurityCode) { alert("❌ Invalid Security Code! Not deleted."); return; }
    if(confirm('Are you sure you want to delete this Expense entry?')) { expenditures.splice(index, 1); saveDataToFirebase('expenditures', expenditures); }
  } 
}

function updateStats() {
  let rev = revenues.reduce((s, i) => s + Number(i.amount), 0);
  let exp = expenditures.reduce((s, i) => s + Number(i.amount), 0);
  let bal = rev - exp;
  document.getElementById('balanceAmount').innerText = bal;
  document.getElementById('balanceAmount').style.color = bal < 0 ? '#ffcccc' : 'white';
  updateChart(rev, exp);
  renderCampaign();
}

function updateChart(rev, exp) {
  const ctx = document.getElementById('financeChart').getContext('2d');
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Revenue', 'Expenditure'], datasets: [{ data: [rev, exp], backgroundColor: ['#8cc63f', '#e53935'] }] }, options: { responsive: true } });
}

const idCardModal = document.getElementById('idCardModal');
document.getElementById('volunteerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('volName').value, phone = document.getElementById('volPhone').value, city = document.getElementById('volCity').value;
  document.getElementById('cardName').innerText = name; document.getElementById('cardPhone').innerText = phone; document.getElementById('cardCity').innerText = city;
  const randomId = Math.floor(1000 + Math.random() * 9000); document.getElementById('cardId').innerText = randomId;
  idCardModal.style.display = 'block';
  document.getElementById('closeCardBtn').onclick = () => {
    idCardModal.style.display = 'none';
    window.open(`https://wa.me/${whatsappNumber}?text=Hello PWTA, I am a Volunteer.%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*ID:* PWTA-VOL-${randomId}`, '_blank');
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

// 🔥 100% WORKING REAL PDF GENERATOR (Khata Book Style) 🔥
document.getElementById('downloadPDF').addEventListener('click', () => {
  if (!window.jspdf) {
    alert("PDF library load nahi hui. Kripya internet check karein.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4'); // 'l' for Landscape

  // 1. Header Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("PATWARI WELFARE TRUST ARARIA", 148.5, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Financial Report (Revenue & Expenditure)", 148.5, 28, { align: "center" });

  // 2. REVENUE TABLE (Left Side)
  doc.setFontSize(14);
  doc.setTextColor(140, 198, 63); // Green Color
  doc.setFont("helvetica", "bold");
  doc.text("REVENUE", 15, 40);

  const revBody = revenues.map(r => [r.date, r.name, `Rs. ${r.amount}`]);
  let totalRev = revenues.reduce((sum, r) => sum + Number(r.amount), 0);
  revBody.push(["", "Total Revenue", `Rs. ${totalRev}`]);

  doc.autoTable({
    startY: 45,
    head: [['Date', 'Name', 'Amount']],
    body: revBody,
    theme: 'grid',
    headStyles: { fillColor: [140, 198, 63] },
    styles: { fontSize: 10 },
    columnStyles: { 2: { halign: 'right' } },
    margin: { left: 15, right: 155 } // Left side fix
  });

  // 3. EXPENSES TABLE (Right Side)
  doc.setFontSize(14);
  doc.setTextColor(229, 57, 53); // Red Color
  doc.setFont("helvetica", "bold");
  doc.text("EXPENSES", 155, 40);

  const expBody = expenditures.map(e => [e.date, e.name, e.category, `Rs. ${e.amount}`]);
  let totalExp = expenditures.reduce((sum, e) => sum + Number(e.amount), 0);
  expBody.push(["", "Total Expenses", "", `Rs. ${totalExp}`]);

  doc.autoTable({
    startY: 45,
    head: [['Date', 'Name', 'Category', 'Amount']],
    body: expBody,
    theme: 'grid',
    headStyles: { fillColor: [229, 57, 53] },
    styles: { fontSize: 10 },
    columnStyles: { 3: { halign: 'right' } },
    margin: { left: 155, right: 15 } // Right side fix
  });

  // 4. PDF Download Karna
  doc.save('PWTA_Financial_Report.pdf');
});

document.getElementById('backupBtn').addEventListener('click', () => {
  const data = { revenues, expenditures, notices, donors, stories, campaign, gallery };
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
        saveDataToFirebase('revenues', data.revenues); saveDataToFirebase('expenditures', data.expenditures);
        saveDataToFirebase('notices', data.notices || []); saveDataToFirebase('donors', data.donors || []);
        saveDataToFirebase('stories', data.stories || []); saveDataToFirebase('gallery', data.gallery || []);
        if(data.campaign) db.ref('pwta_data/campaign').set(data.campaign);
        alert("Data Restored!"); 
      }
    } catch (err) { alert("Invalid File!"); }
  };
  reader.readAsText(file);
});

toggleAdminUI();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then((reg) => {
    reg.onupdatefound = () => {
      const installingWorker = reg.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) { window.location.reload(); }
      }
    };
  });
}
