import React, {FC} from 'react';
import {Pagination, Table, TablePaginationConfig} from "antd";
import {AppRoutes, Roles} from "@utils/constants";
import PaymentSummary from "@components/DashboardPage/blocks/paymentComponents/PaymentSummary";
import s from "@components/DashboardPage/blocks/style.module.scss";
import {IGetPaymentResponse} from "@common/api/paymentApi/payment.api.types";
import {IUser} from "@common/modules/models/User";
import {FilterValue} from "antd/es/table/interface";

interface Props {
  path: string,
  payments: IGetPaymentResponse,
  columns: any,
  currUser: IUser
  rowSelection: {
    selectedRowKeys: string[],
    defaultSelectedRowKeys: string[],
    onSelect: (a: any, selected: any, rows: any) => void
  },
  loadings: {
    currUserLoading: boolean,
    currUserFetching: boolean,
    paymentsLoading: boolean,
    paymentsFetching: boolean
  },
  setPageData: React.Dispatch<React.SetStateAction<{pageSize: number, currentPage: number}>>,
  pageData: {pageSize: number, currentPage: number},
  setFilters: React.Dispatch<Record<string, any>>

}

const PaymentTableContent: FC<Props> = ({
                                          currUser,
                                          payments,
                                          columns,
                                          path,
                                          rowSelection,
                                          loadings,
                                          setPageData,
                                          pageData,
                                          setFilters}) => {

  const handleTableChange = (__: TablePaginationConfig, filters: Record<string, FilterValue>) => {
    setFilters(filters)
  }

  const handlePaginationChange = (currentPage: number) => {
    setPageData((ps) => ({...ps, currentPage}))
  }

  const handleShowSizeChange = (__: number, pageSize: number) => {
    setPageData((ps) => ({...ps, pageSize, currentPage: 1}))
  }

  const handleLoading = () => {
    return loadings.currUserLoading ||
      loadings.currUserFetching ||
      loadings.paymentsLoading ||
      loadings.paymentsFetching
  }

  return (
    <>
      <Table
        rowSelection={currUser?.roles?.includes(Roles.GLOBAL_ADMIN) && path === AppRoutes.PAYMENT ? rowSelection : null}
        columns={columns}
        dataSource={payments?.data}
        pagination={false}
        onChange={handleTableChange}
        scroll={{x: 1800}}
        summary={() => <PaymentSummary payments={payments} path={path} columns={columns} currUser={currUser}/>}
        bordered
        size="small"
        loading={handleLoading()}
        rowKey="_id"
      />

      {path === AppRoutes.PAYMENT &&
        !loadings.paymentsLoading &&
        !loadings.currUserLoading && (
          <Pagination
            className={s.Pagination}
            pageSize={pageData.pageSize}
            total={payments?.total}
            showSizeChanger
            pageSizeOptions={[10, 30, 50]}
            onChange={handlePaginationChange}
            onShowSizeChange={handleShowSizeChange}
          />
        )}
    </>
  );
};

export default PaymentTableContent;