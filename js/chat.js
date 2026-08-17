(function(){
  function buildChatContent(body, winEl){
    var log = document.createElement('div');
    log.className = 'chat-log';
    var empty = document.createElement('div');
    empty.className = 'chat-empty';
    empty.textContent = 'Not connected to anything yet -- messages just land here for now.';
    log.appendChild(empty);

    var inputRow = document.createElement('div');
    inputRow.className = 'chat-inputRow';
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type a message and hit Enter\u2026';
    var sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.textContent = 'SEND';

    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    body.appendChild(log);
    body.appendChild(inputRow);

    function send(){
      var text = input.value.trim();
      if (!text) return;
      if (empty.parentElement) empty.remove();
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.textContent = text;
      log.appendChild(bubble);
      log.scrollTop = log.scrollHeight;
      input.value = '';
    }

    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter') send();
    });
    sendBtn.addEventListener('click', send);
  }

  function openChatWindow(){
    ULTRON.windows.createWindow({
      id: 'ai-chat',
      title: 'AI CHAT',
      x: window.innerWidth/2 - 160,
      y: window.innerHeight/2 - 180,
      width: 320,
      height: 360,
      contentBuilder: buildChatContent
    });
  }

  ULTRON.chat = { open: openChatWindow };
})();
