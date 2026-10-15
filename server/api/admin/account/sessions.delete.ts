import { accountController } from '../../../controllers/account.controller'

export default defineEventHandler(accountController.signOutOthers)
