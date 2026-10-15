import { authController } from '../../../controllers/auth.controller'

export default defineEventHandler(authController.verify)
