/// <reference types="jest" />

import constructorReducer, {
  addBun,
  addIngredient,
  removeIngredient,
  moveIngredient,
  clearOrderModal,
  submitOrder,
  TConstructorIngredient
} from '../constructor';
import { TIngredient, TOrder } from '../../../utils/types';

// Мокаем uuid, чтобы id был предсказуемым в тестах
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

describe('Тесты редьюсера burgerConstructor', () => {
  const initialState = {
    bun: null,
    ingredients: [],
    orderRequest: false,
    orderModalData: null
  };

  const mockBun: TIngredient = {
    _id: 'bun-1',
    name: 'Краторная булка N-200i',
    type: 'bun',
    proteins: 80,
    fat: 24,
    carbohydrates: 53,
    calories: 420,
    price: 1255,
    image: 'https://code.s3.yandex.net/react/code/bun-02.png',
    image_mobile: 'https://code.s3.yandex.net/react/code/bun-02_mobile.png',
    image_large: 'https://code.s3.yandex.net/react/code/bun-02_large.png'
  };

  const mockIngredient: TIngredient = {
    _id: 'ing-1',
    name: 'Филе Люминесцентного тетраодонтимформа',
    type: 'main',
    proteins: 44,
    fat: 26,
    carbohydrates: 85,
    calories: 643,
    price: 988,
    image: 'https://code.s3.yandex.net/react/code/meat-03.png',
    image_mobile: 'https://code.s3.yandex.net/react/code/meat-03_mobile.png',
    image_large: 'https://code.s3.yandex.net/react/code/meat-03_large.png'
  };

  const mockConstructorIngredient: TConstructorIngredient = {
    ...mockIngredient,
    id: 'test-uuid-123'
  };

  // 1. Несуществующий экшен с undefined состоянием
  it('должен вернуть начальное состояние при передаче undefined и неизвестного экшена', () => {
    const action = { type: 'UNKNOWN' };
    const state = constructorReducer(undefined, action);
    expect(state).toEqual(initialState);
  });

  // 2. Несуществующий экшен с существующим состоянием
  it('должен вернуть текущее состояние при неизвестном экшене', () => {
    const currentState = {
      ...initialState,
      bun: mockBun,
      ingredients: [mockConstructorIngredient]
    };
    const action = { type: 'UNKNOWN' };
    const state = constructorReducer(currentState, action);
    expect(state).toEqual(currentState);
  });

  // 3. addBun
  it('должен добавить булку', () => {
    const action = addBun(mockBun);
    const state = constructorReducer(initialState, action);
    expect(state.bun).toEqual(mockBun);
  });

  // 4. addIngredient (проверяем работу prepare)
  it('должен добавить ингредиент с уникальным id (через prepare)', () => {
    const action = addIngredient(mockIngredient);
    const state = constructorReducer(initialState, action);
    expect(state.ingredients).toHaveLength(1);
    expect(state.ingredients[0].id).toBe('test-uuid-123');
    expect(state.ingredients[0].name).toBe(mockIngredient.name);
  });

  // 5. removeIngredient
  it('должен удалить ингредиент по id', () => {
    const stateWithIngredient = {
      ...initialState,
      ingredients: [mockConstructorIngredient]
    };
    const action = removeIngredient(mockConstructorIngredient);
    const state = constructorReducer(stateWithIngredient, action);
    expect(state.ingredients).toHaveLength(0);
  });

  // 6. moveIngredient вверх
  it('должен переместить ингредиент вверх', () => {
    const ing1 = { ...mockConstructorIngredient, id: 'id-1' };
    const ing2 = { ...mockConstructorIngredient, id: 'id-2' };
    const stateWithIngredients = {
      ...initialState,
      ingredients: [ing1, ing2]
    };
    const action = moveIngredient({ index: 1, direction: 'up' });
    const state = constructorReducer(stateWithIngredients, action);
    expect(state.ingredients[0].id).toBe('id-2');
    expect(state.ingredients[1].id).toBe('id-1');
  });

  // 7. moveIngredient вниз
  it('должен переместить ингредиент вниз', () => {
    const ing1 = { ...mockConstructorIngredient, id: 'id-1' };
    const ing2 = { ...mockConstructorIngredient, id: 'id-2' };
    const stateWithIngredients = {
      ...initialState,
      ingredients: [ing1, ing2]
    };
    const action = moveIngredient({ index: 0, direction: 'down' });
    const state = constructorReducer(stateWithIngredients, action);
    expect(state.ingredients[0].id).toBe('id-2');
    expect(state.ingredients[1].id).toBe('id-1');
  });

  // 8. moveIngredient вверх на первом элементе (не должно меняться)
  it('не должен перемещать первый ингредиент вверх', () => {
    const ing1 = { ...mockConstructorIngredient, id: 'id-1' };
    const stateWithIngredients = {
      ...initialState,
      ingredients: [ing1]
    };
    const action = moveIngredient({ index: 0, direction: 'up' });
    const state = constructorReducer(stateWithIngredients, action);
    expect(state.ingredients[0].id).toBe('id-1');
  });

  // 9. moveIngredient вниз на последнем элементе (не должно меняться)
  it('не должен перемещать последний ингредиент вниз', () => {
    const ing1 = { ...mockConstructorIngredient, id: 'id-1' };
    const stateWithIngredients = {
      ...initialState,
      ingredients: [ing1]
    };
    const action = moveIngredient({ index: 0, direction: 'down' });
    const state = constructorReducer(stateWithIngredients, action);
    expect(state.ingredients[0].id).toBe('id-1');
  });

  // 10. clearOrderModal
  it('должен очистить данные модального окна заказа и сбросить orderRequest', () => {
    const stateWithOrder = {
      ...initialState,
      orderRequest: true,
      orderModalData: { number: 123 } as TOrder
    };
    const action = clearOrderModal();
    const state = constructorReducer(stateWithOrder, action);
    expect(state.orderModalData).toBeNull();
    expect(state.orderRequest).toBe(false);
  });

  // 11. submitOrder.pending
  it('должен установить orderRequest в true при pending', () => {
    const action = { type: submitOrder.pending.type };
    const state = constructorReducer(initialState, action);
    expect(state.orderRequest).toBe(true);
  });

  // 12. submitOrder.fulfilled
  it('должен сохранить данные заказа, очистить конструктор и сбросить orderRequest при fulfilled', () => {
    const mockOrder: TOrder = { 
      number: 123, 
      _id: 'order-1', 
      status: 'done', 
      name: 'Test Order', 
      createdAt: '2023-01-01', 
      updatedAt: '2023-01-01', 
      ingredients: ['ing-1'] 
    };
    const stateWithBurger = {
      bun: mockBun,
      ingredients: [mockConstructorIngredient],
      orderRequest: true,
      orderModalData: null
    };
    const action = {
      type: submitOrder.fulfilled.type,
      payload: mockOrder
    };
    const state = constructorReducer(stateWithBurger, action);
    expect(state.orderRequest).toBe(false);
    expect(state.orderModalData).toEqual(mockOrder);
    expect(state.bun).toBeNull();
    expect(state.ingredients).toEqual([]);
  });

  // 13. submitOrder.rejected
  it('должен установить orderRequest в false при rejected', () => {
    const action = { type: submitOrder.rejected.type };
    const stateWithRequest = {
      ...initialState,
      orderRequest: true
    };
    const state = constructorReducer(stateWithRequest, action);
    expect(state.orderRequest).toBe(false);
  });
});