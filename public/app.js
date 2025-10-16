const $ = sel => document.querySelector(sel);
const phoneInput = $('#phone');
const sendCodeBtn = $('#sendCodeBtn');
const codeInput = $('#code');
const verifyBtn = $('#verifyBtn');
const passwordInput = $('#password');
const setPasswordBtn = $('#setPasswordBtn');
const logEl = $('#log');
const themeToggle = document.getElementById('themeToggle');

let phone = '';
let cooldown = 0; // seconds remaining
let countdownInterval = null;

function log(...args) {
  logEl.textContent += args.join(' ') + '\n';
  logEl.scrollTop = logEl.scrollHeight;
}

function showStep(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  // focus first input in the step
  setTimeout(() => {
    const first = el && el.querySelector('input');
    if (first) first.focus();
  }, 50);
}

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  try {
    return await res.json();
  } catch (e) {
    return { error: 'invalid_response' };
  }
}

function startCooldown(seconds) {
  if (countdownInterval) clearInterval(countdownInterval);
  cooldown = seconds;
  sendCodeBtn.disabled = true;
  updateSendBtn();
  countdownInterval = setInterval(() => {
    cooldown--;
    if (cooldown <= 0) {
      clearInterval(countdownInterval);
      sendCodeBtn.disabled = false;
      sendCodeBtn.textContent = 'Send Code';
      return;
    }
    updateSendBtn();
  }, 1000);
}

function updateSendBtn() {
  sendCodeBtn.textContent = `Send Code (${cooldown}s)`;
}

sendCodeBtn.addEventListener('click', async () => {
  phone = phoneInput.value.trim();
  if (!phone) return alert('Enter phone');
  log(`Requesting code for ${phone}`);
  const resp = await postJSON('/api/send-code', { phone });
  if (resp && resp.ok) {
    startCooldown(resp.wait || 60);
    showStep('step-code');
  } else if (resp && resp.error === 'wait') {
    startCooldown(resp.wait);
    alert('Please wait ' + resp.wait + 's before requesting a new code');
  } else {
    alert('Error sending code');
  }
});

verifyBtn.addEventListener('click', async () => {
  const code = codeInput.value.trim();
  if (!code) return alert('Enter code');
  log(`Verifying code for ${phone} ${code}`);
  const resp = await postJSON('/api/verify-code', { phone, code });
  if (resp && resp.ok) {
    showStep('step-password');
  } else {
    alert('Invalid code');
  }
});

setPasswordBtn.addEventListener('click', async () => {
  const password = passwordInput.value;
  if (!password) return alert('Enter password');
  log(`Setting password for ${phone}`);
  const resp = await postJSON('/api/set-password', { phone, password });
  if (resp && resp.ok) {
    showStep('done');
  } else {
    alert('Error setting password');
  }
});

// keyboard: Enter to progress
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const visible = document.querySelector('.step:not(.hidden)');
    if (!visible) return;
    if (visible.id === 'step-phone') sendCodeBtn.click();
    else if (visible.id === 'step-code') verifyBtn.click();
    else if (visible.id === 'step-password') setPasswordBtn.click();
  }
});

// show first step
showStep('step-phone');

// theme handling
function applyTheme(dark) {
  if (dark) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

const saved = localStorage.getItem('darkTheme');
if (saved !== null) {
  const isDark = saved === '1';
  applyTheme(isDark);
  if (themeToggle) themeToggle.checked = isDark;
}

if (themeToggle) {
  themeToggle.addEventListener('change', (e) => {
    const val = !!e.target.checked;
    applyTheme(val);
    localStorage.setItem('darkTheme', val ? '1' : '0');
  });
}
