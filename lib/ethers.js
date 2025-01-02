const { ethers } = require('ethers');

// Replace with your provider (e.g., Infura, Alchemy, or local node)
const provider = new ethers.JsonRpcProvider('https://bsc-testnet-rpc.publicnode.com');

// Replace with your contract's ABI
const contractABI = [
  'function transfer(address to, uint256 value)',
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

async function DecodeTx(_tx, _contractAddress) {
  try {
    // Fetch the transaction details
    const tx = await provider.getTransaction(_tx);
    const iface = new ethers.Interface(contractABI);
    const decodedData = iface.parseTransaction({ data: tx.data, value: tx.value });
    const contract = new ethers.Contract(_contractAddress, contractABI, provider);
    const decimals = await contract.decimals();
    const amountRaw = decodedData.args.value; // This is the raw amount
    const destinationAddress = decodedData.args.to; // Address to which tokens are sent
    const amountFormatted = ethers.formatUnits(amountRaw, decimals);
    let datatx = {
      fixAMount: parseInt(amountFormatted),
      SenderTx: tx.from,
      contractTx: tx.to,
      destinationTx: destinationAddress
    };
    return datatx;
  } catch (error) {
    return false;
    console.error('Error decoding transaction:', error);
  }
}

module.exports = { DecodeTx };
