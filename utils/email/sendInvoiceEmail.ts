import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { isDev } from '@utils/env'
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

export interface SendInvoiceEmailOptions {
  html?: string
}

function isEmailDebugEnabled() {
  return process.env.EMAIL_DEBUG === 'true' || isDev
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
  // eslint-disable-next-line no-console
  console.info(`[invoice-email] ${stage}`, details)
}

// SES rejects a From address that is not a verified identity, and e-orenda.com
// publishes no MX, so nothing can receive a reply sent to it. Point Reply-To at
// a mailbox that is actually read; without it a recipient pressing "reply"
// silently gets a bounce.
function getReplyTo() {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined
}

// Opting a message into an SES configuration set is what turns on per-message
// event publishing (Send/Delivery/Bounce/Complaint/Reject). Over SMTP that is
// done with this header — without it SES records only aggregate counters and a
// lost message cannot be traced.
function getConfigurationSetHeaders() {
  const configurationSet = process.env.EMAIL_CONFIGURATION_SET?.trim()
  return configurationSet
    ? { 'X-SES-CONFIGURATION-SET': configurationSet }
    : undefined
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

function getAttachmentFileName(payment: InvoiceEmailPayment) {
  const companyName = payment?.reciever?.companyName || 'invoice'
  const safeCompanyName = companyName.replace(/[^a-zA-Z0-9_-]+/g, '_')

  return `${safeCompanyName}-inv-${payment.invoiceNumber}.pdf`
}

export async function sendInvoiceEmail(
  payment: InvoiceEmailPayment,
  options: SendInvoiceEmailOptions = {}
): Promise<boolean> {
  const { html } = options
  const recipients = getInvoiceRecipients(payment)
  const invoiceId = `INV-${payment.invoiceNumber}`
  const companyName = payment?.reciever?.companyName || 'domain administrator'
  const sender = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER

  logEmailDebug('start', {
    invoiceId,
    paymentType: payment.type || 'unknown',
    companyName,
    hasHtml: Boolean(html),
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

  let attachments: nodemailer.SendMailOptions['attachments']
  if (html) {
    logEmailDebug('pdf_generation_started', { invoiceId })

    const { generatePdfFromHtml } = await import('@utils/pdf/bufferGenerators')
    const pdfBuffer = await generatePdfFromHtml(html)

    logEmailDebug('pdf_generation_completed', {
      invoiceId,
      pdfSizeBytes: pdfBuffer.length,
    })

    attachments = [
      {
        filename: getAttachmentFileName(payment),
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ]
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
    logEmailDebug(
      attachments ? 'sendMail_started' : 'sendMail_started_no_pdf',
      {
        invoiceId,
        sender: maskEmail(sender),
        recipients: maskEmails(recipients),
      }
    )

    const replyTo = getReplyTo()
    const headers = getConfigurationSetHeaders()

    const result = await transporter.sendMail({
      from: sender,
      to: recipients.join(', '),
      ...(replyTo ? { replyTo } : {}),
      ...(headers ? { headers } : {}),
      subject: `Invoice ${invoiceId} for ${companyName}`,
      text: attachments
        ? `Invoice ${invoiceId} is attached to this email.`
        : `Invoice ${invoiceId} notification.`,
      ...(attachments ? { attachments } : {}),
    })

    // Nodemailer resolves as long as one recipient was accepted, so a partial
    // rejection would otherwise be reported to the caller as a clean success.
    // Logged unconditionally, not behind EMAIL_DEBUG: this is the one signal
    // that an address never received its invoice.
    const rejected = Array.isArray(result.rejected) ? result.rejected : []
    if (rejected.length) {
      console.warn('[invoice-email] recipients_rejected', {
        invoiceId,
        rejected: maskEmails(rejected as string[]),
        accepted: Array.isArray(result.accepted) ? result.accepted.length : 0,
        messageId: result.messageId,
      })
    }

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
