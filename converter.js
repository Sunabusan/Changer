
let fromCurrency = document.getElementById('from');
let toCurrency = document.getElementById('to');
let form = document.querySelector('.converter-form');
let rateDisplay = document.getElementById('rate-display');


let convertedDisplay = document.getElementById('converted-display');
let amountInput = document.getElementById('amount');

const API_BASE = 'https://open.er-api.com/v6/latest';

async function fetchRate(from, to) {
  try {
    rateDisplay.textContent = 'Завантаження курсу...';
    const res = await fetch(`${API_BASE}/${encodeURIComponent(from)}`);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Network response was not ok: ${res.status} ${txt}`);
    }
    const data = await res.json();
    if (!data || data.result !== 'success') {
      const msg = (data && data['error-type']) ? data['error-type'] : 'Невідома помилка API';
      throw new Error(msg);
    }
    const rate = data && data.rates && data.rates[to];
    if (rate === undefined || rate === null) throw new Error('Курс недоступний');
    const date = data.time_last_update_utc || data.time_last_update_unix || '';
    return { rate, date };
  } catch (err) {
    rateDisplay.textContent = `Помилка: ${err.message}`;
    console.error(err);
    throw err;
  }
}

async function updateConversion(showResult = true) {
  const from = fromCurrency.value;
  const to = toCurrency.value;
  const amount = parseFloat(amountInput.value) || 0;

  try {
    const { rate, date } = await fetchRate(from, to);
    rateDisplay.textContent = `Курс (${date}): 1 ${from} = ${rate.toFixed(6)} ${to}`;
    if (showResult) {
      const converted = amount * rate;
      convertedDisplay.textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
    }
  } catch (err) {
    convertedDisplay.textContent = '';
  }
}

fromCurrency.addEventListener('change', () => updateConversion(false));
toCurrency.addEventListener('change', () => updateConversion(false));

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const amountVal = parseFloat(amountInput.value);
  if (isNaN(amountVal) || amountVal < 0) {
    amountInput.setCustomValidity('Введіть коректну суму');
    amountInput.reportValidity();
    return;
  }
  amountInput.setCustomValidity('');
  updateConversion(true);
});

window.addEventListener('load', function () {
  updateConversion(false);
});



