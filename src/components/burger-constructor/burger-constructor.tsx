import { FC, useMemo, useCallback } from 'react';
import { BurgerConstructorUI } from '@ui';
import { useDispatch, useSelector } from '../../services/store';
import { useNavigate } from 'react-router-dom';
import {
  submitOrder,
  clearOrderModal
} from '../../services/slices/constructor';

export const BurgerConstructor: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const constructorItems = useSelector((state) => state.burgerConstructor);
  const user = useSelector((state) => state.user.user);

  const onOrderClick = useCallback(() => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }
    if (!constructorItems?.bun || constructorItems?.orderRequest) return;

    const ingredientsIds = [
      constructorItems.bun._id,
      ...(constructorItems.ingredients?.map((item) => item._id) || []),
      constructorItems.bun._id
    ];

    dispatch(submitOrder(ingredientsIds));
  }, [user, constructorItems, dispatch, navigate]);

  const closeOrderModal = useCallback(() => {
    dispatch(clearOrderModal());
  }, [dispatch]);

  const price = useMemo(() => {
    const bun = constructorItems?.bun;
    const ingredients = constructorItems?.ingredients || [];
    return (
      (bun?.price ?? 0) * 2 +
      ingredients.reduce((sum: number, item) => sum + item.price, 0)
    );
  }, [constructorItems]);

  return (
    <BurgerConstructorUI
      price={price}
      orderRequest={constructorItems?.orderRequest || false}
      constructorItems={{
        bun: constructorItems?.bun || null,
        ingredients: constructorItems?.ingredients || []
      }}
      orderModalData={constructorItems?.orderModalData || null}
      onOrderClick={onOrderClick}
      closeOrderModal={closeOrderModal}
    />
  );
};
