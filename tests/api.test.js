const request = require('supertest');
const app = require('../server');

describe('Todo API Tests', () => {
  let createdTodoId;

  describe('GET /api/todos', () => {
    test('全てのTodoを取得できる', async () => {
      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/todos', () => {
    test('新しいTodoを作成できる', async () => {
      const newTodo = { text: 'テスト用のタスク' };
      const response = await request(app)
        .post('/api/todos')
        .send(newTodo);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.text).toBe('テスト用のタスク');
      expect(response.body.completed).toBe(false);
      expect(response.body).toHaveProperty('createdAt');

      createdTodoId = response.body.id;
    });

    test('空のテキストでTodoを作成できない', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('テキストなしでTodoを作成できない', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('空白のみのテキストでTodoを作成できない', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/todos/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '更新テスト用タスク' });
      createdTodoId = response.body.id;
    });

    test('Todoのテキストを更新できる', async () => {
      const response = await request(app)
        .put(`/api/todos/${createdTodoId}`)
        .send({ text: '更新されたタスク' });

      expect(response.status).toBe(200);
      expect(response.body.text).toBe('更新されたタスク');
      expect(response.body.id).toBe(createdTodoId);
    });

    test('Todoの完了状態を更新できる', async () => {
      const response = await request(app)
        .put(`/api/todos/${createdTodoId}`)
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.id).toBe(createdTodoId);
    });

    test('存在しないTodoを更新しようとすると404エラーになる', async () => {
      const response = await request(app)
        .put('/api/todos/nonexistent')
        .send({ text: '存在しないタスク' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '削除テスト用タスク' });
      createdTodoId = response.body.id;
    });

    test('Todoを削除できる', async () => {
      const response = await request(app)
        .delete(`/api/todos/${createdTodoId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      const getResponse = await request(app).get('/api/todos');
      const deletedTodo = getResponse.body.find(todo => todo.id === createdTodoId);
      expect(deletedTodo).toBeUndefined();
    });

    test('存在しないTodoを削除しようとすると404エラーになる', async () => {
      const response = await request(app)
        .delete('/api/todos/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('統合テスト', () => {
    test('Todo作成→取得→更新→削除のフロー全体が正常に動作する', async () => {
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: '統合テスト用タスク' });
      expect(createResponse.status).toBe(201);
      const todoId = createResponse.body.id;

      const getAllResponse = await request(app).get('/api/todos');
      expect(getAllResponse.status).toBe(200);
      const createdTodo = getAllResponse.body.find(todo => todo.id === todoId);
      expect(createdTodo).toBeDefined();
      expect(createdTodo.text).toBe('統合テスト用タスク');

      const updateResponse = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ completed: true });
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.completed).toBe(true);

      const deleteResponse = await request(app)
        .delete(`/api/todos/${todoId}`);
      expect(deleteResponse.status).toBe(200);

      const finalGetResponse = await request(app).get('/api/todos');
      const deletedTodo = finalGetResponse.body.find(todo => todo.id === todoId);
      expect(deletedTodo).toBeUndefined();
    });
  });
});
