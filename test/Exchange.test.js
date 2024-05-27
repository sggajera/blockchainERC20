import { tokens, EVM_REVERT, ETHER_ADDRESS, ether } from './helpers'
const Exchange = artifacts.require('./Exchange')
const Token = artifacts.require('./Token')


require('chai')
	.use(require('chai-as-promised'))
	.should()


contract ('Exchange', ([deployer,feeAccount, user1, user2]) => {

			let token
			let exchange
			const feePercent = 10

			beforeEach(async()=>{
				token = await Token.new()
				token.transfer(user1,tokens(100),{from:deployer})
				exchange = await Exchange.new(feeAccount,feePercent)
			})



			describe('deployment',async ()=>{
				it('Tracks the fee account', async()=>{
					const result = await exchange.feeAccount()
					result.should.equal(feeAccount)
				})

				it('Tracks the fee percent', async()=>{
					const result = await exchange.feePercent()
					result.toString().should.equal(feePercent.toString())
				})
			})


			describe('fallback',()=>{
				it('reverts when Ether is sent', async() =>{
					await exchange.sendTransaction({value:1, from: user1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('deposite Ether',async()=>{
				let result
				let amount

				beforeEach(async() => {
					amount = ether(1)
					result = await exchange.depositEther({from: user1, value: amount})
				})

				it('tracks the Ether deposite', async () =>{
					const balance = await exchange.tokens(ETHER_ADDRESS, user1)
					balance.toString().should.equal(amount.toString())
				})


				it('emits a Deposite event', async()=>{
					const log = result.logs[0]
					log.event.should.equal('Deposite')
					const event = log.args
					event.token.should.equal(ETHER_ADDRESS,'Ether address is correct')
					event.user.should.equal(user1,'user address is correct')
					event.amount.toString().should.equal(amount.toString(),'amount is correct')
					event.balance.toString().should.equal(amount.toString(),'balance is correct')
				})

			})


			describe('Withdraw Ether',async ()=>{
				let result
				let amount

				beforeEach(async() => {
					amount = ether(1)
					result = await exchange.depositEther({from: user1, value: amount})
				})


				describe('success', async() =>{
					beforeEach(async () => {
						result = await exchange.withdrawEther(ether(1), {from: user1})
				})
				
				it('Withdraw Ether Funds', async () =>{
					const balance = await exchange.tokens(ETHER_ADDRESS, user1)
					balance.toString().should.equal('0')
				})


				it('Emmits Withdraw event', async()=>{
					const log = result.logs[0]
					log.event.should.equal('Withdraw')
					const event = log.args
					event.token.should.equal(ETHER_ADDRESS,'Ether address is correct')
					event.user.should.equal(user1,'user address is correct')
					event.amount.toString().should.equal(amount.toString(),'amount is correct')
					event.balance.toString().should.equal('0','balance is correct') 
				})
			})

				describe('failure', async () => {
					it('rejects withdraws for insufficient balance', async() => {
						await exchange.withdrawEther(ether(100),{from:user1}).should.be.rejectedWith(EVM_REVERT)
					})
				})
		})


			describe('depositing tokens',()=>{
				let result
				let amount

				describe('success',()=>{

					beforeEach(async()=>{
					amount = tokens(10)
					await token.approve(exchange.address,tokens(10), {from:user1} )
				    result = await exchange.depositeToken(token.address, tokens(10), {from: user1})
					})

					it('tracks the token deposite', async() => {
						//Check exchange token balance
						let balance
						
						balance = await token.balanceOf(exchange.address)
						balance.toString().should.equal(amount.toString())
						balance = await exchange.tokens(token.address,user1)
						balance.toString().should.equal(amount.toString())
					})


					it('emits a Deposite event', async()=>{
						const log = result.logs[0]
						log.event.should.equal('Deposite')
						const event = log.args
						event.token.should.equal(token.address,'token address is correct')
						event.user.should.equal(user1,'user address is correct')
						event.amount.toString().should.equal(amount.toString(),'amount is correct')
						event.balance.toString().should.equal(amount.toString(),'balance is correct')
					})

				})

				describe('failure',()=>{

					it('rejects ether deposites', async() => {
						await exchange.depositeToken(ETHER_ADDRESS,tokens(10), {from:user1}).should.be.rejectedWith(EVM_REVERT)
					})

					it('fails when no tokens are apporved', async()=>{
						result = await exchange.depositeToken(token.address, tokens(10), {from: user1}).should.be.rejectedWith(EVM_REVERT)
					})

				})

			})


			describe('Withdrawing tokens',async() =>{
				let result
				let amount


				describe('success',async()=>{
					beforeEach(async() => {
						amount = tokens(10)
						await token.approve(exchange.address, amount, {from:user1})
						await exchange.depositeToken(token.address,amount,{from: user1})

						result = await exchange.withdrawToken(token.address,amount,{from: user1})
					})


					it('Withdraw token funds', async() => {
						const balance = await exchange.tokens(token.address, user1)
						balance.toString().should.equal('0')
					})

					it('Emmits Withdraw event', async()=>{
							const log = result.logs[0]
							log.event.should.equal('Withdraw')
							const event = log.args
							event.token.should.equal(token.address,'token address is correct')
							event.user.should.equal(user1,'user address is correct')
							event.amount.toString().should.equal(amount.toString(),'amount is correct')
							event.balance.toString().should.equal('0','balance is correct') 
					})


				describe('failure', async () => {


					it('rejects ether withdraws', async() => {
						await exchange.withdrawToken(ETHER_ADDRESS,tokens(100),{from:user1}).should.be.rejectedWith(EVM_REVERT)
					})

					it('rejects withdraws for insufficient token  balance', async() => {
						await exchange.withdrawToken(token.address, tokens(100),{from:user1}).should.be.rejectedWith(EVM_REVERT)
					})
				})
		})
	})

				describe('checking balances', () =>{
					beforeEach(async()=> {
						await exchange.depositEther({from:user1, value:ether(1)})
					})

					it('returns user balance', async() => {
						const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
						console.log(result.toString())
						result.toString().should.equal(ether(1).toString())
					})

				})

				describe('making order',() => {

					let amountGet = tokens(1)
					let amountGive = ether(1)
					let result 

					beforeEach(async() => {
						result = await exchange.makeOrder(token.address,amountGet,ETHER_ADDRESS,amountGive,{from:user1})
					})

					it('tracks newly creates order', async() =>{
						const orderCount = await exchange.orderCount()
						orderCount.toString().should.equal('1')
						const order = await exchange.orders('1')
						order.id.toString().should.equal('1')
						order.user.should.equal(user1,'user is correct')
						order.tokenGet.should.equal(token.address,'tokenGet is correct')
						order.amountGet.toString().should.equal(amountGet.toString(),'amount get is correct')
						order.tokenGive.should.equal(ETHER_ADDRESS,'token give is correct')
						order.amountGive.toString().should.equal(amountGive.toString(),'amount give is correct')
						order.timestamp.toString().length.should.be.at.least(1,'timestamp is present')
					})

					it('Emmits Order event', async()=>{
						const log = result.logs[0]
						log.event.should.equal('Order')
						const event = log.args
						event.id.toString().should.equal('1','token address is correct')
						event.user.should.equal(user1,'user address is correct')
						event.tokenGet.should.equal(token.address,'amount is correct')
						event.amountGet.toString().should.equal(amountGet.toString(),'amountGet is correct') 
						event.tokenGive.should.equal(ETHER_ADDRESS,'token give is correct')
						event.amountGive.toString().should.equal(amountGive.toString(),'amountGive is correct')							
						event.timestamp.toString().length.should.be.at.least(1,'timestamp is present')
					})
				})


				describe('order actions', async() => {
					let amountGet = tokens(1)
					let amountGive = ether(1)
					let etherAmount = ether(1)
						beforeEach(async() => {
							//User 1 deposites either only
							await exchange.depositEther({from:user1,value:etherAmount})
							//Give tokens to user2
							await token.transfer(user2, tokens(100), {from: deployer})
							//user2 deposits tokens only
							await token.approve(exchange.address, tokens(2),{from: user2})
							await exchange.depositeToken(token.address, tokens(2), {from: user2})
							//user1 makes an order to buy tokens with Ether
							await exchange.makeOrder(token.address, amountGet,ETHER_ADDRESS,amountGive,{from: user1})
						})


						describe('filling orders',async() => {
							let result

							describe('success', async()=>{
								beforeEach(async()=>{
									result = await exchange.fillOrder('1',{from:user2})
								})

								it('executes the trade and charges fees', async()=>{
									let balance
									balance = await exchange.balanceOf(token.address, user1)
									balance.toString().should.equal(tokens(1).toString(),'user1 received tokens')
									balance = await exchange.balanceOf(ETHER_ADDRESS,user2)
									balance.toString().should.equal(ether(1).toString(),'user2 received Either')
									balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
									balance.toString().should.equal('0','use Ether dedcuted with fee applied')
									balance = await exchange.balanceOf(token.address, user2)
									balance.toString().should.equal(tokens(0.9).toString(),'user2 token deducted with fee applied')
									const feeAccount = await exchange.feeAccount()
									balance = await exchange.balanceOf(token.address, feeAccount)
									balance.toString().should.equal(tokens(0.1).toString(),'feeAccount received fee')
								})

								it('updates filled orders',async()=> {
									const orderFilled = await exchange.orderFilled(1)
									orderFilled.should.equal(true)
								})

								it('emits a Trade event', async()=>{
									const log = result.logs[0]
									log.event.should.eq('Trade')
									const event = log.args
									event.id.toString().should.equal('1','id is correct')
									event.user.should.equal(user1,'user is correct')
									event.tokenGet.should.equal(token.address,'tokenGet is correct')
									event.amountGet.toString().should.equal(tokens(1).toString(),'amountGet is correct')
									event.tokenGive.should.equal(ETHER_ADDRESS,'tokenGive is correct')
									event.userFill.should.equal(user2,'userFill is correct')
									event.timestamp.toString().length.should.be.at.least(1,'timestamp is present')
								})

							})

								describe('failure', async()=>{
									it('rejects invalid order ids', async()=> {
										const invalidOrderId = 99999
										await exchange.fillOrder(invalidOrderId,{from: user2}).should.be.rejectedWith(EVM_REVERT)
									})

									it('rejects already-filled orders', async()=>{
										//fill the order
										await exchange.fillOrder('1',{from:user2}).should.be.fulfilled
										//try to fill it again
										await exchange.fillOrder('1',{from:user2}).should.be.rejectedWith(EVM_REVERT)
									})

									it('rejects cancelled orders', async()=>{
										//cancel the order
										await exchange.cancelOrder('1',{from:user1}).should.be.fulfilled
										//try to fill the order
										await exchange.fillOrder('1',{from:user2}).should.be.rejectedWith(EVM_REVERT)
									})
								})
							

						})


						describe('cancelling orders', async()=>{
							let result

							describe('success',async()=> {

								beforeEach(async()=>{
									result = await exchange.cancelOrder('1',{from:user1})
								})

								it('updates cancelled orders', async()=>{
									const orderCancelled = await exchange.orderCancelled(1)
									orderCancelled.should.equal(true)
								})

								it('Emmits Order event', async()=>{
									const log = result.logs[0]
									log.event.should.equal('Cancel')
									const event = log.args
									event.id.toString().should.equal('1','token address is correct')
									event.user.should.equal(user1,'user address is correct')
									event.tokenGet.should.equal(token.address,'amount is correct')
									event.amountGet.toString().should.equal(amountGet.toString(),'amountGet is correct') 
									event.tokenGive.should.equal(ETHER_ADDRESS,'token give is correct')
									event.amountGive.toString().should.equal(amountGive.toString(),'amountGive is correct')
									event.timestamp.toString().length.should.be.at.least(1,'timestamp is present')
								})

							})

					})


					describe('failure', async()=>{

						})
				})



})


	// event Order (
	// 	uint266 id,
	// 	address user, // Address of user
	// 	address tokenGet, // Token user wants to purchase
	// 	uint256 amountGet, // Amount of token user wants to get
	// 	address tokenGive, // Token used for trade
	// 	uint256 amountGive, // Amount of token for trade 
	// 	uint256 timestamp // Timestamp of order creation
	// )