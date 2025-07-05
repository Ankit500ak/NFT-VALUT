const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT

export async function uploadToIPFS(file: File): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured")
  }

  const formData = new FormData()
  formData.append("file", file)

  const pinataMetadata = JSON.stringify({
    name: `NFT-${Date.now()}-${file.name}`,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      fileType: file.type,
      fileSize: file.size.toString(),
    },
  })
  formData.append("pinataMetadata", pinataMetadata)

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  })
  formData.append("pinataOptions", pinataOptions)

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })
    let data: any = null
    try {
      data = await response.clone().json()
    } catch (parseError) {
      // Try to extract IpfsHash from text if possible
      const text = await response.clone().text()
      const match = text.match(/Qm[1-9A-HJ-NP-Za-km-z]{44}/)
      if (match) {
        return match[0]
      }
    }

    if (data && data.IpfsHash) {
      return data.IpfsHash
    }

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${JSON.stringify(data) || response.statusText}`)
    }

    throw new Error(`Pinata upload succeeded but response missing IpfsHash: ${JSON.stringify(data)}`)
  } catch (error) {
    console.error("IPFS upload error:", error)
    throw error
  }
}

export async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("Pinata JWT not configured")
  }

  const pinataMetadata = {
    name: `NFT-Metadata-${Date.now()}`,
    keyvalues: {
      uploadedAt: new Date().toISOString(),
      type: "metadata",
    },
  }

  const pinataOptions = {
    cidVersion: 0,
  }

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata,
        pinataOptions,
      }),
    })
    let data: any = null
    try {
      data = await response.clone().json()
    } catch (parseError) {
      // Try to extract IpfsHash from text if possible
      const text = await response.clone().text()
      const match = text.match(/Qm[1-9A-HJ-NP-Za-km-z]{44}/)
      if (match) {
        return match[0]
      }
    }

    if (data && data.IpfsHash) {
      return data.IpfsHash
    }

    if (!response.ok) {
      throw new Error(`Pinata metadata upload failed: ${JSON.stringify(data) || response.statusText}`)
    }

    throw new Error(`Pinata metadata upload succeeded but response missing IpfsHash: ${JSON.stringify(data)}`)
  } catch (error) {
    console.error("IPFS metadata upload error:", error)
    throw error
  }
}

export function getIPFSUrl(hashOrUrl: string): string {
  if (!hashOrUrl) return "";
  if (hashOrUrl.startsWith("ipfs://")) {
    return hashOrUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  if (hashOrUrl.startsWith("https://") || hashOrUrl.startsWith("http://")) {
    return hashOrUrl;
  }
  // Assume it's a raw hash
  return `https://ipfs.io/ipfs/${hashOrUrl}`;
}

export async function fetchFromIPFS(hash: string): Promise<any> {
  try {
    const url = getIPFSUrl(hash)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await response.json()
    } else {
      return await response.text()
    }
  } catch (error) {
    console.error("IPFS fetch error:", error)
    throw error
  }
}
