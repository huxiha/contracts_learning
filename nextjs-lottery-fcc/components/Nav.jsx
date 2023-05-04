import { useEffect } from "react";
import { useMoralis } from "react-moralis";

const Nav = () => {
  const {
    enableWeb3,
    account,
    isWeb3Enabled,
    Moralis,
    deactivateWeb3,
    isWeb3EnableLoading,
  } = useMoralis();

  useEffect(() => {
    if (
      !isWeb3Enabled &&
      typeof window !== "undefined" &&
      window.localStorage.getItem("connected")
    ) {
      enableWeb3();
    }
  }, [isWeb3Enabled]);

  useEffect(() => {
    Moralis.onAccountChanged((newAccount) => {
      console.log(`Account changed to ${newAccount}`);
      if (newAccount == null) {
        window.localStorage.removeItem("connected");
        deactivateWeb3();
        console.log("Null Account found");
      }
    });
  }, []);

  return (
    <div className="px-8 py-6 flex justify-between items-center">
      <div>
        <p>Welcome to Lottery</p>
      </div>
      {account ? (
        <div>Connected to {account}</div>
      ) : (
        <button
          className="bg-gray-200 px-2 py-1 rounded-md"
          onClick={async () => {
            await enableWeb3();
            if (typeof window !== "undefined") {
              window.localStorage.setItem("connected", "injected");
            }
          }}
          // disable={isWeb3EnableLoading}
        >
          Connect to your wallet
        </button>
      )}
    </div>
  );
};

export default Nav;
