// Standalone preview interactions. No storage, app imports, workers, or network APIs.
const toggle=document.querySelector('.theme-toggle');
toggle.addEventListener('click',()=>{
 const dark=document.documentElement.dataset.theme!=='dark';
 document.documentElement.dataset.theme=dark?'dark':'light';
 toggle.setAttribute('aria-pressed',String(dark));
 toggle.setAttribute('aria-label',`Switch preview to ${dark?'Light':'Dark'} mode`);
 toggle.querySelector('span').textContent=dark?'Light':'Dark';
});
const dialog=document.getElementById('preview-dialog');
let opener;
function showPreview(label,source){opener=source;document.getElementById('preview-title').textContent=label;dialog.showModal();}
for(const button of document.querySelectorAll('[data-preview]'))button.addEventListener('click',()=>showPreview(button.dataset.preview,button));
document.querySelector('.music-search')?.addEventListener('submit',event=>{event.preventDefault();showPreview('Search music',event.submitter||document.getElementById('search'));});
document.getElementById('close-preview')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('close',()=>opener?.focus());
