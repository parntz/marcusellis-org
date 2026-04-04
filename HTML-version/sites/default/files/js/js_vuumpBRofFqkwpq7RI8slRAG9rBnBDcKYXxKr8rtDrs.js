/**
 * Javascript helpers for Facebook Streams.  Loaded by fb_stream.module.
 */
FB_Stream = function(){};

/**
 * Display a stream dialog on Facebook Connect pages, via
 * http://developers.facebook.com/docs/reference/javascript/FB.ui
 *
 * @param json is the json-encoded output of fb_stream_get_stream_dialog_data().
 */
FB_Stream.stream_publish = function(json) {
  var data_array = Drupal.parseJson(json);
  var len = data_array.length;
  for (var i=0; i < len; i++) {
    var data = data_array[i];
    data.method = 'stream.publish';
    FB.ui(data);
  }
};;
/**
 * @file
 * Colorbox module init js.
 */

(function ($) {

Drupal.behaviors.initColorbox = {
  attach: function (context, settings) {
    if (!$.isFunction($('a, area, input', context).colorbox) || typeof settings.colorbox === 'undefined') {
      return;
    }

    if (settings.colorbox.mobiledetect && window.matchMedia) {
      // Disable Colorbox for small screens.
      var mq = window.matchMedia("(max-device-width: " + settings.colorbox.mobiledevicewidth + ")");
      if (mq.matches) {
        return;
      }
    }

    // Use "data-colorbox-gallery" if set otherwise use "rel".
    settings.colorbox.rel = function () {
      if ($(this).data('colorbox-gallery')) {
        return $(this).data('colorbox-gallery');
      }
      else {
        return $(this).attr('rel');
      }
    };

    $('.colorbox', context)
      .once('init-colorbox').each(function(){
        // Only images are supported for the "colorbox" class.
        // The "photo" setting forces the href attribute to be treated as an image.
        var extendParams = {
          photo: true
        };
        // If a title attribute is supplied, sanitize it.
        var title = $(this).attr('title');
        if (title) {
          extendParams.title = Drupal.colorbox.sanitizeMarkup(title);
        }
        $(this).colorbox($.extend({}, settings.colorbox, extendParams));
      });

    $(context).bind('cbox_complete', function () {
      Drupal.attachBehaviors($('#cboxLoadedContent'));
    });
  }
};

// Create colorbox namespace if it doesn't exist.
if (!Drupal.hasOwnProperty('colorbox')) {
  Drupal.colorbox = {};
}

/**
 * Global function to allow sanitizing captions and control strings.
 *
 * @param markup
 *   String containing potential markup.
 * @return @string
 *  Sanitized string with potentially dangerous markup removed.
 */
Drupal.colorbox.sanitizeMarkup = function(markup) {
  // If DOMPurify installed, allow some HTML. Otherwise, treat as plain text.
  if (typeof DOMPurify !== 'undefined') {
    var purifyConfig = {
      ALLOWED_TAGS: [
        'a',
        'b',
        'strong',
        'i',
        'em',
        'u',
        'cite',
        'code',
        'br'
      ],
      ALLOWED_ATTR: [
        'href',
        'hreflang',
        'title',
        'target'
      ]
    }
    if (Drupal.settings.hasOwnProperty('dompurify_custom_config')) {
      purifyConfig = Drupal.settings.dompurify_custom_config;
    }
    return DOMPurify.sanitize(markup, purifyConfig);
  }
  else {
    return Drupal.checkPlain(markup);
  }
}

})(jQuery);
;
/**
 * @file
 * Colorbox module style js.
 */

(function ($) {

Drupal.behaviors.initColorboxDefaultStyle = {
  attach: function (context, settings) {
    $(context).bind('cbox_complete', function () {
      // Only run if there is a title.
      if ($('#cboxTitle:empty', context).length == false) {
        $('#cboxLoadedContent img', context).bind('mouseover', function () {
          $('#cboxTitle', context).slideDown();
        });
        $('#cboxOverlay', context).bind('mouseover', function () {
          $('#cboxTitle', context).slideUp();
        });
      }
      else {
        $('#cboxTitle', context).hide();
      }
    });
  }
};

})(jQuery);
;
/**
 * @file
 * Colorbox module load js.
 */
