import { ConnectButton } from "web3uikit";

const Header = () => {
  return (
    <div className="p-5 flex justify-between items-center border-b-2">
      <h1 className="p-4 font-bold text-3xl">Decentralized Lottery</h1>
      <div className="ml-auto py-2 px-4">
        <ConnectButton moralisAuth={true} />
      </div>
    </div>
  );
};

export default Header;
