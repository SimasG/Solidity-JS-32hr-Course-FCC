// ** Fix "any" later
export const networkConfig: any = {
  goerli: {
    ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    blockConfirmations: 4,
  },
  polygon: {
    ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    blockConfirmations: 4,
  },
};

export const developmentChains = ["hardhat", "localhost"];
