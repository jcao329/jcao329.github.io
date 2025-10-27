(function(){
  // inline train selector: renders buttons and handles single selection
  const lines = ['1','2','3','4','5','6','7','S','A','C','E','N','Q','R','L','B','D','F','M','G','J','Z'];
  const container = document.getElementById('train-lines');
  const display = document.getElementById('selected-line');
  const stopInfo = document.getElementById('stop-info');
  if (!container) return;
  lines.forEach(code => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'train-line-btn';
    btn.textContent = code;
    btn.setAttribute('role','listitem');
    btn.addEventListener('click', ()=>{
      // toggle selected class (single-select)
      container.querySelectorAll('.train-line-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // prefer writing selection into #stop-info when available
      if (stopInfo) stopInfo.textContent = 'Selected line: ' + code;
      else if (display) display.textContent = 'Selected line: ' + code;
      renderStopsFor(code);
    });
    container.appendChild(btn);
  });

  // render placeholder stops for a given line (6 stops)
  function renderStopsFor(line){
    const stopsWrap = document.getElementById('stops-list');
    if (!stopsWrap) return;
    stopsWrap.innerHTML = '';
    for (let i=1;i<=6;i++){
      const s = document.createElement('button');
      s.type = 'button';
      s.className = 'stop-btn';
      s.textContent = 'Stop ' + i;
      s.addEventListener('click', ()=>{
        // single-select stops
        stopsWrap.querySelectorAll('.stop-btn').forEach(b=>b.classList.remove('active'));
        s.classList.add('active');
        if (stopInfo) stopInfo.textContent = 'Selected: ' + line + ' — Stop ' + i;
        else if (display) display.textContent = 'Selected: ' + line + ' — Stop ' + i;
      });
      stopsWrap.appendChild(s);
    }
  }

})();
