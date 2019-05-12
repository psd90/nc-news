const articlesRouter = require('express').Router();
const {
  getArticles,
  getArticleById,
  patchArticleById,
} = require('../controllers/articles');
const { getComments } = require('../controllers/comments');
const { withErrorHandling, methodNotAllowed } = require('../errors');

articlesRouter
  .route('/')
  .get(withErrorHandling(getArticles))
  .all(methodNotAllowed);

articlesRouter
  .route('/:article_id')
  .get(withErrorHandling(getArticleById))
  .patch(withErrorHandling(patchArticleById))
  .all(methodNotAllowed);

articlesRouter
  .route('/:article_id/comments')
  .get(withErrorHandling(getComments));

module.exports = articlesRouter;
