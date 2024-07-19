import withAuthRedirect from "@components/HOC/withAuthRedirect";
import {FC} from "react";
import PriceList from "common/components/Forms/AddPaymentForm/PriceList";


const Invoices: FC = () => {
  return <PriceList />
}
export default withAuthRedirect(Invoices)