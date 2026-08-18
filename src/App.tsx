/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CashierProvider } from './context/CashierContext';
import { AndroidFrame } from './components/AndroidFrame';

export default function App() {
  return (
    <CashierProvider>
      <AndroidFrame />
    </CashierProvider>
  );
}