(function ($) {

Drupal.behaviors.initColorboxLoad = {
  attach: function (context, settings) {
    if (!$.isFunction($.colorbox) || typeof settings.colorbox === 'undefined') {
      return;
    }

    if (settings.colorbox.mobiledetect && window.matchMedia) {
      // Disable Colorbox for small screens.
      var mq = window.matchMedia("(max-device-width: " + settings.colorbox.mobiledevicewidth + ")");
      if (mq.matches) {
        return;
      }
    }

    $.urlParams = function (url) {
      var p = {},
          e,
          a = /\+/g,  // Regex for replacing addition symbol with a space.
          r = /([^&=]+)=?([^&]*)/g,
          d = function (s) { return decodeURIComponent(s.replace(a, ' ')); },
          q = url.split('?');
      while (e = r.exec(q[1])) {
        e[1] = d(e[1]);
        e[2] = d(e[2]);
        switch (e[2].toLowerCase()) {
          case 'true':
          case 'yes':
            e[2] = true;
            break;
          case 'false':
          case 'no':
            e[2] = false;
            break;
        }
        if (e[1] == 'width') { e[1] = 'innerWidth'; }
        if (e[1] == 'height') { e[1] = 'innerHeight'; }
        if (e[2]) {
          e[2] = Drupal.checkPlain(e[2]);
        }
        p[e[1]] = e[2];
      }
      return p;
    };

    $('.colorbox-load', context)
      .once('init-colorbox-load', function () {
        var href = $(this).attr('href');

        var params = $.urlParams(href);

        // Always load in an iframe.
        params.iframe = true;

        // Set inner width and height if not already specified.
        if (!params.hasOwnProperty('innerWidth')) {
          params.innerWidth = $(window).width() * .8;
        }
        if (!params.hasOwnProperty('innerHeight')) {
          params.innerHeight = $(window).height() * .8;
        }

        if (!params.hasOwnProperty('title')) {
          // If a title attribute is supplied, sanitize it.
          var title = $(this).attr('title');
          if (title) {
            params.title = Drupal.colorbox.sanitizeMarkup(title);
          }
        }
        $(this).colorbox($.extend({}, settings.colorbox, params));
      });
  }
};

})(jQuery);
;
/**
 * @file
 * Colorbox module inline js.
 */

(function ($) {

Drupal.behaviors.initColorboxInline = {
  attach: function (context, settings) {
    if (!$.isFunction($.colorbox) || typeof settings.colorbox === 'undefined') {
      return;
    }

    if (settings.colorbox.mobiledetect && window.matchMedia) {
      // Disable Colorbox for small screens.
      var mq = window.matchMedia("(max-device-width: " + settings.colorbox.mobiledevicewidth + ")");
      if (mq.matches) {
        return;
      }
    }

    $.urlParam = function(name, url){
      if (name == 'fragment') {
        var results = new RegExp('(#[^&#]*)').exec(url);
      }
      else {
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
      }
      if (!results) { return ''; }
      return results[1] || '';
    };
    $('.colorbox-inline', context).once('init-colorbox-inline').colorbox({
      transition:settings.colorbox.transition,
      speed:settings.colorbox.speed,
      opacity:settings.colorbox.opacity,
      slideshow:settings.colorbox.slideshow,
      slideshowAuto:settings.colorbox.slideshowAuto,
      slideshowSpeed:settings.colorbox.slideshowSpeed,
      slideshowStart:settings.colorbox.slideshowStart,
      slideshowStop:settings.colorbox.slideshowStop,
      current:settings.colorbox.current,
      previous:settings.colorbox.previous,
      next:settings.colorbox.next,
      close:settings.colorbox.close,
      overlayClose:settings.colorbox.overlayClose,
      maxWidth:settings.colorbox.maxWidth,
      maxHeight:settings.colorbox.maxHeight,
      innerWidth:function(){
        return $.urlParam('width', $(this).attr('href'));
      },
      innerHeight:function(){
        return $.urlParam('height', $(this).attr('href'));
      },
      title:function(){
        return Drupal.colorbox.sanitizeMarkup(
          decodeURIComponent($.urlParam('title', $(this).attr('href'))));
      },
      iframe:function(){
        return $.urlParam('iframe', $(this).attr('href'));
      },
      inline:function(){
        return $.urlParam('inline', $(this).attr('href'));
      },
      href:function(){
        return $.urlParam('fragment', $(this).attr('href'));
      }
    });
  }
};

})(jQuery);
;

