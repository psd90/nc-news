const connection = require('../db/connection');
const { checkExists } = require('./utils');

exports.selectComments = async ({ article_id, sort_by, order }) => {
  const comments = await connection
    .select()
    .from('comments')
    .where({ belongs_to: article_id })
    .orderBy(sort_by || 'created_at', order || 'desc');
  if (!comments.length) {
    await checkExists('articles', 'article_id', article_id);
  }
  return comments;
};