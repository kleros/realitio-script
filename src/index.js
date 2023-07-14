const Web3 = require("web3");
const rc_question = require("@reality.eth/reality-eth-lib/formatters/question.js");
const _realitioProxy = require("./assets/realitio-proxy.json");
const _realitioContract = require("./assets/realitio.json");

const getMetaEvidence = async () => {
  const { arbitrableContractAddress, arbitrableJsonRpcUrl, arbitratorJsonRpcUrl, jsonRpcUrl, disputeID } = scriptParameters;
  console.debug(scriptParameters);
  const web3 = new Web3(arbitratorJsonRpcUrl || arbitrableJsonRpcUrl || jsonRpcUrl);
  const proxyContractInstance = new web3.eth.Contract(_realitioProxy.abi, arbitrableContractAddress);

  const disputeIDToQuestionIDLogs = await proxyContractInstance.methods.externalIDtoLocalID(disputeID).call();

  const questionID = web3.utils.toHex(disputeIDToQuestionIDLogs);
  const realityGraphGnosis = 'https://api.thegraph.com/subgraphs/name/realityeth/realityeth-gnosis';
  const queryQuestion = `{
    questions(first:5, where: {questionId: "${questionID}"}){
      data
      template{
        questionText
      }
    }
  }`

  const res = await fetch(realityGraphGnosis, {
    method: 'POST',
    body: JSON.stringify({
      query: queryQuestion
    })
  }).then(res => res.json())

  const templateText = res.data.questions[0].template.questionText;
  const questionData = rc_question.populatedJSONForTemplate(templateText, res.data.questions[0].data);

  switch (questionData.type) {
    case "bool":
      resolveScript({
        rulingOptions: {
          type: "single-select",
          titles: ["No", "Yes"],
          reserved: {
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF": "Answered Too Soon",
          },
        },
      });
    case "uint":
      resolveScript({
        rulingOptions: {
          type: "uint",
          precision: questionData["decimals"],
          reserved: {
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF": "Answered Too Soon",
          },
        },
      });
    case "single-select":
      resolveScript({
        rulingOptions: {
          type: "single-select",
          titles: questionData.outcomes,
          reserved: {
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF": "Answered Too Soon",
          },
        },
      });
    case "multiple-select":
      resolveScript({
        rulingOptions: {
          type: "multiple-select",
          titles: questionData.outcomes,
          reserved: {
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF": "Answered Too Soon",
          },
        },
      });
    case "datetime":
      resolveScript({
        rulingOptions: {
          type: "datetime",
          reserved: {
            "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF": "Answered Too Soon",
          },
        },
      });
    default:
      resolveScript({});
  }
};

module.exports = getMetaEvidence;
