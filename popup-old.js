let currentDay = 'senin';
let templates = {};

document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
  setupEventListeners();
});

function setupEventListeners() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDay = btn.dataset.day;
      loadFormForDay(currentDay);
    });
  });
  
  document.getElementById('templateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveTemplate();
  });
  
  document.getElementById('copyTemplate').addEventListener('click', copyToAllDays);
  document.getElementById('clearAll').addEventListener('click', clearAllTemplates);
}

function loadTemplates() {
  chrome.storage.sync.get(['templates'], (result) => {
    templates = result.templates || {};
    loadFormForDay(currentDay);
  });
}

function loadFormForDay(day) {
  const template = templates[day] || {};
  
  document.getElementById('namaAktivitas').value = template.namaAktivitas || '';
  document.getElementById('sasaranKinerja').value = template.sasaranKinerja || '';
  document.getElementById('outputAktivitas').value = template.outputAktivitas || '1';
  document.getElementById('waktuMulai').value = template.waktuMulai || '07:00';
  document.getElementById('waktuSelesai').value = template.waktuSelesai || '08:00';
  document.getElementById('keterangan').value = template.keterangan || '';
}

function saveTemplate() {
  const template = {
    namaAktivitas: document.getElementById('namaAktivitas').value,
    sasaranKinerja: document.getElementById('sasaranKinerja').value,
    outputAktivitas: document.getElementById('outputAktivitas').value,
    waktuMulai: document.getElementById('waktuMulai').value,
    waktuSelesai: document.getElementById('waktuSelesai').value,
    keterangan: document.getElementById('keterangan').value
  };
  
  templates[currentDay] = template;
  
  chrome.storage.sync.set({ templates }, () => {
    showNotification('✅ Template berhasil disimpan!');
  });
}

function copyToAllDays() {
  const currentTemplate = templates[currentDay];
  
  if (!currentTemplate || !currentTemplate.namaAktivitas) {
    showNotification('⚠️ Isi template ini dulu sebelum copy!', 'warning');
    return;
  }
  
  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
  days.forEach(day => {
    templates[day] = { ...currentTemplate };
  });
  
  chrome.storage.sync.set({ templates }, () => {
    showNotification('✅ Template berhasil di-copy ke semua hari!');
  });
}

function clearAllTemplates() {
  if (confirm('Yakin ingin menghapus semua template?')) {
    templates = {};
    chrome.storage.sync.set({ templates }, () => {
      loadFormForDay(currentDay);
      showNotification('🗑️ Semua template berhasil dihapus!');
    });
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.textContent = message;
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
