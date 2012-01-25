(function () {
	
window.ws = new WebSocket('ws://' + window.location.hostname + ':' + window.location.port + '/serve/' + key);

window.addEventListener('devicemotion', function (event) {
	ws.send(JSON.stringify({ type: event.type, data: { accelerationIncludingGravity: { x: event.accelerationIncludingGravity.x, y: event.accelerationIncludingGravity.y, z: event.accelerationIncludingGravity.z }}}));
}, false);

window.addEventListener('deviceorientation', function (event) {
	ws.send(JSON.stringify({ type: event.type, data: { alpha: event.alpha, beta: event.beta, gamma: event.gamma }}));
}, false);



})();