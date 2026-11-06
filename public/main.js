

const noteList = document.getElementById('note-list');
const noteTitle = document.getElementById('note-title');

const markdownInput = document.getElementById('markdown-input');
const htmlPreview = document.getElementById('html-preview');

const btnNew = document.getElementById('btn-new');
const btnSave = document.getElementById('btn-save');
const btnDelete = document.getElementById('btn-delete');

let currentNote = null;

// Realtime preview update when typing
markdownInput.addEventListener('input', () => {
  htmlPreview.innerHTML = marked.parse(markdownInput.value);
});

// Load list from express server
async function loadNotes() {
  const res = await fetch('/api/notes');
  const data = await res.json();
  noteList.innerHTML = '';

  data.notes.forEach(filename => {
    const li = document.createElement('li');
    li.textContent = filename;
    if (currentNote === filename) li.classList.add('active');
    li.onclick = () => openNote(filename);
    noteList.appendChild(li);
  });
}

//Open a specific note
async function openNote(filename) {
  const res = await fetch(`/api/notes/${filename}`);
  const data = await res.json();
  if (data.success) {
    currentNote = data.filename;
    noteTitle.value = data.filename.replace('.md', '');
    noteTitle.disabled = true; // Do not change title when editing the existed file.
    markdownInput.value = data.raw;
    htmlPreview.innerHTML = data.html;
    loadNotes();
  }
}

// Create new note
btnNew.addEventListener('click', () => {
  currentNote = null;
  noteTitle.disabled = false;
  noteTitle.value = '';
  markdownInput.value = '';
  htmlPreview.innerHTML = '';
  noteTitle.focus();
});

// 4. Save or update note
btnSave.addEventListener('click', async () => {
  const title = noteTitle.value.trim();
  const content = markdownInput.value;

  if (!title) {
    alert('Please type the title!');
    return;
  }

  if (currentNote) {
    // Update note
    const res = await fetch(`/api/notes/${currentNote}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const result = await res.json();
    alert(result.message);
  } else {
    // Make new note
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    const result = await res.json();
    if (result.success) {
      currentNote = title.endsWith('.md') ? title : `${title}.md`;
      noteTitle.disabled = true;
    }
    alert(result.message);
  }
  loadNotes();
});

// Delete note
btnDelete.addEventListener('click', async () => {
  if (!currentNote) {
    alert('Please choose specific note to delete!');
    return;
  }

  if (confirm(`This action can't be redo! Do you willing to delete it?"${currentNote}"?`)) {
    const res = await fetch(`/api/notes/${currentNote}`, { method: 'DELETE' });
    const result = await res.json();
    alert(result.message);
    btnNew.click();
    loadNotes();
  }
});

// Start loading notes!
loadNotes();
