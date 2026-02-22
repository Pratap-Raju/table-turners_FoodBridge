import React, { useState } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';

interface FinancialDonationProps {
  onBack: () => void;
}

export default function FinancialDonation({ onBack }: FinancialDonationProps) {
  const [amount, setAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');

  const suggestedAmounts = [25, 50, 100, 250, 500, 1000];

  const NAVY = "#1e3a8a";
  const ORANGE = "#f26522";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Messaging */}
        <div className="space-y-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 font-semibold hover:underline mb-4"
            style={{ color: NAVY }}
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          
          <h1 className="text-5xl font-bold leading-tight" style={{ color: NAVY }}>
            Give Meals and <span style={{ color: ORANGE }}>Hope</span> to Your Neighbors
          </h1>
          
          <p className="text-xl text-gray-700 opacity-90 leading-relaxed">
            Every <span className="font-bold" style={{ color: NAVY }}>$1</span> you donate provides up to 
            <span className="font-bold" style={{ color: NAVY }}> 3 meals</span>. Your gift helps support 
            access to nourishing food for families in our community.
          </p>
          
          <div className="rounded-2xl overflow-hidden shadow-xl hidden md:block border-4 border-white">
             <img 
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80" 
              alt="Community impact" 
              className="w-full h-64 object-cover"
            />
          </div>
        </div>

        {/* Right Side: Donation Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 font-bold text-lg" style={{ color: NAVY }}>
              <Heart style={{ color: ORANGE, fill: ORANGE }} size={24} />
              Make an impact today!
            </div>
          </div>

          {/* Frequency Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-full mb-8">
            <button 
              onClick={() => setFrequency('once')}
              className={`flex-1 py-2 rounded-full font-bold transition-all ${frequency === 'once' ? 'text-white shadow-md' : 'text-gray-500'}`}
              style={{ backgroundColor: frequency === 'once' ? NAVY : 'transparent' }}
            >
              Give once
            </button>
            <button 
              onClick={() => setFrequency('monthly')}
              className={`flex-1 py-2 rounded-full font-bold transition-all ${frequency === 'monthly' ? 'text-white shadow-md' : 'text-gray-500'}`}
              style={{ backgroundColor: frequency === 'monthly' ? NAVY : 'transparent' }}
            >
              Monthly <Heart size={14} className="inline ml-1" />
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mb-6">Choose an amount to donate {frequency}:</p>

          {/* Amount Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {suggestedAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`py-3 border-2 rounded-xl font-bold transition-all ${amount === amt.toString() ? 'bg-blue-50' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                style={{ 
                  borderColor: amount === amt.toString() ? NAVY : '',
                  color: amount === amt.toString() ? NAVY : '#4b5563'
                }}
              >
                CA${amt}
              </button>
            ))}
          </div>

          {/* Custom Amount Input */}
          <div className="relative mb-8">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">CA$</span>
            <input 
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl py-4 pl-14 pr-4 text-2xl font-bold outline-none transition-all"
              style={{ focus: { borderColor: NAVY } }}
            />
          </div>

          <button 
            className="w-full text-white py-4 rounded-full text-xl font-bold hover:opacity-90 transition-all shadow-lg"
            style={{ backgroundColor: NAVY }}
          >
            {amount ? `Donate CA$${amount}` : 'Choose an amount'}
          </button>
          
          <p className="text-[10px] text-gray-400 mt-6 text-center leading-relaxed">
            Your Food Bank is a non-profit organization. You will receive an official tax receipt for your contribution.
          </p>
        </div>
      </div>
    </div>
  );
}