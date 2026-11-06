import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const app = express();
const PORT = 3000;

//setup folder, file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTES_DIR = path.join(__dirname, 'notes');

// server read json data
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// retrict making PathTraversal error
function getSafeFilePath(filename) {
  const safeName = path.basename(filename).replace(/[^a-zA-Z0-9_\-\.]/g, '');
  const finalName = safeName.endsWith('.md') ? safeName : `${safeName}.md`;
  return path.join(NOTES_DIR, finalName);
}

//list all note
app.get('/api/notes', async (req, res) => {
  try {
    const files = await fs.readdir(NOTES_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    res.json({ success: true, notes: mdFiles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Can't read the note folder" });
  }
});
// read 1 note 
app.get('/api/notes/:filename', async (req, res) => {
  try {
    const filePath = getSafeFilePath(req.params.filename);
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const htmlContent = marked.parse(rawContent);

    res.json({
      success: true,
      filename: path.basename(filePath),
      raw: rawContent,
      html: htmlContent
    });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Note not found!' });
  }
});

//create new note
app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body;
  if (!title || typeof content !== 'string') {
    return res.status(400).json({ success: false, message: 'Title and content invalid!' });
  }

  try {
    const filePath = getSafeFilePath(title);
    // Check file exist or not
    try {
      await fs.access(filePath);
      return res.status(409).json({ success: false, message: 'This note existed!' });
    } catch {
      // Not exist -> create new note
    }

    await fs.writeFile(filePath, content, 'utf-8');
    res.status(201).json({ success: true, message: 'Saving note sucessfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error to write file on drive ' });
  }
});

//update note
app.put('/api/notes/:filename', async (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string') {
    return res.status(400).json({ success: false, message: 'Nội dung không hợp lệ.' });
  }

  try {
    const filePath = getSafeFilePath(req.params.filename);
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true, message: 'Note updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: "Note can't be updated!" });
  }
});

//Delete note
app.delete('/api/notes/:filename', async (req, res) => {
  try {
    const filePath = getSafeFilePath(req.params.filename);
    await fs.unlink(filePath);
    res.json({ success: true, message: 'Note deleted!' });
  } catch (error) {
    res.status(404).json({ success: false, message: "Can't found the specific note to delete!" });
  }
});

app.listen(PORT, () => {
  console.log(`Server working on: http://localhost:${PORT}`);
});
