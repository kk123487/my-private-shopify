import React from 'react';
import StoreLayout from '../../StoreLayout';
import CustomerLoginPage from './login';

const CustomerLoginWithLayout = (props: any) => {
  return (
    <StoreLayout>
      <CustomerLoginPage {...props} />
    </StoreLayout>
  );
};

export default CustomerLoginWithLayout;
