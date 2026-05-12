import { IPayment } from '@common/api/paymentApi/payment.api.types'
import nodemailer from 'nodemailer'

const REQUIRED_EMAIL_ENV_VARS = [
  'EMAIL_SERVER_HOST',
  'EMAIL_SERVER_PORT',
  'EMAIL_SERVER_USER',
  'EMAIL_SERVER_PASSWORD',
]

export interface InvoiceEmailPayment {
  invoiceNumber: number
  invoiceCreationDate: Date
  invoice: IPayment['invoice']
  provider: IPayment['provider']
  reciever?: Partial<IPayment['reciever']>
  generalSum: number
  type?: string
  company?: unknown
}

function isEmailDebugEnabled() {
  return (
    process.env.EMAIL_DEBUG === 'true' ||
    process.env.NODE_ENV === 'development'
  )
}

function maskEmail(email?: string) {
  if (!email) {
    return 'missing'
  }

  const [localPart = '', domainPart = ''] = email.split('@')

  if (!domainPart) {
    return `${localPart.slice(0, 2)}***`
  }

  return `${localPart.slice(0, 2)}***@${domainPart}`
}

function maskEmails(emails: string[] = []) {
  return emails.map((email) => maskEmail(email))
}

function logEmailDebug(stage: string, details: Record<string, unknown>) {
  if (!isEmailDebugEnabled()) {
    return
  }

  console.info(`[invoice-email] ${stage}`, details)
}

function hasEmailTransportConfig() {
  return REQUIRED_EMAIL_ENV_VARS.every((key) => Boolean(process.env[key]))
}

function getMissingEmailEnvVars() {
  return REQUIRED_EMAIL_ENV_VARS.filter((key) => !process.env[key])
}

function getInvoiceRecipients(payment: InvoiceEmailPayment) {
  return Array.from(
    new Set(
      (payment?.reciever?.adminEmails || [])
        .map((email) => email?.trim())
        .filter(Boolean)
    )
  )
}

export async function sendInvoiceEmail(
  payment: InvoiceEmailPayment
): Promise<boolean> {
  const recipients = getInvoiceRecipients(payment)
  const invoiceId = `INV-${payment.invoiceNumber}`
  const companyName = payment?.reciever?.companyName || 'domain administrator'
  const sender = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER

  logEmailDebug('start', {
    invoiceId,
    paymentType: payment.type || 'unknown',
    companyName,
    recipients: maskEmails(recipients),
  })

  if (!recipients.length) {
    logEmailDebug('skip_no_recipients', {
      invoiceId,
    })
    return false
  }

  if (!hasEmailTransportConfig()) {
    console.warn('[invoice-email] SMTP configuration is incomplete.', {
      invoiceId,
      missingEnvVars: getMissingEmailEnvVars(),
    })
    return false
  }

  const port = Number(process.env.EMAIL_SERVER_PORT)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port,
    secure: process.env.EMAIL_SERVER_SECURE
      ? process.env.EMAIL_SERVER_SECURE === 'true'
      : port === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })

  logEmailDebug('smtp_ready', {
    invoiceId,
    host: process.env.EMAIL_SERVER_HOST,
    port,
    secure:
      process.env.EMAIL_SERVER_SECURE === 'true' ||
      (!process.env.EMAIL_SERVER_SECURE && port === 465),
    sender: maskEmail(sender),
  })

  try {
    // Server-side PDF generation removed when invoice templates were
    // unified on the client-side renderer. Email is sent without an
    // attached PDF until a browser-backed renderer is wired into the
    // server pipeline.
    logEmailDebug('sendMail_started_no_pdf', {
      invoiceId,
      sender: maskEmail(sender),
      recipients: maskEmails(recipients),
    })

    const result = await transporter.sendMail({
      from: sender,
      to: sender,
      bcc: recipients.join(', '),
      subject: `Invoice ${invoiceId} for ${companyName}`,
      text: `Invoice ${invoiceId} notification (PDF attachment temporarily unavailable).`,
    })

    logEmailDebug('sendMail_completed', {
      invoiceId,
      messageId: result.messageId,
      accepted: Array.isArray(result.accepted) ? result.accepted.length : 0,
      rejected: Array.isArray(result.rejected) ? result.rejected.length : 0,
      response: result.response,
    })
  } catch (error: any) {
    console.error('[invoice-email] sendMail_failed', {
      invoiceId,
      message: error?.message,
      code: error?.code,
      response: error?.response,
    })
    throw error
  }

  return true
}
