let currentDay = 'senin';
let templates = {};
let activityIdCounter = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
  setupEventListeners();
  loadSelectedDate();
});

function setupEventListeners() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDay = btn.dataset.day;
      renderActivities();
    });
  });
  
  document.getElementById('addActivity').addEventListener('click', addNewActivity);
  document.getElementById('saveAll').addEventListener('click', saveAllActivities);
  document.getElementById('copyTemplate').addEventListener('click', copyToAllDays);
  document.getElementById('clearAll').addEventListener('click', clearAllTemplates);
  
  // Date picker listeners
  const dateInput = document.getElementById('quickfill-date');
  dateInput.addEventListener('change', saveSelectedDate);
  
  document.getElementById('resetDate').addEventListener('click', () => {
    setTodayDate();
    saveSelectedDate();
  });
}

function loadTemplates() {
  chrome.storage.sync.get(['templates'], (result) => {
    templates = result.templates || {};
    renderActivities();
  });
}

function renderActivities() {
  const container = document.getElementById('activities-container');
  let activities = templates[currentDay] || [];
  
  // Handle old format (object) - convert to array
  if (!Array.isArray(activities)) {
    if (activities.namaAktivitas) {
      // Old format detected - convert to new format
      activities = [activities];
      templates[currentDay] = activities;
      // Save converted format
      chrome.storage.sync.set({ templates });
    } else {
      activities = [];
    }
  }
  
  container.innerHTML = '';
  
  if (activities.length === 0) {
    container.innerHTML = '<p class="no-activities">Belum ada aktivitas. Klik "Tambah Aktivitas" untuk mulai.</p>';
    return;
  }
  
  activities.forEach((activity, index) => {
    const activityCard = createActivityCard(activity, index);
    container.appendChild(activityCard);
  });
}

function createActivityCard(activity, index) {
  const card = document.createElement('div');
  card.className = 'activity-card';
  card.dataset.index = index;
  
  const activityName = activity.namaAktivitas ? `: ${activity.namaAktivitas.substring(0, 30)}...` : '';
  
  card.innerHTML = `
    <div class="activity-header">
      <div class="activity-header-left">
        <button class="btn-collapse" data-index="${index}">
          <svg class="collapse-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
        <h3>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <path d="M12 11h4"/>
            <path d="M12 16h4"/>
            <path d="M8 11h.01"/>
            <path d="M8 16h.01"/>
          </svg>
          Aktivitas #${index + 1}<span class="activity-preview">${activityName}</span>
        </h3>
      </div>
      <button class="btn-delete" data-index="${index}">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" x2="10" y1="11" y2="17"/>
          <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
      </button>
    </div>
    
    <div class="activity-content">
    
    <div class="form-group">
      <label>Tipe Aktivitas</label>
      <div class="radio-group">
        <label class="radio-label">
          <input type="radio" name="tipe-${index}" value="utama" ${activity.tipe === 'utama' ? 'checked' : ''}>
          <span>Utama</span>
        </label>
        <label class="radio-label">
          <input type="radio" name="tipe-${index}" value="tambahan" ${activity.tipe === 'tambahan' ? 'checked' : ''}>
          <span>Tambahan</span>
        </label>
      </div>
    </div>
    
    <div class="form-group">
      <label>Nama Aktivitas</label>
      <input type="text" class="activity-nama" value="${activity.namaAktivitas || ''}" 
             placeholder="Melaksanakan kegiatan pembelajaran...">
    </div>
    
    <div class="form-group">
      <label>Sasaran Kinerja Terkait</label>
      <input type="text" class="activity-sasaran" value="${activity.sasaranKinerja || ''}" 
             placeholder="(Guru Mapel) Terbimbingnya Siswa...">
      <small>Masukkan teks yang persis atau sebagian dari dropdown</small>
    </div>
    
    <div class="form-group">
      <label>Output Aktivitas (JTM)</label>
      <input type="number" class="activity-output" value="${activity.outputAktivitas || '1'}" min="1">
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Waktu Mulai</label>
        <input type="time" class="activity-waktu-mulai" value="${activity.waktuMulai || '07:00'}">
      </div>
      <div class="form-group">
        <label>Waktu Selesai</label>
        <input type="time" class="activity-waktu-selesai" value="${activity.waktuSelesai || '08:00'}">
      </div>
    </div>
    
    <div class="form-group">
      <label>Keterangan</label>
      <textarea class="activity-keterangan" rows="3" 
                placeholder="Isilah dengan singkat, padat, dan jelas.">${activity.keterangan || ''}</textarea>
    </div>
    </div>
  `;
  
  const deleteBtn = card.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteActivity(index);
  });
  
  const collapseBtn = card.querySelector('.btn-collapse');
  collapseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCollapse(card);
  });
  
  // Default: collapse semua aktivitas
  card.classList.add('collapsed');
  
  return card;
}

