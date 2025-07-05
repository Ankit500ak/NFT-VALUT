"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, DollarSign, Euro, Shield, Zap, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FiatPurchase() {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [purchaseStep, setPurchaseStep] = useState<"input" | "processing" | "success">("input")
  const [transactionId, setTransactionId] = useState("")
  const { toast } = useToast()

  const exchangeRate = 1.0 // 1 USD = 1 VAULT (simplified)
  const minAmount = 10
  const maxAmount = 10000
  const processingFee = 2.5 // 2.5%

  const calculateVaultAmount = () => {
    const numAmount = Number.parseFloat(amount) || 0
    return numAmount * exchangeRate
  }

  const calculateFees = () => {
    const numAmount = Number.parseFloat(amount) || 0
    return (numAmount * processingFee) / 100
  }

  const calculateTotal = () => {
    const numAmount = Number.parseFloat(amount) || 0
    return numAmount + calculateFees()
  }

  const handlePurchase = async () => {
    const numAmount = Number.parseFloat(amount)

    if (!numAmount || numAmount < minAmount || numAmount > maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Please enter an amount between $${minAmount} and $${maxAmount}`,
        variant: "destructive",
      })
      return
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setPurchaseStep("processing")

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Generate mock transaction ID
      const mockTxId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setTransactionId(mockTxId)
      setPurchaseStep("success")

      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${calculateVaultAmount()} VAULT tokens`,
      })
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      })
      setPurchaseStep("input")
    } finally {
      setIsProcessing(false)
    }
  }

  const resetPurchase = () => {
    setPurchaseStep("input")
    setAmount("")
    setPaymentMethod("")
    setTransactionId("")
  }

  if (purchaseStep === "success") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Purchase Successful!</CardTitle>
            <CardDescription>
              Your VAULT tokens have been purchased and will be available in your wallet shortly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Amount Purchased:</span>
                  <div className="font-semibold">{calculateVaultAmount()} VAULT</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Paid:</span>
                  <div className="font-semibold">
                    ${calculateTotal().toFixed(2)} {currency}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Transaction ID:</span>
                  <div className="font-mono text-xs">{transactionId}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge className="bg-green-500">Completed</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>• Your VAULT tokens will appear in your wallet within 5-10 minutes</p>
              <p>• You will receive an email confirmation shortly</p>
              <p>• Transaction fees may apply from your payment provider</p>
            </div>

            <div className="flex space-x-4">
              <Button onClick={resetPurchase} variant="outline" className="flex-1 bg-transparent">
                Make Another Purchase
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (purchaseStep === "processing") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <CardTitle className="text-2xl">Processing Payment</CardTitle>
            <CardDescription>Please wait while we process your payment securely</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <div className="font-semibold">
                      ${amount} {currency}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">VAULT Tokens:</span>
                    <div className="font-semibold">{calculateVaultAmount()} VAULT</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Do not close this window. Processing typically takes 30-60 seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Buy VaultCoin</h2>
        <p className="text-gray-600">Purchase VaultCoin with fiat currency to start trading NFT shares</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Purchase Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Purchase Details
            </CardTitle>
            <CardDescription>Enter the amount you want to purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      USD - US Dollar
                    </div>
                  </SelectItem>
                  <SelectItem value="EUR">
                    <div className="flex items-center">
                      <Euro className="w-4 h-4 mr-2" />
                      EUR - Euro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder={`${minAmount}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={minAmount}
                  max={maxAmount}
                  step="0.01"
                  className="pl-8"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {currency === "USD" ? (
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Euro className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Minimum: ${minAmount} • Maximum: ${maxAmount}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="apple-pay">Apple Pay</SelectItem>
                  <SelectItem value="google-pay">Google Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="text-xs"
                  >
                    ${quickAmount}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
            <CardDescription>Review your purchase details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Purchase Amount:</span>
                <span className="font-semibold">
                  ${amount || "0.00"} {currency}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee ({processingFee}%):</span>
                <span className="font-semibold">
                  ${calculateFees().toFixed(2)} {currency}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="font-bold">
                  ${calculateTotal().toFixed(2)} {currency}
                </span>
              </div>

              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                <span className="text-blue-800 font-medium">You will receive:</span>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">{calculateVaultAmount()} VAULT</div>
                  <div className="text-xs text-blue-600">≈ ${calculateVaultAmount().toFixed(2)} USD</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Shield className="w-4 h-4" />
                <span>Secure payment processing</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Zap className="w-4 h-4" />
                <span>Instant token delivery</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-purple-600">
                <CheckCircle className="w-4 h-4" />
                <span>No hidden fees</span>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={isProcessing || !amount || !paymentMethod}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Purchase {calculateVaultAmount()} VAULT
                </>
              )}
            </Button>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-medium mb-1">Important Notice:</p>
                  <p>
                    This is a demo interface. No real payments will be processed. In production, this would integrate
                    with services like Transak or Ramp for actual fiat-to-crypto conversion.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Supported Payment Methods</CardTitle>
          <CardDescription>We support multiple payment options for your convenience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium">Credit Cards</div>
                <div className="text-xs text-gray-500">Visa, Mastercard, Amex</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium">Bank Transfer</div>
                <div className="text-xs text-gray-500">ACH, Wire Transfer</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-xs font-bold">
                A
              </div>
              <div>
                <div className="font-medium">Apple Pay</div>
                <div className="text-xs text-gray-500">iOS devices</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold">
                G
              </div>
              <div>
                <div className="font-medium">Google Pay</div>
                <div className="text-xs text-gray-500">Android devices</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
