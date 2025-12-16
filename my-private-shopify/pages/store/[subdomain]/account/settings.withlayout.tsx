import React from 'react';
import StoreLayout from '../../StoreLayout';
import AccountSettingsPage from './settings';

const AccountSettingsWithLayout = (props: any) => {
  return (
    <StoreLayout>
      <AccountSettingsPage {...props} />
    </StoreLayout>
  );
};

export default AccountSettingsWithLayout;
