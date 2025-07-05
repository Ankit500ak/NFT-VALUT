"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/contexts/web3-context"
import { getVaultCoinContract, getNFTVaultContract } from "@/lib/contracts"
import { uploadToIPFS, uploadMetadataToIPFS, getIPFSUrl } from "@/lib/ipfs"
import { ethers } from "ethers"
import { Upload, Loader2, CheckCircle, AlertCircle, X, Share, Coins, Sparkles, FileImage } from "lucide-react"

interface NFTMinterProps {
  onSuccess?: (tokenId: number) => void
  onClose?: () => void
}

interface MintingStep {
  id: string
  title: string
  description: string
  status: "pending" | "active" | "completed" | "error"
}

export default function NFTMinter({ onSuccess, onClose }: NFTMinterProps) {
  const { signer, account, isConnected } = useWeb3()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalShares: 1000,
    sharesToList: 300,
    pricePerShare: "0.01",
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [isMinting, setIsMinting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const [steps, setSteps] = useState<MintingStep[]>([
    {
      id: "validate",
      title: "Validate Form",
      description: "Checking form data and file",
      status: "pending",
    },
    {
      id: "upload-image",
      title: "Upload Image",
      description: "Uploading image to IPFS",
      status: "pending",
    },
    {
      id: "upload-metadata",
      title: "Create Metadata",
      description: "Generating NFT metadata",
      status: "pending",
    },
    {
      id: "mint-nft",
      title: "Mint NFT",
      description: "Creating NFT and vault tokens",
      status: "pending",
    },
    {
      id: "complete",
      title: "Complete",
      description: "NFT successfully created",
      status: "pending",
    },
  ])

  const updateStepStatus = (stepId: string, status: MintingStep["status"]) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)))
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((file) => file.type.startsWith("image/"))

    if (imageFile) {
      setSelectedFile(imageFile)
      const url = URL.createObjectURL(imageFile)
      setPreviewUrl(url)
    }
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your NFT",
        variant: "destructive",
      })
      return false
    }

    if (!formData.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description",
        variant: "destructive",
      })
      return false
    }

    if (!selectedFile) {
      toast({
        title: "Image Required",
        description: "Please select an image file",
        variant: "destructive",
      })
      return false
    }

    if (formData.totalShares < 1 || formData.totalShares > 10000) {
      toast({
        title: "Invalid Shares",
        description: "Total shares must be between 1 and 10,000",
        variant: "destructive",
      })
      return false
    }

    if (formData.sharesToList < 0 || formData.sharesToList > formData.totalShares) {
      toast({
        title: "Invalid Listing",
        description: "Shares to list cannot exceed total shares",
        variant: "destructive",
      })
      return false
    }

    const price = Number.parseFloat(formData.pricePerShare)
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Price per share must be greater than 0",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const mintNFT = async () => {
    console.log('Minting process started...')
    if (!isConnected || !signer || !account) {
      const errorMsg = `Wallet not connected. Connected: ${isConnected}, Account: ${account}, Signer: ${signer}`
      console.error(errorMsg)
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    setIsMinting(true)
    setCurrentStep(0)

    try {
      // Step 1: Validate
      updateStepStatus("validate", "active")
      console.log("[Step 1] Validating form data and file...")
      if (!validateForm()) {
        updateStepStatus("validate", "error")
        return
      }
      updateStepStatus("validate", "completed")
      setCurrentStep(1)

      // Step 2: Upload image
      updateStepStatus("upload-image", "active")
      console.log("[Step 2] Uploading image to IPFS...", selectedFile)
      const imageHash = await uploadToIPFS(selectedFile!)
      console.log("[Step 2] Image uploaded to IPFS. Hash:", imageHash)
      updateStepStatus("upload-image", "completed")
      setCurrentStep(2)

      // Step 3: Create and upload metadata
      updateStepStatus("upload-metadata", "active")
      const metadata = {
        name: formData.title,
        description: formData.description,
        image: getIPFSUrl(imageHash),
        attributes: [
          {
            trait_type: "Total Shares",
            value: formData.totalShares,
          },
          {
            trait_type: "Shares Listed",
            value: formData.sharesToList,
          },
          {
            trait_type: "Price Per Share",
            value: `${formData.pricePerShare} ETH`,
          },
          {
            trait_type: "Creator",
            value: account,
          },
        ],
        external_url: "https://nftvaultchain.com",
        created_at: new Date().toISOString(),
      }
      console.log("[Step 3] Metadata to upload:", metadata)
      const metadataHash = await uploadMetadataToIPFS(metadata)
      console.log("[Step 3] Metadata uploaded to IPFS. Hash:", metadataHash)
      const tokenURI = getIPFSUrl(metadataHash)
      updateStepStatus("upload-metadata", "completed")
      setCurrentStep(3)

      // Step 4: Approve VaultCoin if needed
      updateStepStatus("mint-nft", "active")
      const nftVault = getNFTVaultContract(signer)
      const nftVaultAddress = process.env.NEXT_PUBLIC_NFT_VAULT_ADDRESS!
      const mintingFee = await nftVault.mintingFee()
      const vaultCoin = getVaultCoinContract(signer)
      const allowance = await vaultCoin.allowance(account, nftVaultAddress)
      console.log(`[Step 4] Current VaultCoin allowance: ${allowance}, Minting fee: ${mintingFee}`)
      if (allowance < mintingFee) {
        toast({
          title: "Approval Needed",
          description: `Approving ${Number(mintingFee) / 1e18} VAULT for minting...`,
        })
        console.log(`[Step 4] Approving VaultCoin for NFTVault: ${nftVaultAddress}, amount: ${mintingFee}`)
        const approveTx = await vaultCoin.approve(nftVaultAddress, mintingFee)
        console.log("[Step 4] Waiting for approval transaction to confirm...", approveTx.hash)
        await approveTx.wait()
        toast({
          title: "Approval Confirmed",
          description: `You have approved ${Number(mintingFee) / 1e18} VAULT for minting.`,
        })
        console.log("[Step 4] Approval confirmed.")
      } else {
        console.log("[Step 4] Sufficient allowance, no approval needed.")
      }

      // Step 5: Mint NFT (call NFTVault contract directly)
      console.log("[Step 5] Calling mintNFT on NFTVault contract with params:", {
        metadataHash,
        title: formData.title,
        description: formData.description,
        royalty: 0,
        totalShares: formData.totalShares,
        sharesToList: formData.sharesToList,
        pricePerShare: ethers.parseEther(formData.pricePerShare),
      })
      const tx = await nftVault.mintNFT(
        metadataHash,
        formData.title,
        formData.description,
        0,
        formData.totalShares,
        formData.sharesToList,
        ethers.parseEther(formData.pricePerShare),
        {
          gasLimit: 1000000
        }
      )
      console.log("[Step 5] Mint transaction sent. Hash:", tx.hash)
      const receipt = await tx.wait()
      console.log("[Step 5] Mint transaction confirmed. Receipt:", receipt)

      // Extract token ID from events
      let tokenId = 1
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = nftVault.interface.parseLog({
              topics: log.topics,
              data: log.data,
            })
            console.log("[Step 5] Parsed log:", parsedLog)
            if (parsedLog && parsedLog.name === "NFTMinted") {
              tokenId = Number(parsedLog.args.tokenId)
              console.log(`[Step 5] NFTMinted event found. Token ID: ${tokenId}`)
              break
            }
          } catch (error) {
            // Ignore parsing errors
          }
        }
      } else {
        console.warn("[Step 5] No logs found in transaction receipt.")
      }

      updateStepStatus("mint-nft", "completed")
      setCurrentStep(4)
      updateStepStatus("complete", "completed")

      toast({
        title: "NFT Minted Successfully!",
        description: `Your NFT has been created with Token ID: ${tokenId}`,
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        totalShares: 1000,
        sharesToList: 300,
        pricePerShare: "0.01",
      })
      setSelectedFile(null)
      setPreviewUrl("")

      if (onSuccess) {
        onSuccess(tokenId)
      }

      // After minting, update VaultCoin balance in dashboard/profile if needed
      // ... existing code ...
    } catch (error: any) {
      console.error("Minting error:", error)

      const currentStepId = steps[currentStep]?.id
      if (currentStepId) {
        updateStepStatus(currentStepId, "error")
      }

      let errorMessage = "An unexpected error occurred"
      if (error.code === 4001) {
        errorMessage = "Transaction was rejected by user"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction"
      } else if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      totalShares: 1000,
      sharesToList: 300,
      pricePerShare: "0.01",
    })
    setSelectedFile(null)
    setPreviewUrl("")
    setSteps((prev) => prev.map((step) => ({ ...step, status: "pending" as const })))
    setCurrentStep(0)
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl("")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Create Fractional NFT</h2>
        <p className="text-gray-400">Mint an NFT and automatically create vault tokens for fractional ownership</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <FileImage className="w-5 h-5 mr-2" />
              Upload Artwork
            </CardTitle>
            <CardDescription className="text-gray-400">
              Select an image file for your NFT (PNG, JPG, GIF - Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile()
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="mt-4 text-sm text-gray-400">
                    <p className="font-medium">{selectedFile?.name}</p>
                    <p>{selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-gray-400" />
                  <div>
                    <p className="text-white font-medium">Drop your image here</p>
                    <p className="text-gray-400 text-sm">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </CardContent>
        </Card>

        {/* Form Section */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Sparkles className="w-5 h-5 mr-2" />
              NFT Details
            </CardTitle>
            <CardDescription className="text-gray-400">Configure your NFT properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter NFT title"
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">
                Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your NFT"
                rows={4}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-4">
              <h4 className="text-white font-medium flex items-center">
                <Share className="w-4 h-4 mr-2" />
                Fractional Ownership
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalShares" className="text-white">
                    Total Shares
                  </Label>
                  <Input
                    id="totalShares"
                    type="number"
                    min="1"
                    max="10000"
                    value={formData.totalShares}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, totalShares: Number.parseInt(e.target.value) || 1 }))
                    }
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sharesToList" className="text-white">
                    Shares to List
                  </Label>
                  <Input
                    id="sharesToList"
                    type="number"
                    min="0"
                    max={formData.totalShares}
                    value={formData.sharesToList}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sharesToList: Number.parseInt(e.target.value) || 0 }))
                    }
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerShare" className="text-white">
                  Price per Share (ETH)
                </Label>
                <Input
                  id="pricePerShare"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={formData.pricePerShare}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pricePerShare: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              <Alert className="border-blue-500/20 bg-blue-500/10">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  You'll keep {formData.totalShares - formData.sharesToList} shares (
                  {(((formData.totalShares - formData.sharesToList) / formData.totalShares) * 100).toFixed(1)}%
                  ownership)
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Coins className="w-5 h-5 mr-2" />
            Minting Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="text-white font-medium">Ownership Distribution</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Your shares:</span>
                  <Badge variant="secondary">{formData.totalShares - formData.sharesToList}</Badge>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Listed for sale:</span>
                  <Badge variant="secondary">{formData.sharesToList}</Badge>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Your ownership:</span>
                  <Badge variant="outline" className="text-green-400 border-green-400/20">
                    {(((formData.totalShares - formData.sharesToList) / formData.totalShares) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium">Revenue Potential</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Total listing value:</span>
                  <span>
                    {(formData.sharesToList * Number.parseFloat(formData.pricePerShare || "0")).toFixed(4)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Per share price:</span>
                  <span>{formData.pricePerShare} ETH</span>
                </div>
                <div className="flex justify-between text-green-400 font-medium">
                  <span>Potential earnings:</span>
                  <span>
                    {(formData.sharesToList * Number.parseFloat(formData.pricePerShare || "0")).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-white font-medium">Transaction Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Network:</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400/20">
                    Sepolia
                  </Badge>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Est. gas fee:</span>
                  <span>~0.005 ETH</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Creator:</span>
                  <span>
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minting Progress */}
      {isMinting && (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Minting in Progress
            </CardTitle>
            <CardDescription className="text-gray-400">
              Please wait while your NFT and vault tokens are being created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {step.status === "completed" && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {step.status === "active" && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                    {step.status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
                    {step.status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-gray-600" />}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        step.status === "completed"
                          ? "text-green-400"
                          : step.status === "active"
                            ? "text-blue-400"
                            : step.status === "error"
                              ? "text-red-400"
                              : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={resetForm}
          disabled={isMinting}
          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
        >
          Reset Form
        </Button>

        <div className="flex space-x-4">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isMinting}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Cancel
            </Button>
          )}

          <Button
            onClick={mintNFT}
            disabled={isMinting || !formData.title || !formData.description || !selectedFile || !isConnected}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            size="lg"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Minting NFT...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Mint Fractional NFT
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
