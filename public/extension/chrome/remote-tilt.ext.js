// Safari loads adblock on about:blank pages, which is a waste of RAM and cycles.
// If document.documentElement instanceof HTMLElement is false, we're not on an HTML page
// if document.documentElement doesn't exist, we're in Chrome 18
(function () {

if (document.location != 'about:blank' && (!document.documentElement || document.documentElement instanceof HTMLElement)) {
  if (sessionStorage.__remotetilt || (window.opener && window.opener.sessionStorage.__remotetilt)) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        var s = document.createElement('script');
        if (document.location.hash.indexOf('tiltremote') !== -1) {
          s.innerHTML = 'window.remoteTilt = true;\n';
        }
        s.innerHTML += this.responseText;
        document.documentElement.appendChild(s);
      }
    }; // Implemented elsewhere.
    xhr.open("GET", chrome.extension.getURL('device-motion-polyfill.js'), false);
    xhr.send();  
  } 
}
  
})();
