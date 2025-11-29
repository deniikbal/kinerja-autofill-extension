let autoFillButton = null;

function createFloatingButton() {
  if (autoFillButton) return;
  
  autoFillButton = document.createElement('button');
  autoFillButton.id = 'kinerja-autofill-btn';
  autoFillButton.innerHTML = '⚡ Auto Fill';
  autoFillButton.className = 'kinerja-autofill-floating-btn';
  
  autoFillButton.addEventListener('click', () => {
    const today = new Date().getDay();
    if (today === 0 || today === 6) {
      alert('Hari ini weekend, tidak ada jadwal aktivitas!');
      return;
    }
    
    openModalAndFill();
  });
  
  document.body.appendChild(autoFillButton);
}

function openModalAndFill() {
  chrome.storage.sync.get(['templates'], (result) => {
    const templates = result.templates || {};
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const today = days[new Date().getDay()];
    const todayTemplate = templates[today];
    
    if (!todayTemplate) {
      alert(`Belum ada template untuk hari ${today.charAt(0).toUpperCase() + today.slice(1)}!\nSilakan setup template di popup extension.`);
      return;
    }
    
    const addButton = document.querySelector('button[type="button"]');
    if (addButton && addButton.textContent.includes('Tambah')) {
      addButton.click();
      
      setTimeout(() => {
        fillForm(todayTemplate);
      }, 500);
    } else {
      const modal = document.querySelector('[role="dialog"], .modal, .modal-content');
      if (modal && modal.style.display !== 'none') {
        fillForm(todayTemplate);
      } else {
        alert('Tidak dapat menemukan tombol atau modal form. Pastikan Anda berada di halaman aktivitas.');
      }
    }
  });
}

function fillForm(template) {
  const form = document.querySelector('form');
  if (!form) {
    alert('Form tidak ditemukan!');
    return;
  }
  
  const namaAktivitasInput = form.querySelector('input[type="text"]');
  if (namaAktivitasInput && template.namaAktivitas) {
    namaAktivitasInput.value = template.namaAktivitas;
    namaAktivitasInput.dispatchEvent(new Event('input', { bubbles: true }));
    namaAktivitasInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  const dropdowns = form.querySelectorAll('select, [role="combobox"]');
  if (dropdowns.length > 0 && template.sasaranKinerja) {
    const sasaranDropdown = dropdowns[0];
    if (sasaranDropdown.tagName === 'SELECT') {
      const options = Array.from(sasaranDropdown.options);
      const matchingOption = options.find(opt => 
        opt.text.includes(template.sasaranKinerja) || opt.value === template.sasaranKinerja
      );
      if (matchingOption) {
        sasaranDropdown.value = matchingOption.value;
        sasaranDropdown.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      sasaranDropdown.click();
      setTimeout(() => {
        const options = document.querySelectorAll('[role="option"]');
        const matchingOption = Array.from(options).find(opt => 
          opt.textContent.includes(template.sasaranKinerja)
        );
        if (matchingOption) matchingOption.click();
      }, 200);
    }
  }
  
  const numberInputs = form.querySelectorAll('input[type="number"]');
  if (numberInputs.length > 0 && template.outputAktivitas) {
    numberInputs[0].value = template.outputAktivitas;
    numberInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    numberInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  const timeInputs = form.querySelectorAll('input[type="time"], select[class*="time"], select');
  let timeSelects = Array.from(timeInputs).filter(input => {
    const parentText = input.parentElement?.textContent || '';
    return parentText.includes('Waktu') || input.name?.includes('waktu') || input.id?.includes('waktu');
  });
  
  if (timeSelects.length >= 2 && template.waktuMulai && template.waktuSelesai) {
    const waktuMulai = timeSelects[0];
    const waktuSelesai = timeSelects[1];
    
    if (waktuMulai.tagName === 'SELECT') {
      waktuMulai.value = template.waktuMulai;
      waktuMulai.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      waktuMulai.value = template.waktuMulai;
      waktuMulai.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (waktuSelesai.tagName === 'SELECT') {
      waktuSelesai.value = template.waktuSelesai;
      waktuSelesai.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      waktuSelesai.value = template.waktuSelesai;
      waktuSelesai.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  const textareas = form.querySelectorAll('textarea');
  if (textareas.length > 0 && template.keterangan) {
    textareas[0].value = template.keterangan;
    textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
    textareas[0].dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  if (template.autoSave) {
    setTimeout(() => {
      const simpanButton = form.querySelector('button[type="submit"], button.btn-primary, button');
      const buttons = Array.from(form.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => 
        btn.textContent.toLowerCase().includes('simpan') || 
        btn.className.includes('primary')
      );
      
      if (saveBtn) {
        alert('Form telah diisi! Klik OK untuk menyimpan.');
        saveBtn.click();
      } else if (simpanButton) {
        alert('Form telah diisi! Klik OK untuk menyimpan.');
        simpanButton.click();
      }
    }, 1000);
  } else {
    alert('Form berhasil diisi! Silakan cek dan klik tombol Simpan.');
  }
}

function init() {
  if (window.location.href.includes('kinerja.jabarprov.go.id')) {
    createFloatingButton();
    
    const observer = new MutationObserver(() => {
      if (!document.getElementById('kinerja-autofill-btn')) {
        createFloatingButton();
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
