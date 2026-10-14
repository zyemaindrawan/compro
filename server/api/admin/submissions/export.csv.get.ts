import { submissionController } from '../../../controllers/submission.controller'

export default defineEventHandler(submissionController.exportCsv)
