import { useEffect } from "react";
import { useMoralis } from "react-moralis";

const ManualHeader = () => {
  let {
    enableWeb3,
    account,
    isWeb3Enabled,
    Moralis,
    deactivateWeb3,
    isWeb3EnableLoading,
  } = useMoralis();

  useEffect(() => {
    // This window "if" doesn't seem to be necessary here
    if (isWeb3Enabled || typeof window === undefined) return;
    if (localStorage.getItem("connected") === "injected") {
      enableWeb3(); // ** Why do we not have to "await" here?
    }
  }, [isWeb3Enabled]);

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      console.log(`Account changed to ${account}`);
      if (account === null) {
        localStorage.removeItem("connected");
        deactivateWeb3(); // Changes "isWeb3Enabled" to "false"
        console.log("null accounts found");
      }
    });
  }, []);

  return (
    <div>
      {account ? (
        <div>
          Connected to {account.slice(0, 6)}...
          {account.slice(account.length - 4)}
        </div>
      ) : (
        <button
          onClick={async () => {
            await enableWeb3();
            // This window "if" doesn't seem to be necessary here
            if (typeof window !== undefined) {
              localStorage.setItem("connected", "injected");
            }
          }}
          disabled={isWeb3EnableLoading}
        >
          Connect
        </button>
      )}
    </div>
  );
};

export default ManualHeader;
