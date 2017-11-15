const $form = $('#reset-form');
const $input = $('#reset-number');
const $resetButton = $('#reset-button');
const $clearButton = $('#clear-button');
const $statusMessage = $('#status-message');

function hideStatusAfterDelay(delay = 2.5 * 1000) {
  return setTimeout(() => {
    $statusMessage.hide();
  }, delay);
}

function hookUpSubmit() {
  $form.on('submit', function(e) {
    e.preventDefault();
    const number = $input.val();

    $.post('/reset-number', { number: number }, function(data) {
      console.log(data);
    })
      .then(() => {
        showSuccess();
      })
      .catch(e => {
        showError();
      });
  });
}

function hookUpClearButton() {
  $clearButton.on('click tap touch', function(e) {
    e.preventDefault();

    $input.val('');
  });
}

function showSuccess() {
  $statusMessage.hide();
  $statusMessage.removeClass();
  $statusMessage.addClass('success');
  $statusMessage.html('Number successfully removed');
  $statusMessage.show();
  hideStatusAfterDelay();
}

function showError() {
  $statusMessage.hide();
  $statusMessage.removeClass();
  $statusMessage.addClass('error');
  $statusMessage.html('Invalid number');
  $statusMessage.show();
  hideStatusAfterDelay();
}

function run() {
  hookUpSubmit();
  hookUpClearButton();
}

$(window).on('load', () => {
  run();
});
