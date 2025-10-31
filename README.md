# Art-Verify

**Blockchain-powered digital artwork protection platform on Hedera Hashgraph.**  

Art-Verify is a decentralized platform that provides immutable proof of ownership and authenticity for digital artists and creators.  
The platform leverages **Hedera Hashgraph** for secure and fast transactions, **Docker** for containerized deployment, and **IPFS** for decentralized storage of digital artwork.  

Our mission is to empower artists by protecting their creations and enabling transparent proof of provenance.

---

## Project Title & Track
**Project Title:** Art-Verify  
**Track:** Hedera Hackathon / Gaming & NFT Track  

---

## Team & Certifications

- **Mayar Qutishat:** [GitHub](https://github.com/Mayarqutishat) | [Hedera Certification](https://drive.google.com/file/d/1VOPUcXhGRAt6iAm32vsNAGfnFFKbWyVr/view?usp=drive_link)  
- **Haneen Khdour:** [GitHub](https://github.com/Haninkhdour963) | [Hedera Certification](https://drive.google.com/file/d/1nx3XtxFGJ15ftcv7vpKoP2yjgh8pf-CW/view?usp=drive_link)  

**Business Model Canvas:** [Link](https://www.canva.com/design/DAG25ab42SI/JO6yqBEDkVZ04QDdLsiTkQ/edit)  
**Pitch Deck:** [Link](https://prezi.com/p/edit/ch8cbapyzvo_/)  
**Demo:** [Link](https://share.descript.com/view/h70CL4qIxSO)  

**Frontend URL (local):** http://localhost:3000/marketplace  
**Backend API URL (local):** http://localhost:5000/swagger/index.html  
**Hedera Wallet:** [Testnet Account](https://hashscan.io/testnet/account/copyYourAccout)  

---

## Features

- ✅ Immutable proof of ownership for digital artwork  
- ✅ Fast and secure transactions using Hedera Hashgraph  
- ✅ Decentralized storage with IPFS  
- ✅ Dockerized for easy deployment and integration  
- ✅ Transparent provenance for creators and buyers  

---

## Technology Stack

- **Backend / Smart Contracts:** Hedera Hashgraph  
- **Storage:** IPFS (InterPlanetary File System)  
- **Deployment:** Docker & Docker Compose  
- **Programming Languages:** Solidity / JavaScript / C# (adjust according to your project)  

---

## Hedera Integration Summary

**Hedera Smart Contracts**: Used for minting and managing digital artwork ownership tokens. Ensures immutable tracking of ownership on the ledger.  

**Hedera Tokens (HTS)**: Represent unique digital artwork as NFT-like tokens. Chosen for low-fee, high-throughput token management.  

**Hedera Consensus Service (HCS) (optional)**: Logs critical ownership events immutably. The $0.0001 predictable fee guarantees cost stability while supporting high-frequency transactions.  

**Transaction Types Executed:**  
- Smart Contract Call (mint token, transfer ownership)  
- Token Create, Mint, and Transfer  
- Consensus Message Submit (optional logging)

**Economic Justification:**  
Hedera provides low, predictable fees and ABFT finality. High throughput ensures the platform scales with user adoption. Low cost encourages artists to mint digital proofs without financial barriers.

---

## Deployment & Setup Instructions

### Prerequisites

- Docker installed ([Docker](https://www.docker.com/get-started))  
- Docker Compose installed ([Compose](https://docs.docker.com/compose/install/))  
- Git installed  
- Node.js installed (for frontend)  
- Hedera Testnet account with Operator ID & Key  

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Haninkhdour963/Art-Verify.git
cd Art-Verify

## 2. Copy example environment configuration:
cp .env.example .env

## 3. Fill .env with your Hedera Testnet credentials & IPFS config.

## 4. Start Docker containers:
docker-compose up --build

## 5. Access the frontend: http://localhost:3000/marketplace

## 6. Access the backend API: http://localhost:5000/swagger/index.html

## Expected Local Running State:

-- **Frontend React App on port 3000

-- **Backend Node.js API on port 5000

-- **Hedera Testnet interaction via configured Operator ID/Key

## Architecture Diagram

[Frontend React App] --> [Backend API / Node.js] --> [Hedera Hashgraph Network]
       |                                         |
       |                                         v
       |                                    [IPFS Storage]
       v
[User Wallet (Testnet)]

-- **Flow: Users upload artwork → stored on IPFS → backend calls Hedera Smart Contract to mint ownership token → frontend displays proof of ownership.

## Deployed Hedera IDs (Testnet)

-- **Smart Contract ID: 0.0.123456

-- **Token ID: 0.0.654321
(Replace with your deployed IDs on Testnet)

## Security & Secrets

-- **Never commit private keys or sensitive credentials.

-- **Use .env for all secrets and .env.example for example structure.

-- **Ensure Docker containers do not expose sensitive ports publicly.

-- **.env.example:
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
IPFS_PROJECT_ID=YourIPFSProjectID
IPFS_PROJECT_SECRET=YourIPFSProjectSecret


## Code Quality & Auditability

-- **Clear function names and consistent styling

-- **Inline comments for complex logic

-- **Linter used (ESLint/Prettier)

-- **Standardized commit history for auditability

