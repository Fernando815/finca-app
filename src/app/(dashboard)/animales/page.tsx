import { Suspense } from "react";
import AnimalesClient from "./AnimalesClient";

export default function Page() {
  return (
    <Suspense>
      <AnimalesClient />
    </Suspense>
  );
}