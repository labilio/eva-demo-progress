
      // Set arco-theme on body synchronously
      try {
        var t = localStorage.getItem('__aionui_theme');
        if (t) document.body.setAttribute('arco-theme', t);
      } catch (e) {}
    