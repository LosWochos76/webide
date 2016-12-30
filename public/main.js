var editor = ace.edit("editor");
editor.setTheme("ace/theme/twilight");
editor.session.setMode("ace/mode/c_cpp");

var term,
    protocol,
    socketURL,
    socket,
    pid;

var terminalContainer = document.getElementById('terminal-container');

createTerminal();

function createTerminal() {
  term = new Terminal({
    cursorBlink: true
  });

  protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
  socketURL = protocol + location.hostname + ((location.port) ? (':' + location.port) : '') + '/terminals/';
  term.open(terminalContainer);
  term.fit();

  $.post('/terminals', function (pid) {
      window.pid = pid;
      socketURL += pid;
      socket = new WebSocket(socketURL);
      socket.onopen = function() { 
        term.attach(socket);
        term._initialized = true; 
      };
  
      download(pid);
  });
}

function upload() {
  $.post("/upload/" + pid, {file: "main.cpp", code: editor.getValue()}, function(result) {
        alert(html(result));
  });
}

function compile() {
  $.post("/compile/" + pid, {pid: pid}, function(result) {
        alert(html(result));
  });
}

function run() {
  $.post("/run/" + pid, {}, function(result) {
        alert(html(result));
  });
}

function download(pid) {
  $.get('/download/' + pid, function(result) {
    editor.setValue(result);
  });
}