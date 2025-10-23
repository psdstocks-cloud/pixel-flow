export const dynamic = 'force-dynamic'
'use client';

import { useState, useEffect } from 'react';
import { apiClient, Order, Batch } from '../../../../lib/api';
import { usePolling } from '../../../../lib/hooks/usePolling';
import { StepIndicator } from './components/StepIndicator';
import { URLInput } from './components/URLInput';
import { DeliverySelector } from './components/DeliverySelector';
import { OrderCard } from './components/OrderCard';
import { BatchProgress } from './components/BatchProgress';
import { StickyFooter } from './components/StickyFooter';

export default function OrderV2Page() {
  const [currentStep, setCurrentStep] = useState(1);
  const [urls, setUrls] = useState<string[]>([]);
  const [deliveryType, setDeliveryType] = useState('any');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [batchId, setBatchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(146);

  const stats = {
    total: orders.length,
    completed: orders.filter((o: Order) => o.status === 'COMPLETED').length,
    processing: orders.filter((o: Order) =>
      ['PROCESSING', 'READY', 'DOWNLOADING'].includes(o.status)
    ).length,
    failed: orders.filter((o: Order) => ['ERROR', 'TIMEOUT'].includes(o.status)).length,
  };

  const selectedOrdersList = orders.filter((o: Order) => selectedOrders.has(o.id));
  const totalCost = selectedOrdersList.reduce((sum: number, o: Order) => sum + o.cost, 0);

  usePolling<{ batch: Batch }>(
    () => (batchId ? apiClient.getBatchStatus(batchId) : Promise.reject()),
    {
      interval: 3000,
      enabled: currentStep === 3 && batchId !== null,
      onSuccess: (data: { batch: Batch } | null) => {
        if (data?.batch?.orders) {
          setOrders(data.batch.orders);
          const allDone = data.batch.orders.every((o: Order) =>
            ['COMPLETED', 'ERROR', 'TIMEOUT'].includes(o.status)
          );
          return !allDone;
        }
        return true;
      },
      onError: (err: Error) => {
        console.error('Batch polling error:', err);
        setError('Failed to fetch batch status');
      },
    }
  );

  const handleProcessBatch = async () => {
    if (urls.length === 0) {
      setError('Please enter at least one URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.createBatchOrder(urls, deliveryType);
      setBatchId(response.batchId);
      setOrders(response.orders);

      const successfulIds = new Set<string>(
        response.orders.filter((o: Order) => o.status !== 'ERROR').map((o: Order) => o.id)
      );
      setSelectedOrders(successfulIds);
      setUserBalance(response.remainingBalance);
      setCurrentStep(2);

      if (response.failedUrls && response.failedUrls.length > 0) {
        setError(`⚠️ ${response.failedUrls.length} URL(s) failed`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process batch';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedOrdersList.length === 0) {
      setError('Please select at least one asset');
      return;
    }
    setCurrentStep(3);
    setError(null);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => {
      const newSet = new Set<string>(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleStartNewBatch = () => {
    setCurrentStep(1);
    setUrls([]);
    setOrders([]);
    setSelectedOrders(new Set<string>());
    setBatchId(null);
    setError(null);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      <div className="max-w-6xl mx-auto p-6 pb-32">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Stock Downloader v2</h1>
              <p className="text-gray-400">Batch download up to 5 stock assets instantly</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Available Points</p>
              <p className="text-3xl font-bold text-white">{userBalance} pts</p>
            </div>
          </div>
        </div>

        <StepIndicator currentStep={currentStep} />

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">✕</button>
          </div>
        )}

        {currentStep === 1 && (
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 space-y-8">
            <URLInput onURLsChange={setUrls} maxURLs={5} />
            <div className="border-t border-white/10 pt-8">
              <DeliverySelector value={deliveryType} onChange={setDeliveryType} />
            </div>
            <button
              onClick={handleProcessBatch}
              disabled={urls.length === 0 || isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-lg"
            >
              {isLoading ? 'Processing...' : `🚀 Process ${urls.length} URL${urls.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <>
            <div className="space-y-4 mb-32">
              {orders.map((order: Order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  selected={selectedOrders.has(order.id)}
                  onToggleSelect={() => toggleOrderSelection(order.id)}
                  showCheckbox={true}
                />
              ))}
            </div>
            <StickyFooter
              selectedCount={selectedOrders.size}
              totalCost={totalCost}
              userBalance={userBalance}
              onBack={() => setCurrentStep(1)}
              onConfirm={handleConfirmSelection}
              isLoading={false}
            />
          </>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <BatchProgress {...stats} />
            <div className="space-y-4">
              {orders.filter((order: Order) => selectedOrders.has(order.id)).map((order: Order) => (
                <OrderCard key={order.id} order={order} showCheckbox={false} />
              ))}
            </div>
            {stats.processing === 0 && (
              <button
                onClick={handleStartNewBatch}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl"
              >
                🔄 Start New Batch
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
