import { FC, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Preloader } from '../ui/preloader';
import { OrderInfoUI } from '../ui/order-info';
import { TIngredient } from '@utils-types';
import { useSelector } from '../../services/store';

export const OrderInfo: FC = () => {
  // Получаем номер заказа из URL (/feed/:number или /profile/orders/:number)
  const { number } = useParams<{ number: string }>();

  // Берём заказы и ингредиенты из стора
  const orders = useSelector((state) => state.feed.orders) || [];
  const ingredients = useSelector((state) => state.ingredients.ingredients);

  // Находим заказ по номеру
  const orderData = useMemo(
    () => orders.find((order) => order.number === Number(number)),
    [orders, number]
  );

  // Формируем данные для отображения
  const orderInfo = useMemo(() => {
    if (!orderData || !ingredients.length) return null;
    const date = new Date(orderData.createdAt);

    type TIngredientsWithCount = {
      [key: string]: TIngredient & { count: number };
    };

    // Подсчитываем количество каждого ингредиента в заказе
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

    // Считаем общую стоимость
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
