import Nav from "@/components/Nav";
import Header from "@/components/Header";
import LotteryEntrance from "@/components/LotteryEntrance";
import Head from "next/head";

export default function Home() {
  return (
    <div className={`min-h-screen`}>
      <Head>
        <title>Lottery</title>
      </Head>
      {/* <Nav /> */}
      <Header />
      <LotteryEntrance />
    </div>
  );
}
