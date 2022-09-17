import Head from "next/head";
import Header from "../components/Header";
import ManualHeader from "../components/ManualHeader";
import LotteryEntrance from "../components/LotteryEntrance";
import User from "../components/User";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Smart Contract Raffle</title>
        <meta name="description" content="Our Smart Contract Lottery" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <Header /> */}
      <ManualHeader />
      <LotteryEntrance />
      <User name="Johny Doe" />
    </div>
  );
}
