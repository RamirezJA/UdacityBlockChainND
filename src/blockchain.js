/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require('crypto-js/sha256')
const BlockClass = require('./block.js')
const bitcoinMessage = require('bitcoinjs-message')

class Blockchain {
  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.chain = []
    this.height = -1
    this.initializeChain()
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  async initializeChain() {
    if (this.height === -1) {
      let block = new BlockClass.Block({ data: 'Genesis Block' })
      await this._addBlock(block)
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  getChainHeight() {
    return new Promise((resolve, reject) => {
      resolve(this.height)
    })
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to
   * create the `block hash` and push the block into the chain array. Don't for get
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention
   * that this method is a private method.
   */
  _addBlock(block) {
    let self = this
    return new Promise(async (resolve, reject) => {
      //check  Chain Height
      let chainHeight = await self.getChainHeight()
      // set Height
      block.height = chainHeight + 1
      // Set Timestamp
      block.time = new Date().getTime().toString().slice(0, -3)
      //Check if its the genesis Block
      if (self.height == -1) {
        block.previousBlockHash = null
      } else {
        //set previous Block Hash
        block.previousBlockHash = self.chain[block.height - 1].hash
      }

      // Set Block Hash for Current Block
      block.hash = SHA256(JSON.stringify(block)).toString()

      // validate the chain before any addition
      let validateArray = await self.validateChain()
      // check the length to ensure no errors
      if (validateArray.length !== 0) {
        resolve({
          message: 'Blockchain is invalid',
          error: validateArray,
          status: false,
        })
        console.log('the number of errors is ', validateArray)
      }
      //Push Block into Chain
      self.chain.push(block)
      //update Block Height to show changes made
      self.height += 1
      //Resolve the new block
      resolve(block)
    })
    // SEEMS FINISHED
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  requestMessageOwnershipVerification(address) {
    return new Promise((resolve) => {
      //Create messeage
      var newMessage = `${address}:${new Date()
        .getTime()
        .toString()
        .slice(0, -3)}:starRegistry`
      resolve(newMessage)
    })
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  submitStar(address, message, signature, star) {
    let self = this
    return new Promise(async (resolve, reject) => {
      // Get time from the message sent as a parameter
      let messageTime = parseInt(message.split(':')[1])
      // Get current time
      let currentTime = parseInt(new Date().getTime().toString().slice(0, -3))
      // created constant to be the 5 minute limit
      const timeLimit = 5 * 60
      //Check if time is less than 5 minutes between message and current time
      if (currentTime - messageTime > timeLimit) {
        //If greater than 5 minutes reject
        reject(new Error('Time elapsed is greater than 5 minutes'))
      }
      // Create Variable to set verifiedMessage to false before verifyng message with bitcoinmessage
      var verifiedMessage = false
      // Verify the message with wallet address and signature if not verified throw error
      try {
        verifiedMessage = bitcoinMessage.verify(message, address, signature)
      } catch (error) {
        Error(error)
      }
      // Create the Block
      const starBlock = new BlockClass.Block({
        address: address,
        message: message,
        signature: signature,
        star: star,
      })
      // check if not verifiedmessage, reject startBlock if not message
      if (!verifiedMessage) {
        reject(starBlock)
        return
      }
      // Add  the starBlock to the chain
      await this._addBlock(starBlock)
      // Resolve with the block added
      resolve(starBlock)
    })
    // Finished Looks Good
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash
   */
  getBlockByHash(hash) {
    let self = this
    return new Promise((resolve, reject) => {
      // Create a filteredBlock variable to Search on the chain array for the block that has the hash
      let filteredBlock = self.chain.filter((value) => value.hash === hash)[0]
      // If it does resolve the block
      if (filteredBlock) {
        resolve(filteredBlock)
      } else {
        resolve(null)
      }
    })
    //Looks finished
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  getBlockByHeight(height) {
    let self = this
    return new Promise((resolve, reject) => {
      let block = self.chain.filter((p) => p.height === height)[0]
      if (block) {
        resolve(block)
      } else {
        resolve(null)
      }
    })
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address
   */
  getStarsByWalletAddress(address) {
    let self = this
    let stars = []
    return new Promise((resolve, reject) => {
      // Method derived from: https://knowledge.udacity.com/questions/282668
      self.chain.forEach(async (block) => {
        let data = await block.getBData()
        if (data.address === address) stars.push(data)
      })
      //Resolve stars by wallet address
      resolve(stars)
    })
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  validateChain() {
    let self = this

    let errorLog = []

    return new Promise(async (resolve, reject) => {
      // use a loop to check the blocks

      for (let i = 0; i < this.chain.length; i++) {
        //create the current block
        const currentBlock = this.chain[i]
        // Check if valid
        if (!(await currentBlock.validate())) {
          errorLog.push({
            error: 'Failed Validation Process',
            block: currentBlock,
          })
        }

        // avoid the genesis block
        // derieved code from https://knowledge.udacity.com/questions/614073
        if (i === 0) continue

        // compare the currentBlock vs previousBlock

        const previousBlock = this.chain[i - 1]

        if (currentBlock.previousBlockHash !== previousBlock.hash) {
          errorLog.push({
            error: 'Previous block hash does not match',
            block: currentBlock,
          })
        }
      }
      // Resolve with errors
      resolve(errorLog)
    })
  }
}

module.exports.Blockchain = Blockchain
