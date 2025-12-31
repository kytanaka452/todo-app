const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');

// Vercelのサーバーレス環境ではメモリ内にデータを保存
let memoryTodos = [];
const isVercel = process.env.VERCEL === '1';

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// データファイルの初期化
async function initDataFile() {
  if (isVercel) {
    return;
  }
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

// Todoの読み込み
async function readTodos() {
  if (isVercel) {
    return memoryTodos;
  }
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading todos:', error);
    return [];
  }
}

// Todoの保存
async function writeTodos(todos) {
  if (isVercel) {
    memoryTodos = todos;
    return;
  }
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2));
  } catch (error) {
    console.error('Error writing todos:', error);
    throw error;
  }
}

// 全てのTodoを取得
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// 新しいTodoを追加
app.post('/api/todos', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const todos = await readTodos();
    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    await writeTodos(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Todoの更新
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;

    const todos = await readTodos();
    const todoIndex = todos.findIndex(todo => todo.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (text !== undefined) {
      todos[todoIndex].text = text.trim();
    }
    if (completed !== undefined) {
      todos[todoIndex].completed = completed;
    }

    await writeTodos(todos);
    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Todoの削除
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const todos = await readTodos();
    const filteredTodos = todos.filter(todo => todo.id !== id);

    if (todos.length === filteredTodos.length) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await writeTodos(filteredTodos);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// ローカル環境でのみサーバーを起動
if (!isVercel) {
  async function startServer() {
    await initDataFile();
    app.listen(PORT, () => {
      console.log(`Todo app is running on http://localhost:${PORT}`);
    });
  }
  startServer();
}

// Vercel用にエクスポート
module.exports = app;
