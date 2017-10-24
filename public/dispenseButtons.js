function makeAjaxCallAndAddButtonClasses($this, url, timeout = 3000) {
  $this.addClass('clicked');
  $.ajax(url)
    .done(() => {
      $this.removeClass('clicked');
      addTemporaryClass($this, 'success', timeout);
    })
    .fail(() => {
      $this.removeClass('clicked');
      addTemporaryClass($this, 'failure', timeout);
    });
}

function hookUpResetClick() {
  $('#dispensers .reset').on('click tap touch', function(e) {
    const $this = $(this);
    makeAjaxCallAndAddButtonClasses($(this), '/reset');
  });
}

function addTemporaryClass($this, className, timeout) {
  $this.addClass(className);
  setTimeout(() => {
    $this.removeClass(className);
  }, timeout);
}

function hookUpDispensersClick() {
  $('#dispensers .dispenser').on('click tap touch', function(e) {
    const $this = $(this);

    let url = '/dispense';
    const dispenserNum = $this.attr('data-dispenser');
    if (!!dispenserNum) {
      url += `/${dispenserNum}`;
    }

    makeAjaxCallAndAddButtonClasses($this, url);
  });
}

function run() {
  hookUpDispensersClick();
  hookUpResetClick();
}

$(window).on('load', () => {
  run();
});
