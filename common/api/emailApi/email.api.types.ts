export interface IEmailModel {
  from?: string
  to?: string | string[]
  subject?: string
  text?: string
  html?: string
  attachments?: any[]
}

export interface IEmailResponse {
  success: boolean
  data: {
    // Хз що із цього може бути undefined, а що ні
    // Не знайшов інфи, а чат гпт не в курсі
    // Сам nodemailer каже, що це export type SentMessageInfo = any;
    accepted?: string[]
    rejected?: string[]
    ehlo?: string[]
    envelopeTime?: number
    messageTime?: number
    messageSize?: number
    response?: string
    envelope?: { from?: string; to?: string[] }
    messageId?: string
  }
}
