import { articleController } from '../../../../controllers/article.controller'

export default defineEventHandler(articleController.preview)
