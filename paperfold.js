/*! Paperfold JS
 * http://felixniklas.com/paperfoldjs
 *
 * Copyright (c) 2012-2015 @mrflix
 * Available under the MIT license
 */

;(function($){

$.fn.paperfold = function(options){
  // support multiple elements
  if (this.length > 1){
    this.each(function() { $(this).paperfold(options) });
    return this;
  }

  // Default settings
  var settings = $.extend({
    duration: 240,
    maxFoldHeight: 200,
    folds: null,
    perspective: '1000px',
    topShadow: 'linear-gradient(transparent, rgba(0,0,0,.5))',
    bottomShadow: 'linear-gradient(rgba(0,0,0,.5), transparent)',
    isOpen: false,
    onProgress: $.noop,
    stayInPlace: false
  }, options);

  var css = {
    holder: {
      height: '',
      position: 'relative',
      overflow: 'hidden'
    },
    fold: {
      height: 0,
      position: 'relative',
      transformStyle: 'preserve-3d',
      perspective: settings.perspective,
      willChange: 'height'
    },
    side: {
      overflow: 'hidden',
      width: '100%',
      willChange: 'transform'
    },
    top: {
      transformOrigin: 'top',
      transform: 'rotateX(-90deg)',
      position: 'relative'
    },
    bottom: {
      transformOrigin: 'bottom',
      transform: 'rotateX(90deg)',
      position: 'absolute',
      bottom: 0
    },
    inner: {
      position: 'absolute',
      width: '100%'
    },
    shadow: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      willChange: 'opacity'
    },
    topShadow: {
      background: settings.topShadow
    },
    bottomShadow: {
      background: settings.bottomShadow
    }
  }

  // extend top and bottom with side class
  css.top = $.extend(css.top, css.side);
  css.bottom = $.extend(css.bottom, css.side);

  // extend shadows with shadow class
  css.topShadow = $.extend(css.topShadow, css.shadow);
  css.bottomShadow = $.extend(css.bottomShadow, css.shadow);

  /* rAF shim. Gist: https://gist.github.com/julianshapiro/9497513 */
  var rAFShim = (function() {
    var timeLast = 0;

    return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
      var timeCurrent = (new Date()).getTime(),
          timeDelta;

      /* Dynamically set delay on a per-tick basis to match 60fps. */
      /* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
      timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
      timeLast = timeCurrent + timeDelta;

      return setTimeout(function() { callback(timeCurrent + timeDelta); }, timeDelta);
    };
  })();

  function getScrollParent(element) {
    var position = element.css( "position" ),
        excludeStaticParent = position === "absolute",
        scrollParent = element.parents().filter( function() {
          var parent = $( element );
          if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
            return false;
          }
          return (/(auto|scroll)/).test( parent.css( "overflow" ) + parent.css( "overflow-y" ) + parent.css( "overflow-x" ) );
        }).eq( 0),
        parentDocument
      ;

    if(!scrollParent.length) {
      if(typeof element[0] !== 'undefined') {
        parentDocument = element[0].ownerDocument || document;
      } else {
        parentDocument = document;
      }
    } else {
      parentDocument = scrollParent;
    }

    return position === "fixed" || parentDocument;
  }

  var $this = $(this);
  var currentPercentage;
  var targetPercentage;
  var ticker = window.requestAnimationFrame || rAFShim;
  var startTime;
  var scrollOffset;
  var scrollParent = getScrollParent($this);
  var height;
  var content;
  var $folds = $();
  var $bottoms = $();
  var $tops = $();
  var $shadows = $();
  var paperfold = this;

  this.initialize = function(){
    // get real height
    height = $this.show().height();
    $this.css(css.holder);

    // calculate amount and height of the folds
    $this.data('foldCount', settings.folds || Math.ceil(height / settings.maxFoldHeight));
    $this.data('foldHeight', Math.floor(height / $this.data('foldCount')));

    // clone content
    content = $this.children().clone();

    // add folds containing the previously cached content
    for(var i=0, j=0; i<$this.data('foldCount'); i++, j+=2){
      var topHeight = bottomHeight = $this.data('foldHeight')/2;
      var fold;
      if( (i+1) === $this.data('foldCount') && $this.data('foldHeight')/2 % 2 ){
        bottomHeight = height-(j+1)*topHeight;
      }
      fold = createFold(j, topHeight, bottomHeight);
      $folds = $folds.add(fold);
      $this.append(fold);
    }

    if(settings.isOpen){
      showContent();
      currentPercentage = 1;
    } else {
      hideContent();
      currentPercentage = 0;
    }

    return this;
  }

  /*
      every fold is holding two identical divs: top and bottom
      the children divs are positioned relative to it
      the slice grows from zero to 1/n of the elements height (n = number of slices)
  */
  function createFold(j, topHeight, bottomHeight){
    var offsetTop = -j*topHeight;
    var offsetBottom = -height+j*topHeight+$this.data('foldHeight');
    var topShadow = $('<div>').css(css.topShadow);
    var bottomShadow = $('<div>').css(css.bottomShadow);
    var top = $('<div>').css(css.top).css('height', topHeight).append(
      $('<div>').css(css.inner).css('top', offsetTop).append(content.clone()).add(topShadow)
    );
    var bottom = $('<div>').css(css.bottom).css('height', bottomHeight).append(
      $('<div>').css(css.inner).css('bottom', offsetBottom).append(content.clone()).add(bottomShadow)
    );
    $tops = $tops.add(top);
    $bottoms = $bottoms.add(bottom);
    $shadows = $shadows.add(topShadow.add(bottomShadow));
    return $('<div>').css(css.fold).append(top.add(bottom));
  }

  function drawAt(percentage){
    // change angle of tops and bottoms
    var c = $this.data('foldHeight') * percentage;
    var a = b = $this.data('foldHeight')/2;
    var part = 2*b*c;
    var bottomAngle = part <= 0 ? 90 : Math.acos( (b*b+c*c-a*a) / part )*180/Math.PI;
    var topAngle = 360-bottomAngle;
    
    $tops.css('transform', 'rotateX(' + topAngle + 'deg)');
    $bottoms.css('transform', 'rotateX(' + bottomAngle + 'deg)');
    
    // change folds height
    var foldHeight = Math.floor(height/$this.data('foldCount') * percentage);
    $folds.height(foldHeight);
    
    // adjust the shadows
    $shadows.css('opacity', 1 - percentage);
  }

  function tick(timestamp){
    var currentTime = (new Date).getTime();
    currentPercentage = Math.min(1, (currentTime - startTime)/settings.duration);

    if(targetPercentage === 0)
      currentPercentage = 1 - currentPercentage;

    drawAt(currentPercentage);

    // callback
    settings.onProgress(currentPercentage);

    // adjust scroll
    if(settings.stayInPlace)
      scrollParent.scrollTop(scrollOffset + currentPercentage * height);

    if(currentPercentage !== targetPercentage){
      ticker(tick);
    } else {
      if(targetPercentage === 1)
        showContent();
    }
  }

  function showContent(){
    $folds.hide();
    $this.children().not($folds).show();
  }

  function hideContent(){
    $folds.show();
    $this.children().not($folds).hide();
  }

  function animateTo(percentage){
    startTime = (new Date).getTime();
    targetPercentage = percentage;

    if(settings.stayInPlace)
      scrollOffset = scrollParent.scrollTop();

    ticker(tick);
  }

  this.percentage = drawAt;

  this.open = function(){
    animateTo(1);
  }

  this.close = function(){
    hideContent();
    animateTo(0);
  }

  this.toggle = function(){
    if(currentPercentage < 0.5){
      paperfold.open();
    } else {
      paperfold.close();
    }
  }

  return this.initialize();

}
})(jQuery);