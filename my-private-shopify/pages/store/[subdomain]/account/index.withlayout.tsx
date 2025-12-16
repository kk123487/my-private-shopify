import React from 'react';
import StoreLayout from '../../StoreLayout';
import AccountDashboardPage from './index';

const AccountDashboardWithLayout = (props: any) => {
  return (
    <StoreLayout>
      <AccountDashboardPage {...props} />
    </StoreLayout>
  );
};

export default AccountDashboardWithLayout;
