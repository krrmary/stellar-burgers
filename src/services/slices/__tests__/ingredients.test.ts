/// <reference types="jest" />

import ingredientsReducer, {
  fetchIngredients,
  IngredientsState
} from '../ingredients';

// 1. Мокаем (подменяем) модуль @api, чтобы он не ходил в интернет
jest.mock('@api', () => ({
  getIngredientsApi: jest.fn()
}));

import { getIngredientsApi } from '../../../utils/burger-api';

// Приводим мок к правильному типу TypeScript
const mockedGetIngredientsApi = getIngredientsApi as jest.MockedFunction<
  typeof getIngredientsApi
>;

describe('Тесты редьюсера ingredients', () => {
  const initialState: IngredientsState = {
    ingredients: [],
    isIngredientsLoading: false,
    error: null
  };

  beforeEach(() => {
    // Очищаем историю вызовов моков перед каждым тестом
    jest.clearAllMocks();
  });

  // Тест 1: несуществующий экшен с undefined состоянием
  it('должен вернуть начальное состояние при передаче undefined и неизвестного экшена', () => {
    const action = { type: 'UNKNOWN' };
    const state = ingredientsReducer(undefined, action);
    expect(state).toEqual(initialState);
  });

  // Тест 2: несуществующий экшен с существующим состоянием
  it('должен вернуть текущее состояние при неизвестном экшене', () => {
    const currentState: IngredientsState = {
      ingredients: [
        {
          _id: '1',
          name: 'Булка',
          type: 'bun',
          proteins: 10,
          fat: 5,
          carbohydrates: 20,
          calories: 100,
          image: '',
          image_mobile: '',
          image_large: '',
          price: 100
        }
      ],
      isIngredientsLoading: false,
      error: null
    };
    const action = { type: 'UNKNOWN' };
    const state = ingredientsReducer(currentState, action);
    expect(state).toEqual(currentState);
  });

  // Тест 3: fetchIngredients.pending
  it('должен установить isIngredientsLoading в true и сбросить ошибку при pending', () => {
    const action = { type: fetchIngredients.pending.type };
    const state = ingredientsReducer(initialState, action);
    expect(state.isIngredientsLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  // Тест 4: fetchIngredients.fulfilled
  it('должен сохранить ингредиенты и установить isIngredientsLoading в false при fulfilled', () => {
    const mockIngredients = [
      {
        _id: '1',
        name: 'Булка',
        type: 'bun',
        proteins: 10,
        fat: 5,
        carbohydrates: 20,
        calories: 100,
        image: '',
        image_mobile: '',
        image_large: '',
        price: 100
      }
    ];
    const action = {
      type: fetchIngredients.fulfilled.type,
      payload: mockIngredients
    };
    const state = ingredientsReducer(initialState, action);
    expect(state.isIngredientsLoading).toBe(false);
    expect(state.ingredients).toEqual(mockIngredients);
    expect(state.error).toBeNull();
  });

  // Тест 5: fetchIngredients.rejected
  it('должен установить ошибку и isIngredientsLoading в false при rejected', () => {
    const action = {
      type: fetchIngredients.rejected.type,
      error: { message: 'Ошибка загрузки' }
    };
    const state = ingredientsReducer(initialState, action);
    expect(state.isIngredientsLoading).toBe(false);
    expect(state.error).toBe('Ошибка загрузки');
  });

  // Тест 6: fetchIngredients.rejected без сообщения об ошибке
  it('должен установить дефолтную ошибку, если сообщение отсутствует', () => {
    const action = {
      type: fetchIngredients.rejected.type,
      error: {}
    };
    const state = ingredientsReducer(initialState, action);
    expect(state.isIngredientsLoading).toBe(false);
    expect(state.error).toBe('Ошибка загрузки ингредиентов');
  });
});
