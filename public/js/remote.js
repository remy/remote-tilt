(function () {
  
function connect() {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  ws = new WebSocket('ws://' + window.location.hostname + ':' + window.location.port + '/serve/' + key);
  // ws.onclose = setTimeout(function () {
  //  connect();
  // }, 1000);  
}

function throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 250);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;
  
    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

connect();

// let message feed through every 200ms if there's a high number
window.addEventListener('devicemotion', throttle(function (event) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: event.type, data: { accelerationIncludingGravity: { x: event.accelerationIncludingGravity.x, y: event.accelerationIncludingGravity.y, z: event.accelerationIncludingGravity.z }}}));
}, 200), false);

window.addEventListener('deviceorientation', throttle(function (event) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: event.type, data: { alpha: event.alpha, beta: event.beta, gamma: event.gamma }}));
}, 200), false);



})();