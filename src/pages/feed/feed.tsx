import { Preloader } from '@ui';
import { FeedUI } from '@ui-pages';
import { FC, useEffect } from 'react';
import { useDispatch, useSelector } from '../../services/store';
import { fetchFeeds } from '../../services/slices/feed';

export const Feed: FC = () => {
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state) => state.feed);

  useEffect(() => {
    // Загружаем заказы сразу
    dispatch(fetchFeeds());

    // Обновляем ленту каждые 10 секунд
    const intervalId = setInterval(() => {
      dispatch(fetchFeeds());
    }, 10000);

    // Очищаем интервал при уходе со страницы
    return () => clearInterval(intervalId);
  }, [dispatch]);

  if (isLoading && orders.length === 0) {
    return <Preloader />;
  }

  return (
    <FeedUI orders={orders} handleGetFeeds={() => dispatch(fetchFeeds())} />
  );
};
