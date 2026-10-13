// Temporary palette selection only; no storage or network access.
for (const input of document.querySelectorAll('input[name="palette"]')) {
 input.addEventListener('change', () => { document.body.dataset.palette = input.value; });
}
