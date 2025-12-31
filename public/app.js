// グローバル変数
let todos = [];
let currentFilter = 'all';

// DOM要素の取得
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const clearCompleted = document.getElementById('clearCompleted');
const filterButtons = document.querySelectorAll('.filter-btn');

// 初期化
async function init() {
    await fetchTodos();
    setupEventListeners();
}

// イベントリスナーの設定
function setupEventListeners() {
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    clearCompleted.addEventListener('click', clearCompletedTodos);
}

// APIからTodoを取得
async function fetchTodos() {
    try {
        const response = await fetch('/api/todos');
        if (!response.ok) throw new Error('Failed to fetch todos');
        todos = await response.json();
        renderTodos();
    } catch (error) {
        console.error('Error fetching todos:', error);
        alert('Todoの読み込みに失敗しました');
    }
}

// 新しいTodoを追加
async function addTodo() {
    const text = todoInput.value.trim();
    if (!text) {
        alert('タスクを入力してください');
        return;
    }

    try {
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Failed to add todo');

        const newTodo = await response.json();
        todos.push(newTodo);
        todoInput.value = '';
        renderTodos();
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Todoの追加に失敗しました');
    }
}

// Todoの完了状態を切り替え
async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: !todo.completed }),
        });

        if (!response.ok) throw new Error('Failed to update todo');

        const updatedTodo = await response.json();
        const index = todos.findIndex(t => t.id === id);
        todos[index] = updatedTodo;
        renderTodos();
    } catch (error) {
        console.error('Error toggling todo:', error);
        alert('Todoの更新に失敗しました');
    }
}

// Todoを削除
async function deleteTodo(id) {
    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete todo');

        todos = todos.filter(t => t.id !== id);
        renderTodos();
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Todoの削除に失敗しました');
    }
}

// 完了済みのTodoをすべて削除
async function clearCompletedTodos() {
    const completedTodos = todos.filter(t => t.completed);
    if (completedTodos.length === 0) {
        alert('完了済みのタスクはありません');
        return;
    }

    if (!confirm(`${completedTodos.length}件の完了済みタスクを削除しますか？`)) {
        return;
    }

    try {
        await Promise.all(
            completedTodos.map(todo =>
                fetch(`/api/todos/${todo.id}`, { method: 'DELETE' })
            )
        );

        todos = todos.filter(t => !t.completed);
        renderTodos();
    } catch (error) {
        console.error('Error clearing completed todos:', error);
        alert('完了済みタスクの削除に失敗しました');
    }
}

// Todoをフィルタリング
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        default:
            return todos;
    }
}

// Todoを描画
function renderTodos() {
    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<div class="empty-state">タスクがありません</div>';
    } else {
        todoList.innerHTML = filteredTodos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}">
                <input
                    type="checkbox"
                    class="todo-checkbox"
                    ${todo.completed ? 'checked' : ''}
                    onchange="toggleTodo('${todo.id}')"
                >
                <span class="todo-text">${escapeHtml(todo.text)}</span>
                <button class="delete-btn" onclick="deleteTodo('${todo.id}')">削除</button>
            </li>
        `).join('');
    }

    // 統計を更新
    const activeCount = todos.filter(t => !t.completed).length;
    todoCount.textContent = `${activeCount} 件のタスク`;
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// アプリケーションを初期化
init();
