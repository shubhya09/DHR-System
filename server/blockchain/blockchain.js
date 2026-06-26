import CryptoJS from 'crypto-js';
import Block from '../models/Block.js';

class Blockchain {
  static async generateHash(index, timestamp, data, previousHash) {
    return CryptoJS.SHA256(index + timestamp + JSON.stringify(data) + previousHash).toString();
  }

  static async getLatestBlock() {
    return await Block.findOne().sort({ index: -1 });
  }

  static async addBlock(data) {
    const latestBlock = await this.getLatestBlock();
    const index = latestBlock ? latestBlock.index + 1 : 0;
    const previousHash = latestBlock ? latestBlock.hash : "0";
    const timestamp = new Date().toISOString();
    const hash = await this.generateHash(index, timestamp, data, previousHash);

    const newBlock = new Block({
      index,
      timestamp,
      data,
      previousHash,
      hash
    });

    await newBlock.save();
    return hash;
  }

  static async verifyIntegrity(data, storedHash) {
    // In a real blockchain, we'd traverse the chain. 
    // Here we just check if a block with this data and hash exists.
    const block = await Block.findOne({ hash: storedHash });
    if (!block) return false;
    
    // Verify the data in the block matches the provided data
    // (Simplified: in reality, we'd hash the data and compare)
    return JSON.stringify(block.data) === JSON.stringify(data);
  }
}

export default Blockchain;
