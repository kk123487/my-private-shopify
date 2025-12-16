import React from 'react';
import StoreLayout from '../../StoreLayout';
import WishlistPage from './wishlist';

const WishlistWithLayout = (props: any) => {
  return (
    <StoreLayout>
      <WishlistPage {...props} />
    </StoreLayout>
  );
};

export default WishlistWithLayout;
