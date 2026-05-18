import { FC, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Preloader } from '../ui/preloader';
import { OrderInfoUI } from '../ui/order-info';
import { TIngredient } from '@utils-types';
import { useDispatch, useSelector } from '../../services/store';
import { getOrderByNumber } from '../../services/slices/orders';

export const OrderInfo: FC = () => {
  const dispatch = useDispatch();
  const { number } = useParams<{ number: string }>();

  const feedOrders = useSelector((state) => state.feed.orders);
  const userOrders = useSelector((state) => state.orders.orders);
  const currentOrder = useSelector((state) => state.orders.currentOrder);
  const ingredients = useSelector((state) => state.ingredients.ingredients);

  const orderData = useMemo(
    () =>
      currentOrder ||
      feedOrders.find((order) => order.number === Number(number)) ||
      userOrders.find((order) => order.number === Number(number)) ||
      null,
    [currentOrder, feedOrders, userOrders, number]
  );

  useEffect(() => {
    if (!orderData && number) {
      dispatch(getOrderByNumber(+number));
    }
  }, [dispatch, number, orderData]);

  const orderInfo = useMemo(() => {
    if (!orderData) return null;

    if (!ingredients.length) {
      return {
        ...orderData,
        ingredientsInfo: {},
        date: new Date(orderData.createdAt),
        total: 0
      };
    }

    const date = new Date(orderData.createdAt);

    type TIngredientsWithCount = {
      [key: string]: TIngredient & { count: number };
    };

    const ingredientsInfo = orderData.ingredients.reduce<TIngredientsWithCount>(
      (acc, item) => {
        if (!acc[item]) {
          const ingredient = ingredients.find((ing) => ing._id === item);
          if (ingredient) {
            acc[item] = { ...ingredient, count: 1 };
          }
        } else {
          acc[item].count++;
        }
        return acc;
      },
      {}
    );

    const total = Object.values(ingredientsInfo).reduce<number>(
      (acc, item) => acc + item.price * item.count,
      0
    );

    return {
      ...orderData,
      ingredientsInfo,
      date,
      total
    };
  }, [orderData, ingredients]);

  if (!orderInfo) {
    return <Preloader />;
  }

  return <OrderInfoUI orderInfo={orderInfo} />;
};
