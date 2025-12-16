import React from 'react';
import StoreLayout from '../../StoreLayout';
import CustomerRegisterPage from './register';

const CustomerRegisterWithLayout = (props: any) => {
  return (
    <StoreLayout>
      <CustomerRegisterPage {...props} />
    </StoreLayout>
  );
};

export default CustomerRegisterWithLayout;
