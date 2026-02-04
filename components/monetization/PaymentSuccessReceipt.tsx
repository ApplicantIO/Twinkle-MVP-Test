'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Transaction } from '@/types';

const DEFAULT_DESCRIPTION =
  'By purchasing this content, you gain lifetime access to the video in maximum available quality (up to 4K). Your support directly empowers the creator to continue producing high-quality work and maintain their valuable artistic endeavors.';

export interface PaymentSuccessReceiptProps {
  transaction: Transaction;
  transactionId: string;
  onContinueWatching: () => void;
}

export function PaymentSuccessReceipt({
  transaction: tx,
  transactionId,
  onContinueWatching,
}: PaymentSuccessReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) {
      console.error('Receipt element not found');
      return;
    }
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`receipt-twinkle-${transactionId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const formattedSubtotal = tx.subtotal.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedTax = tx.taxAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedTotal = tx.totalAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const currentDate = tx.purchaseDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const productDescription = `${DEFAULT_DESCRIPTION}\n\nTwinkle 🥂`;

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 p-4">
        <h2 className="text-xl font-bold text-white mb-4">Payment Receipt</h2>
        <div>
          <div
            ref={receiptRef}
            className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6 font-mono text-sm"
          >
            <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-gray-300">
              <h2 className="text-2xl font-bold text-black mb-1">TWINKLE</h2>
              <p className="text-sm text-gray-600 mb-2">PURCHASE RECEIPT</p>
              <div className="mt-3">
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded font-bold text-sm">
                  PAID
                </span>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Product Title:</div>
                <div className="text-black font-semibold">{tx.productTitle}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Product Description:</div>
                <p className="text-black text-xs leading-relaxed whitespace-pre-wrap">
                  {productDescription}
                </p>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div>
                <div className="text-xs text-gray-500 mb-1">Creator Information:</div>
                <div className="text-black font-semibold">{tx.creatorName || 'Unknown Creator'}</div>
                <div className="text-black text-xs">Creator ID: {tx.creatorId || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Date & Time:</div>
                <div className="text-black font-semibold">{currentDate}</div>
              </div>
            </div>

            <div className="mb-6 space-y-3 border-t border-dashed border-gray-300 pt-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">User ID/Name:</div>
                <div className="text-black font-semibold">{tx.userName || tx.userId}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Billing Address:</div>
                <div className="text-black text-xs">
                  {tx.billingAddress || 'Tashkent, Uzbekistan'}
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-2 border-t border-dashed border-gray-300 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-black font-semibold">
                  {formattedSubtotal} {tx.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT (5%):</span>
                <span className="text-black font-semibold">
                  {formattedTax} {tx.currency}
                </span>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-black">
                  {formattedTotal} {tx.currency}
                </span>
              </div>
            </div>

            <div className="mb-6 space-y-3 border-t border-dashed border-gray-300 pt-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Payment Method:</div>
                <div className="text-black font-semibold">{tx.paymentMethodUsed}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Transaction ID:</div>
                <div className="text-black font-semibold">#{tx.transactionId}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
                <p className="text-xs text-gray-600 text-center">
                  This payment was secured by {tx.securityProvider}
                </p>
              </div>
            </div>

            <div className="text-center pt-4 border-t-2 border-dashed border-gray-300">
              <p className="text-xs text-gray-500">Retain this check for your records.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto bg-[#1A1A1A] border-t border-surface/50 p-4">
        <Button
          onClick={handleDownloadPDF}
          className="w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 mb-3"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
        <Button
          onClick={onContinueWatching}
          className="w-full h-10 bg-accent hover:bg-accent/90 text-white"
        >
          Continue Watching
        </Button>
      </div>
    </div>
  );
}