(function ($) {

  Drupal.behaviors.initFaqModule = {
    attach: function (context) {
      // Hide/show answer for a question.
      var faq_hide_qa_accordion = Drupal.settings.faq.faq_hide_qa_accordion;
      $('div.faq-dd-hide-answer', context).addClass("collapsible collapsed");

      if (!faq_hide_qa_accordion) {
        $('div.faq-dd-hide-answer:not(.faq-processed)', context).addClass('faq-processed').hide();
      }
      $('div.faq-dt-hide-answer:not(.faq-processed)', context).addClass('faq-processed').click(function() {
        if (faq_hide_qa_accordion) {
          $('div.faq-dt-hide-answer').not($(this)).removeClass('faq-qa-visible');
        }
        $(this).toggleClass('faq-qa-visible');
        $(this).parent().addClass('faq-viewed');
        $('div.faq-dd-hide-answer').not($(this).next('div.faq-dd-hide-answer')).addClass("collapsed");
        if (!faq_hide_qa_accordion) {
          $(this).next('div.faq-dd-hide-answer').slideToggle('fast', function() {
            $(this).parent().toggleClass('expanded');
          });
        }
        $(this).next('div.faq-dd-hide-answer').toggleClass("collapsed");

        // Change the fragment, too, for permalink/bookmark.
        // To keep the current page from scrolling, refs
        // http://stackoverflow.com/questions/1489624/modifying-document-location-hash-without-page-scrolling/1489802#1489802
        var hash = $(this).find('a').attr('id');
        var fx, node = $('#' + hash);
        if (node.length) {
          fx = $('<div></div>')
            .css({position: 'absolute', visibility: 'hidden', top: $(window).scrollTop() + 'px'})
            .attr('id', hash)
            .appendTo(document.body);
          node.attr('id', '');
        }
        document.location.hash = hash;
        if (node.length) {
          fx.remove();
          node.attr('id', hash);
        }

        // Scroll the page if the collapsed FAQ is not visible.
        // If we have the toolbar so the title may be hidden by the bar.
        var mainScrollTop = Math.max($('html', context).scrollTop(), $('body', context).scrollTop());
        // We compute mainScrollTop because the behaviour is different on FF, IE and CR
        if (mainScrollTop > $(this).offset().top) {
          $('html, body', context).animate({
            scrollTop: $(this).offset().top
          }, 1);
        }
        
        return false;
      });

      // Show any question identified by a fragment
      if (/^#\w+$/.test(document.location.hash)) {
        $('div.faq-dt-hide-answer ' + document.location.hash).parents('.faq-dt-hide-answer').triggerHandler('click');
      }

      // Hide/show q/a for a category.
      var faq_category_hide_qa_accordion = Drupal.settings.faq.faq_category_hide_qa_accordion;
      $('div.faq-qa-hide', context).addClass("collapsible collapsed");
      if (!faq_category_hide_qa_accordion) {
        $('div.faq-qa-hide', context).hide();
      }
      $('div.faq-qa-header .faq-header:not(.faq-processed)', context).addClass('faq-processed').click(function() {
        var $this = $(this);
        if (faq_category_hide_qa_accordion) {
          $('.faq-category-qa-visible').not($('.faq-category-qa-visible').closest('.faq-category-group').has($this).children('div.faq-qa-hide')).removeClass('faq-category-qa-visible');
        }
        $(this).toggleClass('faq-category-qa-visible');
        $('div.faq-qa-hide').not($this.parent().siblings('div.faq-qa-hide')).not($('div.faq-qa-hide').closest('.faq-category-group').has($this).children('div.faq-qa-hide')).addClass("collapsed");
        if (!faq_category_hide_qa_accordion) {
          $this.parent().siblings('div.faq-qa-hide').slideToggle('fast', function() {
            $(this).parent().toggleClass('expanded');
          });
        }
        $this.parent().siblings('div.faq-qa-hide').toggleClass("collapsed");

        // Scroll the page if the collapsed FAQ is not visible.
        // If we have the toolbar so the title may be hidden by the bar.
        var mainScrollTop = Math.max($('html', context).scrollTop(), $('body', context).scrollTop());
        // We compute mainScrollTop because the behaviour is different on FF, IE and CR
        if (mainScrollTop > $this.offset().top) {
          $('html, body', context).animate({
            scrollTop: $this.offset().top
          }, 1);
        }
        
        return false;
      });


      // Show expand all link.
      if (!faq_hide_qa_accordion && !faq_category_hide_qa_accordion) {
        $('#faq-expand-all', context).show();
        $('#faq-expand-all a.faq-expand-all-link', context).show();

        // Add collapse link click event.
        $('#faq-expand-all a.faq-collapse-all-link:not(.faq-processed)', context).addClass('faq-processed').click(function () {
          $(this).hide();
          $('#faq-expand-all a.faq-expand-all-link').show();
          $('div.faq-qa-hide').slideUp('slow', function() {
            $(this).removeClass('expanded');
          });
          $('div.faq-dd-hide-answer').slideUp('slow', function() {
            $(this).removeClass('expanded');
          });
        });

        // Add expand link click event.
        $('#faq-expand-all a.faq-expand-all-link:not(.faq-processed)', context).addClass('faq-processed').click(function () {
          $(this).hide();
          $('#faq-expand-all a.faq-collapse-all-link').show();
          $('div.faq-qa-hide').slideDown('slow', function() {
            $(this).addClass('expanded');
          });
          $('div.faq-dd-hide-answer').slideDown('slow', function() {
            $(this).addClass('expanded');
          });
        });
      }
    }
  };
})(jQuery);
;
(function ($) {

Drupal.googleanalytics = {};

$(document).ready(function() {

  // Attach mousedown, keyup, touchstart events to document only and catch
  // clicks on all elements.
  $(document.body).bind("mousedown keyup touchstart", function(event) {

    // Catch the closest surrounding link of a clicked element.
    $(event.target).closest("a,area").each(function() {

      // Is the clicked URL internal?
      if (Drupal.googleanalytics.isInternal(this.href)) {
        // Skip 'click' tracking, if custom tracking events are bound.
        if ($(this).is('.colorbox') && (Drupal.settings.googleanalytics.trackColorbox)) {
          // Do nothing here. The custom event will handle all tracking.
          //console.info("Click on .colorbox item has been detected.");
        }
        // Is download tracking activated and the file extension configured for download tracking?
        else if (Drupal.settings.googleanalytics.trackDownload && Drupal.googleanalytics.isDownload(this.href)) {
          // Download link clicked.
          gtag('event', Drupal.googleanalytics.getDownloadExtension(this.href).toUpperCase(), {
            event_category: 'Downloads',
            event_label: Drupal.googleanalytics.getPageUrl(this.href),
            transport_type: 'beacon'
          });
        }
        else if (Drupal.googleanalytics.isInternalSpecial(this.href)) {
          // Keep the internal URL for Google Analytics website overlay intact.
          // @todo: May require tracking ID
          var target = this;
          $.each(Drupal.settings.googleanalytics.account, function () {
            gtag('config', this, {
              page_path: Drupal.googleanalytics.getPageUrl(target.href),
              transport_type: 'beacon'
            });
          });
        }
      }
      else {
        if (Drupal.settings.googleanalytics.trackMailto && $(this).is("a[href^='mailto:'],area[href^='mailto:']")) {
          // Mailto link clicked.
          gtag('event', 'Click', {
            event_category: 'Mails',
            event_label: this.href.substring(7),
            transport_type: 'beacon'
          });
        }
        else if (Drupal.settings.googleanalytics.trackOutbound && this.href.match(/^\w+:\/\//i)) {
          if (Drupal.settings.googleanalytics.trackDomainMode !== 2 || (Drupal.settings.googleanalytics.trackDomainMode === 2 && !Drupal.googleanalytics.isCrossDomain(this.hostname, Drupal.settings.googleanalytics.trackCrossDomains))) {
            // External link clicked / No top-level cross domain clicked.
            gtag('event', 'Click', {
              event_category: 'Outbound links',
              event_label: this.href,
              transport_type: 'beacon'
            });
          }
        }
      }
    });
  });

  // Track hash changes as unique pageviews, if this option has been enabled.
  if (Drupal.settings.googleanalytics.trackUrlFragments) {
    window.onhashchange = function() {
      $.each(Drupal.settings.googleanalytics.account, function () {
        gtag('config', this, {
          page_path: location.pathname + location.search + location.hash
        });
      });
    };
  }

  // Colorbox: This event triggers when the transition has completed and the
  // newly loaded content has been revealed.
  if (Drupal.settings.googleanalytics.trackColorbox) {
    $(document).bind("cbox_complete", function () {
      var href = $.colorbox.element().attr("href");
      if (href) {
        $.each(Drupal.settings.googleanalytics.account, function () {
          gtag('config', this, {
            page_path: Drupal.googleanalytics.getPageUrl(href)
          });
        });
      }
    });
  }

});

/**
 * Check whether the hostname is part of the cross domains or not.
 *
 * @param string hostname
 *   The hostname of the clicked URL.
 * @param array crossDomains
 *   All cross domain hostnames as JS array.
 *
 * @return boolean
 */
Drupal.googleanalytics.isCrossDomain = function (hostname, crossDomains) {
  /**
   * jQuery < 1.6.3 bug: $.inArray crushes IE6 and Chrome if second argument is
   * `null` or `undefined`, https://bugs.jquery.com/ticket/10076,
   * https://github.com/jquery/jquery/commit/a839af034db2bd934e4d4fa6758a3fed8de74174
   *
   * @todo: Remove/Refactor in D8
   */
  if (!crossDomains) {
    return false;
  }
  else {
    return $.inArray(hostname, crossDomains) > -1 ? true : false;
  }
};

/**
 * Check whether this is a download URL or not.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isDownload = function (url) {
  var isDownload = new RegExp("\\.(" + Drupal.settings.googleanalytics.trackDownloadExtensions + ")([\?#].*)?$", "i");
  return isDownload.test(url);
};

/**
 * Check whether this is an absolute internal URL or not.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isInternal = function (url) {
  var isInternal = new RegExp("^(https?):\/\/" + window.location.host, "i");
  return isInternal.test(url);
};

/**
 * Check whether this is a special URL or not.
 *
 * URL types:
 *  - gotwo.module /go/* links.
 *
 * @param string url
 *   The web url to check.
 *
 * @return boolean
 */
Drupal.googleanalytics.isInternalSpecial = function (url) {
  var isInternalSpecial = new RegExp("(\/go\/.*)$", "i");
  return isInternalSpecial.test(url);
};

/**
 * Extract the relative internal URL from an absolute internal URL.
 *
 * Examples:
 * - https://mydomain.com/node/1 -> /node/1
 * - https://example.com/foo/bar -> https://example.com/foo/bar
 *
 * @param string url
 *   The web url to check.
 *
 * @return string
 *   Internal website URL
 */
Drupal.googleanalytics.getPageUrl = function (url) {
  var extractInternalUrl = new RegExp("^(https?):\/\/" + window.location.host, "i");
  return url.replace(extractInternalUrl, '');
};

/**
 * Extract the download file extension from the URL.
 *
 * @param string url
 *   The web url to check.
 *
 * @return string
 *   The file extension of the passed url. e.g. "zip", "txt"
 */
Drupal.googleanalytics.getDownloadExtension = function (url) {
  var extractDownloadextension = new RegExp("\\.(" + Drupal.settings.googleanalytics.trackDownloadExtensions + ")([\?#].*)?$", "i");
  var extension = extractDownloadextension.exec(url);
  return (extension === null) ? '' : extension[1];
};

})(jQuery);
;
