// Sky Fun Quiz final (quick HTML) - Web3 via ethers.js (Somnia Testnet, STT)
const CONTRACT_ADDRESS = "0xA1B4eD2906c48574cd79201C81FD917D9FB66f15";
const CONTRACT_ABI = [
  "function greeting() view returns (string)",
  "function setGreeting(string memory _greeting)"
];
const SOMNIA_CHAIN_ID_HEX = "0xC4D8"; // 50312
const SOMNIA_RPC = "https://dream-rpc.somnia.network";

// DOM
const connectBtn = document.getElementById('connect-btn');
const walletInfo = document.getElementById('wallet-info');
const quizCard = document.getElementById('quiz-card');
const startBtn = document.getElementById('start-btn');
const playerNameInput = document.getElementById('player-name');
const startScreen = document.getElementById('start-screen');
const qScreen = document.getElementById('question-screen');
const resultScreen = document.getElementById('result-screen');
const qTitle = document.getElementById('q-title');
const choicesList = document.getElementById('choices');
const nextBtn = document.getElementById('next-btn');
const timeLeftEl = document.getElementById('time-left');
const playerEl = document.getElementById('player');
const resultText = document.getElementById('result-text');
const txStatusEl = document.getElementById('tx-status');
const saveScoreBtn = document.getElementById('save-score-btn');
const sendOnchainBtn = document.getElementById('send-onchain');
const playAgainBtn = document.getElementById('play-again-btn');
const leaderboardEl = document.getElementById('leaderboard');
const clearLbBtn = document.getElementById('clear-leaderboard');
const exportCsvBtn = document.getElementById('export-csv');

let connectedAddress = null;

// Basic quiz data
const QUESTIONS = [
  {q: "What color is the sky on a clear day?", choices:["Blue","Green","Red","Purple"], a:0},
  {q: "Which animal barks?", choices:["Cat","Dog","Cow","Sheep"], a:1},
  {q: "2 + 3 = ?", choices:["3","4","5","6"], a:2},
  {q: "Which planet do we live on?", choices:["Mars","Venus","Earth","Jupiter"], a:2},
  {q: "What do you call frozen water?", choices:["Steam","Ice","Vapor","Cloud"], a:1}
];

let currentIndex = 0;
let timeLeft = 60;
let timerInterval = null;
let score = 0;

// --- Web3 helpers ---
async function ensureSomniaNetwork() {
  if (!window.ethereum) throw new Error("MetaMask tidak ditemukan.");
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId === SOMNIA_CHAIN_ID_HEX) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SOMNIA_CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    if (switchError.code === 4902 or (switchError.message and switchError.message.includes("Unrecognized chain ID"))) {
      try:
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SOMNIA_CHAIN_ID_HEX,
            chainName: "Somnia Testnet (Shannon)",
            nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
            rpcUrls: [SOMNIA_RPC],
            blockExplorerUrls: ["https://explorer.somnia.network"]
          }]
        });
      } catch (addError) {
        throw new Error("Gagal menambahkan jaringan Somnia: " + addError.message);
      }
    } else {
      throw switchError;
    }
  }
}

async function connectWallet() {
  if (!window.ethereum) return alert("MetaMask tidak ditemukan. Silakan install MetaMask.");
  try {
    await ensureSomniaNetwork();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    connectedAddress = accounts[0];
    walletInfo.innerText = "Terkoneksi: " + connectedAddress;
    connectBtn.innerText = "✅ Terhubung";
    // enable quiz
    quizCard.classList.remove('disabled');
    startBtn.disabled = false;
    return connectedAddress;
  } catch (e) {
    alert("Gagal connect: " + (e.message || e));
    console.error(e);
  }
}

// send result to contract
async function sendResultToContractString(resultString, onStatus) {
  if (!window.ethereum) throw new Error("MetaMask tidak ditemukan.");
  onStatus && onStatus("Memeriksa jaringan...");
  await ensureSomniaNetwork();
  onStatus && onStatus("Menghubungkan wallet...");
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  if (accounts.length === 0) await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  try {
    onStatus && onStatus("Mengirim transaksi... konfirmasi di MetaMask");
    const tx = await contract.setGreeting(resultString, { gasLimit: 300000 });
    onStatus && onStatus("Transaksi terkirim. Menunggu konfirmasi...");
    await tx.wait();
    onStatus && onStatus("Transaksi terkonfirmasi.");
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error(err);
    onStatus && onStatus("Transaksi gagal: " + (err.message || err));
    return { success: false, error: err };
  }
}

// --- Quiz logic ---
def startTimer():
  pass
