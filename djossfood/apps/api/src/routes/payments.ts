import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { getSupabaseAdmin } from '../config/supabase';

const router = Router();

// POST /api/payments/webhook - Campay payment webhook callback
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const paymentService = new PaymentService();
    const result = await paymentService.handlePaymentWebhook(req.body, req.headers['x-campay-signature'] as string | undefined);

    if (result.success) {
      return res.json({ status: 'ok', message: result.message });
    } else {
      return res.status(400).json({ status: 'error', message: result.message });
    }
  } catch (err: any) {
    console.error('Payment webhook error:', err.message);
    return res.status(500).json({ status: 'error', message: 'Erreur interne du serveur' });
  }
});

// GET /api/payments/status/:orderId - Check payment status for an order
router.get('/status/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const supabase = getSupabaseAdmin();

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, payment_status, payment_method, amount_paid_upfront, amount_paid_delivery, total_amount')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Commande non trouvee' });
    }

    // Also fetch related payment transactions
    const { data: transactions, error: txError } = await supabase
      .from('payment_transactions')
      .select('id, reference, status, amount, type, initiated_at, completed_at')
      .eq('order_id', orderId)
      .order('initiated_at', { ascending: false });

    if (txError) {
      console.error('Fetch transactions error:', txError.message);
    }

    return res.json({
      order: {
        id: (order as any).id,
        payment_status: (order as any).payment_status,
        payment_method: (order as any).payment_method,
        amount_paid_upfront: (order as any).amount_paid_upfront,
        amount_paid_delivery: (order as any).amount_paid_delivery,
        total_amount: (order as any).total_amount,
      },
      transactions: transactions || [],
    });
  } catch (err: any) {
    console.error('Payment status error:', err.message);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

export const paymentsRouter = router;