import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { RelationEntitiesModule } from './relation-entities.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Relation Entities Search', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RelationEntitiesModule({
                    category: {},
                    writer: {},
                    question: { search: { relations: ['writer', 'category', 'comments'] } },
                    comment: {},
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should search entity with relations', async () => {
        // Create 2 writers
        const { body: writer1Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writer#1' })
            .expect(HttpStatus.CREATED);
        const { body: writer2Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writer#2' })
            .expect(HttpStatus.CREATED);

        // Create a category
        const { body: categoryBody } = await request(app.getHttpServer())
            .post('/category')
            .send({ name: 'Category#1' })
            .expect(HttpStatus.CREATED);

        // Create a question
        const { body: questionBody } = await request(app.getHttpServer())
            .post('/question')
            .send({ categoryId: categoryBody.id, writerId: writer1Body.id, title: 'Question Title', content: 'Question Content' })
            .expect(HttpStatus.CREATED);

        // Create 2 comments
        const { body: comment1Body } = await request(app.getHttpServer())
            .post('/comment')
            .send({ questionId: questionBody.id, message: 'Comment Message#1', writerId: writer2Body.id })
            .expect(HttpStatus.CREATED);
        const { body: comment2Body } = await request(app.getHttpServer())
            .post('/comment')
            .send({ questionId: questionBody.id, message: 'Comment Message#2', writerId: writer1Body.id })
            .expect(HttpStatus.CREATED);

        // Assert response of Search
        const { body: searchQuestionResponseBody } = await request(app.getHttpServer())
            .post('/question/search')
            .send({
                where: [{ title: { operator: 'LIKE', operand: 'Question Title' } }],
            })
            .expect(HttpStatus.OK);

        expect(searchQuestionResponseBody.data).toHaveLength(1);

        expect(searchQuestionResponseBody.data[0]).toEqual({
            id: questionBody.id,
            deletedAt: null,
            createdAt: questionBody.createdAt,
            lastModifiedAt: questionBody.lastModifiedAt,
            categoryId: questionBody.categoryId,
            writerId: questionBody.writerId,
            title: questionBody.title,
            content: questionBody.content,
            category: {
                id: categoryBody.id,
                deletedAt: null,
                createdAt: categoryBody.createdAt,
                lastModifiedAt: categoryBody.lastModifiedAt,
                name: categoryBody.name,
            },
            writer: {
                id: writer1Body.id,
                deletedAt: null,
                createdAt: writer1Body.createdAt,
                lastModifiedAt: writer1Body.lastModifiedAt,
                name: writer1Body.name,
            },
            comments: [comment1Body, comment2Body],
        });
    });

    it('should search entity by relation field', async () => {
        // Create 2 writers with unique names
        const { body: writer1Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'relation-test-writer#1' })
            .expect(HttpStatus.CREATED);
        const { body: writer2Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'relation-test-writer#2' })
            .expect(HttpStatus.CREATED);

        // Create 2 categories with unique names
        const { body: category1Body } = await request(app.getHttpServer())
            .post('/category')
            .send({ name: 'relation-test-Category#1' })
            .expect(HttpStatus.CREATED);
        const { body: category2Body } = await request(app.getHttpServer())
            .post('/category')
            .send({ name: 'relation-test-Category#2' })
            .expect(HttpStatus.CREATED);

        // Create questions with unique titles
        const { body: question1Body } = await request(app.getHttpServer())
            .post('/question')
            .send({ categoryId: category1Body.id, writerId: writer1Body.id, title: 'relation-test-Question 1', content: 'Content 1' })
            .expect(HttpStatus.CREATED);
        const { body: question2Body } = await request(app.getHttpServer())
            .post('/question')
            .send({ categoryId: category2Body.id, writerId: writer2Body.id, title: 'relation-test-Question 2', content: 'Content 2' })
            .expect(HttpStatus.CREATED);

        // Search by category name (relation field)
        const { body: searchByCategoryResponse } = await request(app.getHttpServer())
            .post('/question/search')
            .send({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                where: [{ 'category.name': { operator: 'LIKE', operand: 'relation-test-Category#1' } }],
            })
            .expect(HttpStatus.OK);

        expect(searchByCategoryResponse.data.length).toBeGreaterThanOrEqual(1);
        expect(searchByCategoryResponse.data.some((q: { id: number }) => q.id === question1Body.id)).toBe(true);

        // Search by writer name (relation field)
        const { body: searchByWriterResponse } = await request(app.getHttpServer())
            .post('/question/search')
            .send({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                where: [{ 'writer.name': { operator: 'LIKE', operand: 'relation-test-writer#2' } }],
            })
            .expect(HttpStatus.OK);

        expect(searchByWriterResponse.data.length).toBeGreaterThanOrEqual(1);
        expect(searchByWriterResponse.data.some((q: { id: number }) => q.id === question2Body.id)).toBe(true);

        // Search with multiple conditions including relation field
        const { body: searchMultipleResponse } = await request(app.getHttpServer())
            .post('/question/search')
            .send({
                where: [
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    { 'category.name': { operator: '=', operand: 'relation-test-Category#1' } },
                    { title: { operator: 'LIKE', operand: 'relation-test-Question 1' } },
                ],
            })
            .expect(HttpStatus.OK);

        expect(searchMultipleResponse.data.length).toBeGreaterThanOrEqual(1);
        expect(searchMultipleResponse.data.some((q: { id: number }) => q.id === question1Body.id)).toBe(true);
    });
});
