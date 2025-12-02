let quickFillButton = null;
let autoFillButton = null;

function createFloatingButtons() {
  if (quickFillButton && autoFillButton) return;
  
  // Quick Fill Button (Full automation)
  quickFillButton = document.createElement('button');
  quickFillButton.id = 'kinerja-quickfill-btn';
  quickFillButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
    </svg>
    <span>Quick Fill</span>
  `;
  quickFillButton.className = 'kinerja-autofill-floating-btn kinerja-quickfill';
  quickFillButton.title = 'Otomasi penuh: Klik tanggal → Pilih aktivitas → Isi form';
  
  quickFillButton.addEventListener('click', () => {
    startQuickFill();
  });
  
  // Auto Fill Button (Fill modal only)
  autoFillButton = document.createElement('button');
  autoFillButton.id = 'kinerja-autofill-btn';
  autoFillButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path>
    </svg>
    <span>Auto Fill</span>
  `;
  autoFillButton.className = 'kinerja-autofill-floating-btn kinerja-autofill';
  autoFillButton.title = 'Isi form modal yang sudah terbuka';
  
  autoFillButton.addEventListener('click', () => {
    const today = new Date().getDay();
    if (today === 0 || today === 6) {
      alert('Hari ini weekend, tidak ada jadwal aktivitas!');
      return;
    }
    
    openModalAndFill();
  });
  
  document.body.appendChild(quickFillButton);
  document.body.appendChild(autoFillButton);
}

function startQuickFill() {
  try {
    chrome.storage.sync.get(['templates', 'selectedDate'], (result) => {
      if (chrome.runtime.lastError) {
        alert('Extension error. Silakan refresh halaman ini (F5) dan coba lagi.');
        return;
      }
      
      const templates = result.templates || {};
      const selectedDate = result.selectedDate || getTodayDateString();
      
      // Get day name from selected date
      const dateObj = new Date(selectedDate);
      const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
      const dayName = days[dateObj.getDay()];
      
      if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
        alert('Tanggal yang dipilih adalah weekend, tidak ada jadwal aktivitas!');
        return;
      }
      
      const dayActivities = templates[dayName];
      
      // Check if activities is an array (new format) or object (old format)
      let activities = [];
      if (Array.isArray(dayActivities)) {
        activities = dayActivities;
      } else if (dayActivities && dayActivities.namaAktivitas) {
        // Old format - convert to array
        activities = [dayActivities];
      }
      
      if (activities.length === 0) {
        alert(`Belum ada aktivitas untuk hari ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}!\nSilakan setup aktivitas di popup extension.`);
        return;
      }
      
      // Step 1: Click selected date in calendar
      const clicked = clickSelectedDate(selectedDate);
      
      if (!clicked) {
        alert(`Tanggal ${selectedDate} tidak ditemukan di kalender!\nPastikan tanggal berada di bulan yang sedang ditampilkan.`);
        return;
      }
      
      // Step 2: Process all activities sequentially
      setTimeout(() => {
        processActivitiesSequentially(activities, 0);
      }, 500);
    });
  } catch (error) {
    alert('Extension error. Silakan refresh halaman ini (F5) dan coba lagi.');
  }
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function processActivitiesSequentially(activities, index) {
  if (index >= activities.length) {
    alert(`✅ Selesai! ${activities.length} aktivitas telah diproses.`);
    return;
  }
  
  const activity = activities[index];
  
  // Click the correct tab (Utama or Tambahan)
  clickActivityTab(activity.tipe || 'utama');
  
  setTimeout(() => {
    const found = findAndClickActivity(activity.namaAktivitas);
    
    if (found) {
      // Wait for modal, then fill form
      setTimeout(() => {
        waitForForm(activity, 10, () => {
          // After filling, wait a bit then process next activity
          setTimeout(() => {
            processActivitiesSequentially(activities, index + 1);
          }, 1500);
        });
      }, 800);
    } else {
      // If activity not found, skip to next
      setTimeout(() => {
        processActivitiesSequentially(activities, index + 1);
      }, 500);
    }
  }, 300);
}

function clickActivityTab(tipe) {
  const tabs = document.querySelectorAll('button[type="button"]');
  for (const tab of tabs) {
    const text = tab.textContent.toLowerCase();
    if (tipe === 'utama' && text.includes('aktivitas') && text.includes('utama')) {
      tab.click();
      return;
    } else if (tipe === 'tambahan' && text.includes('aktivitas') && text.includes('tambahan')) {
      tab.click();
      return;
    }
  }
}

