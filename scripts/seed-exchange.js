const Token = artifacts.require("Token")
const Exchange = artifacts.require("Exchange")

//Utils
const ETHER_ADDRESS ='0x0000000000000000000000000000000000000000'
const ether = (n) => {
	return new web3.utils.BN(
		web3.utils.toWei(n.toString(),'ether')
	)
}

const tokens = (n) =>ether(n)

const wait = (seconds) => {
	const milliseconds = seconds * 1000
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}
//SANKET
module.exports = async function(callback){

	try{
		//Fetch accounts from wallet = these are unlocked
		console.log('Script running...')

		const accounts = await web3.eth.getAccounts()

		//Fetch the deployed token
		const token = await Token.deployed()
		console.log('Token fetched', token.address)

		//Fetch the deployed exchange
		const exchange = await Exchange.deployed()
		console.log('Exchange fetched', exchange.address)

		//Give tokens to account[1]
		const account1 = accounts[0]
		const account2 = accounts[1]
		let amount = web3.utils.toWei('10000','ether') //10,000 tokens

		await token.transfer(account2, amount, {from: account1})
		console.log(`Transferred ${amount} tokens from ${account1} to ${account2}`)
	
		const user1 = accounts[0]
		const user2 = accounts[1]

		//User 1 Deposites Ether
		amount = 1
		await exchange.depositEther({from:user1,value:ether(amount)})
		console.log(`Deposited ${amount} Ether from ${user1}`)

		amount = 10000
		//User 2 Approves Tokens
		await token.approve(exchange.address, tokens(amount),{from:user2})
		console.log(`Approved ${amount} tokens from ${user2}`)

		//User2 deposites Tokens
		await exchange.depositeToken(token.address, tokens(amount), {from:user2})
		console.log(`Deposited ${amount} tokens from ${user2}`)

		/////////////////////////////////////////////////////////
		// Seed a cancelled order

		//user 1 makes order to get order

		let result
		let orderId
		result = await exchange.makeOrder(token.address, tokens(100), ETHER_ADDRESS,ether(0.1),{from:user1})
		console.log(`Made order from ${user1}`)

		//User 1 cancells order
		orderId = result.logs[0].args.id
		await exchange.cancelOrder(orderId,{from:user1})
		console.log(`Cancelled order from ${user1}`)


		///////////////////////////////////////////////
		// Seed filled orders

		//User 1 makes order
		result = await exchange.makeOrder(token.address,tokens(100),ETHER_ADDRESS, ether(0.1), {from: user1})
		console.log(`Made order from ${user1}`)

		//User 2 fills order
		orderId = result.logs[0].args.id
		await exchange.fillOrder(orderId,{from:user2})
		console.log(`Filled order from ${user1}`)

		//Wait 1 second
		await wait(1)

		//User 1 makes another order
		result = await exchange.makeOrder(token.address,tokens(50),ETHER_ADDRESS,ether(0.01),{from: user1})
		console.log(`Made order from ${user1}`)

		//User 2 fills another order
		orderId = result.logs[0].args.id
		await exchange.fillOrder(orderId,{from: user2})
		console.log(`Filled order from ${user1}`)

		//Wait 1 second
		await wait(1)

		result = await exchange.makeOrder(token.address, tokens(200), ETHER_ADDRESS, ether(0.15),{from: user1})
		console.log(`Made order from ${user1}`)

		//user 2 fills final order
		orderId = result.logs[0].args.id
		await exchange.fillOrder(orderId, {from: user2})
		console.log(`Filled order from ${user1}`)

		//Wait 1 second	
		await wait(1)

		for(let i =1;i<=10;i++){
			result = await exchange.makeOrder(token.address, tokens(10 * i), ETHER_ADDRESS,ether(0.01),{from: user1})
			console.log(`Made order from ${user1}`)
			// Wait 1 second
			await wait(1)
		}			

		for(let i = 1; i<=10; i++){
			result = await exchange.makeOrder(ETHER_ADDRESS, ether(0.01), token.address, tokens(10 * i), {from: user2})
			console.log(`Made order from ${user2}`)
			//Wait 1 second
			await wait(1)
		}
	} catch(err){
		console.log(err)
	}
	
	callback()
}