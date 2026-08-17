// public/ui/version-helper.js
// nextVersion implements the rule: increment minor until 3.10 -> 4.0
function nextVersion(current){
  const parts = String(current).split('.');
  let maj = parseInt(parts[0]||'0',10)||0;
  let min = parseInt(parts[1]||'0',10)||0;
  min += 1;
  if (min >= 10){ maj += 1; min = 0; }
  return maj + '.' + min;
}

window.nextVersion = nextVersion;
