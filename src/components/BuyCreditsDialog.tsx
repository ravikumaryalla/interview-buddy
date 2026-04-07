import React, { useState, useEffect } from 'react';
import {
  Coins,
  X,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, getToken } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

interface CreditPack {
  id: string;
  credits: number;
  price: number; // in INR
  label: string;
  badge?: string;
}

const CREDIT_PACKS: CreditPack[] = [
  { id: 'test', credits: 50, price: 10, label: 'Test' },
  { id: 'starter', credits: 400, price: 399, label: 'Starter' },
  {
    id: 'popular',
    credits: 650,
    price: 599,
    label: 'Popular',
    badge: 'Best Value',
  },
  { id: 'pro', credits: 1000, price: 899, label: 'Pro', badge: 'Save 20%' },
];

type Step = 'select' | 'processing' | 'verify' | 'success' | 'error';

interface Props {
  onClose: () => void;
}

export const BuyCreditsDialog: React.FC<Props> = ({ onClose }) => {
  const { setCredits, credits } = useAppStore();
  const [selected, setSelected] = useState<CreditPack>(CREDIT_PACKS[1]);
  const [step, setStep] = useState<Step>('select');
  const [errorMsg, setErrorMsg] = useState('');
  const [orderId, setOrderId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [newBalance, setNewBalance] = useState(0);

  useEffect(() => {
    window.electronAPI?.onPaymentSuccess?.(({ orderId: oid }) => {
      setOrderId(oid);
      setStep('verify');
      setVerifying(true);
      api.billing
        .verifyPayment(oid)
        .then((result) => {
          if (result.success) {
            setNewBalance(result.balance);
            setCredits(result.balance);
            setStep('success');
          } else {
            setErrorMsg(result.message ?? 'Payment not confirmed yet.');
            setVerifying(false);
          }
        })
        .catch((e: any) => {
          setErrorMsg(
            e?.message ?? 'Verification failed. Contact support if payment was deducted.',
          );
          setVerifying(false);
        });
    });

    window.electronAPI?.onPaymentFailed?.(({ orderId: oid }) => {
      setOrderId(oid);
      setErrorMsg('Payment was not completed. Please try again.');
      setStep('error');
    });
  }, []);

  const handlePay = async () => {
    setStep('processing');
    setErrorMsg('');

    try {
      const { orderId: oid, paymentSessionId } = await api.billing.createOrder(
        selected.id,
      );
      setOrderId(oid);

      // Open payment page in default browser (Cashfree origin restriction workaround)
      // Include the access token so the landing page can verify payment on our behalf
      const token = getToken();
      const payUrl = `https://interviewbuddy.techrax.in/pay?session=${paymentSessionId}&order=${oid}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(payUrl);
      } else {
        window.open(payUrl, '_blank');
      }

      setStep('verify');
    } catch (e: any) {
      setErrorMsg(
        e?.message ?? 'Failed to initiate payment. Please try again.',
      );
      setStep('error');
    }
  };

  const handleVerify = async () => {
    if (!orderId) return;
    setVerifying(true);
    try {
      const result = await api.billing.verifyPayment(orderId);
      if (result.success) {
        setNewBalance(result.balance);
        setCredits(result.balance);
        setStep('success');
      } else {
        setErrorMsg(
          result.message ??
            'Payment not confirmed yet. Please wait a moment and try again.',
        );
        setVerifying(false);
      }
    } catch (e: any) {
      setErrorMsg(
        e?.message ??
          'Verification failed. If payment was deducted, contact support.',
      );
      setVerifying(false);
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='relative w-[360px] bg-panel border border-border rounded-2xl shadow-2xl p-5'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <Coins size={16} className='text-accent' />
            <span className='text-sm font-semibold text-foreground'>
              Buy Credits
            </span>
          </div>
          <button
            onClick={onClose}
            className='text-foreground/30 hover:text-foreground/70 transition-colors'
          >
            <X size={14} />
          </button>
        </div>

        {/* SELECT STEP */}
        {step === 'select' && (
          <>
            <p className='text-xs text-foreground/45 mb-3'>
              Current balance:{' '}
              <span className='text-accent font-semibold'>
                {credits} credits
              </span>
            </p>

            <div className='grid grid-cols-3 gap-2 mb-4'>
              {CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelected(pack)}
                  className={`relative text-left rounded-xl border p-3 transition-all ${
                    selected.id === pack.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-background/50 hover:border-border/80'
                  }`}
                >
                  {pack.badge && (
                    <span className='absolute -top-2 right-2 text-[9px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full'>
                      {pack.badge}
                    </span>
                  )}
                  <div className='flex items-center gap-1 mb-1'>
                    <Coins size={10} className='text-accent' />
                    <span className='text-sm font-bold text-foreground'>
                      {pack.credits}
                    </span>
                  </div>
                  <div className='text-[10px] text-foreground/40 mb-1'>
                    {pack.label}
                  </div>
                  <div className='text-xs font-semibold text-foreground/80'>
                    ₹{pack.price}
                  </div>
                </button>
              ))}
            </div>

            <div className='flex items-center justify-between text-xs text-foreground/35 mb-4 px-0.5'>
              <span>
                ₹{(selected.price / selected.credits).toFixed(2)}/credit
              </span>
              <span className='flex items-center gap-1'>
                <Zap size={10} /> Instant delivery
              </span>
            </div>

            <Button className='w-full gap-2' onClick={handlePay}>
              <Coins size={12} />
              Pay ₹{selected.price} for {selected.credits} credits
            </Button>

            <p className='text-center text-[10px] text-foreground/25 mt-2.5'>
              Secured by Cashfree · GST included
            </p>
          </>
        )}

        {/* PROCESSING STEP */}
        {step === 'processing' && (
          <div className='flex flex-col items-center gap-3 py-8'>
            <Loader2 size={28} className='text-accent animate-spin' />
            <p className='text-sm text-foreground/60'>
              Opening payment window…
            </p>
          </div>
        )}

        {/* VERIFY STEP */}
        {step === 'verify' && (
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center'>
              <ExternalLink size={22} className='text-accent' />
            </div>
            <div className='text-center'>
              <p className='text-sm font-semibold text-foreground mb-1'>
                Complete your payment
              </p>
              <p className='text-xs text-foreground/45'>
                Finish the payment in the Cashfree window, then click the button
                below to confirm your credits.
              </p>
            </div>

            {errorMsg && (
              <p className='text-xs text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2'>
                {errorMsg}
              </p>
            )}

            <Button
              className='w-full gap-2'
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <Loader2 size={12} className='animate-spin' />
              ) : (
                <CheckCircle size={12} />
              )}
              {verifying ? 'Verifying…' : "I've completed the payment"}
            </Button>

            <button
              onClick={() => setStep('select')}
              className='text-xs text-foreground/30 hover:text-foreground/60 transition-colors'
            >
              Go back
            </button>
          </div>
        )}

        {/* SUCCESS STEP */}
        {step === 'success' && (
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center'>
              <CheckCircle size={24} className='text-green-400' />
            </div>
            <div className='text-center'>
              <p className='text-sm font-semibold text-foreground mb-1'>
                Payment successful!
              </p>
              <p className='text-xs text-foreground/45'>
                Your new balance is{' '}
                <span className='text-accent font-bold'>
                  {newBalance} credits
                </span>
              </p>
            </div>
            <Button className='w-full' onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {/* ERROR STEP */}
        {step === 'error' && (
          <div className='flex flex-col items-center gap-4 py-4'>
            <div className='w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center'>
              <XCircle size={24} className='text-red-400' />
            </div>
            <div className='text-center'>
              <p className='text-sm font-semibold text-foreground mb-1'>
                Something went wrong
              </p>
              <p className='text-xs text-foreground/45'>{errorMsg}</p>
            </div>
            <Button
              className='w-full'
              variant='outline'
              onClick={() => setStep('select')}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
