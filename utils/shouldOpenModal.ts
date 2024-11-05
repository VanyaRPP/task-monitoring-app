export const shouldOpenModal = (isModalOpen, currentPayment, paymentActions)=> {
  const hasPaymentActions =
    paymentActions?.edit || paymentActions?.preview
  return Boolean(isModalOpen) || (Boolean(currentPayment) && hasPaymentActions)
}
