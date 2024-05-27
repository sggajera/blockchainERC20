pragma solidity ^0.5.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Token.sol";

contract Exchange {
	//Variables
	using SafeMath for uint;

	address public feeAccount; //Account that receives exchange fees.
	uint256 public feePercent;
	address constant ETHER = address(0); //store ether in mapping with blank mapping
	mapping(address => mapping(address => uint256)) public tokens;
	mapping(uint256 => _Order) public orders;
	uint256 public orderCount;
	mapping(uint256 => bool) public orderCancelled;
	mapping(uint256 => bool) public orderFilled;
	

	//Event
	event Deposite(
		address token,
		address user,
		uint256 amount, 
		uint256 balance
	);
	event Withdraw(
		address token, 
		address user, 
		uint256 amount, 
		uint256 balance
	);
	event Order (
		uint256 id,
		address user, // Address of user
		address tokenGet, // Token user wants to purchase
		uint256 amountGet, // Amount of token user wants to get
		address tokenGive, // Token used for trade
		uint256 amountGive, // Amount of token for trade 
		uint256 timestamp // Timestamp of order creation
	);


	event Cancel (
		uint256 id,
		address user, // Address of user
		address tokenGet, // Token user wants to purchase
		uint256 amountGet, // Amount of token user wants to get
		address tokenGive, // Token used for trade
		uint256 amountGive, // Amount of token for trade 
		uint256 timestamp // Timestamp of order creation
	);


	event Trade (
		uint256 id,
		address user, // Address of user
		address tokenGet, // Token user wants to purchase
		uint256 amountGet, // Amount of token user wants to get
		address tokenGive, // Token used for trade
		uint256 amountGive, // Amount of token for trade
		address userFill, 
		uint256 timestamp // Timestamp of order creation
	);



	//Structure
	struct _Order {
		uint256 id;
		address user; // Address of user
		address tokenGet; // Token user wants to purchase
		uint256 amountGet; // Amount of token user wants to get
		address tokenGive; // Token used for trade
		uint256 amountGive; // Amount of token for trade 
		uint256 timestamp; // Timestamp of order creation
	}


	//model order
	//store order
	//add the order to storage


	constructor(address _feeAccount, uint256 _feePercent) public {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	}


	function() external{
		revert();
	}

	function depositEther() payable public {	
		tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
		emit Deposite(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
	}

	function withdrawEther(uint _amount) public {
		require(tokens[ETHER][msg.sender] >= _amount);
		tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
		msg.sender.transfer(_amount);
		emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
	}

	function depositeToken(address _token,uint256 _amount) public {
		// Which Token?
		require( _token != ETHER);
		require(Token(_token).transferFrom(msg.sender,address(this),_amount));
		// How much?
		tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
		emit Deposite(_token, msg.sender, _amount, tokens[_token][msg.sender]);

		// Manage deposite
		// Send tokens to this contract
		// Manage deposite - update balance
		// Emit event
	}

	function withdrawToken(address _token, uint256 _amount) public {
		require(_token != ETHER);
		require(tokens[_token][msg.sender] >= _amount);
		tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
		require(Token(_token).transfer(msg.sender,_amount));
		emit Withdraw(_token, msg.sender,_amount, tokens[_token][msg.sender]);
	}


	function balanceOf(address _token, address _user) public view returns (uint256) {
		return tokens[_token][_user];
	}


	function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive ) public {
		orderCount = orderCount.add(1);
		orders[orderCount] = _Order(orderCount,msg.sender,_tokenGet,_amountGet,_tokenGive,_amountGive,now);
		emit Order(orderCount,msg.sender,_tokenGet,_amountGet,_tokenGive,_amountGive,now);
	}

	function cancelOrder(uint256 _id) public {
		_Order storage  _order = orders[_id];
		//Must be "my" order
		require(_order.user == msg.sender);
		//Must be a valid order
	    require(_order.id == _id);
		orderCancelled[_id] = true;
		emit Cancel(_id,_order.user,_order.tokenGet,_order.amountGet,_order.tokenGive,_order.amountGive,now);
	} 


	function fillOrder(uint256 _id) public{
		require(_id>= 0 && _id <=orderCount);
		require(!orderFilled[_id]);
		require(!orderCancelled[_id]);

		_Order storage  _order = orders[_id];
		_trade(_order.id,_order.user,_order.tokenGet,_order.amountGet,_order.tokenGive,_order.amountGive);
		orderFilled[_order.id] = true;
		//fetch order
		//execute trade
		//charge fees
		//mark order as filled
		//emit a trade event
	}


	function _trade(uint256 _orderId, address _user, address _tokenGet,uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal{ 
		//charge fees
		uint256 _feeAmount = _amountGive.mul(feePercent).div(100);


		//execute trade
		tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
		tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
		tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);
		tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
		tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGet);

		//mark order as filled
		emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive,_amountGive,msg.sender,now);

}
}



	// struct _Order {
	// 	uint id;
	// 	address user; // Address of user
	// 	address tokenGet; // Token user wants to purchase
	// 	uint amountGet; // Amount of token user wants to get
	// 	address tokenGive; // Token used for trade
	// 	uint amountGive; // Amount of token for trade 
	// 	uint timestamp; // Timestamp of order creation
	// }


//Deposite and withdraw funds.
//Manage Orders - Make or Cancel
//Handle Trades - Charge fees

//TODO:
//[x] Set the fee account
//[x] Deposite Ether
//[x] Withdraw Ether
//[x] Deposite tokens
//[x] Withdraw tokens
//[x] Check balances
//[x] Make order
//[] Cancel order
//[] Fill order
//[] Charge fees