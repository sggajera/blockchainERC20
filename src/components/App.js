import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';
import Token from '../abis/Token.json';
import {loadWeb3,loadAccount,loadToken,loadExchange} from '../store/interactions'
import {connect} from "react-redux"
import {accountSelector} from '../store/selectors'
import Navbar from './Navbar'
import Content from './Content'
import {contractsLoadedSelector} from '../store/selectors'



class App extends Component {
  UNSAFE_componentWillMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

async loadBlockchainData(dispatch) {
    const web3 = loadWeb3(dispatch)
    await web3.eth.net.getNetworkType()
    const networkId = await web3.eth.net.getId()
    const accounts = await loadAccount(web3, dispatch)
    const token = await loadToken(web3,networkId,dispatch)
    if(!token){
      window.alert('Token smart contract not detected on the current network. Please select another network within Metamask')
      return
    }

    const exchange = await loadExchange(web3,networkId,dispatch)

    if(!exchange){
      window.alert('Exchange smart contract not dtected on the current network. Please select another network within Metamask')
      return
    }
 }
  render() {
    console.log("account address" + this.props.account)
    return (
        <div>
          <Navbar/>
          {this.props.contractsLoaded ? <Content/> : <div className = "content"></div>}
        </div>
    );
  }
}



function mapStateToProps(state) {
  console.log("contractLoaded",contractsLoadedSelector(state))
  return{
    account: accountSelector(state),
    contractsLoaded: contractsLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(App);



