import React, { FC, useEffect, useState } from 'react'
import s from './style.module.scss'

interface Props {}

const ReceiptForm: FC<Props> = ({}) => {
  return (
    <>
      <main className={s.page}>
        <header>
          <div>
            <div className={s.info_order}>Постачальник</div>
            <div className={s.info_adres}>
              ТОВ "Український центр дуальної освіти" <br /> Adress 01030, м.
              Київ, вул. Б. Хмельницького, буд. 51Б <br />
              Registatipn number 42637285 <br />
              є платником податку на прибуток на загальних підставах <br />
              <div className={s.info_adres__bold}>
                Р/р UA903052990000026006016402729 <br />
                АТ КБ «ПРИВАТБАНК» МФО: 311744
              </div>
            </div>
            <div className={s.info_order_2}>Одержувач</div>
            <div className={s.info_user}>$$Клієнт</div>
          </div>
        </header>
        <div className={s.invoice_title}>INVOICE № INV-0060</div>
        <div className={s.invoice_data}>від $Day $month $year</div>
        <div className={s.invoice_end__pay}>
          Підлягає сплаті до $Day $month $year
        </div>

        <div className={s.container}>
          <div className={s.table}>
            <div className={s.table_header}>
              <div className={s.header__item}>
                <a id="name" className={s.filter__link_1} href="#">
                  №
                </a>
              </div>
              <div className={s.header__item}>
                <a id="wins" className={s.filter__link} href="#">
                  Назва
                </a>
              </div>
              <div className={s.header__item}>
                <a id="draws" className={s.filter__link} href="#">
                  Кількіст
                </a>
              </div>
              <div className={s.header__item}>
                <a id="losses" className={s.filter__link} href="#">
                  Ціна
                </a>
              </div>
              <div className={s.header__item}>
                <a id="total" className={s.filter__link} href="#">
                  Сумма
                </a>
              </div>
            </div>
            <div className={s.table_content}>
              <div className={s.table_row}>
                <div className={s.table_data_1}>1.</div>
                <div className={s.table_data}>За водопостачання ($month)</div>
                <div className={s.table_data}>$</div>
                <div className={s.table_data}>$</div>
                <div className={s.table_data}>$</div>
              </div>
              <div className={s.table_row}>
                <div className={s.table_data_1}>2.</div>
                <div className={s.table_data}>За електропостачання($month)</div>
                <div className={s.table_data}>$</div>
                <div className={s.table_data}>$</div>
                <div className={s.table_data}>$</div>
              </div>
            </div>
          </div>
        </div>
        <div className={s.pay_table}>
          Всього на суму:
          <div className={s.pay_table_bold}>$write_the_sum_in_letters</div>
        </div>
        <div className={s.pay_info}>
          Загальна сумма оплати:{' '}
          <div className={s.pay_info_money}>$$$$$.$$ грн</div>
        </div>

        <div className={s.pay_admin}>
          Виписав Директор{' '}
          <div className={s.pay_admin__down}>
            _______________________________
          </div>
          <div className={s.pay_admin_name}>Єршов М.В.</div>
        </div>
        <div className={s.end_info}>
          <div className={s.end_info_bolt}>Примітка:</div> *Ціна за комунальні
          послуги вказана з урахуванням ПДВ.
          <br />
          **Ціни на комунальні послуги виставляють компанії-постачальники,
          відповідно їх ціна може змінюватись у <br />
          будь-який час в односторонньму порядку компанією-постачальником.
          <br />
          ***Нарахування цыни "за утримання приміщень" за січень буде здійснено
          в наступному місяці в зв'язку з<br />
          відсутістю зафіксованого тарифу на дану послугу.
          <br />
          ****В березні місяці оплату "за утримання" необхідно буде виконати
          одразу за січень та лютий.
        </div>
      </main>
    </>
  )
}

export default ReceiptForm
