import type { H3Event } from 'h3'
import { z } from 'zod'
import { formKeySchema, formSchema, submissionEnvelopeSchema } from '#shared/schemas/engagement.schema'
import type { Json } from '#shared/types/database'
import type { FormFieldDef } from '#shared/types/models'
import { buildSubmissionSchema } from '#shared/utils/form-validation'
import { formModel } from '../models/form.model'
import { settingsModel } from '../models/settings.model'
import { submissionModel } from '../models/submission.model'
import { cacheService } from '../services/cache.service'
import { mailService, renderSubmissionMail } from '../services/mail.service'
import { spamService } from '../services/spam.service'
import { turnstileService } from '../services/turnstile.service'

const keyParams = z.object({ key: formKeySchema })
const idParams = z.object({ id: z.uuid('Invalid id') })
const TURNSTILE_FIELD = { fields: { turnstile: 'Please complete the verification.' } }

async function publicShow(event: H3Event) {
  const { key } = validateParams(event, keyParams)
  const forms = await formModel.findPublicByKeys(useAnonDb(), [key])
  return forms[key] ?? fail(404, 'Form not found.')
}

function token(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { token: spamService.issueToken() }
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function contactOf(fields: FormFieldDef[], values: Record<string, unknown>) {
  const emailField = fields.find(field => field.type === 'email')
  const nameField = fields.find(field => field.name === 'name') ?? fields.find(field => field.type === 'text')
  return {
    email: emailField ? textValue(values[emailField.name]) : '',
    name: nameField ? textValue(values[nameField.name]) : '',
  }
}

async function notify(event: H3Event, input: {
  submissionId: string
  recipients: string[]
  formName: string
  fields: FormFieldDef[]
  values: Record<string, unknown>
  replyTo: string
  extras: { label: string, value: string }[]
}) {
  try {
    const identity = await settingsModel.getMailIdentity(useServiceDb())
    const to = input.recipients.length ? input.recipients : [identity.email].filter(Boolean)
    if (!to.length) {
      console.warn('[mail] no recipients for', input.formName)
      return
    }
    const siteUrl = getSiteConfig(event).url.replace(/\/$/, '')
    const mail = renderSubmissionMail({
      siteName: identity.siteName,
      formName: input.formName,
      adminUrl: `${siteUrl}/admin/submissions/${input.submissionId}`,
      fields: input.fields,
      data: input.values,
      extras: input.extras,
    })
    await mailService.send({ ...mail, to, replyTo: input.replyTo || undefined })
  }
  catch (error) {
    console.error('[mail] submission notification failed', error instanceof Error ? error.message : error)
  }
}

async function submit(event: H3Event) {
  const { key } = validateParams(event, keyParams)
  const envelope = await validateBody(event, submissionEnvelopeSchema)
  const db = useServiceDb()
  const target = await formModel.findForSubmit(db, key)
  if (!target) fail(404, 'Form not found.')

  const values = parseWith(buildSubmissionSchema(target.form.fields), envelope.values)

  if (!envelope.turnstileToken) fail(422, 'Please complete the verification.', TURNSTILE_FIELD)
  const ip = getRequestIP(event, { xForwardedFor: true })
  const human = await turnstileService.verify(envelope.turnstileToken, ip)
  if (!human) fail(422, 'Verification failed. Please try again.', TURNSTILE_FIELD)

  const isSpam = spamService.isLikelyBot({ honeypot: envelope.website, token: spamService.checkToken(envelope.formToken) })
  const contact = contactOf(target.form.fields, values)
  const submissionId = await submissionModel.insert(db, {
    form_id: target.id,
    data: values as unknown as NonNullable<Json>,
    name: contact.name.slice(0, 200),
    email: contact.email.slice(0, 200),
    status: isSpam ? 'spam' : 'new',
    ip_hash: ip ? spamService.hashIp(ip) : '',
    user_agent: (getHeader(event, 'user-agent') ?? '').slice(0, 300),
    source_path: envelope.sourcePath,
    service_slug: envelope.service,
    plan_slug: envelope.plan,
  })

  if (!isSpam) {
    await notify(event, {
      submissionId,
      recipients: target.notifyEmails,
      formName: target.form.name,
      fields: target.form.fields,
      values,
      replyTo: contact.email,
      extras: [
        { label: 'Service', value: envelope.service },
        { label: 'Plan', value: envelope.plan },
        { label: 'Sent from', value: envelope.sourcePath },
      ],
    })
  }

  return { message: target.form.successMessage }
}

async function adminList(event: H3Event) {
  return formModel.listAdmin(useDb(event))
}

async function adminOptions(event: H3Event) {
  return formModel.listKeys(useDb(event))
}

async function adminShow(event: H3Event) {
  const { id } = validateParams(event, idParams)
  return formModel.findAdmin(useDb(event), id)
}

async function update(event: H3Event) {
  await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  const { fields, ...meta } = await validateBody(event, formSchema)
  const db = useDb(event)
  const existing = await formModel.findAdmin(db, id)
  const ownIds = new Set(existing.fields.map(field => field.id))

  await formModel.updateMeta(db, id, meta)
  await formModel.replaceFields(db, id, fields.map(({ id: fieldId, ...field }) => ({
    ...field,
    id: fieldId && ownIds.has(fieldId) ? fieldId : crypto.randomUUID(),
  })))
  await cacheService.purgePublic()
  return formModel.findAdmin(db, id)
}

export const formController = {
  publicShow,
  token,
  submit,
  adminList,
  adminOptions,
  adminShow,
  update,
}
