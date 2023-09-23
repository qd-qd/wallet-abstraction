// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.19;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract PolaroidNFT is ERC721, Ownable {
    uint256 public lastTokenId = 0;
    mapping(uint256 => bytes) public metadata;

    constructor() ERC721("Polaroid", "PLRD") { }

    function mint(bytes calldata ipfs) external returns (uint256 tokenId) {
        lastTokenId++;
        _safeMint(msg.sender, lastTokenId);
        metadata[lastTokenId] = ipfs;
        return lastTokenId;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        return string(abi.encodePacked("ipfs://", metadata[tokenId]));
    }
}
