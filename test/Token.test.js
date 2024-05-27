import { tokens, EVM_REVERT } from './helpers'
const Token = artifacts.require('./Token')



require('chai')
	.use(require('chai-as-promised'))
	.should()


contract ('Token', ([deployer,receiver,exchange]) => {
	const name = 'Daan Sikka'
	const symbol = 'Daan'
	const decimals = '18'
	const totalSupply = tokens(1000000).toString()
	let token

	beforeEach(async()=>{
		token = await Token.new()
	})

	describe('deployment',() =>{
		it('tracks the name',async() =>{
			const result = await token.name()
			result.should.equal(name)
			// Fetch token from blockchain
			// Read token name here..
			// The token name is 'My Name'
		})

		it('tracks the symbol',async() =>{
			const result = await token.symbol()
			result.should.equal(symbol)
		})

		it('tracks the decimals',async() =>{
			const result = await token.decimals()
			result.toString().should.equal(decimals)
		})

		it('tracks the totalSupply',async() =>{
			const result = await token.totalSupply()
			result.toString().should.equal(totalSupply)
		})

		it('assign the totalSupply to the deployer',async() =>{
			const result = await token.balanceOf(deployer)
			result.toString().should.equal(totalSupply)
		})


	describe('delegated token transfer',()=>{
			let amount
			let result 
			

		describe('success', async()=>{
				beforeEach(async()=>{
					amount = tokens(100)
					result = await token.transfer(receiver,amount,{from:deployer})
				})

				it('transfers token balances', async()=>{		
					let balanceOf;	
					balanceOf = await token.balanceOf(receiver)
					balanceOf.toString().should.equal(tokens(100).toString())
					balanceOf = await token.balanceOf(deployer)
					balanceOf.toString().should.equal(tokens(999900).toString())
				})

				it('emits a transfer event', async()=>{
					//console.log(result.logs)
					const log = result.logs[0]
					const event = log.args
					log.event.should.eq('Transfer')
					event.from.toString().should.equal(deployer,'from is correct')
					event.to.toString().should.equal(receiver,'to is correct')
					event.value.toString().should.equal(amount.toString(),'value is correct')
				})
		})



		describe('failure', async()=>{
		
				//console.log("rcvbal" + receiver.toString())
				it('rejects insufficient balances', async()=>{
					//let rcvbal = await token.balanceOf(receiver);
					//console.log("rcvbal" + rcvbal.toString())		
					let invalidAmount = tokens(100000000);	
					await token.transfer(receiver,invalidAmount,{from:deployer}).should.be.rejectedWith(EVM_REVERT)
				
					invalidAmount = tokens(10);	
					await token.transfer(deployer,invalidAmount,{from:receiver}).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects invalud recepeints', async ()=>{
					await token.transfer(0x0, amount,{from:deployer}).should.be.rejected
				})

			})

		})


	describe('approving token',() =>{
			let result
			let amount

			beforeEach(async() => {
				amount = tokens(100)
				result = await token.approve(exchange,amount,{from:deployer}) 
			})

			describe('success', ()=>{
				it('allocates an allowance for delegated token spending on exchange',async ()=>{
					const allowance = await token.allowance(deployer,exchange)
					allowance.toString().should.equal(amount.toString())
				})

				it('emits a transfer event', async()=>{
					//console.log(result.logs)
					const log = result.logs[0]
					const event = log.args
					log.event.should.eq('Approval')
					event.owner.toString().should.equal(deployer,'owner is correct')
					event.spender.toString().should.equal(exchange,'spender is correct')
					event.value.toString().should.equal(amount.toString(),'value is correct')
				})
			})

			describe('failure', ()=>{

				//console.log("rcvbal" + receiver.toString())
				it('rejects insufficient balances', async()=>{
					//let rcvbal = await token.balanceOf(receiver);
					//console.log("rcvbal" + rcvbal.toString())		
					let invalidAmount = tokens(100000000);	
					await token.approve(exchange,invalidAmount,{from:deployer}).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects invalud recepeints', async ()=>{
					await token.approve(0x0, amount,{from:deployer}).should.be.rejected
				})


			})

		})

			
	})


describe('sending tokens',()=>{
			let amount
			let result 


		beforeEach(async() =>{
			amount = tokens(100)
			await token.approve(exchange,amount,{from:deployer})
		})
			

		describe('success', async()=>{
				beforeEach(async()=>{
					amount = tokens(100)
					result = await token.transferFrom(deployer,receiver,amount,{from:exchange})
				})

				it('resets the allowance',async ()=>{
					const allowance = await token.allowance(deployer,exchange)
					allowance.toString().should.equal('0')
				})


				it('transfers token balances', async()=>{		
					let balanceOf;	
					balanceOf = await token.balanceOf(receiver)
					balanceOf.toString().should.equal(tokens(100).toString())
					balanceOf = await token.balanceOf(deployer)
					balanceOf.toString().should.equal(tokens(999900).toString())
				})

				it('emits a transfer event', async()=>{
					//console.log(result.logs)
					const log = result.logs[0]
					const event = log.args
					log.event.should.eq('Transfer')
					event.from.toString().should.equal(deployer,'from is correct')
					event.to.toString().should.equal(receiver,'to is correct')
					event.value.toString().should.equal(amount.toString(),'value is correct')
				})
		})



		describe('failure', async()=>{
		
				//console.log("rcvbal" + receiver.toString())
				it('rejects insufficient balances', async()=>{
					//let rcvbal = await token.balanceOf(receiver);
					//console.log("rcvbal" + rcvbal.toString())		
					let invalidAmount = tokens(100000000);	
					await token.transferFrom(deployer,receiver,invalidAmount,{from:exchange}).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects invalud recepeints', async ()=>{
					await token.transferFrom(deployer,0x0, amount,{from:exchange}).should.be.rejected
				})

			})

		})

})