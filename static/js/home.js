$(function() {
  $(".typed").typed({
    strings: [
      "stat lshatkin.human<br/>" + 
      "><span class='caret'>$</span> education: University of Michigan - BS in Data Science, MS in Computer Science<br/> ^100" +
      "><span class='caret'>$</span> job: Software Developer at J.P. Morgan Chase <br/>" +
      "><span class='caret'>$</span> hobbies: machine learning, baseball, data viz, music <br/>" +
      "><span class='caret'>$</span> hometown: Evanston, IL <br/>" 
    ],
    showCursor: true,
    cursorChar: '_',
    autoInsertCss: true,
    typeSpeed: 5,
    startDelay: 0,
    loop: false,
    showCursor: false,
    onStart: $('.message form').hide(),
    onStop: $('.message form').show(),
    onTypingResumed: $('.message form').hide(),
    onTypingPaused: $('.message form').show(),
    onComplete: $('.message form').show(),
    onStringTyped: function(pos, self) {$('.message form').show();},
  });
  $('.message form').hide()
});
