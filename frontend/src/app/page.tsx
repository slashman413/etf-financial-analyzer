"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace("/mobile"); }, [router]);
  return <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh",
    background:"#13243b", color:"#fff", fontSize:14 }}>
    載入手機版…
  </div>;
}
