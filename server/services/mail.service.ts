import nodemailer, { type Transporter } from 'nodemailer'
import type { FormFieldDef } from '#shared/types/models'

export interface MailMessage {
  to: string[]
  subject: string
  text: string
  html: string
  replyTo?: string
}

let transport: Transporter | undefined

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function smtp() {
  const config = useRuntimeConfig().smtp
  return config.host && config.user && config.pass ? config : null
}

function getTransport() {
  const config = smtp()
  if (!config) return null
  transport ??= nodemailer.createTransport({
    host: config.host,
    port: Number(config.port),
    secure: Number(config.port) === 465,
    requireTLS: Number(config.port) !== 465,
    auth: { user: config.user, pass: config.pass },
  })
  return transport
}

async function send(message: MailMessage) {
  const mailer = getTransport()
  if (!mailer) {
    console.info('[mail] SMTP is not configured; message not sent', { to: message.to, subject: message.subject })
    return false
  }
  await mailer.sendMail({
    from: smtp()!.from || smtp()!.user,
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
    html: message.html,
  })
  return true
}

export function displayValue(field: FormFieldDef, value: unknown): string {
  const labelOf = (raw: string) => field.options.find(option => option.value === raw)?.label ?? raw
  if (Array.isArray(value)) return value.map(item => labelOf(String(item))).join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined) return ''
  return labelOf(String(value))
}

export interface SubmissionMail {
  siteName: string
  formName: string
  adminUrl: string
  fields: FormFieldDef[]
  data: Record<string, unknown>
  extras: { label: string, value: string }[]
  replyTo?: string
}

export function renderSubmissionMail(input: SubmissionMail) {
  const rows = [
    ...input.fields.map(field => ({ label: field.label, value: displayValue(field, input.data[field.name]) })),
    ...input.extras,
  ].filter(row => row.value !== '')

  const subject = `New ${input.formName.toLowerCase()} submission · ${input.siteName}`
  const text = [
    `New submission from ${input.formName}.`,
    '',
    ...rows.map(row => `${row.label}: ${row.value}`),
    '',
    `Open in admin: ${input.adminUrl}`,
  ].join('\n')

  const html = `<p>New submission from <strong>${escapeHtml(input.formName)}</strong>.</p>
<table cellpadding="6" style="border-collapse:collapse">${rows
  .map(row => `<tr><th align="left" valign="top">${escapeHtml(row.label)}</th><td style="white-space:pre-wrap">${escapeHtml(row.value)}</td></tr>`)
  .join('')}</table>
<p><a href="${escapeHtml(input.adminUrl)}">Open in admin</a></p>`

  return { subject, text, html }
}

export const mailService = {
  send,
}
