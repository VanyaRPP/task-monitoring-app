export function shouldOpenModal(paymentActions, currentPayment, isModalOpen) {
    const hasPaymentActions =
        paymentActions?.edit || paymentActions?.preview || false
    return (
        Boolean(isModalOpen) || (Boolean(currentPayment) && hasPaymentActions)
    )
}
