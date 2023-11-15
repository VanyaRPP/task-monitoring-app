import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import TestForm from './testForm';
import '@testing-library/jest-dom';
import 'matchmedia-polyfill';
import 'matchmedia-polyfill/matchMedia.addListener';
import { act } from 'react-dom/test-utils';



describe('isValidValidation', () => {
  let Container
  beforeEach(() => {
    act(() => {
      const { container } = render(<TestForm />);
      Container=container
    });
  
  });
  afterEach(() => {
    cleanup();
  });

  it('Name success', async () => {
    const element = Container.querySelector('#form_in_modal_name');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Поле обов'язкове!")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: 'Danek' } });
    });
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(screen.queryByText("Поле обов'язкове!")).toBeNull();
  });

  it('Name return error', async () => {
    const element = Container.querySelector('#form_in_modal_name');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Поле обов'язкове!")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: ' ' } });
    });
  
    const errorMessage = await screen.findByText("Поле обов'язкове!");
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(errorMessage).toBeInTheDocument();
  });
  
  it('Email return error', async () => {
    
    const element = Container.querySelector('#form_in_modal_email');

    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Введіть правильну електронну адресу!")).toBeNull();

    await act(async () => {
      fireEvent.change(element, { target: { value: 'неправильна пошта' } });
    });

    const errorMessage = await screen.findByText(
      "Введіть правильну електронну адресу!"
    );

    expect(errorMessage).toBeInTheDocument();
  });

  it('Email success', async () => {
    const element = Container.querySelector('#form_in_modal_email');

    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Введіть правильну електронну адресу!")).toBeNull();

    await act(async () => {
      fireEvent.change(element, { target: { value: 'Ololo@gmail.com' } });
    });

    // Перевірка, що текст про помилку не відображений після введення правильної адреси
    expect(screen.queryByText("Введіть правильну електронну адресу!")).toBeNull();
  });


  it('description success', async () => {
    const element = Container.querySelector('#form_in_modal_description');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Поле обов'язкове!")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: 'TESTTEXT' } });
    });
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(screen.queryByText("Поле обов'язкове!")).toBeNull();
  });

  it('description return error', async () => {
    const element = Container.querySelector('#form_in_modal_description');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Поле обов'язкове!")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: ' ' } });
    });
  
    const errorMessage = await screen.findByText("Поле обов'язкове!");
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(errorMessage).toBeInTheDocument();
  });

  
  it('phone success', async () => {
    const element = Container.querySelector('#form_in_modal_phone');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Введіть правильний номер телефону починаючи з +380 !")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '+380666666666' } });
    });
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(screen.queryByText("Введіть правильний номер телефону починаючи з +380 !")).toBeNull();
  });

  it('phone return error', async () => {
    const element = Container.querySelector('#form_in_modal_phone');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Введіть правильний номер телефону починаючи з +380 !")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '12345678884' } });
    });
  
    const errorMessage = await screen.findByText("Введіть правильний номер телефону починаючи з +380 !");
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(errorMessage).toBeInTheDocument();
  });
  

  it('Price success', async () => {
    const element = Container.querySelector('#form_in_modal_price');

    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText('Price не може бути менше або дорівнювати 0')).toBeNull();

    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '1000' } });
    });

    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(screen.queryByText('Price не може бути менше або дорівнювати 0')).toBeNull();
  });

  // it('Price return error', async () => {
  //   const element = Container.querySelector('#form_in_modal_price');

  //   // Перевірка, що текст про помилку не відображений перед введенням значення
  //   expect(screen.queryByText('Price не може бути менше або дорівнювати 0')).toBeNull();

  //   // Отримання помилки після введення неправильного значення
  //   await act(async () => {
  //     fireEvent.change(element, { target: { value: '-100' } });
  //   });

  //   const errorMessage = await screen.findByText('Price не може бути менше або дорівнювати 0');

  //   // Перевірка, що текст про помилку відображений після введення неправильного значення
  //   expect(errorMessage).toBeInTheDocument();
  // });

  it('password success', async () => {
    const element = Container.querySelector('#form_in_modal_password');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Пароль має складатися з 8 символів!")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '123asd123' } });
    });
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(screen.queryByText("Пароль має складатися з 8 символів!")).toBeNull();
  });

  it('password return error', async () => {
    const element = Container.querySelector('#form_in_modal_password');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Пароль має складатися з 8 символів!")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: 'aaaaa' } });
    });
  
    const errorMessage = await screen.findByText("Пароль має складатися з 8 символів!");
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(errorMessage).toBeInTheDocument();
  });

  it('paymentPrice success value: 5000', async () => {
    const element = Container.querySelector('#form_in_modal_paymentPrice');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Сума рахунку повинна бути в межах [1, 200000]")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '5000' } });
    });
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(screen.queryByText("Сума рахунку повинна бути в межах [1, 200000]")).toBeNull();
  });

  it('paymentPrice return error value: 0', async () => {
    const element = Container.querySelector('#form_in_modal_paymentPrice');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Сума рахунку повинна бути в межах [1, 200000]")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '0' } });
    });
  
    const errorMessage = await screen.findByText("Сума рахунку повинна бути в межах [1, 200000]");
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(errorMessage).toBeInTheDocument();
  });

  
  it('paymentPrice return error value: 500000', async () => {
    const element = Container.querySelector('#form_in_modal_paymentPrice');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Сума рахунку повинна бути в межах [1, 200000]")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '500000' } });
    });
  
    const errorMessage = await screen.findByText("Сума рахунку повинна бути в межах [1, 200000]");
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(errorMessage).toBeInTheDocument();
  });

  it('electricityPrice success value: 5000', async () => {
    const element = Container.querySelector('#form_in_modal_electricityPrice');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Сума рахунку повинна бути в межах [1, 200000]")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '5000' } });
    });
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(screen.queryByText("Сума рахунку повинна бути в межах [1, 200000]")).toBeNull();
  });

  it('electricityPrice return error value: 0', async () => {
    const element = Container.querySelector('#form_in_modal_electricityPrice');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Сума рахунку повинна бути в межах [1, 200000]")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '0' } });
    });
  
    const errorMessage = await screen.findByText("Сума рахунку повинна бути в межах [1, 200000]");
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(errorMessage).toBeInTheDocument();
  });

  it('electricityPrice return error value: 500000', async () => {
    const element = Container.querySelector('#form_in_modal_electricityPrice');
  
    // Перевірка, що текст про помилку не відображений перед введенням значення
    expect(screen.queryByText("Сума рахунку повинна бути в межах [1, 200000]")).toBeNull();
  
    // Отримання помилки після введення неправильного значення
    await act(async () => {
      fireEvent.change(element, { target: { value: '500000' } });
    });
  
    const errorMessage = await screen.findByText("Сума рахунку повинна бути в межах [1, 200000]");
  
    // Перевірка, що текст про помилку відображений після введення неправильного значення
    expect(errorMessage).toBeInTheDocument();
  });

  

});
