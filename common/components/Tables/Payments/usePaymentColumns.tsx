import React, {useMemo} from "react";
import {AppRoutes, Operations, ServiceName} from "@utils/constants";
import {Button, Flex, List, Popconfirm, Popover, TableColumnType, Tooltip, Typography} from "antd";
import {dateToDefaultFormat, dateToMonthYear} from "@assets/features/formatDate";
import {IExtendedPayment} from "@common/api/paymentApi/payment.api.types";
import {isEmpty, renderCurrency, toFirstUpperCase} from "@utils/helpers";
import s from "@components/DashboardPage/blocks/style.module.scss";
import {IService} from "@common/api/serviceApi/service.api.types";
import {DeleteOutlined, EditOutlined, EyeOutlined} from "@ant-design/icons";
import {IPaymentFilterResponse} from "@common/api/filterApi/filter.api.types";

interface UsePaymentColumnsProps {
  domainsFilters: IPaymentFilterResponse;
  companiesFilter:  IPaymentFilterResponse;
  setPaymentActions: React.Dispatch<React.SetStateAction<{edit: boolean, preview: boolean}>>;
  router: any;
  payments: any;
  paymentActions: any;
  isDomainAdmin: boolean;
  isGlobalAdmin: boolean;
  handleDeletePayment: (id: string) => void;
  deleteLoading: boolean;
  filters: any;
  setFilters: (filters: any) => void;
  token: any;
  selectedColumns: any[];
  setCurrentPayment: (payment: IExtendedPayment) => void;
  renderCurrency: (value: any) => React.ReactNode;
  dateToDefaultFormat: (date: any) => string;
  dateToMonthYear: (date: any) => string;
  toFirstUpperCase: (value: string) => string;
  typeFilters: any[];
}