function clickSelectedDate(dateString) {
  // Parse the date string (format: YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Find all day cells in the calendar
  const dayCells = document.querySelectorAll('.vc-day');
  
  for (const cell of dayCells) {
    // Get the day attribute which contains the date info
    const dayAttr = cell.getAttribute('data-id');
    
    if (dayAttr) {
      // data-id format is usually like "YYYY-MM-DD"
      const [cellYear, cellMonth, cellDay] = dayAttr.split('-').map(Number);
      
      if (cellYear === year && cellMonth === month && cellDay === day) {
        const dayContent = cell.querySelector('.vc-day-content');
        if (dayContent) {
          dayContent.click();
          return true;
        }
      }
    } else {
      // Alternative: check using aria-label or other attributes
      const ariaLabel = cell.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.includes(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)) {
        const dayContent = cell.querySelector('.vc-day-content');
        if (dayContent) {
          dayContent.click();
          return true;
        }
      }
    }
  }
  
  // Fallback: try matching by day number and checking if it's in the current visible month
  for (const cell of dayCells) {
    const dayContent = cell.querySelector('.vc-day-content');
    if (dayContent && parseInt(dayContent.textContent.trim()) === day) {
      // Check if this cell is not from previous/next month (usually has special class)
      if (!cell.classList.contains('is-not-in-month')) {
        dayContent.click();
        return true;
      }
    }
  }
  
  return false;
}

function findAndClickActivity(activityName) {
  const activityCards = document.querySelectorAll('.border.rounded-lg');
  
  for (const card of activityCards) {
    const h5 = card.querySelector('h5');
    if (h5 && (h5.textContent.includes(activityName) || activityName.includes(h5.textContent.trim()))) {
      const laporButton = card.querySelector('button');
      if (laporButton && laporButton.textContent.includes('Lapor')) {
        laporButton.click();
        return true;
      }
    }
  }
  
  alert(`Aktivitas "${activityName}" tidak ditemukan!\nPastikan nama aktivitas di template sama dengan yang ada di daftar.`);
  return false;
}

function openModalAndFill() {
  try {
    chrome.storage.sync.get(['templates'], (result) => {
      if (chrome.runtime.lastError) {
        alert('Extension error. Silakan refresh halaman ini (F5) dan coba lagi.');
        return;
      }
      
      const templates = result.templates || {};
      const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
      const today = days[new Date().getDay()];
      const todayActivities = templates[today];
      
      // Check if activities is an array (new format) or object (old format)
      let template = null;
      if (Array.isArray(todayActivities)) {
        // New format - use first activity if modal is already open
        if (todayActivities.length === 0) {
          alert(`Belum ada aktivitas untuk hari ${today.charAt(0).toUpperCase() + today.slice(1)}!\nSilakan setup aktivitas di popup extension.`);
          return;
        }
        template = todayActivities[0];
      } else if (todayActivities && todayActivities.namaAktivitas) {
        // Old format
        template = todayActivities;
      } else {
        alert(`Belum ada aktivitas untuk hari ${today.charAt(0).toUpperCase() + today.slice(1)}!\nSilakan setup aktivitas di popup extension.`);
        return;
      }
      
      // This is for manual modal filling (when modal is already open)
      waitForForm(template, 10);
    });
  } catch (error) {
    alert('Extension error. Silakan refresh halaman ini (F5) dan coba lagi.');
  }
}

function waitForForm(template, maxRetries, onComplete) {
  let retries = 0;
  
  const checkForm = setInterval(() => {
    const modal = document.getElementById('aktivitas-input-modal');
    const namaAktivitasInput = document.getElementById('nama-aktivitas');
    
    if (modal && namaAktivitasInput) {
      clearInterval(checkForm);
      setTimeout(() => {
        fillForm(template, onComplete);
      }, 500);
    } else {
      retries++;
      if (retries >= maxRetries) {
        clearInterval(checkForm);
        alert('Form tidak ditemukan setelah beberapa kali percobaan.\nSilakan buka form manual terlebih dahulu, lalu klik Auto Fill lagi.');
        if (onComplete) onComplete();
      }
    }
  }, 300);
}

