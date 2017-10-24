function addTemporaryClass($this, className, timeout) {
  $this.addClass(className);
  setTimeout(() => {
    $this.removeClass(className);
  }, timeout);
}

function hookUpDispensersClick() {
  $('#dispensers li').on('click tap touch', function(e) {
    const $this = $(this);

    let url = '/dispense';
    const dispenserNum = $this.attr('data-dispenser');
    if (!!dispenserNum) {
      url += `/${dispenserNum}`;
    }

    $this.addClass('clicked');
    $.ajax(url)
      .done(() => {
        $this.removeClass('clicked');
        addTemporaryClass($this, 'success', 5000);
      })
      .fail(() => {
        $this.removeClass('clicked');
        addTemporaryClass($this, 'failure', 5000);
      });
  });
}

function run() {
  hookUpDispensersClick();
}

$(window).on('load', () => {
  run();
});
