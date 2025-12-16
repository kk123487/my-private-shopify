import React from 'react';
import StoreLayout from './StoreLayout';

const TrackingWithLayout = (props: any) => {
  return (
    <StoreLayout>
      {/* @ts-ignore */}
      <props.Component {...props.pageProps} />
    </StoreLayout>
  );
};

export default TrackingWithLayout;
