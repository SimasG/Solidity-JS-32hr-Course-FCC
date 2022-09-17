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
    console.log("isWeb3Enabled:", isWeb3Enabled);
    if (isWeb3Enabled || typeof window === undefined) return;
    if (localStorage.getItem("connected") === "injected") {
      console.log("enableWeb3() in useEffect ran");
      // No need for "await" because we already know that we're connected on the backend. Just need to change "isWeb3Enabled" to true
      // for it to reflect on the frontend
      enableWeb3();
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
        <div className="flex gap-2">
          <p>
            Connected to {account.slice(0, 6)}...
            {account.slice(account.length - 4)}
          </p>
          <button
            onClick={() => {
              deactivateWeb3();
              localStorage.removeItem("connected");
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={async () => {
            // "ret" -> wallet/provider object we connected to
            const ret = await enableWeb3(); // ** Why is it called "ret"?
            if (typeof ret !== undefined) {
              console.log("ret is not undefined");
              // This window "if" doesn't seem to be necessary here
              if (typeof window !== undefined) {
                console.log("window is not undefined");
                localStorage.setItem("connected", "injected");
              }
            }
          }}
          disabled={isWeb3EnableLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
        >
          Connect
        </button>
      )}
    </div>
  );
};

export default ManualHeader;
