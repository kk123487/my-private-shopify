import React from 'react';
import StoreLayout from '../StoreLayout';
import dynamic from 'next/dynamic';

const ProductDetailPage = dynamic(() => import('./[id]'));

const ProductDetailWithLayout = (props: any) => {
  return (
    <StoreLayout>
      <ProductDetailPage {...props} />
    </StoreLayout>
  );
};

export default ProductDetailWithLayout;