function fillForm(template, onComplete) {
  const modal = document.getElementById('aktivitas-input-modal');
  if (!modal) {
    alert('Modal form tidak ditemukan!');
    if (onComplete) onComplete();
    return;
  }
  
  const namaAktivitasInput = document.getElementById('nama-aktivitas');
  if (namaAktivitasInput) {
    namaAktivitasInput.removeAttribute('readonly');
    namaAktivitasInput.disabled = false;
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(namaAktivitasInput, template.namaAktivitas);
    
    const inputEvent = new Event('input', { bubbles: true });
    namaAktivitasInput.dispatchEvent(inputEvent);
    
    const changeEvent = new Event('change', { bubbles: true });
    namaAktivitasInput.dispatchEvent(changeEvent);
  }
  
  if (template.sasaranKinerja) {
    setTimeout(() => {
      fillVueSelect('sasaran-kinerja', template.sasaranKinerja);
    }, 200);
  }
  
  setTimeout(() => {
    const outputAktivitasInput = document.getElementById('output-aktivitas');
    if (outputAktivitasInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(outputAktivitasInput, template.outputAktivitas);
      
      outputAktivitasInput.dispatchEvent(new Event('input', { bubbles: true }));
      outputAktivitasInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, 400);
  
  setTimeout(() => {
    const keteranganTextarea = document.getElementById('keterangan');
    if (keteranganTextarea) {
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      nativeTextAreaValueSetter.call(keteranganTextarea, template.keterangan);
      
      keteranganTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      keteranganTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, 600);
  
  if (template.waktuMulai) {
    setTimeout(() => {
      fillVueSelect('waktu-mulai', template.waktuMulai);
    }, 800);
  }
  
  if (template.waktuSelesai) {
    setTimeout(() => {
      fillVueSelect('waktu-selesai', template.waktuSelesai);
    }, 1400);
  }
  
  setTimeout(() => {
    // Click Simpan button
    const simpanButtons = document.querySelectorAll('button');
    const simpanBtn = Array.from(simpanButtons).find(btn => 
      btn.textContent.toLowerCase().includes('simpan')
    );
    
    if (simpanBtn) {
      simpanBtn.click();
    }
    
    // Callback after a delay
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
  }, 2000);
}

function fillVueSelect(inputId, value) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const vueSelectContainer = input.closest('.v-select');
  if (!vueSelectContainer) return;
  
  const dropdown = vueSelectContainer.querySelector('.vs__dropdown-toggle');
  if (!dropdown) return;
  
  input.focus();
  
  const mousedownEvent = new MouseEvent('mousedown', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  dropdown.dispatchEvent(mousedownEvent);
  
  const clickEvent = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  dropdown.dispatchEvent(clickEvent);
  
  const mouseupEvent = new MouseEvent('mouseup', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  dropdown.dispatchEvent(mouseupEvent);
  
  waitForListboxAndSelect(vueSelectContainer, value, inputId, dropdown, 0);
}

function waitForListboxAndSelect(container, value, inputId, dropdown, retryCount) {
  const maxRetries = 10;
  
  setTimeout(() => {
    const listbox = container.querySelector('[role="listbox"]');
    
    if (listbox && listbox.style.display !== 'none' && listbox.style.visibility !== 'hidden') {
      const options = listbox.querySelectorAll('[role="option"]');
      
      if (options.length > 0) {
        const matchingOption = Array.from(options).find(opt => {
          const optText = opt.textContent.trim();
          return optText === value || optText.includes(value) || value.includes(optText);
        });
        
        if (matchingOption) {
          matchingOption.click();
        } else {
          const closeBtn = container.querySelector('.vs__clear');
          if (closeBtn) closeBtn.click();
        }
      } else {
        if (retryCount < maxRetries) {
          waitForListboxAndSelect(container, value, inputId, dropdown, retryCount + 1);
        }
      }
    } else {
      if (retryCount < maxRetries) {
        waitForListboxAndSelect(container, value, inputId, dropdown, retryCount + 1);
      }
    }
  }, 150);
}

function init() {
  if (window.location.href.includes('kinerja.jabarprov.go.id')) {
    createFloatingButtons();
    
    const observer = new MutationObserver(() => {
      if (!document.getElementById('kinerja-quickfill-btn') || !document.getElementById('kinerja-autofill-btn')) {
        createFloatingButtons();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
