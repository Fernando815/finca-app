import { Suspense } from "react";
import CultivosClient from "./CultivosClient";

export default function Page() {
  return (
    <Suspense>
      <CultivosClient />
    </Suspense>
  );
}