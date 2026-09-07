/* APK-only transport. Game state, economy and save schema are untouched. */
(() => {
  if (!window.AndroidFiles) return;
  const download = async link => {
    try { AndroidFiles.exportSave(await (await fetch(link.href)).text()); }
    catch { const toast=document.getElementById('toast');if(toast){toast.textContent={ru:'Не удалось сохранить файл',uk:'Не вдалося зберегти файл',en:'Could not save file'}[document.documentElement.lang]||'Could not save file';toast.classList.add('visible');} }
  };
  // The existing game clicks a detached blob anchor, so intercept that exact transport.
  const originalClick=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){download(this);return;}return originalClick.call(this);};
  document.addEventListener('click', event => {
    const link=event.target.closest?.('a[download]');
    if(link&&link.href.startsWith('blob:')){event.preventDefault();download(link);}
  },true);
  // Existing game settings still decide whether to call vibration.
  navigator.vibrate=pattern=>{AndroidFiles.vibrate(JSON.stringify(pattern));return true;};
})();
