//SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft__outOfChance();
error RandomIpfsNft__needMoreMintFee();
error RandomIpfsNft__transferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    VRFCoordinatorV2Interface private immutable i_COORDINATORADDRESS;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_s_subscriptionId;
    uint16 private immutable i_requestConfirmations;
    uint32 private immutable i_callbackGasLimit;
    uint32 private immutable i_numWords;
    mapping(uint256 => address) s_requestIdTohMinter;
    uint256 private s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_tokenUris;
    uint256 internal immutable i_mintFee;

    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    constructor(
        address _coordinatorAddress,
        bytes32 _keyHash,
        uint64 _s_subscriptionId,
        uint16 _requestConfirmations,
        uint32 _callbackGasLimit,
        uint32 _numWords,
        string[3] memory _tokenUris,
        uint256 _mintFee
    )
        VRFConsumerBaseV2(_coordinatorAddress)
        ERC721("RandomeNFT", "RANDOM_DOG")
    {
        i_COORDINATORADDRESS = VRFCoordinatorV2Interface(_coordinatorAddress);
        i_s_subscriptionId = _s_subscriptionId;
        i_keyHash = _keyHash;
        i_requestConfirmations = _requestConfirmations;
        i_callbackGasLimit = _callbackGasLimit;
        i_numWords = _numWords;
        s_tokenCounter = 0;
        s_tokenUris = _tokenUris;
        i_mintFee = _mintFee;
    }

    //通过chainlink VRF产生随机数，需要request一个随机数，然后fulfillRandom
    function requestNft() external payable returns (uint256 requestId) {
        //mint NFT需要支付一定的金额
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__needMoreMintFee();
        }
        requestId = i_COORDINATORADDRESS.requestRandomWords(
            i_keyHash,
            i_s_subscriptionId,
            i_requestConfirmations,
            i_callbackGasLimit,
            i_numWords
        );
        s_requestIdTohMinter[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        address dogNFTOwner = s_requestIdTohMinter[_requestId];
        uint256 newTokenId = s_tokenCounter;
        s_tokenCounter += 1;
        uint256 rng = _randomWords[0] % MAX_CHANCE_VALUE;
        Breed dogBreed = getBreedFromRng(rng);
        _safeMint(dogNFTOwner, newTokenId);
        _setTokenURI(newTokenId, s_tokenUris[uint256(dogBreed)]);

        emit NftMinted(dogBreed, dogNFTOwner);
    }

    function getBreedFromRng(uint256 rng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (rng >= cumulativeSum && rng < chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNft__outOfChance();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__transferFailed();
        }
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getTokenUri(
        uint256 tokenUriIndex
    ) public view returns (string memory) {
        return s_tokenUris[tokenUriIndex];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
