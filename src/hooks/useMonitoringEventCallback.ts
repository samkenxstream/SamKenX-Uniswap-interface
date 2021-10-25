import { TransactionResponse } from '@ethersproject/providers'
import { initializeApp } from 'firebase/app'
import { getDatabase, push, ref } from 'firebase/database'
import { useCallback } from 'react'

import { useActiveWeb3React } from './web3'

type MonitoringEvent =
  | 'wallet connected'
  | 'swap'
  | 'add liquidity/v3'
  | 'add liquidity/v2'
  | 'remove liquidity/v3'
  | 'remove liquidity/v2'

const FIREBASE_API_KEY = process.env.REACT_APP_FIREBASE_KEY

const firebaseEnabled = typeof FIREBASE_API_KEY !== 'undefined'

if (firebaseEnabled) initializeFirebase()

export function useMonitoringEventCallback() {
  const { account, chainId } = useActiveWeb3React()

  return useCallback(
    async function log(
      type: MonitoringEvent,
      {
        transactionResponse,
        walletAddress = account,
      }: { transactionResponse?: TransactionResponse; walletAddress?: typeof account }
    ) {
      if (!firebaseEnabled) return

      const db = getDatabase()

      if (!walletAddress) {
        console.debug('Wallet address required to log monitoring events.')
        return
      }
      try {
        push(ref(db, 'trm'), {
          chainId,
          origin: location.origin,
          tx: transactionResponse
            ? (({ hash, v, r, s }: Pick<TransactionResponse, 'hash' | 'v' | 'r' | 's'>) => ({ hash, v, r, s }))(
                transactionResponse
              )
            : undefined,
          timestamp: Date.now(),
          type,
          walletAddress,
        })
      } catch (e) {
        console.debug('Error adding document: ', e)
      }
    },
    [account, chainId]
  )
}

function initializeFirebase() {
  initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_KEY,
    authDomain: 'interface-monitoring.firebaseapp.com',
    databaseURL: 'https://interface-monitoring-default-rtdb.firebaseio.com',
    projectId: 'interface-monitoring',
    storageBucket: 'interface-monitoring.appspot.com',
    messagingSenderId: '968187720053',
    appId: '1:968187720053:web:acedf72dce629d470be33c',
  })
}