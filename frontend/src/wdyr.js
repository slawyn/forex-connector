import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  // whyDidYouRender(React, {
  //   trackAllPureComponents: true
  // });
  whyDidYouRender(React, {
    logOnDifferentValues: true
  });
  console.log("Loaded: WDYR")
}