function toggleCollapse(card) {
  card.classList.toggle('collapsed');
}

function addNewActivity() {
  if (!templates[currentDay]) {
    templates[currentDay] = [];
  }
  
  // Ensure it's an array
  if (!Array.isArray(templates[currentDay])) {
    templates[currentDay] = [];
  }
  
  templates[currentDay].push({
    tipe: 'utama',
    namaAktivitas: '',
    sasaranKinerja: '',
    outputAktivitas: '1',
    waktuMulai: '07:00',
    waktuSelesai: '08:00',
    keterangan: ''
  });
  
  renderActivities();
  
  // Scroll to bottom
  const container = document.getElementById('activities-container');
  container.scrollTop = container.scrollHeight;
}

function deleteActivity(index) {
  if (confirm('Yakin ingin menghapus aktivitas ini?')) {
    templates[currentDay].splice(index, 1);
    renderActivities();
  }
}

function saveAllActivities() {
  const cards = document.querySelectorAll('.activity-card');
  const activities = [];
  
  cards.forEach((card, index) => {
    const tipeRadios = card.querySelectorAll(`input[name="tipe-${index}"]`);
    let tipe = 'utama';
    tipeRadios.forEach(radio => {
      if (radio.checked) tipe = radio.value;
    });
    
    activities.push({
      tipe: tipe,
      namaAktivitas: card.querySelector('.activity-nama').value,
      sasaranKinerja: card.querySelector('.activity-sasaran').value,
      outputAktivitas: card.querySelector('.activity-output').value,
      waktuMulai: card.querySelector('.activity-waktu-mulai').value,
      waktuSelesai: card.querySelector('.activity-waktu-selesai').value,
      keterangan: card.querySelector('.activity-keterangan').value
    });
  });
  
  templates[currentDay] = activities;
  
  chrome.storage.sync.set({ templates }, () => {
    showNotification(`
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
      <span>Semua aktivitas berhasil disimpan!</span>
    `);
  });
}

function copyToAllDays() {
  let currentActivities = templates[currentDay];
  
  // Handle old format
  if (!Array.isArray(currentActivities)) {
    if (currentActivities && currentActivities.namaAktivitas) {
      currentActivities = [currentActivities];
    } else {
      currentActivities = [];
    }
  }
  
  if (currentActivities.length === 0) {
    showNotification(`
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4M12 16h.01"/>
      </svg>
      <span>Tidak ada aktivitas untuk di-copy!</span>
    `, 'warning');
    return;
  }
  
  if (confirm(`Copy ${currentActivities.length} aktivitas dari ${currentDay.toUpperCase()} ke semua hari?`)) {
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    days.forEach(day => {
      templates[day] = JSON.parse(JSON.stringify(currentActivities));
    });
    
    chrome.storage.sync.set({ templates }, () => {
      showNotification(`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        <span>Aktivitas berhasil di-copy ke semua hari!</span>
      `);
    });
  }
}

function clearAllTemplates() {
  if (confirm('Yakin ingin menghapus SEMUA aktivitas di SEMUA hari?')) {
    templates = {};
    chrome.storage.sync.set({ templates }, () => {
      renderActivities();
      showNotification(`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" x2="10" y1="11" y2="17"/>
          <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
        <span>Semua aktivitas berhasil dihapus!</span>
      `);
    });
  }
}

function loadSelectedDate() {
  chrome.storage.sync.get(['selectedDate'], (result) => {
    const dateInput = document.getElementById('quickfill-date');
    if (result.selectedDate) {
      dateInput.value = result.selectedDate;
    } else {
      setTodayDate();
    }
  });
}

function setTodayDate() {
  const dateInput = document.getElementById('quickfill-date');
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${year}-${month}-${day}`;
}

function saveSelectedDate() {
  const dateInput = document.getElementById('quickfill-date');
  chrome.storage.sync.set({ selectedDate: dateInput.value }, () => {
    showNotification(`
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 2v4M16 2v4"/>
        <rect width="18" height="18" x="3" y="4" rx="2"/>
        <path d="M3 10h18"/>
        <path d="m9 16 2 2 4-4"/>
      </svg>
      <span>Tanggal berhasil disimpan!</span>
    `);
  });
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.innerHTML = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#10b981' : '#f59e0b'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideDown 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;
document.head.appendChild(style);
