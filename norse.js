/* A lightweight replacement for map.norsecorp.com. Still needs fancy animations and stuff. */

var canvas = document.getElementById("map");
var canvas_context = canvas.getContext("2d");

var log = [];

function getmapcoords(lat, lon) {
  // equirectangular projection. May need slight adjustment.
  var y = ((-1 * lat) + 90) * (645 / 180);
  var x = (lon + 180) * (1285 / 360);
  return {'x': x, 'y': y};
}

function drawevent(lat, lon, lat2, lon2) {
  var src_coords = getmapcoords(lat, lon);
  var dest_coords = getmapcoords(lat2, lon2);

  // just PoC dots
  canvas_context.beginPath();
  canvas_context.arc(dest_coords['x'], dest_coords['y'], 3, 0, 2 * Math.PI);
  canvas_context.fillStyle = '#FF0000';
  canvas_context.fill();
}

var ws = new WebSocket("ws://map.norsecorp.com/socketcluster/");

ws.onopen = function() {
  var payload = {'event': '#handshake', 'data': {'authToken': null}, 'cid': 1};
  ws.send(JSON.stringify(payload));
}

ws.onmessage = function(m) {
  if (m.data == '#1') { // ping
    ws.send('#2'); // pong
    return;
  }

  var packet = JSON.parse(m.data);

  switch(packet['rid']) {
    case 1:
      var payload = {'event': '#subscribe', 'data': {'channel': 'global'}, 'cid': 2};
      ws.send(JSON.stringify(payload));
    break;
  }

  switch(packet['event']) {
    case '#publish':
      var data = packet['data']['data'];
      for (i in data) {
        var attack = data[i];
        drawevent(attack['latitude'], attack['longitude'], attack['latitude2'], attack['longitude2']);
        if (log.length >= 5) {
          log.shift();
        }
        log.push(attack);
        updatelogtable();
      }
    break;
  }
}

function updatelogtable() {
  var table = document.getElementById("log");
  table.innerHTML = '<th width="90px">Attacker</th><th width="160px">Source</th><th width="160px">Destination</th><th width="150px">Attack type</th><th width="40px">Port</th>';
  for (i in log.reverse()) {
    // no idea if there's any function to escape strings. Why bother.
    table.innerHTML += "<tr><td>" + log[i]['md5'] + "</td><td>" + log[i]['city'] + ", " + log[i]['country'] + "</td><td>" + log[i]['city2'] + ", " + log[i]['country2'] + "</td><td>" + log[i]['type'] + "</td><td>" + log[i]['dport'] + "</td></tr>";
  }
}
