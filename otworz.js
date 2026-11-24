'use strict';
(() => {
  const form = document.getElementById('unlock');
  const field = document.getElementById('key');
  const feedback = document.getElementById('feedback');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const hex = field.value.replace(/[-\s]/g, '').toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(hex)) {
      feedback.textContent = 'Wklej cały klucz z pliku, razem ze wszystkimi grupami znaków.';
      return;
    }
    const button = form.querySelector('button');
    button.disabled = true;
    feedback.textContent = 'Otwieranie przepisów…';
    try {
      const response = await fetch('./zeszyt.bin');
      if (!response.ok) throw new Error('fetch');
      const sealed = new Uint8Array(await response.arrayBuffer());
      const raw = Uint8Array.from(hex.match(/../g), pair => parseInt(pair, 16));
      const key = await crypto.subtle.importKey('raw', raw, {name:'AES-GCM'}, false, ['decrypt']);
      const clear = await crypto.subtle.decrypt({name:'AES-GCM', iv:sealed.slice(0,12)}, key, sealed.slice(12));
      const doc = new DOMParser().parseFromString(new TextDecoder().decode(clear), 'text/html');
      const script = document.createElement('script');
      script.textContent = doc.querySelector('body > script').textContent;
      doc.querySelector('body > script').remove();
      document.getElementById('lock-style').replaceWith(document.importNode(doc.querySelector('style'), true));
      document.title = doc.title;
      field.value = '';
      document.body.replaceChildren(...Array.from(doc.body.childNodes, node => document.importNode(node, true)));
      document.body.append(script);
    } catch (error) {
      feedback.textContent = error.name === 'OperationError' ? 'Klucz nie pasuje do tej wersji przepiśnika. Sprawdź go i spróbuj ponownie.' : 'Nie udało się otworzyć przepisów. Przy pierwszym uruchomieniu otwórz stronę przez HTTPS z włączonym internetem.';
      button.disabled = false;
    }
  });
})();
