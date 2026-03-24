import type { NextApiRequest, NextApiResponse } from 'next';
import { bot } from '@lib/bot';
import { InputFile } from "grammy";
import { generatePdf } from '@utils/pdf/bufferGenerators';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { paymentData } = req.body;
    const adminId = process.env.ADMIN_ID;

    if (!paymentData || !adminId) {
      return res.status(400).json({ error: "No payment data or Admin ID" });
    }

    const pdfBuffer = await generatePdf(paymentData);

    const fileData = new Uint8Array(pdfBuffer);

    await bot.api.sendDocument(
      adminId,
      new InputFile(fileData, `Invoice_${paymentData.invoiceNumber || 'file'}.pdf`),
      { caption: `📄 Сгенеровано професійний PDF для: ${paymentData?.reciever?.companyName || 'Клієнта'}` }
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}