export const usePaymentColumns = ({
  domainsFilters,
  companiesFilter,
  setPaymentActions,
  router,
  payments,
  paymentActions,
  isDomainAdmin,
  isGlobalAdmin,
  handleDeletePayment,
  deleteLoading,
  filters,
  setFilters,
  token,
  selectedColumns,
  setCurrentPayment,
  renderCurrency,
  dateToDefaultFormat,
  dateToMonthYear,
  toFirstUpperCase,
  typeFilters,
}: UsePaymentColumnsProps): TableColumnType<any>[] => {
  return useMemo(() => {
    return [
      {
        title: 'Надавач послуг',
        width: router.pathname === AppRoutes.PAYMENT ? 170 : 80,
        dataIndex: 'domain',
        filters:
          router.pathname === AppRoutes.PAYMENT
            ? domainsFilters?.domainsFilter
            : null,
        filteredValue: filters?.domain || null,
        filterSearch: true,
        render: (domain) =>
          router.pathname === AppRoutes.PAYMENT ? (
            <Tooltip title="Додати в фільтри">
              <Typography.Link
                onClick={() =>
                  setFilters({ ...filters, domain: [domain?._id] })
                }
              >
                {domain?.name}
              </Typography.Link>
            </Tooltip>
          ) : (
            domain?.name
          ),
        hidden: payments?.domainsFilter?.length <= 1,
      },
      {
        title: 'Компанія',
        dataIndex: 'company',
        width: router.pathname === AppRoutes.PAYMENT ? 140 : 100,
        filters:
          router.pathname === AppRoutes.PAYMENT
            ? companiesFilter?.realEstatesFilter
            : null,
        filteredValue: filters?.company || null,
        filterSearch: true,
        render: (company) =>
          router.pathname === AppRoutes.PAYMENT ? (
            <Tooltip title="Додати в фільтри">
              <Typography.Link
                onClick={() =>
                  setFilters({ ...filters, company: [company?._id] })
                }
              >
                {company?.companyName}
              </Typography.Link>
            </Tooltip>
          ) : (
            company?.companyName
          ),
        hidden: payments?.realEstatesFilter?.length <= 1,
      },
      {
        title: 'Дата створення',
        dataIndex: 'invoiceCreationDate',
        render: dateToDefaultFormat,
        width: router.pathname === AppRoutes.PAYMENT ? 164 : 70,
        sorter:
          router.pathname === AppRoutes.PAYMENT
            ? (a, b) =>
                new Date(a.invoiceCreationDate).getTime() -
                new Date(b.invoiceCreationDate).getTime()
            : null,
      },
      {
        title: 'Тип',
        dataIndex: 'type',
        align: 'center',
        filters: router.pathname === AppRoutes.PAYMENT ? typeFilters : null,
        filteredValue: filters?.type || null,
        filterMultiple: false,
        children: [
          {
            title: <Tooltip title="Дебет (Реалізація)">Дебет</Tooltip>,
            dataIndex: 'debit',
            align: 'center',
            width: router.pathname === AppRoutes.PAYMENT ? 130 : 45,
            render: (_, payment: IExtendedPayment) =>
              payment.type === Operations.Debit ? (
                renderCurrency(payment.generalSum)
              ) : (
                <span className={s.currency}>-</span>
              ),
            sorter:
              router.pathname === AppRoutes.PAYMENT
                ? (a, b) => a.generalSum - b.generalSum
                : null,
          },
          {
            title: <Tooltip title="Кредит (Оплата)">Кредит</Tooltip>,
            dataIndex: 'credit',
            align: 'center',
            width: router.pathname === AppRoutes.PAYMENT ? 130 : 45,
            render: (_, payment: IExtendedPayment) =>
              payment.type === Operations.Credit ? (
                renderCurrency(payment.generalSum)
              ) : (
                <span className={s.currency}>-</span>
              ),
            sorter:
              router.pathname === AppRoutes.PAYMENT
                ? (a, b) => a.generalSum - b.generalSum
                : null,
          },
        ],
      },
      {
        title: 'За місяць',
        align: 'center',
        dataIndex: 'monthService',
        filters: router.pathname === AppRoutes.PAYMENT ? null : null,
        filteredValue: filters?.domain || null,
        filterSearch: true,
        width: router.pathname === AppRoutes.PAYMENT ? 164 : 75,
        render: (monthService: IService, obj) => (
          <Popover
            content={
              !isEmpty(monthService) && (
                <List
                  size="small"
                  dataSource={[
                    {
                      label: ServiceName.maintenancePrice,
                      value: monthService?.rentPrice,
                    },
                    {
                      label: ServiceName.electricityPrice,
                      value: monthService?.electricityPrice,
                    },
                    {
                      label: ServiceName.waterPrice,
                      value: monthService?.waterPrice,
                    },
                    {
                      label: ServiceName.waterPart,
                      value: monthService?.waterPriceTotal,
                    },
                    {
                      label: ServiceName.garbageCollectorPrice,
                      value: monthService?.garbageCollectorPrice,
                    },
                    {
                      label: ServiceName.inflicionPrice,
                      value: monthService?.inflicionPrice,
                    },
                  ]}
                  renderItem={(item) =>
                    !isEmpty(item.value) && (
                      <List.Item>
                        <Flex
                          justify="space-between"
                          gap={16}
                          style={{ width: '100%' }}
                        >
                          <Typography.Text strong>{item.label}</Typography.Text>
                          <Typography.Text>{item.value}</Typography.Text>
                        </Flex>
                      </List.Item>
                    )
                  }
                />
              )
            }
          >
            <Button
              disabled={isEmpty(monthService)}
              block
              style={{
                border: 'none',
                backgroundColor: token.colorFillSecondary,
              }}
            >
              {toFirstUpperCase(
                dateToMonthYear(monthService?.date || obj.invoiceCreationDate)
              )}
            </Button>
          </Popover>
        ),
      },
      ...selectedColumns.map((value) => ({
        title: ServiceName[value],
        width: 132,
        ellipsis: true,
        dataIndex: value,
        render: (_, payment) => {
          const item = payment.invoice.find((item) => item.type === value)
          const sum = +(item?.sum || item?.price)
          const currency = renderCurrency(sum?.toFixed(2))
          return (
            <span className={currency === '-' ? s.currency : ''}>
              {currency}
            </span>
          )
        },
        hidden: router.pathname !== AppRoutes.PAYMENT,
        sorter: (a, b) =>
          (a.invoice.find((i) => i.type === value)?.sum || 0) -
          (b.invoice.find((i) => i.type === value)?.sum || 0),
      })),
      {
        fixed: 'right',
        align: 'center',
        title: '',
        width: router.pathname === AppRoutes.PAYMENT ? 80 : 25,
        render: (_, payment: IExtendedPayment) =>
          payment?.type === Operations.Debit && (
            <Button
              style={{ padding: 0 }}
              type="link"
              onClick={() => {
                setCurrentPayment(payment)
                setPaymentActions({ ...paymentActions, preview: true })
              }}
            >
              <EyeOutlined />
            </Button>
          ),
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: router.pathname === AppRoutes.PAYMENT ? 80 : 25,
        render: (_, payment: IExtendedPayment) => (
          <Button
            style={{ padding: 0 }}
            type="link"
            onClick={() => {
              setCurrentPayment(payment)
              setPaymentActions({ ...paymentActions, edit: true })
            }}
          >
            <EditOutlined />
          </Button>
        ),
        hidden: !isDomainAdmin && !isGlobalAdmin,
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: router.pathname === AppRoutes.PAYMENT ? 80 : 25,

        render: (_, payment: IExtendedPayment) => (
          <Popconfirm
            id="popconfirm_custom"
            title={`Ви впевнені що хочете видалити оплату від ${dateToDefaultFormat(
              payment?.invoiceCreationDate as unknown as string
            )}?`}
            onConfirm={() => handleDeletePayment(payment?._id)}
            okText="Видалити"
            cancelText="Ні"
            disabled={deleteLoading}
          >
            <Button type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        ),
        hidden: !isDomainAdmin && !isGlobalAdmin,
      },
    ].filter(({ hidden }) => !hidden) as TableColumnType<any>[]
  }, [
    payments,
    router,
    paymentActions,
    isDomainAdmin,
    isGlobalAdmin,
    handleDeletePayment,
    deleteLoading,
    filters,
    setFilters,
    token,
    selectedColumns,
  ])
}