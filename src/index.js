const Web3 = require('web3')
const rc_question = require('@realitio/realitio-lib/formatters/question.js');
const rc_template = require('@realitio/realitio-lib/formatters/template.js');
const _realitioProxy = require('../assets/realitio-proxy.json')
const _realitioContract = require('../assets/realitio.json')

// FILL THESE IN FOR THE NETWORK
const web3URI = 'https://mainnet.infura.io/v3/668b3268d5b241b5bab5c6cb886e4c61'
const realitioProxyContractAddress = '0x57adb6aa9edaa9abfd495b519d94d08f47321e26'
const realitioContractAddress = '0x325a2e0F3CCA2ddbaeBB4DfC38Df8D19ca165b47'
// Can add this for speed
const fromBlock = 6531265

const getMetaEvidence = async () => {
  const web3 = new Web3(web3URI)

  const proxyContractInstance = new web3.eth.Contract(
    _realitioProxy.abi,
    realitioProxyContractAddress
  )

  const realitioContractInstance = new web3.eth.Contract(
    _realitioContract.abi,
    realitioContractAddress
  )

  const realitioIDEventLog = await proxyContractInstance.getPastEvents(
    'DisputeIDToQuestionID',
    {
      filter: {
        _disputeID: scriptParameters.disputeID
      },
      fromBlock: fromBlock,
      toBlock: 'latest'
    }
  )
  const realitioID = realitioIDEventLog[0].returnValues._questionID

  const questionEventLog = await realitioContractInstance.getPastEvents(
    'LogNewQuestion',
    {
      filter: {
        question_id: realitioID
      },
      fromBlock: fromBlock,
      toBlock: 'latest'
    }
  )
  const templateID = questionEventLog[0].returnValues.template_id

  const templateEventLog = await realitioContractInstance.getPastEvents(
    'LogNewTemplate',
    {
      filter: {
        template_id: templateID
      },
      fromBlock: fromBlock,
      toBlock: 'latest'
    }
  )
  const templateText = templateEventLog[0].returnValues.question_text;
  const questionData = rc_question.populatedJSONForTemplate(templateText, questionEventLog[0].returnValues.question)

  switch (questionData.type) {
    case 'bool':
      resolveScript({
        rulingOptions: {
          type: 'single-select',
          titles: ["No", "Yes"]
        }
      })
    case 'uint':
      resolveScript({
        rulingOptions: {
          type: 'uint',
          precision: questionData["decimals"]
        }
      })
    case 'single-select':
      resolveScript({
        rulingOptions: {
          type: 'single-select',
          titles: questionData.outcomes
        }
      })
    case 'multiple-select':
      resolveScript({
        rulingOptions: {
          type: 'multiple-select',
          titles: questionData.outcomes
        }
      })
    case 'datetime':
      resolveScript({
        rulingOptions: {
          type: 'datetime'
        }
      })
    default:
      resolveScript({})
  }
}

module.exports = getMetaEvidence
