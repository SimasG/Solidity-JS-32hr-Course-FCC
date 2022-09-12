import { MoralisProvider } from "react-moralis";

function MyApp({ Component, pageProps }) {
  return (
    // "initializeOnMount" is the optionality to hook into a server to add more features to our website
    // Don't understand what it really does
    <MoralisProvider initializeOnMount={false}>
      <Component {...pageProps} />
    </MoralisProvider>
  );
}

export default MyApp;
