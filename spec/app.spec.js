process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiSorted = require('chai-sorted');
const request = require('supertest');

const app = require('../app');
const connection = require('../db/connection');

chai.use(chaiSorted);

const { expect } = chai;

describe('/', () => {
  beforeEach(() => connection.seed.run());
  after(() => connection.destroy());

  describe('/api', () => {
    it('GET status:200', async () => {
      const { body } = await request(app)
        .get('/api')
        .expect(200);
      expect(body.ok).to.equal(true);
    });

    describe('/topics', () => {
      it('GET status:200, serves all topics', async () => {
        const { body } = await request(app)
          .get('/api/topics')
          .expect(200);
        expect(body).to.contain.keys('topics');
        expect(body.topics).to.be.an('array');
        expect(body.topics).to.have.length(3);
        expect(body.topics[0]).to.contain.keys('slug', 'description');
      });
      it('INVALID METHOD status:405', async () => {
        const { body } = await request(app)
          .put('/api/topics')
          .expect(405);
        expect(body.msg).to.equal('Method Not Allowed');
      });
    });

    describe('/articles', () => {
      it('GET status:200, serves an array of articles', async () => {
        const { body } = await request(app)
          .get('/api/articles')
          .expect(200);
        expect(body).to.contain.keys('articles');
        expect(body.articles).to.be.an('array');
        expect(body.articles[0]).to.contain.keys(
          'article_id',
          'author',
          'title',
          'topic',
          'created_at',
          'votes',
        );
      });
      it('GET status:200, articles are sorted descending by date by default', async () => {
        const { body } = await request(app)
          .get('/api/articles')
          .expect(200);
        expect(body.articles).to.be.descendingBy('created_at');
      });
      it('GET status:200, each article has a comment count', async () => {
        const { body } = await request(app)
          .get('/api/articles')
          .expect(200);
        expect(body.articles[0].comment_count).to.equal('13');
        expect(body.articles[1].comment_count).to.equal('0');
      });
      it('GET status:200, accepts a sort_by query to sort articles', async () => {
        const { body } = await request(app)
          .get('/api/articles?sort_by=title')
          .expect(200);
        expect(body.articles).to.be.descendingBy('title');
      });
      it('GET status:400, when passed an invalid sort_by query', async () => {
        const { body } = await request(app)
          .get('/api/articles?sort_by=not-a-column')
          .expect(400);
        expect(body.msg).to.equal('Bad Request');
      });
      it('GET status:200, accepts an order query (asc / desc)', async () => {
        const { body } = await request(app)
          .get('/api/articles?order=asc')
          .expect(200);
        expect(body.articles).to.be.ascendingBy('created_at');
      });
      it('GET status:400, when passed an invalid order query', async () => {
        const { body } = await request(app)
          .get('/api/articles?order=not-asc-or-desc')
          .expect(400);
        expect(body.msg).to.equal('Bad Request: Invalid order query');
      });
      it('GET status:200, accepts an author query', async () => {
        const { body } = await request(app)
          .get('/api/articles?author=butter_bridge')
          .expect(200);
        expect(body.articles).to.satisfy(articles => {
          return articles.every(({ author }) => author === 'butter_bridge');
        });
      });
      it('GET status:200, when passed an author that exists, but has no articles', async () => {
        const { body } = await request(app)
          .get('/api/articles?author=lurker')
          .expect(200);
        expect(body.articles).to.eql([]);
      });
      it('GET status:400, when passed an invalid order query', async () => {
        const { body } = await request(app)
          .get('/api/articles?order=not-asc-or-desc')
          .expect(400);
        expect(body.msg).to.equal('Bad Request: Invalid order query');
      });
      it('GET status:200, accepts an author query', async () => {
        const { body } = await request(app)
          .get('/api/articles?author=butter_bridge')
          .expect(200);
        expect(body.articles).to.satisfy(articles => {
          return articles.every(({ author }) => author === 'butter_bridge');
        });
      });
      it('GET status:200, when passed an author that exists, but has no articles', async () => {
        const { body } = await request(app)
          .get('/api/articles?author=lurker')
          .expect(200);
        expect(body.articles).to.eql([]);
      });
      it('GET status:404, when passed an author that does not exist', async () => {
        const { body } = await request(app)
          .get('/api/articles?author=not-an-author')
          .expect(404);
        expect(body.msg).to.equal('User Not Found');
      });
      it('GET status:200, accepts a topic query', async () => {
        const { body } = await request(app)
          .get('/api/articles?topic=cats')
          .expect(200);
        expect(body.articles).to.satisfy(articles => {
          return articles.every(({ topic }) => topic === 'cats');
        });
      });
      it('GET status:200, when passed a topic that exists, but has no articles', async () => {
        const { body } = await request(app)
          .get('/api/articles?topic=paper')
          .expect(200);
        expect(body.articles).to.eql([]);
      });
      it('GET status:404, when passed an topic that does not exist', async () => {
        const { body } = await request(app)
          .get('/api/articles?topic=not-a-topic')
          .expect(404);
        expect(body.msg).to.equal('Topic Not Found');
      });
      it('INVALID METHOD status:405', async () => {
        const { body } = await request(app)
          .put('/api/articles')
          .expect(405);
        expect(body.msg).to.equal('Method Not Allowed');
      });

      describe('/:article_id', () => {
        it('GET status:200, serves up an article by id', async () => {
          const { body } = await request(app)
            .get('/api/articles/2')
            .expect(200);
          expect(body).to.contain.keys('article');
          expect(body.article).to.be.an('object');
          expect(body.article).to.contain.keys(
            'article_id',
            'author',
            'title',
            'topic',
            'created_at',
            'votes',
          );
          expect(body.article.article_id).to.equal(2);
        });
        it('GET status:200, serves up an article with corresponding comment_count', async () => {
          const { body } = await request(app)
            .get('/api/articles/2')
            .expect(200);
          expect(body.article.comment_count).to.equal('0');
        });
        it('GET status:404, when passed a valid non-existent article_id', async () => {
          const { body } = await request(app)
            .get('/api/articles/9999')
            .expect(404);
          expect(body.msg).to.equal('article_id not found');
        });
      });
    });
  });
});
