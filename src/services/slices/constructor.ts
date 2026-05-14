import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { TIngredient, TOrder } from '@utils-types';
import { orderBurgerApi } from '../../utils/burger-api';

type ConstructorState = {
  bun: TIngredient | null;
  ingredients: TIngredient[];
  orderRequest: boolean;
  orderModalData: TOrder | null;
};

const initialState: ConstructorState = {
  bun: null,
  ingredients: [],
  orderRequest: false,
  orderModalData: null
};

export const submitOrder = createAsyncThunk(
  'constructor/submitOrder',
  async (ingredientsIds: string[]) => {
    const data = await orderBurgerApi(ingredientsIds);
    return {
      _id: data.order._id,
      status: data.order.status,
      name: data.order.name,
      createdAt: data.order.createdAt,
      updatedAt: data.order.updatedAt,
      number: data.order.number,
      ingredients: data.order.ingredients,
      owner: data.order.owner
    } as TOrder;
  }
);

const constructorSlice = createSlice({
  name: 'constructor',
  initialState,
  reducers: {
    addBun: (state, action: { payload: TIngredient }) => {
      state.bun = action.payload;
    },
    addIngredient: (state, action: { payload: TIngredient }) => {
      state.ingredients.push(action.payload);
    },
    removeIngredient: (state, action: { payload: TIngredient }) => {
      state.ingredients = state.ingredients.filter(
        (item) => item._id !== action.payload._id
      );
    },
    moveIngredient: (
      state,
      action: { payload: { index: number; direction: 'up' | 'down' } }
    ) => {
      const { index, direction } = action.payload;
      if (direction === 'up' && index > 0) {
        [state.ingredients[index], state.ingredients[index - 1]] = [
          state.ingredients[index - 1],
          state.ingredients[index]
        ];
      } else if (direction === 'down' && index < state.ingredients.length - 1) {
        [state.ingredients[index], state.ingredients[index + 1]] = [
          state.ingredients[index + 1],
          state.ingredients[index]
        ];
      }
    },
    clearOrderModal: (state) => {
      state.orderModalData = null;
      state.orderRequest = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitOrder.pending, (state) => {
        state.orderRequest = true;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        state.orderRequest = false;
        state.orderModalData = action.payload;
        state.bun = null;
        state.ingredients = [];
      })
      .addCase(submitOrder.rejected, (state) => {
        state.orderRequest = false;
      });
  }
});

export const {
  addBun,
  addIngredient,
  removeIngredient,
  moveIngredient,
  clearOrderModal
} = constructorSlice.actions;

export default constructorSlice.reducer;
