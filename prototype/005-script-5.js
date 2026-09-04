
      // Synchronously restore theme appearance from localStorage to prevent theme flash
      (function () {
        try {
          var theme = localStorage.getItem('__aionui_theme');
          if (theme) document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {}
      })();
    