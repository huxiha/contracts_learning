import { ConnectButton } from "@web3uikit/web3";

const Header = () => {
  return (
    <div className="flex items-center justify-between px-8 py-4 border-b">
      <h1 className="text-lg">Welcome to Lottery</h1>
      <div>{<ConnectButton moralisAuth={false} />}</div>
    </div>
  );
};

export default Header;
