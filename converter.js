
let fromCurrency = document.getElementById('from');
let toCurrency = document.getElementById('to');
let form = document.querySelector('.converter-form');
let rateDisplay = document.getElementById('rate-display');

let rates = {
  'USD': 1,
  'EUR': 0.92,
  'UAH': 41.5,
  'GBP': 0.79,
  'JPY': 149.5
};

function getRate() {
  let from = fromCurrency.value;
  let to = toCurrency.value;
  let rateFromUSD = rates[from];
  let rateToUSD = rates[to];
  
  let rate = rateToUSD / rateFromUSD;
  
  console.log('Курс: 1 ' + from + ' = ' + rate.toFixed(2) + ' ' + to);
  
  return rate;
}
fromCurrency.addEventListener('change', function() {
  getRate();
});

toCurrency.addEventListener('change', function() {
  getRate();
});



window.addEventListener('load', function() {
  getRate();
});



function handlePayment(event) {
  event.preventDefault();
  
  let card = document.getElementById('card');
  let cvc = document.getElementById('cvc');
  let amount = document.getElementById('amount');
  
  // своя валидация
  if (!card.value) {
    card.setCustomValidity('Будь ласка, введіть номер карти');
    card.reportValidity();
    return false;
  }
  if (!cvc.value) {
    cvc.setCustomValidity('Будь ласка, введіть CVC код');
    cvc.reportValidity();
    return false;
  }
  if (!amount.value) {
    amount.setCustomValidity('Будь ласка, введіть суму');
    amount.reportValidity();
    return false;
  }
  

  card.setCustomValidity('');
  cvc.setCustomValidity('');
  amount.setCustomValidity('');

  alert('Платіж оброблено!\n\nКарта: ' + card.value + '\nCVC: ' + cvc.value + '\nСума: $' + amount.value);
  
  event.target.reset();
  
  return false;
}
